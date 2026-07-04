from fastapi import APIRouter

import crud

router = APIRouter(prefix="/api/plaza")


def _real_card(item: dict) -> dict:
    listing = item["listing"]
    public = listing.get("public_card") or {}
    return {
        "id": listing.get("profile_id") or f"user-{item['user_id']}",
        "type": "user_twin",
        "category": listing.get("category") or "social",
        "name": public.get("name") or "Campus Twin",
        "title": public.get("title") or "",
        "body": public.get("body") or "",
        "tags": public.get("tags") or [],
        "initials": public.get("initials") or "DT",
        "colors": public.get("colors") or ["#6f5092", "#fcaad6"],
    }


@router.get("/feed")
async def plaza_feed():
    real_rows = crud.list_published_plaza_users()
    real_users = [_real_card(item) for item in real_rows]
    return {"ok": True, "real_users": real_users, "demo_users": []}


@router.get("/card/{profile_id}")
async def plaza_card(profile_id: str):
    card = crud.get_plaza_card_by_profile_id(profile_id)
    if not card:
        return {"ok": False, "reason": "not_found"}
    public = card.get("public_card") or {}
    user_id = card.get("user_id")
    onboarding_bundle = crud.get_onboarding_profile_by_user_id(user_id) if user_id else None
    onboarding = (onboarding_bundle or {}).get("onboarding") or {}
    questionnaire = onboarding.get("questionnaire") or {}
    intent = card.get("intent") or onboarding.get("intent") or card.get("category") or "social"
    sync_key = {"study": "studySync", "social": "socialSync", "romance": "romanceSync"}.get(intent, "socialSync")
    step3_sync = onboarding.get("step3_sync") or questionnaire.get(sync_key) or {}
    return {
        "ok": True,
        "profile_id": card["profile_id"],
        "category": card.get("category") or intent,
        "name": public.get("name") or card.get("twinName"),
        "title": public.get("title") or "",
        "body": public.get("body") or "",
        "tags": public.get("tags") or [],
        "initials": public.get("initials") or "DT",
        "colors": public.get("colors") or ["#6f5092", "#fcaad6"],
        "cards": card.get("cards") or onboarding.get("cards") or [],
        "school": card.get("school"),
        "grade": card.get("grade"),
        "majorDirection": card.get("majorDirection"),
        "nickname": card.get("nickname"),
        "twinName": card.get("twinName"),
        "intent": intent,
        "step3_sync": step3_sync,
        "persona": onboarding.get("persona") or {},
    }
