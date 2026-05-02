# 🚀 团队快速启动指南

欢迎加入 Darlink 项目！这里是各位组员的任务分配和快速启动指南。

---

## 📋 你是谁？选择你的路径

### 👤 我是**前端设计师**
👉 直接跳转到 → [FRONTEND_SPEC.md](FRONTEND_SPEC.md)

**你需要做的事**：
- [ ] 阅读前端设计规范
- [ ] 选择技术栈（Vue/React/纯HTML+CSS）
- [ ] 改进 13 个人物卡片的设计
- [ ] 优化聊天界面和用户流程
- [ ] 实现响应式布局

**预计工时**：1-2 周

---

### 🔧 我是**后端工程师**（AI人物系统）
👉 直接跳转到 → [PERSONA_SPEC.md](PERSONA_SPEC.md)

**你需要做的事**：
- [ ] 理解人物注册表的结构
- [ ] 扩展每个人物的档案数据
- [ ] 优化 OpenAI 系统提示词
- [ ] 建立数据蒸馏流程
- [ ] 配置定期蒸馏任务

**预计工时**：1.5-2 周

**关键文件**：
- `persona_registry.py` - 中央人物注册表
- `model_service/service.py` - 模型推理服务

---

### 📊 我是**数据工程师**
👉 直接跳转到 → [DATA_PARSING.md](DATA_PARSING.md)

**你需要做的事**：
- [ ] 学习数据库架构和SQL查询
- [ ] 实现数据导出脚本
- [ ] 建立对话统计报告工具
- [ ] 创建质量分析工具
- [ ] 配置自动备份

**预计工时**：1-1.5 周

**关键文件**：
- `data/darlink.sqlite` - SQLite 数据库
- `backend/models.py` - ORM 模型定义

---

## ⚡ 所有人都要知道

### 1️⃣ 设置开发环境（所有人）

```powershell
# 使用 Python 3.11（不要用 3.13）
conda create -n darlink python=3.11 -y
conda activate darlink

# 进入项目根目录
cd Darlink

# 一键启动所有服务
.\start-dev.ps1
```

等待看到：
```
✓ Backend running at http://127.0.0.1:8000
✓ Model service running at http://127.0.0.1:8001
```

然后打开浏览器访问：**http://127.0.0.1:8000**

### 2️⃣ 项目结构速览

```
Darlink/
├── README.md                  ← 项目总览
├── FRONTEND_SPEC.md           ← 前端设计规范
├── PERSONA_SPEC.md            ← AI人物系统规范
├── DATA_PARSING.md            ← 数据解析指南
│
├── backend/                   ← FastAPI 后端
│   ├── app.py                 # 主应用
│   ├── models.py              # 数据库模型
│   ├── crud.py                # 数据库操作
│   ├── routes/
│   │   ├── auth.py            # 邮箱验证
│   │   ├── persona.py         # 人物接口
│   │   ├── chat.py            # 聊天接口
│   │   └── profile.py         # 资料上传
│   └── requirements.txt
│
├── model_service/             ← 模型推理服务
│   ├── service.py             # OpenAI 集成
│   └── requirements.txt
│
├── frontend/                  ← 前端页面
│   └── index.html             # 单页应用
│
├── persona_registry.py        ← 13个人物的中央注册表
├── .env.example               ← 环境变量模板
├── data/
│   └── darlink.sqlite         ← SQLite 数据库
│
└── scripts/                   ← 实用工具脚本（待创建）
    ├── export_session.py
    ├── export_all_conversations.py
    └── generate_stats_report.py
```

### 3️⃣ 核心 API 端点（给大家参考）

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 前端首页 |
| `/personas` | GET | 获取 13 个人物列表 |
| `/personas/{id}` | GET | 获取指定人物详情 |
| `/verify_email/send` | POST | 发送验证码 |
| `/verify_email/confirm` | POST | 验证邮箱 |
| `/chat/start` | POST | 创建聊天会话 |
| `/chat/message` | POST | 发送消息并获得回复 |
| `/chat/history/{session_id}` | GET | 查看对话历史 |
| `/profile/upload` | POST | 上传用户资料 |

### 4️⃣ 数据流向

```
用户界面（前端）
       ↓
后端 API（FastAPI）
       ↓
模型服务（Model Service）
       ↓
OpenAI API
       ↓
AI 回复
       ↓
数据库存储（SQLite）
       ↓
数据导出和分析
```

---

## ✅ 验收检查单

### 前端完成
- [ ] 13 个人物卡片清晰可辨
- [ ] 聊天界面显示用户/AI身份
- [ ] 邮箱验证流程清楚
- [ ] 响应式设计（手机/平板/桌面）

### 后端完成
- [ ] 每个人物都有丰富的档案数据
- [ ] OpenAI 生成的回复符合人物特征
- [ ] 数据蒸馏流程已实现
- [ ] 定期蒸馏任务正常运行

### 数据完成
- [ ] 能导出任意时间段的对话
- [ ] 能生成统计报告
- [ ] 能分析对话质量
- [ ] 数据备份机制已建立

---

## 🆘 遇到问题？

### 问题 1：服务无法启动

```powershell
# 检查端口是否被占用
netstat -ano | findstr :8000
netstat -ano | findstr :8001

# 如果被占用，杀死进程
taskkill /PID <PID> /F
```

### 问题 2：Python 依赖安装失败

```powershell
# 确保使用 Python 3.11
python --version

# 升级 pip
python -m pip install --upgrade pip setuptools wheel

# 重新安装依赖
pip install -r requirements.txt
```

### 问题 3：数据库错误

```powershell
# 删除旧的数据库（会丢失数据！）
Remove-Item -Path data/darlink.sqlite

# 重启服务，会自动创建新数据库
.\start-dev.ps1
```

### 问题 4：OpenAI API 报错

检查 `.env` 文件：
```bash
# 应该包含
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-3.5-turbo
```

如果没有 API 密钥，系统会自动降级到预定义回复模式（可正常测试）。

---

## 📞 沟通和反馈

- 前端问题？→ 查看 [FRONTEND_SPEC.md](FRONTEND_SPEC.md) 或 `frontend/index.html`
- 后端问题？→ 查看 [PERSONA_SPEC.md](PERSONA_SPEC.md) 或 `persona_registry.py`
- 数据问题？→ 查看 [DATA_PARSING.md](DATA_PARSING.md) 或 `backend/models.py`

---

## 🎯 项目里程碑

| 阶段 | 预计时间 | 里程碑 |
|------|---------|------|
| **MVP** | 2-2.5 周 | 三个团队完成各自任务 |
| **集成** | 1 周 | 联合测试、bug 修复 |
| **优化** | 1 周 | 性能优化、用户体验打磨 |
| **部署** | 待定 | 服务器部署、上线 |

---

## 🎉 祝你们工作顺利！

有问题？查阅对应的规范文档，或者在团队内沟通。加油！🚀

