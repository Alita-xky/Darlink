"""数据查询层：所有看板用到的 SQL 集中在这里，便于测试 + 复用。

设计原则：
- 全部接 Filters 数据类，参数化 SQL 防注入
- 返回 pandas DataFrame，渲染层直接用
- 所有函数被 @st.cache_data 装饰，60s TTL
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from _common import get_conn, parse_meta, row_to_dict  # noqa: E402


@dataclass
class Filters:
    """全局过滤器。空 list / None 表示不过滤。"""
    start_date: date | None = None
    end_date: date | None = None
    persona_ids: list[int] = field(default_factory=list)
    user_ids: list[int] = field(default_factory=list)

    def to_session_clauses(self, table_alias: str = "s") -> tuple[str, list]:
        """生成 sessions 表的 WHERE 子句和参数。返回 (clause_sql, params)。

        clause_sql 形如 "AND s.last_at >= ? AND s.persona_id IN (?,?)" — 注意前缀 AND。
        """
        clauses: list[str] = []
        params: list = []
        if self.start_date:
            clauses.append(f"AND DATE({table_alias}.last_at) >= ?")
            params.append(self.start_date.isoformat())
        if self.end_date:
            clauses.append(f"AND DATE({table_alias}.last_at) <= ?")
            params.append(self.end_date.isoformat())
        if self.persona_ids:
            ph = ",".join("?" * len(self.persona_ids))
            clauses.append(f"AND {table_alias}.persona_id IN ({ph})")
            params.extend(self.persona_ids)
        if self.user_ids:
            ph = ",".join("?" * len(self.user_ids))
            clauses.append(f"AND {table_alias}.user_id IN ({ph})")
            params.extend(self.user_ids)
        return " ".join(clauses), params

    def to_message_clauses(self, msg_alias: str = "m", sess_alias: str = "s") -> tuple[str, list]:
        """生成 messages JOIN sessions 的 WHERE 子句。"""
        clauses: list[str] = []
        params: list = []
        if self.start_date:
            clauses.append(f"AND DATE({msg_alias}.created_at) >= ?")
            params.append(self.start_date.isoformat())
        if self.end_date:
            clauses.append(f"AND DATE({msg_alias}.created_at) <= ?")
            params.append(self.end_date.isoformat())
        if self.persona_ids:
            ph = ",".join("?" * len(self.persona_ids))
            clauses.append(f"AND {sess_alias}.persona_id IN ({ph})")
            params.extend(self.persona_ids)
        if self.user_ids:
            ph = ",".join("?" * len(self.user_ids))
            clauses.append(f"AND {sess_alias}.user_id IN ({ph})")
            params.extend(self.user_ids)
        return " ".join(clauses), params


# ==== 缓存友好的查询 ===================================================
# st.cache_data 用 (sql, params) 作为 hash key；所以保留 params 元组


@st.cache_data(ttl=60)
def query_df(sql: str, params: tuple = ()) -> pd.DataFrame:
    conn = get_conn(readonly=True)
    try:
        return pd.read_sql_query(sql, conn, params=params)
    finally:
        conn.close()


# ==== 选项加载（用于 sidebar）===========================================

@st.cache_data(ttl=300)
def load_personas() -> pd.DataFrame:
    return query_df("SELECT id, name FROM personas ORDER BY id")


@st.cache_data(ttl=300)
def load_users() -> pd.DataFrame:
    return query_df("SELECT id, email FROM users ORDER BY id")


@st.cache_data(ttl=300)
def date_range_bounds() -> tuple[date | None, date | None]:
    """数据库中 messages.created_at 的最早 / 最晚日期，用作 date_input 默认值。"""
    df = query_df(
        "SELECT MIN(DATE(created_at)) AS lo, MAX(DATE(created_at)) AS hi FROM messages"
    )
    if df.empty or pd.isna(df.iloc[0]["lo"]):
        return None, None
    return (
        date.fromisoformat(df.iloc[0]["lo"]),
        date.fromisoformat(df.iloc[0]["hi"]),
    )


# ==== 总览 Tab =========================================================

def kpis(filters: Filters) -> dict:
    """4 个 KPI 数字。返回一个字典。"""
    sclause, sparams = filters.to_session_clauses("s")
    mclause, mparams = filters.to_message_clauses("m", "s")

    user = query_df(
        "SELECT COUNT(*) AS total, "
        "SUM(CASE WHEN verified=1 THEN 1 ELSE 0 END) AS verified, "
        "SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS new7d "
        "FROM users"
    ).iloc[0]
    sess = query_df(
        f"SELECT COUNT(*) AS total, "
        f"SUM(CASE WHEN started_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS new7d "
        f"FROM sessions s WHERE 1=1 {sclause}",
        tuple(sparams),
    ).iloc[0]
    msg = query_df(
        f"SELECT COUNT(*) AS total, "
        f"SUM(CASE WHEN m.role='user' THEN 1 ELSE 0 END) AS user_msgs, "
        f"SUM(CASE WHEN m.role='bot' THEN 1 ELSE 0 END) AS bot_msgs, "
        f"ROUND(AVG(LENGTH(m.text)),1) AS avg_len "
        f"FROM messages m JOIN sessions s ON s.id=m.session_id "
        f"WHERE 1=1 {mclause}",
        tuple(mparams),
    ).iloc[0]
    avg_session_len = (msg["total"] / sess["total"]) if sess["total"] else 0

    return {
        "users_total": int(user["total"] or 0),
        "users_verified": int(user["verified"] or 0),
        "users_new7d": int(user["new7d"] or 0),
        "sessions_total": int(sess["total"] or 0),
        "sessions_new7d": int(sess["new7d"] or 0),
        "messages_total": int(msg["total"] or 0),
        "messages_user": int(msg["user_msgs"] or 0),
        "messages_bot": int(msg["bot_msgs"] or 0),
        "messages_avg_len": float(msg["avg_len"] or 0),
        "avg_session_len": round(avg_session_len, 1),
    }


def daily_activity(filters: Filters) -> pd.DataFrame:
    """每日 messages 数 + sessions 数，过滤后。"""
    mclause, mparams = filters.to_message_clauses("m", "s")
    sclause, sparams = filters.to_session_clauses("s")
    msgs = query_df(
        f"SELECT DATE(m.created_at) AS date, COUNT(*) AS messages "
        f"FROM messages m JOIN sessions s ON s.id=m.session_id "
        f"WHERE 1=1 {mclause} GROUP BY DATE(m.created_at) ORDER BY date",
        tuple(mparams),
    )
    sess = query_df(
        f"SELECT DATE(s.started_at) AS date, COUNT(*) AS sessions "
        f"FROM sessions s WHERE 1=1 {sclause} GROUP BY DATE(s.started_at) ORDER BY date",
        tuple(sparams),
    )
    if msgs.empty and sess.empty:
        return pd.DataFrame(columns=["date", "messages", "sessions"])
    df = msgs.merge(sess, on="date", how="outer").fillna(0).sort_values("date")
    df["messages"] = df["messages"].astype(int)
    df["sessions"] = df["sessions"].astype(int)
    return df


def top_users(filters: Filters, n: int = 5) -> pd.DataFrame:
    mclause, mparams = filters.to_message_clauses("m", "s")
    return query_df(
        f"SELECT u.email, COUNT(m.id) AS messages "
        f"FROM users u "
        f"JOIN messages m ON m.user_id=u.id AND m.role='user' "
        f"JOIN sessions s ON s.id=m.session_id "
        f"WHERE 1=1 {mclause} "
        f"GROUP BY u.email ORDER BY messages DESC LIMIT ?",
        tuple(mparams) + (n,),
    )


def top_personas(filters: Filters, n: int = 5) -> pd.DataFrame:
    sclause, sparams = filters.to_session_clauses("s")
    return query_df(
        f"SELECT p.name, COUNT(s.id) AS sessions "
        f"FROM personas p JOIN sessions s ON s.persona_id=p.id "
        f"WHERE 1=1 {sclause} "
        f"GROUP BY p.name ORDER BY sessions DESC LIMIT ?",
        tuple(sparams) + (n,),
    )


# ==== Persona Tab =====================================================

def persona_breakdown(filters: Filters) -> pd.DataFrame:
    """每个 persona 的会话数 / 消息数 / 平均长度（用于气泡图和数据表）。

    实现要点：日期 / 用户过滤放到 LEFT JOIN 的 ON 子句里，保证零会话的 persona 也保留；
    persona 自身过滤放到 WHERE，让用户取消勾选的 persona 直接消失。
    """
    join_parts = ["s.persona_id = p.id"]
    params: list = []
    if filters.start_date:
        join_parts.append("DATE(s.last_at) >= ?")
        params.append(filters.start_date.isoformat())
    if filters.end_date:
        join_parts.append("DATE(s.last_at) <= ?")
        params.append(filters.end_date.isoformat())
    if filters.user_ids:
        ph = ",".join("?" * len(filters.user_ids))
        join_parts.append(f"s.user_id IN ({ph})")
        params.extend(filters.user_ids)
    sess_join_cond = " AND ".join(join_parts)

    where = ""
    if filters.persona_ids:
        ph = ",".join("?" * len(filters.persona_ids))
        where = f"WHERE p.id IN ({ph})"
        params.extend(filters.persona_ids)

    sql = f"""
        SELECT p.id, p.name AS persona_name,
               COUNT(DISTINCT s.id) AS sessions,
               COUNT(m.id) AS messages,
               ROUND(COALESCE(AVG(LENGTH(m.text)), 0), 2) AS avg_msg_length
        FROM personas p
        LEFT JOIN sessions s ON {sess_join_cond}
        LEFT JOIN messages m ON m.session_id = s.id
        {where}
        GROUP BY p.id, p.name
        ORDER BY sessions DESC, p.id
    """
    return query_df(sql, tuple(params))


def user_persona_matrix(filters: Filters) -> pd.DataFrame:
    """用户 × persona 会话数矩阵（用于热力图）。返回长格式。"""
    sclause, sparams = filters.to_session_clauses("s")
    return query_df(
        f"SELECT u.email, p.name AS persona_name, COUNT(s.id) AS sessions "
        f"FROM sessions s "
        f"JOIN users u ON u.id=s.user_id "
        f"JOIN personas p ON p.id=s.persona_id "
        f"WHERE 1=1 {sclause} "
        f"GROUP BY u.email, p.name ORDER BY u.email, p.name",
        tuple(sparams),
    )


# ==== 质量分析 Tab =====================================================

def session_quality(filters: Filters) -> pd.DataFrame:
    """每个 session 的质量指标。"""
    sclause, sparams = filters.to_session_clauses("s")
    df = query_df(
        f"SELECT s.id, p.name AS persona_name, u.email, "
        f"COUNT(m.id) AS msg_count, "
        f"SUM(CASE WHEN m.role='user' THEN 1 ELSE 0 END) AS user_msgs, "
        f"SUM(CASE WHEN m.role='bot' THEN 1 ELSE 0 END) AS bot_msgs, "
        f"ROUND(AVG(LENGTH(m.text)), 1) AS avg_length, "
        f"s.started_at, s.last_at "
        f"FROM sessions s "
        f"LEFT JOIN messages m ON m.session_id=s.id "
        f"LEFT JOIN users u ON u.id=s.user_id "
        f"LEFT JOIN personas p ON p.id=s.persona_id "
        f"WHERE 1=1 {sclause} "
        f"GROUP BY s.id, p.name, u.email, s.started_at, s.last_at "
        f"ORDER BY s.last_at DESC",
        tuple(sparams),
    )
    if df.empty:
        return df
    df["turns"] = df[["user_msgs", "bot_msgs"]].min(axis=1).astype(int)
    df["low_quality"] = (df["msg_count"] < 4) | (df["avg_length"] < 10)
    return df


def message_lengths(filters: Filters, role: str | None = None) -> pd.DataFrame:
    """所有消息的长度（直方图用）。role=None 表示全部。"""
    mclause, mparams = filters.to_message_clauses("m", "s")
    role_clause = ""
    role_params: list = []
    if role in ("user", "bot"):
        role_clause = "AND m.role = ?"
        role_params = [role]
    return query_df(
        f"SELECT m.role, LENGTH(m.text) AS length "
        f"FROM messages m JOIN sessions s ON s.id=m.session_id "
        f"WHERE 1=1 {mclause} {role_clause}",
        tuple(mparams) + tuple(role_params),
    )


# ==== 会话明细 Tab =====================================================

def session_list(filters: Filters) -> pd.DataFrame:
    """供 selectbox 使用的会话清单（含足够元信息让用户挑）。"""
    sclause, sparams = filters.to_session_clauses("s")
    return query_df(
        f"SELECT s.id AS session_id, "
        f"p.name AS persona_name, u.email AS user_email, "
        f"s.started_at, s.last_at, "
        f"(SELECT COUNT(*) FROM messages m WHERE m.session_id=s.id) AS msg_count "
        f"FROM sessions s "
        f"LEFT JOIN users u ON u.id=s.user_id "
        f"LEFT JOIN personas p ON p.id=s.persona_id "
        f"WHERE 1=1 {sclause} "
        f"ORDER BY s.last_at DESC",
        tuple(sparams),
    )


def session_detail(session_id: str) -> tuple[dict | None, pd.DataFrame]:
    """单会话的元信息 + 全部消息。"""
    head = query_df(
        "SELECT s.id, s.started_at, s.last_at, s.skill_name, "
        "u.id AS user_id, u.email AS user_email, u.verified, "
        "p.id AS persona_id, p.name AS persona_name, p.desc AS persona_desc "
        "FROM sessions s "
        "LEFT JOIN users u ON u.id=s.user_id "
        "LEFT JOIN personas p ON p.id=s.persona_id "
        "WHERE s.id = ?",
        (session_id,),
    )
    if head.empty:
        return None, pd.DataFrame()
    msgs = query_df(
        "SELECT id, role, text, meta, created_at "
        "FROM messages WHERE session_id = ? ORDER BY created_at, id",
        (session_id,),
    )
    return head.iloc[0].to_dict(), msgs
