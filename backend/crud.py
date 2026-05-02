import uuid
from db import SessionLocal
from models import User, EmailVerification, Persona, SessionDB, Message, UserProfile
from sqlalchemy.exc import IntegrityError


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


def create_session_with_skill(user_token: str, persona_id: int, skill_name: str | None = None):
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
