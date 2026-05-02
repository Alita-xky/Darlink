# 历史数据解析指南 - 给数据工程师的任务清单

## 📋 概述

您需要：
1. **建立数据导出工具**：能够从SQLite数据库导出用户对话、个人资料等数据
2. **提供数据查询文档**：SQL查询示例和Python脚本，用于分析和探索数据
3. **创建数据分析管道**：从原始对话数据提取有用的特征和统计

**预期成果**：
- 能够随时导出任何时间段的对话数据
- 能够生成用户行为统计报告
- 能够提取AI回复的质量指标
- 建立可重复的数据分析流程

---

## 🗄️ 数据库架构

### 文件位置
```
项目根目录/data/darlink.sqlite
```

### 核心表结构

#### 1. users（用户表）
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    user_token TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**查询示例**：
```sql
-- 查看所有注册用户
SELECT COUNT(*) FROM users;

-- 查看已验证的用户
SELECT * FROM users WHERE verified = 1;

-- 按注册时间排序
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

#### 2. sessions（聊天会话表）
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    persona_id INTEGER NOT NULL,
    skill_name TEXT,  -- 已弃用，保留用于兼容性
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**查询示例**：
```sql
-- 查看所有会话
SELECT COUNT(*) FROM sessions;

-- 查看特定用户的所有会话
SELECT * FROM sessions WHERE user_id = 1;

-- 查看与某个人物的所有对话
SELECT * FROM sessions WHERE persona_id = 1;

-- 统计每个人物的对话数
SELECT persona_id, COUNT(*) as count FROM sessions GROUP BY persona_id;
```

#### 3. messages（消息表）
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,  -- 'user' 或 'bot'
    text TEXT NOT NULL,
    meta TEXT,           -- JSON格式的元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**查询示例**：
```sql
-- 查看特定会话的所有消息
SELECT * FROM messages 
WHERE session_id = 'xxx' 
ORDER BY created_at ASC;

-- 查看用户发送的消息数
SELECT COUNT(*) FROM messages WHERE role = 'user';

-- 查看AI回复的消息数
SELECT COUNT(*) FROM messages WHERE role = 'bot';

-- 获取最近100条消息
SELECT * FROM messages ORDER BY created_at DESC LIMIT 100;
```

#### 4. user_profiles（用户资料表）
```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    profile_text TEXT,   -- 用户上传的自我介绍
    vector TEXT,         -- JSON格式的向量嵌入
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**查询示例**：
```sql
-- 查看所有上传过资料的用户
SELECT COUNT(*) FROM user_profiles;

-- 查看用户资料内容
SELECT user_id, profile_text FROM user_profiles LIMIT 5;

-- 关联用户和其资料
SELECT u.email, p.profile_text 
FROM users u 
LEFT JOIN user_profiles p ON u.id = p.user_id;
```

#### 5. email_verifications（邮箱验证表）
```sql
CREATE TABLE email_verifications (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    confirm_token TEXT UNIQUE NOT NULL,
    confirmed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Python 数据导出脚本

### 脚本 1：导出单个会话的对话记录

**文件**：`scripts/export_session.py`

```python
import sqlite3
import json
from pathlib import Path
from datetime import datetime

def export_session(session_id: str, output_file: str = None):
    """
    将指定会话的所有消息导出为JSON或CSV
    
    参数：
        session_id: 会话ID
        output_file: 输出文件路径（默认：export_session_{session_id}.json）
    """
    
    if output_file is None:
        output_file = f"export_session_{session_id}.json"
    
    # 连接数据库
    db_path = Path(__file__).parent.parent / "data" / "darlink.sqlite"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 获取会话信息
    cursor.execute("""
        SELECT s.id, s.user_id, s.persona_id, s.created_at 
        FROM sessions s 
        WHERE s.id = ?
    """, (session_id,))
    
    session = cursor.fetchone()
    if not session:
        print(f"❌ 会话 {session_id} 不存在")
        return
    
    session_id, user_id, persona_id, session_created = session
    
    # 获取用户信息
    cursor.execute("""
        SELECT email FROM users WHERE id = ?
    """, (user_id,))
    
    user_email = cursor.fetchone()[0]
    
    # 获取人物信息
    from persona_registry import PERSONA_BY_ID
    persona = PERSONA_BY_ID.get(persona_id, {})
    persona_name = persona.get("name", f"Persona_{persona_id}")
    
    # 获取所有消息
    cursor.execute("""
        SELECT role, text, created_at 
        FROM messages 
        WHERE session_id = ? 
        ORDER BY created_at ASC
    """, (session_id,))
    
    messages = cursor.fetchall()
    
    # 组织数据
    export_data = {
        "session_id": session_id,
        "user_email": user_email,
        "persona_name": persona_name,
        "persona_id": persona_id,
        "session_created_at": session_created,
        "message_count": len(messages),
        "messages": [
            {
                "role": role,
                "text": text,
                "timestamp": timestamp
            }
            for role, text, timestamp in messages
        ]
    }
    
    # 保存到文件
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已导出到 {output_file}")
    print(f"   用户: {user_email}")
    print(f"   AI人物: {persona_name}")
    print(f"   消息数: {len(messages)}")
    
    conn.close()


# 使用示例
if __name__ == "__main__":
    # 导出特定会话
    export_session("8cbc3c90-3a7d-4c9c-a682-b1b4a6b563e2")
    
    # 或使用自定义输出文件
    export_session("8cbc3c90-3a7d-4c9c-a682-b1b4a6b563e2", "my_conversation.json")
```

**使用方法**：
```bash
cd scripts
python export_session.py
```

### 脚本 2：批量导出所有对话

**文件**：`scripts/export_all_conversations.py`

```python
import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime

def export_all_conversations(output_dir: str = "exports"):
    """
    将所有对话导出为独立的JSON文件
    """
    
    os.makedirs(output_dir, exist_ok=True)
    
    db_path = Path(__file__).parent.parent / "data" / "darlink.sqlite"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 获取所有会话
    cursor.execute("SELECT id, user_id, persona_id, created_at FROM sessions")
    sessions = cursor.fetchall()
    
    print(f"📊 找到 {len(sessions)} 个会话，开始导出...\n")
    
    for session_id, user_id, persona_id, session_created in sessions:
        # 获取用户邮箱
        cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
        user_email = cursor.fetchone()[0]
        
        # 获取消息
        cursor.execute("""
            SELECT role, text, created_at 
            FROM messages 
            WHERE session_id = ? 
            ORDER BY created_at ASC
        """, (session_id,))
        
        messages = cursor.fetchall()
        
        # 获取人物名字
        from persona_registry import PERSONA_BY_ID
        persona = PERSONA_BY_ID.get(persona_id, {})
        persona_name = persona.get("name", f"Persona_{persona_id}")
        
        # 组织数据
        export_data = {
            "session_id": session_id,
            "user_email": user_email,
            "persona_name": persona_name,
            "persona_id": persona_id,
            "session_created_at": session_created,
            "message_count": len(messages),
            "messages": [
                {
                    "role": role,
                    "text": text,
                    "timestamp": timestamp
                }
                for role, text, timestamp in messages
            ]
        }
        
        # 生成文件名
        filename = f"{output_dir}/{persona_name}_{user_email.split('@')[0]}_{session_id[:8]}.json"
        filename = filename.replace(" ", "_")  # 处理空格
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {filename}")
    
    print(f"\n📦 所有 {len(sessions)} 个对话已导出到 '{output_dir}' 目录")
    conn.close()


if __name__ == "__main__":
    export_all_conversations()
```

### 脚本 3：生成对话统计报告

**文件**：`scripts/generate_stats_report.py`

```python
import sqlite3
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timedelta

def generate_stats_report(output_file: str = "stats_report.json"):
    """
    生成详细的数据统计报告
    """
    
    db_path = Path(__file__).parent.parent / "data" / "darlink.sqlite"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 统计信息字典
    stats = {}
    
    # 1. 用户统计
    cursor.execute("SELECT COUNT(*) FROM users")
    stats["total_users"] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE verified = 1")
    stats["verified_users"] = cursor.fetchone()[0]
    
    # 2. 会话统计
    cursor.execute("SELECT COUNT(*) FROM sessions")
    stats["total_sessions"] = cursor.fetchone()[0]
    
    # 3. 消息统计
    cursor.execute("SELECT COUNT(*) FROM messages WHERE role = 'user'")
    stats["user_messages"] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM messages WHERE role = 'bot'")
    stats["bot_messages"] = cursor.fetchone()[0]
    
    stats["total_messages"] = stats["user_messages"] + stats["bot_messages"]
    
    # 4. 每个人物的对话统计
    cursor.execute("""
        SELECT 
            p.persona_id,
            COUNT(DISTINCT p.id) as session_count,
            COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_msg_count,
            COUNT(CASE WHEN m.role = 'bot' THEN 1 END) as bot_msg_count
        FROM sessions p
        LEFT JOIN messages m ON p.id = m.session_id
        GROUP BY p.persona_id
        ORDER BY session_count DESC
    """)
    
    from persona_registry import PERSONA_BY_ID
    
    persona_stats = []
    for persona_id, session_count, user_msg_count, bot_msg_count in cursor.fetchall():
        persona = PERSONA_BY_ID.get(persona_id, {})
        persona_stats.append({
            "persona_id": persona_id,
            "persona_name": persona.get("name", f"Persona_{persona_id}"),
            "session_count": session_count,
            "user_messages": user_msg_count,
            "bot_messages": bot_msg_count,
            "total_messages": (user_msg_count or 0) + (bot_msg_count or 0)
        })
    
    stats["persona_breakdown"] = persona_stats
    
    # 5. 消息长度统计
    cursor.execute("""
        SELECT 
            AVG(LENGTH(text)) as avg_length,
            MIN(LENGTH(text)) as min_length,
            MAX(LENGTH(text)) as max_length
        FROM messages
        WHERE role = 'user'
    """)
    
    user_avg, user_min, user_max = cursor.fetchone()
    stats["user_message_stats"] = {
        "average_length": round(user_avg, 2) if user_avg else 0,
        "min_length": user_min or 0,
        "max_length": user_max or 0
    }
    
    cursor.execute("""
        SELECT 
            AVG(LENGTH(text)) as avg_length,
            MIN(LENGTH(text)) as min_length,
            MAX(LENGTH(text)) as max_length
        FROM messages
        WHERE role = 'bot'
    """)
    
    bot_avg, bot_min, bot_max = cursor.fetchone()
    stats["bot_message_stats"] = {
        "average_length": round(bot_avg, 2) if bot_avg else 0,
        "min_length": bot_min or 0,
        "max_length": bot_max or 0
    }
    
    # 6. 时间统计
    cursor.execute("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as message_count
        FROM messages
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    """)
    
    daily_stats = [{"date": date, "message_count": count} for date, count in cursor.fetchall()]
    stats["daily_activity"] = daily_stats
    
    # 7. 已上传资料的用户
    cursor.execute("SELECT COUNT(*) FROM user_profiles")
    stats["users_with_profiles"] = cursor.fetchone()[0]
    
    # 保存报告
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print("📊 统计报告已生成")
    print(f"\n总体统计：")
    print(f"  • 注册用户：{stats['total_users']}")
    print(f"  • 已验证用户：{stats['verified_users']}")
    print(f"  • 总对话数：{stats['total_sessions']}")
    print(f"  • 总消息数：{stats['total_messages']}")
    print(f"    - 用户消息：{stats['user_messages']}")
    print(f"    - AI回复：{stats['bot_messages']}")
    print(f"\n人物排名（按对话数）：")
    for i, ps in enumerate(persona_stats[:5], 1):
        print(f"  {i}. {ps['persona_name']}: {ps['session_count']} 个对话")
    
    print(f"\n✅ 详细报告已保存到 {output_file}")
    conn.close()


if __name__ == "__main__":
    generate_stats_report()
```

### 脚本 4：对话质量分析

**文件**：`scripts/analyze_conversation_quality.py`

```python
import sqlite3
from pathlib import Path
import statistics

def analyze_conversation_quality(session_id: str = None):
    """
    分析对话质量指标
    
    参数：
        session_id: 如果指定，只分析该会话；否则分析所有会话
    """
    
    db_path = Path(__file__).parent.parent / "data" / "darlink.sqlite"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 获取查询条件
    if session_id:
        query = "WHERE session_id = ?"
        params = (session_id,)
    else:
        query = ""
        params = ()
    
    # 获取所有消息
    cursor.execute(f"""
        SELECT role, text, created_at 
        FROM messages 
        {query}
        ORDER BY created_at ASC
    """, params)
    
    messages = cursor.fetchall()
    
    if not messages:
        print("❌ 找不到消息")
        return
    
    # 分析指标
    user_lengths = []
    bot_lengths = []
    user_count = 0
    bot_count = 0
    
    for role, text, _ in messages:
        msg_length = len(text.split())
        if role == "user":
            user_lengths.append(msg_length)
            user_count += 1
        else:
            bot_lengths.append(msg_length)
            bot_count += 1
    
    print("📈 对话质量分析")
    print("=" * 50)
    print(f"总消息数：{len(messages)}")
    print(f"用户消息：{user_count}")
    print(f"AI回复：{bot_count}")
    print()
    
    if user_lengths:
        print("用户消息长度统计：")
        print(f"  • 平均：{statistics.mean(user_lengths):.1f} 词")
        print(f"  • 中位数：{statistics.median(user_lengths):.1f} 词")
        print(f"  • 最小：{min(user_lengths)} 词")
        print(f"  • 最大：{max(user_lengths)} 词")
    
    if bot_lengths:
        print()
        print("AI回复长度统计：")
        print(f"  • 平均：{statistics.mean(bot_lengths):.1f} 词")
        print(f"  • 中位数：{statistics.median(bot_lengths):.1f} 词")
        print(f"  • 最小：{min(bot_lengths)} 词")
        print(f"  • 最大：{max(bot_lengths)} 词")
    
    # 对话轮数
    print()
    print(f"对话轮数：{min(user_count, bot_count)}")
    print(f"平均轮数深度：{len(messages) / 2:.1f}")
    
    conn.close()


if __name__ == "__main__":
    # 分析所有会话
    analyze_conversation_quality()
    
    # 或分析特定会话
    # analyze_conversation_quality("8cbc3c90-3a7d-4c9c-a682-b1b4a6b563e2")
```

---

## 🔍 常用 SQL 查询模板

### 查询 1：按时间范围导出消息

```sql
-- 导出2026年5月1日到5月3日的所有消息
SELECT 
    s.id as session_id,
    u.email,
    p.name as persona_name,
    m.role,
    m.text,
    m.created_at
FROM messages m
JOIN sessions s ON m.session_id = s.id
JOIN users u ON m.user_id = u.id
JOIN personas p ON s.persona_id = p.id
WHERE DATE(m.created_at) BETWEEN '2026-05-01' AND '2026-05-03'
ORDER BY m.created_at DESC;
```

### 查询 2：找到最活跃的用户

```sql
-- 按消息数排序，找出最活跃的10个用户
SELECT 
    u.email,
    COUNT(m.id) as message_count,
    COUNT(DISTINCT s.id) as session_count
FROM users u
LEFT JOIN messages m ON u.id = m.user_id
LEFT JOIN sessions s ON m.session_id = s.id
GROUP BY u.id
ORDER BY message_count DESC
LIMIT 10;
```

### 查询 3：查看用户与特定人物的对话

```sql
-- 查看特定用户与 Charlie Munger（persona_id=1）的所有对话
SELECT 
    m.created_at,
    m.role,
    m.text
FROM messages m
JOIN sessions s ON m.session_id = s.id
WHERE s.user_id = (SELECT id FROM users WHERE email = 'user@university.edu' LIMIT 1)
  AND s.persona_id = 1
ORDER BY m.created_at ASC;
```

### 查询 4：统计没有任何对话的用户

```sql
-- 找出已验证但没有进行过任何对话的用户
SELECT u.email, u.created_at
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
WHERE u.verified = 1 AND s.id IS NULL;
```

---

## 📦 数据导出目录结构

```
Darlink/
├── scripts/
│   ├── export_session.py          # 导出单个会话
│   ├── export_all_conversations.py # 批量导出
│   ├── generate_stats_report.py    # 统计报告
│   └── analyze_conversation_quality.py # 质量分析
├── exports/                         # 导出的JSON文件（自动创建）
├── distillation_logs/              # 蒸馏日志（自动创建）
└── data/
    └── darlink.sqlite              # SQLite数据库
```

---

## ✅ 验收标准

- [ ] 能够导出特定会话的完整对话记录
- [ ] 能够批量导出所有对话
- [ ] 能够生成包含关键统计指标的报告
- [ ] 能够分析单个会话的质量指标
- [ ] 所有SQL查询示例都能正确执行
- [ ] 所有导出的JSON文件格式规范、可读性强

---

## 🔗 相关文件位置

- **数据库**：`data/darlink.sqlite`
- **ORM模型**：`backend/models.py`
- **人物注册表**：`persona_registry.py`
- **数据库操作**：`backend/crud.py`

---

## 💡 进阶需求

如果需要进一步扩展，可以考虑：

1. **连接到远程数据库**（Postgres）而不是 SQLite
2. **使用 Pandas 进行数据分析**：
   ```python
   import pandas as pd
   df = pd.read_sql("SELECT * FROM messages", conn)
   df.to_csv("messages.csv", index=False)
   ```

3. **可视化仪表板**（Streamlit / Plotly）
4. **数据仓库集成**（BigQuery / Snowflake）
5. **自动备份和版本控制**

