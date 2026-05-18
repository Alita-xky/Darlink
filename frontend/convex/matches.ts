import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listForUser = query({
  args: {
    userId: v.id("users"),
    scene: v.union(
      v.literal("study"),
      v.literal("food"),
      v.literal("romance"),
    ),
  },
  handler: async (ctx, { userId, scene }) => {
    const asA = await ctx.db
      .query("matches")
      .withIndex("by_userA_scene", (q) =>
        q.eq("userIdA", userId).eq("scene", scene),
      )
      .collect();
    const asB = await ctx.db
      .query("matches")
      .withIndex("by_userB_scene", (q) =>
        q.eq("userIdB", userId).eq("scene", scene),
      )
      .collect();

    const all = [...asA, ...asB].sort((a, b) => b.fitScore - a.fitScore);

    return await Promise.all(
      all.map(async (m) => {
        const otherId = m.userIdA === userId ? m.userIdB : m.userIdA;
        const other = await ctx.db.get(otherId);
        const otherDH = await ctx.db
          .query("digitalHumans")
          .withIndex("by_user", (q) => q.eq("userId", otherId))
          .unique();
        return {
          match: m,
          other,
          otherCardText: otherDH?.cardText ?? "",
        };
      }),
    );
  },
});

export const getDetail = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) return null;
    const a = await ctx.db.get(match.userIdA);
    const b = await ctx.db.get(match.userIdB);
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .unique();
    return { match, userA: a, userB: b, chatId: chat?._id ?? null };
  },
});

export const respond = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
    decision: v.union(v.literal("interested"), v.literal("passed")),
  },
  handler: async (ctx, { matchId, userId, decision }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("匹配不存在");

    if (match.userIdA === userId) {
      await ctx.db.patch(matchId, { aStatus: decision });
    } else if (match.userIdB === userId) {
      await ctx.db.patch(matchId, { bStatus: decision });
    } else {
      throw new Error("无权操作此匹配");
    }

    const updated = await ctx.db.get(matchId);
    if (
      updated &&
      updated.aStatus === "interested" &&
      updated.bStatus === "interested"
    ) {
      const existingChat = await ctx.db
        .query("chats")
        .withIndex("by_match", (q) => q.eq("matchId", matchId))
        .unique();
      if (existingChat) {
        return { match: updated, chatId: existingChat._id };
      }
      const chatId = await ctx.db.insert("chats", {
        matchId,
        participantIds: [updated.userIdA, updated.userIdB],
        lastMessageAt: Date.now(),
      });
      return { match: updated, chatId };
    }

    return { match: updated, chatId: null };
  },
});
