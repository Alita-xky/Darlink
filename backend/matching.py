"""用户↔用户匹配打分算法（纯函数，无 I/O，可单元测试）。

基于"数字人"画像给候选打分。四路信号加权，缺失信号重归一化降级：
任一信号缺失就丢掉它的权重、其余重新归一到 1，保证只有 embedding 的
用户也能得到有效的 0–1 分。

数据来源（每个 profile 的 dict 形状）::

    {
      "vector": [...384 维归一化向量...],        # UserProfile.vector
      "meta": {
        "onboarding": {                          # meta.onboarding
          "intent": "study|social|romance|...",
          "questionnaire": {"interests": "...", "school": "..."},
          "twinTags": ["...", ...],
        },
        "plaza_listing": {"category": "study|social|romance", ...},
        "distilled_traits": {                    # 仅聊天 ≥10 条后才有
          "thinking_style": {"logical": 0-1, ...},
          "values": {"long_term": 0-1, ...},
          "communication": {"concise": 0-1, ...},
          "interests": ["technology", ...],
        },
      },
    }
"""

import re

from embeddings import cosine_sim

DEFAULT_WEIGHTS = {"emb": 0.50, "interest": 0.20, "intent": 0.10, "trait": 0.20}

# trait 逐维聚合时的分组：
#   _MODE_DIMS 受 similar/complementary 模式影响
#   _VALUE_DIMS 两种模式都奖励"一致"（共同价值观在两种取向下都是加分项）
_MODE_DIMS = ("thinking_style", "communication")
_VALUE_DIMS = ("values",)

_TOKEN_SPLIT = re.compile(r"[\s,，、；;/|]+")


def _normalize_intent(value):
    """把原始 intent 文本归一到 study / social / romance（镜像 onboarding 的分类逻辑）。"""
    v = (value or "").strip().lower()
    if not v:
        return ""
    if v in {"study", "social", "romance"}:
        return v
    if "study" in v or "学习" in v or "學習" in v:
        return "study"
    if "romance" in v or "恋" in v or "戀" in v:
        return "romance"
    if "social" in v or "社交" in v:
        return "social"
    return "social"


def _tokenize(value):
    """把兴趣字段（可能是 str 或 list）拆成小写标签集合。"""
    tags = set()
    if not value:
        return tags
    items = value if isinstance(value, (list, tuple)) else [value]
    for item in items:
        if not isinstance(item, str):
            continue
        for tok in _TOKEN_SPLIT.split(item):
            tok = tok.strip().lower()
            if tok:
                tags.add(tok)
    return tags


def _collect_interests(meta):
    """从 onboarding 问卷 interests / twinTags 和 distilled interests 汇总兴趣标签集合。"""
    meta = meta or {}
    ob = meta.get("onboarding") or {}
    q = ob.get("questionnaire") or {}
    tags = set()
    tags |= _tokenize(q.get("interests"))
    tags |= _tokenize(ob.get("twinTags"))
    distilled = meta.get("distilled_traits") or {}
    tags |= _tokenize(distilled.get("interests"))
    return tags


def _jaccard(a, b):
    """两个标签集合的 Jaccard 相似度；任一为空则返回 None（信号退出）。"""
    if not a or not b:
        return None
    return len(a & b) / len(a | b)


def _get_intent(meta):
    """取归一化 intent：优先 plaza_listing.category，回退 onboarding.intent。"""
    meta = meta or {}
    listing = meta.get("plaza_listing") or {}
    cat = listing.get("category")
    if cat:
        return _normalize_intent(cat)
    ob = meta.get("onboarding") or {}
    return _normalize_intent(ob.get("intent"))


def _dim_score(a, b, mode):
    """逐维比较两个 0-1 维度字典，返回平均分；无公共维度返回 None。

    similar:      奖励一致  -> 1 - |a - b|
    complementary: 奖励平衡 -> 1 - |a + b - 1|（一个高一个低得分高）
    """
    a = a or {}
    b = b or {}
    keys = set(a) & set(b)
    if not keys:
        return None
    total = 0.0
    for k in keys:
        try:
            av = float(a.get(k, 0.5))
            bv = float(b.get(k, 0.5))
        except (TypeError, ValueError):
            av, bv = 0.5, 0.5
        if mode == "complementary":
            total += 1.0 - abs(av + bv - 1.0)
        else:
            total += 1.0 - abs(av - bv)
    return total / len(keys)


def _trait_score(ta, tb, mode):
    """蒸馏性格维度综合得分；任一方无 traits 返回 None。"""
    if not ta or not tb:
        return None
    parts = []
    for group in _MODE_DIMS:
        s = _dim_score(ta.get(group), tb.get(group), mode)
        if s is not None:
            parts.append(s)
    for group in _VALUE_DIMS:  # 价值观始终按"一致"计分
        s = _dim_score(ta.get(group), tb.get(group), "similar")
        if s is not None:
            parts.append(s)
    if not parts:
        return None
    return sum(parts) / len(parts)


def score_pair(me, cand, mode="similar", weights=None):
    """给 (me, cand) 一对数字人打分。

    返回 (score_0_100, reasons)：score 为 0–100 分，reasons 为匹配理由标签列表。
    缺失的信号会被丢弃并对剩余权重重归一化。
    """
    weights = weights or DEFAULT_WEIGHTS
    me_meta = (me or {}).get("meta") or {}
    cand_meta = (cand or {}).get("meta") or {}
    raw = {}
    reasons = []

    # 1. 语义 embedding 余弦
    mv = (me or {}).get("vector")
    cv = (cand or {}).get("vector")
    if mv and cv:
        raw["emb"] = max(0.0, cosine_sim(mv, cv))

    # 2. 兴趣标签 Jaccard
    shared = _collect_interests(me_meta) & _collect_interests(cand_meta)
    j = _jaccard(_collect_interests(me_meta), _collect_interests(cand_meta))
    if j is not None:
        raw["interest"] = j
        if shared:
            reasons.append("shared_interests")

    # 3. 同意图软信号
    mi = _get_intent(me_meta)
    ci = _get_intent(cand_meta)
    if mi and ci:
        same = mi == ci
        raw["intent"] = 1.0 if same else 0.0
        if same:
            reasons.append(f"same_intent:{mi}")

    # 4. 蒸馏性格维度（相似 / 互补）
    t = _trait_score(
        me_meta.get("distilled_traits"),
        cand_meta.get("distilled_traits"),
        mode,
    )
    if t is not None:
        raw["trait"] = t
        reasons.append("personality_" + mode)

    if not raw:  # 没有任何可比信号
        return 0.0, reasons

    wsum = sum(weights[k] for k in raw)  # 对存在的信号重归一化
    score = sum(weights[k] * v for k, v in raw.items()) / wsum
    return round(score * 100, 1), reasons
