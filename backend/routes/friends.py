from typing import Optional

import crud
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/friends")


class FriendRequestBody(BaseModel):
    user_token: str
    target_profile_id: str
    message: str = ""


class FriendRespondBody(BaseModel):
    user_token: str


def _require_user(user_token: str):
    if not user_token:
        return None, {"ok": False, "reason": "auth_required"}
    user = crud.get_user_by_token(user_token)
    if not user:
        return None, {"ok": False, "reason": "auth_required"}
    return user, None


def _parse_target(target_profile_id: str):
    to_user_id = crud.parse_user_profile_id(target_profile_id)
    if to_user_id is None:
        return None, {"ok": False, "reason": "not_user_twin"}
    return to_user_id, None


@router.post("/request")
async def send_friend_request(req: FriendRequestBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    to_user_id, err = _parse_target(req.target_profile_id)
    if err:
        return err
    if user.id == to_user_id:
        return {"ok": False, "reason": "self_request"}
    card = crud.get_plaza_card_by_profile_id(req.target_profile_id)
    if not card:
        return {"ok": False, "reason": "not_found"}
    fr, reason = crud.create_friend_request(
        user.id,
        to_user_id,
        req.target_profile_id,
        req.message or "",
    )
    if reason == "already_friends":
        return {"ok": False, "reason": "already_friends"}
    if reason == "already_pending":
        return {"ok": False, "reason": "already_pending"}
    if not fr:
        return {"ok": False, "reason": "request_failed"}
    return {
        "ok": True,
        "request": {
            "id": fr.id,
            "status": fr.status,
            "source_profile_id": fr.source_profile_id,
        },
    }


@router.get("/status")
async def friend_status(
    user_token: str = Query(...),
    target_profile_id: str = Query(...),
):
    user, err = _require_user(user_token)
    if err:
        return err
    to_user_id, err = _parse_target(target_profile_id)
    if err:
        return err
    if user.id == to_user_id:
        return {"ok": True, "status": "self"}
    status = crud.get_friend_request_status(user.id, to_user_id)
    return {"ok": True, "status": status}


@router.get("/requests/incoming")
async def incoming_requests(user_token: str = Query(...)):
    user, err = _require_user(user_token)
    if err:
        return err
    return {"ok": True, "requests": crud.list_incoming_requests(user.id)}


@router.get("/requests/outgoing")
async def outgoing_requests(user_token: str = Query(...)):
    user, err = _require_user(user_token)
    if err:
        return err
    return {"ok": True, "requests": crud.list_outgoing_requests(user.id)}


@router.post("/requests/{request_id}/accept")
async def accept_request(request_id: int, req: FriendRespondBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    fr, reason = crud.respond_friend_request(request_id, user.id, accept=True)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    if reason == "not_pending":
        return {"ok": False, "reason": "not_pending"}
    return {"ok": True, "request": crud._friend_request_row(fr)}


@router.post("/requests/{request_id}/reject")
async def reject_request(request_id: int, req: FriendRespondBody):
    user, err = _require_user(req.user_token)
    if err:
        return err
    fr, reason = crud.respond_friend_request(request_id, user.id, accept=False)
    if reason == "not_found":
        return {"ok": False, "reason": "not_found"}
    if reason == "not_pending":
        return {"ok": False, "reason": "not_pending"}
    return {"ok": True, "request": crud._friend_request_row(fr)}


@router.get("/list")
async def list_friends(user_token: str = Query(...)):
    user, err = _require_user(user_token)
    if err:
        return err
    return {"ok": True, "friends": crud.list_friends(user.id)}
