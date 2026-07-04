from datetime import datetime
from typing import Any, Dict, List, Optional

import crud
import embeddings
from fastapi import APIRouter, Query
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
    profile_id = f"user-{user.id}"
    category = _intent_category(req.intent)
    public_card = build_public_card(req.twinName, req.cards, req.twinTags, user.id)
    plaza_listing = {
        "published": True,
        "profile_id": profile_id,
        "category": category,
        "public_card": public_card,
        "published_at": datetime.utcnow().isoformat(),
    }

    crud.upsert_onboarding_profile(
        user.id,
        onboarding,
        skill_md,
        plaza_listing,
        profile_text,
        vector,
    )
    invalidate_user_twin_cache(user.id)

    return {
        "ok": True,
        "plaza_profile_id": profile_id,
        "twinName": req.twinName,
        "category": category,
    }


@router.get("/onboarding-profile")
async def get_onboarding_profile(user_token: str = Query(...)):
    user = crud.get_user_by_token(user_token)
    if not user:
        return {"ok": False, "reason": "auth_required"}
    data = crud.get_onboarding_profile_by_user_id(user.id)
    if not data or not data.get("onboarding"):
        return {"ok": False, "reason": "not_found"}
    onboarding = data["onboarding"]
    return {
        "ok": True,
        "onboarding": onboarding,
        "plaza_profile_id": (data.get("plaza_listing") or {}).get("profile_id"),
        "provider": onboarding.get("provider"),
        "cards": onboarding.get("cards") or [],
        "twinName": onboarding.get("twinName"),
        "twinTags": onboarding.get("twinTags") or [],
        "createdAt": onboarding.get("createdAt"),
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
    if not patch:
        return {"ok": False, "reason": "empty_patch"}
    ok = crud.patch_user_questionnaire(user.id, patch)
    if not ok:
        return {"ok": False, "reason": "not_found"}
    invalidate_user_twin_cache(user.id)
    return {"ok": True, "questionnaire": patch}

