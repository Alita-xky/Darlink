# Darlink — 本地运行指南（可直接看效果）

同时开四个终端

## 终端A：model_service（AI 模型服务，8001）
```powershell
cd model_service

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn service:app --reload --host 127.0.0.1 --port 8001
```

## 终端B：backend（后端 API，8000）
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 注意：后端要在 backend 目录下用 app:app 启动
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## 终端C：frontend（Expo）
```powershell
cd frontend
npm install
npm run dev
```

## 终端D：Convex（前端数据存储与函数，云端）
```powershell
cd frontend
npx convex dev
```
