"""邮件服务：发送6位验证码。

支持两种发信方式（按优先级）：
1. SMTP（网易企业邮箱 / 163 / 126 / QQ 等，无需验证域名，推荐）
   - SMTP_HOST     例：smtp.163.com / smtphz.qiye.163.com / smtp.qq.com
   - SMTP_PORT     例：465（SSL，推荐）或 587（STARTTLS）
   - SMTP_USER     完整邮箱地址，例：darlink@163.com
   - SMTP_PASSWORD 邮箱的「授权码」(不是登录密码！在邮箱设置里开启SMTP后获取)
   - SMTP_FROM     可选，显示名，例：Darlink <darlink@163.com>；不填则用 SMTP_USER
2. Resend API（需验证域名）
   - RESEND_API_KEY / RESEND_FROM

两者都没配 → dev 模式（不真发，验证码由接口回显）。
"""

import os
import ssl
import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr, parseaddr

import httpx

log = logging.getLogger("darlink.email")

# ---- SMTP 配置 ----
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "465") or "465")
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "").strip()

# ---- Resend 配置（备选）----
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
RESEND_FROM = os.getenv("RESEND_FROM", "Darlink <onboarding@resend.dev>")


def _smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def is_configured() -> bool:
    """是否配置了任一真实发信方式。"""
    return _smtp_configured() or bool(RESEND_API_KEY)


def _subject_and_body(code: str, lang: str = None):
    if lang == "zhHant":
        subject = "Darlink 驗證碼"
        title, greet, intro = "歡迎使用 Darlink", "你好，", "感謝你註冊 Darlink —— 你的數字人社交夥伴。請使用以下驗證碼完成註冊："
        label, expire, ignore, footer = "驗證碼", "此驗證碼 10 分鐘內有效，請勿洩露給他人。", "如果這不是你本人的操作，請忽略此郵件。", "此郵件由 Darlink 自動發送，請勿直接回覆。"
    elif lang == "en":
        subject = "Your Darlink verification code"
        title, greet, intro = "Welcome to Darlink", "Hi,", "Thank you for signing up for Darlink — your digital human companion. Use the verification code below to complete your registration:"
        label, expire, ignore, footer = "Verification Code", "This code expires in 10 minutes. Do not share it with anyone.", "If you didn't request this, please ignore this email.", "This email was sent automatically by Darlink. Please do not reply."
    else:
        subject = "Darlink 验证码"
        title, greet, intro = "欢迎使用 Darlink", "你好，", "感谢你注册 Darlink —— 你的数字人社交伙伴。请使用以下验证码完成注册："
        label, expire, ignore, footer = "验证码", "此验证码 10 分钟内有效，请勿泄露给他人。", "如果这不是你本人的操作，请忽略此邮件。", "此邮件由 Darlink 自动发送，请勿直接回复。"

    html = (
        f"<div style='font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>"
        f"<h1 style='color:#1a1a1a;font-size:24px;margin-bottom:20px;'>{title}</h1>"
        f"<p style='color:#4a4a4a;font-size:16px;line-height:1.6;'>{greet}</p>"
        f"<p style='color:#4a4a4a;font-size:16px;line-height:1.6;'>{intro}</p>"
        f"<div style='background:#f5f5f5;border-radius:8px;padding:24px;margin:24px 0;text-align:center;'>"
        f"<div style='color:#888;font-size:14px;margin-bottom:8px;'>{label}</div>"
        f"<div style='font-size:32px;font-weight:bold;letter-spacing:0.5em;font-family:monospace;color:#1a1a1a;'>{code}</div>"
        f"</div>"
        f"<p style='color:#888;font-size:14px;line-height:1.6;'>{expire}</p>"
        f"<p style='color:#888;font-size:14px;line-height:1.6;'>{ignore}</p>"
        f"<hr style='border:none;border-top:1px solid #eee;margin:32px 0;'>"
        f"<p style='color:#aaa;font-size:12px;'>{footer}</p>"
        f"</div>"
    )
    return subject, html


def _smtp_send_sync(to_email: str, subject: str, html: str):
    """阻塞式 SMTP 发信（在线程里调用）。发件地址用 SMTP_USER（多数邮箱要求 From 与登录账号一致）。"""
    name, addr = parseaddr(SMTP_FROM) if SMTP_FROM else ("", "")
    if not addr:
        addr = SMTP_USER
    display_name = name or "Darlink"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((display_name, SMTP_USER))  # From 用登录账号，防被拒
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as s:
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_USER, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
            s.ehlo()
            s.starttls(context=context)
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_USER, [to_email], msg.as_string())


async def send_verification_code(email: str, code: str, lang: str = None) -> bool:
    """发送验证码。返回 True 表示已发送，False 表示未发送（未配置或失败）。"""
    subject, html = _subject_and_body(code, lang)

    # 1) 优先 SMTP
    if _smtp_configured():
        try:
            await asyncio.to_thread(_smtp_send_sync, email, subject, html)
            log.info("SMTP verification code sent to %s", email)
            return True
        except Exception as e:
            log.exception("SMTP send failed: %s", e)
            return False

    # 2) 备选 Resend
    if RESEND_API_KEY:
        payload = {"from": RESEND_FROM, "to": [email], "subject": subject, "html": html}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                    json=payload,
                )
                if r.status_code >= 300:
                    log.error("Resend send failed: %s %s", r.status_code, r.text[:300])
                    return False
                return True
        except Exception as e:
            log.exception("Resend send exception: %s", e)
            return False

    # 3) 都没配 → dev 模式
    log.warning("No email backend configured, dev mode. email=%s code=%s", email, code)
    return False
