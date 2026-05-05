# Darlink 整站 Docker 部署

> ⚠️ **跨职责声明**：这部分越过了数据工程师本职，会打包后端 + 模型服务 + 前端。
> 上线前**务必和后端工程师协调**：
> 1. 后端 `requirements.txt` 是否最新（特别是 sentence-transformers/torch 版本）
> 2. `model_service/` 的 OpenAI key 注入路径是否变化
> 3. 是否有未合并的 schema 改动

把整套服务打成一个 `docker compose up -d` 就能起的方案，目标是 1 台 2C4G Linux 即可跑。

---

## 组成

| 容器 | 作用 | 镜像 | 暴露端口 |
|---|---|---|---|
| `api` | FastAPI 后端 + 前端静态 + model_service | `darlink/api:latest`（自建） | 8000（仅内部） |
| `dashboard` | Streamlit 数据看板 | `darlink/dashboard:latest`（自建） | 8501（仅内部） |
| `nginx` | 反向代理 | `nginx:1.27-alpine` | **80**（对外） |

数据通过命名卷 `darlink-data` 共享：FastAPI 写入、Streamlit 只读。

---

## 部署步骤（5 步）

```bash
# 1. SSH 到服务器，拉代码
git clone https://github.com/<your-fork>/Darlink.git /opt/darlink
cd /opt/darlink

# 2. 准备环境变量
cp deploy/full-stack/.env.production.example deploy/full-stack/.env.production
vim deploy/full-stack/.env.production    # 填 OPENAI_API_KEY

# 3. 构建 + 起服务
cd deploy/full-stack
docker compose build
docker compose up -d

# 4. 看下健康状况
docker compose ps
docker compose logs -f api          # 应看到 uvicorn started
docker compose logs -f dashboard    # 应看到 You can now view your Streamlit app

# 5. 验证
curl -s -o /dev/null -w "FastAPI %{http_code}\n" http://localhost/health
curl -s -o /dev/null -w "Frontend %{http_code}\n" http://localhost/
curl -s -o /dev/null -w "Dashboard %{http_code}\n" http://localhost/dashboard/
# 期望：全部 200
```

浏览器：
- 主站（注册/聊天）：`http://<server-ip>/`
- 数据看板：`http://<server-ip>/dashboard/`

---

## 数据初始化

如果是空数据库，进 api 容器跑一次 seed：
```bash
docker compose exec api python /app/scripts/seed_demo_data.py --users 10 --sessions 30
```

或者把生产 SQLite 拷进卷：
```bash
docker run --rm -v darlink-data:/data -v "$(pwd)":/host alpine \
    sh -c "cp /host/darlink.sqlite /data/darlink.sqlite"
```

---

## 升级

```bash
cd /opt/darlink
git pull
cd deploy/full-stack
docker compose build
docker compose up -d
```

数据卷不会被重建，对话数据安全。

---

## 备份

容器化后，建议在宿主机跑 cron（不再用 P3 的 systemd），周期性 `docker run` 一次备份脚本：

```cron
0 3 * * *  docker run --rm \
  -v darlink-data:/app/data:ro \
  -v /opt/darlink/backups:/app/backups \
  darlink/dashboard:latest \
  python /app/scripts/backup_db.py --keep 14
```

---

## 故障排查

| 现象 | 排查 |
|---|---|
| `docker compose up` 失败 | 看具体哪个 build 失败；通常是 `sentence-transformers` 拉 torch 慢，加 `--build-arg PIP_INDEX_URL` 用国内源 |
| api 健康 fail | `docker compose logs api`；多半是缺 OPENAI_API_KEY 或 sqlite 权限 |
| dashboard 502 | 看是否依赖了 api 启动；compose 已有 depends_on healthcheck |
| 看板 websocket 断 | nginx 必须有 `Upgrade/Connection` 头，已在 nginx.conf 配好 |

---

## 安全

- 默认对外只开 80。HTTPS 在外层用 caddy/Cloudflare/nginx 加证书。
- 看板没有鉴权，**生产环境务必加 basic auth 或放在 VPN 后**。
- `.env.production` 只放在服务器、不提交 git；本仓库已忽略 `.env*`。
