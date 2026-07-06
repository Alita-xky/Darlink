from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    user_token = Column(String(64), unique=True, index=True)
    email = Column(String(256), unique=True, index=True)
    password_hash = Column(String(256), nullable=True)  # 新增：密码哈希（nullable 兼容旧数据）
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailVerification(Base):
    __tablename__ = 'email_verifications'
    id = Column(Integer, primary_key=True)
    token = Column(String(128), unique=True, index=True, nullable=True)  # 旧字段，保留兼容
    code = Column(String(6), index=True, nullable=True)                  # 新增：6位验证码
    email = Column(String(256), index=True)
    expires_at = Column(DateTime, nullable=True)                         # 新增：过期时间
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


class FriendRequest(Base):
    __tablename__ = 'friend_requests'
    id = Column(Integer, primary_key=True)
    from_user_id = Column(Integer, ForeignKey('users.id'), index=True)
    to_user_id = Column(Integer, ForeignKey('users.id'), index=True)
    source_profile_id = Column(String(64), index=True)
    status = Column(String(16), default='pending', index=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CommunityPost(Base):
    __tablename__ = 'community_posts'
    id = Column(Integer, primary_key=True)
    source = Column(String(16), default='user', index=True)
    preset_key = Column(String(64), unique=True, nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    author_name = Column(String(128))
    author_title = Column(String(256), nullable=True)
    author_avatar = Column(String(16), nullable=True)
    badge = Column(String(64), nullable=True)
    body = Column(Text)
    tags = Column(JSON, nullable=True)
    image_url = Column(Text, nullable=True)
    image_alt = Column(Text, nullable=True)
    sort_rank = Column(Integer, default=0, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship('User')


class CommunityLike(Base):
    __tablename__ = 'community_likes'
    __table_args__ = (UniqueConstraint('post_id', 'user_id', name='uq_community_like_post_user'),)
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('community_posts.id'), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommunityComment(Base):
    __tablename__ = 'community_comments'
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('community_posts.id'), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    author_type = Column(String(16), default='user', index=True)
    author_name = Column(String(128), nullable=True)
    author_title = Column(String(256), nullable=True)
    author_avatar = Column(Text, nullable=True)
    badge = Column(String(64), nullable=True)
    meta = Column(JSON, nullable=True)
    body = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class PlazaClickStat(Base):
    __tablename__ = 'plaza_click_stats'
    __table_args__ = (UniqueConstraint('item_type', 'item_id', name='uq_plaza_click_item'),)
    id = Column(Integer, primary_key=True)
    item_type = Column(String(32), nullable=False, index=True)
    item_id = Column(String(128), nullable=False, index=True)
    name = Column(String(256), default='')
    meta = Column(String(512), default='')
    count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DmConversation(Base):
    __tablename__ = 'dm_conversations'
    __table_args__ = (UniqueConstraint('user_low_id', 'user_high_id', name='uq_dm_conversation_pair'),)
    id = Column(Integer, primary_key=True)
    user_low_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    user_high_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DmMessage(Base):
    __tablename__ = 'dm_messages'
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('dm_conversations.id'), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
