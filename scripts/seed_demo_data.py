#!/usr/bin/env python3
"""生成演示数据：13 personas + N 个用户 + N 个会话 + 不等长度的消息。

为什么需要：仓库不提交 data/darlink.sqlite。后端启动时会建表但没数据；
导出/统计/质量分析脚本需要有真实分布的对话才能验证。

幂等：重复运行不会重复插用户（按 email 唯一约束）；--reset 清空 demo 数据但保留 schema。

用法：
    python scripts/seed_demo_data.py                       # 默认 10 用户 30 会话
    python scripts/seed_demo_data.py --users 20 --sessions 50
    python scripts/seed_demo_data.py --reset               # 清空再生成
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(REPO_ROOT))

from _common import (  # noqa: E402
    DB_PATH,
    ensure_schema,
    get_conn,
    get_logger,
)

LOGGER = get_logger("seed")


def load_personas() -> list[dict]:
    """从仓库根 persona_registry.py 读取 13 个 persona；失败则用兜底名单。"""
    try:
        from persona_registry import PERSONAS  # type: ignore
        return list(PERSONAS)
    except Exception as exc:
        LOGGER.warning("无法导入 persona_registry：%s，使用兜底列表", exc)
        return [
            {"id": i + 1, "name": name, "desc": f"演示 persona {name}"}
            for i, name in enumerate([
                "Charlie Munger", "Elon Musk", "Richard Feynman", "Steve Jobs",
                "Warren Buffett", "Naval Ravikant", "Paul Graham", "Jeff Bezos",
                "Ray Dalio", "Jensen Huang", "Peter Drucker", "Bill Gates",
                "Marc Andreessen",
            ])
        ]


# 用户消息模板池：覆盖短问、长问、闲聊、低质量（用于触发质量分析的低质量标记）
USER_MESSAGE_TEMPLATES = [
    "你好",                                                                                  # 极短，触发低质量
    "嗯",
    "?",
    "我想问一下，如何在大学期间高效学习？",
    "你怎么看一个人是否应该尽早实习",
    "我最近在做一个 side project，想做一个 AI 社交产品，你觉得切入点应该怎么选？",
    "我面临的一个困境是：硬件方向更稳，软件方向更灵活，但我对硬件兴趣不大，怎么办",
    "我想知道你是怎么训练自己第一性原理思考的，能给个具体方法吗？",
    "如果让你给一个本科二年级、还没找到方向的学生一个建议，你会说什么？",
    "投资和创业哪个更值得在 25 岁之前尝试，请详细解释你的理由",
    "我最近读了一本关于复利的书，但还是无法把这个概念用到时间分配上，应该怎么落地？",
    "怎么判断一个想法值不值得做？我列了 5 个想法但都不确定。",
    "如何在大量信息中保持专注？我每天被各种推送拖走 4 小时以上",
    "为什么大多数人最终都会失败，而少数人却能持续成功？这个差异的根本原因是什么？",
    "我觉得自己处于一个瓶颈期，做什么都没动力。你觉得这是因为目标太大还是太小？",
]

BOT_MESSAGE_TEMPLATES = [
    "我先反过来问：你想清楚是什么会让这件事失败吗？再决定下一步会更稳。",
    "把问题拆到底层：你说的不是一个问题，是三个。我们逐个看。",
    "短期看激励，长期看复利。你这个决策属于哪一种？",
    "首先，承认有些事现阶段就是不知道。先别给自己加戏。",
    "我会从两个维度回答：第一，你的杠杆点；第二，你愿意承受的失败成本。",
    "可验证性是关键。你描述的现象有没有办法在两周内做一个最小实验？",
    "好产品不是功能堆砌，是减法。你做的事里，有没有一项可以砍掉？",
    "我想给你一个反直觉的视角：先思考你想避免的人生，比想要的人生更有用。",
    "把它变成原则。原则是你下次遇到类似情况能直接调用的决策框架。",
    "执行密度比聪明重要。你能不能把这个事拆到每周可交付？",
    "客户价值是终极标尺。这件事让谁的体验更好了？",
    "用第一性原理拆：物理上、经济上、心理上的约束，分别是什么？",
    "你描述的问题里，至少有一半是定义模糊。我们先把语言对齐。",
    "好。",  # 极短回答用于测低质量检测
    "可以。",
]


def random_timestamp(within_days: int = 14) -> datetime:
    """在过去 within_days 天内随机选一个时间点，UTC 时区。"""
    now = datetime.now(timezone.utc)
    delta_seconds = random.randint(0, within_days * 24 * 3600)
    return now - timedelta(seconds=delta_seconds)


def fmt_ts(dt: datetime) -> str:
    """SQLAlchemy 默认存的格式：'YYYY-MM-DD HH:MM:SS.ffffff'，用 naive 没问题。"""
    return dt.replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S.%f")


def upsert_personas(conn, personas: list[dict]) -> None:
    cur = conn.cursor()
    for p in personas:
        cur.execute(
            "INSERT OR REPLACE INTO personas (id, name, desc) VALUES (?, ?, ?)",
            (p["id"], p["name"], p.get("desc", "")),
        )
    conn.commit()
    LOGGER.info("已写入 %d 个 personas", len(personas))


def insert_users(conn, n_users: int) -> list[int]:
    """生成 N 个测试用户。前 N-2 个 verified，最后 2 个未验证。返回 user.id 列表。"""
    cur = conn.cursor()
    user_ids: list[int] = []
    for i in range(n_users):
        token = f"demo_token_{uuid.uuid4().hex[:12]}"
        email = f"demo_user_{i:03d}@test.edu.cn"
        verified = 0 if i >= n_users - 2 else 1
        created = fmt_ts(random_timestamp(within_days=30))
        cur.execute(
            """INSERT OR IGNORE INTO users (user_token, email, verified, created_at)
               VALUES (?, ?, ?, ?)""",
            (token, email, verified, created),
        )
        # 取回 id（无论新插入还是已存在）
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        if row:
            user_ids.append(row["id"])
    conn.commit()
    LOGGER.info("已确保 %d 个 users（含 2 个未验证）", len(user_ids))
    return user_ids


def insert_session_with_messages(
    conn, user_id: int, persona_id: int, n_turns: int
) -> tuple[str, int]:
    """创建一个 session 和 n_turns 轮 user/bot 消息。"""
    cur = conn.cursor()
    session_id = f"sess_{uuid.uuid4().hex[:16]}"
    started = random_timestamp(within_days=14)
    last = started

    cur.execute(
        """INSERT INTO sessions (id, user_id, persona_id, skill_name, started_at, last_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            session_id,
            user_id,
            persona_id,
            None,
            fmt_ts(started),
            fmt_ts(last),
        ),
    )

    msg_count = 0
    cursor_time = started
    for turn in range(n_turns):
        # 用户消息
        cursor_time += timedelta(seconds=random.randint(15, 120))
        user_text = random.choice(USER_MESSAGE_TEMPLATES)
        cur.execute(
            """INSERT INTO messages (session_id, user_id, role, text, meta, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, user_id, "user", user_text, None, fmt_ts(cursor_time)),
        )
        msg_count += 1

        # bot 消息
        cursor_time += timedelta(seconds=random.randint(2, 15))
        bot_text = random.choice(BOT_MESSAGE_TEMPLATES)
        meta = json.dumps({"persona_id": persona_id, "demo": True}, ensure_ascii=False)
        cur.execute(
            """INSERT INTO messages (session_id, user_id, role, text, meta, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, None, "bot", bot_text, meta, fmt_ts(cursor_time)),
        )
        msg_count += 1
        last = cursor_time

    cur.execute(
        "UPDATE sessions SET last_at = ? WHERE id = ?",
        (fmt_ts(last), session_id),
    )
    conn.commit()
    return session_id, msg_count


def reset_demo_data(conn) -> None:
    """删除 demo 数据：所有 demo_user_*@test.edu.cn 用户的 sessions/messages，及用户本身。"""
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email LIKE 'demo_user_%@test.edu.cn'")
    demo_user_ids = [row["id"] for row in cur.fetchall()]
    if not demo_user_ids:
        LOGGER.info("没有 demo 数据可清")
        return
    placeholders = ",".join("?" * len(demo_user_ids))
    cur.execute(
        f"SELECT id FROM sessions WHERE user_id IN ({placeholders})", demo_user_ids
    )
    demo_session_ids = [row["id"] for row in cur.fetchall()]
    if demo_session_ids:
        sp = ",".join("?" * len(demo_session_ids))
        cur.execute(f"DELETE FROM messages WHERE session_id IN ({sp})", demo_session_ids)
        cur.execute(f"DELETE FROM sessions WHERE id IN ({sp})", demo_session_ids)
    cur.execute(f"DELETE FROM users WHERE id IN ({placeholders})", demo_user_ids)
    conn.commit()
    LOGGER.info(
        "已清理：%d users / %d sessions / 关联 messages",
        len(demo_user_ids),
        len(demo_session_ids),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="生成 Darlink 演示数据")
    parser.add_argument("--users", type=int, default=10, help="生成的用户数（默认 10）")
    parser.add_argument("--sessions", type=int, default=30, help="生成的会话数（默认 30）")
    parser.add_argument("--reset", action="store_true", help="先清空 demo_user_* 再生成")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    parser.add_argument("--seed", type=int, default=None, help="random.seed 用于复现")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    db_path = Path(args.db) if args.db else DB_PATH
    LOGGER.info("使用数据库：%s", db_path)
    conn = get_conn(db_path, readonly=False)
    ensure_schema(conn)

    if args.reset:
        reset_demo_data(conn)

    personas = load_personas()
    upsert_personas(conn, personas)

    user_ids = insert_users(conn, args.users)
    if not user_ids:
        LOGGER.error("没有可用用户，退出")
        return 1
    persona_ids = [p["id"] for p in personas]

    total_msgs = 0
    for i in range(args.sessions):
        user_id = random.choice(user_ids)
        persona_id = random.choice(persona_ids)
        n_turns = random.randint(2, 12)  # 2-12 轮 → 4-24 条消息
        sess_id, n_msgs = insert_session_with_messages(conn, user_id, persona_id, n_turns)
        total_msgs += n_msgs
        if (i + 1) % 10 == 0:
            LOGGER.info("已生成 %d/%d 会话", i + 1, args.sessions)

    LOGGER.info(
        "完成：%d 用户、%d 会话、约 %d 条消息",
        len(user_ids),
        args.sessions,
        total_msgs,
    )
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
