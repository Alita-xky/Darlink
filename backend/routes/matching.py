"""用户↔用户匹配路由。

GET /api/matching/matches — 基于数字人画像返回当前用户的排序候选列表。
"""

import crud
import matching
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/matching")


def _require_user(user_token: str):
    if not user_token:
        return None, {"ok": False, "reason": "auth_required"}
    user = crud.get_user_by_token(user_token)
    if not user:
        return None, {"ok": False, "reason": "auth_required"}
    return user, None


@router.get("/matches")
async def get_matches(
    user_token: str = Query(...),
    mode: str = Query("similar"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    user, err = _require_user(user_token)
    if err:
        return err

    if mode not in {"similar", "complementary"}:
        mode = "similar"

    me = crud.get_user_profile(user.id)
    if not me or not (me.vector or me.meta):
        return {"ok": False, "reason": "profile_not_ready"}

    me_dict = {"vector": me.vector, "meta": me.meta or {}}
    rel = crud.get_relationship_map(user.id)

    scored = []
    for cand in crud.list_match_candidates(exclude_user_id=user.id):
        status = rel.get(cand["user_id"], "none")
        if status == "accepted":
            continue  # 已是好友，跳过

        score, reasons = matching.score_pair(
            me_dict,
            {"vector": cand["vector"], "meta": cand["meta"]},
            mode=mode,
        )
        card = cand["public_card"]
        ob = cand["onboarding"]
        q = ob.get("questionnaire") or {}
        scored.append(
            {
                "user_id": cand["user_id"],
                "profile_id": cand["listing"].get("profile_id") or f"user-{cand['user_id']}",
                "score": score,
                "reasons": reasons,
                "friend_status": status,
                "intent": ob.get("intent"),
                "school": q.get("school"),
                "card": {
                    "name": card.get("name") or "Campus Twin",
                    "title": card.get("title") or "",
                    "body": card.get("body") or "",
                    "tags": card.get("tags") or [],
                    "initials": card.get("initials") or "DT",
                    "colors": card.get("colors") or ["#6f5092", "#fcaad6"],
                    "avatar": card.get("avatar") or "",
                },
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    total = len(scored)
    page = scored[offset : offset + limit]
    return {
        "ok": True,
        "mode": mode,
        "total": total,
        "matches": page,
    }
