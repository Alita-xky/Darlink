import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db.query("chats").collect();
    const mine = all.filter((c) => c.participantIds.includes(userId));
    mine.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return await Promise.all(
      mine.map(async (chat) => {
        const otherId = chat.participantIds.find((p) => p !== userId);
        const other = otherId ? await ctx.db.get(otherId) : null;
        const lastMsg = await ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .order("desc")
          .first();
        return { chat, other, lastMessage: lastMsg };
      }),
    );
  },
});

export const messages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, { chatId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();
  },
});

const RISKY_PATTERNS = [
  /(微信|wechat|weixin)\s*[:：]?\s*[\w-]+/i,
  /\b1[3-9]\d{9}\b/,
  /宿舍|寝室\s*\d+/,
  /(我是.{0,6}导师|奖学金审核|入围名单)/,
];

function classifyRisk(body: string): "low" | "medium" | "high" | undefined {
  for (const p of RISKY_PATTERNS) if (p.test(body)) return "medium";
  if (/(滚|傻逼|草你|fuck|去死)/i.test(body)) return "high";
  return undefined;
}

export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
    body: v.string(),
    aiAssisted: v.boolean(),
  },
  handler: async (ctx, { chatId, senderId, body, aiAssisted }) => {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("消息不能为空");

    const chat = await ctx.db.get(chatId);
    if (!chat) throw new Error("会话不存在");
    if (!chat.participantIds.includes(senderId)) {
      throw new Error("无权在此会话发言");
    }

    const risk = classifyRisk(trimmed);
    if (risk === "high") {
      throw new Error("这句话被安全模型拦截,请改写后再试");
    }

    const id = await ctx.db.insert("messages", {
      chatId,
      senderId,
      body: trimmed,
      aiAssisted,
      riskFlag: risk,
      createdAt: Date.now(),
    });

    await ctx.db.patch(chatId, { lastMessageAt: Date.now() });
    return id;
  },
});

const DAILY_LIMIT = 20;

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export const checkAndIncrementQuota = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const day = todayKey();
    const existing = await ctx.db
      .query("aiPreviewQuota")
      .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("day", day))
      .first();

    const current = existing?.count ?? 0;
    if (current >= DAILY_LIMIT) {
      return { ok: false, count: current, limit: DAILY_LIMIT };
    }

    if (existing) {
      await ctx.db.patch(existing._id, { count: current + 1 });
    } else {
      await ctx.db.insert("aiPreviewQuota", {
        userId,
        day,
        count: 1,
      });
    }
    return { ok: true, count: current + 1, limit: DAILY_LIMIT };
  },
});
