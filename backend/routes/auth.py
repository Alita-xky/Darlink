from fastapi import APIRouter
from schemas import SendEmailReq, ConfirmEmailReq
import crud

router = APIRouter()


@router.post('/verify_email/send')
async def send_verify_email(req: SendEmailReq):
    token = crud.create_email_verification(str(req.email))
    # in prod send email; in dev return debug token
    return {'ok': True, 'sent': True, 'debug_token': token}


@router.post('/verify_email/confirm')
async def confirm_email(req: ConfirmEmailReq):
    user_token = crud.confirm_token_create_user(req.token)
    if not user_token:
        return {'ok': False, 'reason': 'invalid_token'}
    return {'ok': True, 'user_token': user_token}
