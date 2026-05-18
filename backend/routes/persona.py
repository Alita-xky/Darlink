from fastapi import APIRouter
from db import SessionLocal
from models import Persona as PersonaModel
from persona_registry import PERSONAS
import crud
import distillation
from pydantic import BaseModel
from fastapi import Query

router = APIRouter()


def sync_personas():
    db = SessionLocal()
    try:
        existing = {p.id: p for p in db.query(PersonaModel).all()}
        for persona in PERSONAS:
            record = existing.get(persona["id"])
            if record:
                record.name = persona["name"]
                record.desc = persona["desc"]
            else:
                db.add(PersonaModel(id=persona["id"], name=persona["name"], desc=persona["desc"]))
        db.commit()
    finally:
        db.close()


@router.get('/personas')
async def list_personas():
    sync_personas()
    ps = crud.get_personas()
    return {'ok': True, 'personas': [{'id': p.id, 'name': p.name, 'desc': p.desc} for p in sorted(ps, key=lambda item: item.id)]}


@router.get('/personas/distilled')
async def get_distilled_persona(user_token: str = Query(None)):
    """返回当前用户的蒸馏画像与一个 persona 风格的描述（需要 user_token）"""
    if not user_token:
        return {'ok': False, 'reason': 'auth_required'}
    user = crud.get_user_by_token(user_token)
    if not user:
        return {'ok': False, 'reason': 'user_not_found'}

    traits = distillation.get_user_distillation(user.id)
    if not traits:
        return {'ok': False, 'reason': 'not_distilled_yet'}

    name = f"{user.email.split('@')[0]} 的数字人"
    desc = traits.get('summary', '') if isinstance(traits, dict) else ''
    return {'ok': True, 'persona': {'id': 0, 'name': name, 'desc': desc}, 'traits': traits}


class DistilledSessionReq(BaseModel):
    user_token: str


@router.post('/personas/distilled/session')
async def create_distilled_session(req: DistilledSessionReq):
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {'ok': False, 'reason': 'auth_required'}
    sid = crud.create_session_with_skill(req.user_token, 0, 'distilled')
    if not sid:
        return {'ok': False, 'reason': 'failed'}
    return {'ok': True, 'session_id': sid}


@router.get('/personas/{persona_id}')
async def get_persona(persona_id: int):
    sync_personas()
    ps = crud.get_personas()
    p = next((x for x in ps if x.id == persona_id), None)
    if not p:
        return {'ok': False, 'reason': 'not_found'}
    return {'ok': True, 'persona': {'id': p.id, 'name': p.name, 'desc': p.desc}}



@router.get('/personas/distilled')
async def get_distilled_persona(user_token: str = Query(None)):
    """返回当前用户的蒸馏画像与一个 persona 风格的描述（需要 user_token）"""
    if not user_token:
        return {'ok': False, 'reason': 'auth_required'}
    user = crud.get_user_by_token(user_token)
    if not user:
        return {'ok': False, 'reason': 'user_not_found'}

    traits = distillation.get_user_distillation(user.id)
    if not traits:
        return {'ok': False, 'reason': 'not_distilled_yet'}

    name = f"{user.email.split('@')[0]} 的数字人"
    desc = traits.get('summary', '') if isinstance(traits, dict) else ''
    return {'ok': True, 'persona': {'id': 0, 'name': name, 'desc': desc}, 'traits': traits}


class DistilledSessionReq(BaseModel):
    user_token: str


@router.post('/personas/distilled/session')
async def create_distilled_session(req: DistilledSessionReq):
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {'ok': False, 'reason': 'auth_required'}
    sid = crud.create_session_with_skill(req.user_token, 0, 'distilled')
    if not sid:
        return {'ok': False, 'reason': 'failed'}
    return {'ok': True, 'session_id': sid}
