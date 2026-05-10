/**
 * 数字人蒸馏:把问卷答案 → SKILL.md 结构。
 *
 * 灵感来自 alchaincyf/nuwa-skill:从输入信号中提取心智模型、决策启发、表达 DNA。
 * Nuwa 处理公众人物的语料,Darlink 处理普通用户的问卷答案,目标结构一致 —
 * 输出可作为该用户数字人的 system prompt 用于预匹配、破冰、改写。
 */

export type Profile = {
  socialGoal: string[];
  socialEnergy: "introvert" | "ambivert" | "extrovert";
  communicationStyle: "concise" | "warm" | "playful" | "thoughtful";
  interests: string[];
  availability: string[];
  boundaries: string[];
  relationshipPace: "slow" | "medium" | "fast";
  preferredScenes: string[];
  dislikeTopics: string[];
  values: string[];
};

export type DigitalHuman = {
  cardText: string;
  skillMd: string;
  mentalModels: string[];
  decisionHeuristics: string[];
  expressionPatterns: string[];
  publicFields: string[];
  privateFields: string[];
};

const energyLabel: Record<Profile["socialEnergy"], string> = {
  introvert: "偏慢热,熟了之后才会深聊",
  ambivert: "看场合切换,兼具内敛和热情",
  extrovert: "主动,愿意先开口打破沉默",
};

const styleLabel: Record<Profile["communicationStyle"], string> = {
  concise: "简洁直接,不喜欢绕弯子",
  warm: "温和有回应感,在乎对方感受",
  playful: "轻松幽默,喜欢玩梗",
  thoughtful: "深思熟虑,愿意把话讲清楚",
};

const paceLabel: Record<Profile["relationshipPace"], string> = {
  slow: "慢慢熟悉,先线上聊几天再考虑线下",
  medium: "节奏适中,聊得来就可以约自习或饭",
  fast: "节奏明快,有 vibe 就直接见",
};

export function distillDeterministic(profile: Profile): DigitalHuman {
  const energy = energyLabel[profile.socialEnergy];
  const style = styleLabel[profile.communicationStyle];
  const pace = paceLabel[profile.relationshipPace];

  const mentalModels: string[] = [
    `社交能量:${energy}`,
    `关系推进:${pace}`,
    profile.values.length > 0
      ? `价值排序:${profile.values.slice(0, 3).join(" > ")}`
      : "价值排序:(用户未明确)",
  ];

  const decisionHeuristics: string[] = [
    profile.boundaries.length > 0
      ? `边界优先:遇到 ${profile.boundaries.slice(0, 2).join("、")} 类话题会主动减速或退出`
      : "边界优先:对方推进过快时先暂停",
    profile.dislikeTopics.length > 0
      ? `避开:${profile.dislikeTopics.slice(0, 3).join("、")}`
      : "避开:让自己不舒服的强推话题",
    profile.preferredScenes.length > 0
      ? `更愿意在「${profile.preferredScenes.slice(0, 2).join("/")}」场景下认识人`
      : "倾向场景化、轻量的接触",
  ];

  const expressionPatterns: string[] = [
    `语气:${style}`,
    profile.interests.length > 0
      ? `常用切入点:${profile.interests.slice(0, 4).join("、")}`
      : "常用切入点:学习/校园/最近在做的事",
    "不爱:连环追问、套近乎、复读式回应",
  ];

  const goalText =
    profile.socialGoal.length > 0
      ? profile.socialGoal.slice(0, 3).join("、")
      : "学习搭子、朋友";

  const cardText = [
    `我是一个${energy}的人。${style}。`,
    `最近想找${goalText}。`,
    profile.interests.length > 0
      ? `兴趣:${profile.interests.slice(0, 5).join("、")}。`
      : "",
    `${pace}。`,
    profile.boundaries.length > 0
      ? `边界:${profile.boundaries.slice(0, 2).join("、")}。`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const publicFields = [
    "socialGoal",
    "interests",
    "communicationStyle",
    "preferredScenes",
  ];
  const privateFields = [
    "boundaries",
    "dislikeTopics",
    "values",
    "availability",
  ];

  const skillMd = renderSkillMd({
    cardText,
    profile,
    mentalModels,
    decisionHeuristics,
    expressionPatterns,
    publicFields,
    privateFields,
  });

  return {
    cardText,
    skillMd,
    mentalModels,
    decisionHeuristics,
    expressionPatterns,
    publicFields,
    privateFields,
  };
}

function renderSkillMd(input: {
  cardText: string;
  profile: Profile;
  mentalModels: string[];
  decisionHeuristics: string[];
  expressionPatterns: string[];
  publicFields: string[];
  privateFields: string[];
}): string {
  const { profile, mentalModels, decisionHeuristics, expressionPatterns } =
    input;

  return [
    "# 数字人 SKILL.md",
    "",
    "> 该文件是用户数字人的 system prompt。在预匹配、破冰生成、语气改写时被加载。",
    "> 仅在用户授权范围内代表用户视角发言;**不得编造经历,不得越过下方边界**。",
    "",
    "## 1. 心智模型 (Mental Models)",
    ...mentalModels.map((m) => `- ${m}`),
    "",
    "## 2. 决策启发 (Decision Heuristics)",
    ...decisionHeuristics.map((h) => `- ${h}`),
    "",
    "## 3. 表达模式 (Expression DNA)",
    ...expressionPatterns.map((p) => `- ${p}`),
    "",
    "## 4. 偏好与目标",
    `- 社交目标:${profile.socialGoal.join("、") || "(未填)"}`,
    `- 偏好场景:${profile.preferredScenes.join("、") || "(未填)"}`,
    `- 兴趣:${profile.interests.join("、") || "(未填)"}`,
    `- 可用时段:${profile.availability.join("、") || "(未填)"}`,
    "",
    "## 5. 边界 (Hard Limits)",
    ...(profile.boundaries.length > 0
      ? profile.boundaries.map((b) => `- ${b}`)
      : ["- (用户未明确,默认遵守平台基础边界)"]),
    "",
    "## 6. 价值观",
    ...(profile.values.length > 0
      ? profile.values.map((v) => `- ${v}`)
      : ["- (未填,默认中立)"]),
    "",
    "## 7. 不能做的事 (Acknowledged Limitations)",
    "- 未经用户确认,不代用户向真人发送任何消息",
    "- 不假装是真人,不编造用户经历或情绪",
    "- 不泄露 privateFields 中的字段给对方数字人",
    "- 不诱导用户越过对方边界",
    "- 不替用户做重大关系决定",
    "",
  ].join("\n");
}

export const DISTILL_LLM_PROMPT = `你是 Nuwa 蒸馏器的人格分支:把以下用户问卷答案蒸馏成一个 SKILL.md 风格的人格档案。

要求:
1. 输出 JSON,字段:cardText (一段不超过 80 字的第一人称自我介绍)、mentalModels (3 条)、decisionHeuristics (3 条)、expressionPatterns (3 条)。
2. mentalModels 描述用户怎么"看"关系/社交;decisionHeuristics 描述用户在什么场景下做什么选择;expressionPatterns 描述用户的语气和表达 DNA。
3. 必须基于问卷数据,不要凭空发挥。如果某项缺失,直接说明"用户未明确"。
4. 严禁出现 PUA、操控、诱导越界的话术。
5. 用中文。

问卷:
{{PROFILE_JSON}}

只输出 JSON,不要解释。`;
