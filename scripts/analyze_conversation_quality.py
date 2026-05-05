#!/usr/bin/env python3
"""对话质量分析：

单会话模式（--session-id）：输出该会话的长度分布、轮次、问句比例、响应延迟。
全量模式：聚合所有会话的质量指标，按 persona 分组，并标记低质量会话。

低质量判定（任一满足即标记）：
  - 消息总数 < 4
  - 平均消息长度 < 10 字
  - 用户消息全部短于 5 字（疑似敷衍）

用法：
    python scripts/analyze_conversation_quality.py
    python scripts/analyze_conversation_quality.py --session-id sess_xxx
    python scripts/analyze_conversation_quality.py --charts        # 需 pandas+matplotlib
"""

from __future__ import annotations

import argparse
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _common import (  # noqa: E402
    REPORTS_DIR,
    get_conn,
    get_logger,
    parse_iso,
    utcnow_iso,
    write_json,
)

LOGGER = get_logger("quality")

# 低质量阈值：调一个地方就好
MIN_MESSAGES = 4
MIN_AVG_LENGTH = 10
MIN_USER_MSG_LENGTH = 5


def fetch_session_messages(conn, session_id: str | None) -> list[dict]:
    cur = conn.cursor()
    if session_id:
        cur.execute(
            """SELECT m.session_id, s.persona_id, p.name AS persona_name,
                      m.role, m.text, m.created_at
               FROM messages m
               JOIN sessions s ON s.id = m.session_id
               JOIN personas p ON p.id = s.persona_id
               WHERE m.session_id = ?
               ORDER BY m.created_at, m.id""",
            (session_id,),
        )
    else:
        cur.execute(
            """SELECT m.session_id, s.persona_id, p.name AS persona_name,
                      m.role, m.text, m.created_at
               FROM messages m
               JOIN sessions s ON s.id = m.session_id
               JOIN personas p ON p.id = s.persona_id
               ORDER BY m.session_id, m.created_at, m.id"""
        )
    return [dict(r) for r in cur.fetchall()]


def length_buckets(lengths: list[int]) -> dict[str, int]:
    """把长度分布到 5 个桶里。"""
    bins = {"1-5": 0, "6-15": 0, "16-30": 0, "31-60": 0, "61+": 0}
    for L in lengths:
        if L <= 5: bins["1-5"] += 1
        elif L <= 15: bins["6-15"] += 1
        elif L <= 30: bins["16-30"] += 1
        elif L <= 60: bins["31-60"] += 1
        else: bins["61+"] += 1
    return bins


def is_question(text: str) -> bool:
    """简易问句检测：以 ?/？结尾，或包含「吗/为什么/怎么/如何/是否/能不能」。"""
    if not text:
        return False
    if text.rstrip().endswith(("?", "？")):
        return True
    keywords = ("吗", "为什么", "怎么", "如何", "是否", "能不能", "什么", "哪")
    return any(k in text for k in keywords)


def analyze_one_session(messages: list[dict]) -> dict:
    """对一组同 session 的消息生成质量指标。"""
    if not messages:
        return {}
    user_msgs = [m for m in messages if m["role"] == "user"]
    bot_msgs = [m for m in messages if m["role"] == "bot"]
    user_lengths = [len(m["text"] or "") for m in user_msgs]
    bot_lengths = [len(m["text"] or "") for m in bot_msgs]
    all_lengths = user_lengths + bot_lengths

    # 响应延迟：bot 消息相对于上一条 user 消息的时间差（秒）
    latencies = []
    last_user_ts = None
    for m in messages:
        ts = parse_iso(m.get("created_at"))
        if m["role"] == "user":
            last_user_ts = ts
        elif m["role"] == "bot" and last_user_ts is not None and ts is not None:
            latencies.append((ts - last_user_ts).total_seconds())
            last_user_ts = None

    avg_length = round(statistics.mean(all_lengths), 2) if all_lengths else 0
    user_questions = sum(1 for m in user_msgs if is_question(m["text"] or ""))
    question_ratio = round(user_questions / max(len(user_msgs), 1), 2)

    flags = []
    if len(messages) < MIN_MESSAGES:
        flags.append(f"消息数<{MIN_MESSAGES}")
    if avg_length < MIN_AVG_LENGTH:
        flags.append(f"平均长度<{MIN_AVG_LENGTH}")
    if user_lengths and max(user_lengths) < MIN_USER_MSG_LENGTH:
        flags.append("用户消息全部过短")
    low_quality = bool(flags)

    return {
        "session_id": messages[0]["session_id"],
        "persona_name": messages[0]["persona_name"],
        "message_count": len(messages),
        "user_messages": len(user_msgs),
        "bot_messages": len(bot_msgs),
        "turns": min(len(user_msgs), len(bot_msgs)),
        "avg_length": avg_length,
        "user_avg_length": round(statistics.mean(user_lengths), 2) if user_lengths else 0,
        "bot_avg_length": round(statistics.mean(bot_lengths), 2) if bot_lengths else 0,
        "length_buckets": length_buckets(all_lengths),
        "question_ratio": question_ratio,
        "avg_response_latency_sec": round(statistics.mean(latencies), 2) if latencies else None,
        "low_quality": low_quality,
        "low_quality_reasons": flags,
    }


def aggregate(per_session: list[dict]) -> dict:
    """聚合所有会话的指标。"""
    if not per_session:
        return {"sessions": 0}
    total = len(per_session)
    low_q = [s for s in per_session if s["low_quality"]]

    by_persona: dict[str, dict] = {}
    for s in per_session:
        key = s["persona_name"]
        agg = by_persona.setdefault(key, {
            "persona_name": key,
            "session_count": 0,
            "total_messages": 0,
            "avg_length_sum": 0.0,
            "low_quality_count": 0,
        })
        agg["session_count"] += 1
        agg["total_messages"] += s["message_count"]
        agg["avg_length_sum"] += s["avg_length"]
        if s["low_quality"]:
            agg["low_quality_count"] += 1

    # 收尾：算 persona 平均长度
    persona_summary = []
    for v in by_persona.values():
        sc = v["session_count"]
        persona_summary.append({
            "persona_name": v["persona_name"],
            "session_count": sc,
            "total_messages": v["total_messages"],
            "avg_session_length": round(v["avg_length_sum"] / sc, 2) if sc else 0,
            "low_quality_count": v["low_quality_count"],
            "low_quality_ratio": round(v["low_quality_count"] / sc, 2) if sc else 0,
        })
    persona_summary.sort(key=lambda x: -x["session_count"])

    overall_avg = round(
        statistics.mean([s["avg_length"] for s in per_session]), 2
    )
    return {
        "total_sessions": total,
        "low_quality_sessions": len(low_q),
        "low_quality_ratio": round(len(low_q) / total, 2),
        "overall_avg_length": overall_avg,
        "by_persona": persona_summary,
        "low_quality_session_ids": [s["session_id"] for s in low_q],
    }


def maybe_render_charts(per_session: list[dict], out_dir: Path) -> list[str]:
    """如指定 --charts，绘制三张 PNG 图（依赖 pandas + matplotlib）。"""
    try:
        import matplotlib  # type: ignore
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt  # type: ignore
    except ImportError:
        LOGGER.warning("matplotlib 未安装，跳过 charts。pip install matplotlib")
        return []

    out_dir.mkdir(parents=True, exist_ok=True)
    files = []

    # 图 1：消息长度分布（聚合所有 session 的 5 个桶）
    bucket_keys = ["1-5", "6-15", "16-30", "31-60", "61+"]
    totals = {k: 0 for k in bucket_keys}
    for s in per_session:
        for k in bucket_keys:
            totals[k] += s["length_buckets"].get(k, 0)
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(bucket_keys, [totals[k] for k in bucket_keys], color="#4C72B0")
    ax.set_title("Message Length Distribution")
    ax.set_xlabel("Length (chars)")
    ax.set_ylabel("Messages")
    fig.tight_layout()
    p = out_dir / "length_distribution.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    files.append(str(p))

    # 图 2：每 persona 的 session 数 vs 低质量比
    by_p: dict[str, dict] = {}
    for s in per_session:
        d = by_p.setdefault(s["persona_name"], {"sessions": 0, "low_q": 0})
        d["sessions"] += 1
        if s["low_quality"]:
            d["low_q"] += 1
    names = list(by_p.keys())
    sessions = [by_p[n]["sessions"] for n in names]
    low_q = [by_p[n]["low_q"] for n in names]
    fig, ax = plt.subplots(figsize=(10, 4))
    x = range(len(names))
    ax.bar(x, sessions, label="Total sessions", color="#55A868")
    ax.bar(x, low_q, label="Low quality", color="#C44E52")
    ax.set_xticks(list(x))
    ax.set_xticklabels(names, rotation=30, ha="right")
    ax.set_title("Sessions per Persona (low quality highlighted)")
    ax.legend()
    fig.tight_layout()
    p = out_dir / "by_persona.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    files.append(str(p))

    # 图 3：对话深度散点（轮次 vs 平均长度）
    fig, ax = plt.subplots(figsize=(7, 5))
    xs = [s["turns"] for s in per_session]
    ys = [s["avg_length"] for s in per_session]
    colors = ["#C44E52" if s["low_quality"] else "#4C72B0" for s in per_session]
    ax.scatter(xs, ys, c=colors, alpha=0.7)
    ax.set_xlabel("Turns")
    ax.set_ylabel("Avg message length")
    ax.set_title("Conversation Depth vs Avg Length (red = low quality)")
    fig.tight_layout()
    p = out_dir / "depth_scatter.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    files.append(str(p))

    LOGGER.info("已生成 %d 张图：%s", len(files), out_dir)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="对话质量分析")
    parser.add_argument("--session-id", type=str, default=None, help="只分析单会话")
    parser.add_argument("--output", type=str, default=None, help="JSON 输出路径")
    parser.add_argument("--charts", action="store_true", help="生成 PNG 图（需 matplotlib）")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    args = parser.parse_args()

    conn = get_conn(args.db, readonly=True)
    rows = fetch_session_messages(conn, args.session_id)
    conn.close()

    if not rows:
        LOGGER.error("没有消息数据。session_id=%s", args.session_id)
        return 2

    # 按 session_id 分组
    grouped: dict[str, list[dict]] = {}
    for r in rows:
        grouped.setdefault(r["session_id"], []).append(r)
    per_session = [analyze_one_session(msgs) for msgs in grouped.values()]
    summary = aggregate(per_session) if not args.session_id else None

    today = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    if args.output:
        out = Path(args.output)
    elif args.session_id:
        out = REPORTS_DIR / f"quality_{args.session_id}_{today}.json"
    else:
        out = REPORTS_DIR / f"quality_{today}.json"

    payload = {
        "generated_at": utcnow_iso(),
        "mode": "single" if args.session_id else "all",
        "session_id_filter": args.session_id,
        "per_session": per_session,
    }
    if summary:
        payload["summary"] = summary
    if args.charts:
        payload["charts"] = maybe_render_charts(per_session, REPORTS_DIR / "charts")

    write_json(payload, out)
    LOGGER.info(
        "已分析 %d 会话（低质量 %d）→ %s",
        len(per_session),
        sum(1 for s in per_session if s["low_quality"]),
        out,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
