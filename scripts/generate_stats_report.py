#!/usr/bin/env python3
"""生成全量统计报告：用户/会话/消息维度，按 persona 分布，Top 5 等。

输出 JSON + 可选 Markdown。纯 SQL 实现，零外部依赖。

用法：
    python scripts/generate_stats_report.py
    python scripts/generate_stats_report.py --md
    python scripts/generate_stats_report.py --output /tmp/stats.json --md
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _common import (  # noqa: E402
    REPORTS_DIR,
    get_conn,
    get_logger,
    utcnow_iso,
    write_json,
)

LOGGER = get_logger("stats")


def fetch_one(cur, sql: str, params=()) -> dict:
    cur.execute(sql, params)
    row = cur.fetchone()
    return dict(row) if row else {}


def fetch_all(cur, sql: str, params=()) -> list[dict]:
    cur.execute(sql, params)
    return [dict(r) for r in cur.fetchall()]


def collect_stats(conn) -> dict:
    cur = conn.cursor()

    user_stats = fetch_one(cur, """
        SELECT
            COUNT(*)                                       AS total,
            SUM(CASE WHEN verified=1 THEN 1 ELSE 0 END)    AS verified,
            SUM(CASE WHEN verified=0 THEN 1 ELSE 0 END)    AS unverified,
            SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END)
                                                           AS new_last_7d
        FROM users
    """)

    session_stats = fetch_one(cur, """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN started_at >= datetime('now','-7 days') THEN 1 ELSE 0 END)
                     AS new_last_7d
        FROM sessions
    """)

    msg_stats = fetch_one(cur, """
        SELECT
            COUNT(*)                                          AS total,
            SUM(CASE WHEN role='user' THEN 1 ELSE 0 END)      AS user_msgs,
            SUM(CASE WHEN role='bot'  THEN 1 ELSE 0 END)      AS bot_msgs,
            ROUND(AVG(LENGTH(text)), 2)                       AS avg_length,
            MAX(LENGTH(text))                                 AS max_length,
            MIN(LENGTH(text))                                 AS min_length
        FROM messages
    """)

    avg_msgs_per_session = fetch_one(cur, """
        SELECT ROUND(CAST(COUNT(m.id) AS FLOAT)/NULLIF(COUNT(DISTINCT s.id),0), 2) AS avg_msgs
        FROM sessions s
        LEFT JOIN messages m ON m.session_id = s.id
    """)
    session_stats["avg_messages_per_session"] = avg_msgs_per_session.get("avg_msgs")

    by_persona = fetch_all(cur, """
        SELECT p.id           AS persona_id,
               p.name         AS persona_name,
               COUNT(DISTINCT s.id) AS session_count,
               COUNT(m.id)    AS message_count,
               ROUND(AVG(LENGTH(m.text)), 2) AS avg_msg_length
        FROM personas p
        LEFT JOIN sessions s ON s.persona_id = p.id
        LEFT JOIN messages m ON m.session_id = s.id
        GROUP BY p.id, p.name
        ORDER BY session_count DESC, persona_id
    """)

    daily_messages = fetch_all(cur, """
        SELECT DATE(created_at) AS date, COUNT(*) AS messages
        FROM messages
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 14
    """)

    daily_sessions = fetch_all(cur, """
        SELECT DATE(started_at) AS date, COUNT(*) AS sessions
        FROM sessions
        GROUP BY DATE(started_at)
        ORDER BY date DESC
        LIMIT 14
    """)

    top_users = fetch_all(cur, """
        SELECT u.id, u.email, COUNT(m.id) AS messages
        FROM users u
        JOIN messages m ON m.user_id = u.id AND m.role = 'user'
        GROUP BY u.id, u.email
        ORDER BY messages DESC
        LIMIT 5
    """)

    top_personas = fetch_all(cur, """
        SELECT p.id, p.name, COUNT(s.id) AS sessions
        FROM personas p
        JOIN sessions s ON s.persona_id = p.id
        GROUP BY p.id, p.name
        ORDER BY sessions DESC
        LIMIT 5
    """)

    return {
        "generated_at": utcnow_iso(),
        "users": user_stats,
        "sessions": session_stats,
        "messages": msg_stats,
        "by_persona": by_persona,
        "daily_messages": list(reversed(daily_messages)),
        "daily_sessions": list(reversed(daily_sessions)),
        "top_users": top_users,
        "top_personas": top_personas,
    }


def render_markdown(stats: dict) -> str:
    u = stats["users"]
    s = stats["sessions"]
    m = stats["messages"]
    md = [
        f"# Darlink 数据统计报告",
        f"",
        f"_生成时间：{stats['generated_at']}_",
        f"",
        f"## 用户",
        f"- 总数：**{u.get('total', 0)}**（已验证 {u.get('verified', 0)} / 未验证 {u.get('unverified', 0)}）",
        f"- 近 7 天新增：{u.get('new_last_7d', 0)}",
        f"",
        f"## 会话",
        f"- 总数：**{s.get('total', 0)}**",
        f"- 近 7 天新增：{s.get('new_last_7d', 0)}",
        f"- 平均每会话消息数：{s.get('avg_messages_per_session', 0)}",
        f"",
        f"## 消息",
        f"- 总数：**{m.get('total', 0)}**（user {m.get('user_msgs', 0)} / bot {m.get('bot_msgs', 0)}）",
        f"- 平均长度：{m.get('avg_length', 0)} 字符（min {m.get('min_length', 0)} / max {m.get('max_length', 0)}）",
        f"",
        f"## 按 Persona 分布",
        f"",
        f"| Persona | Sessions | Messages | Avg Length |",
        f"|---|---:|---:|---:|",
    ]
    for p in stats["by_persona"]:
        md.append(
            f"| {p['persona_name']} | {p.get('session_count', 0) or 0} | "
            f"{p.get('message_count', 0) or 0} | {p.get('avg_msg_length', 0) or 0} |"
        )
    md += [
        f"",
        f"## Top 5 活跃用户",
        f"",
        f"| Email | User Messages |",
        f"|---|---:|",
    ]
    for u_ in stats["top_users"]:
        md.append(f"| {u_['email']} | {u_['messages']} |")
    md += [
        f"",
        f"## Top 5 热门 Persona",
        f"",
        f"| Persona | Sessions |",
        f"|---|---:|",
    ]
    for p in stats["top_personas"]:
        md.append(f"| {p['name']} | {p['sessions']} |")
    md += [
        f"",
        f"## 近 14 天消息趋势",
        f"",
        f"| Date | Messages |",
        f"|---|---:|",
    ]
    for d in stats["daily_messages"]:
        md.append(f"| {d['date']} | {d['messages']} |")
    md.append("")
    return "\n".join(md)


def main() -> int:
    parser = argparse.ArgumentParser(description="生成统计报告")
    parser.add_argument("--output", type=str, default=None, help="JSON 输出路径")
    parser.add_argument("--md", action="store_true", help="同时输出 Markdown")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    args = parser.parse_args()

    conn = get_conn(args.db, readonly=True)
    stats = collect_stats(conn)
    conn.close()

    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    out_json = Path(args.output) if args.output else REPORTS_DIR / f"stats_{today}.json"
    write_json(stats, out_json)
    LOGGER.info("JSON: %s", out_json)

    if args.md:
        out_md = out_json.with_suffix(".md")
        out_md.parent.mkdir(parents=True, exist_ok=True)
        out_md.write_text(render_markdown(stats), encoding="utf-8")
        LOGGER.info("Markdown: %s", out_md)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
