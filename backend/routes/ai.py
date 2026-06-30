import json
import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/api/ai")


ARK_RESPONSES_URL = "https://ark.cn-beijing.volces.com/api/v3/responses"
ARK_DEEPSEEK_MODEL = "deepseek-v4-pro-260425"


class XiaodaChatRequest(BaseModel):
    lang: str = "zhHans"
    phase: Any = "free"
    answer: str
    current_question: Optional[str] = None
    next_question: Optional[str] = None
    known_answers: Dict[str, Any] = {}
    recent_messages: List[Dict[str, str]] = []


class XiaodaAnalyzeRequest(BaseModel):
    lang: str = "zhHans"
    intent: str
    questionnaire: Dict[str, Any] = {}
    persona: Dict[str, Any] = {}


def _ark_key() -> str:
    return (
        os.getenv("ARK_DEEPSEEK_API_KEY")
        or os.getenv("ARK_API_KEY")
        or os.getenv("DEEPSEEK_API_KEY")
        or ""
    ).strip()


def _text_for_lang(lang: str, en: str, zh_hans: str, zh_hant: str) -> str:
    if lang == "zhHant":
        return zh_hant
    if lang == "en":
        return en
    return zh_hans


def _localized_error(lang: str, reason: str = "ark_unavailable") -> str:
    if reason == "missing_key":
        return _text_for_lang(
            lang,
            "Xiaoda is connected to the real LLM route, but ARK_API_KEY is not configured on the backend.",
            "小搭已经连接到真实 LLM 路由，但后端还没有配置 ARK_API_KEY。",
            "小搭已經連接到真實 LLM 路由，但後端還沒有配置 ARK_API_KEY。",
        )
    return _text_for_lang(
        lang,
        "Xiaoda could not reach the real LLM service right now. Please try again in a moment.",
        "小搭现在暂时无法连接真实大模型服务，请稍后再试。",
        "小搭現在暫時無法連接真實大模型服務，請稍後再試。",
    )


def _system_prompt(lang: str, phase: Any) -> str:
    if lang == "en":
        return (
            "You are Xiaoda, Darlink's real-time AI guide. Reply as a warm, concise campus companion. "
            "Ask one useful follow-up when needed. Never claim to be a local fallback or template. "
            "If this is onboarding, help the user answer the current question and naturally move toward the next one."
        )
    if lang == "zhHant":
        return (
            "你是小搭，Darlink 的即時 AI 向導。請用繁體中文回覆，語氣溫暖、自然、簡潔，像一位懂校園社交的陪伴者。"
            "必要時只追問一個有幫助的問題。不要說自己是本地兜底或模板。"
            "如果正在引導問卷，請承接使用者回答，並自然推進到下一題。"
        )
    return (
        "你是小搭，Darlink 的实时 AI 向导。请用简体中文回复，语气温暖、自然、简洁，像一位懂校园社交的陪伴者。"
        "必要时只追问一个有帮助的问题。不要说自己是本地兜底或模板。"
        "如果正在引导问卷，请承接用户回答，并自然推进到下一题。"
    )


def _chat_user_prompt(req: XiaodaChatRequest) -> str:
    recent = "\n".join(
        f"{item.get('role', '')}: {item.get('content', '')}"
        for item in (req.recent_messages or [])[-8:]
        if item.get("content")
    )
    known = json.dumps(req.known_answers or {}, ensure_ascii=False)
    return (
        f"phase: {req.phase}\n"
        f"current_question: {req.current_question or ''}\n"
        f"next_question: {req.next_question or ''}\n"
        f"known_answers_json: {known}\n"
        f"recent_messages:\n{recent}\n\n"
        f"user_answer: {req.answer}\n\n"
        "Return a conversational reply only. Do not output JSON."
    )


def _analysis_prompt(req: XiaodaAnalyzeRequest) -> str:
    lang_rule = {
        "en": "Write all card text in English.",
        "zhHant": "所有卡片文字使用繁體中文。",
    }.get(req.lang, "所有卡片文字使用简体中文。")
    return (
        f"{lang_rule}\n"
        "Based on the following onboarding data, generate exactly 3 persona profile cards for Darlink.\n"
        "Return strict JSON only with this shape: {\"cards\":[{\"label\":\"...\",\"title\":\"...\",\"body\":\"...\",\"tags\":[\"...\",\"...\"]}]}.\n"
        "Do not include markdown fences or extra explanation.\n\n"
        f"intent: {req.intent}\n"
        f"questionnaire: {json.dumps(req.questionnaire, ensure_ascii=False)}\n"
        f"persona: {json.dumps(req.persona, ensure_ascii=False)}"
    )


def _extract_text_from_response(data: Any) -> str:
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return "".join(_extract_text_from_response(item) for item in data)
    if not isinstance(data, dict):
        return ""

    direct = data.get("output_text") or data.get("delta") or data.get("text")
    if isinstance(direct, str):
        return direct

    if "content" in data:
        text = _extract_text_from_response(data["content"])
        if text:
            return text
    if "output" in data:
        text = _extract_text_from_response(data["output"])
        if text:
            return text
    if "response" in data:
        text = _extract_text_from_response(data["response"])
        if text:
            return text

    return ""


async def _ark_responses(input_items: List[Dict[str, Any]], *, lang: str, max_tokens: int = 450, temperature: float = 0.68) -> str:
    api_key = _ark_key()
    if not api_key:
        raise RuntimeError("missing_key")

    payload = {
        "model": os.getenv("ARK_DEEPSEEK_MODEL", ARK_DEEPSEEK_MODEL),
        "stream": True,
        "input": input_items,
        "temperature": temperature,
        "max_output_tokens": max_tokens,
    }
    url = os.getenv("ARK_DEEPSEEK_API_URL", ARK_RESPONSES_URL)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    collected: List[str] = []
    timeout = float(os.getenv("AI_CHAT_TIMEOUT", "45"))
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                raw = line[5:].strip()
                if not raw or raw == "[DONE]":
                    continue
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                event_type = event.get("type")
                if event_type in {"response.output_text.delta", "response.refusal.delta"}:
                    delta = event.get("delta")
                    if isinstance(delta, str):
                        collected.append(delta)
                    continue
                if event_type in {"response.completed", "response.output_item.done"}:
                    text = _extract_text_from_response(event)
                    if text and not collected:
                        collected.append(text)

    text = "".join(collected).strip()
    if not text:
        raise RuntimeError("empty_ark_response")
    return text


@router.post("/chat")
async def ai_chat(req: XiaodaChatRequest):
    try:
        reply = await _ark_responses(
            [
                {
                    "role": "system",
                    "content": [{"type": "input_text", "text": _system_prompt(req.lang, req.phase)}],
                },
                {
                    "role": "user",
                    "content": [{"type": "input_text", "text": _chat_user_prompt(req)}],
                },
            ],
            lang=req.lang,
            max_tokens=int(os.getenv("AI_CHAT_MAX_TOKENS", "360")),
            temperature=float(os.getenv("AI_CHAT_TEMPERATURE", "0.68")),
        )
        return {"ok": True, "provider": "volcengine-ark-deepseek", "reply": reply, "normalized_answer": req.answer}
    except RuntimeError as exc:
        reason = str(exc)
        return {"ok": False, "provider": "volcengine-ark-deepseek", "reason": reason, "error": _localized_error(req.lang, reason)}
    except Exception as exc:
        return {"ok": False, "provider": "volcengine-ark-deepseek", "reason": str(exc), "error": _localized_error(req.lang)}


@router.post("/analyze")
async def ai_analyze(req: XiaodaAnalyzeRequest):
    try:
        raw = await _ark_responses(
            [
                {
                    "role": "system",
                    "content": [{"type": "input_text", "text": "You generate strict JSON for a product onboarding profile."}],
                },
                {
                    "role": "user",
                    "content": [{"type": "input_text", "text": _analysis_prompt(req)}],
                },
            ],
            lang=req.lang,
            max_tokens=int(os.getenv("AI_PROFILE_MAX_TOKENS", "900")),
            temperature=float(os.getenv("AI_PROFILE_TEMPERATURE", "0.5")),
        )
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            cleaned = cleaned.removeprefix("json").strip()
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            cleaned = cleaned[start : end + 1]
        data = json.loads(cleaned)
        cards = data.get("cards") if isinstance(data, dict) else None
        if not isinstance(cards, list) or not cards:
            raise ValueError("missing_cards")
        return {"ok": True, "provider": "volcengine-ark-deepseek", "cards": cards[:3]}
    except RuntimeError as exc:
        reason = str(exc)
        return {"ok": False, "provider": "volcengine-ark-deepseek", "reason": reason, "error": _localized_error(req.lang, reason)}
    except Exception as exc:
        return {"ok": False, "provider": "volcengine-ark-deepseek", "reason": str(exc), "error": _localized_error(req.lang)}
