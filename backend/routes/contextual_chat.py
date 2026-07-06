import asyncio
import os
from typing import Dict, List, Optional

import crud
import distillation
from fastapi import APIRouter, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from routes.ai import _call_llm, _localized_error, _sse_generator, SSE_HEADERS
from skill_loader import (
    CELEBRITY_PROFILE_TO_PERSONA,
    build_celebrity_system_prompt,
    get_skill_for_profile,
    polish_jackie_reply,
    polish_musk_reply,
    polish_yau_reply,
    should_append_yau_signature,
)


router = APIRouter(prefix="/api/ai")

PROFILE_PROMPTS: Dict[str, Dict[str, str]] = {
    "jackie-chan": {
        "name": "J* · Action Box",
        "persona": "你是成龙风格的动作喜剧数字人：温暖、勇敢、幽默，像大哥一样鼓励用户把压力变成 playful courage。语气亲切，可引用功夫喜剧、成家班、拼命三郎等梗，但说明是风格化对话参考。",
    },
    "shing-tung-yau": {
        "name": "Y* Yau · Geometry Box",
        "persona": "你是丘成桐风格的数学皇帝数字人：严谨、深刻、有耐心，善于把模糊问题变成精确的几何/数学原则。可谈菲尔兹奖、丘赛、几何宇宙等，语气庄重但不冷漠。",
    },
    "elon-musk": {
        "name": "M* K · Mars Box",
        "persona": "你是马斯克风格的第一性原理创业者数字人：直接、敢想、略带梗感，善于删假设、重建问题。可谈火星、SpaceX、Tesla、X.com，但保持产品/校园场景相关。",
    },
    "plaza-aria": {
        "name": "Aria Liu Twin",
        "persona": "你是校园学习搭子数字人 Aria：专注、温柔、善于把考试压力拆成可执行的小承诺，强调可见的进度与恢复时间。",
    },
    "plaza-maya": {
        "name": "Maya K. Twin",
        "persona": "你是视觉设计向数字人 Maya：用参考图、草图、设计例子把模糊想法具象化，语气温暖有创造力。",
    },
    "plaza-sarah": {
        "name": "Sarah J. Twin",
        "persona": "你是情感节奏温和的数字人 Sarah：帮用户写不用力、真诚、有边界感的开场白和对话。",
    },
    "study-astra": {
        "name": "Astra Chen Twin",
        "persona": "你是量子物理学习搭子：深度专注、笔记对比、精确问责，擅长 90 分钟冲刺式学习规划。",
    },
    "study-elara": {
        "name": "Elara Vance Twin",
        "persona": "你是认知科学学习搭子：尊重的辩论、阅读拆解、一个主张一个挑战一个共识。",
    },
    "culinary-leo": {
        "name": "Leo Zhang Twin",
        "persona": "你是深夜美食社交搭子：低压力探店、拉面与甜品路线、轻松对话。",
    },
    "culinary-sarah": {
        "name": "Sarah Lin Twin",
        "persona": "你是抹茶咖啡馆社交搭子：安静、舒适、适合图书馆旁的轻松约会。",
    },
    "romance-elias": {
        "name": "Elias Vance Twin",
        "persona": "你是深度恋爱数字人：真诚、缓慢、倾听，拒绝表演式热烈，重视安全感。",
    },
    "romance-lyra": {
        "name": "Lyra Chen Twin",
        "persona": "你是愿景型恋爱数字人：谈梦想也谈情绪稳定，野心与落地并行。",
    },
    "maya": {
        "name": "Maya K.",
        "persona": "你是创意共鸣匹配对象 Maya：极简数字艺术、思辨阅读、深夜灵感，善于设计小项目式开场。",
    },
    "elena": {
        "name": "Elena Jiang",
        "persona": "你是高匹配度对象 Elena：关注设计系统与安静学习空间，温暖好奇。",
    },
}


class ContextualSessionReq(BaseModel):
    user_token: str
    profile_type: str
    profile_id: str


class ContextualChatReq(BaseModel):
    lang: str = "zhHans"
    user_token: str = ""
    session_id: str = ""
    profile_id: str = ""
    profile_name: str = ""
    profile_type: str = "module"
    profile_subtitle: str = ""
    profile_context: str = ""
    message: str = ""
    recent_messages: List[Dict[str, str]] = Field(default_factory=list)


def _lang_rule(lang: str) -> str:
    if lang == "en":
        return "Reply in English."
    if lang == "zhHant":
        return "請用繁體中文回覆。"
    return "请用简体中文回复。"


def _role_label(role: str) -> str:
    if role in {"user", "human"}:
        return "User"
    return "Assistant"


def _is_yau_profile(req: ContextualChatReq) -> bool:
    return (req.profile_id or "").strip() == "shing-tung-yau"


def _is_jackie_profile(req: ContextualChatReq) -> bool:
    return (req.profile_id or "").strip() == "jackie-chan"


def _is_musk_profile(req: ContextualChatReq) -> bool:
    return (req.profile_id or "").strip() == "elon-musk"


def _is_blindbox_celebrity(req: ContextualChatReq) -> bool:
    return _is_yau_profile(req) or _is_jackie_profile(req) or _is_musk_profile(req)


def _chat_max_tokens(req: ContextualChatReq) -> int:
    user_id = _parse_user_twin_id(req.profile_id, req.profile_type)
    if user_id is not None:
        budget = distillation._resolve_reply_budget(user_id, distillation.get_user_distillation(user_id))
        return max(int(budget["max_tokens"]), 128)
    if _is_blindbox_celebrity(req):
        return int(os.getenv("AI_BLIND_BOX_CHAT_MAX_TOKENS", "160"))
    if req.profile_type == "celebrity" or (req.profile_id or "").strip() in CELEBRITY_PROFILE_TO_PERSONA:
        return int(os.getenv("AI_CELEBRITY_CHAT_MAX_TOKENS", "1024"))
    return int(os.getenv("AI_CHAT_MAX_TOKENS", "1024"))


def _chat_temperature(req: ContextualChatReq) -> float:
    if _parse_user_twin_id(req.profile_id, req.profile_type) is not None:
        return 0.62
    if _is_blindbox_celebrity(req):
        return float(os.getenv("AI_BLIND_BOX_CHAT_TEMPERATURE", "0.65"))
    return float(os.getenv("AI_CHAT_TEMPERATURE", "0.72"))


def _yau_prior_bot_count(req: ContextualChatReq) -> int:
    session_id = (req.session_id or "").strip()
    if session_id:
        msgs = crud.get_messages(session_id) or []
        return sum(1 for m in msgs if (m.role or "").strip() == "bot")
    return sum(
        1
        for item in (req.recent_messages or [])
        if (item.get("role") or "").strip().lower() in ("bot", "assistant")
    )


async def _call_llm_with_retry(**kwargs):
    last_exc: Optional[RuntimeError] = None
    for attempt in range(2):
        try:
            return await _call_llm(**kwargs)
        except RuntimeError as exc:
            last_exc = exc
            if attempt == 0:
                await asyncio.sleep(0.35)
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("llm_unavailable")


def _polish_celebrity_reply(req: ContextualChatReq, reply: str) -> str:
    if _is_yau_profile(req):
        prior = _yau_prior_bot_count(req)
        return polish_yau_reply(
            reply,
            append_signature=should_append_yau_signature(prior),
        )
    if _is_jackie_profile(req):
        return polish_jackie_reply(reply)
    if _is_musk_profile(req):
        return polish_musk_reply(reply)
    return reply


def _parse_user_twin_id(profile_id: str, profile_type: str) -> Optional[int]:
    pid = (profile_id or "").strip()
    if profile_type == "user_twin" or pid.startswith("user-"):
        return crud.parse_user_profile_id(pid)
    return None


def _user_twin_fallback_prompt(req: ContextualChatReq, name: str) -> str:
    context = (req.profile_context or "").strip()
    summary = context or f"你是{name}，校园里的一个同学。"
    return (
        f"{_lang_rule(req.lang)}\n"
        f"{summary}\n"
        "你就是本人，用第一人称「我」说话；被问是谁就直接说自己的名字。"
        "像微信一样自然回复，不要说是数字人、孪生或 AI。不要输出 JSON。"
    )


def _build_system_prompt(req: ContextualChatReq) -> str:
    profile_id = (req.profile_id or "").strip()
    known = PROFILE_PROMPTS.get(profile_id, {})
    name = req.profile_name or known.get("name") or "Digital Human"

    if req.profile_type == "celebrity" or profile_id in CELEBRITY_PROFILE_TO_PERSONA:
        skill = get_skill_for_profile(profile_id)
        if skill:
            lang = "zhHant" if profile_id == "shing-tung-yau" else req.lang
            return build_celebrity_system_prompt(name, skill, lang, profile_id)

    user_id = _parse_user_twin_id(profile_id, req.profile_type)
    if user_id is not None:
        return distillation.build_plaza_twin_system_prompt(user_id, req.lang)

    persona = known.get("persona") or f"You are {name}, a Darlink campus digital human twin."

    type_hint = {
        "celebrity": "This is an unlocked mystery-icon celebrity-style persona. Stay in character as a stylized reference, not an official account.",
        "match": "This is a compatibility-matched campus twin. Be warm, specific, and low-pressure.",
        "module": "This is a digital-human plaza twin distilled from onboarding signals. Be helpful and conversational.",
        "user_twin": "This is a campus student chatting as themselves.",
    }.get(req.profile_type, "This is a Darlink digital human.")

    return (
        f"{_lang_rule(req.lang)}\n"
        f"You are {name}. {persona}\n"
        f"{type_hint}\n"
        "Reply as this character in 1-4 short paragraphs. Keep the reply within about 120 Chinese characters when possible. "
        "Be natural, warm, and specific. Do not mention being an AI model or a local fallback. Do not output JSON."
    )


def _build_user_prompt(req: ContextualChatReq) -> str:
    user_id = _parse_user_twin_id(req.profile_id, req.profile_type)
    if user_id is not None:
        return distillation.build_self_chat_user_prompt(
            req.message,
            (req.session_id or "").strip() or None,
            recent_messages=req.recent_messages,
            audience="plaza",
        )

    lines = [
        f"profile_type: {req.profile_type}",
        f"profile_subtitle: {req.profile_subtitle}",
        f"profile_context:\n{req.profile_context or ''}",
        "",
        "Recent conversation:",
    ]
    for item in (req.recent_messages or [])[-6:]:
        content = (item.get("content") or "").strip()
        if not content:
            continue
        lines.append(f"{_role_label(item.get('role', ''))}: {content}")
    profile_id = (req.profile_id or "").strip()
    lines.extend(["", f"User: {req.message}", ""])
    if _is_yau_profile(req):
        lines.append(
            "半文半白、老派簡短；可用令人汗顏、這是極小的事；約2/3句號用「！」；"
            "被問是誰：可說數學皇帝/搞幾何的，**絕不承認是丘成桐**；签名大约每三四条才加；禁止盲盒/不是真人。"
        )
    elif _is_jackie_profile(req) or _is_musk_profile(req):
        lines.append(
            "现代简体口语，微信短句，1-3句≤80字。不要提Darlink/盲盒/数字人，不承认是真人。"
        )
    elif req.profile_type == "celebrity" or profile_id in CELEBRITY_PROFILE_TO_PERSONA:
        lines.append(
            "Compliance: never claim to be the real celebrity; if asked, clearly deny you are the real person."
        )
    lines.append("Reply in character:")
    return "\n".join(lines)


def _message_role_from_db(role: str) -> str:
    if role == "user":
        return "user"
    return "assistant"


def _persist_bot_message(session_id: str, reply: str) -> None:
    if session_id and reply:
        crud.add_message(session_id, None, "bot", reply)
        crud.touch_session(session_id)


def _resolve_session(req: ContextualChatReq):
    message = (req.message or "").strip()
    session_id = (req.session_id or "").strip()
    user = crud.get_user_by_token(req.user_token) if req.user_token else None

    if req.user_token and req.profile_id and req.profile_type:
        session_id = session_id or crud.get_or_create_contextual_session(
            req.user_token, req.profile_type, req.profile_id
        ) or ""

    if session_id and user:
        session = crud.get_session_for_user(session_id, req.user_token)
        if not session:
            return None, None, message, {"ok": False, "reason": "bad_session", "error": _localized_error(req.lang)}
        asyncio.create_task(asyncio.to_thread(crud.add_message, session_id, user.id, "user", message))

    return session_id, user, message, None


@router.post("/contextual-chat/session")
async def contextual_session(req: ContextualSessionReq):
    if not req.user_token or not req.profile_type or not req.profile_id:
        return {"ok": False, "reason": "missing_fields"}
    sid = crud.get_or_create_contextual_session(req.user_token, req.profile_type, req.profile_id)
    if not sid:
        return {"ok": False, "reason": "auth_required"}
    return {"ok": True, "session_id": sid}


@router.get("/contextual-chat/history")
async def contextual_history(
    session_id: str = Query(...),
    user_token: str = Query(...),
):
    session = crud.get_session_for_user(session_id, user_token)
    if not session:
        return {"ok": False, "reason": "bad_session"}
    since = crud.history_cutoff()
    rows = crud.get_messages_since(session_id, since)
    messages = [
        {
            "role": _message_role_from_db(m.role),
            "content": m.text,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in rows
    ]
    return {"ok": True, "session_id": session_id, "messages": messages}


@router.post("/contextual-chat")
async def contextual_chat(req: ContextualChatReq, background_tasks: BackgroundTasks):
    message = (req.message or "").strip()
    if not message:
        return {"ok": False, "reason": "empty_message", "error": _localized_error(req.lang)}

    session_id, user, _, error = _resolve_session(req)
    if error:
        return error

    user_id = _parse_user_twin_id(req.profile_id, req.profile_type)
    try:
        if user_id is not None:
            reply = await distillation.generate_user_persona_reply(
                user_id,
                message,
                audience="plaza",
                session_id=session_id,
                recent_messages=req.recent_messages,
                lang=req.lang,
            )
            provider = "volcengine-ark-user-persona"
        else:
            reply, provider = await _call_llm_with_retry(
                system=_build_system_prompt(req),
                user=_build_user_prompt(req),
                max_tokens=_chat_max_tokens(req),
                temperature=_chat_temperature(req),
            )
            reply = _polish_celebrity_reply(req, reply)
    except RuntimeError as exc:
        reason = str(exc)
        return {"ok": False, "provider": "volcengine-ark", "reason": reason, "error": _localized_error(req.lang, reason)}
    except Exception as exc:
        return {"ok": False, "provider": "volcengine-ark", "reason": str(exc), "error": _localized_error(req.lang)}

    if session_id and user:
        background_tasks.add_task(_persist_bot_message, session_id, reply)

    return {
        "ok": True,
        "provider": provider,
        "reply": reply,
        "session_id": session_id or None,
    }


@router.post("/contextual-chat/stream")
async def contextual_chat_stream(req: ContextualChatReq):
    message = (req.message or "").strip()
    if not message:
        async def empty_error():
            import json
            yield f"event: error\ndata: {json.dumps({'reason': 'empty_message'}, ensure_ascii=False)}\n\n"

        return StreamingResponse(empty_error(), media_type="text/event-stream", headers=SSE_HEADERS)

    session_id, user, _, error = _resolve_session(req)
    if error:
        async def session_error():
            import json
            yield f"event: error\ndata: {json.dumps(error, ensure_ascii=False)}\n\n"

        return StreamingResponse(session_error(), media_type="text/event-stream", headers=SSE_HEADERS)

    user_id = _parse_user_twin_id(req.profile_id, req.profile_type)

    if user_id is not None:
        async def user_twin_stream():
            import json
            from routes.ai import _sse_event

            reply = await distillation.generate_user_persona_reply(
                user_id,
                message,
                audience="plaza",
                session_id=session_id,
                recent_messages=req.recent_messages,
                lang=req.lang,
            )
            if session_id and user:
                await asyncio.to_thread(_persist_bot_message, session_id, reply)
            yield _sse_event("done", {"reply": reply, "session_id": session_id or None, "ok": True})

        return StreamingResponse(user_twin_stream(), media_type="text/event-stream", headers=SSE_HEADERS)

    async def wrapped_stream():
        import json

        reply_holder = {"reply": ""}
        async for chunk in _sse_generator(
            system=_build_system_prompt(req),
            user=_build_user_prompt(req),
            max_tokens=_chat_max_tokens(req),
            temperature=_chat_temperature(req),
            extra_done={"session_id": session_id or None, "ok": True},
        ):
            if chunk.startswith("event: done"):
                for line in chunk.split("\n"):
                    if line.startswith("data:"):
                        payload = json.loads(line[5:].strip())
                        reply_holder["reply"] = _polish_celebrity_reply(req, payload.get("reply") or "")
                        payload["reply"] = reply_holder["reply"]
                        chunk = f"event: done\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
                        break
            yield chunk
        if session_id and user and reply_holder["reply"]:
            await asyncio.to_thread(_persist_bot_message, session_id, reply_holder["reply"])

    return StreamingResponse(wrapped_stream(), media_type="text/event-stream", headers=SSE_HEADERS)
