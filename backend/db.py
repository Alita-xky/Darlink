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
