import re
from typing import Any, Dict

_SCHOOL_RULES = [
    (re.compile(r"^(北京大学|北大|pku|peking\s*university)$", re.I), "北京大学"),
    (re.compile(r"^(清华大学|清华|thu|tsinghua(\s*university)?)$", re.I), "清华大学"),
    (re.compile(r"^(复旦大学|复旦|fudan(\s*university)?)$", re.I), "复旦大学"),
    (re.compile(r"^(上海交通大学|上海交大|交大|sjtu)$", re.I), "上海交通大学"),
    (re.compile(r"^(浙江大学|浙大|zju)$", re.I), "浙江大学"),
    (re.compile(r"^(南京大学|南大|nju)$", re.I), "南京大学"),
    (re.compile(r"^(中国人民大学|人大|ruc)$", re.I), "中国人民大学"),
    (re.compile(r"^(武汉大学|武大|whu)$", re.I), "武汉大学"),
    (re.compile(r"^(中山大学|中大|sysu)$", re.I), "中山大学"),
    (re.compile(r"^(香港大学|港大|hku)$", re.I), "香港大学"),
    (re.compile(r"^(香港中文大学|中大|cuhk)$", re.I), "香港中文大学"),
    (re.compile(r"^(香港科技大学|科大|hkust)$", re.I), "香港科技大学"),
]


def clean_text(value: Any) -> str:
    text = str(value or "")
    text = text.replace("\u3000", " ").replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_school(value: Any) -> str:
    text = clean_text(value)
    if not text:
        return text
    compact = re.sub(r"\s+", "", text)
    for pattern, canonical in _SCHOOL_RULES:
        if pattern.match(text) or pattern.match(compact):
            return canonical
    if re.fullmatch(r"北大", compact):
        return "北京大学"
    if re.fullmatch(r"清华", compact):
        return "清华大学"
    if re.fullmatch(r"复旦", compact):
        return "复旦大学"
    return text


def normalize_nickname(value: Any) -> str:
    text = clean_text(value)
    return re.sub(r"\s{2,}", " ", text)


def normalize_email(value: Any) -> str:
    return clean_text(value).lower()


def normalize_questionnaire_field(field: str, value: Any) -> str:
    if field == "school":
        return normalize_school(value)
    if field == "nickname":
        return normalize_nickname(value)
    if field == "email":
        return normalize_email(value)
    return clean_text(value)


def normalize_questionnaire(payload: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(payload or {})
    for key, value in list(result.items()):
        if isinstance(value, str):
            result[key] = normalize_questionnaire_field(key, value)
    return result
