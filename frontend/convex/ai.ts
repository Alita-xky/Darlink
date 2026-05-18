"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const suggestIcebreaker = action({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }): Promise<string> => {
    const detail = await ctx.runQuery(api.matches.getDetail, { matchId });
    if (!detail) throw new Error("匹配不存在");

    const { match } = detail;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const pool = match.icebreakers;
      return pool[Math.floor(Math.random() * pool.length)] ?? "你好，很高兴认识你！";
    }

    const sceneLabel =
      match.scene === "study" ? "学习搭子" : match.scene === "food" ? "饭搭子" : "恋爱潜力";

    const prompt = `你是一个大学社交破冰专家。根据以下匹配信息，生成一句自然、真诚的破冰开场白。

要求：
- 不超过35字
- 第一人称中文
- 有具体细节，不要套话
- 不要加引号，直接输出那句话

匹配场景：${sceneLabel}
共同话题：${match.sharedTopics.join("、") || "无"}
AI洞察：${match.explanation}
已有破冰语（不要重复）：${match.icebreakers.join(" / ")}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.95,
        max_tokens: 80,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? "很高兴认识你，希望我们能成为好朋友！";
  },
});

export const suggestChatMessage = action({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
  },
  handler: async (ctx, { chatId, senderId }): Promise<string> => {
    const msgs = await ctx.runQuery(api.chats.messages, { chatId });
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallbacks = [
        "你最近在忙什么呢？😊",
        "对了，你有什么推荐的自习地方吗？",
        "我们找个时间一起出来聊聊吧～",
        "你平时喜欢怎么放松？",
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    const recent = msgs.slice(-12);
    const history = recent.map((m) => ({
      role: m.senderId === senderId ? ("user" as const) : ("assistant" as const),
      content: m.body,
    }));

    const system =
      "你是一个帮助大学生社交的AI助手。根据聊天记录，帮用户想一句自然的下一句话。要求：不超过40字，中文，语气真诚自然，符合上下文语境。只输出那句话，不要解释。";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: "帮我想下一句合适的话" },
        ],
        temperature: 0.9,
        max_tokens: 80,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? "你最近在忙什么呢？😊";
  },
});
