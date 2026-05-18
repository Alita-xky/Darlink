import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    nickname: v.string(),
    avatarUrl: v.optional(v.string()),
    school: v.string(),
    major: v.optional(v.string()),
    grade: v.optional(v.string()),
    verifiedStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
    ),
    verifiedVia: v.optional(
      v.union(v.literal("email"), v.literal("studentId"), v.literal("invite")),
    ),
    createdAt: v.number(),
    // new for v2
    selfPersonality: v.optional(v.string()),
    vibePalette: v.optional(v.union(
      v.literal("cream"),
      v.literal("matcha"),
      v.literal("peach"),
      v.literal("lavender"),
    )),
    vibeKeywords: v.optional(v.array(v.string())),
    aiTwinDisabled: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_school", ["school"]),

  questionnaires: defineTable({
    userId: v.id("users"),
    mode: v.union(
      v.literal("study"),
      v.literal("friend"),
      v.literal("romance"),
    ),
    background: v.any(),
    needs: v.any(),
    matching: v.any(),
    raw: v.any(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_mode", ["userId", "mode"]),

  studentProfiles: defineTable({
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
    questionnaireAnswers: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  digitalHumans: defineTable({
    userId: v.id("users"),
    cardText: v.string(),
    skillMd: v.string(),
    mentalModels: v.array(v.string()),
    decisionHeuristics: v.array(v.string()),
    expressionPatterns: v.array(v.string()),
    publicFields: v.array(v.string()),
    privateFields: v.array(v.string()),
    version: v.number(),
    updatedAt: v.number(),
    // new for v2
    mode: v.optional(v.union(
      v.literal("study"),
      v.literal("friend"),
      v.literal("romance"),
    )),
    systemPrompt: v.optional(v.string()),
    pixelFeatures: v.optional(v.any()),
    darwinScore: v.optional(v.number()),
    darwinIterations: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_mode", ["userId", "mode"]),

  matches: defineTable({
    userIdA: v.id("users"),
    userIdB: v.id("users"),
    scene: v.union(
      v.literal("study"),
      v.literal("food"),
      v.literal("romance"),
    ),
    fitScore: v.number(),
    breakdown: v.any(),
    sharedTopics: v.array(v.string()),
    complementarities: v.array(v.string()),
    risks: v.array(v.string()),
    icebreakers: v.array(v.string()),
    explanation: v.string(),
    aStatus: v.union(
      v.literal("new"),
      v.literal("interested"),
      v.literal("passed"),
    ),
    bStatus: v.union(
      v.literal("new"),
      v.literal("interested"),
      v.literal("passed"),
    ),
    createdAt: v.number(),
  })
    .index("by_userA_scene", ["userIdA", "scene"])
    .index("by_userB_scene", ["userIdB", "scene"]),

  chats: defineTable({
    matchId: v.id("matches"),
    participantIds: v.array(v.id("users")),
    lastMessageAt: v.number(),
  }).index("by_match", ["matchId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    senderId: v.id("users"),
    body: v.string(),
    aiAssisted: v.boolean(),
    riskFlag: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    createdAt: v.number(),
  }).index("by_chat", ["chatId"]),

  feedback: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("match"), v.literal("chat")),
    targetId: v.string(),
    rating: v.union(
      v.literal("accurate"),
      v.literal("clicked"),
      v.literal("mismatch"),
      v.literal("uncomfortable"),
      v.literal("pace_off"),
    ),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  blocks: defineTable({
    userId: v.id("users"),
    blockedUserId: v.id("users"),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  aiPreviewQuota: defineTable({
    userId: v.id("users"),
    // YYYY-MM-DD, e.g., '2026-05-05'
    day: v.string(),
    count: v.number(),
  }).index("by_user_day", ["userId", "day"]),
});
