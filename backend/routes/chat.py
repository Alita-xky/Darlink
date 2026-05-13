from fastapi import APIRouter
import crud
import httpx
from schemas import StartChatReq, ChatMessageReq
import embeddings
import distillation
import asyncio

router = APIRouter()


@router.post('/chat/start')
async def chat_start(req: StartChatReq):
    sid = crud.create_session(req.user_token, req.persona_id)
    if not sid:
        return {'ok': False, 'reason': 'auth_required'}
    return {'ok': True, 'session_id': sid}


@router.post('/chat/message')
async def chat_message(req: ChatMessageReq):
    s = crud.get_session(req.session_id)
    if not s:
        return {'ok': False, 'reason': 'bad_session'}

    try:
        crud.add_message(req.session_id, s.user_id, 'user', req.text)
    except Exception:
        pass

    # 搜索相似用户画像作为上下文
    sims = embeddings.search_similar(req.text, topk=2)
    context_texts = [p.profile_text for _, p in sims if getattr(p, 'profile_text', None)]
    context_blob = "\n".join(context_texts)

    payload = {
        'text': req.text,
        'context': context_blob,
        'persona_id': s.persona_id,
    }
    # 如果当前用户已有蒸馏结果，传给模型服务以实现个性化
    try:
        traits = distillation.get_user_distillation(s.user_id)
    except Exception:
        traits = None

    # 检查是否达到触发蒸馏的条件（>=5 条用户消息）
    distill_triggered = False
    try:
        msg_count = distillation.get_user_message_count(s.user_id)
        if msg_count >= 5 and not traits:
            # 尝试同步执行蒸馏（有超时），以便本条消息能使用蒸馏结果
            try:
                result = await asyncio.wait_for(distillation.distill_user(s.user_id), timeout=25)
                # distill_user 返回 dict 或包含错误的 dict
                if isinstance(result, dict) and not result.get('error'):
                    traits = result
                    distill_triggered = False
                else:
                    # 如果解析或调用失败，退回到异步触发
                    try:
                        asyncio.create_task(distillation.distill_user(s.user_id))
                        distill_triggered = True
                    except Exception:
                        distill_triggered = False
            except asyncio.TimeoutError:
                # 超时则异步触发并告知前端
                try:
                    asyncio.create_task(distillation.distill_user(s.user_id))
                    distill_triggered = True
                except Exception:
                    distill_triggered = False
            except Exception:
                try:
                    asyncio.create_task(distillation.distill_user(s.user_id))
                    distill_triggered = True
                except Exception:
                    distill_triggered = False
    except Exception:
        pass

    if traits:
        payload['distilled_traits'] = traits
        if s.persona_id == 0:
            payload['use_distilled_persona'] = True
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post('http://127.0.0.1:8001/respond', json=payload, timeout=20)
            resp = r.json()
        except Exception:
            resp = {'ok': False, 'reply': '模型服务不可用'}
    reply_text = resp.get('reply', '')

    try:
        crud.add_message(req.session_id, None, 'bot', reply_text)
    except Exception:
        pass

    # 当返回时，告知前端是否触发了蒸馏或已经有蒸馏结果
    resp_payload = {'ok': True, 'reply': reply_text}
    try:
        # 重新读取蒸馏结果（可能已存在）
        latest_traits = distillation.get_user_distillation(s.user_id)
        if latest_traits:
            resp_payload['distilled'] = True
            resp_payload['traits'] = latest_traits
        else:
            resp_payload['distilled'] = False
    except Exception:
        resp_payload['distilled'] = False

    # 如果本次消息触发了异步蒸馏，告知前端可以显示进度
    try:
        if 'distill_triggered' in locals() and distill_triggered:
            resp_payload['distill_triggered'] = True
    except Exception:
        pass

    return resp_payload


@router.get('/chat/history/{session_id}')
async def chat_history(session_id: str):
    msgs = crud.get_messages(session_id)
    if msgs is None:
        return {'ok': False, 'reason': 'not_found'}
    return {'ok': True, 'messages': [{'role': m.role, 'text': m.text, 'created_at': m.created_at.isoformat()} for m in msgs]}
