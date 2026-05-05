# Darlink 数据工程脚本

围绕 `data/darlink.sqlite` 的导出、统计、质量分析、备份、看板工具集。**不修改后端代码**，只读使用数据库（备份脚本除外）。

---

## 目录

```
scripts/
├── _common.py                     # 共享工具：DB 连接、JSON、日志
├── seed_demo_data.py              # 生成演示数据（仓库无 sqlite 文件时必跑）
├── export_session.py              # 单会话 → JSON
├── export_all_conversations.py    # 批量 → 多个 JSON + _index.json
├── generate_stats_report.py       # 统计报告（JSON + Markdown）
├── analyze_conversation_quality.py# 质量分析（含可选图表）
├── backup_db.py                   # SQLite + exports 打包备份（P1）
├── incremental_export.py          # 增量导出（P1）
├── dashboard.py                   # Streamlit 看板（P2）
├── sql_templates/                 # 7 个常用 SQL 模板
├── exports/                       # JSON 输出（gitignore）
├── reports/                       # 报告输出（gitignore）
└── logs/                          # 运行日志（gitignore）
```

---

## 快速开始

```bash
# 1. 生成演示数据（首次必跑）
python scripts/seed_demo_data.py --users 10 --sessions 30 --seed 42

# 2. 单会话导出
SAMPLE=$(sqlite3 data/darlink.sqlite "SELECT id FROM sessions LIMIT 1")
python scripts/export_session.py --session-id "$SAMPLE"

# 3. 批量导出
python scripts/export_all_conversations.py
python scripts/export_all_conversations.py --since 2026-04-28 --persona-id 2

# 4. 统计报告
python scripts/generate_stats_report.py --md

# 5. 质量分析
python scripts/analyze_conversation_quality.py
python scripts/analyze_conversation_quality.py --session-id "$SAMPLE"
python scripts/analyze_conversation_quality.py --charts        # 需 matplotlib

# 6. SQL 模板
sqlite3 data/darlink.sqlite < scripts/sql_templates/02_top_active_users.sql
```

---

## 脚本详解

### seed_demo_data.py

为新克隆/空数据库注入可用的演示数据。幂等（重复跑不会报错），用 `--reset` 清空 `demo_user_*@test.edu.cn` 后重新生成。

```
--users N         # 用户数（默认 10，最后 2 个未验证）
--sessions N      # 会话数（默认 30）
--reset           # 先清 demo 数据
--seed N          # random.seed，复现用
--db PATH         # 自定义 sqlite 路径
```

### export_session.py

把单个会话连同 user/persona 元信息和全部消息导成一个 JSON 文件。

输出结构：
```json
{
  "exported_at": "...",
  "session_id": "...", "skill_name": null,
  "started_at": "...", "last_at": "...",
  "message_count": 16,
  "user":    { "id":..., "email":..., "verified": true },
  "persona": { "id":..., "name":..., "desc":... },
  "messages": [ {"role":"user", "text":"...", "meta":..., "created_at":"..."}, ... ]
}
```

找不到 session_id 时退出码 2。

### export_all_conversations.py

逐会话调用 `build_export()`，每个会话写 `exports/<session_id>.json`，并生成 `exports/_index.json` 作为目录页。

```
--since YYYY-MM-DD   # 只导 last_at 之后的会话
--persona-id N       # 只导特定 persona
--output-dir PATH    # 自定义输出目录
```

### generate_stats_report.py

聚合 SQL 出报告，输出 JSON（必）+ Markdown（可选 `--md`）。覆盖维度：

- 用户：总数 / 已验证 / 未验证 / 近 7 天新增
- 会话：总数 / 近 7 天新增 / 平均消息数
- 消息：总数 / user-bot 比例 / 平均长度
- 按 persona 分布、按日活跃、Top 5 活跃用户、Top 5 热门 persona

报告默认写到 `reports/stats_<YYYYMMDD>.json`。

### analyze_conversation_quality.py

对话质量诊断。

- 单会话模式：`--session-id sess_xxx` → 该会话的长度分布、轮次、问句比例、响应延迟
- 全量模式（默认）：聚合所有 session、按 persona 拆开、列出低质量 session_id

低质量判定（任一即标记）：
- 消息总数 < 4
- 平均消息长度 < 10 字
- 用户消息全部短于 5 字

`--charts` 会用 matplotlib 输出三张 PNG 到 `reports/charts/`：
1. `length_distribution.png`：消息长度分布柱状图
2. `by_persona.png`：每 persona 的会话数 vs 低质量数
3. `depth_scatter.png`：轮次 vs 平均长度散点（红 = 低质量）

### SQL 模板（`sql_templates/`）

可直接用 `sqlite3 data/darlink.sqlite < <file>` 跑，已加 `.mode column` / `.headers on` 让结果直接可读。

| 文件 | 用途 |
|---|---|
| `01_messages_by_date_range.sql` | 按日期范围查消息（手改 BETWEEN 范围） |
| `02_top_active_users.sql` | 消息数 Top 10 用户 |
| `03_user_persona_matrix.sql` | 用户 × persona 交互矩阵 |
| `04_inactive_verified_users.sql` | 已验证但近 7 天未发言（流失预警） |
| `05_session_length_distribution.sql` | 会话长度分桶 |
| `06_daily_activity.sql` | 近 14 天每日活跃 |
| `07_low_quality_sessions.sql` | 低质量会话定位 |

---

## 依赖与环境

```bash
# P0 — 标准库即可，无需 pip
python --version    # 3.11+ 推荐

# P1/P2 — 需要时再装
pip install -r scripts/requirements.txt
```

---

## 与后端的边界

- 全部脚本默认**只读**连接（`mode=ro`），不会污染后端正在写的数据。
- DDL 在 `_common.py` 里冗余了一份（`SCHEMA_DDL`），seed 时用，避免依赖后端启动。
- 不 import `backend.*`，避免 SQLAlchemy 元数据冲突。

---

## P0 验收清单

参照 `DATA_PARSING.md`，逐条对应：

- [x] 单会话导出（`export_session.py`）
- [x] 批量导出（`export_all_conversations.py`）
- [x] 统计报告含用户数 / 消息量 / persona 分布（`generate_stats_report.py`）
- [x] 质量分析（`analyze_conversation_quality.py`）
- [x] 可执行 SQL 示例（`sql_templates/*.sql`）
- [x] JSON 输出格式良好（UTF-8、ensure_ascii=False、缩进 2）
- [x] README 描述使用方式（本文件）
