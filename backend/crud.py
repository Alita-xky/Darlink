import uuid
from datetime import datetime, timedelta
from db import SessionLocal
from models import User, EmailVerification, Persona, SessionDB, Message, UserProfile, FriendRequest, PlazaClickStat, DmConversation, DmMessage
from sqlalchemy.exc import IntegrityError
import security


def create_email_verification(email: str) -> str:
    db = SessionLocal()
    try:
        token = str(uuid.uuid4())
        ev = EmailVerification(token=token, email=email)
        db.add(ev)
        db.commit()
        return token
    finally:
        db.close()


# ========== 认证系统：6位验证码 + 密码 ==========

CODE_SEND_COOLDOWN_SECONDS = 60


def get_code_send_cooldown_remaining(email: str, cooldown_seconds: int = CODE_SEND_COOLDOWN_SECONDS) -> int:
    """距离该邮箱可再次发码还剩多少秒，0 表示可以发。"""
    db = SessionLocal()
    try:
        ev = (
            db.query(EmailVerification)
            .filter_by(email=email)
            .order_by(EmailVerification.created_at.desc())
            .first()
        )
        if not ev or not ev.created_at:
            return 0
        elapsed = (datetime.utcnow() - ev.created_at).total_seconds()
        return max(0, int(cooldown_seconds - elapsed))
    finally:
        db.close()


def create_verification_code(email: str) -> str:
    """生成6位数字验证码，10分钟过期，覆盖该邮箱旧验证码。"""
    db = SessionLocal()
    try:
        code = security.generate_code(6)
        expires = datetime.utcnow() + timedelta(minutes=10)
        db.query(EmailVerification).filter_by(email=email).delete()
        ev = EmailVerification(code=code, email=email, expires_at=expires)
        db.add(ev)
        db.commit()
        return code
    finally:
        db.close()


def verify_code(email: str, code: str) -> bool:
    """校验邮箱+验证码，成功后删除该邮箱所有验证码（一次性）。"""
    db = SessionLocal()
    try:
        ev = (
            db.query(EmailVerification)
            .filter_by(email=email, code=code)
            .order_by(EmailVerification.created_at.desc())
            .first()
        )
        if not ev:
            return False
        if ev.expires_at and datetime.utcnow() > ev.expires_at:
            db.delete(ev)
            db.commit()
            return False
        db.query(EmailVerification).filter_by(email=email).delete()
        db.commit()
        return True
    finally:
        db.close()


def email_has_password(email: str) -> bool:
    """该邮箱是否已注册且设了密码（用于区分登录 vs 注册）。"""
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        return bool(user and user.password_hash)
    finally:
        db.close()


def register_user_with_password(email: str, password: str) -> str | None:
    """注册：新用户创建 / 老用户（magic-link 无密码）补设密码。返回 user_token。"""
    db = SessionLocal()
    try:
        pw_hash = security.hash_password(password)
        user = db.query(User).filter_by(email=email).first()
        if user:
            user.password_hash = pw_hash
            user.verified = True
            db.commit()
            return user.user_token
        user_token = str(uuid.uuid4())
        user = User(user_token=user_token, email=email, password_hash=pw_hash, verified=True)
        db.add(user)
        db.commit()
        return user_token
    except IntegrityError:
        db.rollback()
        existing = db.query(User).filter_by(email=email).first()
        return existing.user_token if existing else None
    finally:
        db.close()


def authenticate_user(email: str, password: str) -> str | None:
    """登录：邮箱+密码校验，成功返回 user_token，失败返回 None。"""
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not user.password_hash:
            return None
        if not security.verify_password(password, user.password_hash):
            return None
        return user.user_token
    finally:
        db.close()


def update_user_password(email: str, password: str) -> bool:
    """重置密码：更新已注册用户的密码哈希。"""
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user:
            return False
        user.password_hash = security.hash_password(password)
        db.commit()
        return True
    finally:
        db.close()


def get_user_token_by_email(email: str) -> str | None:
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        return user.user_token if user else None
    finally:
        db.close()


def get_or_create_user_token(email: str) -> str:
    db = SessionLocal()
    try:
        existing = db.query(User).filter_by(email=email).first()
        if existing:
            return existing.user_token

        user_token = str(uuid.uuid4())
        user = User(user_token=user_token, email=email, verified=True)
        db.add(user)
        db.commit()
        return user_token
    except IntegrityError:
        db.rollback()
        existing = db.query(User).filter_by(email=email).first()
        return existing.user_token if existing else None
    finally:
        db.close()


def confirm_token_create_user(token: str):
    db = SessionLocal()
    try:
        ev = db.query(EmailVerification).filter_by(token=token).first()
        if not ev:
            return None

        existing = db.query(User).filter_by(email=ev.email).first()
        if existing:
            db.delete(ev)
            db.commit()
            return existing.user_token

        user_token = str(uuid.uuid4())
        user = User(user_token=user_token, email=ev.email, verified=True)
        db.add(user)
        db.delete(ev)
        db.commit()
        return user_token
    except IntegrityError:
        db.rollback()
        existing = db.query(User).filter_by(email=getattr(ev, 'email', None)).first() if 'ev' in locals() and ev else None
        if existing:
            try:
                if ev:
                    db.delete(ev)
                    db.commit()
            except Exception:
                db.rollback()
            return existing.user_token
        return None
    finally:
        db.close()


def get_personas():
    db = SessionLocal()
    try:
        return db.query(Persona).all()
    finally:
        db.close()


def create_session(user_token: str, persona_id: int):
    return create_session_with_skill(user_token, persona_id, None)


def create_session_with_skill(user_token: str, persona_id: int, skill_name=None):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(user_token=user_token).first()
        if not user:
            return None
        sid = str(uuid.uuid4())
        s = SessionDB(id=sid, user_id=user.id, persona_id=persona_id, skill_name=skill_name)
        db.add(s)
        db.commit()
        return sid
    finally:
        db.close()


def create_self_session(user_token: str):
    """创建自聊 session，persona_id=None，skill_name='self_avatar'"""
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(user_token=user_token).first()
        if not user:
            return None
        sid = str(uuid.uuid4())
        s = SessionDB(id=sid, user_id=user.id, persona_id=None, skill_name='self_avatar')
        db.add(s)
        db.commit()
        return sid
    finally:
        db.close()


def add_message(session_id: str, user_id: int, role: str, text: str, metadata: dict = None):
    db = SessionLocal()
    try:
        m = Message(session_id=session_id, user_id=user_id, role=role, text=text, meta=metadata)
        db.add(m)
        db.commit()
        return m.id
    finally:
        db.close()


def get_messages(session_id: str):
    db = SessionLocal()
    try:
        return db.query(Message).filter_by(session_id=session_id).order_by(Message.created_at).all()
    finally:
        db.close()

def contextual_skill_name(profile_type: str, profile_id: str) -> str:
    return f"ctx:{profile_type}:{profile_id}"


def get_or_create_contextual_session(user_token: str, profile_type: str, profile_id: str):
    skill_name = contextual_skill_name(profile_type, profile_id)
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(user_token=user_token).first()
        if not user:
            return None
        existing = (
            db.query(SessionDB)
            .filter_by(user_id=user.id, skill_name=skill_name)
            .order_by(SessionDB.last_at.desc())
            .first()
        )
        if existing:
            existing.last_at = datetime.utcnow()
            db.commit()
            return existing.id
        sid = str(uuid.uuid4())
        s = SessionDB(id=sid, user_id=user.id, persona_id=None, skill_name=skill_name)
        db.add(s)
        db.commit()
        return sid
    finally:
        db.close()


def get_messages_since(session_id: str, since: datetime):
    db = SessionLocal()
    try:
        return (
            db.query(Message)
            .filter(Message.session_id == session_id, Message.created_at >= since)
            .order_by(Message.created_at)
            .all()
        )
    finally:
        db.close()


def touch_session(session_id: str):
    db = SessionLocal()
    try:
        session = db.query(SessionDB).filter_by(id=session_id).first()
        if session:
            session.last_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


def get_session_for_user(session_id: str, user_token: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(user_token=user_token).first()
        if not user:
            return None
        return db.query(SessionDB).filter_by(id=session_id, user_id=user.id).first()
    finally:
        db.close()


HISTORY_RETENTION_DAYS = 7


def history_cutoff() -> datetime:
    return datetime.utcnow() - timedelta(days=HISTORY_RETENTION_DAYS)



def get_user_by_token(user_token: str):
    db = SessionLocal()
    try:
        return db.query(User).filter_by(user_token=user_token).first()
    finally:
        db.close()


def get_session(session_id: str):
    db = SessionLocal()
    try:
        return db.query(SessionDB).filter_by(id=session_id).first()
    finally:
        db.close()


def upsert_user_profile(user_id: int, profile_text: str, vector: list):
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(user_id=user_id).first()
        if prof:
            prof.profile_text = profile_text
            prof.vector = vector
        else:
            prof = UserProfile(user_id=user_id, profile_text=profile_text, vector=vector)
            db.add(prof)
        db.commit()
        return prof
    finally:
        db.close()


def get_all_profiles():
    db = SessionLocal()
    try:
        return db.query(UserProfile).all()
    finally:
        db.close()


def get_user_profile(user_id: int):
    db = SessionLocal()
    try:
        return db.query(UserProfile).filter_by(user_id=user_id).first()
    finally:
        db.close()


def parse_user_profile_id(profile_id: str):
    pid = (profile_id or "").strip()
    if not pid.startswith("user-"):
        return None
    tail = pid[5:]
    if not tail:
        return None
    try:
        return int(tail.split("-", 1)[0])
    except (ValueError, IndexError):
        return None


def parse_plaza_category_from_profile_id(profile_id: str):
    pid = (profile_id or "").strip()
    user_id = parse_user_profile_id(pid)
    if user_id is None:
        return None
    prefix = f"user-{user_id}-"
    if pid.startswith(prefix):
        category = pid[len(prefix) :]
        if category in {"study", "social", "romance"}:
            return category
    return None


def resolve_plaza_listings(meta: dict) -> dict:
    meta = meta or {}
    listings = dict(meta.get("plaza_listings") or {})
    legacy = meta.get("plaza_listing") or {}
    if legacy.get("published"):
        category = legacy.get("category") or "social"
        if category not in listings:
            listings[category] = dict(legacy)
    return listings


def user_has_published_plaza(meta: dict) -> bool:
    return any((listing or {}).get("published") for listing in resolve_plaza_listings(meta).values())


def upsert_onboarding_profile(
    user_id: int,
    onboarding: dict,
    skill_md: str,
    plaza_listing: dict,
    profile_text: str,
    vector: list,
    plaza_listings: dict | None = None,
    path_onboarding: dict | None = None,
):
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(user_id=user_id).first()
        existing_meta = (prof.meta or {}) if prof else {}
        merged_meta = dict(existing_meta)
        merged_meta["onboarding"] = onboarding
        merged_meta["onboarding_skill"] = skill_md
        merged_meta["plaza_listing"] = plaza_listing
        if plaza_listings is not None:
            merged_paths = dict(resolve_plaza_listings(existing_meta))
            merged_paths.update(plaza_listings)
            merged_meta["plaza_listings"] = merged_paths
        if path_onboarding is not None:
            merged_path_onboarding = dict(existing_meta.get("path_onboarding") or {})
            merged_path_onboarding.update(path_onboarding)
            merged_meta["path_onboarding"] = merged_path_onboarding
        if prof:
            prof.profile_text = profile_text
            prof.vector = vector
            prof.meta = merged_meta
        else:
            prof = UserProfile(
                user_id=user_id,
                profile_text=profile_text,
                vector=vector,
                meta=merged_meta,
            )
            db.add(prof)
        db.commit()
        db.refresh(prof)
        return prof
    finally:
        db.close()


def list_published_plaza_users(limit: int = 50):
    db = SessionLocal()
    try:
        rows = db.query(UserProfile, User).join(User, UserProfile.user_id == User.id).all()
        published = []
        for prof, user in rows:
            meta = prof.meta or {}
            listings = resolve_plaza_listings(meta)
            if not listings:
                continue
            base_onboarding = meta.get("onboarding") or {}
            path_onboarding = meta.get("path_onboarding") or {}
            for category, listing in listings.items():
                if not (listing or {}).get("published"):
                    continue
                path_data = path_onboarding.get(category) or {}
                onboarding = dict(base_onboarding)
                if path_data:
                    onboarding.update(path_data)
                    onboarding["intent"] = path_data.get("intent") or category
                published.append(
                    {
                        "user_id": user.id,
                        "profile": prof,
                        "listing": listing,
                        "onboarding": onboarding,
                        "category": category,
                    }
                )

        def sort_key(item):
            listing = item["listing"]
            published_at = listing.get("published_at") or ""
            return published_at

        published.sort(key=sort_key, reverse=True)
        return published[:limit]
    finally:
        db.close()


def get_plaza_card_by_profile_id(profile_id: str):
    user_id = parse_user_profile_id(profile_id)
    if user_id is None:
        return None
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(user_id=user_id).first()
        if not prof or not prof.meta:
            return None
        meta = prof.meta or {}
        listings = resolve_plaza_listings(meta)
        path_onboarding = meta.get("path_onboarding") or {}
        published = {cat: lst for cat, lst in listings.items() if (lst or {}).get("published")}
        requested_category = parse_plaza_category_from_profile_id(profile_id)
        wants_merged = profile_id.strip() == f"user-{user_id}" and len(published) > 1
        if wants_merged:
            merged_cards = []
            merged_tags = []
            titles = []
            bodies = []
            twin_name = ""
            public_card = {}
            for path_cat in ("study", "social", "romance"):
                listing_item = published.get(path_cat)
                if not listing_item:
                    continue
                path_data = path_onboarding.get(path_cat) or {}
                public = listing_item.get("public_card") or {}
                if not twin_name:
                    twin_name = path_data.get("twinName") or public.get("name") or ""
                if not public_card:
                    public_card = dict(public)
                for card in path_data.get("cards") or []:
                    merged_cards.append({**card, "path": path_cat})
                for tag in (path_data.get("twinTags") or public.get("tags") or []):
                    if tag and tag not in merged_tags:
                        merged_tags.append(tag)
                for card in path_data.get("cards") or []:
                    for tag in card.get("tags") or []:
                        if tag and tag not in merged_tags:
                            merged_tags.append(tag)
                title = public.get("title") or ((path_data.get("cards") or [{}])[0].get("title") if path_data.get("cards") else "")
                body = public.get("body") or ((path_data.get("cards") or [{}])[0].get("body") if path_data.get("cards") else "")
                if title and title not in titles:
                    titles.append(title)
                if body and body not in bodies:
                    bodies.append(body)
            onboarding = dict(meta.get("onboarding") or {})
            return {
                "user_id": user_id,
                "profile_id": f"user-{user_id}",
                "public_card": {
                    **public_card,
                    "name": twin_name or public_card.get("name") or "Campus Twin",
                    "title": " · ".join(titles[:2]),
                    "body": " ".join(bodies[:2]),
                    "tags": merged_tags[:6],
                },
                "category": "multi",
                "cards": merged_cards,
                "school": (onboarding.get("questionnaire") or {}).get("school"),
                "grade": (onboarding.get("questionnaire") or {}).get("grade"),
                "majorDirection": (onboarding.get("questionnaire") or {}).get("majorDirection"),
                "nickname": onboarding.get("nickname") or (onboarding.get("questionnaire") or {}).get("nickname"),
                "twinName": twin_name or onboarding.get("twinName"),
                "intent": "multi",
                "published_paths": list(published.keys()),
            }
        category = requested_category
        listing = None
        if category and category in listings:
            listing = listings.get(category) or {}
        if not listing or not listing.get("published"):
            listing = (meta.get("plaza_listing") or {})
        if not listing.get("published"):
            for candidate in listings.values():
                if candidate.get("published"):
                    listing = candidate
                    category = candidate.get("category") or category
                    break
        if not listing.get("published"):
            return None
        category = category or listing.get("category") or "social"
        path_data = path_onboarding.get(category) or {}
        onboarding = dict(meta.get("onboarding") or {})
        if path_data:
            onboarding.update(path_data)
            onboarding["intent"] = path_data.get("intent") or category
        return {
            "user_id": user_id,
            "profile_id": listing.get("profile_id") or profile_id or f"user-{user_id}-{category}",
            "public_card": listing.get("public_card") or {},
            "category": category,
            "cards": onboarding.get("cards") or [],
            "school": (onboarding.get("questionnaire") or {}).get("school"),
            "grade": (onboarding.get("questionnaire") or {}).get("grade"),
            "majorDirection": (onboarding.get("questionnaire") or {}).get("majorDirection"),
            "nickname": onboarding.get("nickname") or (onboarding.get("questionnaire") or {}).get("nickname"),
            "twinName": onboarding.get("twinName"),
            "intent": onboarding.get("intent") or category,
        }
    finally:
        db.close()


def get_onboarding_profile_by_user_id(user_id: int):
    prof = get_user_profile(user_id)
    if not prof or not prof.meta:
        return None
    meta = prof.meta or {}
    listings = resolve_plaza_listings(meta)
    return {
        "onboarding": meta.get("onboarding"),
        "plaza_listing": meta.get("plaza_listing"),
        "plaza_listings": listings,
        "path_onboarding": meta.get("path_onboarding") or {},
        "published_paths": sorted([k for k, v in listings.items() if (v or {}).get("published")]),
        "onboarding_skill": meta.get("onboarding_skill"),
    }


def patch_user_questionnaire(user_id: int, patch: dict) -> bool:
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(user_id=user_id).first()
        if not prof or not prof.meta:
            return False
        meta = dict(prof.meta or {})
        onboarding = dict(meta.get("onboarding") or {})
        questionnaire = dict(onboarding.get("questionnaire") or {})
        questionnaire.update(patch or {})
        onboarding["questionnaire"] = questionnaire
        meta["onboarding"] = onboarding
        prof.meta = meta
        db.commit()
        return True
    finally:
        db.close()


def _public_user_summary(user_id: int):
    card = get_plaza_card_by_profile_id(f"user-{user_id}")
    if not card:
        return {"user_id": user_id, "profile_id": f"user-{user_id}"}
    public = card.get("public_card") or {}
    return {
        "user_id": user_id,
        "profile_id": card.get("profile_id") or f"user-{user_id}",
        "twinName": card.get("twinName") or public.get("name"),
        "nickname": card.get("nickname"),
        "school": card.get("school"),
        "initials": public.get("initials"),
        "colors": public.get("colors"),
    }


def _friend_request_row(fr: FriendRequest):
    return {
        "id": fr.id,
        "from_user_id": fr.from_user_id,
        "to_user_id": fr.to_user_id,
        "source_profile_id": fr.source_profile_id,
        "status": fr.status,
        "message": fr.message,
        "created_at": fr.created_at.isoformat() if fr.created_at else None,
        "updated_at": fr.updated_at.isoformat() if fr.updated_at else None,
    }


def get_friend_pair_request(from_user_id: int, to_user_id: int):
    db = SessionLocal()
    try:
        return (
            db.query(FriendRequest)
            .filter_by(from_user_id=from_user_id, to_user_id=to_user_id)
            .order_by(FriendRequest.updated_at.desc())
            .first()
        )
    finally:
        db.close()


def get_friend_request_by_id(request_id: int):
    db = SessionLocal()
    try:
        return db.query(FriendRequest).filter_by(id=request_id).first()
    finally:
        db.close()


def create_friend_request(from_user_id: int, to_user_id: int, source_profile_id: str, message: str = ""):
    db = SessionLocal()
    try:
        existing = (
            db.query(FriendRequest)
            .filter_by(from_user_id=from_user_id, to_user_id=to_user_id)
            .order_by(FriendRequest.updated_at.desc())
            .first()
        )
        if existing:
            if existing.status == "accepted":
                return None, "already_friends"
            if existing.status == "pending":
                return None, "already_pending"
            if existing.status == "rejected":
                existing.status = "pending"
                existing.message = message or existing.message
                existing.source_profile_id = source_profile_id
                existing.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing)
                return existing, None
        fr = FriendRequest(
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            source_profile_id=source_profile_id,
            status="pending",
            message=message or "",
        )
        db.add(fr)
        db.commit()
        db.refresh(fr)
        return fr, None
    finally:
        db.close()


def get_friend_request_status(from_user_id: int, to_user_id: int):
    accepted = (
        get_friend_pair_request(from_user_id, to_user_id)
        if from_user_id and to_user_id
        else None
    )
    reverse = get_friend_pair_request(to_user_id, from_user_id)
    if accepted and accepted.status == "accepted":
        return "accepted"
    if reverse and reverse.status == "accepted":
        return "accepted"
    row = get_friend_pair_request(from_user_id, to_user_id)
    if row and row.status == "pending":
        return "pending"
    if reverse and reverse.status == "pending":
        return "incoming_pending"
    return "none"


def list_incoming_requests(user_id: int):
    db = SessionLocal()
    try:
        rows = (
            db.query(FriendRequest)
            .filter_by(to_user_id=user_id, status="pending")
            .order_by(FriendRequest.created_at.desc())
            .all()
        )
        out = []
        for fr in rows:
            item = _friend_request_row(fr)
            item["from_user"] = _public_user_summary(fr.from_user_id)
            out.append(item)
        return out
    finally:
        db.close()


def list_outgoing_requests(user_id: int):
    db = SessionLocal()
    try:
        rows = (
            db.query(FriendRequest)
            .filter_by(from_user_id=user_id, status="pending")
            .order_by(FriendRequest.created_at.desc())
            .all()
        )
        out = []
        for fr in rows:
            item = _friend_request_row(fr)
            item["to_user"] = _public_user_summary(fr.to_user_id)
            out.append(item)
        return out
    finally:
        db.close()


def respond_friend_request(request_id: int, to_user_id: int, accept: bool):
    db = SessionLocal()
    try:
        fr = db.query(FriendRequest).filter_by(id=request_id, to_user_id=to_user_id).first()
        if not fr:
            return None, "not_found"
        if fr.status != "pending":
            return None, "not_pending"
        fr.status = "accepted" if accept else "rejected"
        fr.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(fr)
        return fr, None
    finally:
        db.close()


def list_friends(user_id: int):
    db = SessionLocal()
    try:
        rows = (
            db.query(FriendRequest)
            .filter(
                ((FriendRequest.from_user_id == user_id) | (FriendRequest.to_user_id == user_id))
                & (FriendRequest.status == "accepted")
            )
            .order_by(FriendRequest.updated_at.desc())
            .all()
        )
        friends = []
        seen = set()
        for fr in rows:
            other_id = fr.to_user_id if fr.from_user_id == user_id else fr.from_user_id
            if other_id in seen:
                continue
            seen.add(other_id)
            summary = _public_user_summary(other_id)
            summary["since"] = fr.updated_at.isoformat() if fr.updated_at else None
            friends.append(summary)
        return friends
    finally:
        db.close()


def list_match_candidates(exclude_user_id: int):
    """Return published user profiles that can be scored by the matching API."""
    db = SessionLocal()
    try:
        rows = db.query(UserProfile).filter(UserProfile.user_id != exclude_user_id).all()
        out = []
        for prof in rows:
            meta = prof.meta or {}
            if not user_has_published_plaza(meta):
                continue
            listings = resolve_plaza_listings(meta)
            listing = meta.get("plaza_listing") or {}
            if not listing.get("published") and listings:
                listing = next((item for item in listings.values() if item.get("published")), {})
            out.append(
                {
                    "user_id": prof.user_id,
                    "vector": prof.vector,
                    "meta": meta,
                    "listing": listing,
                    "public_card": listing.get("public_card") or {},
                    "onboarding": meta.get("onboarding") or {},
                }
            )
        return out
    finally:
        db.close()


def get_relationship_map(user_id: int):
    """Return friend relationship status by the other user's id."""
    db = SessionLocal()
    try:
        rows = (
            db.query(FriendRequest)
            .filter(
                (FriendRequest.from_user_id == user_id)
                | (FriendRequest.to_user_id == user_id)
            )
            .all()
        )
        rel = {}
        for fr in rows:
            other = fr.to_user_id if fr.from_user_id == user_id else fr.from_user_id
            if fr.status == "accepted":
                rel[other] = "accepted"
                continue
            if rel.get(other) == "accepted":
                continue
            if fr.status == "pending":
                rel[other] = "pending" if fr.from_user_id == user_id else "incoming_pending"
        return rel
    finally:
        db.close()


def ensure_community_seed_posts():
    """Optional community seed; no-op if not implemented."""
    return None


def increment_plaza_click(item_type: str, item_id: str, name: str = "", meta: str = "") -> dict:
    db = SessionLocal()
    try:
        row = (
            db.query(PlazaClickStat)
            .filter_by(item_type=item_type, item_id=item_id)
            .first()
        )
        if not row:
            row = PlazaClickStat(
                item_type=item_type,
                item_id=item_id,
                name=name or "",
                meta=meta or "",
                count=0,
            )
            db.add(row)
        row.count = int(row.count or 0) + 1
        if name:
            row.name = name
        if meta:
            row.meta = meta
        row.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(row)
        return {
            "id": row.item_id,
            "type": row.item_type,
            "name": row.name or "",
            "meta": row.meta or "",
            "count": row.count,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }
    finally:
        db.close()


def get_plaza_leaderboard(limit: int = 3) -> list:
    db = SessionLocal()
    try:
        rows = (
            db.query(PlazaClickStat)
            .filter(PlazaClickStat.count > 0)
            .order_by(PlazaClickStat.count.desc(), PlazaClickStat.updated_at.desc())
            .limit(max(1, min(int(limit or 3), 20)))
            .all()
        )
        return [
            {
                "id": row.item_id,
                "type": row.item_type,
                "name": row.name or "",
                "meta": row.meta or "",
                "count": int(row.count or 0),
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            }
            for row in rows
        ]
    finally:
        db.close()

def users_are_friends(user_id: int, other_user_id: int) -> bool:
    if not user_id or not other_user_id or user_id == other_user_id:
        return False
    return get_friend_request_status(user_id, other_user_id) == "accepted"


def _dm_pair_ids(user_a: int, user_b: int):
    low = min(user_a, user_b)
    high = max(user_a, user_b)
    return low, high


def get_or_create_dm_conversation(user_id: int, other_user_id: int):
    if not users_are_friends(user_id, other_user_id):
        return None, "not_friends"
    low, high = _dm_pair_ids(user_id, other_user_id)
    db = SessionLocal()
    try:
        row = db.query(DmConversation).filter_by(user_low_id=low, user_high_id=high).first()
        if not row:
            row = DmConversation(user_low_id=low, user_high_id=high)
            db.add(row)
            db.commit()
            db.refresh(row)
        return row, None
    finally:
        db.close()


def get_dm_conversation_for_user(conversation_id: int, user_id: int):
    db = SessionLocal()
    try:
        row = db.query(DmConversation).filter_by(id=conversation_id).first()
        if not row:
            return None, "not_found"
        if user_id not in (row.user_low_id, row.user_high_id):
            return None, "forbidden"
        return row, None
    finally:
        db.close()


def _dm_message_row(msg: DmMessage):
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "text": msg.text,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


def list_dm_messages(conversation_id: int, user_id: int, after_id: int = 0, limit: int = 100):
    conv, reason = get_dm_conversation_for_user(conversation_id, user_id)
    if reason:
        return None, reason
    db = SessionLocal()
    try:
        q = db.query(DmMessage).filter_by(conversation_id=conversation_id)
        if after_id:
            q = q.filter(DmMessage.id > after_id)
        rows = q.order_by(DmMessage.id.asc()).limit(limit).all()
        return [_dm_message_row(m) for m in rows], None
    finally:
        db.close()


def send_dm_message(conversation_id: int, sender_id: int, text: str):
    conv, reason = get_dm_conversation_for_user(conversation_id, sender_id)
    if reason:
        return None, reason
    body = (text or "").strip()
    if not body:
        return None, "empty_message"
    db = SessionLocal()
    try:
        conv = db.query(DmConversation).filter_by(id=conversation_id).first()
        if not conv:
            return None, "not_found"
        msg = DmMessage(conversation_id=conversation_id, sender_id=sender_id, text=body)
        db.add(msg)
        conv.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(msg)
        return _dm_message_row(msg), None
    finally:
        db.close()


def list_dm_conversations(user_id: int):
    db = SessionLocal()
    try:
        rows = (
            db.query(DmConversation)
            .filter((DmConversation.user_low_id == user_id) | (DmConversation.user_high_id == user_id))
            .order_by(DmConversation.updated_at.desc())
            .all()
        )
        out = []
        for conv in rows:
            other_id = conv.user_high_id if conv.user_low_id == user_id else conv.user_low_id
            if not users_are_friends(user_id, other_id):
                continue
            last = (
                db.query(DmMessage)
                .filter_by(conversation_id=conv.id)
                .order_by(DmMessage.id.desc())
                .first()
            )
            summary = _public_user_summary(other_id)
            out.append({
                "conversation_id": conv.id,
                "other_user": summary,
                "last_message": _dm_message_row(last) if last else None,
                "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
            })
        return out
    finally:
        db.close()

