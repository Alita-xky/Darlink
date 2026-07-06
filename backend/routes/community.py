import re

from fastapi import APIRouter, BackgroundTasks, Query
from pydantic import BaseModel

import community_ai
import community_store

router = APIRouter(prefix="/api/community")


class CommunityPostBody(BaseModel):
    user_token: str
    body: str
    tags: list[str] = []
    author_avatar_url: str = ""
    image_url: str = ""
    image_alt: str = ""


class CommunityTwinPostBody(BaseModel):
    user_token: str
    seed: str = ""
    tags: list[str] = []
    author_avatar_url: str = ""


class CommunityLikeBody(BaseModel):
    user_token: str


class CommunityCommentBody(BaseModel):
    user_token: str
    body: str
    reply_to_comment_id: int | None = None


class CommunityTwinCommentBody(BaseModel):
    user_token: str
    body: str = ""
    reply_to_comment_id: int | None = None


class CommunityDeleteBody(BaseModel):
    user_token: str


def _require_user(user_token: str):
    if not user_token:
        return None, {"ok": False, "reason": "auth_required"}
    user = community_store.get_user_by_token(user_token)
    if not user:
        return None, {"ok": False, "reason": "auth_required"}
    return user, None


def _clean_body(text: str, max_len: int):
    value = (text or "").strip()
    if len(value) > max_len:
        value = value[:max_len].rstrip()
    return value


def _clean_tags(tags: list[str]):
    out = []
    for tag in tags or []:
        value = str(tag or "").strip()
        if not value:
            continue
        if not value.startswith("#"):
            value = f"#{value}"
        out.append(value[:32])
        if len(out) >= 4:
            break
    return out


def _clean_image_url(src: str):
    value = str(src or "").strip()
    if not value:
        return ""
    allowed = (
        value.startswith("data:image/")
        or value.startswith("/files/")
        or value.startswith("/static/")
        or value.startswith("https://")
        or value.startswith("http://")
    )
    if not allowed:
        return ""
    return value[:900000]


def _strip_trailing_tags(body: str, tags: list[str]):
    value = (body or "").strip()
    tag_set = {str(tag or "").strip().lower() for tag in tags or [] if str(tag or "").strip()}
    while tag_set:
        matches = list(re.finditer(r"#[\w\u4e00-\u9fff-]+", value))
        if not matches:
            break
        last = matches[-1]
        token = last.group(0)
        if value[last.end():].strip():
            break
        if token.lower() not in tag_set:
            break
        value = value[:last.start()].rstrip()
    return value.strip()


@router.get("/feed")
async def community_feed(user_token: str = Query("", max_length=128), limit: int = Query(30, ge=1, le=50)):
    return {"ok": True, "posts": community_store.list_community_feed(user_token=user_token or None, limit=limit)}


@router.post("/posts")
async def create_post(req: CommunityPostBody, background_tasks: BackgroundTasks):
    user, err = _require_user(req.user_token)
    if err:
        return err
    body = _clean_body(req.body, 1200)
    tags = _clean_tags(req.tags)
    body = _strip_trailing_tags(body, tags) or body
    image_url = _clean_image_url(req.image_url)
    image_alt = _clean_body(req.image_alt, 180)
    if not body and not image_url:
        return {"ok": False, "reason": "empty_body"}
    post = community_store.create_community_post(
        user.id,
        body,
        tags,
        req.author_avatar_url,
        image_url=image_url,
        image_alt=image_alt,
    )
    if community_ai.find_mentioned_community_personas(body):
        background_tasks.add_task(community_ai.schedule_community_mention_reply, post["id"], body, tags=tags)
    else:
        background_tasks.add_task(community_ai.schedule_community_ai_reply, post["id"], body, tags)
    return {"ok": True, "post": post}


@router.post("/posts/twin")
async def create_twin_post(req: CommunityTwinPostBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    seed = _clean_body(req.seed, 600)
    tags = _clean_tags(req.tags)
    author = community_store.get_public_user_summary(user.id)
    body = await community_ai.generate_user_twin_community_post(author, seed=seed, tags=tags)
    body = _strip_trailing_tags(_clean_body(body, 1200), tags) or body
    if not body:
        return {"ok": False, "reason": "empty_body"}
    post = community_store.create_twin_community_post(user.id, body, tags, req.author_avatar_url)
    return {"ok": True, "post": post}


@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: int, req: CommunityLikeBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    result, reason = community_store.toggle_community_like(user.id, post_id)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    return {"ok": True, **result}


@router.post("/posts/{post_id}/delete")
async def delete_post(post_id: int, req: CommunityDeleteBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    result, reason = community_store.delete_community_post(user.id, post_id)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    if reason == "forbidden":
        return {"ok": False, "reason": "forbidden"}
    return {"ok": True, **result}


@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: int, limit: int = Query(50, ge=1, le=100)):
    comments, reason = community_store.list_community_comments(post_id, limit=limit)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    return {"ok": True, "comments": comments}


@router.post("/posts/{post_id}/comments/twin")
async def create_twin_comment(post_id: int, req: CommunityTwinCommentBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    context = community_store.get_community_post_context(post_id)
    if not context:
        return {"ok": False, "reason": "not_found"}
    note = _clean_body(req.body, 400)
    target = community_store.get_community_comment_context(post_id, req.reply_to_comment_id) if req.reply_to_comment_id else None
    author = community_store.get_public_user_summary(user.id)
    body = await community_ai.generate_user_twin_community_reply(
        author,
        context.get("body") or "",
        target_name=(target or {}).get("author_name") or "",
        target_body=(target or {}).get("body") or "",
        user_note=note,
    )
    body = _clean_body(body, 600)
    if not body:
        return {"ok": False, "reason": "empty_body"}
    result, reason = community_store.create_twin_community_comment(user.id, post_id, body, req.reply_to_comment_id)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    return {"ok": True, **result}


@router.post("/posts/{post_id}/comments")
async def create_comment(post_id: int, req: CommunityCommentBody, background_tasks: BackgroundTasks):
    user, err = _require_user(req.user_token)
    if err:
        return err
    body = _clean_body(req.body, 600)
    if not body:
        return {"ok": False, "reason": "empty_body"}
    result, reason = community_store.create_community_comment(user.id, post_id, body, req.reply_to_comment_id)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    trigger_body = body
    mentioned = community_ai.find_mentioned_community_personas(trigger_body)
    reply_to = (result.get("comment") or {}).get("reply_to") or {}
    if not mentioned and reply_to.get("author_type") == "ai":
        trigger_body = f"@{reply_to.get('author_name') or ''} {body}".strip()
        mentioned = community_ai.find_mentioned_community_personas(trigger_body)
    if mentioned:
        background_tasks.add_task(
            community_ai.schedule_community_mention_reply,
            post_id,
            trigger_body,
            trigger_comment_id=result["comment"]["id"],
        )
        return {
            "ok": True,
            **result,
            "ai_reply_pending": True,
            "ai_reply_delay_seconds": community_ai.mention_reply_delay_seconds(),
        }
    return {"ok": True, **result}
