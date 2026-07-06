import os
import time
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from schemas import SendEmailReq, ConfirmEmailReq
import crud
import email_service

router = APIRouter()

# 测试模式：为 1 时接受固定测试码 TEST_AUTH_CODE（团队联调用）。生产务必设为 0。
TEST_AUTH_CODE = os.getenv("DARLINK_TEST_AUTH_CODE", "000000")
TEST_MODE = os.getenv("DARLINK_TEST_MODE", "0") == "1"

# 为 1 时即使配了邮件、发信失败也把验证码回显到接口（仅联调用）。生产设 0，避免验证码泄露。
EXPOSE_DEV_CODE = os.getenv("DARLINK_DEV", "0") == "1"


class RequestCodeReq(BaseModel):
    email: EmailStr
    lang: Optional[str] = None


class VerifyCodeReq(BaseModel):
    email: EmailStr
    code: str = ""
    password: str = ""
    remember: bool = False
    lang: Optional[str] = None


def _copy(lang: Optional[str], en: str, zh_hans: str, zh_hant: str) -> str:
    if lang == "zhHant":
        return zh_hant
    if lang == "zhHans":
        return zh_hans
    return en


def _norm_email(email: str) -> str:
    return str(email or "").strip().lower()


def _rate_limit_response(lang: Optional[str], remaining: int):
    return {
        'ok': False,
        'reason': 'rate_limited',
        'retry_after': remaining,
        'error': _copy(
            lang,
            f'Please wait {remaining}s before requesting another code.',
            f'请等待 {remaining} 秒后再发送验证码。',
            f'請等待 {remaining} 秒後再發送驗證碼。',
        ),
    }


def _send_code_response(email: str, code: str, lang: Optional[str], sent: bool):
    if sent:
        return {
            'ok': True, 'sent': True, 'mode': 'email',
            'message': _copy(
                lang,
                'Verification code sent to your email.',
                '验证码已发送到你的邮箱。',
                '驗證碼已發送到你的郵箱。',
            ),
        }
    if EXPOSE_DEV_CODE or not email_service.is_configured():
        return {
            'ok': True, 'sent': False, 'mode': 'dev', 'dev_code': code,
            'message': _copy(
                lang,
                f'Dev mode, code: {code}',
                f'开发模式，验证码：{code}',
                f'開發模式，驗證碼：{code}',
            ),
        }
    return {
        'ok': False, 'reason': 'email_send_failed',
        'error': _copy(
            lang,
            'Failed to send verification email. Please try again later.',
            '验证码邮件发送失败，请稍后重试。',
            '驗證碼郵件發送失敗，請稍後重試。',
        ),
    }


@router.post('/api/auth/request-code')
async def request_code(req: RequestCodeReq):
    """生成并发送6位验证码。未配置邮件服务时降级为 dev_code 直接返回验证码。"""
    email = _norm_email(req.email)
    remaining = crud.get_code_send_cooldown_remaining(email)
    if remaining > 0:
        return _rate_limit_response(req.lang, remaining)

    code = crud.create_verification_code(email)
    sent = await email_service.send_verification_code(email, code, req.lang)
    return _send_code_response(email, code, req.lang, sent)


@router.post('/api/auth/verify')
async def verify_code(req: VerifyCodeReq):
    """注册或登录。
    - 已注册且设了密码的邮箱：走登录（只校验密码，无需验证码）。
    - 新邮箱或老 magic-link 用户：走注册（需验证码 + 设置密码）。
    """
    email = _norm_email(req.email)
    code = ''.join(ch for ch in str(req.code or '') if ch.isdigit())
    password = req.password or ''

    if len(password) < 6:
        return {
            'ok': False, 'reason': 'weak_password',
            'error': _copy(req.lang, 'Password must be at least 6 characters.', '密码至少需要 6 位。', '密碼至少需要 6 位。'),
        }

    # ---- 登录路径：邮箱已注册且有密码 ----
    if crud.email_has_password(email):
        user_token = crud.authenticate_user(email, password)
        if not user_token:
            return {
                'ok': False, 'reason': 'invalid_credentials',
                'error': _copy(req.lang, 'Incorrect email or password.', '邮箱或密码错误。', '郵箱或密碼錯誤。'),
            }
        return _session_resp(email, user_token)

    # ---- 注册路径：新用户或无密码的老用户，需要验证码 ----
    code_ok = crud.verify_code(email, code)
    if not code_ok and TEST_MODE and code == TEST_AUTH_CODE:
        code_ok = True
    if not code_ok:
        return {
            'ok': False, 'reason': 'invalid_code',
            'error': _copy(req.lang, 'Invalid or expired verification code.', '验证码错误或已过期。', '驗證碼錯誤或已過期。'),
        }

    user_token = crud.register_user_with_password(email, password)
    if not user_token:
        return {
            'ok': False, 'reason': 'user_create_failed',
            'error': _copy(req.lang, 'Registration failed. Please try again.', '注册失败，请重新尝试。', '註冊失敗，請重新嘗試。'),
        }
    return _session_resp(email, user_token)




class ResetPasswordReq(BaseModel):
    email: EmailStr
    code: str = ""
    password: str = ""
    lang: Optional[str] = None


@router.post('/api/auth/forgot-password/request-code')
async def forgot_password_request_code(req: RequestCodeReq):
    """已注册账号申请重置密码验证码（60 秒冷却）。"""
    email = _norm_email(req.email)
    if not crud.email_has_password(email):
        return {
            'ok': False,
            'reason': 'no_account',
            'error': _copy(
                req.lang,
                'No account found for this email.',
                '该邮箱尚未注册，无法重置密码。',
                '該郵箱尚未註冊，無法重設密碼。',
            ),
        }
    remaining = crud.get_code_send_cooldown_remaining(email)
    if remaining > 0:
        return _rate_limit_response(req.lang, remaining)

    code = crud.create_verification_code(email)
    sent = await email_service.send_password_reset_code(email, code, req.lang)
    return _send_code_response(email, code, req.lang, sent)


@router.post('/api/auth/forgot-password/reset')
async def forgot_password_reset(req: ResetPasswordReq):
    """校验验证码并重置密码。"""
    email = _norm_email(req.email)
    code = ''.join(ch for ch in str(req.code or '') if ch.isdigit())
    password = req.password or ''

    if len(password) < 6:
        return {
            'ok': False,
            'reason': 'weak_password',
            'error': _copy(req.lang, 'Password must be at least 6 characters.', '密码至少需要 6 位。', '密碼至少需要 6 位。'),
        }
    if not crud.email_has_password(email):
        return {
            'ok': False,
            'reason': 'no_account',
            'error': _copy(req.lang, 'No account found for this email.', '该邮箱尚未注册。', '該郵箱尚未註冊。'),
        }

    code_ok = crud.verify_code(email, code)
    if not code_ok and TEST_MODE and code == TEST_AUTH_CODE:
        code_ok = True
    if not code_ok:
        return {
            'ok': False,
            'reason': 'invalid_code',
            'error': _copy(req.lang, 'Invalid or expired verification code.', '验证码错误或已过期。', '驗證碼錯誤或已過期。'),
        }
    if not crud.update_user_password(email, password):
        return {
            'ok': False,
            'reason': 'reset_failed',
            'error': _copy(req.lang, 'Password reset failed. Please try again.', '密码重置失败，请重试。', '密碼重設失敗，請重試。'),
        }
    return {
        'ok': True,
        'message': _copy(
            req.lang,
            'Password reset successful. You can now sign in with your new password.',
            '密码已重置，请使用新密码登录。',
            '密碼已重設，請使用新密碼登入。',
        ),
    }


def _session_resp(email: str, user_token: str):
    return {
        'ok': True,
        'session': {
            'email': email,
            'token': user_token,
            'issued_at': int(time.time()),
            'mode': 'email',
        },
    }


# ========== 旧版 Magic Link（保留兼容）==========

@router.post('/verify_email/send')
async def send_verify_email(req: SendEmailReq):
    token = crud.create_email_verification(str(req.email))
    return {'ok': True, 'sent': True, 'debug_token': token}


@router.post('/verify_email/confirm')
async def confirm_email(req: ConfirmEmailReq):
    user_token = crud.confirm_token_create_user(req.token)
    if not user_token:
        return {'ok': False, 'reason': 'invalid_token'}
    return {'ok': True, 'user_token': user_token}
