from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / 'data' / 'darlink.sqlite'
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
DB_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

def create_tables():
    Base.metadata.create_all(bind=engine)


def ensure_session_skill_column():
    with engine.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(sessions)").fetchall()
        column_names = {row[1] for row in rows}
        if "skill_name" not in column_names:
            conn.exec_driver_sql("ALTER TABLE sessions ADD COLUMN skill_name VARCHAR(128)")


def ensure_auth_columns():
    """认证系统改造：给已存在的 users / email_verifications 表补新列。

    create_all() 只建新表，不会给旧表加列，所以线上已有数据的表要在这里手动 ALTER。幂等。
    """
    with engine.begin() as conn:
        # users.password_hash
        rows = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
        user_cols = {row[1] for row in rows}
        if user_cols and "password_hash" not in user_cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN password_hash VARCHAR(256)")

        # email_verifications.code / expires_at
        rows = conn.exec_driver_sql("PRAGMA table_info(email_verifications)").fetchall()
        ev_cols = {row[1] for row in rows}
        if ev_cols:
            if "code" not in ev_cols:
                conn.exec_driver_sql("ALTER TABLE email_verifications ADD COLUMN code VARCHAR(6)")
            if "expires_at" not in ev_cols:
                conn.exec_driver_sql("ALTER TABLE email_verifications ADD COLUMN expires_at DATETIME")
