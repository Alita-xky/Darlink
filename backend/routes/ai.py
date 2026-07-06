import asyncio
import json
import logging
import os
import time
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


router = APIRouter(prefix="/api/ai")
logger = logging.getLogger(__name__)

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}

ARK_RESPONSES_URL = "https://ark.cn-beijing.volces.com/api/v3/responses"
ARK_CHAT_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
ARK_DEEPSEEK_MODEL = "deepseek-v4-pro-260425"
DOUBAO_MODEL = "doubao-seed-evolving"

_http_client: Optional[httpx.AsyncClient] = None


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


async def init_http_client() -> None:
    global _http_client
    if _http_client is not None:
        return
    timeout = float(os.getenv("AI_CHAT_TIMEOUT", "45"))
    _http_client = httpx.AsyncClient(
        timeout=timeout,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    )


async def close_http_client() -> None:
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None


def _client() -> httpx.AsyncClient:
    if _http_client is None:
        raise RuntimeError("http_client_not_ready")
    return _http_client


def _ark_key() -> str:
    return (
        os.getenv("ARK_API_KEY")
        or os.getenv("ARK_DEEPSEEK_API_KEY")
        or os.getenv("DOUBAO_API_KEY")
        or os.getenv("DEEPSEEK_API_KEY")
        or ""
    ).strip()


def _chat_provider_mode() -> str:
    return os.getenv("AI_CHAT_PROVIDER", "primary").strip().lower()


def _ttft_timeout() -> float:
    return float(os.getenv("AI_CHAT_TTFT_TIMEOUT", "2.5"))


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


def _is_phase2_summary(phase: Any) -> bool:
    return str(phase or "") == "phase2-summary"


def _is_persona_phase(phase: Any) -> bool:
    return str(phase or "") in {"2", "phase2-summary"}


def _is_step3_study_phase(phase: Any) -> bool:
    return str(phase or "") in {"step3-study"}


def _is_step3_social_phase(phase: Any) -> bool:
    return str(phase or "") in {"step3-social"}


def _is_step3_romance_phase(phase: Any) -> bool:
    return str(phase or "") in {"step3-romance"}


BLINDBOX_GUESS_PHASES = frozenset({"celebrity-blindbox-guess", "celebrity-yau-guess"})
BLINDBOX_GUESS_PROFILE_IDS = frozenset({"jackie-chan", "elon-musk", "shing-tung-yau"})


def _is_yau_guess_phase(phase: Any) -> bool:
    return str(phase or "") == "celebrity-yau-guess"


def _is_blindbox_guess_phase(phase: Any) -> bool:
    return str(phase or "") in BLINDBOX_GUESS_PHASES


def _blindbox_guess_profile_id(req: XiaodaChatRequest) -> str:
    known = req.known_answers or {}
    profile_id = str(known.get("profile_id") or "").strip()
    if profile_id in BLINDBOX_GUESS_PROFILE_IDS:
        return profile_id
    if _is_yau_guess_phase(req.phase):
        return "shing-tung-yau"
    return "jackie-chan"


def _blindbox_guess_system_prompt(profile_id: str) -> str:
    from skill_loader import build_blindbox_guess_system_prompt

    return build_blindbox_guess_system_prompt(profile_id)


def _step3_guided_prompt(lang: str, topic: str) -> str:
    lang_lock = _ui_language_lock(lang)
    if lang == "en":
        return (
            f"You are Xiaoda during step-three {topic} onboarding. "
            "React warmly to the user's answer in their own words — do not require picking from fixed options. "
            "Then naturally weave in the next matching question; never paste it verbatim. "
            "Plain text only, 2-4 sentences." + lang_lock
        )
    if lang == "zhHant":
        return (
            f"你是小搭，正在進行第三步「{topic}」匹配的一問一答。"
            "先接住使用者用自己的話說出的回答，不要要求必須選固定選項。"
            "再自然帶出下一道匹配題，不要把題目原文直接貼出來。只用純文字，2-4 句。" + lang_lock
        )
    return (
        f"你是小搭，正在进行第三步「{topic}」匹配的一问一答。"
        "先接住用户用自己的话说出的回答，不要要求必须选固定选项。"
        "再自然带出下一道匹配题，不要把题目原文直接贴出来。只用纯文字，2-4 句。" + lang_lock
    )


def _reply_language_note(lang: str = "") -> str:
    ui_lang = str(lang or "zhHans")
    if ui_lang == "en":
        return (
            "\nLanguage rule: always reply in English to match the app UI language. "
            "Do not switch languages based on the user's latest message; short terms like MBTI types are fine to keep in English inside an English reply.\n"
        )
    if ui_lang == "zhHant":
        return (
            "\nLanguage rule: always reply in Traditional Chinese to match the app UI language. "
            "Even if the user answers in English or uses short terms like ENTP, keep the reply in Traditional Chinese (you may keep MBTI codes in Latin letters).\n"
        )
    return (
        "\nLanguage rule: always reply in Simplified Chinese to match the app UI language. "
        "Even if the user answers in English or uses short terms like ENTP, keep the reply in Simplified Chinese (you may keep MBTI codes in Latin letters).\n"
    )

def _ui_language_lock(lang: str) -> str:
    ui_lang = str(lang or "zhHans")
    if ui_lang == "en":
        return (
            " Always reply in English to match the app UI, even when the user writes in Chinese "
            "or uses short Latin terms like MBTI codes."
        )
    if ui_lang == "zhHant":
        return (
            " 無論使用者用什麼語言作答（含英文或 MBTI 代碼），你必須始終用繁體中文回覆。"
        )
    return (
        " 无论用户用什么语言作答（含英文或 MBTI 代码），你必须始终用简体中文回复。"
    )



def _system_prompt(lang: str, phase: Any, profile_id: str = "") -> str:
    lang_lock = _ui_language_lock(lang)
    if _is_blindbox_guess_phase(phase):
        pid = (profile_id or "").strip()
        if pid not in BLINDBOX_GUESS_PROFILE_IDS:
            pid = "shing-tung-yau" if _is_yau_guess_phase(phase) else "jackie-chan"
        return _blindbox_guess_system_prompt(pid)
    if _is_step3_romance_phase(phase):
        return _step3_guided_prompt(lang, "戀愛對象" if lang == "zhHant" else "恋爱对象" if lang != "en" else "romance partner")
    if _is_step3_social_phase(phase):
        return _step3_guided_prompt(lang, "社交搭子" if lang != "en" else "social buddy")
    if _is_step3_study_phase(phase):
        return _step3_guided_prompt(lang, "學習搭子" if lang == "zhHant" else "学习搭子" if lang != "en" else "study partner")

    if _is_phase2_summary(phase):
        if lang == "en":
            return (
                "You are Xiaoda, Darlink's warm campus companion. "
                "Write the opening summary for step two after the user filled in step-one basics. "
                "Sound like a close friend summarizing what they learned—empathetic, lightly playful, concrete, never stiff. "
                "Never use secretly/sketch/portrait/archive wording. "
                "Do NOT ask whether the summary is accurate. Do NOT use markdown. 2-4 sentences, plain text only. "
                "End by gently inviting them to correct anything that feels off." + lang_lock
            )
        if lang == "zhHant":
            return (
                "你是小搭，Darlink 的溫暖校園陪伴者。使用者剛填完第一步基礎問卷，請用像好朋友聊天的口吻，"
                "幫 ta 做一段開場小總結：具体、有温度、偶尔轻松幽默。禁止使用「偷偷」「小像」「偷看」「收进档案」等措辞。"
                "不要問「準確嗎」，不要用 markdown。控制在 2-4 句純文字。結尾輕輕邀請對方：哪裡不對可以直接糾正。"
            )
        return (
            "你是小搭，Darlink 的温暖校园陪伴者。用户刚填完第一步基础问卷，请用像好朋友聊天的口吻，"
            "帮 ta 做一段开场小总结：具体、有温度、偶尔轻松幽默。禁止使用「偷偷」「小像」「偷看」「收进档案」等措辞。"
            "不要问「准确吗」，不要用 markdown。控制在 2-4 句纯文字。结尾轻轻邀请对方：哪里不对可以直接纠正。"
        )

    if _is_persona_phase(phase):
        if lang == "en":
            return (
                "You are Xiaoda, Darlink's warm campus companion during persona distillation. "
                "React to what the user just said with empathy, light humor when it fits, and real curiosity. "
                "Do not sound like a form, survey bot, or checklist. Never paste the next question verbatim—blend it into natural conversation. "
                "Use plain text only: no markdown, bullets, headings, or code fences. Keep replies to 2-4 short sentences." + lang_lock
            )
        if lang == "zhHant":
            return (
                "你是小搭，Darlink 在人物畫像蒸餾階段的溫暖校園陪伴者。"
                "請先接住使用者剛才說的話，帶一點共情、偶爾輕鬆幽默，像真朋友在聊天。"
                "不要像問卷機器人或核對清單；不要把下一題原文直接貼出來，要自然帶入。"
                "只用純文字，不要用 markdown、項目符號、標題或程式碼區塊。每次回覆控制在 2-4 句。" + lang_lock
            )
        return (
            "你是小搭，Darlink 在人物画像蒸馏阶段的温暖校园陪伴者。"
            "请先接住用户刚才说的话，带一点共情、偶尔轻松幽默，像真朋友在聊天。"
            "不要像问卷机器人或核对清单；不要把下一题原文直接贴出来，要自然带入。"
            "只用纯文字，不要用 markdown、列表符号、标题或代码块。每次回复控制在 2-4 句。" + lang_lock
        )
    if lang == "en":
        return (
            "You are Xiaoda, Darlink's real-time AI guide. Reply as a warm, concise campus companion. "
            "Ask one useful follow-up when needed. Use plain text only: no markdown, no bullet syntax, no headings, no code fences. "
            "Keep replies short and conversational. Never claim to be a local fallback or template. "
            "If this is onboarding, help the user answer the current question and naturally move toward the next one." + lang_lock
        )
    if lang == "zhHant":
        return (
            "你是小搭，Darlink 的即時 AI 向導。請用繁體中文回覆，語氣溫暖、自然、簡潔，像一位懂校園社交的陪伴者。"
            "必要時只追問一個有幫助的問題。只用純文字回覆：不要用 markdown、項目符號、標題或程式碼區塊。回覆保持簡短自然。不要說自己是本地兜底或模板。"
            "如果正在引導問卷，請承接使用者回答，並自然推進到下一題。" + lang_lock
        )
    return (
        "你是小搭，Darlink 的实时 AI 向导。请用简体中文回复，语气温暖、自然、简洁，像一位懂校园社交的陪伴者。"
        "必要时只追问一个有帮助的问题。只用纯文字回复：不要用 markdown、列表符号、标题或代码块。回复保持简短自然。不要说自己是本地兜底或模板。"
        "如果正在引导问卷，请承接用户回答，并自然推进到下一题。" + lang_lock
    )


def _chat_user_prompt(req: XiaodaChatRequest) -> str:
    recent = "\n".join(
        f"{item.get('role', '')}: {item.get('content', '')}"
        for item in (req.recent_messages or [])[-8:]
        if item.get("content")
    )
    known = json.dumps(req.known_answers or {}, ensure_ascii=False)
    persona_note = ""
    if _is_blindbox_guess_phase(req.phase):
        profile_id = _blindbox_guess_profile_id(req)
        anchor = str((req.known_answers or {}).get("anchor_script") or "")
        lang_note = "Traditional Chinese" if profile_id == "shing-tung-yau" else "Simplified Chinese"
        persona_note = (
            f"\nBlindbox guess chat ({profile_id}): reply to user_message first (1-2 short sentences, {lang_note}). "
            f"Round anchor spirit (do not quote verbatim): {anchor}. "
            "Never output a single character or nonsense fragment.\n"
        )
    elif _is_persona_phase(req.phase):
        persona_note = (
            "\nPersona-distillation rules: acknowledge the user's latest message first; "
            "if next_question is provided, weave it in naturally instead of quoting it; "
            "if the user confirms the summary is fine, warmly celebrate and glide into the next topic.\n"
        )
    lang_footer = {
        "en": "Reply in English only.",
        "zhHant": "必須用繁體中文回覆，不可改用英文。",
    }.get(req.lang or "zhHans", "必须用简体中文回复，不可改用英文。")
    return (
        f"app_ui_language: {req.lang or 'zhHans'}\n"
        f"phase: {req.phase}\n"
        f"current_question: {req.current_question or ''}\n"
        f"next_question: {req.next_question or ''}\n"
        f"known_answers_json: {known}\n"
        f"recent_messages:\n{recent}\n\n"
        f"user_answer: {req.answer}"
        f"{persona_note}"
        f"{_reply_language_note(req.lang or '')}\n"
        f"{lang_footer}\n"
        "Return a conversational reply only. Do not output JSON."
    )


def _questionnaire_for_intent(questionnaire: dict, intent: str) -> dict:
    """Keep step-1 fields plus only the current path's step-3 sync payload."""
    sync_map = {"study": "studySync", "social": "socialSync", "romance": "romanceSync"}
    normalized = (intent or "").strip().lower()
    keep = sync_map.get(normalized, "socialSync")
    base = dict(questionnaire or {})
    filtered = {k: v for k, v in base.items() if not str(k).endswith("Sync")}
    if keep in base and base[keep]:
        filtered[keep] = base[keep]
    return filtered


def _analysis_prompt(req: XiaodaAnalyzeRequest) -> str:
    lang_rule = {
        "en": "Write all card text in English.",
        "zhHant": "所有卡片文字使用繁體中文。",
    }.get(req.lang, "所有卡片文字使用简体中文。")
    scoped_questionnaire = _questionnaire_for_intent(req.questionnaire, req.intent)
    return (
        f"{lang_rule}\n"
        "Based on the following onboarding data, generate exactly 3 persona profile cards for Darlink.\n"
        "Return strict JSON only with this shape: {\"cards\":[{\"label\":\"...\",\"title\":\"...\",\"body\":\"...\",\"tags\":[\"...\",\"...\"]}]}.\n"
        "Do not include markdown fences or extra explanation.\n"
        f"Generate cards ONLY for intent={req.intent}. Do not reuse or blend content from other paths "
        "(study/social/romance). Ignore any other-path sync data even if present.\n\n"
        f"intent: {req.intent}\n"
        f"questionnaire: {json.dumps(scoped_questionnaire, ensure_ascii=False)}\n"
        f"persona: {json.dumps(req.persona, ensure_ascii=False)}"
    )


def _doubao_messages(system: str, user: str) -> List[Dict[str, str]]:
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _deepseek_input(system: str, user: str) -> List[Dict[str, Any]]:
    return [
        {"role": "system", "content": [{"type": "input_text", "text": system}]},
        {"role": "user", "content": [{"type": "input_text", "text": user}]},
    ]


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

    for key in ("content", "output", "response"):
        if key in data:
            text = _extract_text_from_response(data[key])
            if text:
                return text
    return ""


def _extract_doubao_content(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: List[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts).strip()
    return ""


def _doubao_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {_ark_key()}",
        "Content-Type": "application/json",
    }


def _deepseek_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {_ark_key()}",
        "Content-Type": "application/json",
    }


async def _iter_doubao_chat(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 450,
    temperature: float = 0.68,
) -> AsyncIterator[str]:
    api_key = _ark_key()
    if not api_key:
        raise RuntimeError("missing_key")

    payload = {
        "model": os.getenv("DOUBAO_MODEL", DOUBAO_MODEL),
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    url = os.getenv("DOUBAO_API_URL", ARK_CHAT_URL)
    client = _client()
    async with client.stream("POST", url, headers=_doubao_headers(), json=payload) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if not line.startswith("data:"):
                continue
            raw = line[5:].strip()
            if not raw or raw == "[DONE]":
                continue
            try:
                chunk = json.loads(raw)
            except json.JSONDecodeError:
                continue
            choices = chunk.get("choices") if isinstance(chunk, dict) else None
            if not isinstance(choices, list) or not choices:
                continue
            choice = choices[0] if isinstance(choices[0], dict) else {}
            delta = choice.get("delta") if isinstance(choice.get("delta"), dict) else {}
            content = delta.get("content")
            if isinstance(content, str) and content:
                yield content


async def _iter_deepseek_responses(
    input_items: List[Dict[str, Any]],
    *,
    max_tokens: int = 450,
    temperature: float = 0.68,
) -> AsyncIterator[str]:
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
    client = _client()
    saw_delta = False
    async with client.stream("POST", url, headers=_deepseek_headers(), json=payload) as response:
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
                if isinstance(delta, str) and delta:
                    saw_delta = True
                    yield delta
                continue
            if not saw_delta and event_type in {"response.completed", "response.output_item.done"}:
                text = _extract_text_from_response(event)
                if text:
                    yield text


async def _collect_stream(stream: AsyncIterator[str]) -> str:
    parts: List[str] = []
    async for chunk in stream:
        parts.append(chunk)
    text = "".join(parts).strip()
    if not text:
        raise RuntimeError("empty_llm_response")
    return text


async def _doubao_chat(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 450,
    temperature: float = 0.68,
) -> str:
    return await _collect_stream(
        _iter_doubao_chat(messages, max_tokens=max_tokens, temperature=temperature)
    )


async def _deepseek_responses(
    input_items: List[Dict[str, Any]],
    *,
    max_tokens: int = 450,
    temperature: float = 0.68,
) -> str:
    return await _collect_stream(
        _iter_deepseek_responses(input_items, max_tokens=max_tokens, temperature=temperature)
    )


async def _read_stream_with_ttft(
    stream: AsyncIterator[str],
    *,
    ttft_timeout: float,
) -> Tuple[List[str], bool]:
    iterator = stream.__aiter__()
    parts: List[str] = []
    try:
        first = await asyncio.wait_for(iterator.__anext__(), timeout=ttft_timeout)
        if first:
            parts.append(first)
    except asyncio.TimeoutError:
        return parts, False
    except StopAsyncIteration:
        return parts, bool(parts)

    async for chunk in iterator:
        if chunk:
            parts.append(chunk)
    return parts, True




def _chinese_char_count(text: str) -> int:
    return sum(1 for ch in (text or "") if "\u4e00" <= ch <= "\u9fff")


def _reply_matches_ui_language(reply: str, lang: str) -> bool:
    text = (reply or "").strip()
    if not text:
        return True
    chinese = _chinese_char_count(text)
    if lang == "en":
        return chinese < max(6, len(text) // 5)
    return chinese >= 6


def _system_prompt_prefix(lang: str) -> str:
    ui_lang = str(lang or "zhHans")
    if ui_lang == "en":
        return "CRITICAL: Reply in English only. Never switch to Chinese because of user input.\n\n"
    if ui_lang == "zhHant":
        return "【重要】你必須全程使用繁體中文回覆，即使用戶輸入英文或 MBTI 代碼。\n\n"
    return "【重要】你必须全程使用简体中文回复，即使用户输入英文或 MBTI 代码。\n\n"


async def _ensure_reply_language(reply: str, lang: str) -> str:
    text = (reply or "").strip()
    if not text or _reply_matches_ui_language(text, lang):
        return text
    target = {
        "en": "English",
        "zhHant": "Traditional Chinese",
    }.get(str(lang or "zhHans"), "Simplified Chinese")
    rewrite_system = (
        f"You rewrite Xiaoda assistant messages into {target}. "
        "Keep tone, warmth, humor, and length similar. Output only the rewritten message."
    )
    rewrite_user = f"Rewrite this assistant message in {target}:\n\n{text}"
    try:
        rewritten, _ = await _call_llm(
            system=rewrite_system,
            user=rewrite_user,
            max_tokens=512,
            temperature=0.2,
        )
        rewritten = (rewritten or "").strip()
        if rewritten and _reply_matches_ui_language(rewritten, lang):
            return rewritten
    except Exception as exc:
        logger.warning("reply_language_rewrite_failed: %s", exc)
    return text

async def _call_llm(
    *,
    system: str,
    user: str,
    max_tokens: int,
    temperature: float,
) -> Tuple[str, str]:
    if _chat_provider_mode() == "race":
        return await _race_llm(
            system=system,
            user=user,
            max_tokens=max_tokens,
            temperature=temperature,
        )

    doubao_messages = _doubao_messages(system, user)
    deepseek_input = _deepseek_input(system, user)
    ttft = _ttft_timeout()
    start = time.monotonic()

    try:
        parts, completed = await _read_stream_with_ttft(
            _iter_doubao_chat(doubao_messages, max_tokens=max_tokens, temperature=temperature),
            ttft_timeout=ttft,
        )
        if completed and parts:
            text = "".join(parts).strip()
            if text:
                logger.info(
                    "llm_call provider=doubao total_ms=%.0f",
                    (time.monotonic() - start) * 1000,
                )
                return text, "volcengine-ark-doubao"
    except Exception as exc:
        logger.warning("doubao_primary_failed: %s", exc)

    text = await _deepseek_responses(deepseek_input, max_tokens=max_tokens, temperature=temperature)
    logger.info(
        "llm_call provider=deepseek-fallback total_ms=%.0f",
        (time.monotonic() - start) * 1000,
    )
    return text, "volcengine-ark-deepseek"


async def _race_llm(
    *,
    system: str,
    user: str,
    max_tokens: int,
    temperature: float,
) -> Tuple[str, str]:
    doubao_messages = _doubao_messages(system, user)
    deepseek_input = _deepseek_input(system, user)

    async def run_doubao() -> Tuple[str, str]:
        text = await _doubao_chat(doubao_messages, max_tokens=max_tokens, temperature=temperature)
        return text, "volcengine-ark-doubao"

    async def run_deepseek() -> Tuple[str, str]:
        text = await _deepseek_responses(deepseek_input, max_tokens=max_tokens, temperature=temperature)
        return text, "volcengine-ark-deepseek"

    tasks = {
        asyncio.create_task(run_doubao()): "doubao",
        asyncio.create_task(run_deepseek()): "deepseek",
    }
    errors: List[Exception] = []
    try:
        while tasks:
            done, _pending = await asyncio.wait(tasks.keys(), return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                tasks.pop(task)
                try:
                    text, provider = task.result()
                    for other in tasks:
                        other.cancel()
                    return text, provider
                except Exception as exc:
                    errors.append(exc)
        if errors:
            raise errors[0]
        raise RuntimeError("ark_unavailable")
    finally:
        for task in tasks:
            task.cancel()


async def _race_stream_llm(
    *,
    system: str,
    user: str,
    max_tokens: int,
    temperature: float,
) -> AsyncIterator[Tuple[str, str, str]]:
    queue: asyncio.Queue[Tuple[str, Optional[str], Optional[str], Optional[Exception]]] = asyncio.Queue()

    async def pump(name: str, stream: AsyncIterator[str], provider: str) -> None:
        try:
            async for chunk in stream:
                if chunk:
                    await queue.put((name, chunk, provider, None))
            await queue.put((name, None, provider, None))
        except Exception as exc:
            await queue.put((name, None, provider, exc))

    doubao_task = asyncio.create_task(
        pump(
            "doubao",
            _iter_doubao_chat(_doubao_messages(system, user), max_tokens=max_tokens, temperature=temperature),
            "volcengine-ark-doubao",
        )
    )
    deepseek_task = asyncio.create_task(
        pump(
            "deepseek",
            _iter_deepseek_responses(_deepseek_input(system, user), max_tokens=max_tokens, temperature=temperature),
            "volcengine-ark-deepseek",
        )
    )

    winner: Optional[str] = None
    winner_provider = "volcengine-ark"
    parts: List[str] = []
    active = {"doubao", "deepseek"}
    errors: Dict[str, Exception] = {}

    try:
        while active:
            name, chunk, provider, error = await queue.get()
            if error is not None:
                errors[name] = error
                active.discard(name)
                if not active and not parts:
                    raise errors.get(name) or RuntimeError("ark_unavailable")
                continue
            if chunk is None:
                active.discard(name)
                if winner == name and parts:
                    yield ("done", winner_provider, "".join(parts).strip())
                    return
                if not active and not winner and parts:
                    yield ("done", provider or winner_provider, "".join(parts).strip())
                    return
                if not active and winner and parts:
                    yield ("done", winner_provider, "".join(parts).strip())
                    return
                if not active and not parts:
                    if errors:
                        raise next(iter(errors.values()))
                    raise RuntimeError("ark_unavailable")
                continue
            if winner is None:
                winner = name
                winner_provider = provider or winner_provider
                if name == "doubao":
                    deepseek_task.cancel()
                else:
                    doubao_task.cancel()
            if name == winner:
                parts.append(chunk)
                yield ("delta", winner_provider, chunk)
    finally:
        doubao_task.cancel()
        deepseek_task.cancel()


async def _stream_llm(
    *,
    system: str,
    user: str,
    max_tokens: int,
    temperature: float,
) -> AsyncIterator[Tuple[str, str, str]]:
    if _chat_provider_mode() == "race":
        async for event, provider, payload in _race_stream_llm(
            system=system,
            user=user,
            max_tokens=max_tokens,
            temperature=temperature,
        ):
            yield (event, provider, payload)
        return

    doubao_messages = _doubao_messages(system, user)
    deepseek_input = _deepseek_input(system, user)
    ttft = _ttft_timeout()
    start = time.monotonic()
    ttft_ms: Optional[float] = None
    parts: List[str] = []

    try:
        iterator = _iter_doubao_chat(doubao_messages, max_tokens=max_tokens, temperature=temperature).__aiter__()
        try:
            first = await asyncio.wait_for(iterator.__anext__(), timeout=ttft)
            if first:
                ttft_ms = (time.monotonic() - start) * 1000
                parts.append(first)
                yield ("delta", "volcengine-ark-doubao", first)
        except asyncio.TimeoutError:
            first = None
        except StopAsyncIteration:
            first = None

        if first is not None:
            async for chunk in iterator:
                if chunk:
                    parts.append(chunk)
                    yield ("delta", "volcengine-ark-doubao", chunk)
            reply = "".join(parts).strip()
            if reply:
                total_ms = (time.monotonic() - start) * 1000
                logger.info(
                    "llm_stream provider=doubao ttft_ms=%.0f total_ms=%.0f",
                    ttft_ms or 0,
                    total_ms,
                )
                yield ("done", "volcengine-ark-doubao", reply)
                return
    except Exception as exc:
        logger.warning("doubao_stream_failed: %s", exc)

    parts = []
    provider = "volcengine-ark-deepseek"
    async for chunk in _iter_deepseek_responses(
        deepseek_input,
        max_tokens=max_tokens,
        temperature=temperature,
    ):
        if not parts and chunk:
            ttft_ms = (time.monotonic() - start) * 1000
        if chunk:
            parts.append(chunk)
            yield ("delta", provider, chunk)
    reply = "".join(parts).strip()
    if not reply:
        raise RuntimeError("empty_deepseek_response")
    logger.info(
        "llm_stream provider=deepseek-fallback ttft_ms=%.0f total_ms=%.0f",
        ttft_ms or 0,
        (time.monotonic() - start) * 1000,
    )
    yield ("done", provider, reply)


def _sse_event(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _sse_generator(
    *,
    system: str,
    user: str,
    max_tokens: int,
    temperature: float,
    extra_done: Optional[Dict[str, Any]] = None,
) -> AsyncIterator[str]:
    start = time.monotonic()
    ttft_ms: Optional[float] = None
    provider = "volcengine-ark"
    try:
        async for event, prov, payload in _stream_llm(
            system=system,
            user=user,
            max_tokens=max_tokens,
            temperature=temperature,
        ):
            provider = prov
            if event == "delta":
                if ttft_ms is None:
                    ttft_ms = (time.monotonic() - start) * 1000
                yield _sse_event("delta", {"text": payload})
            else:
                final_reply = await _ensure_reply_language(payload, extra_done.get("lang") if extra_done else "")
                done_payload = {
                    "provider": provider,
                    "reply": final_reply,
                    "ttft_ms": round(ttft_ms or 0),
                    "total_ms": round((time.monotonic() - start) * 1000),
                }
                if extra_done:
                    done_payload.update(extra_done)
                yield _sse_event("done", done_payload)
    except RuntimeError as exc:
        yield _sse_event("error", {"reason": str(exc), "error": str(exc)})
    except Exception as exc:
        yield _sse_event("error", {"reason": str(exc), "error": str(exc)})


@router.post("/chat")
async def ai_chat(req: XiaodaChatRequest):
    try:
        blindbox_guess = _is_blindbox_guess_phase(req.phase)
        profile_id = _blindbox_guess_profile_id(req) if blindbox_guess else ""
        system = _system_prompt_prefix(req.lang) + _system_prompt(req.lang, req.phase, profile_id)
        user = _chat_user_prompt(req)
        max_tokens = 200 if blindbox_guess else int(os.getenv("AI_CHAT_MAX_TOKENS", "1024"))
        temperature = 0.52 if blindbox_guess else float(os.getenv("AI_CHAT_TEMPERATURE", "0.68"))
        attempts = 4 if blindbox_guess else 1
        reply = ""
        provider = "volcengine-ark"
        last_exc: Optional[Exception] = None
        for attempt in range(attempts):
            try:
                reply, provider = await _call_llm(
                    system=system,
                    user=user,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                if not reply or not reply.strip():
                    last_exc = RuntimeError("empty_llm_response")
                elif blindbox_guess:
                    from skill_loader import YAU_SMS_SIGNATURE, min_blindbox_guess_reply_len, polish_blindbox_guess_reply

                    polished = polish_blindbox_guess_reply(profile_id, reply)
                    body = polished.replace(YAU_SMS_SIGNATURE, "").strip()
                    if profile_id != "shing-tung-yau":
                        body = polished.strip()
                    if len(body) < min_blindbox_guess_reply_len(profile_id):
                        last_exc = RuntimeError("short_blindbox_guess_reply")
                    else:
                        reply = polished
                        break
                else:
                    break
            except RuntimeError as exc:
                last_exc = exc
            if attempt < attempts - 1:
                await asyncio.sleep(0.7 * (attempt + 1))
        if not reply or not reply.strip():
            raise last_exc or RuntimeError("empty_llm_response")
        if not blindbox_guess:
            reply = await _ensure_reply_language(reply, req.lang)
        elif profile_id == "shing-tung-yau":
            from skill_loader import YAU_SMS_SIGNATURE, polish_blindbox_guess_reply

            if YAU_SMS_SIGNATURE not in reply:
                reply = polish_blindbox_guess_reply(profile_id, reply)
        return {"ok": True, "provider": provider, "reply": reply, "normalized_answer": req.answer}
    except RuntimeError as exc:
        reason = str(exc)
        return {"ok": False, "provider": "volcengine-ark", "reason": reason, "error": _localized_error(req.lang, reason)}
    except Exception as exc:
        return {"ok": False, "provider": "volcengine-ark", "reason": str(exc), "error": _localized_error(req.lang)}


@router.post("/chat/stream")
async def ai_chat_stream(req: XiaodaChatRequest):
    generator = _sse_generator(
        system=_system_prompt_prefix(req.lang) + _system_prompt(req.lang, req.phase),
        user=_chat_user_prompt(req),
        max_tokens=int(os.getenv("AI_CHAT_MAX_TOKENS", "1024")),
        temperature=float(os.getenv("AI_CHAT_TEMPERATURE", "0.68")),
        extra_done={"lang": req.lang, "normalized_answer": req.answer},
    )
    return StreamingResponse(generator, media_type="text/event-stream", headers=SSE_HEADERS)


@router.post("/analyze")
async def ai_analyze(req: XiaodaAnalyzeRequest):
    try:
        raw, provider = await _call_llm(
            system="You generate strict JSON for a product onboarding profile.",
            user=_analysis_prompt(req),
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
        return {"ok": True, "provider": provider, "cards": cards[:3]}
    except RuntimeError as exc:
        reason = str(exc)
        return {"ok": False, "provider": "volcengine-ark", "reason": reason, "error": _localized_error(req.lang, reason)}
    except Exception as exc:
        return {"ok": False, "provider": "volcengine-ark", "reason": str(exc), "error": _localized_error(req.lang)}
