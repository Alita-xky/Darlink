import os
from fastapi import APIRouter, BackgroundTasks
from openai import AsyncOpenAI
import crud
import httpx
from schemas import StartChatReq, ChatMessageReq, SelfChatStartReq
import embeddings
import distillation

router = APIRouter()


@router.post('/chat/start')
async def chat_start(req: StartChatReq):
    sid = crud.create_session(req.user_token, req.persona_id)
    if not sid:
        return {'ok': False, 'reason': 'auth_required'}
    return {'ok': True, 'session_id': sid}


@router.post('/chat/self/start')
async def chat_self_start(req: SelfChatStartReq):
    """开始和自己的数字分身对话（需要先有蒸馏画像）"""
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {'ok': False, 'reason': 'auth_required'}

    # 检查是否有蒸馏画像
    traits = distillation.get_user_distillation(user.id)
    if not traits:
        return {'ok': False, 'reason': 'not_distilled_yet', 'message': '还没有足够的聊天记录生成你的数字分身，多和AI人物聊聊吧'}

    sid = crud.create_self_session(req.user_token)
    if not sid:
        return {'ok': False, 'reason': 'auth_required'}
    return {'ok': True, 'session_id': sid}


@router.post('/chat/message')
async def chat_message(req: ChatMessageReq, background_tasks: BackgroundTasks):
    s = crud.get_session(req.session_id)
    if not s:
        return {'ok': False, 'reason': 'bad_session'}

    try:
        crud.add_message(req.session_id, s.user_id, 'user', req.text)
    except Exception:
        pass

    # 自聊模式：直接调 DeepSeek，用蒸馏画像做 system prompt
    if s.skill_name == 'self_avatar':
        reply_text = await _self_avatar_reply(s.user_id, req.text)
    else:
        # 普通人物聊天：走 model_service
        sims = embeddings.search_similar(req.text, topk=2)
        context_texts = [p.profile_text for _, p in sims if getattr(p, 'profile_text', None)]
        context_blob = "\n".join(context_texts)

        payload = {
            'text': req.text,
            'context': context_blob,
            'persona_id': s.persona_id,
        }
        async with httpx.AsyncClient() as client:
            try:
                r = await client.post('http://127.0.0.1:8001/respond', json=payload, timeout=15)
                resp = r.json()
            except Exception:
                resp = {'ok': False, 'reply': '模型服务不可用'}
        reply_text = resp.get('reply', '')

    try:
        crud.add_message(req.session_id, None, 'bot', reply_text)
    except Exception:
        pass

    # 后台检查是否需要自动蒸馏
    if s.user_id:
        background_tasks.add_task(maybe_distill, s.user_id)

    return {'ok': True, 'reply': reply_text}


async def _self_avatar_reply(user_id: int, text: str) -> str:
    """用蒸馏画像生成数字分身的回复"""
    system_prompt = distillation.build_self_avatar_prompt(user_id)
    if not system_prompt:
        return '你的数字分身还没准备好，多聊聊天让我更了解你吧'

    client = AsyncOpenAI(
        api_key=os.getenv('OPENAI_API_KEY'),
        base_url=os.getenv('OPENAI_BASE_URL'),
    )
    try:
        response = await client.chat.completions.create(
            model=os.getenv('OPENAI_MODEL', 'deepseek-chat'),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.8,
            max_tokens=350,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[数字分身] 调用失败: {e}")
        return '数字分身暂时不在线，稍后再试'


async def maybe_distill(user_id: int):
    """检查消息数量，满足条件则后台蒸馏（不阻塞聊天）"""
    msg_count = distillation.get_user_message_count(user_id)
    if msg_count < 10 or msg_count % 10 != 0:
        return
    print(f"[自动蒸馏] user_id={user_id}, msg_count={msg_count}")
    await distillation.distill_user(user_id)


@router.get('/chat/history/{session_id}')
async def chat_history(session_id: str):
    msgs = crud.get_messages(session_id)
    if msgs is None:
        return {'ok': False, 'reason': 'not_found'}
    return {'ok': True, 'messages': [{'role': m.role, 'text': m.text, 'created_at': m.created_at.isoformat()} for m in msgs]}
