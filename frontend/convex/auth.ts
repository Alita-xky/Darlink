import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const APPROVED_DOMAINS = [
  "edu",
  "edu.cn",
  "edu.hk",
  "edu.mo",
  "edu.tw",
  "ac.cn",
  "ac.hk",
];

function isStudentEmail(email: string) {
  const lower = email.toLowerCase().trim();
  return APPROVED_DOMAINS.some((d) => lower.endsWith(`.${d}`));
}

export const signInOrCreate = mutation({
  args: {
    email: v.string(),
    nickname: v.string(),
    school: v.string(),
  },
  handler: async (ctx, { email, nickname, school }) => {
    const lower = email.toLowerCase().trim();
    if (!lower.includes("@")) throw new Error("邮箱格式不正确");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", lower))
      .unique();

    if (existing) return existing._id;

    const verified = isStudentEmail(lower);
    return await ctx.db.insert("users", {
      email: lower,
      nickname,
      school,
      verifiedStatus: verified ? "verified" : "pending",
      verifiedVia: verified ? "email" : undefined,
      createdAt: Date.now(),
    });
  },
});

export const me = query({
  // Accept any string so a stale ID in client localStorage from a wiped DB
  // doesn't crash with ArgumentValidationError. Internally we cast and
  // catch invalid-table errors → return null. The client treats null as
  // "auth no longer valid" and clears storage.
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    try {
      return await ctx.db.get(userId as Id<"users">);
    } catch {
      return null;
    }
  },
});

export const updateBasic = mutation({
  args: {
    userId: v.id("users"),
    nickname: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    major: v.optional(v.string()),
    grade: v.optional(v.string()),
    selfPersonality: v.optional(v.string()),
    aiTwinDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...patch } = args;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) cleaned[k] = v;
    }
    await ctx.db.patch(userId, cleaned);
  },
});

export const updateVibe = mutation({
  args: {
    userId: v.id("users"),
    vibePalette: v.union(
      v.literal("cream"),
      v.literal("matcha"),
      v.literal("peach"),
      v.literal("lavender"),
    ),
    vibeKeywords: v.array(v.string()),
  },
  handler: async (ctx, { userId, vibePalette, vibeKeywords }) => {
    await ctx.db.patch(userId, { vibePalette, vibeKeywords });
  },
});
