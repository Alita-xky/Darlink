from typing import Optional
from pydantic import BaseModel, EmailStr


class SendEmailReq(BaseModel):
    email: EmailStr


class ConfirmEmailReq(BaseModel):
    token: str


class StartChatReq(BaseModel):
    user_token: str
    persona_id: int
    skill_name: Optional[str] = None


class ChatMessageReq(BaseModel):
    session_id: str
    text: str
    skill_name: Optional[str] = None


class PersonaOut(BaseModel):
    id: int
    name: str
    desc: str
