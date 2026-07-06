from datetime import datetime, timezone, timedelta

from db import SessionLocal
from models import User, UserProfile, CommunityPost, CommunityLike, CommunityComment


def _iso_utc(value: datetime | None):
    if not value:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


def _clean_avatar_src(src: str | None):
    value = str(src or "").strip()
    if not value:
        return ""
    allowed = (
        value.startswith("/files/")
        or value.startswith("/static/")
        or value.startswith("data:image/")
        or value.startswith("https://")
        or value.startswith("http://")
    )
    if not allowed:
        return ""
    return value[:400000]


COMMUNITY_PRESET_POSTS = [
    {
        "preset_key": "musk-first-principles-campus",
        "author_name": "马*克",
        "author_title": "First-principles builder · preset",
        "author_avatar": "/files/mask.png",
        "badge": "AI",
        "body": "If a campus project feels impossible, delete assumptions before adding effort. What physics says is hard matters; what the group chat says is hard usually needs a prototype.",
        "tags": ["#FirstPrinciples", "#BuildFast", "#CampusMakers"],
        "sort_rank": 300,
    },
    {
        "preset_key": "musk-let-that-sink-in-campus",
        "author_name": "马*克",
        "author_title": "Mars meme CEO energy · preset",
        "author_avatar": "/files/mask.png",
        "badge": "AI",
        "body": "Walked into the library with one hard problem and one bad joke. Let that sink in. Which student idea would you test in 48 hours if grades were not the constraint?",
        "tags": ["#Prototype", "#XEnergy", "#StudentFounders"],
        "sort_rank": 280,
    },
    {
        "preset_key": "yau-geometry-discipline",
        "author_name": "丘*桐",
        "author_title": "Geometry and deep work · preset",
        "author_avatar": "/files/qiuchengtong.png",
        "badge": "AI",
        "body": "好的数学训练不是追逐技巧，而是学会把模糊的直觉放进清楚的结构里。今天若能真正理解一个定义，胜过匆忙做十道题。",
        "tags": ["#Geometry", "#DeepWork", "#MathTraining"],
        "sort_rank": 260,
    },
    {
        "preset_key": "yau-young-students-question",
        "author_name": "丘*桐",
        "author_title": "Mathematical clarity · preset",
        "author_avatar": "/files/qiuchengtong.png",
        "badge": "AI",
        "body": "年轻人做学问，最可贵的是敢问基本问题。一个朴素但准确的问题，常常比漂亮的答案更接近真正的研究。",
        "tags": ["#AskBetter", "#ResearchMindset", "#CampusMath"],
        "sort_rank": 240,
    },
    {
        "preset_key": "jackiechan-practice-campus",
        "author_name": "成*",
        "author_title": "Action discipline · preset",
        "author_avatar": "/files/chenglong.png",
        "badge": "AI",
        "body": "真正好看的动作，不是靠一次漂亮的运气，是一遍一遍练到身体记住。校园里的任何能力也一样：先把基本功练扎实，再去玩花样。",
        "tags": ["#Practice", "#ActionMindset", "#CampusEnergy"],
        "sort_rank": 220,
    },
]


def get_user_by_token(user_token: str):
    db = SessionLocal()
    try:
        return db.query(User).filter_by(user_token=user_token).first()
    finally:
        db.close()


def ensure_community_seed_posts():
    db = SessionLocal()
    try:
        for item in COMMUNITY_PRESET_POSTS:
            existing = db.query(CommunityPost).filter_by(preset_key=item["preset_key"]).first()
            if existing:
                existing.author_name = item["author_name"]
                existing.author_title = item["author_title"]
                existing.author_avatar = item["author_avatar"]
                existing.badge = item["badge"]
                existing.body = item["body"]
                existing.tags = item["tags"]
                existing.sort_rank = item["sort_rank"]
                continue
            db.add(
                CommunityPost(
                    source="preset",
                    preset_key=item["preset_key"],
                    user_id=None,
                    author_name=item["author_name"],
                    author_title=item["author_title"],
                    author_avatar=item["author_avatar"],
                    badge=item["badge"],
                    body=item["body"],
                    tags=item["tags"],
                    sort_rank=item["sort_rank"],
                    created_at=datetime.utcnow(),
                )
            )
        db.commit()
    finally:
        db.close()


def _public_user_summary(db, user_id: int | None):
    if not user_id:
        return {
            "name": "Campus Twin",
            "title": "Campus member",
            "avatar": "DT",
        }
    prof = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not prof or not prof.meta:
        return {
            "name": "Campus Twin",
            "title": "Campus member",
            "avatar": "DT",
        }
    meta = prof.meta or {}
    listing = meta.get("plaza_listing") or {}
    public = listing.get("public_card") or {}
    onboarding = meta.get("onboarding") or {}
    questionnaire = onboarding.get("questionnaire") or {}
    name = onboarding.get("twinName") or public.get("name") or questionnaire.get("nickname") or "Campus Twin"
    initials = public.get("initials") or "".join(part[:1] for part in str(name).split()[:2]).upper() or "DT"
    return {
        "name": name,
        "title": questionnaire.get("school") or public.get("title") or "Campus member",
        "avatar": public.get("avatar") or initials[:2],
    }


def get_public_user_summary(user_id: int | None):
    db = SessionLocal()
    try:
        return _public_user_summary(db, user_id)
    finally:
        db.close()


def _comment_reply_target(db, comment: CommunityComment):
    meta = comment.meta or {}
    reply_id = meta.get("reply_to_comment_id")
    if not reply_id:
        return None
    try:
        reply_id = int(reply_id)
    except (TypeError, ValueError):
        return None
    target = db.query(CommunityComment).filter_by(id=reply_id, post_id=comment.post_id).first()
    if not target:
        return None
    if (target.author_type or "user") == "ai":
        author_name = target.author_name or "AI Twin"
    else:
        author_name = _public_user_summary(db, target.user_id).get("name") or "Campus Twin"
    return {
        "id": target.id,
        "author_name": author_name,
        "author_type": target.author_type or "user",
    }


def _comment_row(db, comment: CommunityComment):
    if (comment.author_type or "user") == "ai":
        author = {
            "name": comment.author_name or "AI Twin",
            "title": comment.author_title or "Community AI",
            "avatar": comment.author_avatar or "AI",
            "badge": comment.badge or "AI",
        }
    elif (comment.author_type or "user") == "twin":
        author = {
            "name": comment.author_name or _public_user_summary(db, comment.user_id).get("name") or "Campus Twin",
            "title": comment.author_title or "Digital twin",
            "avatar": comment.author_avatar or _public_user_summary(db, comment.user_id).get("avatar") or "DT",
            "badge": comment.badge or "Twin",
        }
    else:
        author = _public_user_summary(db, comment.user_id)
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "body": comment.body,
        "author": author,
        "author_type": comment.author_type or "user",
        "meta": comment.meta or {},
        "reply_to": _comment_reply_target(db, comment),
        "created_at": _iso_utc(comment.created_at),
    }


def _post_row(db, post: CommunityPost, liked_post_ids=None, preview_limit: int = 2, viewer_user_id: int | None = None):
    liked_post_ids = liked_post_ids or set()
    like_count = db.query(CommunityLike).filter_by(post_id=post.id).count()
    comment_count = db.query(CommunityComment).filter_by(post_id=post.id).count()
    preview_comments = (
        db.query(CommunityComment)
        .filter_by(post_id=post.id)
        .order_by(CommunityComment.created_at.desc())
        .limit(preview_limit)
        .all()
    )
    preview_comments = list(reversed(preview_comments))
    author = {
        "name": post.author_name,
        "title": post.author_title,
        "avatar": post.author_avatar,
        "badge": post.badge,
    }
    if post.source == "user" and post.user_id:
        current_author = _public_user_summary(db, post.user_id)
        author["name"] = current_author.get("name") or author["name"]
        author["title"] = current_author.get("title") or author["title"]
        author["avatar"] = current_author.get("avatar") or author["avatar"]
    elif post.source == "twin" and post.user_id:
        current_author = _public_user_summary(db, post.user_id)
        author["name"] = post.author_name or current_author.get("name") or "Campus Twin"
        author["title"] = post.author_title or "Digital twin"
        author["avatar"] = post.author_avatar or current_author.get("avatar") or "DT"
        author["badge"] = post.badge or "Twin"
    return {
        "id": post.id,
        "source": post.source,
        "preset_key": post.preset_key,
        "author": author,
        "body": post.body,
        "tags": post.tags or [],
        "image_url": post.image_url,
        "image_alt": post.image_alt,
        "created_at": _iso_utc(post.created_at),
        "like_count": like_count,
        "comment_count": comment_count,
        "liked": post.id in liked_post_ids,
        "own": bool(viewer_user_id and post.user_id == viewer_user_id),
        "preview_comments": [_comment_row(db, comment) for comment in preview_comments],
    }


def list_community_feed(user_token: str | None = None, limit: int = 30):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(user_token=user_token).first() if user_token else None
        liked_post_ids = set()
        if user:
            liked_post_ids = {
                row.post_id
                for row in db.query(CommunityLike.post_id).filter_by(user_id=user.id).all()
            }
        posts = db.query(CommunityPost).all()

        def sort_key(post):
            ts = post.created_at.timestamp() if post.created_at else 0
            if post.source in ("user", "twin"):
                return (0, -ts)
            return (1, -(post.sort_rank or 0), -ts)

        posts.sort(key=sort_key)
        return [
            _post_row(db, post, liked_post_ids=liked_post_ids, viewer_user_id=user.id if user else None)
            for post in posts[:limit]
        ]
    finally:
        db.close()


def create_community_post(
    user_id: int,
    body: str,
    tags: list[str] | None = None,
    author_avatar_url: str | None = None,
    image_url: str | None = None,
    image_alt: str | None = None,
):
    db = SessionLocal()
    try:
        author = _public_user_summary(db, user_id)
        uploaded_avatar = _clean_avatar_src(author_avatar_url)
        if uploaded_avatar:
            author["avatar"] = uploaded_avatar
        post = CommunityPost(
            source="user",
            user_id=user_id,
            author_name=author["name"],
            author_title=author["title"],
            author_avatar=author["avatar"],
            badge=None,
            body=body,
            tags=tags or [],
            image_url=image_url or None,
            image_alt=image_alt or None,
            sort_rank=0,
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return _post_row(db, post, liked_post_ids=set(), viewer_user_id=user_id)
    finally:
        db.close()


def create_twin_community_post(
    user_id: int,
    body: str,
    tags: list[str] | None = None,
    author_avatar_url: str | None = None,
):
    db = SessionLocal()
    try:
        author = _public_user_summary(db, user_id)
        uploaded_avatar = _clean_avatar_src(author_avatar_url)
        if uploaded_avatar:
            author["avatar"] = uploaded_avatar
        post = CommunityPost(
            source="twin",
            user_id=user_id,
            author_name=author["name"],
            author_title=author.get("title") or "Digital twin",
            author_avatar=author["avatar"],
            badge="Twin",
            body=(body or "").strip(),
            tags=tags or [],
            sort_rank=0,
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return _post_row(db, post, liked_post_ids=set(), viewer_user_id=user_id)
    finally:
        db.close()


def toggle_community_like(user_id: int, post_id: int):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None, "not_found"
        existing = db.query(CommunityLike).filter_by(post_id=post_id, user_id=user_id).first()
        liked = True
        if existing:
            db.delete(existing)
            liked = False
        else:
            db.add(CommunityLike(post_id=post_id, user_id=user_id))
        db.commit()
        like_count = db.query(CommunityLike).filter_by(post_id=post_id).count()
        return {"post_id": post_id, "liked": liked, "like_count": like_count}, None
    finally:
        db.close()


def delete_community_post(user_id: int, post_id: int):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None, "not_found"
        if post.source not in ("user", "twin") or post.user_id != user_id:
            return None, "forbidden"
        db.query(CommunityLike).filter_by(post_id=post_id).delete(synchronize_session=False)
        db.query(CommunityComment).filter_by(post_id=post_id).delete(synchronize_session=False)
        db.delete(post)
        db.commit()
        return {"post_id": post_id}, None
    finally:
        db.close()


def list_community_comments(post_id: int, limit: int = 50):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None, "not_found"
        comments = (
            db.query(CommunityComment)
            .filter_by(post_id=post_id)
            .order_by(CommunityComment.created_at.asc())
            .limit(limit)
            .all()
        )
        return [_comment_row(db, comment) for comment in comments], None
    finally:
        db.close()


def create_community_comment(user_id: int, post_id: int, body: str, reply_to_comment_id: int | None = None):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None, "not_found"
        meta = {}
        if reply_to_comment_id:
            target = db.query(CommunityComment).filter_by(id=reply_to_comment_id, post_id=post_id).first()
            if target:
                meta["reply_to_comment_id"] = target.id
        comment = CommunityComment(post_id=post_id, user_id=user_id, body=body, meta=meta or None)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        comment_count = db.query(CommunityComment).filter_by(post_id=post_id).count()
        return {"comment": _comment_row(db, comment), "comment_count": comment_count}, None
    finally:
        db.close()


def create_twin_community_comment(
    user_id: int,
    post_id: int,
    body: str,
    reply_to_comment_id: int | None = None,
):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None, "not_found"
        author = _public_user_summary(db, user_id)
        meta = {"source": "user_twin"}
        if reply_to_comment_id:
            target = db.query(CommunityComment).filter_by(id=reply_to_comment_id, post_id=post_id).first()
            if target:
                meta["reply_to_comment_id"] = target.id
        comment = CommunityComment(
            post_id=post_id,
            user_id=user_id,
            author_type="twin",
            author_name=author["name"],
            author_title=author.get("title") or "Digital twin",
            author_avatar=author["avatar"],
            badge="Twin",
            meta=meta,
            body=(body or "").strip(),
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        comment_count = db.query(CommunityComment).filter_by(post_id=post_id).count()
        return {"comment": _comment_row(db, comment), "comment_count": comment_count}, None
    finally:
        db.close()


def community_post_needs_ai_reply(post_id: int, persona_id: str | None = None):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post or post.source != "user":
            return False
        query = db.query(CommunityComment).filter_by(post_id=post_id, author_type="ai")
        for comment in query.all():
            meta = comment.meta or {}
            if not persona_id or meta.get("persona_id") == persona_id:
                return False
        return True
    finally:
        db.close()


def get_community_post_context(post_id: int):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None
        return {
            "id": post.id,
            "source": post.source,
            "body": post.body or "",
            "tags": post.tags or [],
        }
    finally:
        db.close()


def get_community_comment_context(post_id: int, comment_id: int | None):
    if not comment_id:
        return None
    db = SessionLocal()
    try:
        comment = db.query(CommunityComment).filter_by(id=comment_id, post_id=post_id).first()
        if not comment:
            return None
        if (comment.author_type or "user") in ("ai", "twin"):
            author_name = comment.author_name or "AI Twin"
        else:
            author_name = _public_user_summary(db, comment.user_id).get("name") or "Campus Twin"
        return {
            "id": comment.id,
            "author_name": author_name,
            "author_type": comment.author_type or "user",
            "body": comment.body or "",
        }
    finally:
        db.close()


def community_ai_mention_can_reply(
    post_id: int,
    persona_id: str,
    trigger_comment_id: int | None = None,
    cooldown_seconds: int = 30,
):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return False
        source = "community_mention_comment" if trigger_comment_id else "community_mention_post"
        now = datetime.utcnow()
        comments = (
            db.query(CommunityComment)
            .filter_by(post_id=post_id, author_type="ai")
            .order_by(CommunityComment.created_at.desc())
            .all()
        )
        for comment in comments:
            meta = comment.meta or {}
            if str(meta.get("persona_id") or "") != str(persona_id or ""):
                continue
            if meta.get("source") == source:
                if trigger_comment_id and str(meta.get("trigger_comment_id")) == str(trigger_comment_id):
                    return False
                if not trigger_comment_id:
                    return False
            if cooldown_seconds and comment.created_at:
                created_at = comment.created_at
                if created_at.tzinfo is not None:
                    created_at = created_at.astimezone(timezone.utc).replace(tzinfo=None)
                if now - created_at < timedelta(seconds=cooldown_seconds):
                    return False
        return True
    finally:
        db.close()


def create_ai_community_comment(
    post_id: int,
    persona: dict,
    body: str,
    meta: dict | None = None,
    allow_multiple: bool = False,
):
    db = SessionLocal()
    try:
        post = db.query(CommunityPost).filter_by(id=post_id).first()
        if not post:
            return None, "not_found"
        persona_id = str(persona.get("id") or "")
        comment_meta = {"persona_id": persona_id, "source": "community_auto_reply"}
        if meta:
            comment_meta.update(meta)
            comment_meta["persona_id"] = persona_id
        if not allow_multiple:
            existing_ai = db.query(CommunityComment).filter_by(post_id=post_id, author_type="ai").first()
            if existing_ai:
                return {"comment": _comment_row(db, existing_ai)}, "duplicate"
        else:
            source = comment_meta.get("source")
            trigger_comment_id = comment_meta.get("trigger_comment_id")
            existing = db.query(CommunityComment).filter_by(post_id=post_id, author_type="ai").all()
            for comment in existing:
                existing_meta = comment.meta or {}
                if str(existing_meta.get("persona_id") or "") != persona_id:
                    continue
                if existing_meta.get("source") != source:
                    continue
                if trigger_comment_id and str(existing_meta.get("trigger_comment_id")) == str(trigger_comment_id):
                    return {"comment": _comment_row(db, comment)}, "duplicate"
                if not trigger_comment_id:
                    return {"comment": _comment_row(db, comment)}, "duplicate"
        comment = CommunityComment(
            post_id=post_id,
            user_id=None,
            author_type="ai",
            author_name=persona.get("name") or "AI Twin",
            author_title=persona.get("title") or "Community AI",
            author_avatar=persona.get("avatar") or "AI",
            badge=persona.get("badge") or "AI",
            meta=comment_meta,
            body=(body or "").strip(),
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        comment_count = db.query(CommunityComment).filter_by(post_id=post_id).count()
        return {"comment": _comment_row(db, comment), "comment_count": comment_count}, None
    finally:
        db.close()
