from datetime import datetime
from typing import Any, Dict, List, Optional

import crud
import embeddings
from db import SessionLocal
from fastapi import APIRouter, Query
from models import UserProfile
from pydantic import BaseModel, Field

import user_skill_builder
from text_normalize import normalize_questionnaire
from skill_loader import invalidate_user_twin_cache

router = APIRouter(prefix="/api/user")


class OnboardingCompleteReq(BaseModel):
    user_token: str
    lang: str = "zhHans"
    intent: str = ""
    questionnaire: Dict[str, Any] = Field(default_factory=dict)
    persona: Dict[str, Any] = Field(default_factory=dict)
    cards: List[Dict[str, Any]] = Field(default_factory=list)
    twinName: str = ""
    twinTags: List[str] = Field(default_factory=list)
    step3_sync: Dict[str, Any] = Field(default_factory=dict)
    all_path_profiles: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class AvatarUpdateReq(BaseModel):
    user_token: str
    avatar: str = ""


def _clean_avatar_src(src: str) -> str:
    value = (src or "").strip()
    if not value:
        return ""
    allowed = (
        value.startswith("data:image/")
        or value.startswith("/files/")
        or value.startswith("/static/")
        or value.startswith("https://")
        or value.startswith("http://")
    )
    if not allowed:
        return ""
    if len(value) > 400000:
        return ""
    return value


def _intent_category(intent: str) -> str:
    value = (intent or "").strip().lower()
    if value in {"study", "social", "romance"}:
        return value
    if "study" in value or "学习" in value or "學習" in value:
        return "study"
    if "romance" in value or "恋" in value or "戀" in value:
        return "romance"
    return "social"


def _initials_from_name(name: str) -> str:
    parts = [p for p in (name or "").replace("·", " ").split() if p.strip()]
    if not parts:
        return "DT"
    if len(parts) == 1:
        token = parts[0]
        return (token[:2] if len(token) >= 2 else token[:1] + "T").upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _colors_for_user(user_id: int) -> List[str]:
    palette = [
        ["#6f5092", "#fcaad6"],
        ["#006686", "#7ed4fd"],
        ["#8a486f", "#d8b4fe"],
        ["#111c2d", "#7ed4fd"],
        ["#2f855a", "#d8b4fe"],
        ["#d97706", "#fcaad6"],
    ]
    return palette[user_id % len(palette)]


def build_public_card(
    twin_name: str,
    cards: list,
    twin_tags: list,
    user_id: int,
) -> dict:
    first = (cards or [{}])[0]
    title = (first.get("title") or "Campus Twin").strip()
    body = (first.get("body") or "").strip()
    tags = list(twin_tags or [])
    for card in (cards or [])[:3]:
        for tag in card.get("tags") or []:
            if tag and tag not in tags:
                tags.append(tag)
    return {
        "name": twin_name or "Campus Twin",
        "title": title,
        "body": body,
        "tags": tags[:3],
        "initials": _initials_from_name(twin_name),
        "colors": _colors_for_user(user_id),
    }


def _merge_existing_avatar(public_card: dict, user_id: int) -> dict:
    existing = crud.get_onboarding_profile_by_user_id(user_id) or {}
    existing_public = ((existing.get("plaza_listing") or {}).get("public_card") or {})
    if not existing_public.get("avatar"):
        prof = crud.get_user_profile(user_id)
        if prof and prof.meta:
            for listing in crud.resolve_plaza_listings(prof.meta).values():
                avatar = ((listing.get("public_card") or {}).get("avatar") or "")
                if avatar:
                    existing_public["avatar"] = avatar
                    break
    avatar = existing_public.get("avatar") or existing_public.get("avatar_url")
    if avatar and "avatar" not in public_card:
        public_card["avatar"] = avatar
    return public_card


def _update_public_avatar(user_id: int, avatar: str) -> bool:
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(user_id=user_id).first()
        if not prof or not prof.meta:
            return False
        meta = dict(prof.meta or {})
        listings = crud.resolve_plaza_listings(meta)
        if listings:
            for category, listing in listings.items():
                public = dict((listing or {}).get("public_card") or {})
                public["avatar"] = avatar
                listing["public_card"] = public
                listings[category] = listing
            meta["plaza_listings"] = listings
        listing = dict(meta.get("plaza_listing") or {})
        public = dict(listing.get("public_card") or {})
        public["avatar"] = avatar
        listing["public_card"] = public
        meta["plaza_listing"] = listing
        onboarding = dict(meta.get("onboarding") or {})
        onboarding["avatar"] = avatar
        meta["onboarding"] = onboarding
        prof.meta = meta
        db.commit()
        return True
    finally:
        db.close()


def _normalize_persona(persona: dict) -> dict:
    if not persona:
        return {}
    if isinstance(persona, dict) and "answers" in persona:
        return persona.get("answers") or {}
    return persona


def build_onboarding_payload(req: OnboardingCompleteReq) -> dict:
    req.questionnaire = normalize_questionnaire(req.questionnaire or {})
    nickname = (req.questionnaire or {}).get("nickname") or ""
    return {
        "intent": req.intent,
        "questionnaire": req.questionnaire,
        "persona": _normalize_persona(req.persona),
        "cards": req.cards,
        "nickname": nickname,
        "twinName": req.twinName,
        "twinTags": req.twinTags,
        "step3_sync": req.step3_sync or {},
        "createdAt": datetime.utcnow().isoformat(),
    }


def _path_publish_snapshot(path_key: str, data: dict) -> Optional[dict]:
    cards = data.get("cards") or []
    if not cards:
        return None
    return {
        "cards": cards,
        "twinName": data.get("twinName") or "",
        "twinTags": data.get("twinTags") or [],
        "step3_sync": data.get("step3_sync") or {},
        "intent": path_key,
    }


def _collect_paths_to_publish(req: OnboardingCompleteReq) -> dict:
    paths: Dict[str, dict] = {}
    current = _intent_category(req.intent)
    current_snapshot = _path_publish_snapshot(req.intent, {
        "cards": req.cards,
        "twinName": req.twinName,
        "twinTags": req.twinTags,
        "step3_sync": req.step3_sync,
    })
    if current and current_snapshot:
        paths[current] = current_snapshot
    for path_key, pdata in (req.all_path_profiles or {}).items():
        category = _intent_category(path_key)
        snapshot = _path_publish_snapshot(path_key, pdata or {})
        if category and snapshot:
            paths[category] = snapshot
    return paths


@router.post("/onboarding-complete")
async def onboarding_complete(req: OnboardingCompleteReq):
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {"ok": False, "reason": "auth_required"}

    onboarding = build_onboarding_payload(req)
    skill_md = await user_skill_builder.build_onboarding_skill(
        intent=req.intent,
        questionnaire=req.questionnaire,
        persona=_normalize_persona(req.persona),
        cards=req.cards,
        twin_name=req.twinName,
        twin_tags=req.twinTags,
        lang=req.lang,
    )
    profile_text = user_skill_builder.build_profile_text(
        req.intent,
        req.questionnaire,
        req.persona,
        req.cards,
        req.twinName,
        req.twinTags,
    )
    vector = embeddings.embed_text(profile_text)
    category = _intent_category(req.intent)
    paths_to_publish = _collect_paths_to_publish(req)
    if not paths_to_publish and req.cards:
        paths_to_publish[category] = _path_publish_snapshot(req.intent, {
            "cards": req.cards,
            "twinName": req.twinName,
            "twinTags": req.twinTags,
            "step3_sync": req.step3_sync,
        })

    plaza_listings: Dict[str, dict] = {}
    path_onboarding: Dict[str, dict] = {}
    published_at = datetime.utcnow().isoformat()
    for path_category, snapshot in paths_to_publish.items():
        if not snapshot:
            continue
        path_onboarding[path_category] = snapshot
        public_card = _merge_existing_avatar(
            build_public_card(
                snapshot.get("twinName") or req.twinName,
                snapshot.get("cards") or [],
                snapshot.get("twinTags") or [],
                user.id,
            ),
            user.id,
        )
        plaza_listings[path_category] = {
            "published": True,
            "profile_id": f"user-{user.id}-{path_category}",
            "category": path_category,
            "public_card": public_card,
            "published_at": published_at,
        }

    plaza_listing = plaza_listings.get(category) or next(iter(plaza_listings.values()), {
        "published": True,
        "profile_id": f"user-{user.id}-{category}" if category else f"user-{user.id}",
        "category": category or "social",
        "public_card": _merge_existing_avatar(build_public_card(req.twinName, req.cards, req.twinTags, user.id), user.id),
        "published_at": published_at,
    })
    profile_id = plaza_listing.get("profile_id") or f"user-{user.id}"

    crud.upsert_onboarding_profile(
        user.id,
        onboarding,
        skill_md,
        plaza_listing,
        profile_text,
        vector,
        plaza_listings=plaza_listings or None,
        path_onboarding=path_onboarding or None,
    )
    invalidate_user_twin_cache(user.id)

    return {
        "ok": True,
        "plaza_profile_id": profile_id,
        "twinName": req.twinName,
        "category": category,
        "published_paths": sorted(plaza_listings.keys()),
    }


@router.post("/avatar")
async def update_avatar(req: AvatarUpdateReq):
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {"ok": False, "reason": "auth_required"}
    avatar = _clean_avatar_src(req.avatar)
    if not avatar:
        return {"ok": False, "reason": "bad_avatar"}
    ok = _update_public_avatar(user.id, avatar)
    if not ok:
        return {"ok": False, "reason": "profile_not_ready"}
    invalidate_user_twin_cache(user.id)
    return {"ok": True, "avatar": avatar, "user_id": user.id}


@router.get("/onboarding-profile")
async def get_onboarding_profile(user_token: str = Query(...)):
    user = crud.get_user_by_token(user_token)
    if not user:
        return {"ok": False, "reason": "auth_required"}
    data = crud.get_onboarding_profile_by_user_id(user.id)
    if not data or not data.get("onboarding"):
        return {"ok": False, "reason": "not_found"}
    onboarding = data["onboarding"]
    path_onboarding = data.get("path_onboarding") or {}
    published_paths = data.get("published_paths") or []
    return {
        "ok": True,
        "onboarding": onboarding,
        "plaza_profile_id": (data.get("plaza_listing") or {}).get("profile_id"),
        "published_paths": published_paths,
        "path_onboarding": path_onboarding,
        "provider": onboarding.get("provider"),
        "cards": onboarding.get("cards") or [],
        "twinName": onboarding.get("twinName"),
        "twinTags": onboarding.get("twinTags") or [],
        "createdAt": onboarding.get("createdAt"),
        "avatar": (((data.get("plaza_listing") or {}).get("public_card") or {}).get("avatar") or ""),
    }

class QuestionnaireUpdateReq(BaseModel):
    user_token: str
    questionnaire: Dict[str, Any] = Field(default_factory=dict)


@router.post("/questionnaire-update")
async def questionnaire_update(req: QuestionnaireUpdateReq):
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {"ok": False, "reason": "auth_required"}
    patch = normalize_questionnaire(req.questionnaire or {})
    patch.pop("email", None)
    if not patch:
        return {"ok": False, "reason": "empty_patch"}
    ok = crud.patch_user_questionnaire(user.id, patch)
    if not ok:
        return {"ok": False, "reason": "not_found"}
    invalidate_user_twin_cache(user.id)
    return {"ok": True, "questionnaire": patch}
