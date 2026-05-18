import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("studentProfiles").collect();
  },
});

export const getMatchedUserIds = query({
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
    return [
      ...asA.map((m) => m.userIdB),
      ...asB.map((m) => m.userIdA),
    ];
  },
});

export const createMatch = mutation({
  args: {
    userIdA: v.id("users"),
    userIdB: v.id("users"),
    scene: v.union(
      v.literal("study"),
      v.literal("food"),
      v.literal("romance"),
    ),
    fitScore: v.number(),
    explanation: v.string(),
    sharedTopics: v.array(v.string()),
    complementarities: v.array(v.string()),
    risks: v.array(v.string()),
    icebreakers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("matches", {
      ...args,
      breakdown: {},
      aStatus: "new",
      bStatus: "new",
      createdAt: Date.now(),
    });
  },
});
