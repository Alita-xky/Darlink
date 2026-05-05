"""看板样式：配色、CSS、卡片渲染函数。

集中放一起，避免 dashboard.py 顶部塞一大坨 markdown。
"""

from __future__ import annotations

import streamlit as st

# 配色：浅色·温暖。所有 plotly 图表共用这套。
WARM_PALETTE = {
    "primary":   "#EF4444",   # 暑红 - 主数据
    "primary_l": "#FCA5A5",   # 浅暑红 - bot 气泡
    "accent":    "#F97316",   # 橙   - 次要
    "neutral":   "#A8A29E",   # 暖灰 - 辅助
    "success":   "#16A34A",   # 绿   - 正向
    "warning":   "#EAB308",   # 黄   - 警告
    "danger":    "#B91C1C",   # 深红 - 低质量
    "muted":     "#E7E5E4",   # 米   - 网格
    "bg":        "#FAF7F2",   # 米色底
    "surface":   "#FFFFFF",   # 卡片底
    "text":      "#1F1B16",   # 主文字
    "text_dim":  "#78716C",   # 次文字
}

# Plotly 图表颜色序列：用主色 + 渐变邻近色，避免乱七八糟
PLOTLY_COLORWAY = [
    "#EF4444", "#F97316", "#EAB308", "#16A34A",
    "#0EA5E9", "#8B5CF6", "#EC4899", "#14B8A6",
    "#F59E0B", "#84CC16", "#06B6D4", "#A855F7",
    "#F43F5E",
]


CSS = """
<style>
    /* 顶部 padding 收紧 */
    .block-container {padding-top: 1.5rem; padding-bottom: 2rem; max-width: 1400px;}

    /* KPI 卡片 */
    .kpi-card {
        background: #FFFFFF;
        border-radius: 12px;
        padding: 18px 20px;
        box-shadow: 0 1px 3px rgba(31,27,22,0.06), 0 1px 2px rgba(31,27,22,0.04);
        border: 1px solid #F3F0EA;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        height: 100%;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239,68,68,0.10), 0 2px 4px rgba(31,27,22,0.06);
    }
    .kpi-label {
        font-size: 0.85rem; color: #78716C; margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: 0.04em;
    }
    .kpi-value {
        font-size: 2rem; font-weight: 700; color: #1F1B16; line-height: 1.1;
    }
    .kpi-sub {
        font-size: 0.85rem; color: #78716C; margin-top: 4px;
    }
    .kpi-delta-up   {color: #16A34A; font-weight: 600;}
    .kpi-delta-down {color: #B91C1C; font-weight: 600;}

    /* Tab 强调 */
    .stTabs [data-baseweb="tab-list"] {gap: 8px;}
    .stTabs [data-baseweb="tab"] {
        padding: 10px 18px; border-radius: 8px 8px 0 0;
        background: transparent; font-weight: 500;
    }
    .stTabs [aria-selected="true"] {
        background: #FFFFFF; color: #EF4444;
        border-bottom: 2px solid #EF4444;
    }

    /* 聊天气泡 */
    .chat-row {display: flex; margin: 8px 0; gap: 10px;}
    .chat-row.user {flex-direction: row-reverse;}
    .chat-bubble {
        max-width: 70%; padding: 10px 14px; border-radius: 14px;
        font-size: 0.95rem; line-height: 1.5; word-wrap: break-word;
    }
    .chat-bubble.user {
        background: #FAF7F2; color: #1F1B16;
        border-bottom-right-radius: 4px;
    }
    .chat-bubble.bot {
        background: #FEE2E2; color: #1F1B16;
        border-bottom-left-radius: 4px;
    }
    .chat-avatar {
        width: 32px; height: 32px; border-radius: 50%;
        background: #EF4444; color: #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        font-weight: 600; font-size: 0.85rem; flex-shrink: 0;
    }
    .chat-avatar.user {background: #A8A29E;}
    .chat-time {
        font-size: 0.75rem; color: #A8A29E; margin: 2px 8px;
    }

    /* 空状态 */
    .empty-state {
        text-align: center; padding: 60px 20px;
        color: #78716C; background: #FFFFFF;
        border-radius: 12px; border: 1px dashed #E7E5E4;
    }
    .empty-state .emoji {font-size: 3rem; margin-bottom: 12px;}

    /* 元信息卡 */
    .meta-card {
        background: #FFFFFF; border-radius: 12px; padding: 16px;
        border: 1px solid #F3F0EA;
    }
    .meta-card .meta-row {
        display: flex; justify-content: space-between;
        padding: 6px 0; border-bottom: 1px solid #F3F0EA;
        font-size: 0.9rem;
    }
    .meta-card .meta-row:last-child {border-bottom: none;}
    .meta-card .meta-key {color: #78716C;}
    .meta-card .meta-val {color: #1F1B16; font-weight: 500;}
</style>
"""


def inject_css() -> None:
    """在每个 page 顶部调用一次。"""
    st.markdown(CSS, unsafe_allow_html=True)


def kpi_card(label: str, value: str | int, sub: str = "", delta: str | None = None) -> None:
    """渲染一个 KPI 卡片。在 col 容器里调用。

    delta: 形如 "+12" / "-3"，自动按符号上色。
    """
    delta_html = ""
    if delta:
        cls = "kpi-delta-up" if delta.startswith(("+", "↑")) else \
              "kpi-delta-down" if delta.startswith(("-", "↓")) else ""
        delta_html = f'<span class="{cls}">{delta}</span> '
    sub_html = f'<div class="kpi-sub">{delta_html}{sub}</div>' if (sub or delta) else ""
    st.markdown(
        f"""<div class="kpi-card">
              <div class="kpi-label">{label}</div>
              <div class="kpi-value">{value}</div>
              {sub_html}
            </div>""",
        unsafe_allow_html=True,
    )


def empty_state(title: str, hint: str = "调整过滤器或刷新", emoji: str = "📭") -> None:
    st.markdown(
        f"""<div class="empty-state">
              <div class="emoji">{emoji}</div>
              <div style="font-size:1.1rem; font-weight:500; margin-bottom:6px;">{title}</div>
              <div style="font-size:0.9rem;">{hint}</div>
            </div>""",
        unsafe_allow_html=True,
    )


def chat_message(role: str, text: str, time: str, persona_initial: str = "P") -> None:
    """聊天气泡：role='user' 或 'bot'。"""
    is_user = role == "user"
    side = "user" if is_user else "bot"
    initial = "U" if is_user else persona_initial
    avatar_cls = "chat-avatar user" if is_user else "chat-avatar"
    bubble_cls = f"chat-bubble {side}"
    # 按主流聊天 UI：时间放在气泡下方
    st.markdown(
        f"""<div class="chat-row {side}">
              <div class="{avatar_cls}">{initial}</div>
              <div>
                <div class="{bubble_cls}">{_escape(text)}</div>
                <div class="chat-time">{time}</div>
              </div>
            </div>""",
        unsafe_allow_html=True,
    )


def meta_card(rows: list[tuple[str, str]]) -> None:
    """渲染元信息卡片，rows = [(key, val), ...]"""
    inner = "".join(
        f'<div class="meta-row"><span class="meta-key">{k}</span>'
        f'<span class="meta-val">{v}</span></div>'
        for k, v in rows
    )
    st.markdown(f'<div class="meta-card">{inner}</div>', unsafe_allow_html=True)


def _escape(s: str) -> str:
    """非常简易的 HTML 转义，避免用户输入注入到聊天气泡。"""
    if not s:
        return ""
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace("\n", "<br>"))


def plotly_layout(title: str = "", height: int = 360) -> dict:
    """统一的 plotly layout，传给 fig.update_layout(**plotly_layout(...))"""
    return dict(
        title=dict(text=title, font=dict(size=16, color=WARM_PALETTE["text"])),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="sans-serif", color=WARM_PALETTE["text"]),
        margin=dict(l=20, r=20, t=40, b=20),
        height=height,
        colorway=PLOTLY_COLORWAY,
        xaxis=dict(gridcolor=WARM_PALETTE["muted"], zerolinecolor=WARM_PALETTE["muted"]),
        yaxis=dict(gridcolor=WARM_PALETTE["muted"], zerolinecolor=WARM_PALETTE["muted"]),
        legend=dict(bgcolor="rgba(255,255,255,0.6)"),
    )
