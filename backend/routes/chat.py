from fastapi import APIRouter
import crud
import httpx
from schemas import StartChatReq, ChatMessageReq
import embeddings

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

    return {'ok': True, 'reply': reply_text}


@router.get('/chat/history/{session_id}')
async def chat_history(session_id: str):
    msgs = crud.get_messages(session_id)
    if msgs is None:
        return {'ok': False, 'reason': 'not_found'}
    return {'ok': True, 'messages': [{'role': m.role, 'text': m.text, 'created_at': m.created_at.isoformat()} for m in msgs]}
