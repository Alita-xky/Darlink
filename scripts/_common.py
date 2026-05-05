"""共享工具：DB 路径、连接、CLI 解析、JSON 编码、日志。

所有数据工程脚本都从这里取依赖，保持一致性。
"""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = REPO_ROOT / "data" / "darlink.sqlite"
SCRIPTS_DIR = Path(__file__).resolve().parent
EXPORTS_DIR = SCRIPTS_DIR / "exports"
REPORTS_DIR = SCRIPTS_DIR / "reports"
LOGS_DIR = SCRIPTS_DIR / "logs"
BACKUPS_DIR = REPO_ROOT / "backups"


# 表结构 DDL：用 sqlite3 直接 CREATE，避免依赖 backend 的 SQLAlchemy。
# 字段定义对齐 backend/models.py，schema 不一致时以这里为准（仅用于 seed 路径）。
SCHEMA_DDL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_token VARCHAR(64) UNIQUE,
        email VARCHAR(256) UNIQUE,
        verified BOOLEAN DEFAULT 0,
        created_at DATETIME
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS email_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token VARCHAR(128) UNIQUE,
        email VARCHAR(256),
        created_at DATETIME
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS personas (
        id INTEGER PRIMARY KEY,
        name VARCHAR(128),
        desc TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id INTEGER,
        persona_id INTEGER,
        skill_name VARCHAR(128),
        started_at DATETIME,
        last_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(persona_id) REFERENCES personas(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id VARCHAR(64),
        user_id INTEGER,
        role VARCHAR(16),
        text TEXT,
        meta TEXT,
        created_at DATETIME,
        FOREIGN KEY(session_id) REFERENCES sessions(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        profile_text TEXT,
        vector TEXT,
        meta TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_user_token ON users(user_token)",
]


def get_logger(name: str) -> logging.Logger:
    """每个脚本调用一次，得到统一格式的 logger。"""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def get_conn(db_path: Path | str | None = None, readonly: bool = True) -> sqlite3.Connection:
    """打开 sqlite 连接。默认只读，避免脚本误改生产数据。

    seed/backup 等需要写入的脚本显式传 readonly=False。
    """
    path = Path(db_path) if db_path else DB_PATH
    if readonly:
        if not path.exists():
            raise FileNotFoundError(
                f"数据库不存在：{path}。先跑 `python scripts/seed_demo_data.py` 或启动后端。"
            )
        uri = f"file:{path.as_posix()}?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path.as_posix())
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema(conn: sqlite3.Connection) -> None:
    """在写连接上跑 DDL，幂等。"""
    cur = conn.cursor()
    for ddl in SCHEMA_DDL:
        cur.execute(ddl)
    conn.commit()


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {k: row[k] for k in row.keys()}


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(value: str | None) -> datetime | None:
    """解析 sqlite 里存的 datetime（来自 SQLAlchemy 的 utcnow）。容忍多种格式。"""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def write_json(obj: Any, path: Path) -> None:
    """统一 JSON 写入：UTF-8、不转 ASCII、缩进 2、目录自建。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, default=_json_default)


def _json_default(o: Any) -> Any:
    if isinstance(o, datetime):
        return o.isoformat()
    if isinstance(o, Path):
        return str(o)
    raise TypeError(f"Object of type {type(o)} is not JSON serializable")


def parse_meta(meta_value: Any) -> Any:
    """messages.meta 在 SQLAlchemy JSON 字段里可能是字符串、None 或字典。"""
    if meta_value is None or meta_value == "":
        return None
    if isinstance(meta_value, (dict, list)):
        return meta_value
    if isinstance(meta_value, str):
        try:
            return json.loads(meta_value)
        except json.JSONDecodeError:
            return meta_value
    return meta_value
