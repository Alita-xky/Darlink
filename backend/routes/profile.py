from fastapi import APIRouter
from pydantic import BaseModel
import crud
import embeddings

router = APIRouter()


class ProfileIn(BaseModel):
    user_token: str
    profile_text: str


@router.post('/user/profile')
async def upsert_profile(req: ProfileIn):
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {'ok': False, 'reason': 'auth_required'}
    vec = embeddings.embed_text(req.profile_text)
    prof = crud.upsert_user_profile(user.id, req.profile_text, vec)
    return {'ok': True, 'profile_id': prof.id}
