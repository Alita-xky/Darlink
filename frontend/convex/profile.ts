import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const modeUnion = v.union(
  v.literal("study"),
  v.literal("friend"),
  v.literal("romance"),
);

// ─── Old API (kept for backward compat until Task 24 cutover) ───────────────

export const upsertQuestionnaire = mutation({
  args: {
    userId: v.id("users"),
    socialGoal: v.array(v.string()),
    socialEnergy: v.union(
      v.literal("introvert"),
      v.literal("ambivert"),
      v.literal("extrovert"),
    ),
    communicationStyle: v.union(
      v.literal("concise"),
      v.literal("warm"),
      v.literal("playful"),
      v.literal("thoughtful"),
    ),
    interests: v.array(v.string()),
    availability: v.array(v.string()),
    boundaries: v.array(v.string()),
    relationshipPace: v.union(
      v.literal("slow"),
      v.literal("medium"),
      v.literal("fast"),
    ),
    preferredScenes: v.array(v.string()),
    dislikeTopics: v.array(v.string()),
    values: v.array(v.string()),
    raw: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, raw, ...rest } = args;
    const existing = await ctx.db
      .query("studentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const payload = {
      userId,
      ...rest,
      questionnaireAnswers: raw,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("studentProfiles", payload);
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("studentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const saveDigitalHuman = mutation({
  args: {
    userId: v.id("users"),
    cardText: v.string(),
    skillMd: v.string(),
    mentalModels: v.array(v.string()),
    decisionHeuristics: v.array(v.string()),
    expressionPatterns: v.array(v.string()),
    publicFields: v.array(v.string()),
    privateFields: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    // Old API targets the friend-mode row (or v1 row with no mode set).
    const existing =
      (await ctx.db
        .query("digitalHumans")
        .withIndex("by_user_mode", (q) => q.eq("userId", userId).eq("mode", "friend"))
        .first()) ??
      (await ctx.db
        .query("digitalHumans")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first());
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...rest,
        version: (existing.version ?? 0) + 1,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("digitalHumans", {
      userId,
      ...rest,
      version: 1,
      updatedAt: Date.now(),
      mode: "friend",
      systemPrompt: rest.cardText,
      pixelFeatures: null,
      darwinScore: 0,
      darwinIterations: 0,
      createdAt: Date.now(),
    });
  },
});

export const resetDigitalHuman = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("digitalHumans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  },
});

// ─── New mode-aware API (Phase 2+) ──────────────────────────────────────────

export const getDigitalHuman = query({
  args: {
    userId: v.id("users"),
    mode: v.optional(modeUnion),
  },
  handler: async (ctx, { userId, mode }) => {
    const m = mode ?? "friend";
    return await ctx.db
      .query("digitalHumans")
      .withIndex("by_user_mode", (q) => q.eq("userId", userId).eq("mode", m))
      .first();
  },
});

export const upsertModeQuestionnaire = mutation({
  args: {
    userId: v.id("users"),
    mode: modeUnion,
    background: v.any(),
    needs: v.any(),
    matching: v.any(),
    raw: v.any(),
  },
  handler: async (ctx, { userId, mode, background, needs, matching, raw }) => {
    const existing = await ctx.db
      .query("questionnaires")
      .withIndex("by_user_mode", (q) => q.eq("userId", userId).eq("mode", mode))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { background, needs, matching, raw });
      return existing._id;
    }
    return await ctx.db.insert("questionnaires", {
      userId,
      mode,
      background,
      needs,
      matching,
      raw,
      createdAt: Date.now(),
    });
  },
});

export const getQuestionnaireByMode = internalQuery({
  args: { userId: v.id("users"), mode: modeUnion },
  handler: async (ctx, { userId, mode }) => {
    return await ctx.db
      .query("questionnaires")
      .withIndex("by_user_mode", (q) => q.eq("userId", userId).eq("mode", mode))
      .first();
  },
});

export const getDigitalHumanByMode = internalQuery({
  args: { userId: v.id("users"), mode: modeUnion },
  handler: async (ctx, { userId, mode }) => {
    return await ctx.db
      .query("digitalHumans")
      .withIndex("by_user_mode", (q) => q.eq("userId", userId).eq("mode", mode))
      .first();
  },
});

export const getUserById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const insertDigitalHuman = internalMutation({
  args: {
    userId: v.id("users"),
    mode: modeUnion,
    cardText: v.string(),
    mentalModels: v.array(v.string()),
    decisionHeuristics: v.array(v.string()),
    expressionPatterns: v.array(v.string()),
    systemPrompt: v.string(),
    pixelFeatures: v.any(),
    darwinScore: v.number(),
    darwinIterations: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("digitalHumans", {
      ...args,
      // Fill required-by-old-schema fields with sensible defaults so legacy
      // queries don't crash. These will be ignored by v2 reads.
      skillMd: "",
      publicFields: [],
      privateFields: [],
      version: 1,
      updatedAt: now,
      createdAt: now,
    });
  },
});

export const replaceDigitalHuman = internalMutation({
  args: {
    id: v.id("digitalHumans"),
    data: v.object({
      cardText: v.string(),
      mentalModels: v.array(v.string()),
      decisionHeuristics: v.array(v.string()),
      expressionPatterns: v.array(v.string()),
      systemPrompt: v.string(),
      pixelFeatures: v.any(),
      darwinScore: v.number(),
      darwinIterations: v.number(),
    }),
  },
  handler: async (ctx, { id, data }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error(`digitalHuman ${id} not found`);
    await ctx.db.patch(id, {
      ...data,
      version: (existing.version ?? 0) + 1,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const getModeStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const qs = await ctx.db
      .query("questionnaires")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const dhs = await ctx.db
      .query("digitalHumans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const status: Record<"study" | "friend" | "romance", { questionnaire: boolean; digitalHuman: boolean }> = {
      study: { questionnaire: false, digitalHuman: false },
      friend: { questionnaire: false, digitalHuman: false },
      romance: { questionnaire: false, digitalHuman: false },
    };
    for (const q of qs) {
      if (q.mode in status) status[q.mode as keyof typeof status].questionnaire = true;
    }
    for (const d of dhs) {
      const m = d.mode;
      if (m && m in status) status[m as keyof typeof status].digitalHuman = true;
    }
    return status;
  },
});

export const updateDarwinProgress = internalMutation({
  args: { id: v.id("digitalHumans"), iteration: v.number() },
  handler: async (ctx, { id, iteration }) => {
    await ctx.db.patch(id, { darwinIterations: iteration });
  },
});
