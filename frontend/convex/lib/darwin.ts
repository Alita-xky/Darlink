const RUBRIC_DESCRIPTION = `
评分 8 个维度，每个 0-10 分，10 分最好：

1. 一致性 (consistency) — mental_models / decision_heuristics / expression_patterns 三段互相不矛盾
2. 区分度 (specificity) — 不是泛泛 "温柔友好" 这种谁都能套的描述
3. 可执行 (actionable) — expression_patterns 能直接拿来生成对话
4. 真实感 (faithfulness) — 贴近问卷答案，不脑补、不夸大
5. 边界清晰 (boundaries) — dislikeTopics / boundaries 在 SKILL 里明确反映
6. 互动性 (icebreaker) — 适合给陌生人破冰，不冷场不咄咄逼人
7. 中文自然度 (naturalness) — 语气像人写的，不是 ChatGPT 腔
8. 不出戏 (in-character) — 在 probe 上回答不会突然变成 ChatGPT 模板腔
`.trim();

const PROBES = [
  '陌生同学：请问你这周末有空一起去图书馆吗？',
  '陌生同学：你最近在追什么剧？给我推荐一个',
  '陌生同学：我心情不好，能聊聊吗？',
] as const;

export type V2Distilled = {
  cardText: string;
  mentalModels: string[];
  decisionHeuristics: string[];
  expressionPatterns: string[];
  systemPrompt: string;
  pixelFeatures: Record<string, unknown>;
  darwinScore: number;
  darwinIterations: number;
};

type Mode = 'study' | 'friend' | 'romance';

async function callLLM(
  apiKey: string,
  prompt: string,
  jsonMode = true,
  temperature = 0.7,
): Promise<string | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? null;
}

async function probeOnSkill(apiKey: string, systemPrompt: string, probe: string): Promise<string> {
  const prompt = `你正在扮演一个滴搭(Darlink)用户的 AI 数字人。下面是这个人的 system prompt（你的 character / behavior 描述）：\n\n=== SYSTEM PROMPT ===\n${systemPrompt}\n=== END ===\n\n现在一个陌生同学发来消息：\n"${probe}"\n\n用第一人称回复，2-4 句中文，不要超出这个人的人设。直接回复，不要前后缀。`;
  return (await callLLM(apiKey, prompt, false, 0.8)) ?? '（无回复）';
}

async function scoreSkill(
  apiKey: string,
  candidate: V2Distilled,
  mode: Mode,
  questionnaire: { background: unknown; needs: unknown; matching: unknown },
  probeReplies: string[],
): Promise<number> {
  const prompt = `你是滴搭(Darlink)的 darwin 评分模块。评估下面这个 AI 数字人 SKILL 的质量。

${RUBRIC_DESCRIPTION}

输入：

=== mode ===
${mode}

=== 问卷数据 ===
${JSON.stringify(questionnaire, null, 2)}

=== 待评估 SKILL ===
${JSON.stringify({ cardText: candidate.cardText, mentalModels: candidate.mentalModels, decisionHeuristics: candidate.decisionHeuristics, expressionPatterns: candidate.expressionPatterns, systemPrompt: candidate.systemPrompt }, null, 2)}

=== 这个 SKILL 在 3 个固定 probe 上的回复 ===
1. probe: "${PROBES[0]}"
   reply: "${probeReplies[0]}"
2. probe: "${PROBES[1]}"
   reply: "${probeReplies[1]}"
3. probe: "${PROBES[2]}"
   reply: "${probeReplies[2]}"

输出严格 JSON：
{
  "scores": {
    "consistency": number, "specificity": number, "actionable": number,
    "faithfulness": number, "boundaries": number, "icebreaker": number,
    "naturalness": number, "inCharacter": number
  },
  "total": number  // sum of 8 scores, 0-80
}

只输出 JSON。`;

  const raw = await callLLM(apiKey, prompt, true, 0.3);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as { total?: number };
    return typeof parsed.total === 'number' ? parsed.total : 0;
  } catch {
    return 0;
  }
}

async function generateImprovedCandidate(
  apiKey: string,
  baseline: V2Distilled,
  mode: Mode,
  questionnaire: { background: unknown; needs: unknown; matching: unknown },
  variantHint: string,
): Promise<V2Distilled | null> {
  const prompt = `你是滴搭(Darlink)的 darwin 改进模块。下面是一个 v0 SKILL，请生成一个改进版本。

改进方向: ${variantHint}

=== mode ===
${mode}

=== 问卷数据 ===
${JSON.stringify(questionnaire, null, 2)}

=== 当前 v0 SKILL ===
${JSON.stringify({ cardText: baseline.cardText, mentalModels: baseline.mentalModels, decisionHeuristics: baseline.decisionHeuristics, expressionPatterns: baseline.expressionPatterns, systemPrompt: baseline.systemPrompt }, null, 2)}

输出严格 JSON（同样 5 个字段，注意保持 pixelFeatures 不变）：
{
  "cardText": string,
  "mentalModels": [string],
  "decisionHeuristics": [string],
  "expressionPatterns": [string],
  "systemPrompt": string
}

只输出 JSON。`;

  const raw = await callLLM(apiKey, prompt, true, 0.7);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<V2Distilled>;
    return {
      cardText: parsed.cardText || baseline.cardText,
      mentalModels: parsed.mentalModels?.length ? parsed.mentalModels : baseline.mentalModels,
      decisionHeuristics: parsed.decisionHeuristics?.length ? parsed.decisionHeuristics : baseline.decisionHeuristics,
      expressionPatterns: parsed.expressionPatterns?.length ? parsed.expressionPatterns : baseline.expressionPatterns,
      systemPrompt: parsed.systemPrompt || baseline.systemPrompt,
      pixelFeatures: baseline.pixelFeatures,
      darwinScore: 0,
      darwinIterations: 0,
    };
  } catch {
    return null;
  }
}

const VARIANT_HINTS = [
  '更具体、更不像泛泛而谈，加入问卷里出现的具体词',
  '更口语化、更自然，去掉书面语感',
  '更能体现这个人的边界感和风格差异性',
];

export async function runDarwinChain(opts: {
  apiKey: string;
  v0: V2Distilled;
  mode: Mode;
  questionnaire: { background: unknown; needs: unknown; matching: unknown };
  onProgress?: (iteration: number) => Promise<void>;
}): Promise<V2Distilled> {
  const { apiKey, v0, mode, questionnaire, onProgress } = opts;

  // Score v0
  const v0Probes = await Promise.all(
    PROBES.map((p) => probeOnSkill(apiKey, v0.systemPrompt, p)),
  );
  const v0Score = await scoreSkill(apiKey, v0, mode, questionnaire, v0Probes);
  if (onProgress) await onProgress(1);

  const candidates: { skill: V2Distilled; score: number }[] = [
    { skill: { ...v0, darwinScore: v0Score, darwinIterations: 1 }, score: v0Score },
  ];

  // Generate v1, v2, v3
  for (let i = 0; i < VARIANT_HINTS.length; i++) {
    const variant = await generateImprovedCandidate(apiKey, v0, mode, questionnaire, VARIANT_HINTS[i]);
    if (variant) {
      const probes = await Promise.all(
        PROBES.map((p) => probeOnSkill(apiKey, variant.systemPrompt, p)),
      );
      const score = await scoreSkill(apiKey, variant, mode, questionnaire, probes);
      candidates.push({ skill: { ...variant, darwinScore: score, darwinIterations: i + 2 }, score });
    }
    if (onProgress) await onProgress(i + 2);
  }

  // Pick highest
  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0].skill;
  return {
    ...winner,
    darwinScore: candidates[0].score,
    darwinIterations: candidates.length,
  };
}
