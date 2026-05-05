from fastapi import FastAPI
from pathlib import Path
import sys
import os
from typing import Optional, Dict
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# 加载 .env 文件（优先加载项目根目录的 .env）
if Path(BASE_DIR / '.env').exists():
    load_dotenv(BASE_DIR / '.env')

from persona_registry import PERSONA_BY_ID

app = FastAPI()

# ---- SKILL.md 加载 ----
PERSONA_ID_TO_DIR = {
    1: "munger", 2: "musk", 3: "feynman", 4: "jobs", 5: "buffett",
    6: "naval", 7: "pg", 8: "bezos", 9: "dalio", 10: "jensen",
    11: "drucker", 12: "gates", 13: "andreessen",
}

MAX_SKILL_CHARS = 12000  # 留足对话空间，截断过长的 SKILL.md

SKILL_CACHE: Dict[int, str] = {}  # persona_id -> skill content


def _load_skills():
    """启动时加载所有 SKILL.md 到内存"""
    skills_base = BASE_DIR / ".claude" / "skills"
    for pid, dirname in PERSONA_ID_TO_DIR.items():
        skill_path = skills_base / f"{dirname}-perspective" / "SKILL.md"
        if skill_path.exists():
            content = skill_path.read_text(encoding="utf-8")
            # 去掉 YAML frontmatter
            if content.startswith("---"):
                end = content.find("---", 3)
                if end != -1:
                    content = content[end + 3:].strip()
            # 截断过长内容
            if len(content) > MAX_SKILL_CHARS:
                content = content[:MAX_SKILL_CHARS] + "\n\n[...内容已截断...]"
            SKILL_CACHE[pid] = content
            print(f"  ✓ Loaded SKILL for {dirname} ({len(content)} chars)")
        else:
            print(f"  ⚠ SKILL.md not found: {skill_path}")
    print(f"✓ SKILL.md loaded: {len(SKILL_CACHE)}/{len(PERSONA_ID_TO_DIR)} personas")


_load_skills()

# 从环境变量读取 OpenAI 配置
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '').strip()
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', '').strip()  # 可选，用于自建代理

# 初始化 OpenAI 客户端
client = None
if OPENAI_API_KEY:
    try:
        if OPENAI_BASE_URL:
            client = AsyncOpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
        else:
            client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        print(f"✓ OpenAI API initialized | Model: {OPENAI_MODEL}")
    except Exception as e:
        print(f"✗ OpenAI API init failed: {e}")
else:
    print("⚠ OPENAI_API_KEY not configured, running in Stub mode")


class Req(BaseModel):
    text: str
    persona_id: Optional[int] = None
    context: Optional[str] = None


def build_system_prompt(persona: dict) -> str:
    """根据人物信息构建系统提示词，优先使用 SKILL.md"""
    pid = persona["id"]
    skill_content = SKILL_CACHE.get(pid)

    if skill_content:
        return skill_content

    # 降级：没有 SKILL.md 时用简短 prompt
    return f"""你是{persona['name']}。你的说话风格和思维方式如下：
{persona['voice']}

在回答用户的问题时，需要完全按照这个人物的思维方式和表达风格来回答。
- 保持人物的独特视角和思维方式
- 使用该人物常用的表达方式和逻辑框架
- 回答简洁有力，避免冗长"""


@app.post('/respond')
async def respond(r: Req):
    """调用大模型或降级到 stub 实现"""
    persona = PERSONA_BY_ID.get(r.persona_id or 1, PERSONA_BY_ID[1])
    context_blob = (r.context or '').strip()

    # 如果配置了 OpenAI API，使用真实模型
    if client is not None:
        try:
            system_prompt = build_system_prompt(persona)
            user_message = r.text
            
            # 如果有用户 profile 上下文，加入到提示词中
            if context_blob:
                user_message += f"\n\n[用户背景信息参考]：{context_blob[:500]}"

            response = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=500,
                timeout=15.0
            )
            reply = response.choices[0].message.content
            return {'ok': True, 'reply': reply}
        except Exception as e:
            # 调用 API 失败时降级到 stub 实现
            error_msg = str(e)
            print(f"OpenAI API error: {error_msg}")
            # 降级逻辑见下方 stub
    
    # stub 实现（API 未配置或调用失败时）
    context_part = f" 结合上下文：{context_blob[:120]}。" if context_blob else ''
    reply = f"[{persona['name']}] {persona['voice']} 你刚才说的是：{r.text}。{context_part}"
    return {'ok': True, 'reply': reply}


@app.get('/')
async def root():
    api_status = "configured" if client is not None else "not_configured"
    return {'ok': True, 'status': 'model service running', 'llm_api': api_status}
