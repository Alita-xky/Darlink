# AI人物系统完善指南 - 给后端工程师的任务清单

## 📋 概述

您需要：
1. **扩展13个AI人物的配置**：添加更详细的人物背景、思维框架、说话风格示例
2. **优化OpenAI集成**：为每个人物创建专属的系统提示词
3. **建立数据蒸馏流程**：收集用户对话→提取人物特征→更新人物配置

**预期成果**：
- 13个人物都有丰富的"人物档案"（背景、理念、表达方式）
- 每个人物的OpenAI回复都风格一致、可识别
- 建立从用户对话到人物特征提取的数据管道

---

## 🤖 第一步：扩展 persona_registry.py

### 当前结构

```python
# persona_registry.py（当前）

PERSONAS = [
    {
        "id": 1,
        "name": "Charlie Munger",
        "desc": "逆向思考、激励结构、多元思维模型",
        "voice": "先看怎么失败..."
    },
    # ... 其他12个人物
]

PERSONA_BY_ID = {p['id']: p for p in PERSONAS}
```

### 改进方案：扩展人物档案

每个人物应该包含以下字段：

```python
PERSONAS = [
    {
        "id": 1,
        "name": "Charlie Munger",
        "name_en": "Charlie Munger",
        "desc": "逆向思考、激励结构、多元思维模型",
        
        # ===== 新增字段 =====
        
        # 人物简介（100-200字，用于前端展示）
        "bio": "查理·芒格是伯克希尔·哈撒韦公司的副董事长。以其独特的"逆向思考"闻名，强调了解人的行为动力、建立多元思维模型的重要性。",
        
        # 核心思想（3-5个核心理念，用于系统提示词）
        "principles": [
            "逆向思考：与其想怎样成功，不如先想怎样失败",
            "激励结构：任何系统中激励结构都会影响行为",
            "多元思维模型：整合来自多个领域的知识框架",
            "安全边际：做任何决定都要留有犯错的空间",
            "长期思维：短期波动是噪音，长期趋势是信号"
        ],
        
        # 代表作品（用于背景补充）
        "works": [
            "《查理·芒格的智慧》",
            "伯克希尔股东大会演讲",
            "《穷查理宝典》前言"
        ],
        
        # 表达风格示例（教导模型如何说话）
        "voice": "我经常从反面思考问题。与其问'这怎样才能成功'，我不如先问'这怎样才能失败'。",
        
        # 回答风格（告诉模型应该如何组织回答）
        "response_style": {
            "tone": "严谨、哲学性、带着幽默",
            "structure": "先提出反向观点 → 揭示潜在陷阱 → 给出建议",
            "length": "中等（150-300字）",
            "examples": "经常引用历史案例、引用经济学概念"
        },
        
        # 典型问题的回答示例（Few-shot learning）
        "examples": [
            {
                "question": "如何进行理财投资?",
                "answer": "首先，先想想什么时候会赔钱。大多数人赔钱是因为...（省略）"
            }
        ],
        
        # 禁忌话题（模型应该避免讨论的领域）
        "constraints": [
            "不讨论政治观点",
            "不提供医学或法律建议",
            "不鼓励赌博行为"
        ]
    },
    # ... 其他12个人物，每个都包含上述字段
]
```

### 13个人物的档案框架

使用以下模板为每个人物补充完整信息：

#### 1. Charlie Munger（查理·芒格）
- **Principles**: 逆向思考、激励结构、多元思维模型、安全边际、长期主义
- **Tone**: 理性、带讽刺、深思熟虑
- **Topics**: 投资、心理学、历史、商业

#### 2. Elon Musk（埃隆·马斯克）
- **Principles**: 第一性原理、快速迭代、技术乐观、大胆目标、工程思维
- **Tone**: 直接、充满热情、有时挑衅
- **Topics**: 科技、能源、太空、创新

#### 3. Richard Feynman（理查德·费曼）
- **Principles**: 深度理解、简化复杂、好奇心、质疑权威、玩乐精神
- **Tone**: 好奇、谦逊、充满热情、有时反讽
- **Topics**: 科学、物理、教育、思维方法

#### 4. Steve Jobs（史蒂夫·乔布斯）
- **Principles**: 简约主义、整合技术与人文、关注细节、用户体验至上、创新文化
- **Tone**: 富有激情、诗意、梦想家
- **Topics**: 产品设计、美学、创意、领导力

#### 5. Warren Buffett（沃伦·巴菲特）
- **Principles**: 价值投资、风险评估、长期持有、道德投资、知识圈
- **Tone**: 温和、智慧、务实、有时幽默
- **Topics**: 投资、商业、人生智慧

#### 6-13. 其他人物（参考主README中的列表补充）

---

## 🔌 第二步：优化 model_service 的系统提示词

### 当前实现（model_service/service.py）

```python
@app.post("/respond")
async def respond(request: RespondRequest):
    persona = PERSONA_BY_ID.get(request.persona_id)
    if not persona:
        return {"ok": False, "error": "Persona not found"}
    
    # 构建系统提示词
    system_message = f"你是{persona['name']}，{persona['desc']}"
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": request.text}
        ],
        temperature=0.7,
        max_tokens=500
    )
    
    return {"ok": True, "reply": response.choices[0].message.content}
```

### 改进版本：更强大的系统提示词

```python
def build_system_prompt(persona: dict) -> str:
    """为指定人物构建系统提示词"""
    
    prompt = f"""你是{persona['name']}（{persona['name_en']}），一位著名的思想家和行动者。

个人简介：
{persona['bio']}

你的核心理念：
"""
    
    for i, principle in enumerate(persona['principles'], 1):
        prompt += f"\n{i}. {principle}"
    
    prompt += f"\n\n你的表达风格：
- 语调：{persona['response_style']['tone']}
- 结构：{persona['response_style']['structure']}
- 长度：{persona['response_style']['length']}
- 特点：{persona['response_style']['examples']}

说话示例：
"{persona['voice']}"

回答要求：
1. 始终从你独特的视角出发
2. 引用相关的历史案例或概念
3. 保持一致的表达风格
4. 避免以下话题：{', '.join(persona['constraints'])}

现在，请你以{persona['name']}的身份回答用户的问题。"""
    
    return prompt


@app.post("/respond")
async def respond(request: RespondRequest):
    persona = PERSONA_BY_ID.get(request.persona_id)
    if not persona:
        return {"ok": False, "error": "Persona not found"}
    
    system_prompt = build_system_prompt(persona)
    
    # 如果有上下文（用户个人资料），添加到用户消息中
    user_message = request.text
    if request.context:
        user_message = f"[背景信息]：{request.context}\n\n[用户问题]：{user_message}"
    
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.8,  # 稍高以增加多样性
        max_tokens=500,
        top_p=0.9
    )
    
    return {"ok": True, "reply": response.choices[0].message.content}
```

---

## 📊 第三步：建立数据蒸馏流程

### 概念

"数据蒸馏"是指：
1. **收集**：用户与AI进行多个对话
2. **分析**：提取这些对话中AI人物的表现特征（常用词汇、论点风格、回答长度等）
3. **反馈**：根据分析结果更新人物配置（调整temperature、添加新的表达方式等）

### 架构

```
用户对话
  ↓
[ 后端存储到 messages 表 ]
  ↓
[ 数据蒸馏模块 ]
  - 提取常用词汇和表达方式
  - 分析回答风格
  - 提取论点框架
  ↓
[ 更新 persona_registry.py ]
  - 刷新 voice 字段
  - 更新 response_style
  - 补充新的 principles 或 examples
```

### 实现步骤

#### 步骤 1：在后端添加数据收集端点

```python
# backend/routes/data_collection.py（新建）

from fastapi import APIRouter, Depends
from sqlalchemy import and_
from db import SessionLocal
from models import Message, Session

router = APIRouter(prefix="/data", tags=["data"])


@router.post("/distill/{persona_id}")
async def distill_persona(persona_id: int):
    """
    从该人物的所有回复中提取特征，生成蒸馏报告
    """
    db = SessionLocal()
    
    # 查询该人物的所有回复
    messages = db.query(Message).join(
        Session, Message.session_id == Session.id
    ).filter(
        and_(
            Session.persona_id == persona_id,
            Message.role == "bot"
        )
    ).all()
    
    if not messages:
        return {"ok": False, "error": "No messages found for this persona"}
    
    # 分析消息
    analysis = analyze_persona_responses([msg.text for msg in messages])
    
    return {
        "ok": True,
        "persona_id": persona_id,
        "message_count": len(messages),
        "analysis": analysis  # 词汇频率、语长、常见论点等
    }


def analyze_persona_responses(texts: list[str]) -> dict:
    """
    分析一组回复文本，提取特征
    """
    import re
    from collections import Counter
    
    # 合并所有文本
    combined = " ".join(texts)
    
    # 提取常用词汇（过滤停用词）
    stopwords = {"的", "是", "在", "我", "你", "他", "and", "the", "is"}
    words = re.findall(r'\w+', combined.lower())
    common_words = Counter([w for w in words if w not in stopwords]).most_common(20)
    
    # 统计回复长度
    lengths = [len(text.split()) for text in texts]
    avg_length = sum(lengths) / len(lengths)
    
    # 统计句子数量
    sentences = [sent for text in texts for sent in re.split(r'[。！？]', text)]
    
    return {
        "common_words": common_words,
        "average_reply_length": avg_length,
        "sentence_count": len(sentences),
        "total_replies": len(texts),
        "vocabulary_diversity": len(set(words)) / len(words) if words else 0
    }
```

#### 步骤 2：在 model_service 中添加蒸馏反馈机制

```python
# model_service/distillation.py（新建）

import json
import os
from collections import defaultdict


def save_response_for_distillation(persona_id: int, user_input: str, ai_response: str):
    """
    保存回复用于后续蒸馏分析
    """
    distillation_dir = "distillation_data"
    os.makedirs(distillation_dir, exist_ok=True)
    
    persona_file = f"{distillation_dir}/persona_{persona_id}_responses.jsonl"
    
    with open(persona_file, "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "user_input": user_input,
            "ai_response": ai_response,
            "timestamp": str(datetime.now())
        }, ensure_ascii=False) + "\n")


def extract_persona_features(persona_id: int) -> dict:
    """
    从保存的回复中提取人物特征
    """
    persona_file = f"distillation_data/persona_{persona_id}_responses.jsonl"
    
    if not os.path.exists(persona_file):
        return {}
    
    responses = []
    with open(persona_file, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)
            responses.append(data["ai_response"])
    
    # 调用后端的 analyze_persona_responses 函数
    features = analyze_persona_responses(responses)
    
    return features
```

#### 步骤 3：定期蒸馏任务（Cron Job）

```python
# backend/tasks/distillation.py（新建）

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime


def schedule_distillation():
    """
    每天凌晨2点运行蒸馏任务
    """
    scheduler = BackgroundScheduler()
    
    def distill_all_personas():
        for persona_id in range(1, 14):
            try:
                analysis = distill_persona(persona_id)
                log_distillation_result(persona_id, analysis)
                print(f"✓ Distilled persona {persona_id}")
            except Exception as e:
                print(f"✗ Failed to distill persona {persona_id}: {e}")
    
    scheduler.add_job(distill_all_personas, 'cron', hour=2, minute=0)
    scheduler.start()
    
    return scheduler


def log_distillation_result(persona_id: int, analysis: dict):
    """
    记录蒸馏结果
    """
    log_file = f"distillation_logs/persona_{persona_id}.json"
    os.makedirs("distillation_logs", exist_ok=True)
    
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": str(datetime.now()),
            "persona_id": persona_id,
            "analysis": analysis
        }, f, ensure_ascii=False, indent=2)
```

---

## ✅ 验收标准

### 人物扩展
- [ ] 每个人物都有完整的档案（bio、principles、works、examples）
- [ ] 所有字段都有中英文翻译
- [ ] 至少有3个典型问答示例

### 系统提示词
- [ ] 系统提示词长度在200-500字范围
- [ ] 包含人物的核心理念和表达风格
- [ ] OpenAI 生成的回复能识别出是哪个人物在说话

### 数据蒸馏
- [ ] 建立了数据收集端点 `/data/distill/{persona_id}`
- [ ] 能够分析人物的常用词汇、表达方式
- [ ] 能够定期（每天）运行蒸馏任务
- [ ] 蒸馏日志有记录

---

## 🔗 关键代码位置

- **人物注册表**：`persona_registry.py`
- **模型服务**：`model_service/service.py`
- **数据库模型**：`backend/models.py`（Message、Session 表）
- **后端路由**：`backend/routes/` 目录

---

## 💡 补充建议

1. **A/B 测试**：比较不同系统提示词下的回复质量
2. **用户反馈**：添加"这个回复有用吗？"的投票机制，反馈给蒸馏模块
3. **人物演进**：每周更新一次人物档案，让AI人物逐渐"成熟"
4. **多语言支持**：考虑为每个人物添加不同语言的系统提示词

