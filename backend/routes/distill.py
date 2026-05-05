from fastapi import APIRouter
from pydantic import BaseModel
import crud
import distillation

router = APIRouter()


class DistillRequest(BaseModel):
    user_token: str


@router.post('/distill/run')
async def run_distillation(req: DistillRequest):
    """对指定用户执行蒸馏，提取用户画像"""
    user = crud.get_user_by_token(req.user_token)
    if not user:
        return {'ok': False, 'reason': 'user_not_found'}

    result = await distillation.distill_user(user.id)

    if isinstance(result, dict) and 'error' in result:
        return {'ok': False, 'reason': result['error'], 'raw': result.get('raw')}

    return {'ok': True, 'traits': result}


@router.get('/distill/result/{user_token}')
async def get_distillation_result(user_token: str):
    """获取用户已有的蒸馏结果"""
    user = crud.get_user_by_token(user_token)
    if not user:
        return {'ok': False, 'reason': 'user_not_found'}

    traits = distillation.get_user_distillation(user.id)
    if not traits:
        return {'ok': False, 'reason': 'not_distilled_yet'}

    return {'ok': True, 'traits': traits}
