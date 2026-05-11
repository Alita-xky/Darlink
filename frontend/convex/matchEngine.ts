"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  userId: string;
  socialGoal: string[];
  socialEnergy: string;
  communicationStyle: string;
  interests: string[];
  availability: string[];
  boundaries: string[];
  relationshipPace: string;
  preferredScenes: string[];
  dislikeTopics: string[];
  values: string[];
  questionnaireAnswers: unknown;
  updatedAt: number;
};

type MatchData = {
  explanation: string;
  sharedTopics: string[];
  complementarities: string[];
  risks: string[];
  icebreakers: string[];
};

// ─── Scoring helpers ─────────────────────────────────────────────────────────

function commStyleCompat(a: string, b: string): number {
  const table: Record<string, Record<string, number>> = {
    warm: { warm: 10, playful: 8, thoughtful: 6 },
    concise: { concise: 10, thoughtful: 7 },
    playful: { playful: 10, warm: 8 },
    thoughtful: { thoughtful: 10, concise: 7, warm: 6 },
  };
  return table[a]?.[b] ?? table[b]?.[a] ?? 3;
}

function paceCompat(a: string, b: string): number {
  if (a === b) return 8;
  const adjacent = new Set([
    "slow:medium",
    "medium:slow",
    "medium:fast",
    "fast:medium",
  ]);
  if (adjacent.has(`${a}:${b}`)) return 5;
  return 1;
}

function sharedCount(arrA: string[], arrB: string[]): number {
  const setB = new Set(arrB);
  return arrA.filter((x) => setB.has(x)).length;
}

function sharedItems(arrA: string[], arrB: string[]): string[] {
  const setB = new Set(arrB);
  return arrA.filter((x) => setB.has(x));
}

function fitScore(a: Profile, b: Profile, scene: string): number {
  let score = 0;

  // Scene preference
  const aHas = a.preferredScenes.includes(scene);
  const bHas = b.preferredScenes.includes(scene);
  if (aHas && bHas) score += 15;
  else if (aHas || bHas) score += 5;

  // Interests: shared × 9, capped at 27
  score += Math.min(sharedCount(a.interests, b.interests) * 9, 27);

  // Availability: shared × 7, capped at 21
  score += Math.min(sharedCount(a.availability, b.availability) * 7, 21);

  // Social goals: shared × 7, capped at 14
  score += Math.min(sharedCount(a.socialGoal, b.socialGoal) * 7, 14);

  // Values: shared × 4, capped at 12
  score += Math.min(sharedCount(a.values, b.values) * 4, 12);

  // Communication style compat
  score += commStyleCompat(a.communicationStyle, b.communicationStyle);

  // Relationship pace compat
  score += paceCompat(a.relationshipPace, b.relationshipPace);

  // Noise
  score += Math.floor(Math.random() * 5);

  return Math.max(0, Math.min(100, score));
}

// ─── Deterministic fallback ───────────────────────────────────────────────────

function deterministicMatchData(
  a: Profile,
  b: Profile,
  scene: string,
  sharedInterests: string[],
  sharedAvail: string[],
): MatchData {
  const sceneLabel =
    scene === "study" ? "学习" : scene === "food" ? "吃饭" : "恋爱";
  const topicText = sharedInterests.slice(0, 2).join("和") || "共同爱好";
  const availText = sharedAvail[0] || "合适的时间";
  return {
    explanation: `你们都对${topicText}感兴趣，${availText}的时间有重叠，很适合一起${sceneLabel}。`,
    sharedTopics: sharedInterests.slice(0, 3),
    complementarities: ["互补的学习/生活风格"],
    risks: [],
    icebreakers: [
      sharedInterests[0]
        ? `我也很喜欢${sharedInterests[0]}，你平时怎么玩的？`
        : "你好，很高兴认识你！",
      sharedAvail[0]
        ? `我${sharedAvail[0]}也有空，要不要一起${sceneLabel}？`
        : `要不要约个时间一起${sceneLabel}？`,
      "看到我们有很多共同点，期待多了解彼此～",
    ],
  };
}

// ─── OpenAI enhancement ───────────────────────────────────────────────────────

async function openAIMatchData(
  a: Profile,
  b: Profile,
  scene: string,
  apiKey: string,
): Promise<MatchData | null> {
  const sceneLabel =
    scene === "study" ? "学习搭子" : scene === "food" ? "饭搭子" : "恋爱潜力";

  const prompt = `你是Darlink AI匹配引擎。根据两位大学生的画像，生成匹配分析（JSON格式）。

场景：${sceneLabel}
用户A：兴趣${JSON.stringify(a.interests)}，目标${JSON.stringify(a.socialGoal)}，风格${a.communicationStyle}，节奏${a.relationshipPace}，可用时间${JSON.stringify(a.availability)}
用户B：兴趣${JSON.stringify(b.interests)}，目标${JSON.stringify(b.socialGoal)}，风格${b.communicationStyle}，节奏${b.relationshipPace}，可用时间${JSON.stringify(b.availability)}

返回JSON（所有字段必须存在）：
{
  "explanation": "2-3句话，说明为什么这对搭子合适",
  "sharedTopics": ["最多3个共同话题标签"],
  "complementarities": ["1-2个互补之处"],
  "risks": ["0-1个需要注意的点，若无则空数组"],
  "icebreakers": ["破冰句1", "破冰句2", "破冰句3"]
}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MatchData;
    // Validate required fields exist
    if (
      typeof parsed.explanation !== "string" ||
      !Array.isArray(parsed.sharedTopics) ||
      !Array.isArray(parsed.complementarities) ||
      !Array.isArray(parsed.risks) ||
      !Array.isArray(parsed.icebreakers)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// ─── Main action ──────────────────────────────────────────────────────────────

export const generateForUser = action({
  args: {
    userId: v.id("users"),
    mode: v.optional(v.union(
      v.literal("study"),
      v.literal("friend"),
      v.literal("romance"),
    )),
  },
  handler: async (
    ctx,
    { userId, mode },
  ): Promise<{ created: number; scenes: string[] }> => {
    // TODO(v2): switch to reading from `questionnaires` (mode-keyed) when
    // the home tab and onboarding screens fully migrate (Tasks 20-23).
    // Until then, this engine reads `studentProfiles` (the v1 table) for
    // scoring. Users who only have mode-keyed questionnaires (post-cutover
    // new sign-ups for study/romance) will not generate matches until that
    // rewrite. Friend-mode is unaffected because Task 12 migration backfills
    // studentProfiles → questionnaires(mode='friend').
    // 1. Get user's profile
    const userProfile = await ctx.runQuery(api.profile.getProfile, { userId });
    if (!userProfile) return { created: 0, scenes: [] };

    // 2. Get all other profiles
    const allProfiles = (await ctx.runQuery(
      api.matchEngineInternal.getAllProfiles,
      {},
    )) as Profile[];

    // Mode → scene mapping. friend semantically maps to the existing 'food' scene.
    const MODE_TO_SCENE = { study: "study", friend: "food", romance: "romance" } as const;
    const scenes: readonly ("study" | "food" | "romance")[] = mode
      ? [MODE_TO_SCENE[mode]]
      : ["study", "food", "romance"];
    const apiKey = process.env.OPENAI_API_KEY;

    let totalCreated = 0;
    const scenesWithMatches = new Set<string>();

    // 3. For each scene
    for (const scene of scenes) {
      // Get already-matched userIds for this scene
      const matchedIds = (await ctx.runQuery(
        api.matchEngineInternal.getMatchedUserIds,
        { userId, scene },
      )) as string[];

      const matchedSet = new Set(matchedIds);

      // For each other profile
      for (const other of allProfiles) {
        // Skip self and already matched
        if (other.userId === userId) continue;
        if (matchedSet.has(other.userId)) continue;

        const score = fitScore(userProfile as Profile, other, scene);
        if (score < 52) continue;

        // Compute shared items for fallback
        const sharedInterests = sharedItems(
          (userProfile as Profile).interests,
          other.interests,
        );
        const sharedAvail = sharedItems(
          (userProfile as Profile).availability,
          other.availability,
        );

        // Generate match data
        let matchData: MatchData;
        if (apiKey) {
          const aiData = await openAIMatchData(
            userProfile as Profile,
            other,
            scene,
            apiKey,
          );
          matchData =
            aiData ??
            deterministicMatchData(
              userProfile as Profile,
              other,
              scene,
              sharedInterests,
              sharedAvail,
            );
        } else {
          matchData = deterministicMatchData(
            userProfile as Profile,
            other,
            scene,
            sharedInterests,
            sharedAvail,
          );
        }

        await ctx.runMutation(api.matchEngineInternal.createMatch, {
          userIdA: userId,
          userIdB: other.userId as typeof userId,
          scene,
          fitScore: score,
          explanation: matchData.explanation,
          sharedTopics: matchData.sharedTopics,
          complementarities: matchData.complementarities,
          risks: matchData.risks,
          icebreakers: matchData.icebreakers,
        });

        totalCreated += 1;
        scenesWithMatches.add(scene);
      }
    }

    return { created: totalCreated, scenes: Array.from(scenesWithMatches) };
  },
});
