from fastapi import FastAPI
from pathlib import Path
import sys
import os
from typing import Optional, List
from pydantic import BaseModel
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

# ---- SKILL.md 加载（共享 backend/skill_loader.py）----
if str(BASE_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(BASE_DIR / "backend"))

from skill_loader import (  # noqa: E402
    PERSONA_ID_TO_DIR,
    SKILL_CACHE,
    build_conversation_layer,
    build_identity_safety_rules,
    warm_all_persona_cache,
)


def _load_skills():
    """启动时加载所有 SKILL.md 到内存"""
    count = warm_all_persona_cache()
    for pid, dirname in PERSONA_ID_TO_DIR.items():
        content = SKILL_CACHE.get(pid)
        if content:
            print(f"  ✓ Loaded SKILL for {dirname} ({len(content)} chars)")
        else:
            print(f"  ⚠ SKILL.md not found for persona {pid} ({dirname})")
    print(f"✓ SKILL.md loaded: {count}/{len(PERSONA_ID_TO_DIR)} personas")


_load_skills()

JSON_SYSTEM_PROMPT = (
    "你是一个严格的 JSON 生成器。"
    "你只能输出一个合法 JSON 对象。"
    "不要输出解释。"
    "不要输出 markdown。"
    "不要输出 ```json 代码块。"
    "不要在 JSON 前后添加任何文字。"
    "所有字符串必须使用双引号。"
    "不能有尾随逗号。"
)


def _ark_configured() -> bool:
    from routes.ai import _ark_key

    key = _ark_key()
    return bool(key and not key.startswith("your-"))


@app.on_event("startup")
async def on_startup():
    from routes.ai import init_http_client

    await init_http_client()
    if _ark_configured():
        print("✓ LLM route: volcengine ARK (shared with backend ai.py)")
    else:
        print("⚠ ARK_API_KEY not configured — persona chat will fall back to stub")


@app.on_event("shutdown")
async def on_shutdown():
    from routes.ai import close_http_client

    await close_http_client()


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

    conversation_layer = build_conversation_layer(persona["name"])
    identity_prefix = ""
    if pid in (21, 22, 23):
        identity_prefix = build_identity_safety_rules("zhHans") + "\n"

    if skill_content:
        return identity_prefix + conversation_layer + skill_content

    # 降级：没有 SKILL.md 时用简短 prompt
    return identity_prefix + conversation_layer + f"""{persona['voice']}"""


@app.post('/respond')
async def respond(r: Req):
    """调用大模型或降级到 stub 实现"""
    from routes.ai import _call_llm

    context_blob = (r.context or '').strip()

    if _ark_configured():
        try:
            # 1. 结构化蒸馏模式：persona_id=None 时，不使用任何人物人格
            if r.persona_id is None:
                reply, provider = await _call_llm(
                    system=JSON_SYSTEM_PROMPT,
                    user=r.text,
                    temperature=0.1,
                    max_tokens=1200,
                )
                return {"ok": True, "reply": reply, "provider": provider}

            # 2. 普通聊天模式：使用人物 persona
            persona = PERSONA_BY_ID.get(r.persona_id or 1, PERSONA_BY_ID[1])
            user_message = r.text

            if context_blob:
                user_message += f"\n\n[用户背景信息参考]：{context_blob[:500]}"

            system_prompt = build_system_prompt(persona)

            if getattr(r, "distilled_traits", None) and getattr(r, "use_distilled_persona", False):
                try:
                    system_prompt = build_system_prompt_from_traits(r.distilled_traits)
                except Exception:
                    system_prompt = build_system_prompt(persona)

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

            reply, provider = await _call_llm(
                system=system_prompt,
                user=user_message,
                temperature=0.8,
                max_tokens=350,
            )
            return {"ok": True, "reply": reply, "provider": provider}

        except Exception as e:
            print(f"ARK LLM error: {e}")

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
    return {
        'ok': True,
        'status': 'model service running',
        'llm_api': 'volcengine-ark' if _ark_configured() else 'not_configured',
    }


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
