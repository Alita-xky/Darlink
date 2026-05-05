#!/usr/bin/env python3
"""批量导出全部会话：每会话一个 JSON + 总 _index.json。

支持过滤：--since YYYY-MM-DD（按 last_at），--persona-id N。

用法：
    python scripts/export_all_conversations.py
    python scripts/export_all_conversations.py --since 2026-04-28 --persona-id 2
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _common import (  # noqa: E402
    EXPORTS_DIR,
    get_conn,
    get_logger,
    utcnow_iso,
    write_json,
)
from export_session import build_export  # noqa: E402

LOGGER = get_logger("export_all")


def list_sessions(conn, since: str | None, persona_id: int | None) -> list[str]:
    sql = "SELECT id FROM sessions WHERE 1=1"
    params: list = []
    if since:
        sql += " AND last_at >= ?"
        params.append(f"{since} 00:00:00")
    if persona_id is not None:
        sql += " AND persona_id = ?"
        params.append(persona_id)
    sql += " ORDER BY last_at DESC"
    cur = conn.cursor()
    cur.execute(sql, params)
    return [row["id"] for row in cur.fetchall()]


def main() -> int:
    parser = argparse.ArgumentParser(description="批量导出全部会话为 JSON")
    parser.add_argument("--since", type=str, default=None, help="只导出 last_at 之后的会话，YYYY-MM-DD")
    parser.add_argument("--persona-id", type=int, default=None, help="只导出特定 persona 的会话")
    parser.add_argument("--output-dir", type=str, default=None, help="输出目录（默认 scripts/exports/）")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    args = parser.parse_args()

    out_dir = Path(args.output_dir) if args.output_dir else EXPORTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    conn = get_conn(args.db, readonly=True)
    session_ids = list_sessions(conn, args.since, args.persona_id)
    if not session_ids:
        LOGGER.warning("没有符合条件的 session")
        conn.close()
        return 0

    LOGGER.info("准备导出 %d 个会话", len(session_ids))
    index_entries = []
    for i, sid in enumerate(session_ids, 1):
        data = build_export(conn, sid)
        if data is None:
            LOGGER.warning("[%d/%d] 跳过 %s（不存在）", i, len(session_ids), sid)
            continue
        out_path = out_dir / f"{sid}.json"
        write_json(data, out_path)
        index_entries.append({
            "session_id": sid,
            "persona_name": data["persona"]["name"],
            "user_email": data["user"]["email"],
            "message_count": data["message_count"],
            "started_at": data["started_at"],
            "last_at": data["last_at"],
            "file": str(out_path.relative_to(out_dir)),
        })
        LOGGER.info("[%d/%d] %s → %s（%d 消息）", i, len(session_ids), sid, out_path.name, data["message_count"])

    index_path = out_dir / "_index.json"
    write_json({
        "generated_at": utcnow_iso(),
        "filter": {"since": args.since, "persona_id": args.persona_id},
        "total_sessions": len(index_entries),
        "files": index_entries,
    }, index_path)
    LOGGER.info("索引：%s（%d 项）", index_path, len(index_entries))
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
