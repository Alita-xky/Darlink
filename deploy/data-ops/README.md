# Darlink 数据侧 24h 托管

把数据工程脚本部署到 Linux 服务器、长期托管。**只托管数据相关组件**，不涉及后端 / 前端 / 模型服务（那是后端工程师的事）。

托管内容：
- `darlink-backup.timer` — 每天 03:00 自动备份 SQLite + exports
- `darlink-stats.timer` — 每天 06:00 自动跑统计报告 + 质量分析
- `darlink-dashboard.service` — Streamlit 看板常驻 8501 端口

---

## 1. 服务器准备（一次性）

假设目标服务器：Ubuntu/Debian，sudo 权限。

```bash
# 1. 装系统依赖
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git logrotate

# 2. 建专用用户
sudo useradd -r -s /bin/bash -m -d /opt/darlink darlink

# 3. 拉代码到 /opt/darlink
sudo -u darlink git clone https://github.com/<your-fork>/Darlink.git /opt/darlink
cd /opt/darlink

# 4. 建 venv 并装依赖
sudo -u darlink python3 -m venv /opt/darlink/.venv
sudo -u darlink /opt/darlink/.venv/bin/pip install -r scripts/requirements.txt

# 5. 初始化 SQLite（如果不接后端，自己 seed 一份）
sudo -u darlink /opt/darlink/.venv/bin/python scripts/seed_demo_data.py
```

> 如果生产环境的 sqlite 已经在跑，把生产数据库放到 `/opt/darlink/data/darlink.sqlite`（或改 service 里的 ConditionPathExists/ExecStart 路径）。

---

## 2. 安装 systemd 单元（5 条命令完成）

```bash
sudo cp deploy/data-ops/*.service deploy/data-ops/*.timer /etc/systemd/system/
sudo cp deploy/data-ops/logrotate.conf /etc/logrotate.d/darlink
sudo systemctl daemon-reload
sudo systemctl enable --now darlink-backup.timer darlink-stats.timer darlink-dashboard.service
sudo systemctl list-timers darlink-*    # 检查下次触发时间
```

立即跑一次（不等到午夜）：
```bash
sudo systemctl start darlink-backup.service
sudo systemctl start darlink-stats.service
```

---

## 3. 验证

```bash
# 1) 看板：浏览器开 http://<server-ip>:8501
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8501
# 期望：HTTP 200

# 2) 备份产物：
ls -lh /opt/darlink/backups/

# 3) 统计报告：
ls -lh /opt/darlink/scripts/reports/

# 4) 服务状态：
systemctl status darlink-dashboard
systemctl list-timers darlink-*

# 5) 日志：
tail -f /opt/darlink/scripts/logs/backup.log
tail -f /opt/darlink/scripts/logs/dashboard.log
```

---

## 4. 暴露看板（可选）

`darlink-dashboard.service` 默认监听 `0.0.0.0:8501`。如要走 80/443，最简单的方式是 nginx 反代：

```nginx
# /etc/nginx/sites-available/darlink-dashboard
server {
    listen 80;
    server_name dashboard.darlink.example.com;
    location / {
        proxy_pass http://127.0.0.1:8501;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/darlink-dashboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. 无 systemd 的环境（容器、老 Linux）

参考 `cron-fallback.txt`：把里面的 cron 行加到 darlink 用户的 crontab，dashboard 用 nohup 或 supervisor 托管。

---

## 6. 卸载

```bash
sudo systemctl disable --now darlink-backup.timer darlink-stats.timer darlink-dashboard.service
sudo rm /etc/systemd/system/darlink-*.{service,timer}
sudo rm /etc/logrotate.d/darlink
sudo systemctl daemon-reload
# 数据保留在 /opt/darlink，按需手动清理
```

---

## 故障排查

| 现象 | 排查 |
|---|---|
| timer 不触发 | `systemctl list-timers darlink-*` 看 NEXT 列；`journalctl -u darlink-backup.timer` |
| 备份脚本报权限 | 确认 `data/`、`backups/`、`scripts/logs/` 的属主是 `darlink:darlink` |
| dashboard 502 | `systemctl status darlink-dashboard`；多半是 venv 路径错或 streamlit 没装 |
| 日志不轮转 | `sudo logrotate -d /etc/logrotate.d/darlink` 跑一次诊断 |
