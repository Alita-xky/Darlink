#!/usr/bin/env python3
"""增量导出：只导出 last_at 比上次记录晚的会话。

状态文件 scripts/.export_state.json 记录上次成功导出的最大 last_at。
首次运行 = 全量；之后只导新增的。

用法：
    python scripts/incremental_export.py
    python scripts/incremental_export.py --reset-state    # 下次重新全量
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _common import (  # noqa: E402
    EXPORTS_DIR,
    SCRIPTS_DIR,
    get_conn,
    get_logger,
    utcnow_iso,
    write_json,
)
from export_session import build_export  # noqa: E402

LOGGER = get_logger("incremental")
STATE_FILE = SCRIPTS_DIR / ".export_state.json"


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"last_exported_at": None, "last_run_at": None, "total_exported": 0}
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state: dict) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def list_new_sessions(conn, since: str | None) -> list[tuple[str, str]]:
    cur = conn.cursor()
    if since:
        cur.execute(
            "SELECT id, last_at FROM sessions WHERE last_at > ? ORDER BY last_at",
            (since,),
        )
    else:
        cur.execute("SELECT id, last_at FROM sessions ORDER BY last_at")
    return [(r["id"], r["last_at"]) for r in cur.fetchall()]


def main() -> int:
    parser = argparse.ArgumentParser(description="增量导出会话")
    parser.add_argument("--reset-state", action="store_true", help="清空状态，下次全量导出")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    parser.add_argument("--output-dir", type=str, default=None, help="输出目录（默认 scripts/exports/）")
    args = parser.parse_args()

    if args.reset_state and STATE_FILE.exists():
        STATE_FILE.unlink()
        LOGGER.info("已清空状态文件：%s", STATE_FILE)

    state = load_state()
    LOGGER.info("上次导出至：%s（累计 %d）", state.get("last_exported_at"), state.get("total_exported", 0))

    out_dir = Path(args.output_dir) if args.output_dir else EXPORTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    conn = get_conn(args.db, readonly=True)
    new_sessions = list_new_sessions(conn, state.get("last_exported_at"))
    if not new_sessions:
        LOGGER.info("没有新会话，跳过")
        conn.close()
        return 0

    LOGGER.info("发现 %d 个新增/更新会话", len(new_sessions))
    max_last_at = state.get("last_exported_at") or ""
    exported = 0
    for sid, last_at in new_sessions:
        data = build_export(conn, sid)
        if data is None:
            continue
        write_json(data, out_dir / f"{sid}.json")
        exported += 1
        if last_at and last_at > max_last_at:
            max_last_at = last_at

    conn.close()

    new_state = {
        "last_exported_at": max_last_at,
        "last_run_at": utcnow_iso(),
        "total_exported": state.get("total_exported", 0) + exported,
    }
    save_state(new_state)
    LOGGER.info("增量导出完成：%d 会话；状态：last_at=%s", exported, max_last_at)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
