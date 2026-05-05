#!/usr/bin/env python3
"""Streamlit 看板 — 交互式版（浅色·温暖主题）。

四个 Tab：
  1. 总览          KPI 卡片 + 双轴折线 + Top 5
  2. Persona      气泡图 + 排行 + 用户×Persona 热力图 + 数据表
  3. 质量分析     KPI + 长度直方图 + 深度散点 + 低质量列表
  4. 会话明细     选 session → 类聊天 UI + 元信息 + JSON 下载

侧边栏全局过滤器：日期范围 + persona 多选 + 用户多选，所有 tab 联动。

启动：
    streamlit run scripts/dashboard.py
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime, timezone
from io import BytesIO
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import pandas as pd  # noqa: E402
import plotly.express as px  # noqa: E402
import plotly.graph_objects as go  # noqa: E402
import streamlit as st  # noqa: E402

import data_layer as dl  # noqa: E402
from _common import DB_PATH, parse_meta  # noqa: E402
from _dashboard_styles import (  # noqa: E402
    PLOTLY_COLORWAY,
    WARM_PALETTE,
    chat_message,
    empty_state,
    inject_css,
    kpi_card,
    meta_card,
    plotly_layout,
)
from export_session import build_export  # noqa: E402

st.set_page_config(
    page_title="Darlink 数据看板",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ====== 侧边栏 ======================================================

def render_sidebar() -> dl.Filters:
    st.sidebar.markdown(
        f"<h2 style='color:{WARM_PALETTE['primary']}; margin:0 0 6px 0;'>📊 Darlink</h2>"
        "<div style='color:#78716C; font-size:0.85rem; margin-bottom:18px;'>数据看板 · 交互式</div>",
        unsafe_allow_html=True,
    )

    if not DB_PATH.exists():
        st.sidebar.error(f"数据库不存在：\n`{DB_PATH}`")
        return dl.Filters()

    # 日期范围默认值：取数据库实际最早/最晚
    lo, hi = dl.date_range_bounds()
    default_range = (lo, hi) if lo and hi else (date.today(), date.today())

    st.sidebar.markdown("**🔍 过滤器**")
    date_range = st.sidebar.date_input(
        "日期范围",
        value=default_range,
        min_value=lo,
        max_value=hi,
        key="filter_date",
    )
    if isinstance(date_range, tuple) and len(date_range) == 2:
        start_d, end_d = date_range
    else:
        start_d, end_d = default_range

    personas_df = dl.load_personas()
    persona_options = personas_df["id"].tolist() if not personas_df.empty else []
    selected_personas = st.sidebar.multiselect(
        "Persona（不选 = 全部）",
        options=persona_options,
        format_func=lambda i: personas_df.set_index("id").loc[i, "name"]
        if i in personas_df["id"].values else str(i),
        key="filter_persona",
    )

    users_df = dl.load_users()
    user_options = users_df["id"].tolist() if not users_df.empty else []
    selected_users = st.sidebar.multiselect(
        "用户（不选 = 全部）",
        options=user_options,
        format_func=lambda i: users_df.set_index("id").loc[i, "email"]
        if i in users_df["id"].values else str(i),
        key="filter_user",
    )

    st.sidebar.markdown("---")
    st.sidebar.caption(f"数据缓存 60s · 当前 UTC {datetime.now(timezone.utc).strftime('%H:%M:%S')}")
    if st.sidebar.button("🔄 强制刷新", use_container_width=True):
        st.cache_data.clear()
        st.rerun()

    return dl.Filters(
        start_date=start_d,
        end_date=end_d,
        persona_ids=selected_personas,
        user_ids=selected_users,
    )


# ====== Tab 1: 总览 ==================================================

def tab_overview(filters: dl.Filters) -> None:
    k = dl.kpis(filters)

    if k["sessions_total"] == 0:
        empty_state("过滤后没有会话数据", "试试扩大日期范围或不选 persona")
        return

    # KPI 卡片：4 列
    cols = st.columns(4)
    with cols[0]:
        kpi_card(
            "用户",
            k["users_total"],
            f"已验证 {k['users_verified']} · 未验证 {k['users_total'] - k['users_verified']}",
        )
    with cols[1]:
        kpi_card(
            "会话",
            k["sessions_total"],
            f"近 7 天 +{k['sessions_new7d']}" if k["sessions_new7d"] else "近 7 天 0",
        )
    with cols[2]:
        ratio = (k["messages_user"] / k["messages_total"] * 100) if k["messages_total"] else 0
        kpi_card(
            "消息",
            k["messages_total"],
            f"用户 {ratio:.0f}% · 平均 {k['messages_avg_len']:.0f} 字",
        )
    with cols[3]:
        kpi_card("平均会话长度", f"{k['avg_session_len']:.1f}", "条消息 / 会话")

    st.markdown("<div style='margin-top:24px'></div>", unsafe_allow_html=True)

    # 双轴折线
    daily = dl.daily_activity(filters)
    if not daily.empty:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=daily["date"], y=daily["messages"], name="消息数",
            mode="lines+markers", line=dict(color=WARM_PALETTE["primary"], width=2.5),
            marker=dict(size=7),
        ))
        fig.add_trace(go.Scatter(
            x=daily["date"], y=daily["sessions"], name="会话数",
            mode="lines+markers", line=dict(color=WARM_PALETTE["accent"], width=2, dash="dot"),
            marker=dict(size=6), yaxis="y2",
        ))
        # 双轴 chart：拿到 layout 后再覆盖 yaxis，避免 update_layout 重复 kwarg 报错
        layout = plotly_layout("📈 每日活跃趋势", height=380)
        layout["yaxis"] = dict(title="消息数", gridcolor=WARM_PALETTE["muted"])
        layout["yaxis2"] = dict(title="会话数", overlaying="y", side="right", showgrid=False)
        layout["hovermode"] = "x unified"
        fig.update_layout(**layout)
        st.plotly_chart(fig, use_container_width=True)
    else:
        empty_state("此范围无活跃数据", emoji="📭")

    # Top 5 横向柱
    col_l, col_r = st.columns(2)
    with col_l:
        tu = dl.top_users(filters, n=5)
        if not tu.empty:
            tu = tu.sort_values("messages")
            fig = px.bar(tu, x="messages", y="email", orientation="h",
                         color_discrete_sequence=[WARM_PALETTE["primary"]])
            fig.update_layout(**plotly_layout("👤 Top 5 活跃用户", height=300))
            fig.update_traces(hovertemplate="%{y}<br>消息数 %{x}<extra></extra>")
            st.plotly_chart(fig, use_container_width=True)
    with col_r:
        tp = dl.top_personas(filters, n=5)
        if not tp.empty:
            tp = tp.sort_values("sessions")
            fig = px.bar(tp, x="sessions", y="name", orientation="h",
                         color_discrete_sequence=[WARM_PALETTE["accent"]])
            fig.update_layout(**plotly_layout("🎭 Top 5 热门 Persona", height=300))
            fig.update_traces(hovertemplate="%{y}<br>会话数 %{x}<extra></extra>")
            st.plotly_chart(fig, use_container_width=True)


# ====== Tab 2: Persona ===============================================

def tab_persona(filters: dl.Filters) -> None:
    df = dl.persona_breakdown(filters)
    if df.empty or df["sessions"].sum() == 0:
        empty_state("过滤后没有 persona 数据")
        return

    # 气泡图：x 会话数, y 平均长度, size 消息数
    fig = px.scatter(
        df[df["sessions"] > 0],
        x="sessions", y="avg_msg_length", size="messages",
        color="persona_name", hover_name="persona_name",
        size_max=60,
        color_discrete_sequence=PLOTLY_COLORWAY,
    )
    fig.update_layout(
        **plotly_layout("💬 Persona 活跃度 × 对话深度", height=440),
        xaxis_title="会话数", yaxis_title="平均消息长度（字）",
        showlegend=True,
    )
    st.plotly_chart(fig, use_container_width=True)

    col_l, col_r = st.columns([3, 2])

    with col_l:
        # 横向排行
        df_sorted = df.sort_values("sessions")
        fig = px.bar(
            df_sorted, x="sessions", y="persona_name", orientation="h",
            color="sessions", color_continuous_scale=[
                WARM_PALETTE["muted"], WARM_PALETTE["primary"],
            ],
        )
        fig.update_layout(
            **plotly_layout("🏆 13 个 Persona 排行", height=440),
            coloraxis_showscale=False,
        )
        fig.update_traces(hovertemplate="%{y}<br>会话 %{x}<extra></extra>")
        st.plotly_chart(fig, use_container_width=True)

    with col_r:
        # 用户 × persona 热力图
        m = dl.user_persona_matrix(filters)
        if not m.empty:
            pivot = m.pivot(index="email", columns="persona_name", values="sessions").fillna(0)
            fig = px.imshow(
                pivot, aspect="auto",
                color_continuous_scale=["#FFFFFF", WARM_PALETTE["primary"]],
                labels=dict(x="Persona", y="User", color="会话"),
            )
            fig.update_layout(**plotly_layout("🔥 用户 × Persona 热力图", height=440))
            st.plotly_chart(fig, use_container_width=True)
        else:
            empty_state("热力图无数据", emoji="🔥")

    # 数据表 + CSV 下载
    st.markdown("**详细数据**")
    st.dataframe(df, use_container_width=True, hide_index=True)
    csv = df.to_csv(index=False).encode("utf-8-sig")
    st.download_button(
        "⬇️ 下载 CSV", csv,
        file_name=f"persona_breakdown_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv",
    )


# ====== Tab 3: 质量分析 ==============================================

def tab_quality(filters: dl.Filters) -> None:
    df = dl.session_quality(filters)
    if df.empty:
        empty_state("过滤后没有会话")
        return

    # KPI
    cols = st.columns(3)
    total = len(df)
    low = int(df["low_quality"].sum())
    ratio = low / total * 100 if total else 0
    with cols[0]:
        kpi_card("总会话", total)
    with cols[1]:
        kpi_card("低质量会话", low, "消息<4 OR 平均长度<10 字")
    with cols[2]:
        kpi_card("低质量比例", f"{ratio:.1f}%")

    st.markdown("<div style='margin-top:24px'></div>", unsafe_allow_html=True)

    # 长度直方图：可按 user/bot 切换
    col_l, col_r = st.columns([3, 2])
    with col_l:
        role_choice = st.radio(
            "消息长度分布", ["全部", "用户消息", "Bot 回复"],
            horizontal=True, label_visibility="collapsed",
        )
        role_arg = {"全部": None, "用户消息": "user", "Bot 回复": "bot"}[role_choice]
        lengths = dl.message_lengths(filters, role=role_arg)
        if not lengths.empty:
            fig = px.histogram(
                lengths, x="length", nbins=24,
                color_discrete_sequence=[WARM_PALETTE["primary"]],
            )
            fig.update_layout(
                **plotly_layout(f"📏 消息长度分布 — {role_choice}", height=380),
                xaxis_title="字符数", yaxis_title="消息数", bargap=0.05,
            )
            st.plotly_chart(fig, use_container_width=True)

    with col_r:
        # 散点图：轮次 vs 平均长度
        df_plot = df.copy()
        df_plot["status"] = df_plot["low_quality"].map({True: "⚠️ 低质量", False: "✅ 正常"})
        fig = px.scatter(
            df_plot, x="turns", y="avg_length",
            color="status", hover_data=["id", "persona_name", "email", "msg_count"],
            color_discrete_map={"⚠️ 低质量": WARM_PALETTE["danger"], "✅ 正常": WARM_PALETTE["primary"]},
        )
        fig.update_layout(
            **plotly_layout("🎯 对话深度 × 平均长度", height=380),
            xaxis_title="轮次", yaxis_title="平均长度（字）",
        )
        fig.update_traces(marker=dict(size=10, opacity=0.7))
        st.plotly_chart(fig, use_container_width=True)

    # 低质量会话列表
    st.markdown("**⚠️ 低质量会话**")
    low_df = df[df["low_quality"]].sort_values("msg_count")
    if low_df.empty:
        st.success("🎉 当前过滤范围内没有低质量会话")
    else:
        st.dataframe(
            low_df[["id", "persona_name", "email", "msg_count", "avg_length", "started_at"]],
            use_container_width=True, hide_index=True,
        )
        st.caption(f"💡 把低质量 session_id 拷到「会话明细」Tab 可查看具体对话内容")


# ====== Tab 4: 会话明细 ==============================================

def tab_session_detail(filters: dl.Filters) -> None:
    sessions = dl.session_list(filters)
    if sessions.empty:
        empty_state("过滤后没有会话可查看")
        return

    # 选择器
    def fmt(sid: str) -> str:
        row = sessions[sessions["session_id"] == sid].iloc[0]
        return (
            f"{row['session_id'][:18]}…  "
            f"·  {row['persona_name'] or '?'}  "
            f"·  {row['user_email'] or '?'}  "
            f"·  {row['msg_count']} 条"
        )

    chosen = st.selectbox(
        "选择会话",
        options=sessions["session_id"].tolist(),
        format_func=fmt,
        key="detail_session",
    )
    if not chosen:
        return

    head, msgs = dl.session_detail(chosen)
    if head is None:
        st.error("会话不存在")
        return

    col_chat, col_meta = st.columns([3, 1])

    with col_meta:
        meta_card([
            ("Session ID", head["id"][:24] + "..."),
            ("Persona", head["persona_name"] or "?"),
            ("User", head["user_email"] or "?"),
            ("已验证", "✓" if head.get("verified") else "—"),
            ("开始", str(head["started_at"])[:19]),
            ("结束", str(head["last_at"])[:19]),
            ("消息数", str(len(msgs))),
        ])

        # 下载 JSON 按钮：复用 export_session.build_export
        try:
            from _common import get_conn
            conn = get_conn(readonly=True)
            export_data = build_export(conn, chosen)
            conn.close()
            json_bytes = json.dumps(
                export_data, ensure_ascii=False, indent=2, default=str
            ).encode("utf-8")
            st.download_button(
                "⬇️ 下载 JSON",
                data=json_bytes,
                file_name=f"{chosen}.json",
                mime="application/json",
                use_container_width=True,
            )
        except Exception as e:
            st.warning(f"下载暂不可用：{e}")

    with col_chat:
        st.markdown(f"### 💬 {head['persona_name']} × {head['user_email']}")
        if msgs.empty:
            empty_state("这个会话没有消息")
        else:
            persona_initial = (head["persona_name"] or "P")[:1].upper()
            # 长会话默认只渲染前 50 条
            shown = msgs.head(50)
            for _, m in shown.iterrows():
                ts = str(m["created_at"])[:19]
                chat_message(
                    role=m["role"],
                    text=m["text"] or "",
                    time=ts,
                    persona_initial=persona_initial,
                )
            if len(msgs) > 50:
                st.caption(f"显示前 50 条 / 共 {len(msgs)} 条 · 完整内容请下载 JSON")


# ====== 主入口 =======================================================

def main() -> None:
    inject_css()

    if not DB_PATH.exists():
        st.error(
            f"数据库不存在：`{DB_PATH}`\n\n"
            "先运行：`python scripts/seed_demo_data.py --users 10 --sessions 30`"
        )
        st.stop()

    filters = render_sidebar()

    # 顶部标题（小一些，让 KPI 唱主角）
    st.markdown(
        f"<div style='display:flex; align-items:baseline; gap:14px; margin-bottom:14px;'>"
        f"<h1 style='margin:0; color:{WARM_PALETTE['text']};'>Darlink 数据看板</h1>"
        f"<span style='color:#78716C;'>· "
        f"{filters.start_date or '?'} → {filters.end_date or '?'}</span>"
        f"</div>",
        unsafe_allow_html=True,
    )

    t1, t2, t3, t4 = st.tabs(["📊 总览", "🎭 Persona", "🔍 质量分析", "💬 会话明细"])
    with t1:
        tab_overview(filters)
    with t2:
        tab_persona(filters)
    with t3:
        tab_quality(filters)
    with t4:
        tab_session_detail(filters)


if __name__ == "__main__":
    main()
