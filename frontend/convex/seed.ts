import { internalMutation } from "./_generated/server";

// Run from Convex dashboard: Functions → seed → run
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (existing) return { status: "already_seeded" };

    const now = Date.now();

    const aliceId = await ctx.db.insert("users", {
      email: "alice@pku.edu.cn",
      nickname: "小爱",
      school: "北京大学",
      major: "计算机科学",
      grade: "大二",
      verifiedStatus: "verified",
      verifiedVia: "email",
      createdAt: now,
    });

    const bobId = await ctx.db.insert("users", {
      email: "bob@pku.edu.cn",
      nickname: "小博",
      school: "北京大学",
      major: "数学",
      grade: "大三",
      verifiedStatus: "verified",
      verifiedVia: "email",
      createdAt: now,
    });

    const carolId = await ctx.db.insert("users", {
      email: "carol@pku.edu.cn",
      nickname: "晴晴",
      school: "北京大学",
      major: "心理学",
      grade: "大一",
      verifiedStatus: "verified",
      verifiedVia: "email",
      createdAt: now,
    });

    const profileBase = {
      questionnaireAnswers: {},
      updatedAt: now,
    };

    await ctx.db.insert("studentProfiles", {
      ...profileBase,
      userId: aliceId,
      socialGoal: ["找学习搭子", "扩大社交圈"],
      socialEnergy: "ambivert",
      communicationStyle: "warm",
      interests: ["机器学习", "读书", "咖啡", "健身"],
      availability: ["工作日晚上", "周末下午"],
      boundaries: ["不喜欢太频繁打扰"],
      relationshipPace: "medium",
      preferredScenes: ["study", "food"],
      dislikeTopics: ["政治"],
      values: ["真诚", "上进"],
    });

    await ctx.db.insert("studentProfiles", {
      ...profileBase,
      userId: bobId,
      socialGoal: ["找学习搭子"],
      socialEnergy: "introvert",
      communicationStyle: "thoughtful",
      interests: ["机器学习", "数学建模", "篮球", "咖啡"],
      availability: ["工作日下午", "工作日晚上"],
      boundaries: ["不强迫社交"],
      relationshipPace: "slow",
      preferredScenes: ["study"],
      dislikeTopics: ["无聊闲聊"],
      values: ["学术", "专注"],
    });

    await ctx.db.insert("studentProfiles", {
      ...profileBase,
      userId: carolId,
      socialGoal: ["找饭搭子", "恋爱"],
      socialEnergy: "extrovert",
      communicationStyle: "playful",
      interests: ["美食", "电影", "心理学", "旅行"],
      availability: ["中午", "工作日晚上", "周末"],
      boundaries: ["尊重隐私"],
      relationshipPace: "fast",
      preferredScenes: ["food", "romance"],
      dislikeTopics: [],
      values: ["乐观", "有趣", "坦诚"],
    });

    const dhBase = { version: 1, updatedAt: now };

    await ctx.db.insert("digitalHumans", {
      ...dhBase,
      userId: aliceId,
      cardText: "热爱学习的计科大二生，对AI充满好奇，喜欢和志同道合的人一起成长",
      skillMd: "# 小爱\n擅长系统思考，乐于分享学习心得",
      mentalModels: ["系统思考", "以终为始"],
      decisionHeuristics: ["先想清楚再行动"],
      expressionPatterns: ["温和且有条理"],
      publicFields: ["interests", "socialGoal"],
      privateFields: ["boundaries"],
    });

    await ctx.db.insert("digitalHumans", {
      ...dhBase,
      userId: bobId,
      cardText: "数学系大三，热衷于用数学思维解决问题，寻找能一起安静自习的搭子",
      skillMd: "# 小博\n逻辑清晰，善于抽象化思维",
      mentalModels: ["逻辑推导", "抽象化思维"],
      decisionHeuristics: ["用数据说话"],
      expressionPatterns: ["简洁直接"],
      publicFields: ["interests", "socialGoal"],
      privateFields: ["boundaries"],
    });

    await ctx.db.insert("digitalHumans", {
      ...dhBase,
      userId: carolId,
      cardText: "心理学大一新生，热爱生活，想认识有趣的灵魂，随时可以约饭约电影",
      skillMd: "# 晴晴\n善于倾听，充满活力",
      mentalModels: ["换位思考", "感性直觉"],
      decisionHeuristics: ["跟着感觉走"],
      expressionPatterns: ["轻松幽默"],
      publicFields: ["interests", "socialGoal"],
      privateFields: [],
    });

    const matchAB = await ctx.db.insert("matches", {
      userIdA: aliceId,
      userIdB: bobId,
      scene: "study",
      fitScore: 87,
      breakdown: {},
      explanation:
        "你们都对机器学习有浓厚兴趣，学习时间高度重合（工作日晚上），且都欣赏真诚上进的品质。小博的数学基础可以帮助小爱深入理解算法原理，而小爱的工程视角也能拓展小博的应用思维。",
      sharedTopics: ["机器学习", "咖啡", "工作日晚上自习"],
      complementarities: ["数学基础 + 工程思维 = 完美搭档", "一慢一快，节奏互补"],
      risks: ["小博节奏偏慢，需要多一些耐心"],
      icebreakers: [
        "我也在学机器学习，你现在在看哪个方向？",
        "看到你也喜欢喝咖啡，最近有没有发现什么好的自习咖啡馆？",
        "我们好像都在工作日晚上自习，也许可以约个时间一起？",
      ],
      aStatus: "new",
      bStatus: "new",
      createdAt: now,
    });

    await ctx.db.insert("matches", {
      userIdA: aliceId,
      userIdB: carolId,
      scene: "food",
      fitScore: 73,
      breakdown: {},
      explanation:
        "小爱和晴晴都喜欢在工作日晚上出来，有共同的探店欲望。晴晴的开朗能帮助小爱拓展社交圈，小爱的稳重也能给晴晴带来踏实感。",
      sharedTopics: ["工作日晚上", "美食探店"],
      complementarities: ["一个稳重一个活泼，互相带动"],
      risks: ["节奏偏好略有差异，晴晴更喜欢快节奏"],
      icebreakers: [
        "听说你对美食很感兴趣，附近有没有推荐的馆子？",
        "我最近在找饭搭子，你一般几点吃晚饭？",
      ],
      aStatus: "new",
      bStatus: "new",
      createdAt: now,
    });

    return { status: "seeded", aliceId, bobId, carolId, matchAB };
  },
});
