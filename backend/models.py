from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    user_token = Column(String(64), unique=True, index=True)
    email = Column(String(256), unique=True, index=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailVerification(Base):
    __tablename__ = 'email_verifications'
    id = Column(Integer, primary_key=True)
    token = Column(String(128), unique=True, index=True)
    email = Column(String(256), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Persona(Base):
    __tablename__ = 'personas'
    id = Column(Integer, primary_key=True)
    name = Column(String(128))
    desc = Column(Text)


class SessionDB(Base):
    __tablename__ = 'sessions'
    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    persona_id = Column(Integer, ForeignKey('personas.id'))
    skill_name = Column(String(128), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    last_at = Column(DateTime, default=datetime.utcnow)
    user = relationship('User')
    persona = relationship('Persona')


class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True)
    session_id = Column(String(64), ForeignKey('sessions.id'), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    role = Column(String(16))
    text = Column(Text)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserProfile(Base):
    __tablename__ = 'user_profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, index=True)
    profile_text = Column(Text)
    vector = Column(JSON)
    meta = Column(JSON, nullable=True)
