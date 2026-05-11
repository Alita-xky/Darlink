import { query } from "./_generated/server";
import { v } from "convex/values";

export const getFeed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const scenes = ["study", "food", "romance"] as const;

    // Get all matches for this user across all scenes
    const asA = (
      await Promise.all(
        scenes.map((s) =>
          ctx.db
            .query("matches")
            .withIndex("by_userA_scene", (q) =>
              q.eq("userIdA", userId).eq("scene", s),
            )
            .collect(),
        ),
      )
    ).flat();

    const asB = (
      await Promise.all(
        scenes.map((s) =>
          ctx.db
            .query("matches")
            .withIndex("by_userB_scene", (q) =>
              q.eq("userIdB", userId).eq("scene", s),
            )
            .collect(),
        ),
      )
    ).flat();

    const allMatches = [...asA, ...asB]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);

    // Build match feed items
    const matchItems = await Promise.all(
      allMatches.map(async (match) => {
        const otherId =
          match.userIdA === userId ? match.userIdB : match.userIdA;
        const otherUser = await ctx.db.get(otherId);
        const isMutual =
          match.aStatus === "interested" && match.bStatus === "interested";
        return {
          type: "match" as const,
          timestamp: match.createdAt,
          match,
          otherUser,
          isMutual,
        };
      }),
    );

    // Get recent messages across all chats
    const allChats = await ctx.db.query("chats").collect();
    const myChats = allChats.filter((c) => c.participantIds.includes(userId));

    const messageItems = await Promise.all(
      myChats.map(async (chat) => {
        const otherId = chat.participantIds.find((p) => p !== userId);
        const otherUser = otherId ? await ctx.db.get(otherId) : null;
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .order("desc")
          .first();
        return {
          type: "message" as const,
          timestamp: chat.lastMessageAt,
          chat,
          lastMessage,
          otherUser,
        };
      }),
    );

    // Combine, sort by recency, return top 15
    const feed = [...matchItems, ...messageItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);

    return feed;
  },
});
