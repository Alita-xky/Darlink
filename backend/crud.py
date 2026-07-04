import uuid
from datetime import datetime, timedelta
from db import SessionLocal
from models import User, EmailVerification, Persona, SessionDB, Message, UserProfile, FriendRequest
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
    try:
        return int(pid.split("-", 1)[1])
    except (ValueError, IndexError):
        return None


def upsert_onboarding_profile(
    user_id: int,
    onboarding: dict,
    skill_md: str,
    plaza_listing: dict,
    profile_text: str,
    vector: list,
):
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(user_id=user_id).first()
        existing_meta = (prof.meta or {}) if prof else {}
        merged_meta = dict(existing_meta)
        merged_meta["onboarding"] = onboarding
        merged_meta["onboarding_skill"] = skill_md
        merged_meta["plaza_listing"] = plaza_listing
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
            listing = meta.get("plaza_listing") or {}
            if not listing.get("published"):
                continue
            published.append(
                {
                    "user_id": user.id,
                    "profile": prof,
                    "listing": listing,
                    "onboarding": meta.get("onboarding") or {},
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
        listing = (prof.meta or {}).get("plaza_listing") or {}
        if not listing.get("published"):
            return None
        onboarding = (prof.meta or {}).get("onboarding") or {}
        return {
            "user_id": user_id,
            "profile_id": listing.get("profile_id") or f"user-{user_id}",
            "public_card": listing.get("public_card") or {},
            "category": listing.get("category") or "social",
            "cards": onboarding.get("cards") or [],
            "school": (onboarding.get("questionnaire") or {}).get("school"),
            "grade": (onboarding.get("questionnaire") or {}).get("grade"),
            "majorDirection": (onboarding.get("questionnaire") or {}).get("majorDirection"),
            "nickname": onboarding.get("nickname") or (onboarding.get("questionnaire") or {}).get("nickname"),
            "twinName": onboarding.get("twinName"),
            "intent": onboarding.get("intent"),
        }
    finally:
        db.close()


def get_onboarding_profile_by_user_id(user_id: int):
    prof = get_user_profile(user_id)
    if not prof or not prof.meta:
        return None
    meta = prof.meta or {}
    return {
        "onboarding": meta.get("onboarding"),
        "plaza_listing": meta.get("plaza_listing"),
        "onboarding_skill": meta.get("onboarding_skill"),
    }


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
            listing = meta.get("plaza_listing") or {}
            if not listing.get("published"):
                continue
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
