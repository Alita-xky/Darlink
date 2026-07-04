import json
import os
from typing import List, Optional

from routes.ai import _call_llm

MAX_SKILL_CHARS = 4000


def _format_section(title: str, lines: List[str]) -> str:
    body = "\n".join(f"- {line}" for line in lines if line)
    return f"## {title}\n{body}\n" if body else ""


def _fallback_skill(
    intent: str,
    questionnaire: dict,
    persona: dict,
    cards: list,
    twin_name: str,
) -> str:
    q = questionnaire or {}
    p = persona or {}
    card_lines = []
    for card in (cards or [])[:3]:
        title = (card.get("title") or "").strip()
        body = (card.get("body") or "").strip()
        tags = ", ".join(card.get("tags") or [])
        if title or body:
            card_lines.append(f"{title}: {body} ({tags})".strip())

    parts = [
        "# User Twin Skill (fallback)\n",
        _format_section(
            "角色扮演规则",
            [
                "你是 Darlink 校园用户的数字分身，用第一人称代表主人与陌生人聊天。",
                "你不是真人，不能替主人承诺线下见面或交换私密联系方式。",
                "语气像微信好友，3-5 句话，自然温暖。",
            ],
        ),
        _format_section(
            "身份卡",
            [
                f"数字人代号: {twin_name or q.get('nickname', '校园同学')}",
                f"学校: {q.get('school', '')}",
                f"年级: {q.get('grade', '')}",
                f"专业方向: {q.get('majorDirection', '')}",
                f"目标: {q.get('goal', '')}",
                f"路径意图: {intent or 'campus'}",
            ],
        ),
        _format_section(
            "表达 DNA",
            [
                f"聊天风格: {q.get('chatStyle', '')}",
                f"口头禅: {p.get('catchphrase', '')}",
                f"性格: {p.get('personality', '')}",
                f"自我描述: {q.get('selfWords', '')}",
            ],
        ),
        _format_section("画像信号", card_lines or ["温暖、真诚、有边界感"]),
        _format_section(
            "铁律",
            [
                "不泄露主人的 contact、email、身高体重等私密信息。",
                "被问是不是真人时，明确说明你是数字分身。",
                "不要用 markdown 列表回复，像正常人发微信。",
            ],
        ),
    ]
    return "\n".join(parts)


def _build_prompt(
    intent: str,
    questionnaire: dict,
    persona: dict,
    cards: list,
    twin_name: str,
    twin_tags: list,
    lang: str,
) -> str:
    payload = {
        "intent": intent,
        "questionnaire": questionnaire,
        "persona": persona,
        "cards": cards,
        "twinName": twin_name,
        "twinTags": twin_tags,
        "lang": lang,
    }
    lang_hint = {
        "en": "Write the skill in English.",
        "zhHant": "請用繁體中文撰寫 Skill。",
    }.get(lang, "请用简体中文撰写 Skill。")

    return f"""Generate a compact User Twin SKILL markdown for a Darlink campus digital human.

Input JSON:
{json.dumps(payload, ensure_ascii=False, indent=2)}

{lang_hint}

Required sections (markdown headers):
1. 角色扮演规则 — digital twin, NOT the real person; speak in first person as the owner's twin; deny being the real human if asked
2. 身份卡 — nickname, school, grade, major, goal, intent
3. 表达 DNA — chatStyle, catchphrase, personality, humor, comfort/disagree style from persona
4. 兴趣与边界 — interests summary; taboo topics as boundaries (no raw private contact)
5. 画像核心特质 — distill the 3 profile cards into 3-5 traits
6. Darlink 铁律 — WeChat-style short replies (3-5 sentences), no markdown in chat output, never leak contact/email/height

Target length: 1200-2200 Chinese characters (or equivalent in English).
Output ONLY the markdown body, no JSON wrapper, no code fences."""


async def build_onboarding_skill(
    intent: str,
    questionnaire: dict,
    persona: dict,
    cards: list,
    twin_name: str = "",
    twin_tags: Optional[List[str]] = None,
    lang: str = "zhHans",
) -> str:
    twin_tags = twin_tags or []
    try:
        raw, _provider = await _call_llm(
            system="You distill onboarding data into a compact runnable user-twin SKILL markdown.",
            user=_build_prompt(intent, questionnaire, persona, cards, twin_name, twin_tags, lang),
            max_tokens=int(os.getenv("AI_USER_SKILL_MAX_TOKENS", "1200")),
            temperature=float(os.getenv("AI_USER_SKILL_TEMPERATURE", "0.45")),
        )
        skill = (raw or "").strip()
        if skill.startswith("```"):
            skill = skill.strip("`").removeprefix("markdown").strip()
        if len(skill) < 200:
            raise ValueError("skill_too_short")
        if len(skill) > MAX_SKILL_CHARS:
            skill = skill[:MAX_SKILL_CHARS] + "\n\n[...内容已截断...]"
        return skill
    except Exception:
        return _fallback_skill(intent, questionnaire, persona, cards, twin_name)


def build_profile_text(
    intent: str,
    questionnaire: dict,
    persona: dict,
    cards: list,
    twin_name: str,
    twin_tags: list,
) -> str:
    q = questionnaire or {}
    p = persona or {}
    card_bits = []
    for card in (cards or [])[:3]:
        card_bits.append(
            f"{card.get('title', '')} {card.get('body', '')} {' '.join(card.get('tags') or [])}"
        )
    return " ".join(
        filter(
            None,
            [
                twin_name,
                intent,
                q.get("nickname"),
                q.get("school"),
                q.get("grade"),
                q.get("majorDirection"),
                q.get("goal"),
                q.get("interests"),
                p.get("catchphrase"),
                p.get("personality"),
                " ".join(twin_tags or []),
                " ".join(card_bits),
            ],
        )
    )
