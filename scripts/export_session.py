#!/usr/bin/env python3
"""导出单个会话为 JSON：会话元信息 + 用户/persona + 全部消息。

用法：
    python scripts/export_session.py --session-id sess_xxx
    python scripts/export_session.py --session-id sess_xxx --output /tmp/sess.json
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _common import (  # noqa: E402
    DB_PATH,
    EXPORTS_DIR,
    get_conn,
    get_logger,
    parse_meta,
    row_to_dict,
    utcnow_iso,
    write_json,
)

LOGGER = get_logger("export_session")


def fetch_session(conn, session_id: str) -> dict | None:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT s.id              AS session_id,
               s.skill_name      AS skill_name,
               s.started_at      AS started_at,
               s.last_at         AS last_at,
               u.id              AS user_id,
               u.email           AS user_email,
               u.user_token      AS user_token,
               u.verified        AS user_verified,
               p.id              AS persona_id,
               p.name            AS persona_name,
               p.desc            AS persona_desc
        FROM sessions s
        LEFT JOIN users u   ON u.id = s.user_id
        LEFT JOIN personas p ON p.id = s.persona_id
        WHERE s.id = ?
        """,
        (session_id,),
    )
    row = cur.fetchone()
    return row_to_dict(row) if row else None


def fetch_messages(conn, session_id: str) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        """SELECT id, user_id, role, text, meta, created_at
           FROM messages
           WHERE session_id = ?
           ORDER BY created_at, id""",
        (session_id,),
    )
    out = []
    for row in cur.fetchall():
        m = row_to_dict(row)
        m["meta"] = parse_meta(m.get("meta"))
        out.append(m)
    return out


def build_export(conn, session_id: str) -> dict | None:
    sess = fetch_session(conn, session_id)
    if not sess:
        return None
    messages = fetch_messages(conn, session_id)
    return {
        "exported_at": utcnow_iso(),
        "session_id": sess["session_id"],
        "skill_name": sess["skill_name"],
        "started_at": sess["started_at"],
        "last_at": sess["last_at"],
        "message_count": len(messages),
        "user": {
            "id": sess["user_id"],
            "email": sess["user_email"],
            "token": sess["user_token"],
            "verified": bool(sess["user_verified"]) if sess["user_verified"] is not None else None,
        },
        "persona": {
            "id": sess["persona_id"],
            "name": sess["persona_name"],
            "desc": sess["persona_desc"],
        },
        "messages": messages,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="导出单个会话为 JSON")
    parser.add_argument("--session-id", required=True, help="要导出的 session.id")
    parser.add_argument("--output", type=str, default=None, help="输出路径（默认 scripts/exports/<id>.json）")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    args = parser.parse_args()

    conn = get_conn(args.db, readonly=True)
    data = build_export(conn, args.session_id)
    conn.close()

    if data is None:
        LOGGER.error("找不到 session_id=%s", args.session_id)
        return 2

    out_path = Path(args.output) if args.output else EXPORTS_DIR / f"{args.session_id}.json"
    write_json(data, out_path)
    LOGGER.info("已导出 %d 条消息 → %s", data["message_count"], out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
