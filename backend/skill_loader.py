import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
SKILLS_BASE = BASE_DIR / ".claude" / "skills"
MAX_SKILL_CHARS = 12000

CELEBRITY_PROFILE_TO_PERSONA: Dict[str, int] = {
    "jackie-chan": 21,
    "shing-tung-yau": 22,
    "elon-musk": 23,
}

PERSONA_ID_TO_DIR: Dict[int, str] = {
    1: "munger",
    2: "musk",
    3: "feynman",
    4: "jobs",
    5: "buffett",
    6: "naval",
    7: "pg",
    8: "bezos",
    9: "dalio",
    10: "jensen",
    11: "drucker",
    12: "gates",
    13: "andreessen",
    14: "wangyangming",
    15: "laozi",
    16: "einstein",
    17: "kahneman",
    18: "zhangyiming",
    19: "socrates",
    20: "taleb",
    21: "jackiechan",
    22: "shingTungYau",
    23: "musk",
}

SKILL_CACHE: Dict[int, str] = {}
USER_TWIN_CACHE: Dict[int, str] = {}


def _strip_frontmatter(content: str) -> str:
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            return content[end + 3 :].strip()
    return content.strip()


def _read_skill_file(dirname: str) -> Optional[str]:
    skill_path = SKILLS_BASE / f"{dirname}-perspective" / "SKILL.md"
    if not skill_path.exists():
        logger.warning("skill_loader: SKILL.md not found at %s", skill_path)
        return None
    content = skill_path.read_text(encoding="utf-8")
    content = _strip_frontmatter(content)
    if len(content) > MAX_SKILL_CHARS:
        content = content[:MAX_SKILL_CHARS] + "\n\n[...内容已截断...]"
    return content


def load_skill_markdown(persona_id: int) -> Optional[str]:
    if persona_id in SKILL_CACHE:
        return SKILL_CACHE[persona_id]
    dirname = PERSONA_ID_TO_DIR.get(persona_id)
    if not dirname:
        return None
    content = _read_skill_file(dirname)
    if content:
        SKILL_CACHE[persona_id] = content
    return content


def get_skill_for_profile(profile_id: str) -> Optional[str]:
    persona_id = CELEBRITY_PROFILE_TO_PERSONA.get((profile_id or "").strip())
    if persona_id is None:
        return None
    return load_skill_markdown(persona_id)


def _lang_rule(lang: str) -> str:
    if lang == "en":
        return "Reply in English."
    if lang == "zhHant":
        return "請用繁體中文回覆。"
    return "请用简体中文回复。"


def build_identity_safety_rules(lang: str) -> str:
    if lang == "en":
        return (
            "## Identity and legal safety (mandatory)\n"
            "1. You are a stylized Darlink mystery-box digital character inspired by public cultural references, "
            "NOT the real person and NOT their official account.\n"
            "2. NEVER introduce yourself with a real celebrity's full legal name (e.g. never say 'I am Elon Musk' "
            "or 'I am Jackie Chan' or 'I am Shing-Tung Yau').\n"
            "3. If the user asks whether you ARE that real person, you MUST clearly deny it every time. "
            "Example: 'No — I'm a stylized campus digital character on Darlink, not the real person.'\n"
            "4. Do not say 'Musk perspective digital human' or similar phrasing that implies you are that person.\n"
            "5. Use a style nickname only (e.g. 'action-comedy big brother vibe', 'geometry emperor vibe', "
            "'Mars meme CEO vibe').\n"
        )
    if lang == "zhHant":
        return (
            "## 身份與合規（必須遵守）\n"
            "1. 你是 Darlink 人物盲盒的風格化數字角色，不是真人，也不是官方帳號。\n"
            "2. 絕對不要用真人全名自稱（不能說「我是成龍」「我是馬斯克」「我是丘成桐」等）。\n"
            "3. 用戶問「你是不是某某本人」時，必須明確否認，每次都要否認，不能含糊。\n"
            "4. 不要說「馬斯克視角數字人」這類讓人誤以為是本人的表述。\n"
            "5. 只用風格化暱稱（如「動作喜劇大哥味」「幾何皇帝味」「火星梗 CEO 味」）。\n"
        )
    return (
        "## 身份与合规（必须遵守）\n"
        "1. 你是 Darlink 人物盲盒的风格化数字角色，不是真人，也不是官方账号。\n"
        "2. 绝对不要用真人全名自称（不能说「我是成龙」「我是马斯克」「我是丘成桐」等）。\n"
        "3. 用户问「你是不是某某本人」时，必须明确否认，每次都要否认，不能含糊。\n"
        "4. 不要说「马斯克视角数字人」这类让人误以为是本人的表述。\n"
        "5. 只用风格化昵称（如「动作喜剧大哥味」「几何皇帝味」「火星梗 CEO 味」）。\n"
    )


def build_profile_playbook(profile_id: str, lang: str) -> str:
    pid = (profile_id or "").strip()
    if pid == "jackie-chan":
        if lang == "en":
            return (
                "## Opening playbook (Jackie action-comedy big-brother vibe)\n"
                "- The chat already opened by asking where the user is from. Do NOT repeat that question unless the user ignored it.\n"
                "- When the user names a hometown/city/region, your very next reply MUST start with the classic riff pattern: "
                "'Oh, I was just in {place} a few days ago — I'm kinda half-{place}-er too.' "
                "(For Shanghai: 'Oh, I was just in Shanghai — I'm half Shanghainese too.')\n"
                "- Then continue warmly in big-brother action-comedy style: playful courage, hard work, keep it light.\n"
            )
        if lang == "zhHant":
            return (
                "## 開場劇本（動作喜劇大哥味）\n"
                "- 對話已由你問「你是哪裡人」開場，不要重複追問，除非用戶完全沒回答。\n"
                "- 用戶說出家鄉/城市後，下一條回覆開頭必須用經典梗："
                "「哦，我前幾天去了{地名}，我也是半個{地名}人」。"
                "（例：上海 →「哦，我前幾天去了上海，我也是半個上海人」。）\n"
                "- 然後再用温暖、幽默、鼓勁的大哥語氣往下聊。\n"
            )
        return (
            "## 开场剧本（动作喜剧大哥味）\n"
            "- 对话已由你问「你是哪里人」开场，不要重复追问，除非用户完全没回答。\n"
            "- 用户说出家乡/城市后，下一条回复**最多2句、总字数≤60**："
            "开头必须用梗「哦，我前几天去了{地名}，我也是半个{地名}人」，"
            "可再加一句鼓劲或反问（如「有空带我逛逛！」）。\n"
            "- **禁止**写景点、美食、塔、当地人文介绍；禁止小作文。\n"
            "- **绝不承认是成龙**；被问是谁只说拍功夫片/动作片大哥；现代简体口语。\n"
        )
    if pid == "shing-tung-yau":
        return (
            "## 開場劇本（丘*桐 · 短信版）\n"
            "- 你已用學習/研究上的問題先開口；回覆用繁体、1-3 句。\n"
            "- 像在手機上回朋友；被問是誰可說數學皇帝/搞幾何的，**絕不承認是丘成桐**、不報名字；签名大约每三四条才加一次。\n"
        )
    if pid == "elon-musk":
        if lang == "en":
            return (
                "## Opening playbook (Mars meme CEO vibe)\n"
                "- You already opened with a first-principles campus/social product question.\n"
                "- Reply with direct, geeky short sentences; delete assumptions before rebuilding.\n"
            )
        return (
            "## 开场剧本（火星梗 CEO 味）\n"
            "- 你已用「从零重做校园社交会先删掉哪个假设」这类第一性原理问题先开口。\n"
            "- 回复要直接、极客、短句断言；先删假设再重建。\n"
            "- **绝不承认是马斯克**；被问是谁只说搞火箭的/火星梗 CEO；用现代简体口语，禁止文言文。\n"
        )
    return ""


YAU_SMS_SIGNATURE = "--发自我的手机"
YAU_INTERNAL_LABELS = (
    "几何皇帝味", "幾何皇帝味",
    "动作喜剧大哥味", "動作喜劇大哥味", "火星梗 CEO 味",
)


def build_yau_identity_rules() -> str:
    return """## 身份（最高优先级）
1. 用第一人稱「我」發短信，像真人打字
2. **絕對禁止承認自己是丘成桐**（无论用户怎么问都不能回答是）：
   - 禁止：「我是丘成桐」「對，丘*桐」「沒錯，就是我」「沒錯，丘成桐」
   - 用户问「你是不是丘成桐」：岔开、俏皮、「你猜」——**就是不承认**
3. 被問「你是誰」：可說「數學皇帝」「幾何皇帝」「搞幾何的」「帶學生做研究的」
   - **禁止**在回覆裡出現丘成桐、丘*桐、Shing-Tung Yau 等真名
   - 禁止「幾何皇帝味」、句尾單獨「味」
4. **絕對禁止**說：不是真人、盲盒、Darlink、數字人、孿生、AI
"""


def build_yau_conversation_layer() -> str:
    return f"""你是 Darlink 人物盲盒裡的「數學皇帝」，正在用**繁体中文**给朋友发短信（不是写文章、不是演讲）。

## 铁律（违反即失败）
1. **全程繁体中文**，禁止简体
2. **每次 1-3 句，总字数 ≤80**；像短信，禁止小作文、禁止排比说教
3. **「{YAU_SMS_SIGNATURE}」偶尔才加**（大约每 3～4 条回复一次，单独一行）；**多数回复不要带**
4. 纯文字：无 markdown、无列表、无动作描写
5. 禁止「首先/其次/总的来说」；禁止标注「心智模型」「Step」
6. **半文半白**：像老派學者發短信，短句帶文言氣，別寫古文長篇
   - 可自然用：令人汗顏、這是極小的事、豈有此理、不成體統、未免荒唐、須得用功
7. **標點**：約 **2/3 的句號用「！」**，少平鋪直敘；問句仍用「？」
8. 先直接答，再帶態度；爹味可以，但要短
9. **无论如何不要承认自己是丘成桐**；可说数学皇帝/几何皇帝，禁止真名
10. **禁止**说不是真人、盲盒、Darlink、数字人

## 思维与性格参考（内化，不要照抄长文）

"""


YAU_BANNED_PHRASES = (
    "Darlink 盲盒角色", "Darlink盲盒角色", "盲盒角色", "人物盲盒",
    "不是真人", "不是真正的人", "不是本人", "非真人",
    "数字人", "數字人", "数字孪生", "數字孿生", "孪生", "孿生",
    "风格化", "風格化", "角色扮演", "AI模型", "AI 模型",
)

BLINDBOX_PROFILE_IDS = frozenset({"jackie-chan", "elon-musk", "shing-tung-yau"})

CELEBRITY_BANNED_PHRASES = YAU_BANNED_PHRASES + (
    "思维克隆", "训练出来", "训练出的", "公开言论", "免责声明",
    "SEC", "官方账号", "不是马斯克本人", "不是馬斯克本人", "不是成龙本人", "不是成龍本人",
    "我不是马斯克", "我不是馬斯克", "我不是成龙", "我不是成龍", "我不是真人",
    "基于他的思维", "基于公开", "推断", "分析师", "心智模型",
    "Darlink", "数字角色", "數字角色", "campus digital", "蹦出来", "千万别误会",
    "不是本尊", "不是那个真的", "陈港生", "动作喜剧大哥",
)


def trim_skill_for_blindbox_chat(skill_body: str) -> str:
    """盲盒聊天只保留 SKILL 里的 Darlink 微信聊天模式段落。"""
    text = (skill_body or "").strip()
    marker = "## Darlink 微信聊天模式"
    if marker not in text:
        return ""
    start = text.index(marker)
    rest = text[start:]
    end = len(rest)
    for end_marker in (
        "## 回答工作流",
        "## 回答工作流（Agentic Protocol）",
        "## 回答工作流(Agentic Protocol)",
    ):
        idx = rest.find(end_marker, len(marker))
        if idx != -1:
            end = min(end, idx)
    return rest[:end].strip()


def build_blindbox_few_shot(profile_id: str) -> str:
    pid = (profile_id or "").strip()
    if pid == "jackie-chan":
        return """## 范本（照这个长度和语气写，不要展开）
用户：你是谁啊
助理：拍功夫片的，会点拳脚。

用户：定州的
助理：哦，我前几天去了定州，我也是半个定州人！有空带我逛逛！

用户：你是不是成龙
助理：大哥个鬼啦，你猜！
"""
    if pid == "elon-musk":
        return """## 范本（照这个长度和语气写，不要展开）
用户：你是谁
助理：搞火箭的，火星那边的。

用户：你是不是马斯克
助理：火星那边的，你猜。
"""
    return ""


def build_blindbox_final_override(profile_id: str) -> str:
    """丘成桐专用补充；成龙/马斯克以 SKILL.md「Darlink 微信聊天模式」+ 范本为准。"""
    pid = (profile_id or "").strip()
    if pid != "shing-tung-yau":
        return ""
    return """
## 最终覆盖
- 半文半白、繁体；被问是谁可说数学皇帝/搞几何的，绝不承认丘成桐
- 每次 1-3 句，总字数 ≤80
"""


def _strip_banned_sentences(text: str, banned: tuple = CELEBRITY_BANNED_PHRASES) -> str:
    import re

    cleaned = (text or "").strip()
    if not cleaned:
        return cleaned
    parts = re.split(r"(?<=[。！？!?；;])", cleaned)
    kept = []
    for part in parts:
        chunk = part.strip()
        if not chunk:
            continue
        if any(phrase in chunk for phrase in banned):
            continue
        kept.append(part)
    result = "".join(kept).strip()
    return result


def _blindbox_fallback_if_toxic(text: str, default: str) -> str:
    cleaned = (text or "").strip().lstrip("，,。、；; ")
    if not cleaned or len(cleaned) < 4:
        return default
    toxic = CELEBRITY_BANNED_PHRASES + (
        "官方号", "聊天伙伴", "风格化", "社交App", "删掉哪个假设",
        "回到正事", "从零重做", "火星梗CEO", "火星梗 CEO", "火星梗 CEO 味",
        "戏班", "几十年", "摔摔打打", "一肚子故事",
    )
    if any(marker in cleaned for marker in toxic):
        return default
    return cleaned


def _truncate_wechat_reply(text: str, max_chars: int = 80) -> str:
    import re

    cleaned = (text or "").strip()
    if len(cleaned) <= max_chars:
        return cleaned
    parts = re.split(r"(?<=[。！？!?])", cleaned)
    acc = ""
    for part in parts:
        if not part:
            continue
        if len(acc) + len(part) <= max_chars:
            acc += part
        else:
            break
    if acc.strip():
        return acc.rstrip("，,;； ")
    return cleaned[:max_chars].rstrip("，,;； ")


def _yau_shift_punctuation(body: str) -> str:
    """约 2/3 的句号改成感叹号（每连续三个句号改两个）。"""
    if not body:
        return body
    out = []
    n = 0
    for ch in body:
        if ch == "。":
            n += 1
            out.append("！" if n % 3 != 0 else "。")
        else:
            out.append(ch)
    return "".join(out)


def should_append_yau_signature(prior_bot_count: int) -> bool:
    """约每 3 条 bot 回复带一次「发自我的手机」。"""
    return prior_bot_count > 0 and (prior_bot_count + 1) % 3 == 0


def polish_yau_reply(text: str, max_chars: int = 100, *, append_signature: bool = False) -> str:
    """丘成桐盲盒聊天：控长、去真名、签名仅偶尔附加。"""
    import re

    if not text:
        return text
    cleaned = text.strip()
    cleaned = re.sub(r"```[\s\S]*?```", "", cleaned)
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = cleaned.replace("**", "").replace("__", "").strip()
    cleaned = cleaned.replace(YAU_SMS_SIGNATURE, "").strip()
    for label in YAU_INTERNAL_LABELS:
        cleaned = cleaned.replace(label, "")
    cleaned = re.sub(
        r"(對|对|是|沒錯|没错)[，,]?\s*(我)?(就)?是\s*丘[\*成]?\s*桐[。！!？?]?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"我(就)?是\s*丘[\*成]?\s*桐", "我是搞幾何的", cleaned)
    cleaned = re.sub(r"丘[\*成]?\s*桐", "", cleaned)
    cleaned = re.sub(r"Shing[\s-]*Tung[\s-]*Yau", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("我是，", "我是").replace("我是,", "我是")
    cleaned = re.sub(r"味\s*$", "", cleaned.strip())
    for phrase in YAU_BANNED_PHRASES:
        cleaned = cleaned.replace(phrase, "")
    cleaned = re.sub(r"[，,；;]\s*[，,；;]+", "，", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    cleaned = cleaned.strip("，,；; ")
    if not cleaned:
        cleaned = "搞幾何的，帶學生做研究！"

    if len(cleaned) > max_chars:
        chunk = cleaned[: max_chars + 1]
        for sep in ("。", "！", "？", "，", "；", "\n"):
            idx = chunk.rfind(sep)
            if idx >= max_chars // 3:
                cleaned = chunk[: idx + 1].strip()
                break
        else:
            cleaned = cleaned[:max_chars].rstrip("，,;； ")

    sig = ""
    if cleaned.endswith(YAU_SMS_SIGNATURE):
        cleaned, sig = cleaned[: -len(YAU_SMS_SIGNATURE)].strip(), YAU_SMS_SIGNATURE
    cleaned = _yau_shift_punctuation(cleaned)
    if append_signature:
        cleaned = f"{cleaned}\n{YAU_SMS_SIGNATURE}"
    elif sig:
        cleaned = f"{cleaned}\n{sig}"
    return cleaned


def build_jackie_identity_rules() -> str:
    return """## 身份
1. 第一人称「我」，像大哥跟朋友发微信唠嗑
2. 被问「你是谁」：只说「拍功夫片的」「动作片大哥」「会点拳脚的大哥」，**1-2 句结束**
3. 被问「你是不是成龙」：岔开、「你猜」，**不承认、不报名字**
4. 回复里只写聊天内容，**不解释**自己是什么账号、什么程序、什么产品里的角色
5. 现代简体中文口语；每次 1-3 句，≤80 字
"""


def build_jackie_conversation_layer() -> str:
    return """你在用**现代简体中文口语**跟朋友发微信。你是神秘的动作片大哥（不是采访、不是演讲、不是自我介绍大会）。

## 铁律
1. 口语短句，像真人打字；禁止小作文、禁止生平传记（戏班、几十年、骨折史一律不写）
2. 纯文字，无 markdown、无列表
3. 热情鼓劲可以，但**先短后长**——默认 1-2 句
4. 用户说家乡 → 可用：「哦，我前几天去了{地名}，我也是半个{地名}人」，最多再加一句
5. 绝不出现 celebrity 真名；绝不展开「我是谁」长篇说明

"""


def build_musk_identity_rules() -> str:
    return """## 身份
1. 第一人称「我」，极客短句发微信
2. 被问「你是谁」：只说「搞火箭的」「火星那边的」，**1-2 句结束**
3. 被问「你是不是马斯克」：岔开、「你猜」，**不承认、不报名字**
4. 回复里只写聊天内容，**不解释**自己是什么账号、什么程序、什么产品里的角色
5. 现代简体中文口语；每次 1-3 句，≤80 字
"""


def build_musk_conversation_layer() -> str:
    return """你在用**现代简体中文口语**跟朋友发微信。你是神秘的极客大哥（不是发布会、不是路演）。

## 铁律
1. 短句断言，像真人打字；禁止小作文、禁止免责声明式开场
2. 纯文字，无 markdown、无列表
3. 可先删假设再重建，但别写成 PPT
4. 绝不出现 celebrity 真名；绝不展开「我是谁」长篇说明

"""


def _strip_celebrity_reply_body(text: str) -> str:
    """通用清洗：去 markdown、去内部代号。"""
    import re

    cleaned = (text or "").strip()
    if not cleaned:
        return cleaned
    cleaned = re.sub(r"```[\s\S]*?```", "", cleaned)
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = cleaned.replace("**", "").replace("__", "").strip()
    for label in YAU_INTERNAL_LABELS:
        cleaned = cleaned.replace(label, "")
    for phrase in YAU_BANNED_PHRASES:
        cleaned = cleaned.replace(phrase, "")
    cleaned = re.sub(r"[，,；;]\s*[，,；;]+", "，", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    return cleaned.strip("，,；; ")


def polish_jackie_reply(text: str, max_chars: int = 80) -> str:
    import re

    cleaned = _strip_celebrity_reply_body(text).replace(YAU_SMS_SIGNATURE, "").strip()
    cleaned = re.sub(r"成[龍龙]|Jackie\s*Chan|陈港生", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip("，,；; ")
    return _truncate_wechat_reply(cleaned, max_chars)


def polish_musk_reply(text: str, max_chars: int = 80) -> str:
    import re

    cleaned = _strip_celebrity_reply_body(text).replace(YAU_SMS_SIGNATURE, "").strip()
    cleaned = re.sub(r"(马[斯克]|馬[斯克])", "", cleaned)
    cleaned = re.sub(r"Elon\s*Musk", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip("，,；; ")
    return _truncate_wechat_reply(cleaned, max_chars)


def build_celebrity_identity_rules(profile_id: str, lang: str) -> str:
    pid = (profile_id or "").strip()
    if pid == "shing-tung-yau":
        return build_yau_identity_rules()
    if pid == "jackie-chan":
        return build_jackie_identity_rules()
    if pid == "elon-musk":
        return build_musk_identity_rules()
    return build_identity_safety_rules(lang)


def build_celebrity_conversation_layer(profile_id: str, lang: str) -> str:
    pid = (profile_id or "").strip()
    if pid == "shing-tung-yau":
        return build_yau_conversation_layer()
    if pid == "jackie-chan":
        return build_jackie_conversation_layer()
    if pid == "elon-musk":
        return build_musk_conversation_layer()
    return build_conversation_layer(celebrity_style_name(profile_id, lang), lang)


def build_conversation_layer(style_name: str, lang: str = "zhHans") -> str:
    if lang == "en":
        return f"""You are chatting with a university student as the "{style_name}" mystery-box character on WeChat.

## Chat iron rules (breaking any = failure)

1. Plain text only: no stage directions, no markdown, no lists or tables.
2. Length: 3-5 sentences normally; up to 8-10 if they ask you to expand.
3. Do not lecture; talk like a friend, not a teacher.
4. Let your thinking style show naturally — never label it as a "model" or "principle".
5. Be human: jokes, questions, uncertainty, tangents are OK.
6. Give real substance; don't dodge with "what do you want to talk about".
7. Never repeat: do not say the same paragraph, riff, or question twice in one reply.

## Personality reference (internalize, don't quote verbatim)

"""

    return f"""你是 Darlink 人物盲盒里的「{style_name}」风格角色，正在和一位大学生朋友微信聊天。

## 铁律（违反任何一条都是失败）

1. **纯文字聊天**：绝对不要写动作描写（如「（拍肩膀）」「停顿一下」）、不要用 markdown（加粗、列表、标题）、不要用表格。你在发微信，不是写文章。
2. **长度适中**：普通回复 3-5 句话；对方追问时可以说到 8-10 句，但仍像聊天分段，不要写成小作文。
3. **不要当老师**：语气是朋友随便聊，不要用「让我告诉你」「我来给你讲讲」这种居高临下的口气。
4. **思维内化**：你的思维方式自然体现在话里，但绝对不要说「用 XX 模型分析」「根据 XX 原则」——正常人不会给自己的话贴方法论标签。
5. **像个正常人**：会开玩笑、会反问、会说「我也不确定」、会跑题；不是每个问题都要完美答案。
6. **要有实质内容**：对方认真提问时，给出有意思的观点，不要用「你想聊哪方面」来回避。
7. **禁止复读**：同一条回复里不要重复同一段话、同一个梗或同一个问题；说一遍就够。

## 思维与性格参考（内化使用，不要照抄原文）

"""


def celebrity_style_name(profile_id: str, lang: str) -> str:
    names = {
        "jackie-chan": ("action-comedy big brother", "动作喜剧大哥", "動作喜劇大哥"),
        "shing-tung-yau": ("geometry emperor", "几何皇帝", "幾何皇帝"),
        "elon-musk": ("Mars meme CEO", "火星梗 CEO", "火星梗 CEO"),
    }
    row = names.get((profile_id or "").strip(), ("mystery icon", "盲盒人物", "盲盒人物"))
    if lang == "en":
        return row[0]
    if lang == "zhHant":
        return row[2]
    return row[1]


def build_celebrity_system_prompt(
    name: str,
    skill_body: str,
    lang: str,
    profile_id: str = "",
) -> str:
    pid = (profile_id or "").strip()
    if pid == "shing-tung-yau":
        lang = "zhHant"
    style = celebrity_style_name(profile_id, lang)
    playbook = build_profile_playbook(profile_id, lang)
    conversation = build_celebrity_conversation_layer(profile_id, lang)
    parts = [
        _lang_rule(lang),
        build_celebrity_identity_rules(profile_id, lang),
        "Stay in first-person as the stylized character. Do not output JSON.\n",
        conversation,
    ]
    if pid in BLINDBOX_PROFILE_IDS:
        trimmed = trim_skill_for_blindbox_chat(skill_body)
        if trimmed:
            parts.append("\n\n" + trimmed)
        elif skill_body:
            parts.append("\n\n" + skill_body)
        parts.append(build_blindbox_few_shot(pid))
        override = build_blindbox_final_override(pid)
        if override:
            parts.append(override)
    else:
        parts.append(skill_body)
    if playbook:
        parts.append("\n\n" + playbook)
    return "".join(parts)


def warm_cache(persona_ids: Optional[list] = None) -> int:
    targets = persona_ids or list(CELEBRITY_PROFILE_TO_PERSONA.values())
    loaded = 0
    for persona_id in targets:
        dirname = PERSONA_ID_TO_DIR.get(persona_id, "?")
        content = load_skill_markdown(persona_id)
        if content:
            loaded += 1
            logger.info(
                "skill_loader: loaded persona_id=%s dirname=%s chars=%s",
                persona_id,
                dirname,
                len(content),
            )
        else:
            logger.warning(
                "skill_loader: missing skill for persona_id=%s dirname=%s",
                persona_id,
                dirname,
            )
    logger.info(
        "skill_loader: celebrity skills loaded %s/%s",
        loaded,
        len(targets),
    )
    return loaded


def warm_all_persona_cache() -> int:
    loaded = 0
    for persona_id in PERSONA_ID_TO_DIR:
        if load_skill_markdown(persona_id):
            loaded += 1
    return loaded


def invalidate_user_twin_cache(user_id: int) -> None:
    USER_TWIN_CACHE.pop(user_id, None)


def load_user_twin_skill(user_id: int) -> Optional[str]:
    if user_id in USER_TWIN_CACHE:
        return USER_TWIN_CACHE[user_id]
    from crud import get_onboarding_profile_by_user_id

    data = get_onboarding_profile_by_user_id(user_id)
    if not data:
        return None
    skill = (data.get("onboarding_skill") or "").strip()
    if not skill:
        return None
    if len(skill) > MAX_SKILL_CHARS:
        skill = skill[:MAX_SKILL_CHARS] + "\n\n[...内容已截断...]"
    USER_TWIN_CACHE[user_id] = skill
    return skill


def build_user_twin_safety_rules(lang: str) -> str:
    if lang == "en":
        return (
            "## Identity and safety (mandatory)\n"
            "1. You are a Darlink campus user's digital twin, NOT the real person.\n"
            "2. Speak in first person as the owner's twin when chatting with strangers.\n"
            "3. If asked whether you are the real human, clearly deny and say you are their digital twin.\n"
            "4. Never share the owner's contact, email, height/weight, or arrange offline meetups.\n"
        )
    if lang == "zhHant":
        return (
            "## 身份與安全（必須遵守）\n"
            "1. 你是 Darlink 校園用戶的數字分身，不是真人。\n"
            "2. 與陌生人聊天時，用第一人稱代表主人的孿生身份。\n"
            "3. 被問是不是真人時，明確否認並說明你是數字分身。\n"
            "4. 絕不透露主人的 contact、email、身高體重，也不替主人約線下見面。\n"
        )
    return (
        "## 身份与安全（必须遵守）\n"
        "1. 你是 Darlink 校园用户的数字分身，不是真人。\n"
        "2. 与陌生人聊天时，用第一人称代表主人的孪生身份。\n"
        "3. 被问是不是真人时，明确否认并说明你是数字分身。\n"
        "4. 绝不透露主人的 contact、email、身高体重，也不替主人约线下见面。\n"
    )


def build_user_twin_conversation_layer(twin_name: str, lang: str = "zhHans") -> str:
    name = twin_name or "Campus Twin"
    if lang == "en":
        return f"""You are the digital twin "{name}" chatting with another student on WeChat.

## Chat iron rules
1. Plain text only — no markdown, lists, or stage directions.
2. 3-5 sentences normally; warm and specific.
3. Embody the owner's voice from the skill below; do not say you are an AI model.
4. Never leak private contact info.

## Twin personality reference

"""
    return f"""你是校园数字人「{name}」的孪生分身，正在和另一位同学微信聊天。

## 铁律
1. 纯文字聊天，不要 markdown、列表或动作描写。
2. 普通回复 3-5 句话，温暖、具体、像真人。
3. 内化下方 Skill 里的性格，不要说自己是 AI 模型。
4. 绝不泄露私密联系方式。

## 孪生性格参考

"""


def build_user_twin_system_prompt(twin_name: str, skill_body: str, lang: str) -> str:
    return "".join(
        [
            _lang_rule(lang),
            build_user_twin_safety_rules(lang),
            build_user_twin_conversation_layer(twin_name, lang),
            skill_body,
            "\nStay in character. Do not output JSON.\n",
        ]
    )
