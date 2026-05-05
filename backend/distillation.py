"""
用户蒸馏模块：从聊天记录中提取用户画像

原理：
1. 从数据库取出用户最近的聊天消息
2. 拼成一段文本，发给 DeepSeek（LLM）
3. DeepSeek 按照提示词分析出用户的思维方式、价值观等
4. 返回结构化 JSON，存入数据库

触发条件：用户累计 >= 10 条消息时可触发
"""

import json
import httpx
from datetime import datetime
from db import SessionLocal
from models import Message, SessionDB, UserProfile, User


# 蒸馏提示词：告诉 LLM 该分析什么、输出什么格式
DISTILL_PROMPT = """你是一个用户画像分析师。请根据以下用户的聊天记录，分析这个人的特征。

## 分析维度

1. **思维方式** (thinking_style)
   - logical: 逻辑性强度 (0-1)
   - intuitive: 直觉性强度 (0-1)
   - systematic: 系统性强度 (0-1)
   - creative: 创造性强度 (0-1)

2. **价值取向** (values)
   - long_term: 长期主义倾向 (0-1)
   - risk_taking: 冒险倾向 (0-1)
   - independence: 独立性 (0-1)
   - altruism: 利他倾向 (0-1)

3. **兴趣领域** (interests)
   - 列出 3-5 个标签，从以下选择或自拟：
     technology, business, philosophy, arts, science, relationships,
     career, finance, psychology, education, health, social_issues

4. **沟通风格** (communication)
   - concise: 简洁程度 (0-1)
   - humorous: 幽默程度 (0-1)
   - proactive: 主动程度 (0-1)
   - emotional: 情感表达程度 (0-1)

5. **关注议题** (concerns)
   - 列出 2-3 个当前最关心的话题

## 输出格式

严格输出以下 JSON 格式，不要输出其他内容：

```json
{
  "thinking_style": {"logical": 0.0, "intuitive": 0.0, "systematic": 0.0, "creative": 0.0},
  "values": {"long_term": 0.0, "risk_taking": 0.0, "independence": 0.0, "altruism": 0.0},
  "interests": ["tag1", "tag2", "tag3"],
  "communication": {"concise": 0.0, "humorous": 0.0, "proactive": 0.0, "emotional": 0.0},
  "concerns": ["topic1", "topic2"],
  "summary": "一句话总结这个用户的特点"
}
```

## 注意事项
- 所有数值在 0-1 之间
- 如果聊天记录太少无法判断某个维度，给 0.5（中性）
- 只看用户发的消息（role=user），AI回复仅作为上下文参考
- 不要编造，信息不足就保守给分

## 用户聊天记录如下：

"""


def get_user_messages(user_id: int, limit: int = 20):
    """获取用户最近的聊天消息"""
    db = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(Message.user_id == user_id, Message.role == 'user')
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(messages))  # 按时间正序
    finally:
        db.close()


def get_user_message_count(user_id: int):
    """获取用户的消息总数"""
    db = SessionLocal()
    try:
        return db.query(Message).filter(
            Message.user_id == user_id,
            Message.role == 'user'
        ).count()
    finally:
        db.close()


def get_conversation_context(user_id: int, limit: int = 20):
    """获取用户最近的完整对话（含AI回复，作为上下文）"""
    db = SessionLocal()
    try:
        # 找到用户的所有session
        sessions = db.query(SessionDB).filter_by(user_id=user_id).all()
        session_ids = [s.id for s in sessions]

        if not session_ids:
            return []

        # 获取这些session中的最近消息
        messages = (
            db.query(Message)
            .filter(Message.session_id.in_(session_ids))
            .order_by(Message.created_at.desc())
            .limit(limit * 2)  # 取多一些，因为包含bot消息
            .all()
        )
        return list(reversed(messages))
    finally:
        db.close()


def format_messages_for_llm(messages):
    """把消息格式化成 LLM 可读的文本"""
    lines = []
    for msg in messages:
        role_label = "用户" if msg.role == 'user' else "AI"
        lines.append(f"[{role_label}]: {msg.text}")
    return "\n".join(lines)


async def call_llm_for_distillation(messages_text: str):
    """调用 DeepSeek API 进行蒸馏分析"""
    prompt = DISTILL_PROMPT + messages_text

    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(
                'http://127.0.0.1:8001/respond',
                json={
                    'text': prompt,
                    'persona_id': None,  # 不使用任何persona风格
                    'context': None,
                },
                timeout=30
            )
            resp = r.json()
            if resp.get('ok'):
                return resp.get('reply', '')
            return None
        except Exception as e:
            print(f"蒸馏调用LLM失败: {e}")
            return None


def parse_distillation_result(llm_response: str):
    """从 LLM 回复中提取 JSON"""
    if not llm_response:
        return None

    # 尝试直接解析
    try:
        return json.loads(llm_response)
    except json.JSONDecodeError:
        pass

    # 尝试从 ```json ... ``` 中提取
    import re
    json_match = re.search(r'```json\s*(.*?)\s*```', llm_response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # 尝试找到第一个 { 和最后一个 }
    start = llm_response.find('{')
    end = llm_response.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(llm_response[start:end + 1])
        except json.JSONDecodeError:
            pass

    return None


def save_distillation(user_id: int, traits: dict):
    """将蒸馏结果存入数据库"""
    db = SessionLocal()
    try:
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()

        # 添加元数据
        traits['confidence'] = min(1.0, get_user_message_count(user_id) / 50.0)
        traits['last_updated'] = datetime.utcnow().isoformat()
        traits['message_count_analyzed'] = get_user_message_count(user_id)

        if profile:
            # 更新现有 profile 的 meta 字段
            profile.meta = {'distilled_traits': traits}
        else:
            # 创建新 profile
            profile = UserProfile(
                user_id=user_id,
                profile_text='',
                vector=None,
                meta={'distilled_traits': traits}
            )
            db.add(profile)

        db.commit()
        return traits
    finally:
        db.close()


async def distill_user(user_id: int):
    """
    主函数：对一个用户执行蒸馏

    返回：
        - dict: 蒸馏结果（成功时）
        - None: 失败或消息不足
    """
    # 检查消息数量
    msg_count = get_user_message_count(user_id)
    if msg_count < 5:
        return {'error': f'消息数量不足（当前{msg_count}条，需要至少5条）'}

    # 获取对话上下文
    messages = get_conversation_context(user_id, limit=20)
    if not messages:
        return {'error': '没有找到聊天记录'}

    # 格式化
    messages_text = format_messages_for_llm(messages)

    # 调用 LLM
    llm_response = await call_llm_for_distillation(messages_text)
    if not llm_response:
        return {'error': 'LLM 调用失败'}

    # 解析结果
    traits = parse_distillation_result(llm_response)
    if not traits:
        return {'error': '无法解析LLM返回结果', 'raw': llm_response}

    # 存储
    saved = save_distillation(user_id, traits)
    return saved


def get_user_distillation(user_id: int):
    """获取用户的蒸馏结果"""
    db = SessionLocal()
    try:
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()
        if profile and profile.meta:
            return profile.meta.get('distilled_traits')
        return None
    finally:
        db.close()
