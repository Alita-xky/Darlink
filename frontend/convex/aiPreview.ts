"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const modeUnion = v.union(
  v.literal("study"),
  v.literal("friend"),
  v.literal("romance"),
);

export const aiPreview = action({
  args: {
    callerId: v.id("users"),
    targetUserId: v.id("users"),
    mode: modeUnion,
    message: v.string(),
  },
  handler: async (
    ctx,
    { callerId, targetUserId, mode, message },
  ): Promise<{ reply: string; quotaUsed: number; quotaLimit: number }> => {
    if (!message.trim()) throw new Error("消息不能为空");

    // 1. Check target user not opted out
    const target = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any).profile.getUserById,
      { id: targetUserId },
    );
    if (!target) throw new Error("对方账号不存在");
    if (target.aiTwinDisabled) throw new Error("对方暂停了 AI 分身");

    // 2. Get target's digital human for the mode
    const dh = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any).profile.getDigitalHumanByMode,
      { userId: targetUserId, mode },
    );
    if (!dh || !dh.systemPrompt) {
      throw new Error("对方还没有该模式的数字人，先去填问卷吧");
    }

    // 3. Quota check + increment
    const quota = await ctx.runMutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any).chats.checkAndIncrementQuota,
      { userId: callerId },
    );
    if (!quota.ok) {
      throw new Error(`今日 AI 分身预览额度已用完 (${quota.limit}/天)`);
    }

    // 4. LLM call
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        reply: "[未配置 OPENAI_API_KEY，无法生成 AI 回复]",
        quotaUsed: quota.count,
        quotaLimit: quota.limit,
      };
    }

    const reply = await callTwinLLM(apiKey, dh.systemPrompt, message);
    return {
      reply: reply ?? "[AI 暂时没有回复]",
      quotaUsed: quota.count,
      quotaLimit: quota.limit,
    };
  },
});

async function callTwinLLM(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是滴搭(Darlink)平台上一个用户的 AI 数字人。下面是这个人的 system prompt（你的人格描述）。请严格按这个人设回复用户消息，2-4 句中文，自然口语化，不要主动透露这是 AI、不要给免责声明。\n\n${systemPrompt}`,
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.85,
      max_tokens: 200,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}
