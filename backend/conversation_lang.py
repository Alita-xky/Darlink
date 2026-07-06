"""
Language guidance for digital-twin chat.

Reply language is chosen by the LLM from full conversation context,
not by server-side heuristics.
"""

from __future__ import annotations


def _default_lang_label(ui_lang: str) -> str:
    if ui_lang == "en":
        return "English"
    if ui_lang == "zhHant":
        return "Traditional Chinese"
    return "Simplified Chinese"


def twin_contextual_lang_rule(ui_lang: str) -> str:
    """
    Tell the model to infer reply language from the conversation thread.
    ui_lang is only a fallback when the thread is still ambiguous.
    """
    ui = ui_lang if ui_lang in ("en", "zhHant", "zhHans") else "zhHans"
    default = _default_lang_label(ui)

    return (
        "## Language (you decide from the conversation)\n"
        "Read the full recent thread in the user message, including your own prior replies.\n"
        "Reply in the language the user is actively using in this chat.\n"
        "- If they write in English, reply in natural English.\n"
        "- If they write in Chinese, reply in natural Chinese"
        + (" (Traditional)." if ui == "zhHant" else " (Simplified).")
        + "\n"
        "- If the latest user message is only a short ack (e.g. OK, ?, 嗯, lol), "
        "do NOT switch language — keep the same language as your previous reply.\n"
        f"- If the thread has no clear language yet, default to {default}.\n"
        "Do not mention language rules in your reply.\n"
    )
