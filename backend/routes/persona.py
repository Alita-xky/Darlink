from fastapi import APIRouter
from db import SessionLocal
from models import Persona as PersonaModel
from persona_registry import PERSONAS
import crud

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


@router.get('/personas/{persona_id}')
async def get_persona(persona_id: int):
    sync_personas()
    ps = crud.get_personas()
    p = next((x for x in ps if x.id == persona_id), None)
    if not p:
        return {'ok': False, 'reason': 'not_found'}
    return {'ok': True, 'persona': {'id': p.id, 'name': p.name, 'desc': p.desc}}
