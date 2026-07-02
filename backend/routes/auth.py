import os
import time
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from schemas import SendEmailReq, ConfirmEmailReq
import crud

router = APIRouter()

TEST_AUTH_CODE = os.getenv("DARLINK_TEST_AUTH_CODE", "000000")


class RequestCodeReq(BaseModel):
    email: EmailStr
    lang: Optional[str] = None


class VerifyCodeReq(BaseModel):
    email: EmailStr
    code: str
    password: str = ""
    remember: bool = False
    lang: Optional[str] = None


def _copy(lang: Optional[str], en: str, zh_hans: str, zh_hant: str) -> str:
    if lang == "zhHant":
        return zh_hant
    if lang == "zhHans":
        return zh_hans
    return en


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


@router.post('/api/auth/request-code')
async def request_code(req: RequestCodeReq):
    return {
        'ok': True,
        'sent': True,
        'mode': 'test',
        'dev_code': TEST_AUTH_CODE,
        'message': _copy(
            req.lang,
            f'Temporary test code generated: {TEST_AUTH_CODE}',
            f'临时测试验证码已生成：{TEST_AUTH_CODE}',
            f'臨時測試驗證碼已生成：{TEST_AUTH_CODE}',
        ),
    }


@router.post('/api/auth/verify')
async def verify_code(req: VerifyCodeReq):
    code = ''.join(ch for ch in str(req.code or '') if ch.isdigit())
    if code != TEST_AUTH_CODE:
        return {
            'ok': False,
            'reason': 'invalid_code',
            'error': _copy(
                req.lang,
                f'Verification failed. Use the temporary test code {TEST_AUTH_CODE}.',
                f'验证失败。请使用临时测试验证码 {TEST_AUTH_CODE}。',
                f'驗證失敗。請使用臨時測試驗證碼 {TEST_AUTH_CODE}。',
            ),
        }
    if len(req.password or '') < 6:
        return {
            'ok': False,
            'reason': 'weak_password',
            'error': _copy(req.lang, 'Password must be at least 6 characters.', '密码至少需要 6 位。', '密碼至少需要 6 位。'),
        }

    user_token = crud.get_or_create_user_token(str(req.email))
    if not user_token:
        return {
            'ok': False,
            'reason': 'user_create_failed',
            'error': _copy(req.lang, 'Verification failed. Please try again.', '验证失败，请重新尝试。', '驗證失敗，請重新嘗試。'),
        }

    return {
        'ok': True,
        'session': {
            'email': str(req.email),
            'token': user_token,
            'issued_at': int(time.time()),
            'mode': 'test',
        },
    }
