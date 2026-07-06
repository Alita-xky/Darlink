import asyncio
import os
import re

import community_store
from routes.contextual_chat import (
    ContextualChatReq,
    _build_system_prompt,
    _build_user_prompt,
    _call_llm_with_retry,
    _polish_celebrity_reply,
)


COMMUNITY_AI_PERSONAS = {
    "elon-musk": {
        "id": "elon-musk",
        "name": "马*克",
        "title": "First-principles builder · AI reply",
        "avatar": "/files/mask.png",
        "badge": "AI",
        "keywords": [
            "ai",
            "人工智能",
            "产品",
            "创业",
            "工程",
            "代码",
            "prototype",
            "原型",
            "社区",
            "darlink",
            "功能",
            "发布",
            "效率",
            "第一性原理",
            "未来",
            "技术",
        ],
        "fallback": "先别把它做成大平台，先验证一个最小闭环：有人发、有人回、有人愿意再回来。社区的火箭也是从一个可重复的小发动机开始。",
    },
    "shing-tung-yau": {
        "id": "shing-tung-yau",
        "name": "丘*桐",
        "title": "Geometry and deep work · AI reply",
        "avatar": "/files/qiuchengtong.png",
        "badge": "AI",
        "keywords": [
            "数学",
            "几何",
            "科研",
            "研究",
            "论文",
            "学习",
            "定义",
            "证明",
            "问题",
            "结构",
            "理论",
            "课堂",
            "考试",
            "学术",
        ],
        "fallback": "这个问题先不要急着求答案。把概念说清楚，把条件列清楚，常常一半的困难就已经消失了。",
    },
    "jackie-chan": {
        "id": "jackie-chan",
        "name": "成*",
        "title": "Action discipline · AI reply",
        "avatar": "/files/chenglong.png",
        "badge": "AI",
        "keywords": [
            "行动",
            "坚持",
            "训练",
            "压力",
            "失败",
            "勇气",
            "练习",
            "电影",
            "动作",
            "挑战",
            "害怕",
            "开心",
            "幽默",
            "基本功",
        ],
        "fallback": "先动起来，不要等状态完美。很多好动作都是摔过几次以后才知道怎么站稳，慢慢练，会越来越顺。",
    },
}


def _clean_reply(text: str, limit: int = 180) -> str:
    value = " ".join(str(text or "").strip().split())
    if len(value) > limit:
        value = value[:limit].rstrip("，。,.!！?？ ") + "..."
    return value


def choose_community_ai_persona(body: str, tags: list[str] | None = None):
    text = f"{body or ''} {' '.join(tags or [])}".lower()
    scores = {}
    for persona_id, persona in COMMUNITY_AI_PERSONAS.items():
        score = 0
        for keyword in persona["keywords"]:
            if keyword.lower() in text:
                score += 1
        scores[persona_id] = score

    best_id = max(scores, key=lambda key: (scores[key], 1 if key == "elon-musk" else 0))
    return COMMUNITY_AI_PERSONAS[best_id]


COMMUNITY_AI_MENTION_ALIASES = {
    "elon-musk": ["马*克", "马斯克", "musk", "elon", "elon musk", "elonmusk"],
    "shing-tung-yau": ["丘*桐", "丘成桐", "yau", "shing-tung yau", "shing tung yau"],
    "jackie-chan": ["成*", "成龙", "jackie", "jackie chan", "chenglong", "cheng long"],
}


def _first_mention_index(text: str, aliases: list[str]) -> int | None:
    lowered = str(text or "").lower()
    best = None
    for alias in aliases:
        needle = f"@{str(alias).lower()}"
        idx = lowered.find(needle)
        if idx >= 0 and (best is None or idx < best):
            best = idx
    return best


def find_mentioned_community_personas(text: str):
    raw = str(text or "")
    matches = []
    for persona_id, aliases in COMMUNITY_AI_MENTION_ALIASES.items():
        idx = _first_mention_index(raw, aliases)
        if idx is not None:
            matches.append((idx, persona_id))
    if not matches and re.search(r"@(?:ai|机器人|機器人|小搭)(?:\s|$|[，。,.!！?？:：])", raw, re.I):
        return [choose_community_ai_persona(raw, [])]
    matches.sort(key=lambda item: item[0])
    out = []
    seen = set()
    for _idx, persona_id in matches:
        if persona_id in seen:
            continue
        seen.add(persona_id)
        out.append(COMMUNITY_AI_PERSONAS[persona_id])
        if len(out) >= 1:
            break
    return out


def _community_context(persona: dict) -> str:
    return (
        "你正在 Darlink 社区里回复一条真人用户刚发布的帖子。"
        f"你的公开显示名是{persona['name']}，这是一种风格化数字人，不是真人官方账号。"
        "回复应像社区评论：自然、有观点、短，不要写成客服说明。"
    )


async def generate_community_ai_reply(
    persona: dict,
    body: str,
    tags: list[str] | None = None,
    trigger_body: str = "",
    reply_mode: str = "post",
) -> str:
    if reply_mode == "mention_comment":
        message = (
            f"社区原帖：{body}\n"
            f"用户在评论里@你：{trigger_body}\n"
            "请直接回复这条评论，像社区里的跟帖，不要解释自己是模型。"
        )
    elif reply_mode == "mention_post":
        message = (
            f"用户发帖时@你：{trigger_body or body}\n"
            f"标签：{' '.join(tags or [])}\n"
            "请直接回应用户在帖子里@你的内容，短一点，自然一点。"
        )
    else:
        message = f"请用你的风格回复这条社区帖子：{body}\n标签：{' '.join(tags or [])}"
    req = ContextualChatReq(
        lang="zhHans",
        profile_id=persona["id"],
        profile_name=persona["name"],
        profile_type="celebrity",
        profile_subtitle=persona["title"],
        profile_context=_community_context(persona),
        message=message,
        recent_messages=[],
    )
    try:
        reply, _provider = await _call_llm_with_retry(
            system=_build_system_prompt(req),
            user=_build_user_prompt(req),
            max_tokens=140,
            temperature=0.68,
        )
        reply = _polish_celebrity_reply(req, reply)
        return _clean_reply(reply) or persona["fallback"]
    except Exception:
        return persona["fallback"]



def _user_twin_fallback(author: dict, mode: str = "post") -> str:
    name = str(author.get("name") or "我的数字人").strip()
    if mode == "reply":
        return f"我是{name}，我先接住这个问题：我觉得可以从一个很小的真实感受开始说，不用一下子讲得很完整。"
    return f"我是{name}。今天想在社区里问问大家：最近有没有一个你正在学习、尝试或想找人一起做的小目标？也许我们可以从这里连接起来。"


async def generate_user_twin_community_post(author: dict, seed: str = "", tags: list[str] | None = None) -> str:
    name = str(author.get("name") or "我的数字人").strip()
    title = str(author.get("title") or "Campus member").strip()
    seed_line = f"用户给的方向：{seed}" if seed else "用户没有给方向，请主动发起一个适合校园社区的轻量话题。"
    req = ContextualChatReq(
        lang="zhHans",
        profile_id="user-twin-community-post",
        profile_name=name,
        profile_type="user_twin",
        profile_subtitle=title,
        profile_context=f"你是 Darlink 用户的数字人{name}，代表用户在校园社区发帖。语气自然、像真人社区动态，但要避免冒充真人本人。",
        message=f"{seed_line}\n标签：{' '.join(tags or [])}\n请写一条 80 字以内的社区帖子，可以带一个问题，最多 2 个 hashtag。",
        recent_messages=[],
    )
    try:
        reply, _provider = await _call_llm_with_retry(
            system=_build_system_prompt(req),
            user=_build_user_prompt(req),
            max_tokens=120,
            temperature=0.72,
        )
        return _clean_reply(reply, 220) or _user_twin_fallback(author, "post")
    except Exception:
        return _user_twin_fallback(author, "post")


async def generate_user_twin_community_reply(
    author: dict,
    post_body: str,
    target_name: str = "",
    target_body: str = "",
    user_note: str = "",
) -> str:
    name = str(author.get("name") or "我的数字人").strip()
    title = str(author.get("title") or "Campus member").strip()
    req = ContextualChatReq(
        lang="zhHans",
        profile_id="user-twin-community-reply",
        profile_name=name,
        profile_type="user_twin",
        profile_subtitle=title,
        profile_context=f"你是 Darlink 用户的数字人{name}，正在代用户回复社区里的一条消息。回复要短、自然、有具体回应。",
        message=(
            f"原帖：{post_body or '无'}\n"
            f"要回复的人：{target_name or '社区成员'}\n"
            f"对方消息：{target_body or '无'}\n"
            f"用户补充：{user_note or '没有补充'}\n"
            "请写一条 80 字以内的社区回复，不要解释生成过程。"
        ),
        recent_messages=[],
    )
    try:
        reply, _provider = await _call_llm_with_retry(
            system=_build_system_prompt(req),
            user=_build_user_prompt(req),
            max_tokens=110,
            temperature=0.7,
        )
        return _clean_reply(reply, 180) or _user_twin_fallback(author, "reply")
    except Exception:
        return _user_twin_fallback(author, "reply")


def mention_reply_delay_seconds() -> int:
    return max(0, int(os.getenv("COMMUNITY_AI_MENTION_REPLY_DELAY_SECONDS", "30")))


async def schedule_community_ai_reply(post_id: int, body: str, tags: list[str] | None = None):
    delay = max(0, int(os.getenv("COMMUNITY_AI_REPLY_DELAY_SECONDS", "180")))
    if delay:
        await asyncio.sleep(delay)

    persona = choose_community_ai_persona(body, tags)
    if not community_store.community_post_needs_ai_reply(post_id):
        return

    reply = await generate_community_ai_reply(persona, body, tags)
    if not community_store.community_post_needs_ai_reply(post_id, persona["id"]):
        return
    community_store.create_ai_community_comment(post_id, persona, reply)


async def schedule_community_mention_reply(
    post_id: int,
    trigger_body: str,
    tags: list[str] | None = None,
    trigger_comment_id: int | None = None,
):
    personas = find_mentioned_community_personas(trigger_body)
    if not personas:
        return
    delay = mention_reply_delay_seconds()
    if delay:
        await asyncio.sleep(delay)

    context = community_store.get_community_post_context(post_id)
    if not context:
        return
    post_body = context.get("body") or ""
    post_tags = tags if tags is not None else context.get("tags") or []
    reply_mode = "mention_comment" if trigger_comment_id else "mention_post"
    source = "community_mention_comment" if trigger_comment_id else "community_mention_post"

    for persona in personas:
        if not community_store.community_ai_mention_can_reply(
            post_id,
            persona["id"],
            trigger_comment_id=trigger_comment_id,
            cooldown_seconds=max(30, delay),
        ):
            continue
        reply = await generate_community_ai_reply(
            persona,
            post_body,
            post_tags,
            trigger_body=trigger_body,
            reply_mode=reply_mode,
        )
        if not community_store.community_ai_mention_can_reply(
            post_id,
            persona["id"],
            trigger_comment_id=trigger_comment_id,
            cooldown_seconds=max(30, delay),
        ):
            continue
        community_store.create_ai_community_comment(
            post_id,
            persona,
            reply,
            meta={
                "persona_id": persona["id"],
                "source": source,
                "trigger_comment_id": trigger_comment_id,
                "reply_to_comment_id": trigger_comment_id,
                "trigger_body": str(trigger_body or "")[:240],
            },
            allow_multiple=True,
        )
