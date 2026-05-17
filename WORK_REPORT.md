# Darlink 后端工作汇报

> 更新日期：2026-05-16
> 负责模块：后端API、模型服务、AI人物系统、用户蒸馏管道

---

## 一、我做了什么

### 1. 后端 API 服务（端口 8000）

基于 FastAPI 搭建，提供以下接口供前端调用：

| 接口 | 方法 | 功能 | 请求体 |
|------|------|------|--------|
| `/verify_email/send` | POST | 发送邮箱验证 | `{"email": "xxx@edu.cn"}` |
| `/verify_email/confirm` | POST | 确认验证码，返回 user_token | `{"token": "xxx"}` |
| `/personas` | GET | 获取 13 个 AI 人物列表 | — |
| `/chat/start` | POST | 开始和某个 AI 人物对话 | `{"user_token": "xxx", "persona_id": 2}` |
| `/chat/self/start` | POST | 开始和自己的数字分身对话 | `{"user_token": "xxx"}` |
| `/chat/message` | POST | 发送消息，获取 AI 回复 | `{"session_id": "xxx", "text": "你好"}` |
| `/chat/history/{session_id}` | GET | 获取聊天记录 | — |
| `/user/profile` | POST | 上传个人资料 | `{"user_token": "xxx", "profile_text": "..."}` |
| `/distill/run` | POST | 手动触发用户画像蒸馏 | `{"user_token": "xxx"}` |
| `/distill/result/{user_token}` | GET | 查看蒸馏出的用户画像 | — |

### 2. 模型服务（端口 8001）

独立进程，负责调用 DeepSeek API 生成 AI 回复。

- 启动时从 `.claude/skills/` 目录加载 13 个人物的 SKILL.md（每个约 6000-12000 字的人物深度资料）
- 收到请求后，根据 `persona_id` 选择对应人物的 system prompt，调用 DeepSeek 生成回复
- API 不可用时自动降级到预置回复（不会崩溃）

### 3. 13 个 AI 人物

每个人物都有完整的 SKILL.md 文件 + 6 份调研文档（共 78 个调研文件）：

| ID | 人物 | 核心标签 |
|----|------|---------|
| 1 | 芒格 | 多元思维模型、逆向思考 |
| 2 | 马斯克 | 第一性原理、工程思维 |
| 3 | 费曼 | 好奇心、简化复杂问题 |
| 4 | 乔布斯 | 产品感、极简主义 |
| 5 | 巴菲特 | 长期主义、价值投资 |
| 6 | Naval | 杠杆、个人自由 |
| 7 | Paul Graham | 创始人思维、写作即思考 |
| 8 | 贝索斯 | 客户至上、Day 1 心态 |
| 9 | 达利欧 | 原则系统、极度透明 |
| 10 | 黄仁勋 | 执行密度、加速计算 |
| 11 | 德鲁克 | 管理有效性、知识工作者 |
| 12 | 比尔盖茨 | 系统思考、规模化 |
| 13 | 安德森 | 软件吞噬世界、技术乐观 |

SKILL.md 内容结构：角色扮演规则 → 5 个心智模型 → 8 条决策启发式 → 表达 DNA（语言习惯、类比风格）。

### 4. 用户蒸馏管道

**目的**：从聊天记录中自动提取用户画像，为后续匹配和数字分身服务。

**工作流程**：
```
用户发消息 → 累计到10条 → 后台自动触发蒸馏（不阻塞聊天）
                ↓
    取最近20条对话 → 发给 DeepSeek 分析 → 返回 JSON 画像 → 存入数据库
                ↓
    每新增10条消息（20、30、40...）自动重新蒸馏，覆盖旧画像
```

**蒸馏输出的 5 个维度**：
- **思维方式**：逻辑性、直觉性、系统性、创造性（0-1 分值）
- **价值取向**：长期主义、冒险倾向、独立性、利他倾向（0-1 分值）
- **兴趣领域**：3-5 个标签（如 technology, philosophy）
- **沟通风格**：简洁度、幽默感、主动性、情感表达（0-1 分值）
- **关注议题**：2-3 个当前关心的话题

### 5. 数字分身对话

用户聊够 10 条消息被蒸馏后，可以和自己的"数字分身"对话。

**原理**：把蒸馏出的 JSON 画像转换成自然语言 system prompt，让 DeepSeek 模拟用户本人的说话风格和思维方式。

**调用方式**：
```
POST /chat/self/start  →  {"user_token": "xxx"}
                       ←  {"ok": true, "session_id": "xxx"}

POST /chat/message     →  {"session_id": "xxx", "text": "你觉得人生最重要的是什么"}
                       ←  {"ok": true, "reply": "...（模拟用户风格的回复）"}
```

如果用户还没有蒸馏画像，`/chat/self/start` 会返回提示信息。

---

## 二、技术架构

```
┌─────────────┐     HTTP      ┌──────────────┐     HTTP      ┌───────────────┐
│   前端 UI    │ ──────────→  │  后端 API     │ ──────────→  │  模型服务      │
│  (静态HTML)  │  端口 8000   │  (FastAPI)    │  端口 8001   │  (FastAPI)     │
└─────────────┘              │              │              │               │
                              │  ┌─────────┐ │              │  ┌──────────┐ │
                              │  │ SQLite  │ │              │  │ SKILL.md │ │
                              │  │ 数据库   │ │              │  │ ×13人物  │ │
                              │  └─────────┘ │              │  └──────────┘ │
                              └──────────────┘              └───────┬───────┘
                                     │                              │
                                     │  蒸馏/数字分身                │  人物对话
                                     ▼                              ▼
                              ┌──────────────────────────────────────┐
                              │         DeepSeek API                 │
                              │   (兼容 OpenAI 接口, deepseek-chat)  │
                              └──────────────────────────────────────┘
```

**关键设计决策**：
- 蒸馏和数字分身**直接调 DeepSeek API**，不经过模型服务（避免人物 prompt 污染分析结果）
- 普通人物聊天走模型服务（利用 SKILL.md 缓存和对话层指令）
- 自动蒸馏用 FastAPI BackgroundTasks，不阻塞用户聊天

---

## 三、数据库表结构

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户账号 | user_token, email, verified |
| `email_verifications` | 邮箱验证码 | token, email |
| `personas` | 13 个 AI 人物 | id, name, desc |
| `sessions` | 聊天会话 | user_id, persona_id, skill_name |
| `messages` | 聊天消息 | session_id, role(user/bot), text |
| `user_profiles` | 用户资料+蒸馏画像 | profile_text, vector, meta(JSON) |

---

## 四、前端同学需要对接的接口

### 核心对话流程

```
1. 邮箱验证 → 拿到 user_token（已有）
2. GET /personas → 展示人物列表（已有）
3. POST /chat/start → 选人物，拿 session_id（已有）
4. POST /chat/message → 发消息收回复（已有）
```

### 数字分身（新增）

```
1. GET /distill/result/{user_token} → 检查是否已有画像
   - 有画像：显示"和我的数字分身聊天"入口
   - 无画像：提示"多聊聊天解锁数字分身"

2. POST /chat/self/start → {"user_token": "xxx"}
   - 成功：返回 session_id
   - 失败：reason = "not_distilled_yet"

3. POST /chat/message → 和普通聊天接口一样，用返回的 session_id 发消息
```

---

## 五、如何启动

```bash
# 终端 1：后端 API
cd Darlink/backend
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000

# 终端 2：模型服务
cd Darlink/model_service
pip install -r requirements.txt
python -m uvicorn service:app --reload --port 8001

# 浏览器访问
http://localhost:8000
```

---

## 六、当前状态与待办

| 状态 | 内容 |
|------|------|
| ✅ 已完成 | 后端 API 全部接口、模型服务、13 人物 SKILL.md、蒸馏管道、自动触发、数字分身对话 |
| 🔄 待对接 | 前端 UI（聊天界面、人物选择、数字分身入口） |
| 🔄 待对接 | 场景化设计 |
| 📋 后续 | 用户匹配算法（基于蒸馏画像） |
