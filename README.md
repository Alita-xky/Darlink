# Darlink - 大学生智能社交平台
一个关注于大学生恋爱社交的项目（MVP 骨架）

本项目是一个多AI人格社交平台，用户可以选择与13个不同的AI人物（查理·芒格、埃隆·马斯克、理查德·费曼等）进行对话。每个AI人物具有独特的思维方式和回复风格。

## 核心特性
- ✅ **13个AI人物机器人**：每个人物有独特的思维风格和表达方式
- ✅ **邮箱验证**：仅限大学生邮箱（可配置白名单）
- ✅ **持久化存储**：SQLite 数据库存储用户、会话、聊天记录
- ✅ **OpenAI API 集成**：支持 GPT-3.5-turbo 和 GPT-4
- ✅ **Stub 模式降级**：API 不可用时自动降级到预定义回复
- ✅ **RAG 上下文检索**：使用用户上传的个人资料作为聊天上下文
- ✅ **消息向量化**：支持语义搜索和相似性匹配

## 项目结构

本仓库包含：
- **backend**：FastAPI 后端（邮箱验证、persona 列表、聊天等 REST 接口）
- **model_service**：模型服务（支持 OpenAI API 调用，支持 Stub 模式降级）
- **frontend**：静态前端页面（邮箱验证、人物选择、聊天、个人资料上传）
- **admin**：占位的管理页面
- **persona_registry.py**：13个AI人物的中央注册表

## 📚 团队文档

针对不同角色的详细指南：

- **👤 前端设计师** → [FRONTEND_SPEC.md](FRONTEND_SPEC.md)  
  改进UI/UX、人物卡片设计、聊天界面优化

- **🔧 后端工程师** → [PERSONA_SPEC.md](PERSONA_SPEC.md)  
  扩展AI人物档案、优化OpenAI集成、建立数据蒸馏流程

- **📊 数据工程师** → [DATA_PARSING.md](DATA_PARSING.md)  
  数据导出工具、SQL查询、统计分析、质量评估

- **🚀 所有人** → [TEAM_QUICK_START.md](TEAM_QUICK_START.md)  
  快速启动指南、项目结构、常见问题解答

## 环境配置

本项目在 Windows 上使用 Python 3.13 时，部分依赖（例如 pydantic-core）可能没有可用的预编译 wheel，pip 会尝试从源码编译并触发 Rust/MSVC 工具链编译，这通常会导致安装失败或需要复杂的本地工具链配置。

因此强烈推荐使用 Python 3.11（或 3.12）来运行本项目；这些版本通常有预编译 wheel，可以避免本地编译依赖问题。

使用 conda 创建推荐环境（示例）：

```powershell
conda create -n darlink python=3.11 -y
conda activate darlink
python -m pip install --upgrade pip setuptools wheel
```

配置大模型 API（可选但推荐）

### 什么是 model_service？

model_service 是与大模型通信的中间层。当用户发送消息时，后端会转发到 model_service，model_service 负责调用大模型 API 并返回 persona 风格的回复。

### 接入 OpenAI API

当前支持 **OpenAI API**（包括 GPT-3.5-turbo 和 GPT-4）。

**步骤 1：获取 API 密钥**

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建新的 API 密钥，复制它

**步骤 2：配置本地环境变量**

在项目根目录创建 `.env` 文件（基于 `.env.example` 模板）：

```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
# 可选：OPENAI_BASE_URL=https://api.openai.com/v1
```

**步骤 3：安装依赖**

```powershell
cd Darlink/model_service
pip install openai  # 需要 openai >= 1.0
```

**API 不可用时的降级**

如果：
- 没有配置 `OPENAI_API_KEY`，或
- OpenAI API 调用超时/失败

系统会自动降级到 **Stub 模式**，返回预定义的人物风格回复（仍可正常聊天）。

## 后端 API 概览

所有返回均为 JSON，除根路径返回前端 HTML。示例请求：

- POST /verify_email/send
	- 说明：提交邮箱以发送（或模拟发送）验证 token
	- 请求体 JSON: {"email": "you@school.edu"}
	- 返回示例: {"ok": true, "sent": true, "debug_token": "..."}

- POST /verify_email/confirm
	- 说明：使用 token 完成验证
	- 请求体 JSON: {"token": "..."}
	- 返回示例: {"ok": true, "user_token": "..."}

- GET /personas
	- 说明：获取 13 个初始 persona 模板

- GET /personas/{persona_id}
	- 说明：获取指定 persona 详情

- POST /chat/start
	- 说明：创建聊天会话
	- 请求体 JSON: {"user_token":"...", "persona_id": 1}
	- 返回示例: {"ok": true, "session_id":"..."}

- POST /chat/message
	- 说明：向会话发送用户消息，后端会转发到 model_service
	- 请求体 JSON: {"session_id":"...","text":"你好"}
	- 返回示例: {"ok": true, "reply": "..."}

- GET /chat/history/{session_id}
	- 说明：拉取会话消息历史（仅用于调试）

- GET /match/toplist
	- 说明：返回匹配 Toplist（当前为 mock）

- GET /health
	- 简单健康检查

- GET /（model_service）
	- 说明：检查 model_service 状态和 LLM API 是否已配置
	- 返回示例: {"ok": true, "status": "model service running", "llm_api": "configured"}

使用 curl 示例

```bash
# 发送验证邮件（开发会返回 debug token）
curl -X POST http://127.0.0.1:8000/verify_email/send -H "Content-Type: application/json" -d '{"email":"you@university.edu"}'

# 使用返回的 debug_token 完成验证
curl -X POST http://127.0.0.1:8000/verify_email/confirm -H "Content-Type: application/json" -d '{"token":"<debug_token>"}'

# 获取 persona 列表
curl http://127.0.0.1:8000/personas

# 启动会话（与 persona_id=1 Charlie Munger 进行对话）
curl -X POST http://127.0.0.1:8000/chat/start -H "Content-Type: application/json" -d '{"user_token":"<user_token>","persona_id":1}'

# 发送聊天消息（model_service 会调用 OpenAI API 返回 Munger 风格的回复）
curl -X POST http://127.0.0.1:8000/chat/message -H "Content-Type: application/json" -d '{"session_id":"<session_id>","text":"你如何看待指数基金的长期投资？"}'

# 直接测试 model_service（不经过后端）
curl -X POST http://127.0.0.1:8001/respond -H "Content-Type: application/json" -d '{
  "text": "你觉得比特币值得投资吗？",
  "persona_id": 2,
  "context": "用户是一个 25 岁的理工科在校生，对创新技术感兴趣"
}'
```

错误处理
- 后端用 Pydantic 校验请求体，validation_error 会返回 422 并包含错误细节。
- 未捕获异常会返回 500 并包含简短的错误字符串（仅用于开发，生产需更严格的日志与监控）。

故障排除

**Q1：为什么聊天还是返回 Stub 回复？**

检查 model_service 的状态：
```bash
curl http://127.0.0.1:8001/
```

如果返回 `"llm_api": "not_configured"`，说明 OpenAI API 未配置。请检查：
1. `.env` 文件是否在项目根目录
2. `OPENAI_API_KEY` 是否正确设置
3. model_service 是否重新启动以加载最新的 `.env`

**Q2：OpenAI API 报错怎么办？**

- 检查 API 密钥是否有效：https://platform.openai.com/api-keys
- 检查账户余额是否充足
- 检查网络连接
- model_service 的日志会打印 OpenAI 错误，检查终端输出

**Q3：能不能用其他大模型？**

当前代码仅支持 OpenAI API。如需接入 Claude、本地 Ollama 等，可修改 model_service/service.py 的 `/respond` 端点。

后续工作建议（实现路线）
1. 持久化：把 USERS/SESSIONS 替换成 Postgres + ORM；把对话写入专用表。
2. 邮箱验证：接入邮件服务并限制学校域名白名单。
3. ✅ **模型接入已完成**：已支持 OpenAI API（GPT-3.5-turbo / GPT-4），支持降级到 Stub 模式。可选：接入其他模型（Claude / 本地 Ollama 等）。
4. 匹配：用向量数据库（pgvector/Qdrant）做语义匹配，并设计综合匹配分数。
5. 隐私与合规：添加用户协议、最小化数据存储、删除与导出接口、未成年人风控。

如果你希望我继续，我可以：
- 为每个接口补充 OpenAPI 描述与示例数据；
- 将内存存储切换为 SQLite/Postgres 示例；
- 把 model_service 升级为可配置接入真实模型。

13 个 chatbot 是怎么来的

这部分说的是：第一个版本不是“一个 chatbot + skill 开关”，而是“13 位人物机器人”，每一位都代表一个固定的思维风格。

### 接入目标

- 第一个 chatbot 仍然是原来的入口，但它不是一个抽象的 skill 壳子。
- 13 个聊天机器人分别对应 13 位人物：芒格、马斯克、费曼、乔布斯……
- 用户选中谁，就和谁说话。

### 实际接入链路

1. **人物注册表**

   我把 13 位人物的名字、简介和说话风格统一放在 `persona_registry.py`。

2. **数据库同步**

   后端启动时，会把 `personas` 表同步成这 13 位人物，避免还显示成 `Persona_1` 这种占位符。

3. **前端展示**

   前端直接读取 `/personas`，把 13 个人物卡片列出来，不再展示 skill 选择。

4. **会话创建**

   你点某个人物以后，前端把 `persona_id` 传给 `/chat/start`。

5. **人物说话**

   `model_service` 根据 `persona_id` 选择对应的人物风格模板，返回该人物口吻的回复。

### 为什么这样做

- 用户心智更直接：不是“选一个模式”，而是“选一个人”。
- UI 更简单：只保留人物列表，不再出现 skill 这个中间层。
- 扩展更自然：以后要新增第 14 个人物，只要往注册表里加一条。

### 芒格是怎么生成出来的

芒格只是 13 位人物中的一位，他的生成流程是：

1. **收集素材**：收集芒格的著作、访谈、公开演讲、他人评价和决策案例。
2. **提炼风格**：提炼他的逆向思考、激励结构、多元思维模型等核心风格。
3. **写入注册表**：把芒格写进 `persona_registry.py`，包含名字、简介和 voice 提示。
4. **写入模型模板**：在 `model_service` 里把芒格式回答组织成固定风格。
5. **同步到前端**：前端拿到 `personas` 后，直接把芒格卡片展示给用户。

### 当前仓库里的示例

当前仓库里的 `.claude/skills/munger-perspective/` 仍然保留为内部生成样板，但它不再是用户侧功能入口。用户侧入口是 13 个人物机器人本身。

### 如果你要继续扩展第 14 个机器人

1. 在 `persona_registry.py` 里加一个新人物。
2. 给他补一段 `desc` 和 `voice`。
3. 确保前端 `/personas` 能读到。
4. 在 `model_service` 里补对应风格。

## 团队任务分配

项目分为三个独立的工作流，可以平行进行：

### 👤 任务 1：前端设计师
**任务**：完善用户界面和交互体验

详见：[FRONTEND_SPEC.md](FRONTEND_SPEC.md)

**核心工作**：
- 优化 13 个人物卡片的视觉设计
- 改进聊天界面（消息气泡、时间戳、加载状态）
- 完善邮箱验证和资料上传流程
- 实现响应式设计（手机/平板/桌面）

**预期时间**：1-2 周

---

### 🔧 任务 2：后端工程师 - AI 人物系统
**任务**：完成 13 个 AI 人物的配置和数据蒸馏流程

详见：[PERSONA_SPEC.md](PERSONA_SPEC.md)

**核心工作**：
- 扩展每个人物的档案（背景、理念、表达风格）
- 优化 OpenAI 系统提示词
- 建立数据蒸馏流程（从对话提取人物特征）
- 实现定期蒸馏任务（Cron Job）

**预期时间**：1.5-2 周

---

### 📊 任务 3：数据工程师
**任务**：构建数据导出和分析工具

详见：[DATA_PARSING.md](DATA_PARSING.md)

**核心工作**：
- 提供 SQL 查询示例和最佳实践
- 开发数据导出脚本（JSON/CSV 格式）
- 建立对话统计和质量分析工具
- 创建定期数据备份机制

**预期时间**：1-1.5 周

---

## 快速参考

| 组员 | 文档 | 主要文件 | 依赖关系 |
|------|------|---------|--------|
| 前端设计师 | [FRONTEND_SPEC.md](FRONTEND_SPEC.md) | `frontend/index.html` | 无（可独立开发） |
| 后端工程师 | [PERSONA_SPEC.md](PERSONA_SPEC.md) | `persona_registry.py`, `model_service/service.py` | 无（可独立开发） |
| 数据工程师 | [DATA_PARSING.md](DATA_PARSING.md) | `backend/models.py`, `data/darlink.sqlite` | 无（可独立开发） |

---

烟雾测试结果（本地，2026-05-02）

- **流程**: 邮箱验证 -> 获取 persona -> 创建会话 -> 上传 profile -> 发送聊天消息
- **debug_token**: 9419c901-79b2-4273-97a8-6045c4429f79
- **user_token**: 3a679a7d-1b2a-4fb3-8768-6ccb78233770
- **persona_id**: 1
- **session_id**: 8cbc3c90-3a7d-4c9c-a682-b1b4a6b563e2
- **profile_id**: 1
- **消息存储**: 聊天记录已写入数据库 `messages` 表，可通过 `GET /chat/history/{session_id}` 验证

---

## 📖 文档总结

本项目包含以下文档，请根据角色选择对应的文档阅读：

| 文档 | 适用于 | 内容 |
|------|--------|------|
| [TEAM_QUICK_START.md](TEAM_QUICK_START.md) | 所有人 | 快速启动、项目结构、FAQ、故障排除 |
| [FRONTEND_SPEC.md](FRONTEND_SPEC.md) | 前端设计师 | UI/UX规范、13个人物卡片设计、聊天界面、响应式设计 |
| [PERSONA_SPEC.md](PERSONA_SPEC.md) | 后端工程师 | AI人物档案扩展、OpenAI系统提示词、数据蒸馏流程 |
| [DATA_PARSING.md](DATA_PARSING.md) | 数据工程师 | 数据库查询、导出脚本、统计分析、质量评估 |

---

## 🎯 后续工作建议

1. **持久化数据库**：迁移到 PostgreSQL + pgvector（用于向量搜索）
2. **多模型支持**：支持 Claude、本地 Ollama 等大模型
3. **用户匹配**：基于对话向量进行智能匹配算法
4. **隐私合规**：GDPR/CCPA 数据保留策略
5. **生产部署**：Docker + Kubernetes + CI/CD 流程
6. **性能优化**：缓存、速率限制、异步任务队列

---

**最后更新**：2026-05-03  
**项目状态**：MVP 完成，团队任务分配中


