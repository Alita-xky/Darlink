#!/usr/bin/env python3
"""Streamlit 看板：实时统计 + 按 persona + 质量分析三页。

用法：
    pip install streamlit pandas
    streamlit run scripts/dashboard.py
    # 浏览器打开 http://localhost:8501
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from _common import DB_PATH, get_conn  # noqa: E402

st.set_page_config(page_title="Darlink 数据看板", page_icon="📊", layout="wide")


@st.cache_data(ttl=60)
def query_df(sql: str, params: tuple = ()) -> pd.DataFrame:
    conn = get_conn(readonly=True)
    try:
        return pd.read_sql_query(sql, conn, params=params)
    finally:
        conn.close()


def page_overview() -> None:
    st.header("📊 总览")
    col1, col2, col3, col4 = st.columns(4)

    users = query_df(
        "SELECT COUNT(*) AS total, "
        "SUM(CASE WHEN verified=1 THEN 1 ELSE 0 END) AS verified FROM users"
    ).iloc[0]
    sessions = query_df("SELECT COUNT(*) AS total FROM sessions").iloc[0]
    msgs = query_df(
        "SELECT COUNT(*) AS total, ROUND(AVG(LENGTH(text)), 1) AS avg_len FROM messages"
    ).iloc[0]
    new_7d = query_df(
        "SELECT COUNT(*) AS n FROM users WHERE created_at >= datetime('now','-7 days')"
    ).iloc[0]

    col1.metric("用户", int(users["total"]), f"已验证 {int(users['verified'] or 0)}")
    col2.metric("会话", int(sessions["total"]))
    col3.metric("消息", int(msgs["total"]), f"平均 {msgs['avg_len']} 字符")
    col4.metric("近 7 天新用户", int(new_7d["n"]))

    st.divider()
    st.subheader("近 14 天消息趋势")
    daily = query_df(
        "SELECT DATE(created_at) AS date, COUNT(*) AS messages "
        "FROM messages WHERE created_at >= datetime('now','-14 days') "
        "GROUP BY DATE(created_at) ORDER BY date"
    )
    if not daily.empty:
        st.line_chart(daily.set_index("date")["messages"])
    else:
        st.info("暂无数据")

    st.subheader("Top 5 活跃用户")
    top_users = query_df(
        "SELECT u.email, COUNT(m.id) AS messages "
        "FROM users u JOIN messages m ON m.user_id = u.id AND m.role = 'user' "
        "GROUP BY u.email ORDER BY messages DESC LIMIT 5"
    )
    st.dataframe(top_users, use_container_width=True)


def page_persona() -> None:
    st.header("🎭 按 Persona 分析")
    df = query_df(
        "SELECT p.id, p.name AS persona_name, "
        "COUNT(DISTINCT s.id) AS sessions, "
        "COUNT(m.id) AS messages, "
        "ROUND(AVG(LENGTH(m.text)), 2) AS avg_msg_length "
        "FROM personas p "
        "LEFT JOIN sessions s ON s.persona_id = p.id "
        "LEFT JOIN messages m ON m.session_id = s.id "
        "GROUP BY p.id, p.name ORDER BY sessions DESC, p.id"
    )
    st.dataframe(df, use_container_width=True)

    st.subheader("会话数对比")
    if not df.empty and df["sessions"].sum() > 0:
        st.bar_chart(df.set_index("persona_name")["sessions"])

    st.subheader("平均消息长度对比")
    if not df.empty and df["messages"].sum() > 0:
        st.bar_chart(df.set_index("persona_name")["avg_msg_length"])


def page_quality() -> None:
    st.header("🔍 对话质量分析")
    df = query_df(
        "SELECT s.id, p.name AS persona_name, u.email, "
        "COUNT(m.id) AS msg_count, "
        "ROUND(AVG(LENGTH(m.text)), 1) AS avg_length, "
        "s.started_at "
        "FROM sessions s "
        "LEFT JOIN messages m ON m.session_id = s.id "
        "LEFT JOIN users u ON u.id = s.user_id "
        "LEFT JOIN personas p ON p.id = s.persona_id "
        "GROUP BY s.id, p.name, u.email, s.started_at"
    )
    if df.empty:
        st.info("暂无数据")
        return

    # 低质量标记
    df["low_quality"] = (df["msg_count"] < 4) | (df["avg_length"] < 10)

    col1, col2, col3 = st.columns(3)
    col1.metric("总会话", len(df))
    col2.metric("低质量会话", int(df["low_quality"].sum()))
    ratio = df["low_quality"].mean() * 100 if len(df) else 0
    col3.metric("低质量比例", f"{ratio:.1f}%")

    st.divider()
    st.subheader("会话长度分布")
    bins = pd.cut(df["msg_count"], bins=[0, 4, 10, 20, 40, 1000],
                  labels=["<4", "4-9", "10-19", "20-39", "40+"])
    dist = bins.value_counts().sort_index()
    st.bar_chart(dist)

    st.subheader("低质量会话列表")
    low_q_df = df[df["low_quality"]].sort_values("msg_count")
    if low_q_df.empty:
        st.success("没有低质量会话 🎉")
    else:
        st.dataframe(low_q_df, use_container_width=True)


def main() -> None:
    st.sidebar.title("Darlink 数据看板")
    st.sidebar.caption(f"DB: `{DB_PATH}`")
    st.sidebar.caption(f"刷新时间: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    st.sidebar.caption("数据缓存 60 秒")

    if st.sidebar.button("🔄 强制刷新"):
        st.cache_data.clear()
        st.rerun()

    page = st.sidebar.radio("页面", ["总览", "按 Persona", "质量分析"])

    if not DB_PATH.exists():
        st.error(f"数据库不存在：{DB_PATH}\n\n请先运行 `python scripts/seed_demo_data.py`")
        return

    if page == "总览":
        page_overview()
    elif page == "按 Persona":
        page_persona()
    elif page == "质量分析":
        page_quality()


if __name__ == "__main__":
    main()
