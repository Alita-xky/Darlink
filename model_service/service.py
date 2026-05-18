from fastapi import FastAPI
from pathlib import Path
import sys
import os
from typing import Optional, Dict, List
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def _load_env_files() -> List[str]:
    """Load environment files from the most common project locations."""
    loaded: List[str] = []
    for env_path in [BASE_DIR / '.env', BASE_DIR / 'model_service' / '.env', BASE_DIR / 'backend' / '.env']:
        if env_path.exists():
            load_dotenv(env_path, override=False)
            loaded.append(str(env_path))
    return loaded


LOADED_ENV_FILES = _load_env_files()

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
    if LOADED_ENV_FILES:
        print(f"⚠ OPENAI_API_KEY not configured, loaded env from: {', '.join(LOADED_ENV_FILES)}")
    else:
        print("⚠ OPENAI_API_KEY not configured and no .env file found, running in Stub mode")


class Req(BaseModel):
    text: str
    persona_id: Optional[int] = None
    context: Optional[str] = None
    distilled_traits: Optional[dict] = None
    use_distilled_persona: Optional[bool] = False


def build_system_prompt(persona: dict) -> str:
    """根据人物信息构建系统提示词，优先使用 SKILL.md，外包对话层指令"""
    pid = persona["id"]
    skill_content = SKILL_CACHE.get(pid)

    # 对话层：让AI像真人聊天而不是像AI助手
    conversation_layer = f"""你是{persona['name']}，正在和一个大学生朋友微信聊天。

## 铁律（违反任何一条都是失败）

1. **纯文字聊天**：绝对不要写动作描写（如"停顿一下"、"露出微笑"）、不要用markdown格式（加粗、列表、标题）、不要用表格。你在发微信消息，不是写文章。
2. **长度适中**：普通回复3-5句话。对方让你多说或追问时，可以说到8-10句，但要像聊天一样一段一段说，不要写成文章。
3. **不要自我表演**：不要主动提自己的公司、成就、身份。只有对方问到相关话题时才自然带出。正常人聊天不会反复强调自己是谁。
4. **不要当老师**：语气是朋友随便聊，不是在做讲座。不要用"让我告诉你"、"我来给你讲讲"这种居高临下的语气。
5. **思维内化**：你的思维方式自然体现在聊天中，但绝对不要说"用XX模型分析"、"根据XX原则"、"从XX角度"。没有人会给自己的想法贴方法论标签。
6. **像个正常人**：会开玩笑、会反问、会说"我也不确定"、会跑题。不是每个问题都要给出完美答案。
7. **要有实质内容**：对方问你问题或让你展开说，你要真的给出有意思的观点和想法，不要用"你想听哪方面"、"你想聊什么"来回避。直接聊你真正的想法，别总是把球踢回去。

## 你的思维和性格参考

以下是你这个人物的背景知识，把它内化成你说话的方式，不要照搬、不要引用：

"""

    if skill_content:
        return conversation_layer + skill_content

    # 降级：没有 SKILL.md 时用简短 prompt
    return conversation_layer + f"""{persona['voice']}"""


@app.post('/respond')
async def respond(r: Req):
    """调用大模型或降级到 stub 实现"""
    context_blob = (r.context or '').strip()

    # 如果配置了 OpenAI / DeepSeek API，使用真实模型
    if client is not None:
        try:
            # 1. 结构化蒸馏模式：persona_id=None 时，不使用任何人物人格
            if r.persona_id is None:
                response = await client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "你是一个严格的 JSON 生成器。"
                                "你只能输出一个合法 JSON 对象。"
                                "不要输出解释。"
                                "不要输出 markdown。"
                                "不要输出 ```json 代码块。"
                                "不要在 JSON 前后添加任何文字。"
                                "所有字符串必须使用双引号。"
                                "不能有尾随逗号。"
                            ),
                        },
                        {
                            "role": "user",
                            "content": r.text,
                        },
                    ],
                    temperature=0.1,
                    max_tokens=1200,
                    timeout=30.0,
                )

                reply = response.choices[0].message.content or ""
                return {"ok": True, "reply": reply}

            # 2. 普通聊天模式：使用人物 persona
            persona = PERSONA_BY_ID.get(r.persona_id or 1, PERSONA_BY_ID[1])

            user_message = r.text

            # 如果有用户 profile 上下文，加入到提示词中
            if context_blob:
                user_message += f"\n\n[用户背景信息参考]：{context_blob[:500]}"

            # 默认使用人物系统提示词
            system_prompt = build_system_prompt(persona)

            # 如果传入了 distilled_traits 并且要求用作 system persona
            if getattr(r, "distilled_traits", None) and getattr(r, "use_distilled_persona", False):
                try:
                    system_prompt = build_system_prompt_from_traits(r.distilled_traits)
                except Exception:
                    system_prompt = build_system_prompt(persona)

            # 如果传入了 distilled_traits 但不作为 system，只把摘要塞进上下文
            if getattr(r, "distilled_traits", None) and not getattr(r, "use_distilled_persona", False):
                try:
                    summary = (
                        r.distilled_traits.get("summary")
                        if isinstance(r.distilled_traits, dict)
                        else None
                    )
                    if summary:
                        user_message += f"\n\n[用户蒸馏摘要]：{summary[:300]}"
                except Exception:
                    pass

            response = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.8,
                max_tokens=350,
                timeout=15.0,
            )

            reply = response.choices[0].message.content or ""
            return {"ok": True, "reply": reply}

        except Exception as e:
            error_msg = str(e)
            print(f"OpenAI API error: {error_msg}")

    # 3. stub 降级逻辑
    # 蒸馏模式下不能用 stub 假装成功，否则后端会解析失败
    if r.persona_id is None:
        return {
            "ok": False,
            "reply": "",
            "error": "LLM API 未配置或调用失败，无法执行结构化蒸馏",
        }

    persona = PERSONA_BY_ID.get(r.persona_id or 1, PERSONA_BY_ID[1])
    context_part = f" 结合上下文：{context_blob[:120]}。" if context_blob else ""
    reply = f"[{persona['name']}] {persona['voice']} 你刚才说的是：{r.text}。{context_part}"

    return {"ok": True, "reply": reply}


@app.get('/')
async def root():
    api_status = "configured" if client is not None else "not_configured"
    return {'ok': True, 'status': 'model service running', 'llm_api': api_status}


from fastapi.responses import HTMLResponse

@app.get('/test', response_class=HTMLResponse)
async def test_page():
    names = {v: k for k, v in PERSONA_ID_TO_DIR.items()}
    options = ''.join(f'<option value="{pid}">{name}</option>' for name, pid in sorted(names.items(), key=lambda x: x[1]))
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Darlink 聊天测试</title>
<style>
body {{ font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }}
#chat {{ border: 1px solid #ddd; border-radius: 8px; padding: 16px; min-height: 300px; margin: 16px 0; overflow-y: auto; max-height: 500px; }}
.msg {{ margin: 8px 0; padding: 8px 12px; border-radius: 12px; max-width: 80%; }}
.user {{ background: #007aff; color: white; margin-left: auto; text-align: right; }}
.bot {{ background: #f0f0f0; }}
input[type=text] {{ width: 70%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; }}
select, button {{ padding: 8px 12px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; }}
button {{ background: #007aff; color: white; border: none; }}
.loading {{ color: #999; font-style: italic; }}
</style></head>
<body>
<h2>Darlink 聊天测试</h2>
<div>
  <select id="persona">{options}</select>
</div>
<div id="chat"></div>
<div>
  <input type="text" id="msg" placeholder="说点什么..." onkeydown="if(event.key==='Enter')send()">
  <button onclick="send()">发送</button>
</div>
<script>
async function send() {{
  const msg = document.getElementById('msg');
  const chat = document.getElementById('chat');
  const pid = document.getElementById('persona').value;
  if (!msg.value.trim()) return;
  chat.innerHTML += '<div class="msg user">' + msg.value + '</div>';
  const text = msg.value;
  msg.value = '';
  chat.innerHTML += '<div class="msg bot loading" id="loading">思考中...</div>';
  chat.scrollTop = chat.scrollHeight;
  try {{
    const r = await fetch('/respond', {{
      method: 'POST',
      headers: {{'Content-Type': 'application/json'}},
      body: JSON.stringify({{text, persona_id: parseInt(pid)}})
    }});
    const d = await r.json();
    document.getElementById('loading').remove();
    chat.innerHTML += '<div class="msg bot">' + (d.reply || d.detail || 'error') + '</div>';
  }} catch(e) {{
    document.getElementById('loading').remove();
    chat.innerHTML += '<div class="msg bot">请求失败: ' + e.message + '</div>';
  }}
  chat.scrollTop = chat.scrollHeight;
}}
</script>
</body></html>"""
