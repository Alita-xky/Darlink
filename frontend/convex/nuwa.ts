"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { distillDeterministic, DISTILL_LLM_PROMPT, type Profile } from "./lib/distill";
import { runDarwinChain, type V2Distilled } from "./lib/darwin";
import type { Id } from "./_generated/dataModel";

export const distillForUser = action({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<{ status: "saved"; mode: "llm" | "deterministic" }> => {
    const profile = await ctx.runQuery(api.profile.getProfile, { userId });
    if (!profile) throw new Error("画像问卷尚未提交");

    const profileShape: Profile = {
      socialGoal: profile.socialGoal,
      socialEnergy: profile.socialEnergy,
      communicationStyle: profile.communicationStyle,
      interests: profile.interests,
      availability: profile.availability,
      boundaries: profile.boundaries,
      relationshipPace: profile.relationshipPace,
      preferredScenes: profile.preferredScenes,
      dislikeTopics: profile.dislikeTopics,
      values: profile.values,
    };

    const baseline = distillDeterministic(profileShape);

    const apiKey = process.env.OPENAI_API_KEY;
    let enhanced = baseline;
    let mode: "llm" | "deterministic" = "deterministic";

    if (apiKey) {
      try {
        const llm = await callOpenAI(apiKey, profileShape);
        if (llm) {
          enhanced = {
            ...baseline,
            cardText: llm.cardText || baseline.cardText,
            mentalModels: llm.mentalModels?.length ? llm.mentalModels : baseline.mentalModels,
            decisionHeuristics: llm.decisionHeuristics?.length
              ? llm.decisionHeuristics
              : baseline.decisionHeuristics,
            expressionPatterns: llm.expressionPatterns?.length
              ? llm.expressionPatterns
              : baseline.expressionPatterns,
          };
          mode = "llm";
        }
      } catch (err) {
        console.error("LLM enhancement failed, falling back to deterministic:", err);
      }
    }

    await ctx.runMutation(api.profile.saveDigitalHuman, {
      userId,
      ...enhanced,
    });

    return { status: "saved", mode };
  },
});

async function callOpenAI(apiKey: string, profile: Profile) {
  const prompt = DISTILL_LLM_PROMPT.replace(
    "{{PROFILE_JSON}}",
    JSON.stringify(profile, null, 2),
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  return JSON.parse(raw) as {
    cardText?: string;
    mentalModels?: string[];
    decisionHeuristics?: string[];
    expressionPatterns?: string[];
  };
}

// ─── v2 mode-aware path (Phase 2+) ──────────────────────────────────────────

import { internal } from "./_generated/api";

const MODE_HINTS = {
  study:
    "本次蒸馏聚焦学习搭子场景，强调学习目标、专业方向、可提供的学术帮助。输出的人物表达应在描述自己时偏知识主导。",
  friend:
    "本次蒸馏聚焦泛社交/饭搭子/玩搭子场景，强调兴趣、社交风格、轻松度、相处舒适度。",
  romance:
    "本次蒸馏聚焦恋爱潜力场景，强调价值观、亲密关系边界、共同生活倾向。注意尊重用户的边界声明。",
} as const;

const PIXEL_ENUM_HINT = `
可用的像素零件枚举：
- body: male | female | neutral
- hair: short | long | curly | bald | bun | buzz | samurai | wave
- face: chill | serious | smile | glasses | wink
- top: hoodie | shirt | blazer | tee | jacket | turtleneck | jersey | dress | uniform | varsity
- prop: book | laptop | coffee | mic | basketball | rocket | iphone | flask | typewriter | guitar | null
- bg: library | cafe | dorm | street | studio | null
- palette: warm | cool | pastel | mono | earth | candy | forest | sunset

推理规则示例：
- 兴趣含 "编程/学术" → prop=laptop
- 喜欢场景含 "图书馆" → bg=library
- 关键词 "卷王" → top=shirt, prop=laptop
- 关键词 "搞笑" → face=wink

若问卷信息不足，按 default 兜底（hair=short, face=chill, top=tee, prop=null, bg=null, palette=pastel）。
`.trim();

const DEFAULT_PIXEL = {
  body: "neutral",
  hair: "short",
  face: "chill",
  top: "tee",
  prop: null as string | null,
  bg: null as string | null,
  palette: "pastel",
};

const HAIR_ENUM = ['short', 'long', 'curly', 'bald', 'bun', 'buzz', 'samurai', 'wave'];
const FACE_ENUM = ['chill', 'serious', 'smile', 'glasses', 'wink'];
const TOP_ENUM = ['hoodie', 'shirt', 'blazer', 'tee', 'jacket', 'turtleneck', 'jersey', 'dress', 'uniform', 'varsity'];
const PROP_ENUM = ['book', 'laptop', 'coffee', 'mic', 'basketball', 'rocket', 'iphone', 'flask', 'typewriter', 'guitar'];
const BG_ENUM = ['library', 'cafe', 'dorm', 'street', 'studio'];
const BODY_ENUM = ['male', 'female', 'neutral'];
const PALETTE_ENUM = ['warm', 'cool', 'pastel', 'mono', 'earth', 'candy', 'forest', 'sunset'];

function validatePixelFeatures(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PIXEL };
  const r = raw as Record<string, unknown>;
  return {
    body: BODY_ENUM.includes(r.body as string) ? r.body : DEFAULT_PIXEL.body,
    hair: HAIR_ENUM.includes(r.hair as string) ? r.hair : DEFAULT_PIXEL.hair,
    face: FACE_ENUM.includes(r.face as string) ? r.face : DEFAULT_PIXEL.face,
    top: TOP_ENUM.includes(r.top as string) ? r.top : DEFAULT_PIXEL.top,
    prop: r.prop === null || PROP_ENUM.includes(r.prop as string) ? r.prop : DEFAULT_PIXEL.prop,
    bg: r.bg === null || BG_ENUM.includes(r.bg as string) ? r.bg : DEFAULT_PIXEL.bg,
    palette: PALETTE_ENUM.includes(r.palette as string) ? r.palette : DEFAULT_PIXEL.palette,
  };
}

export const distillForUserByMode = action({
  args: {
    userId: v.id("users"),
    mode: v.union(
      v.literal("study"),
      v.literal("friend"),
      v.literal("romance"),
    ),
  },
  handler: async (
    ctx,
    { userId, mode },
  ): Promise<{ status: "saved"; mode: "llm" | "deterministic" }> => {
    // (internal as any): codegen lag in worktree — new internal queries added in
    // Task 13 to profile.ts but _generated/api.d.ts hasn't been regenerated yet.
    const q = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any).profile.getQuestionnaireByMode,
      { userId, mode },
    );
    if (!q) throw new Error(`mode=${mode} 的画像问卷尚未提交`);

    const apiKey = process.env.OPENAI_API_KEY;
    let v0: V2Distilled;
    let llmMode: 'llm' | 'deterministic' = 'deterministic';

    if (apiKey) {
      try {
        const llm = await callOpenAIv2(apiKey, mode, q);
        if (llm) {
          v0 = llm;
          llmMode = 'llm';
        } else {
          v0 = deterministicV2(mode, q);
        }
      } catch (err) {
        console.error('[nuwa.v2] LLM v0 failed, falling back to deterministic:', err);
        v0 = deterministicV2(mode, q);
      }
    } else {
      v0 = deterministicV2(mode, q);
    }

    // Persist v0 first so we have an _id for darwin progress writes
    // (internal as any): same codegen lag reason as above
    const existing = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any).profile.getDigitalHumanByMode,
      { userId, mode },
    );

    let dhId: Id<'digitalHumans'>;
    if (existing) {
      await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (internal as any).profile.replaceDigitalHuman,
        { id: existing._id, data: v0 },
      );
      dhId = existing._id;
    } else {
      dhId = (await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (internal as any).profile.insertDigitalHuman,
        {
          userId,
          mode,
          ...v0,
          darwinScore: 0,
          darwinIterations: 0,
        },
      )) as Id<'digitalHumans'>;
    }

    // Optionally run darwin chain
    const darwinModes = (process.env.DARWIN_MODES ?? 'friend').split(',').map((m) => m.trim());
    const shouldRunDarwin = apiKey && llmMode === 'llm' && darwinModes.includes(mode);

    if (shouldRunDarwin && apiKey) {
      try {
        const winner = await runDarwinChain({
          apiKey,
          v0,
          mode,
          questionnaire: { background: q.background, needs: q.needs, matching: q.matching },
          onProgress: async (iteration: number) => {
            await ctx.runMutation(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (internal as any).profile.updateDarwinProgress,
              { id: dhId, iteration },
            );
          },
        });
        // Replace stored v0 with darwin winner
        await ctx.runMutation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (internal as any).profile.replaceDigitalHuman,
          { id: dhId, data: winner },
        );
      } catch (err) {
        console.error('[darwin] chain failed, keeping v0:', err);
        // Mark progress as 1 to signal "we tried but stopped"
        await ctx.runMutation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (internal as any).profile.updateDarwinProgress,
          { id: dhId, iteration: 1 },
        );
      }
    }

    return { status: 'saved', mode: llmMode };
  },
});

function deterministicV2(
  mode: "study" | "friend" | "romance",
  q: { background: unknown; needs: unknown; matching: unknown; raw: unknown },
): V2Distilled {
  const summary = `基于 ${mode} 模式问卷生成的初步画像（确定性路径，未启用 LLM）`;
  return {
    cardText: summary,
    mentalModels: [`${mode} 场景的核心需求`],
    decisionHeuristics: [],
    expressionPatterns: [],
    systemPrompt: summary,
    pixelFeatures: { ...DEFAULT_PIXEL },
    darwinScore: 0,
    darwinIterations: 0,
  };
}

async function callOpenAIv2(
  apiKey: string,
  mode: "study" | "friend" | "romance",
  q: { background: unknown; needs: unknown; matching: unknown; raw: unknown },
): Promise<V2Distilled | null> {
  const prompt = `你是滴搭(Darlink)的 nuwa 蒸馏模块。你的任务是把一个大学生填写的"${mode}"模式问卷蒸馏成一个简洁、有辨识度的"AI 数字人"画像。

${MODE_HINTS[mode]}

输出严格 JSON，字段：
- cardText (string, 80-200字, 用第三人称描述这个人)
- mentalModels (array of string, 2-4 条, 描述这个人怎么思考)
- decisionHeuristics (array of string, 2-4 条, 描述决策时的取舍)
- expressionPatterns (array of string, 2-4 条, 描述这个人说话的特点)
- systemPrompt (string, 200-400字, 第二人称的 system prompt, 用于驱动这个人的 AI 分身回复)
- pixelFeatures (object, 见下面的枚举规则)

${PIXEL_ENUM_HINT}

问卷数据（mode=${mode}）:
${JSON.stringify({ background: q.background, needs: q.needs, matching: q.matching }, null, 2)}

只输出 JSON，不要前后缀。`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<V2Distilled>;
  return {
    cardText: parsed.cardText || `${mode} 模式数字人`,
    mentalModels: parsed.mentalModels?.length ? parsed.mentalModels : ["待补充"],
    decisionHeuristics: parsed.decisionHeuristics?.length ? parsed.decisionHeuristics : [],
    expressionPatterns: parsed.expressionPatterns?.length ? parsed.expressionPatterns : [],
    systemPrompt: parsed.systemPrompt || parsed.cardText || `${mode} 模式 system prompt`,
    pixelFeatures: validatePixelFeatures(parsed.pixelFeatures),
    darwinScore: 0,
    darwinIterations: 0,
  };
}
