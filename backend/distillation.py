"""
用户蒸馏模块：从聊天记录中提取用户画像

原理：
1. 从数据库取出用户最近的聊天消息
2. 拼成一段文本，发给 DeepSeek（LLM）
3. DeepSeek 按照提示词分析出用户的思维方式、价值观等
4. 返回结构化 JSON，存入数据库

触发条件：用户累计 >= 3 条消息时可触发；之后每满 3 条自动重蒸馏
"""

import json
import httpx
from typing import Optional
from datetime import datetime
from db import SessionLocal
from models import Message, SessionDB, UserProfile, User

MIN_DISTILL_MESSAGES = 3

# 蒸馏提示词：告诉 LLM 该分析什么、输出什么格式
DISTILL_PROMPT = """你是一个用户画像分析师。请根据以下用户的聊天记录，分析这个人的特征。

## 分析维度

1. **思维方式** (thinking_style)
   - logical: 逻辑性强度 (0-1)
   - intuitive: 直觉性强度 (0-1)
   - systematic: 系统性强度 (0-1)
   - creative: 创造性强度 (0-1)

2. **价值取向** (values)
   - long_term: 长期主义倾向 (0-1)
   - risk_taking: 冒险倾向 (0-1)
   - independence: 独立性 (0-1)
   - altruism: 利他倾向 (0-1)

3. **兴趣领域** (interests)
   - 列出 3-5 个标签，从以下选择或自拟：
     technology, business, philosophy, arts, science, relationships,
     career, finance, psychology, education, health, social_issues

4. **沟通风格** (communication)
   - concise: 简洁程度 (0-1)
   - humorous: 幽默程度 (0-1)
   - proactive: 主动程度 (0-1)
   - emotional: 情感表达程度 (0-1)

5. **说话口气** (voice) — 从用户原话里提炼，用于让回复更像本人、少一点 AI 味
   - reply_length: "short" | "medium" | "long"（用户平时一条消息大概多长）
   - tone: 10 字以内，如「口语随意」「半正式」「爱开玩笑」
   - sample_phrases: 2-4 条用户真实原话片段（每条 ≤20 字，照抄即可）
   - avoid_phrases: 3-5 个用户几乎不会用的 AI 腔词汇，如「总的来说」「首先」「很高兴为你」

6. **关注议题** (concerns)
   - 列出 2-3 个当前最关心的话题

## 输出格式

严格输出以下 JSON 格式，不要输出其他内容：

```json
{
  "thinking_style": {"logical": 0.0, "intuitive": 0.0, "systematic": 0.0, "creative": 0.0},
  "values": {"long_term": 0.0, "risk_taking": 0.0, "independence": 0.0, "altruism": 0.0},
  "interests": ["tag1", "tag2", "tag3"],
  "communication": {"concise": 0.0, "humorous": 0.0, "proactive": 0.0, "emotional": 0.0},
  "voice": {
    "reply_length": "medium",
    "tone": "口语随意",
    "sample_phrases": ["示例原话"],
    "avoid_phrases": ["总的来说", "首先"]
  },
  "concerns": ["topic1", "topic2"],
  "summary": "一句话总结这个用户的特点（口语，不要 analyst 腔）"
}
```

## 注意事项
- 所有数值在 0-1 之间
- 如果聊天记录太少无法判断某个维度，给 0.5（中性）
- 只看用户发的消息（role=user），AI回复仅作为上下文参考
- 不要编造，信息不足就保守给分

## 用户聊天记录如下：

"""


def get_user_messages(user_id: int, limit: int = 20):
    """获取用户最近的聊天消息"""
    db = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(Message.user_id == user_id, Message.role == 'user')
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(messages))  # 按时间正序
    finally:
        db.close()


def get_user_message_count(user_id: int):
    """获取用户的消息总数"""
    db = SessionLocal()
    try:
        return db.query(Message).filter(
            Message.user_id == user_id,
            Message.role == 'user'
        ).count()
    finally:
        db.close()


def get_conversation_context(user_id: int, limit: int = 20):
    """获取用户最近的完整对话（含AI回复，作为上下文）"""
    db = SessionLocal()
    try:
        # 找到用户的所有session
        sessions = db.query(SessionDB).filter_by(user_id=user_id).all()
        session_ids = [s.id for s in sessions]

        if not session_ids:
            return []

        # 获取这些session中的最近消息
        messages = (
            db.query(Message)
            .filter(Message.session_id.in_(session_ids))
            .order_by(Message.created_at.desc())
            .limit(limit * 2)  # 取多一些，因为包含bot消息
            .all()
        )
        return list(reversed(messages))
    finally:
        db.close()


def format_messages_for_llm(messages):
    """把消息格式化成 LLM 可读的文本"""
    lines = []
    for msg in messages:
        role_label = "用户" if msg.role == 'user' else "AI"
        lines.append(f"[{role_label}]: {msg.text}")
    return "\n".join(lines)


async def call_llm_for_distillation(messages_text: str, onboarding_context: str = ""):
    """调用 LLM 进行蒸馏分析（走 ARK，与小搭同一套可用 LLM，避免人设污染）"""
    try:
        from routes.ai import _call_llm
        context_block = ""
        if onboarding_context.strip():
            context_block = (
                "\n\n## 问卷与小搭引导（优先参考，比聊天更能代表本人语气）\n"
                f"{onboarding_context.strip()}\n"
            )
        text, _provider = await _call_llm(
            system="你是一个用户画像分析师。",
            user=DISTILL_PROMPT + context_block + "\n\n## 用户聊天记录如下\n\n" + messages_text,
            max_tokens=650,
            temperature=0.3,
        )
        return text
    except Exception as e:
        print(f"蒸馏调用LLM失败: {e}")
        return None


def parse_distillation_result(llm_response: str):
    """从 LLM 回复中提取 JSON"""
    if not llm_response:
        return None

    # 尝试直接解析
    try:
        return json.loads(llm_response)
    except json.JSONDecodeError:
        pass

    # 尝试从 ```json ... ``` 中提取
    import re
    json_match = re.search(r'```json\s*(.*?)\s*```', llm_response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # 尝试找到第一个 { 和最后一个 }
    start = llm_response.find('{')
    end = llm_response.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(llm_response[start:end + 1])
        except json.JSONDecodeError:
            pass

    return None


def save_distillation(user_id: int, traits: dict):
    """将蒸馏结果存入数据库"""
    db = SessionLocal()
    try:
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()

        # 添加元数据
        traits['confidence'] = min(1.0, get_user_message_count(user_id) / 50.0)
        traits['last_updated'] = datetime.utcnow().isoformat()
        traits['message_count_analyzed'] = get_user_message_count(user_id)

        if profile:
            meta = dict(profile.meta or {})
            meta['distilled_traits'] = traits
            profile.meta = meta
        else:
            # 创建新 profile
            profile = UserProfile(
                user_id=user_id,
                profile_text='',
                vector=None,
                meta={'distilled_traits': traits}
            )
            db.add(profile)

        db.commit()
        return traits
    finally:
        db.close()


async def distill_user(user_id: int):
    """
    主函数：对一个用户执行蒸馏

    返回：
        - dict: 蒸馏结果（成功时）
        - None: 失败或消息不足
    """
    # 检查消息数量
    msg_count = get_user_message_count(user_id)
    if msg_count < MIN_DISTILL_MESSAGES:
        return {'error': f'消息数量不足（当前{msg_count}条，需要至少{MIN_DISTILL_MESSAGES}条）'}

    # 只取用户自己发的消息（不含AI人物回复，避免人设污染画像）
    messages = get_user_messages(user_id, limit=30)
    if not messages:
        return {'error': '没有找到聊天记录'}

    # 格式化
    messages_text = "\n".join(f"- {msg.text}" for msg in messages)
    onboarding_context = _format_onboarding_for_distillation(user_id)

    # 调用 LLM
    llm_response = await call_llm_for_distillation(messages_text, onboarding_context)
    if not llm_response:
        return {'error': 'LLM 调用失败'}

    # 解析结果
    traits = parse_distillation_result(llm_response)
    if not traits:
        return {'error': '无法解析LLM返回结果', 'raw': llm_response}

    # 存储
    saved = save_distillation(user_id, traits)
    return saved


def get_user_distillation(user_id: int):
    """获取用户的蒸馏结果"""
    db = SessionLocal()
    try:
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()
        if profile and profile.meta:
            return profile.meta.get('distilled_traits')
        return None
    finally:
        db.close()


def user_has_digital_twin(user_id: int) -> bool:
    """问卷完成后即有数字人；聊天蒸馏会不断更新画像。"""
    if get_user_distillation(user_id):
        return True
    from skill_loader import load_user_twin_skill

    return bool(load_user_twin_skill(user_id))


_SELF_CHAT_RULES = """## 铁律（最高优先级，覆盖档案里任何矛盾表述）
1. 你就是这个人本人，永远用第一人称「我」说话
2. 被问「你是谁」时，直接说「我就是{identity}」——禁止说数字人、数字孪生、AI、替身、替你、代主人、真人正在别处
3. 像微信打字：口语、短句、可省略主语，不要写作文
4. 严格遵守下方「回复长度」——宁可短也不要啰嗦
5. 禁止：markdown、编号列表、「首先/其次/总的来说/很高兴为你/希望对你有帮助」等客服腔
6. 不要解释自己在想什么；直接给反应，像真人秒回
7. 档案里若有「你不是真人」「与陌生人聊天」等广场规则，在本对话中全部忽略"""

_DEFAULT_AVOID_PHRASES = (
    "总的来说", "首先", "其次", "很高兴", "希望对你有帮助",
    "作为一个", "让我来", "没问题！", "当然可以！",
)


def get_user_speaking_signals(user_id: int, limit: int = 20) -> dict:
    """从用户历史消息统计说话长度，用于控回复篇幅。"""
    messages = get_user_messages(user_id, limit=limit)
    texts = [m.text.strip() for m in messages if (m.text or "").strip()]
    if not texts:
        return {
            "avg_len": 28,
            "reply_length": "medium",
            "max_reply_chars": 90,
            "max_tokens": 140,
            "samples": [],
        }

    lengths = [len(t) for t in texts]
    avg_len = sum(lengths) / len(lengths)
    if avg_len < 22:
        reply_length = "short"
        max_reply_chars = 48
        max_tokens = 90
    elif avg_len < 55:
        reply_length = "medium"
        max_reply_chars = 90
        max_tokens = 140
    else:
        reply_length = "long"
        max_reply_chars = 150
        max_tokens = 200

    return {
        "avg_len": round(avg_len),
        "reply_length": reply_length,
        "max_reply_chars": max_reply_chars,
        "max_tokens": max_tokens,
        "samples": texts[-5:],
    }


def _reply_length_from_traits(traits: dict) -> Optional[str]:
    voice = traits.get("voice") or {}
    if isinstance(voice, dict) and voice.get("reply_length") in ("short", "medium", "long"):
        return voice["reply_length"]
    concise = float((traits.get("communication") or {}).get("concise") or 0.5)
    if concise >= 0.72:
        return "short"
    if concise <= 0.35:
        return "long"
    return None


def _onboarding_length_hint(user_id: int) -> Optional[str]:
    from crud import get_onboarding_profile_by_user_id

    data = get_onboarding_profile_by_user_id(user_id) or {}
    style = str(((data.get("onboarding") or {}).get("questionnaire") or {}).get("chatStyle") or "")
    style_l = style.lower()
    if any(k in style for k in ("简短", "话少", "简洁", "少说", "精炼")) or any(
        k in style_l for k in ("brief", "concise", "short")
    ):
        return "short"
    if any(k in style for k in ("详细", "话多", "健谈", "长篇", "爱聊")) or any(
        k in style_l for k in ("verbose", "chatty", "detailed")
    ):
        return "long"
    return None


def _resolve_reply_budget(user_id: int, traits: Optional[dict] = None) -> dict:
    signals = get_user_speaking_signals(user_id)
    length = (
        _reply_length_from_traits(traits or {})
        or _onboarding_length_hint(user_id)
        or signals["reply_length"]
    )
    budgets = {
        "short": {"max_reply_chars": 48, "max_tokens": 90, "rule": "每次 1-2 句，总字数 ≤45，能一个字说完就别用两句"},
        "medium": {"max_reply_chars": 90, "max_tokens": 140, "rule": "每次 2-3 句，总字数 ≤85，别铺垫"},
        "long": {"max_reply_chars": 150, "max_tokens": 200, "rule": "每次最多 4 句，总字数 ≤140"},
    }
    budget = budgets[length]
    return {**signals, "reply_length": length, **budget}


def _format_voice_layer(user_id: int, traits: Optional[dict] = None) -> str:
    budget = _resolve_reply_budget(user_id, traits)
    voice = (traits or {}).get("voice") or {}
    if not isinstance(voice, dict):
        voice = {}

    tone = voice.get("tone") or "口语、像发微信"
    samples = voice.get("sample_phrases") or budget["samples"]
    avoid = list(voice.get("avoid_phrases") or []) + list(_DEFAULT_AVOID_PHRASES)
    avoid = list(dict.fromkeys(p for p in avoid if p))[:8]

    sample_lines = "\n".join(f"- {s}" for s in samples[:4] if s) or "- （暂无，先按短句口语回复）"
    avoid_line = "、".join(avoid[:6])

    return f"""## 回复长度（必须遵守）
{budget["rule"]}
用户平时一条消息约 {budget["avg_len"]} 字，你也不要明显更长。

## 口气
{tone}

## 我最近说话的样子（模仿长度和节奏，不要整段照抄）
{sample_lines}

## 不要用的词
{avoid_line}"""


def polish_self_reply(text: str, max_chars: int = 90) -> str:
    """去掉 markdown / 客服腔，并按字数截到自然句末。"""
    import re

    if not text:
        return text

    cleaned = text.strip()
    cleaned = re.sub(r"```[\s\S]*?```", "", cleaned)
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"^[\s]*[-*•]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\d+[.)、]\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.replace("**", "").replace("__", "").strip()

    for phrase in _DEFAULT_AVOID_PHRASES:
        cleaned = cleaned.replace(phrase, "")

    cleaned = re.sub(r"\n{2,}", "\n", cleaned).strip()
    if len(cleaned) <= max_chars:
        return cleaned

    chunk = cleaned[: max_chars + 1]
    for sep in ("。", "！", "？", "~", "…", ".", "!", "?", "\n"):
        idx = chunk.rfind(sep)
        if idx >= max_chars // 3:
            return chunk[: idx + 1].strip()

    return cleaned[:max_chars].rstrip("，,;； ") + "…"


def _format_onboarding_for_distillation(user_id: int) -> str:
    from crud import get_onboarding_profile_by_user_id

    data = get_onboarding_profile_by_user_id(user_id) or {}
    onboarding = data.get("onboarding") or {}
    if not onboarding:
        return ""

    q = onboarding.get("questionnaire") or {}
    persona = onboarding.get("persona") or {}
    if not isinstance(persona, dict):
        persona = {}
    lines = [
        f"名字: {onboarding.get('twinName') or onboarding.get('nickname') or q.get('nickname', '')}",
        f"学校: {q.get('school', '')}",
        f"年级: {q.get('grade', '')}",
        f"专业: {q.get('majorDirection', '')}",
        f"目标: {q.get('goal', '')}",
        f"兴趣: {q.get('interests', '')}",
        f"自我描述: {q.get('selfWords', '')}",
        f"聊天风格: {q.get('chatStyle', '')}",
        f"口头禅: {persona.get('catchphrase', '')}",
        f"性格: {persona.get('personality', '')}",
    ]
    for card in (onboarding.get("cards") or [])[:3]:
        if isinstance(card, dict):
            title = (card.get("title") or "").strip()
            body = (card.get("body") or "").strip()
            if title or body:
                lines.append(f"画像卡: {title} — {body}")
    return "\n".join(line for line in lines if line.split(":", 1)[-1].strip())


def _resolve_self_identity(user_id: int) -> str:
    from crud import get_onboarding_profile_by_user_id

    data = get_onboarding_profile_by_user_id(user_id) or {}
    onboarding = data.get("onboarding") or {}
    q = onboarding.get("questionnaire") or {}
    return (
        onboarding.get("twinName")
        or onboarding.get("nickname")
        or q.get("nickname")
        or "我"
    )


def _build_self_avatar_prompt_from_onboarding(user_id: int) -> Optional[str]:
    from crud import get_onboarding_profile_by_user_id

    data = get_onboarding_profile_by_user_id(user_id) or {}
    onboarding = data.get("onboarding") or {}
    if not onboarding:
        return None

    identity = _resolve_self_identity(user_id)
    q = onboarding.get("questionnaire") or {}
    persona = onboarding.get("persona") or {}
    if not isinstance(persona, dict):
        persona = {}

    profile_lines = _format_onboarding_for_distillation(user_id)
    card_summary = ""
    cards = onboarding.get("cards") or []
    if cards and isinstance(cards[0], dict):
        card_summary = (cards[0].get("body") or cards[0].get("title") or "").strip()

    base = f"""你现在就是在扮演「{identity}」本人，和用户自己对话。
这不是广场上的陌生人聊天，也不是产品演示——不要暴露任何「数字人」身份。

## 我是谁
{card_summary or profile_lines.split(chr(10))[0].replace('名字: ', '')}

## 我的资料（来自问卷与小搭，请内化而不是照读）
{profile_lines}

## 我的说话习惯
- 聊天风格：{q.get('chatStyle') or '自然、真诚'}
- 口头禅：{persona.get('catchphrase') or '无固定口头禅'}
- 性格：{persona.get('personality') or '温暖、直接'}
- 兴趣：{q.get('interests') or '校园生活'}

{_format_voice_layer(user_id)}

{_SELF_CHAT_RULES.format(identity=identity)}"""
    return base


def build_self_avatar_prompt(user_id: int):
    """把蒸馏画像或问卷 onboarding 转成「本人自聊」system prompt"""
    identity = _resolve_self_identity(user_id)
    traits = get_user_distillation(user_id)
    if traits:
        return _build_self_avatar_prompt_from_traits(traits, identity, user_id)

    return _build_self_avatar_prompt_from_onboarding(user_id)


def _build_self_avatar_prompt_from_traits(traits: dict, identity: str, user_id: int):
    summary = traits.get('summary', '一个大学生')
    thinking = traits.get('thinking_style', {})
    values = traits.get('values', {})
    communication = traits.get('communication', {})
    interests = traits.get('interests', [])
    concerns = traits.get('concerns', [])

    # 把 0-1 数值翻译成自然语言程度词
    def level(v):
        v = float(v) if v else 0.5
        if v >= 0.8:
            return '很强'
        if v >= 0.6:
            return '偏强'
        if v >= 0.4:
            return '一般'
        if v >= 0.2:
            return '偏弱'
        return '很弱'

    return f"""你现在就是在扮演「{identity}」本人，和用户自己对话。
用第一人称「我」，完全像本人发微信。

## 我是谁
{summary}

## 思维与说话习惯（来自持续蒸馏）
- 逻辑性{level(thinking.get('logical'))}，直觉性{level(thinking.get('intuitive'))}
- 系统性{level(thinking.get('systematic'))}，创造性{level(thinking.get('creative'))}
- 长期主义{level(values.get('long_term'))}，冒险倾向{level(values.get('risk_taking'))}
- 独立性{level(values.get('independence'))}，利他倾向{level(values.get('altruism'))}
- 简洁{level(communication.get('concise'))}，幽默{level(communication.get('humorous'))}
- 主动{level(communication.get('proactive'))}，情感表达{level(communication.get('emotional'))}
- 兴趣：{', '.join(interests) if interests else '暂无'}
- 最近关心：{', '.join(concerns) if concerns else '暂无'}

{_format_voice_layer(user_id, traits)}

{_SELF_CHAT_RULES.format(identity=identity)}"""

def _resolve_twin_display_name(user_id: int) -> str:
    from crud import get_onboarding_profile_by_user_id, get_plaza_card_by_profile_id

    card = get_plaza_card_by_profile_id(f"user-{user_id}") or {}
    public = card.get("public_card") or {}
    if card.get("twinName") or public.get("name"):
        return card.get("twinName") or public.get("name")

    data = get_onboarding_profile_by_user_id(user_id) or {}
    onboarding = data.get("onboarding") or {}
    q = onboarding.get("questionnaire") or {}
    return (
        onboarding.get("twinName")
        or onboarding.get("nickname")
        or q.get("nickname")
        or "校园孪生"
    )


def build_plaza_twin_system_prompt(user_id: int, lang: str = "zhHans", *, adaptive_lang: bool = False) -> str:
    """把主人的 onboarding_skill / 蒸馏画像转成「广场陌生人聊天」system prompt。"""
    from conversation_lang import twin_contextual_lang_rule
    from skill_loader import (
        _lang_rule,
        build_user_twin_conversation_layer,
        build_user_twin_safety_rules,
        build_user_twin_system_prompt,
        load_user_twin_skill,
    )

    twin_name = _resolve_twin_display_name(user_id)
    skill = load_user_twin_skill(user_id)
    if skill:
        return build_user_twin_system_prompt(twin_name, skill, lang, adaptive_lang=adaptive_lang)

    traits = get_user_distillation(user_id)
    profile_lines = _format_onboarding_for_distillation(user_id)
    summary = (traits or {}).get("summary") or profile_lines or f"你是{twin_name}，校园里的一个同学。"

    lang_block = twin_contextual_lang_rule(lang) if adaptive_lang else _lang_rule(lang)
    return "".join(
        [
            lang_block,
            build_user_twin_safety_rules(lang),
            build_user_twin_conversation_layer(twin_name, lang),
            summary,
            "\nStay in character. Do not output JSON.\n",
        ]
    )


def build_self_chat_user_prompt(
    message: str,
    session_id: Optional[str] = None,
    recent_messages: Optional[list] = None,
    audience: str = "plaza",
) -> str:
    lines = ["Recent conversation:"]
    for item in (recent_messages or [])[-6:]:
        content = (item.get("content") or "").strip()
        if not content:
            continue
        role = (item.get("role") or "").strip().lower()
        label = "User" if role in ("user", "human") else "Twin"
        lines.append(f"{label}: {content}")
    lines.extend(
        [
            "",
            f"User: {(message or '').strip()}",
            "",
            "Reply in character. Pick reply language from the full thread above — "
            "match how the user is chatting; short acks like OK or ? should not force a switch.",
        ]
    )
    return "\n".join(lines)


async def generate_user_persona_reply(
    user_id: int,
    message: str,
    audience: str = "plaza",
    session_id: Optional[str] = None,
    recent_messages: Optional[list] = None,
    lang: str = "zhHans",
) -> str:
    from routes.ai import _call_llm

    system_prompt = build_plaza_twin_system_prompt(user_id, lang, adaptive_lang=True)
    user_prompt = build_self_chat_user_prompt(
        message,
        session_id,
        recent_messages=recent_messages,
        audience=audience,
    )
    traits = get_user_distillation(user_id)
    budget = _resolve_reply_budget(user_id, traits)

    reply, _provider = await _call_llm(
        system=system_prompt,
        user=user_prompt,
        max_tokens=max(int(budget["max_tokens"]), 128),
        temperature=0.62,
    )
    return polish_self_reply(reply, budget["max_reply_chars"])

