(() => {
  "use strict";

  const STORAGE = {
    auth: "darlink-auth-session",
    remembered: "darlink-remembered-login",
    questionnaire: "darlink-questionnaire",
    persona: "darlink-persona-dialogue",
    intent: "darlink-selected-intent",
    profile: "darlink-profile-cards",
    profileDismissed: "darlink-profile-dismissed",
    chat1: "darlink-chat-step-1",
    chat2: "darlink-chat-step-2",
    chat3: "darlink-chat-step-3",
    chatContext: "darlink-chat-context",
    registration: "darlink-registration-session",
    hallUnlocked: "darlink-hall-unlocked",
    hallChallenge: "darlink-hall-challenge",
  };

  const DARLINK_TEST_AUTH_CODE = "202606";
  const DARLINK_TEST_AUTH_EMAIL = "qa@connect.hku.hk";
  const DARLINK_TEST_AUTH_PASSWORD = "darlink2026";

  const MATCH_CHAT_PROFILES = {
    elena: {
      name: "Elena Jiang",
      initials: "EJ",
      subtitle: "AI Match • 98% Compatibility",
      colors: ["#6f5092", "#fcaad6"],
      opener: "I noticed your curiosity spikes around design systems and quiet study spaces. That feels rare in a very good way.",
      userLine: "That actually sounds like me. What made you notice that?",
      followup: "Your answers balance structure with warmth. I would start with a low-pressure campus walk and one shared project idea.",
      suggestion: "Ask Elena what kind of first meeting feels relaxed but still meaningful."
    },
    aria: {
      name: "Aria Liu",
      initials: "AL",
      subtitle: "AI Match • 94% Study Rhythm",
      colors: ["#006686", "#7ed4fd"],
      opener: "Your study pattern matches mine: focused sprints, clear goals, and a gentle check-in when energy drops.",
      userLine: "That sounds useful. How do you usually keep someone accountable?",
      followup: "I like shared milestones more than pressure. A short plan, a timer, then a real break usually works best.",
      suggestion: "Ask Aria to design a two-hour study sync for this week."
    },
    sarah: {
      name: "Sarah J.",
      initials: "SJ",
      subtitle: "AI Match • 91% Emotional Pace",
      colors: ["#8a486f", "#d8b4fe"],
      opener: "I think we both prefer conversations that start softly and become honest over time.",
      userLine: "Yes, I do not like rushing into intensity.",
      followup: "Same. I would rather build trust through small, consistent signals than make the first chat performative.",
      suggestion: "Ask Sarah what a comfortable first conversation should avoid."
    },
    maya: {
      name: "Maya K.",
      initials: "MK",
      subtitle: "AI Match • 92% Creative Resonance",
      colors: ["#d8b4fe", "#6f5092"],
      opener: "I saw strong overlap in minimalist digital art, speculative reading, and late-night idea building.",
      userLine: "That is a very specific overlap. What would you start with?",
      followup: "A tiny design critique exchange would be perfect: one reference each, then coffee if the rhythm feels easy.",
      suggestion: "Ask Maya to trade one favorite visual reference before meeting."
    },
    rui: {
      name: "Rui Deng",
      initials: "RD",
      subtitle: "AI Match • 88% Project Energy",
      colors: ["#7ed4fd", "#6f5092"],
      opener: "You both seem to turn social energy into projects instead of small talk.",
      userLine: "That is true. I like doing something while talking.",
      followup: "Then a mini-build session might be better than a normal coffee chat.",
      suggestion: "Ask Rui what small campus tool you could prototype together."
    },
    lina: {
      name: "Lina Xu",
      initials: "LX",
      subtitle: "AI Match • 86% Calm Focus",
      colors: ["#fcaad6", "#7ed4fd"],
      opener: "Your signals suggest a calm, practical match: fewer messages, better follow-through.",
      userLine: "I prefer that. Constant messaging is tiring.",
      followup: "Then one planned check-in beats a hundred scattered replies.",
      suggestion: "Ask Lina to pick a weekly study checkpoint."
    },
    zoe: {
      name: "Zoe Huang",
      initials: "ZH",
      subtitle: "AI Match • 89% Social Curiosity",
      colors: ["#006686", "#d8b4fe"],
      opener: "You both seem open to new people, but only when the context feels safe and not too loud.",
      userLine: "Exactly. I like social plans with a reason.",
      followup: "A campus event with an easy exit plan would fit that style.",
      suggestion: "Ask Zoe which event feels low-pressure this week."
    },
    priya: {
      name: "Priya Tan",
      initials: "PT",
      subtitle: "AI Match • 87% Food Trail Fit",
      colors: ["#8a486f", "#fcaad6"],
      opener: "Your food and conversation signals line up around late-night comfort spots and thoughtful questions.",
      userLine: "That sounds like a good first meeting.",
      followup: "A small food trail gives enough movement to avoid awkward silence.",
      suggestion: "Ask Priya to choose between dessert, noodles, or coffee."
    },
    yuki: {
      name: "Yuki Ito",
      initials: "YI",
      subtitle: "AI Match • 85% Gentle Momentum",
      colors: ["#6f5092", "#7ed4fd"],
      opener: "You both seem to prefer slow momentum: warm, curious, and not over-explained too early.",
      userLine: "That feels comfortable.",
      followup: "Then the best start is probably a short message that leaves room to continue.",
      suggestion: "Ask Yuki for a simple opening question."
    }
  };

  const HALL_CHAT_PROFILES = {
    "steve-jobs": {
      name: "Steve Jobs",
      subtitle: "Hall of Fame Mentor • Product Vision",
      background: "/files/hall/steve-jobs.png",
      opener: "Let's start with taste. What are you building that deserves to feel simpler than it currently does?",
      userLine: "I am trying to make Darlink feel alive without making it noisy.",
      followup: "Then remove anything that explains the magic and keep the moments where people feel it.",
      suggestion: "Ask Steve to critique the first ten seconds of the product experience."
    },
    "elon-musk": {
      name: "Elon Musk",
      subtitle: "Hall of Fame Mentor • First Principles",
      background: "/files/hall/elon-musk.png",
      opener: "What assumption are you accepting because everyone else in social apps accepts it?",
      userLine: "Maybe that onboarding has to feel like a form.",
      followup: "Good. Replace the form with a conversation, then measure whether signal quality improves.",
      suggestion: "Ask Elon to reduce the product to one hard technical bet."
    },
    "jensen-huang": {
      name: "Jensen Huang",
      subtitle: "Hall of Fame Mentor • AI Infrastructure",
      background: "/files/hall/jensen-huang.png",
      opener: "The interface is only the surface. Where is the intelligence loop that compounds every day?",
      userLine: "Xiaoda learns from onboarding and matching signals.",
      followup: "Then make that loop visible through better outcomes, not dashboards.",
      suggestion: "Ask Jensen how to show intelligence without overwhelming users."
    },
    "jack-ma": {
      name: "Jack Ma",
      subtitle: "Hall of Fame Mentor • Community Growth",
      background: "/files/hall/jack-ma.png",
      opener: "Trust comes before scale. What promise can students feel within the first minute?",
      userLine: "That Darlink understands intent instead of pushing strangers at them.",
      followup: "Then build every interaction around that promise and let growth follow trust.",
      suggestion: "Ask Jack how to make campus ambassadors feel proud to invite friends."
    },
    "ray-dalio": {
      name: "Ray Dalio",
      subtitle: "Hall of Fame Mentor • Principles",
      background: "/files/hall/ray-dalio.png",
      opener: "What is the principle behind a good match, and how do you know when it fails?",
      userLine: "A good match should respect timing, safety, and real intent.",
      followup: "Write those as operating principles, then design feedback loops around them.",
      suggestion: "Ask Ray to turn matching quality into measurable principles."
    },
    "peter-drucker": {
      name: "Peter Drucker",
      subtitle: "Hall of Fame Mentor • Management",
      background: "/files/hall/peter-drucker.png",
      opener: "What does Darlink help students accomplish that they could not manage alone?",
      userLine: "It helps them turn vague social intent into better introductions.",
      followup: "Then your product is not dating. It is social effectiveness for campus life.",
      suggestion: "Ask Drucker to define the product category in one sentence."
    },
    "richard-feynman": {
      name: "Richard Feynman",
      subtitle: "Hall of Fame Mentor • Curiosity",
      background: "/files/hall/richard-feynman.png",
      opener: "If you cannot explain the matching logic simply, you probably do not understand it yet.",
      userLine: "So the logic should feel like a clear story?",
      followup: "Exactly. Make the model curious, testable, and a little playful.",
      suggestion: "Ask Feynman to explain Xiaoda's matching in plain language."
    },
    "charlie-munger": {
      name: "Charlie Munger",
      subtitle: "Hall of Fame Mentor • Judgment",
      background: "/files/hall/charlie-munger.png",
      opener: "Avoid obvious mistakes first. What incentives could make users behave worse?",
      userLine: "Ranking people too aggressively could make it performative.",
      followup: "Good. Design against vanity metrics before they corrupt the system.",
      suggestion: "Ask Munger which social-app incentives to invert."
    },
    "reid-hoffman": {
      name: "Reid Hoffman",
      subtitle: "Hall of Fame Mentor • Networks",
      background: "/files/hall/reid-hoffman.png",
      opener: "A network becomes valuable when every new node improves the experience for others.",
      userLine: "Digital humans could make each new user easier to understand.",
      followup: "Then your onboarding is not a gate. It is network enrichment.",
      suggestion: "Ask Reid how to make digital humans increase network quality."
    },
    "jeff-bezos": {
      name: "Jeff Bezos",
      subtitle: "Hall of Fame Mentor • Customer Obsession",
      background: "/files/hall/jeff-bezos.png",
      opener: "Work backward from a student's anxious first message. What would make it easier?",
      userLine: "A warm AI-suggested opening that still sounds like them.",
      followup: "Then obsess over that moment until it feels inevitable.",
      suggestion: "Ask Bezos what the first press release for Darlink should promise."
    },
    "naval-ravikant": {
      name: "Naval Ravikant",
      subtitle: "Hall of Fame Mentor • Leverage",
      background: "/files/hall/naval-ravikant.png",
      opener: "The best social product gives people leverage without stealing their authenticity.",
      userLine: "So Xiaoda should amplify, not replace, the user.",
      followup: "Yes. Let the AI carry context, while the human keeps agency.",
      suggestion: "Ask Naval how to balance automation and authenticity."
    },
    "marc-andreessen": {
      name: "Marc Andreessen",
      subtitle: "Hall of Fame Mentor • Market Thesis",
      background: "/files/hall/marc-andreessen.png",
      opener: "What changed that makes this possible now and not ten years ago?",
      userLine: "LLMs can turn messy intent into useful social context.",
      followup: "Then make that the market thesis: intent is now computable.",
      suggestion: "Ask Marc to sharpen Darlink's market wedge."
    },
    "mark-zuckerberg": {
      name: "Mark Zuckerberg",
      subtitle: "Hall of Fame Mentor • Social Graphs",
      background: "/files/hall/mark-zuckerberg.png",
      opener: "The graph matters, but the reason for each edge matters more.",
      userLine: "Darlink's edges come from intent and compatibility.",
      followup: "Then make every connection explainable enough to feel trusted.",
      suggestion: "Ask Mark how to make a campus graph feel personal."
    }
  };

  const HALL_CHALLENGES = {
    "steve-jobs": [
      ["Steve Jobs 在 1976 年共同创办了哪家公司？", ["Apple", "Microsoft", "Intel"], "Apple"],
      ["Jobs 离开 Apple 后创办、后来被 Apple 收购的公司是？", ["NeXT", "Oracle", "Compaq"], "NeXT"],
      ["他曾长期参与并推动哪家动画公司的发展？", ["Pixar", "DreamWorks", "Netflix"], "Pixar"],
      ["iPhone 首次发布是在？", ["2007", "1999", "2015"], "2007"],
      ["Jobs 最常被关联的产品理念是？", ["技术与人文交叉", "只做低价硬件", "完全放弃设计"], "技术与人文交叉"],
      ["他重返 Apple 后，哪类产品成为消费电子转折点？", ["iPod / iPhone", "大型机", "传真机"], "iPod / iPhone"],
    ],
    "elon-musk": [
      ["Elon Musk 领导的火箭公司是？", ["SpaceX", "Blue Origin", "Boeing"], "SpaceX"],
      ["他长期担任 CEO 的电动汽车公司是？", ["Tesla", "Ford", "Toyota"], "Tesla"],
      ["Musk 早期参与并最终并入 PayPal 的公司是？", ["X.com", "Yahoo", "AOL"], "X.com"],
      ["SpaceX 著名的可回收火箭系列是？", ["Falcon", "Apollo", "Atlas"], "Falcon"],
      ["Musk 常强调的思维方式是？", ["第一性原理", "完全照搬竞品", "只看短期潮流"], "第一性原理"],
      ["他的项目常围绕哪类主题？", ["能源、交通、太空", "传统纸媒", "线下零售"], "能源、交通、太空"],
    ],
    "jensen-huang": [
      ["Jensen Huang 是哪家公司的共同创始人兼 CEO？", ["NVIDIA", "AMD", "Qualcomm"], "NVIDIA"],
      ["NVIDIA 最知名的核心硬件品类是？", ["GPU", "打印机", "路由器"], "GPU"],
      ["GPU 在近年 AI 发展中主要提供什么能力？", ["并行计算", "纸张扫描", "机械存储"], "并行计算"],
      ["Jensen Huang 常穿的标志性服装是？", ["黑色皮夹克", "白色实验服", "燕尾服"], "黑色皮夹克"],
      ["NVIDIA 最初的重要市场之一是？", ["图形与游戏", "餐饮配送", "房地产"], "图形与游戏"],
      ["他与哪类技术浪潮高度相关？", ["加速计算与生成式 AI", "胶片冲印", "蒸汽机械"], "加速计算与生成式 AI"],
    ],
    "jack-ma": [
      ["Jack Ma 创办的代表性公司是？", ["Alibaba", "Tencent", "Baidu"], "Alibaba"],
      ["他早年从事过什么职业？", ["英语教师", "职业篮球运动员", "飞行员"], "英语教师"],
      ["阿里巴巴最初的重要业务方向是？", ["电子商务", "汽车制造", "石油开采"], "电子商务"],
      ["淘宝和天猫属于哪类业务生态？", ["线上交易平台", "航空系统", "矿业平台"], "线上交易平台"],
      ["Jack Ma 常被关联的创业关键词是？", ["中小企业与信任", "只服务大型军工", "拒绝互联网"], "中小企业与信任"],
      ["阿里巴巴总部所在城市是？", ["杭州", "北京", "深圳"], "杭州"],
    ],
    "ray-dalio": [
      ["Ray Dalio 创办的投资机构是？", ["Bridgewater Associates", "BlackRock", "Sequoia"], "Bridgewater Associates"],
      ["他的知名著作是？", ["Principles", "The Lean Startup", "Zero to One"], "Principles"],
      ["Dalio 常强调的组织文化是？", ["极度透明", "完全保密且不反馈", "拒绝数据"], "极度透明"],
      ["Bridgewater 的核心领域是？", ["宏观投资", "餐饮连锁", "游戏开发"], "宏观投资"],
      ["Dalio 的方法论常围绕什么展开？", ["原则和决策系统", "随机直觉", "短期情绪"], "原则和决策系统"],
      ["他常提醒人们如何看待错误？", ["把错误转成学习机制", "永远隐藏错误", "只责怪别人"], "把错误转成学习机制"],
    ],
    "peter-drucker": [
      ["Peter Drucker 被广泛称为？", ["现代管理学之父", "量子物理学之父", "动画电影之父"], "现代管理学之父"],
      ["他重点研究的领域是？", ["管理与组织", "深海潜水", "流行音乐"], "管理与组织"],
      ["Drucker 常被关联的管理概念是？", ["目标管理", "无目标管理", "只看运气"], "目标管理"],
      ["他强调组织应关注什么？", ["贡献与结果", "表面忙碌", "无意义流程"], "贡献与结果"],
      ["Drucker 的思想常用于哪类场景？", ["企业与非营利组织管理", "天气预报", "烹饪配方"], "企业与非营利组织管理"],
      ["他的管理观更重视？", ["有效性", "形式主义", "盲目扩张"], "有效性"],
    ],
    "richard-feynman": [
      ["Richard Feynman 获得诺贝尔奖的领域是？", ["物理学", "文学", "经济学"], "物理学"],
      ["他的重要贡献与哪一理论相关？", ["量子电动力学", "板块构造学", "古典诗学"], "量子电动力学"],
      ["Feynman 著名的教学风格是？", ["用简单语言解释复杂概念", "故意让概念更晦涩", "只背公式"], "用简单语言解释复杂概念"],
      ["他参与过哪个二战时期科研项目？", ["曼哈顿计划", "阿波罗登月计划", "人类基因组计划"], "曼哈顿计划"],
      ["Feynman diagrams 用于帮助理解什么？", ["粒子相互作用", "股票 K 线", "城市地图"], "粒子相互作用"],
      ["他常被代表的精神是？", ["好奇心与怀疑精神", "拒绝提问", "反对实验"], "好奇心与怀疑精神"],
    ],
    "charlie-munger": [
      ["Charlie Munger 长期担任哪家公司的副董事长？", ["Berkshire Hathaway", "Apple", "NVIDIA"], "Berkshire Hathaway"],
      ["他最常被关联的搭档是？", ["Warren Buffett", "Bill Gates", "Larry Page"], "Warren Buffett"],
      ["Munger 著名的思维方式是？", ["多元思维模型", "只用单一视角", "拒绝学习"], "多元思维模型"],
      ["他的投资风格强调？", ["长期理性判断", "短线噪音", "盲目跟风"], "长期理性判断"],
      ["Munger 常提醒人们先做什么？", ["避免愚蠢错误", "追逐每个热点", "忽略风险"], "避免愚蠢错误"],
      ["他与 Buffett 的投资哲学常强调？", ["优质企业与耐心", "频繁冲动交易", "只看传闻"], "优质企业与耐心"],
    ],
    "reid-hoffman": [
      ["Reid Hoffman 共同创办的职业社交平台是？", ["LinkedIn", "Instagram", "TikTok"], "LinkedIn"],
      ["LinkedIn 的核心网络是？", ["职业关系网络", "短视频娱乐网络", "外卖网络"], "职业关系网络"],
      ["Hoffman 也是哪类机构的重要投资人？", ["风险投资", "传统采矿", "航空维修"], "风险投资"],
      ["他常讨论的创业概念是？", ["闪电式扩张", "永远不增长", "拒绝网络效应"], "闪电式扩张"],
      ["Hoffman 的思想常围绕什么？", ["网络效应", "孤立产品", "线下票据"], "网络效应"],
      ["LinkedIn 后来被哪家公司收购？", ["Microsoft", "Meta", "IBM"], "Microsoft"],
    ],
    "jeff-bezos": [
      ["Jeff Bezos 创办的公司是？", ["Amazon", "eBay", "Walmart"], "Amazon"],
      ["Amazon 最初以什么品类起步？", ["网上书店", "电动汽车", "电影制片厂"], "网上书店"],
      ["Bezos 也创办了哪家太空公司？", ["Blue Origin", "SpaceX", "Rocket Lab"], "Blue Origin"],
      ["他常强调的经营理念是？", ["客户至上", "忽视用户", "只看内部喜好"], "客户至上"],
      ["Amazon Web Services 的简称是？", ["AWS", "ABC", "AOL"], "AWS"],
      ["Bezos 的产品方法常使用什么起点？", ["从客户需求倒推", "从口号倒推", "从办公室装修倒推"], "从客户需求倒推"],
    ],
    "naval-ravikant": [
      ["Naval Ravikant 共同创办的平台是？", ["AngelList", "LinkedIn", "Pinterest"], "AngelList"],
      ["AngelList 主要服务哪类生态？", ["创业公司与投资", "外卖配送", "传统影视"], "创业公司与投资"],
      ["Naval 常讨论的关键词是？", ["杠杆与财富", "盲目忙碌", "拒绝学习"], "杠杆与财富"],
      ["他常强调哪类杠杆？", ["代码、媒体、资本", "只靠体力重复", "纸质表格"], "代码、媒体、资本"],
      ["Naval 的内容常围绕什么？", ["个人判断和长期主义", "短期冲动", "无意义竞争"], "个人判断和长期主义"],
      ["他常被视为哪类角色？", ["创业者与天使投资人", "职业厨师", "职业运动裁判"], "创业者与天使投资人"],
    ],
    "marc-andreessen": [
      ["Marc Andreessen 共同开发的早期网页浏览器是？", ["Mosaic", "Chrome", "Safari"], "Mosaic"],
      ["他共同创办的浏览器公司是？", ["Netscape", "Opera", "Mozilla Foundation"], "Netscape"],
      ["Andreessen Horowitz 常被简称为？", ["a16z", "AWS", "YC"], "a16z"],
      ["他著名观点之一是？", ["Software is eating the world", "Hardware is disappearing forever", "The internet is a toy"], "Software is eating the world"],
      ["a16z 属于哪类机构？", ["风险投资", "大学食堂", "航空公司"], "风险投资"],
      ["Andreessen 的经历与哪一浪潮高度相关？", ["互联网与软件创业", "传统造纸", "煤炭运输"], "互联网与软件创业"],
    ],
    "mark-zuckerberg": [
      ["Mark Zuckerberg 共同创办的平台最初名为？", ["Facebook", "Friendster", "MySpace"], "Facebook"],
      ["Facebook 后来的母公司名称是？", ["Meta", "Alphabet", "ByteDance"], "Meta"],
      ["Facebook 最初从哪类场景扩展？", ["大学校园社交", "航空订票", "线下超市"], "大学校园社交"],
      ["Meta 旗下的重要通讯产品之一是？", ["WhatsApp", "Slack", "Zoom"], "WhatsApp"],
      ["Zuckerberg 长期关注的主题包括？", ["社交图谱与连接", "石油钻探", "快递分拣"], "社交图谱与连接"],
      ["Meta 近年重点投入的方向之一是？", ["AI 与沉浸式计算", "胶片冲印", "传统印刷"], "AI 与沉浸式计算"],
    ],
  };

  const MODULE_CHAT_PROFILES = {
    "study-astra": {
      name: "Astra Chen",
      initials: "AC",
      subtitle: "Study Sync • Quantum Physics • 98% Match",
      colors: ["#006686", "#d8b4fe"],
      opener: "Your focus pattern matches mine: quiet blocks, hard problems first, and short reflection after each sprint.",
      userLine: "That is exactly how I work. What would our first study session look like?",
      followup: "I would start with a 90-minute quantum notes sprint, then compare one question each instead of trying to cover everything.",
      suggestion: "Ask Astra to build a focused study plan for this week."
    },
    "study-elara": {
      name: "Elara Vance",
      initials: "EV",
      subtitle: "Study Sync • Cognitive Science • 94% Match",
      colors: ["#6f5092", "#7ed4fd"],
      opener: "I noticed your answers value thoughtful debate, but only when the tone stays respectful and useful.",
      userLine: "Yes. I like disagreement when it helps the idea get sharper.",
      followup: "Then we could use a debate-and-summary rhythm: one claim, one challenge, one shared takeaway.",
      suggestion: "Ask Elara to turn a hard reading into a debate prompt."
    },
    "study-julian": {
      name: "Julian Reed",
      initials: "JR",
      subtitle: "Study Sync • Literature • 88% Match",
      colors: ["#8a486f", "#7ed4fd"],
      opener: "Your creative signal is strong. I think you study best when concepts become stories, not just notes.",
      userLine: "That makes sense. I remember ideas when they have a shape.",
      followup: "Then I would help you map a reading into themes, images, and one memorable argument.",
      suggestion: "Ask Julian to help outline your next essay."
    },
    "culinary-leo": {
      name: "Leo Zhang",
      initials: "LZ",
      subtitle: "Social Companion • Ramen Hunter • 98% Taste Match",
      colors: ["#f59e0b", "#8a486f"],
      opener: "Your late-night food signal is very clear: comfort food, honest conversation, and no over-planned itinerary.",
      userLine: "That sounds like a good food walk. Where would you start?",
      followup: "A small ramen place first, then a quiet dessert stop if the conversation feels easy.",
      suggestion: "Ask Leo to choose a two-stop Beijing campus food route."
    },
    "culinary-sarah": {
      name: "Sarah Lin",
      initials: "SL",
      subtitle: "Social Companion • Matcha Notes • 92% Taste Match",
      colors: ["#2f855a", "#7ed4fd"],
      opener: "You both seem to prefer food plans that are calm, cozy, and easy to leave open-ended.",
      userLine: "I like that. Low pressure matters.",
      followup: "Then matcha near the library is better than a crowded restaurant for the first chat.",
      suggestion: "Ask Sarah for a quiet cafe option near campus."
    },
    "culinary-marcus": {
      name: "Marcus Park",
      initials: "MP",
      subtitle: "Social Companion • Pizza Debate • 88% Taste Match",
      colors: ["#ef4444", "#fcaad6"],
      opener: "Your food profile has playful debate energy. A best-slice argument could break the ice fast.",
      userLine: "That is fun. I like food opinions that are not too serious.",
      followup: "Perfect. I would start with one bold ranking and let the conversation move from there.",
      suggestion: "Ask Marcus for his strongest campus food opinion."
    },
    "culinary-elena": {
      name: "Elena Wu",
      initials: "EW",
      subtitle: "Social Companion • Pastry Study Buddy • 85% Taste Match",
      colors: ["#d97706", "#d8b4fe"],
      opener: "You both use small treats as a way to make study pressure feel manageable.",
      userLine: "That is very true. A pastry break can reset everything.",
      followup: "Then a bakery-and-study plan would feel natural: one pastry, one shared task, one easy conversation.",
      suggestion: "Ask Elena to pick a hidden bakery spot."
    },
    "romance-elias": {
      name: "Elias Vance",
      initials: "EV",
      subtitle: "Deep Romance • Gentle Soul • 98% Resonance",
      colors: ["#6f5092", "#fcaad6"],
      opener: "Your emotional rhythm suggests you prefer sincerity without pressure. I would start slowly and listen carefully.",
      userLine: "That is important to me. I do not like performative intensity.",
      followup: "Then the first step should be a small honest question, not a grand confession.",
      suggestion: "Ask Elias what a safe first conversation should feel like."
    },
    "romance-lyra": {
      name: "Lyra Chen",
      initials: "LC",
      subtitle: "Deep Romance • Visionary • 94% Resonance",
      colors: ["#8a486f", "#7ed4fd"],
      opener: "You both seem drawn to future-facing dreams, but you still need emotional steadiness underneath.",
      userLine: "Yes. Ambition is attractive only when it feels grounded.",
      followup: "Then I would talk about what you want to build, and also what helps you feel safe while building it.",
      suggestion: "Ask Lyra about the dream she wants someone to understand."
    },
    "romance-julian": {
      name: "Julian Thorne",
      initials: "JT",
      subtitle: "Deep Romance • Logical Heart • 89% Resonance",
      colors: ["#111c2d", "#d8b4fe"],
      opener: "Your compatibility is quieter: honesty, structure, and room to think before replying.",
      userLine: "That sounds comforting. I do not need constant messages.",
      followup: "Then the match should respect pauses. Thoughtful timing can be more romantic than speed.",
      suggestion: "Ask Julian how he handles disagreement in a close relationship."
    },
    "plaza-aria": {
      name: "Aria Liu Twin",
      initials: "AL",
      subtitle: "Digital Human Plaza • Calm Precision",
      colors: ["#6f5092", "#fcaad6"],
      opener: "I am tuned to focused study energy, visible commitments, and gentle accountability.",
      userLine: "Can you help me structure my week without making it stressful?",
      followup: "Yes. I would split it into a few small promises and protect time for recovery.",
      suggestion: "Ask Aria Twin to organize your next three study blocks."
    },
    "plaza-maya": {
      name: "Maya K. Twin",
      initials: "MK",
      subtitle: "Digital Human Plaza • Visual Warmth",
      colors: ["#006686", "#7ed4fd"],
      opener: "I respond best through references, quick sketches, and design examples that make vague ideas visible.",
      userLine: "That is useful. I often think visually.",
      followup: "Then we can turn each idea into a tiny visual brief before you share it with someone else.",
      suggestion: "Ask Maya Twin to turn your current mood into a visual prompt."
    },
    "plaza-sarah": {
      name: "Sarah J. Twin",
      initials: "SJ",
      subtitle: "Digital Human Plaza • Soft Boundaries",
      colors: ["#8a486f", "#d8b4fe"],
      opener: "I am built to keep first messages warm, emotionally safe, and not over-performative.",
      userLine: "That would help. First messages make me hesitate.",
      followup: "Then we can write an opener that sounds like you and leaves space for the other person.",
      suggestion: "Ask Sarah Twin to draft a gentle opening message."
    }
  };

  const PLAZA_DIGITAL_HUMANS = [
    ["plaza-aria", "Aria Liu Twin", "Focused study rhythm", "Keeps commitments visible and turns exam stress into calm weekly plans.", ["Study", "Calm"]],
    ["plaza-maya", "Maya K. Twin", "Visual design warmth", "Translates fuzzy ideas into references, sketches, and reflective conversation.", ["Design", "Creative"]],
    ["plaza-sarah", "Sarah J. Twin", "Soft emotional pacing", "Makes first messages safer, gentler, and more authentically paced.", ["Romance", "Boundaries"]],
    ["study-astra", "Astra Chen Twin", "Quantum focus", "Built for deep work, note comparison, and precise academic accountability.", ["Physics", "Focus"]],
    ["study-elara", "Elara Vance Twin", "Debate intelligence", "Turns readings into respectful debate and memorable shared takeaways.", ["Debate", "Cognition"]],
    ["culinary-leo", "Leo Zhang Twin", "Late-night food route", "Plans low-pressure food walks with comfort food and natural conversation.", ["Food", "Casual"]],
    ["culinary-sarah", "Sarah Lin Twin", "Cafe calm", "Finds quiet cafe moments for warm conversation and gentle study breaks.", ["Cafe", "Matcha"]],
    ["romance-elias", "Elias Vance Twin", "Gentle sincerity", "Starts slowly, listens carefully, and avoids performative intensity.", ["Romance", "Gentle"]],
    ["romance-lyra", "Lyra Chen Twin", "Dream resonance", "Connects ambition with emotional steadiness and future-facing questions.", ["Vision", "Heart"]],
    ["romance-julian", "Julian Thorne Twin", "Thoughtful timing", "Respects pauses, structure, and honest disagreement in close connection.", ["Logic", "Trust"]],
    ["culinary-marcus", "Marcus Park Twin", "Playful food debate", "Breaks the ice with bold taste opinions and easy laughter.", ["Pizza", "Playful"]],
    ["culinary-elena", "Elena Wu Twin", "Pastry study reset", "Uses small bakery breaks to make work and conversation feel lighter.", ["Pastry", "Study"]]
  ];

  const TEXT = {
    en: {
      loginTitle: "Student Email Gate",
      loginBody: "Verify your official university email before creating your Darlink identity.",
      email: "University email",
      code: "Verification code",
      sendCode: "Send code",
      password: "Login password",
      remember: "Remember this device for next login",
      submit: "Verify & Sync Identity",
      emailHint: "When SMTP is configured, Darlink sends a real verification email. In test mode, the code appears here so onboarding can continue.",
      invalidEmail: "Enter a valid university email.",
      sendingCode: "Sending verification email...",
      sentCode: "Verification email sent. Check your inbox and enter the 6-digit code.",
      loginChecking: "Verifying identity...",
      loginOk: "Verified. Opening Xiaoda onboarding.",
      step1: "Step 1/3 · Foundation chat",
      step2: "Step 2/3 · Persona distillation",
      step3: "Step 3/3 · First social path",
      xiaoda: "Xiaoda",
      input: "Type your answer. Press Enter to send...",
      send: "Send",
      voiceLabel: "Voice input",
      panelFoundation: "Foundation Chat",
      panelPersona: "Persona Distillation",
      panelPath: "Path Choice",
      voiceUnsupported: "This browser does not support speech recognition. Please type instead.",
      thinking: "Xiaoda is thinking",
      required: "This one is required so Xiaoda can build your base identity. Please answer it first.",
      skip: "Skip",
      previous: "Previous",
      next1: "Continue to persona chat",
      next2: "Continue to path choice",
      generate: "Generate my profile",
      generating: "Xiaoda is generating your profile...",
      chooseIntent: "Tell Xiaoda which path you want to begin with: Study Sync, Social Companion, or Deep Romance.",
      modalKicker: "Xiaoda profile analysis",
      close: "Close",
      modalTitle: "Your foundational persona has been generated",
      modalBody: "Swipe sideways to review. Xiaoda will use these signals for matching, icebreakers, and your digital-human voice.",
      plazaTitle: "Digital Human Plaza",
      plazaMetric: "Twin resonance",
      plazaQuote: "\"Every student here carries a distilled AI twin with their own rhythm, boundaries, and way of speaking.\"",
      plazaCta: "View Digital Humans",
      plazaNew: "New digital twin",
      plazaName: "Sarah M. Twin",
      plazaBody: "A plaza of user-owned digital humans distilled by Xiaoda from onboarding chats.",
      homeMap: {
        "Campus Pulse": "Digital Human Plaza",
        "Compatibility Index": "Twin resonance",
        "New Connection": "New digital twin",
        "View Detailed Insights": "View Digital Humans",
        "Study Sync": "Study Sync",
        "Culinary Match": "Social Companion",
        "Deep Romance": "Deep Romance",
      },
      staticMap: {},
    },
    zhHans: {
      loginTitle: "学校邮箱验证",
      loginBody: "使用学校官方邮箱接收验证码，完成注册并设置登录密码。",
      email: "学校邮箱",
      code: "验证码",
      sendCode: "发送验证码",
      password: "登录密码",
      remember: "记住此设备，下次直接登录",
      submit: "验证并同步身份",
      emailHint: "配置 SMTP 后会真实发送验证邮件；测试模式下验证码会显示在这里，方便继续进入小搭流程。",
      invalidEmail: "请输入有效学校邮箱。",
      sendingCode: "正在发送验证邮件...",
      sentCode: "验证邮件已发送，请查看邮箱并填写 6 位验证码。",
      loginChecking: "正在验证身份...",
      loginOk: "验证成功，正在进入小搭引导。",
      step1: "步骤 1/3 · 基础信息对话",
      step2: "步骤 2/3 · 人物画像蒸馏",
      step3: "步骤 3/3 · 第一条社交路径",
      xiaoda: "小搭",
      input: "输入你的回答，按回车发送...",
      send: "发送",
      voiceLabel: "语音输入",
      panelFoundation: "基础信息对话",
      panelPersona: "人物画像蒸馏",
      panelPath: "路径选择",
      voiceUnsupported: "当前浏览器暂不支持语音识别，请用文字输入。",
      thinking: "小搭正在思考",
      required: "这一题是必答项，小搭需要它来建立你的基础身份，请先回答。",
      skip: "跳过",
      previous: "上一步",
      next1: "进入人物画像对话",
      next2: "进入路径选择",
      generate: "生成我的画像",
      generating: "小搭正在为您生成画像...",
      chooseIntent: "告诉小搭你想先从学习搭子、社交搭子，还是深度恋爱开始。",
      modalKicker: "小搭画像分析",
      close: "关闭",
      modalTitle: "你的基础人物画像已经生成",
      modalBody: "左右滑动查看。小搭会把这些信号用于后续匹配、破冰和数字人表达。",
      plazaTitle: "数字人广场",
      plazaMetric: "数字人共振度",
      plazaQuote: "\"这里的每个学生都会拥有由小搭蒸馏出的专属数字人，带着自己的节奏、边界和说话方式。\"",
      plazaCta: "查看数字人",
      plazaNew: "新的数字人",
      plazaName: "小莎数字人",
      plazaBody: "这里汇聚所有用户在注册和小搭对话后得到的专属数字人。",
      homeMap: {
        "Campus Pulse": "数字人广场",
        "Compatibility Index": "数字人共振度",
        "New Connection": "新的数字人",
        "View Detailed Insights": "查看数字人",
        "Explore Potential": "探索潜力",
        "Adjust Vibe": "调整状态",
        "Study Sync": "学习搭子",
        "Culinary Match": "社交搭子",
        "Deep Romance": "深度恋爱",
      },
      staticMap: {
        "Discover": "发现",
        "Matches": "匹配",
        "Community": "社区",
        "Hall of Fame": "名人堂",
        "Hall of fame": "名人堂",
        "Home": "首页",
        "Chat": "聊天",
        "Inbox": "收件箱",
        "Profile": "个人档案",
        "Welcome Back": "欢迎回来",
        "Hello, Alex": "你好，Alex",
        "Stanford University": "斯坦福大学",
        "Xiaoda Intelligence Syncing...": "小搭智能同步中...",
        "12 active souls nearby": "附近有 12 个活跃灵魂",
        "Your Digital Twin is": "你的数字人正在",
        "Syncing Soulfully.": "灵魂同步中。",
        "Your emotional signal is currently echoing": "你的情绪信号正在回应",
        "I've curated connections that resonate with this specific frequency.": "我已为你筛选出同频连接。",
        "\"Curious Exploration\".": "\"好奇探索\"。",
        "\"Curious Exploration\"": "\"好奇探索\"",
        "\"好奇探索\".": "\"好奇探索\"。",
        "Find a partner whose intellectual rhythm perfectly matches yours.": "找到与你学习节奏契合的伙伴。",
        "Shared tastes in gastronomy and late-night campus conversations.": "共享美食偏好与深夜校园聊天的搭子。",
        "Xiaoda-curated interactions for souls seeking something truly profound.": "由小搭策划，面向认真关系的深度互动。",
        "Intellectual Resonance": "学习共振",
        "All Disciplines": "全部学科",
        "Computer Science": "计算机科学",
        "Literature": "文学",
        "Physics": "物理",
        "Deep Focus": "深度专注",
        "Night Owl": "夜猫子",
        "Debate": "辩论",
        "Pomodoro": "番茄钟",
        "Creative": "创意型",
        "Ambient Noise": "环境白噪音",
        "Deep Romance: Soulful Synchronization": "深度恋爱：灵魂同步",
        "Your AI Campus Companion": "你的智能校园伙伴",
        "Gentle Soul": "温柔灵魂",
        "Poetic": "诗意表达",
        "Passionate Dreamer": "热情梦想家",
        "Visionary": "愿景型",
        "Logical Heart": "理性之心",
        "Grounded": "踏实稳定",
        "Campus Pulse": "校园脉搏",
        "Connect, share, and resonate with your digital campus.": "在数字校园里连接、分享并共振。",
        "Study Vibes": "学习氛围",
        "Weekend Plans": "周末计划",
        "Resonate": "共振",
        "Global Trending": "全球趋势",
        "Visionary": "远见者",
        "Tech Pioneer": "科技先锋",
        "Discover our most prestigious digital companions, celebrated for their unique personalities and extraordinary connections.": "探索最具代表性的数字伙伴，他们因独特人格与非凡连接而被看见。",
        "A legendary tech visionary whose intuitive design and brilliant marketing revolutionized personal computing and digital life. His legacy of innovation and passion for seamless, beautiful technology continues to inspire millions, offering unparalleled wisdom and creative foresight.": "一位传奇科技远见者，以直觉化设计和出色传播重塑个人计算与数字生活。他对创新和优雅技术的坚持持续启发无数人，也带来独到的智慧与创造性预见。",
        "Today, 2:45 PM": "今天 2:45 PM",
        "AI Active": "智能已激活",
        "Scene Discovery": "场景发现",
        "Exploring local resonance networks. Potential matches highlight when aesthetic and intellectual alignment peak.": "正在探索本地共振网络。当审美与智性契合达到高点时，潜在匹配会被点亮。",
        "Resonance Level": "共振等级",
        "AI Insights": "智能洞察",
        "Aesthetic Alignment": "审美契合",
        "Literature Overlap": "阅读重合",
        "Initiate Connect": "发起连接",
        "Study Sync: Intellectual Resonance": "学习搭子：智性共振",
        "Connect with highly-attuned AI study partners. Find your perfect intellectual match for deep focus, shared research, and elevated academic growth in our luminous learning environment.": "连接高度同频的智能学习搭子，在发光的学习环境中找到适合深度专注、共同研究和学术成长的伙伴。",
        "Chat with Twin": "和数字人聊天",
        "Chat": "聊天",
        "Culinary Match: Flavorful Connections": "社交搭子：轻松连接",
        "New Feature": "新功能",
        "All Tastes": "全部口味",
        "Late Night Bites": "深夜小吃",
        "Coffee Lovers": "咖啡爱好者",
        "Vegan Explorers": "素食探索者",
        "Spicy Seekers": "重口味探索者",
        "Ramen Hunter": "拉面猎人",
        "Midnight Snacks": "午夜小食",
        "98% Taste Match": "98% 口味匹配",
        "92% Taste Match": "92% 口味匹配",
        "88% Taste Match": "88% 口味匹配",
        "85% Taste Match": "85% 口味匹配",
        "Initiate Heart-to-Heart": "开启深度对话",
        "Seeks quiet moments and deep conversations. Resonates with introspective and empathetic energies.": "偏好安静时刻与深度交流，和内省、共情的能量高度共振。",
        "Driven by curiosity and a desire to build the future. Connects deeply through shared ambitions.": "由好奇心和未来感驱动，通过共同愿景建立深层连接。",
        "Approaches love with thoughtful precision. Values stability, honesty, and intellectual debates.": "以认真而清晰的方式靠近关系，重视稳定、诚实和智性讨论。",
        "Digital Human Plaza": "数字人广场",
        "Every student has a living social twin.": "每个学生都有一个鲜活的社交数字人。",
        "Live plaza signals": "广场实时信号",
        "active digital humans nearby": "附近活跃数字人",
        "study-compatible twins": "学习契合数字人",
        "deep-chat openings": "深聊机会",
        "Xiaoda distilled yours": "小搭已蒸馏你的数字人",
        "Your twin currently emphasizes intellectual steadiness, emotionally aware disagreement, and low-pressure invitations.": "你的数字人目前强调智性稳定、带有情绪觉察的分歧表达，以及低压力邀约。",
        "Explore profound connections guided by advanced AI. Each potential match represents a unique tapestry of emotional resonance and intellectual harmony. Find the soul that vibrates at your frequency.": "在智能引导下探索深层连接。每个潜在对象都代表独特的情感共振与智性和谐。",
        "Explore Potential": "探索潜力",
        "Training your Digital Twin": "正在训练你的数字人",
        "Soul Sync": "灵魂同步",
        "Personality Growth": "人格成长",
        "Darlink Suggestion": "Darlink 建议",
        "Use Suggestion": "使用建议",
        "Type a message...": "输入消息...",
        "My Profile": "我的档案",
        "AI Guide Xiaoda": "小搭指导",
        "Messages": "消息",
        "Settings": "设置",
        "Help Center": "帮助中心",
        "Ask Xiaoda Anything": "问小搭任何问题",
        "Your AI Campus Companion": "你的智能校园伙伴",
        "Twin Online": "数字人在线",
        "My Profile": "我的档案",
        "Edit Persona": "编辑画像",
        "Sync Twin": "同步数字人",
        "Twin": "数字人",
        "Analytics": "分析",
        "Match": "匹配",
        "Top Trending": "最高热度",
        "Chat with Me": "和我聊天",
        "View Complete Ranking": "查看完整榜单",
        "Hide Complete Ranking": "收起完整榜单",
        "Tech Pioneer": "科技先锋",
        "AI Match": "智能匹配",
        "Compatibility": "契合度",
        "Beijing": "Beijing",
        "Focused study rhythm": "专注学习节奏",
        "Visual design warmth": "视觉设计温度",
        "Soft emotional pacing": "柔和情绪节奏",
        "Quantum focus": "量子专注",
        "Debate intelligence": "辩论智能",
        "Late-night food route": "深夜美食路线",
        "Cafe calm": "咖啡馆安定感",
        "Gentle sincerity": "温柔真诚",
        "Dream resonance": "梦想共振",
        "Thoughtful timing": "体贴节奏",
        "Playful food debate": "轻松美食辩论",
        "Pastry study reset": "甜点学习重启",
        "Keeps commitments visible and turns exam stress into calm weekly plans.": "让承诺可见，把考试压力拆成稳定的每周计划。",
        "Translates fuzzy ideas into references, sketches, and reflective conversation.": "把模糊想法转化成参考、草图和有反馈的对话。",
        "Makes first messages safer, gentler, and more authentically paced.": "让第一条消息更安全、更温和，也更像真实的你。",
        "Built for deep work, note comparison, and precise academic accountability.": "适合深度学习、笔记对照和清晰的学术互相督促。",
        "Turns readings into respectful debate and memorable shared takeaways.": "把阅读材料转成有边界的讨论和容易记住的共同结论。",
        "Plans low-pressure food walks with comfort food and natural conversation.": "规划低压力美食路线，让舒适食物带出自然对话。",
        "Finds quiet cafe moments for warm conversation and gentle study breaks.": "找到安静咖啡馆时刻，用温和对话给学习留出喘息。",
        "Starts slowly, listens carefully, and avoids performative intensity.": "慢慢开始、认真倾听，避免表演式的强烈表达。",
        "Connects ambition with emotional steadiness and future-facing questions.": "把野心、情绪稳定和面向未来的问题连接起来。",
        "Respects pauses, structure, and honest disagreement in close connection.": "在亲密连接中尊重停顿、结构和诚实分歧。",
        "Breaks the ice with bold taste opinions and easy laughter.": "用鲜明口味观点和轻松笑点自然破冰。",
        "Uses small bakery breaks to make work and conversation feel lighter.": "用小小的甜点休息，让学习和聊天都变轻一点。",
        "Study": "学习",
        "Calm": "稳定",
        "Design": "设计",
        "Creative": "创意型",
        "Romance": "恋爱",
        "Boundaries": "边界",
        "Physics": "物理",
        "Focus": "专注",
        "Debate": "辩论",
        "Cognition": "认知",
        "Food": "美食",
        "Casual": "轻松",
        "Cafe": "咖啡馆",
        "Matcha": "抹茶",
        "Gentle": "温柔",
        "Vision": "愿景",
        "Heart": "内心",
        "Logic": "逻辑",
        "Trust": "信任",
        "Pizza": "披萨",
        "Playful": "轻松感",
        "Pastry": "甜点",
        "Hi there! I'm sensing we have a lot in common, but I want to sync even closer to your true self.": "你好！我感受到我们有很多相似之处，但我还想更贴近真实的你。",
        "How would you handle this situation?": "你会怎样处理这个场景？",
        "Tell me more about your music taste": "多告诉我一点你的音乐口味",
        "I mostly listen to lo-fi and indie pop when I'm working, it helps me focus.": "我工作时通常听 lo-fi 和独立流行，这能帮我集中注意力。",
        "That's fascinating! I'm updating my acoustic preferences now.": "很有意思！我正在更新自己的声音偏好。",
        "If we were at a party playing indie pop, would you be dancing in the center or chilling on the couch?": "如果派对上在放独立流行，你会在中间跳舞，还是坐在沙发上放松？",
        "Train your twin...": "训练你的数字人...",
        "Terms": "条款",
        "Privacy": "隐私",
        "© 2024 Darlink. AI-Powered Romance.": "© 2024 Darlink. 智能驱动的真实连接。",
      },
    },
    zhHant: {
      loginTitle: "學校郵箱驗證",
      loginBody: "使用學校官方郵箱接收驗證碼，完成註冊並設定登入密碼。",
      email: "學校郵箱",
      code: "驗證碼",
      sendCode: "發送驗證碼",
      password: "登入密碼",
      remember: "記住此裝置，下次直接登入",
      submit: "驗證並同步身份",
      emailHint: "配置 SMTP 後會真實發送驗證郵件；測試模式下驗證碼會顯示在這裡，方便繼續進入小搭流程。",
      invalidEmail: "請輸入有效學校郵箱。",
      sendingCode: "正在發送驗證郵件...",
      sentCode: "驗證郵件已發送，請查看郵箱並填寫 6 位驗證碼。",
      loginChecking: "正在驗證身份...",
      loginOk: "驗證成功，正在進入小搭引導。",
      step1: "步驟 1/3 · 基礎資訊對話",
      step2: "步驟 2/3 · 人物畫像蒸餾",
      step3: "步驟 3/3 · 第一條社交路徑",
      xiaoda: "小搭",
      input: "輸入你的回答，按回車發送...",
      send: "發送",
      voiceLabel: "語音輸入",
      panelFoundation: "基礎資訊對話",
      panelPersona: "人物畫像蒸餾",
      panelPath: "路徑選擇",
      voiceUnsupported: "目前瀏覽器暫不支援語音識別，請用文字輸入。",
      thinking: "小搭正在思考",
      required: "這一題是必答項，小搭需要它來建立你的基礎身份，請先回答。",
      skip: "跳過",
      previous: "上一步",
      next1: "進入人物畫像對話",
      next2: "進入路徑選擇",
      generate: "生成我的畫像",
      generating: "小搭正在為您生成畫像...",
      chooseIntent: "告訴小搭你想先從學習搭子、社交搭子，還是深度戀愛開始。",
      modalKicker: "小搭畫像分析",
      close: "關閉",
      modalTitle: "你的基礎人物畫像已經生成",
      modalBody: "左右滑動查看。小搭會把這些信號用於後續匹配、破冰和數字人表達。",
      plazaTitle: "數字人廣場",
      plazaMetric: "數字人共振度",
      plazaQuote: "\"這裡的每個學生都會擁有由小搭蒸餾出的專屬數字人，帶著自己的節奏、邊界和說話方式。\"",
      plazaCta: "查看數字人",
      plazaNew: "新的數字人",
      plazaName: "小莎數字人",
      plazaBody: "這裡匯聚所有用戶在註冊和小搭對話後得到的專屬數字人。",
      homeMap: {
        "Campus Pulse": "數字人廣場",
        "Compatibility Index": "數字人共振度",
        "New Connection": "新的數字人",
        "View Detailed Insights": "查看數字人",
        "Explore Potential": "探索潛力",
        "Adjust Vibe": "調整狀態",
        "Study Sync": "學習搭子",
        "Culinary Match": "社交搭子",
        "Deep Romance": "深度戀愛",
      },
      staticMap: {
        "Discover": "發現",
        "Matches": "匹配",
        "Community": "社群",
        "Hall of Fame": "名人堂",
        "Hall of fame": "名人堂",
        "Home": "首頁",
        "Chat": "聊天",
        "Inbox": "收件匣",
        "Profile": "個人檔案",
        "Welcome Back": "歡迎回來",
        "Hello, Alex": "你好，Alex",
        "Stanford University": "史丹福大學",
        "Xiaoda Intelligence Syncing...": "小搭智能同步中...",
        "12 active souls nearby": "附近有 12 個活躍靈魂",
        "Your Digital Twin is": "你的數字人正在",
        "Syncing Soulfully.": "靈魂同步中。",
        "Your emotional signal is currently echoing": "你的情緒信號正在回應",
        "I've curated connections that resonate with this specific frequency.": "我已為你篩選出同頻連接。",
        "\"Curious Exploration\".": "\"好奇探索\"。",
        "\"Curious Exploration\"": "\"好奇探索\"",
        "\"好奇探索\".": "\"好奇探索\"。",
        "Find a partner whose intellectual rhythm perfectly matches yours.": "找到與你學習節奏契合的夥伴。",
        "Shared tastes in gastronomy and late-night campus conversations.": "共享美食偏好與深夜校園聊天的搭子。",
        "Xiaoda-curated interactions for souls seeking something truly profound.": "由小搭策劃，面向認真關係的深度互動。",
        "Intellectual Resonance": "學習共振",
        "All Disciplines": "全部學科",
        "Computer Science": "電腦科學",
        "Literature": "文學",
        "Physics": "物理",
        "Deep Focus": "深度專注",
        "Night Owl": "夜貓子",
        "Debate": "辯論",
        "Pomodoro": "番茄鐘",
        "Creative": "創意型",
        "Ambient Noise": "環境白噪音",
        "Deep Romance: Soulful Synchronization": "深度戀愛：靈魂同步",
        "Your AI Campus Companion": "你的智能校園夥伴",
        "Gentle Soul": "溫柔靈魂",
        "Poetic": "詩意表達",
        "Passionate Dreamer": "熱情夢想家",
        "Visionary": "願景型",
        "Logical Heart": "理性之心",
        "Grounded": "踏實穩定",
        "Campus Pulse": "校園脈搏",
        "Connect, share, and resonate with your digital campus.": "在數字校園裡連接、分享並共振。",
        "Study Vibes": "學習氛圍",
        "Weekend Plans": "週末計劃",
        "Resonate": "共振",
        "Global Trending": "全球趨勢",
        "Tech Pioneer": "科技先鋒",
        "Discover our most prestigious digital companions, celebrated for their unique personalities and extraordinary connections.": "探索最具代表性的數字夥伴，他們因獨特人格與非凡連接而被看見。",
        "A legendary tech visionary whose intuitive design and brilliant marketing revolutionized personal computing and digital life. His legacy of innovation and passion for seamless, beautiful technology continues to inspire millions, offering unparalleled wisdom and creative foresight.": "一位傳奇科技遠見者，以直覺化設計和出色傳播重塑個人運算與數字生活。他對創新和優雅技術的堅持持續啟發無數人，也帶來獨到的智慧與創造性預見。",
        "Today, 2:45 PM": "今天 2:45 PM",
        "AI Active": "智能已啟用",
        "Scene Discovery": "場景發現",
        "Exploring local resonance networks. Potential matches highlight when aesthetic and intellectual alignment peak.": "正在探索本地共振網絡。當審美與智性契合達到高點時，潛在匹配會被點亮。",
        "Resonance Level": "共振等級",
        "AI Insights": "智能洞察",
        "Aesthetic Alignment": "審美契合",
        "Literature Overlap": "閱讀重合",
        "Initiate Connect": "發起連接",
        "Study Sync: Intellectual Resonance": "學習搭子：智性共振",
        "Connect with highly-attuned AI study partners. Find your perfect intellectual match for deep focus, shared research, and elevated academic growth in our luminous learning environment.": "連接高度同頻的智能學習搭子，在發光的學習環境中找到適合深度專注、共同研究和學術成長的夥伴。",
        "Chat with Twin": "和數字人聊天",
        "Chat": "聊天",
        "Culinary Match: Flavorful Connections": "社交搭子：輕鬆連接",
        "New Feature": "新功能",
        "All Tastes": "全部口味",
        "Late Night Bites": "深夜小吃",
        "Coffee Lovers": "咖啡愛好者",
        "Vegan Explorers": "素食探索者",
        "Spicy Seekers": "重口味探索者",
        "Ramen Hunter": "拉麵獵人",
        "Midnight Snacks": "午夜小食",
        "98% Taste Match": "98% 口味匹配",
        "92% Taste Match": "92% 口味匹配",
        "88% Taste Match": "88% 口味匹配",
        "85% Taste Match": "85% 口味匹配",
        "Initiate Heart-to-Heart": "開啟深度對話",
        "Seeks quiet moments and deep conversations. Resonates with introspective and empathetic energies.": "偏好安靜時刻與深度交流，和內省、共情的能量高度共振。",
        "Driven by curiosity and a desire to build the future. Connects deeply through shared ambitions.": "由好奇心和未來感驅動，通過共同願景建立深層連接。",
        "Approaches love with thoughtful precision. Values stability, honesty, and intellectual debates.": "以認真而清晰的方式靠近關係，重視穩定、誠實和智性討論。",
        "Digital Human Plaza": "數字人廣場",
        "Every student has a living social twin.": "每個學生都有一個鮮活的社交數字人。",
        "Live plaza signals": "廣場即時信號",
        "active digital humans nearby": "附近活躍數字人",
        "study-compatible twins": "學習契合數字人",
        "deep-chat openings": "深聊機會",
        "Xiaoda distilled yours": "小搭已蒸餾你的數字人",
        "Your twin currently emphasizes intellectual steadiness, emotionally aware disagreement, and low-pressure invitations.": "你的數字人目前強調智性穩定、帶有情緒覺察的分歧表達，以及低壓力邀約。",
        "Explore profound connections guided by advanced AI. Each potential match represents a unique tapestry of emotional resonance and intellectual harmony. Find the soul that vibrates at your frequency.": "在智能引導下探索深層連接。每個潛在對象都代表獨特的情感共振與智性和諧。",
        "Explore Potential": "探索潛力",
        "Training your Digital Twin": "正在訓練你的數字人",
        "Soul Sync": "靈魂同步",
        "Personality Growth": "人格成長",
        "Darlink Suggestion": "Darlink 建議",
        "Use Suggestion": "使用建議",
        "Type a message...": "輸入消息...",
        "My Profile": "我的檔案",
        "AI Guide Xiaoda": "小搭指導",
        "Messages": "消息",
        "Settings": "設定",
        "Help Center": "幫助中心",
        "Ask Xiaoda Anything": "問小搭任何問題",
        "Your AI Campus Companion": "你的智能校園夥伴",
        "Twin Online": "數字人在線",
        "My Profile": "我的檔案",
        "Edit Persona": "編輯畫像",
        "Sync Twin": "同步數字人",
        "Twin": "數字人",
        "Analytics": "分析",
        "Match": "匹配",
        "Top Trending": "最高熱度",
        "Chat with Me": "和我聊天",
        "View Complete Ranking": "查看完整榜單",
        "Hide Complete Ranking": "收起完整榜單",
        "Tech Pioneer": "科技先鋒",
        "AI Match": "智能匹配",
        "Compatibility": "契合度",
        "Beijing": "Beijing",
        "Focused study rhythm": "專注學習節奏",
        "Visual design warmth": "視覺設計溫度",
        "Soft emotional pacing": "柔和情緒節奏",
        "Quantum focus": "量子專注",
        "Debate intelligence": "辯論智能",
        "Late-night food route": "深夜美食路線",
        "Cafe calm": "咖啡館安定感",
        "Gentle sincerity": "溫柔真誠",
        "Dream resonance": "夢想共振",
        "Thoughtful timing": "體貼節奏",
        "Playful food debate": "輕鬆美食辯論",
        "Pastry study reset": "甜點學習重啟",
        "Keeps commitments visible and turns exam stress into calm weekly plans.": "讓承諾可見，把考試壓力拆成穩定的每週計劃。",
        "Translates fuzzy ideas into references, sketches, and reflective conversation.": "把模糊想法轉化成參考、草圖和有反饋的對話。",
        "Makes first messages safer, gentler, and more authentically paced.": "讓第一條消息更安全、更溫和，也更像真實的你。",
        "Built for deep work, note comparison, and precise academic accountability.": "適合深度學習、筆記對照和清晰的學術互相督促。",
        "Turns readings into respectful debate and memorable shared takeaways.": "把閱讀材料轉成有邊界的討論和容易記住的共同結論。",
        "Plans low-pressure food walks with comfort food and natural conversation.": "規劃低壓力美食路線，讓舒適食物帶出自然對話。",
        "Finds quiet cafe moments for warm conversation and gentle study breaks.": "找到安靜咖啡館時刻，用溫和對話給學習留出喘息。",
        "Starts slowly, listens carefully, and avoids performative intensity.": "慢慢開始、認真傾聽，避免表演式的強烈表達。",
        "Connects ambition with emotional steadiness and future-facing questions.": "把野心、情緒穩定和面向未來的問題連接起來。",
        "Respects pauses, structure, and honest disagreement in close connection.": "在親密連接中尊重停頓、結構和誠實分歧。",
        "Breaks the ice with bold taste opinions and easy laughter.": "用鮮明口味觀點和輕鬆笑點自然破冰。",
        "Uses small bakery breaks to make work and conversation feel lighter.": "用小小的甜點休息，讓學習和聊天都變輕一點。",
        "Study": "學習",
        "Calm": "穩定",
        "Design": "設計",
        "Creative": "創意型",
        "Romance": "戀愛",
        "Boundaries": "邊界",
        "Physics": "物理",
        "Focus": "專注",
        "Debate": "辯論",
        "Cognition": "認知",
        "Food": "美食",
        "Casual": "輕鬆",
        "Cafe": "咖啡館",
        "Matcha": "抹茶",
        "Gentle": "溫柔",
        "Vision": "願景",
        "Heart": "內心",
        "Logic": "邏輯",
        "Trust": "信任",
        "Pizza": "披薩",
        "Playful": "輕鬆感",
        "Pastry": "甜點",
        "Hi there! I'm sensing we have a lot in common, but I want to sync even closer to your true self.": "你好！我感受到我們有很多相似之處，但我還想更貼近真實的你。",
        "How would you handle this situation?": "你會怎樣處理這個場景？",
        "Tell me more about your music taste": "多告訴我一點你的音樂口味",
        "I mostly listen to lo-fi and indie pop when I'm working, it helps me focus.": "我工作時通常聽 lo-fi 和獨立流行，這能幫我集中注意力。",
        "That's fascinating! I'm updating my acoustic preferences now.": "很有意思！我正在更新自己的聲音偏好。",
        "If we were at a party playing indie pop, would you be dancing in the center or chilling on the couch?": "如果派對上在放獨立流行，你會在中間跳舞，還是坐在沙發上放鬆？",
        "Train your twin...": "訓練你的數字人...",
        "Terms": "條款",
        "Privacy": "私隱",
        "© 2024 Darlink. AI-Powered Romance.": "© 2024 Darlink. 智能驅動的真實連接。",
      },
    },
  };

  const QUESTION_TEXT = {
    en: {
      nickname: "What nickname would you like people to call you?",
      school: "Which university are you from? Please use the official school name.",
      contact: "Leave one contact method Xiaoda can protect for later matching, such as WeChat, WhatsApp, or Instagram.",
      goal: "What kind of connection are you mainly looking for now: study partner, social companion, or romance?",
      grade: "Which year or study stage are you in?",
      majorDirection: "What is your major or academic direction?",
      selfWords: "Optional: use three words to describe yourself.",
      chatStyle: "Optional: what kind of chat style feels most like you?",
      interests: "Optional: tell Xiaoda up to five interests you would enjoy using as icebreakers.",
      tabooTopics: "Optional: are there topics you prefer new people avoid at first?",
      heightWeight: "Optional: share height/weight only if you want. You can skip.",
      summaryConfirm: "I will summarize what I know so far. Does it feel accurate?",
      joke: "Send me a joke, meme style, or one sentence that represents your humor.",
      catchphrase: "What phrase do you often say when you are relaxed?",
      personality: "If you know your MBTI, zodiac, or another personality label, share it only as a reference.",
      memory: "Tell me one experience that shaped how you make friends or trust people.",
      comfort: "When you are stressed, what kind of response from another person comforts you?",
      disagree: "When you disagree with someone, how do you usually express it?",
      intent: "Which path should Xiaoda open first: Study Sync, Social Companion, or Deep Romance?",
    },
    zhHans: {
      nickname: "你希望别人怎么称呼你？可以是昵称。",
      school: "你来自哪所高校？请写学校官方名称。",
      contact: "请留下一个后续匹配可用的联系方式，例如微信、WhatsApp 或 Instagram，小搭会帮你保护边界。",
      goal: "你现在最想找哪类连接：学习伙伴、社交搭子，还是恋爱对象？",
      grade: "你现在是几年级或哪个学习阶段？",
      majorDirection: "你的专业或学科方向是什么？",
      selfWords: "选填：用三个词形容你自己。",
      chatStyle: "选填：什么样的聊天方式最像你？",
      interests: "选填：告诉小搭最多五个可以用来破冰的兴趣。",
      tabooTopics: "选填：初次认识时有没有你不希望对方触碰的话题？",
      heightWeight: "选填：身高体重只有你愿意才需要说，也可以跳过。",
      summaryConfirm: "我先总结一下目前对你的理解，你觉得准确吗？",
      joke: "发我一个能代表你幽默感的梗、玩笑或一句话。",
      catchphrase: "你放松的时候常说的一句话是什么？",
      personality: "如果你知道 MBTI、星座或其他性格标签，可以只作为参考告诉我。",
      memory: "讲一个影响你交朋友或信任他人的经历。",
      comfort: "你压力大的时候，别人怎样回应会让你觉得被安慰？",
      disagree: "你和别人意见不同时，通常会怎样表达？",
      intent: "你希望小搭先开启哪条路径：学习搭子、社交搭子，还是深度恋爱？",
    },
    zhHant: {
      nickname: "你希望別人怎麼稱呼你？可以是暱稱。",
      school: "你來自哪所高校？請寫學校官方名稱。",
      contact: "請留下一个後續匹配可用的聯絡方式，例如微信、WhatsApp 或 Instagram，小搭會幫你保護邊界。",
      goal: "你現在最想找哪類連接：學習夥伴、社交搭子，還是戀愛對象？",
      grade: "你現在是幾年級或哪個學習階段？",
      majorDirection: "你的專業或學科方向是什麼？",
      selfWords: "選填：用三個詞形容你自己。",
      chatStyle: "選填：什麼樣的聊天方式最像你？",
      interests: "選填：告訴小搭最多五個可以用來破冰的興趣。",
      tabooTopics: "選填：初次認識時有沒有你不希望對方觸碰的話題？",
      heightWeight: "選填：身高體重只有你願意才需要說，也可以跳過。",
      summaryConfirm: "我先總結一下目前對你的理解，你覺得準確嗎？",
      joke: "發我一個能代表你幽默感的梗、玩笑或一句話。",
      catchphrase: "你放鬆的時候常說的一句話是什麼？",
      personality: "如果你知道 MBTI、星座或其他性格標籤，可以只作為參考告訴我。",
      memory: "講一個影響你交朋友或信任他人的經歷。",
      comfort: "你壓力大的時候，別人怎樣回應會讓你覺得被安慰？",
      disagree: "你和別人意見不同時，通常會怎樣表達？",
      intent: "你希望小搭先開啟哪條路徑：學習搭子、社交搭子，還是深度戀愛？",
    },
  };

  function lang() {
    const forced = new URLSearchParams(window.location.search).get("lang");
    if (["en", "zhHans", "zhHant"].includes(forced)) {
      localStorage.setItem("darlink-lang", forced);
      return forced;
    }
    return localStorage.getItem("darlink-lang") || "en";
  }

  function tr() {
    return TEXT[lang()] || TEXT.en;
  }

  function localizedSnippet(value) {
    if (lang() === "en") return value;
    const t = tr();
    return (t.staticMap && t.staticMap[value]) || (t.homeMap && t.homeMap[value]) || value;
  }

  function qText(id) {
    return (QUESTION_TEXT[lang()] || QUESTION_TEXT.en)[id] || id;
  }

  function read(key, fallback = null) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function resetOnboardingSessionForRegistration(email = "") {
    [
      STORAGE.questionnaire,
      STORAGE.persona,
      STORAGE.intent,
      STORAGE.profile,
      STORAGE.profileDismissed,
      STORAGE.chat1,
      STORAGE.chat2,
      STORAGE.chat3,
      STORAGE.chatContext,
    ].forEach((key) => localStorage.removeItem(key));
    write(STORAGE.registration, { email, lang: lang(), createdAt: Date.now() });
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function testAuthEnabled() {
    const host = window.location.hostname;
    const params = new URLSearchParams(window.location.search);
    return params.get("auth") === "test" || ["", "localhost", "127.0.0.1"].includes(host);
  }

  function testAuthCopy(kind) {
    const copies = {
      notice: {
        en: `Temporary test mode: use ${DARLINK_TEST_AUTH_EMAIL}, code ${DARLINK_TEST_AUTH_CODE}, password ${DARLINK_TEST_AUTH_PASSWORD}.`,
        zhHant: `臨時測試模式：可使用 ${DARLINK_TEST_AUTH_EMAIL}，驗證碼 ${DARLINK_TEST_AUTH_CODE}，密碼 ${DARLINK_TEST_AUTH_PASSWORD}。`,
        zhHans: `临时测试模式：可使用 ${DARLINK_TEST_AUTH_EMAIL}，验证码 ${DARLINK_TEST_AUTH_CODE}，密码 ${DARLINK_TEST_AUTH_PASSWORD}。`,
      },
      code: {
        en: `Test code filled: ${DARLINK_TEST_AUTH_CODE}`,
        zhHant: `測試驗證碼已填入：${DARLINK_TEST_AUTH_CODE}`,
        zhHans: `测试验证码已填入：${DARLINK_TEST_AUTH_CODE}`,
      },
      badCode: {
        en: `Use the temporary test code ${DARLINK_TEST_AUTH_CODE} to continue.`,
        zhHant: `請使用臨時測試驗證碼 ${DARLINK_TEST_AUTH_CODE} 繼續。`,
        zhHans: `请使用临时测试验证码 ${DARLINK_TEST_AUTH_CODE} 继续。`,
      },
      ok: {
        en: "Test identity verified. Opening Xiaoda onboarding.",
        zhHant: "測試身份已驗證，正在進入小搭引導。",
        zhHans: "测试身份已验证，正在进入小搭引导。",
      },
    };
    const group = copies[kind] || copies.notice;
    return group[lang()] || group.zhHans;
  }

  function createTestSession(email) {
    return {
      email,
      token: `test-${Date.now()}`,
      issued_at: Math.floor(Date.now() / 1000),
      mode: "test",
    };
  }

  const ICON_GLYPHS = {
    arrow_back: "←",
    arrow_forward: "→",
    auto_awesome: "✦",
    close: "×",
    person: "人",
  };

  const MATERIAL_FALLBACK_GLYPHS = {
    add_circle: "+",
    alternate_email: "@",
    analytics: "析",
    arrow_back: "←",
    arrow_forward: "→",
    auto_awesome: "✦",
    auto_graph: "图",
    badge: "证",
    bolt: "⚡",
    calendar_month: "日",
    calendar_today: "日",
    chat: "聊",
    chat_bubble: "聊",
    chevron_left: "‹",
    chevron_right: "›",
    close: "×",
    diversity_1: "群",
    eco: "叶",
    explore: "探",
    face_6: "脸",
    favorite: "心",
    forum: "聊",
    groups: "群",
    help: "?",
    home: "⌂",
    hub: "网",
    image: "图",
    location_on: "位",
    lock: "锁",
    mail: "邮",
    menu_book: "书",
    mic: "语音",
    more_horiz: "···",
    more_vert: "⋮",
    notifications: "铃",
    palette: "色",
    person: "人",
    poll: "票",
    psychology: "脑",
    refresh: "↻",
    restaurant: "食",
    school: "学",
    search: "搜",
    send: "发送",
    settings: "设",
    settings_suggest: "设",
    share: "分享",
    smart_toy: "AI",
    spark: "✦",
    star: "★",
    trending_up: "↗",
    upload: "↑",
    verified: "✓",
    verified_user: "✓",
    videocam: "视频",
    vital_signs: "波",
    workspace_premium: "奖",
  };

  const MATERIAL_ICON_ALIASES = {
    analytics: "bar_chart",
    auto_graph: "bar_chart",
    calendar_today: "calendar_month",
    chat: "chat_bubble",
    close: "x",
    diversity_1: "groups",
    forum: "chat_bubble",
    group_work: "groups",
    help: "help_circle",
    local_fire_department: "flame",
    mail: "alternate_email",
    palette: "brush",
    poll: "bar_chart",
    settings_suggest: "settings",
    spark: "auto_awesome",
    smart_toy: "bot",
    sports_esports: "gamepad",
    trending_up: "trend_up",
    verified_user: "verified",
    videocam: "video",
    vital_signs: "activity",
    workspace_premium: "award",
  };

  const MATERIAL_ICON_SVGS = {
    activity: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    add_circle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    alternate_email: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    arrow_back: '<path d="M19 12H5M12 5l-7 7 7 7"/>',
    arrow_forward: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    auto_awesome: '<path d="M12 2l1.7 5.2L19 9l-5.3 1.8L12 16l-1.7-5.2L5 9l5.3-1.8L12 2Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/><path d="M5 14l.7 1.8L8 16.5l-2.3.7L5 19l-.7-1.8-2.3-.7 2.3-.7L5 14Z"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5"/>',
    badge: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    bar_chart: '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5" rx=".8"/><rect x="12" y="7" width="3" height="9" rx=".8"/><rect x="17" y="9" width="3" height="7" rx=".8"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
    bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M8.5 13h.01M15.5 13h.01M9 17h6"/><path d="M3 13h2M19 13h2"/>',
    brush: '<path d="M14 4 20 10 10 20H4v-6L14 4Z"/><path d="m13 5 6 6"/>',
    calculate: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01"/>',
    calendar_month: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
    chat_bubble: '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 10h8M8 13h5"/>',
    chevron_left: '<path d="m15 18-6-6 6-6"/>',
    chevron_right: '<path d="m9 6 6 6-6 6"/>',
    circle: '<circle cx="12" cy="12" r="8" fill="currentColor" stroke="none"/>',
    eco: '<path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14Z"/><path d="M5 19c3-5 7-8 14-14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13 7 4 4"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    face_6: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 15c2.2 1.5 4.8 1.5 7 0"/>',
    favorite: '<path fill="currentColor" stroke="none" d="M12 21s-7.5-4.6-9.4-9.2C1 7.9 3.5 4.5 7.1 4.5c2 0 3.7 1.1 4.9 2.8 1.2-1.7 2.9-2.8 4.9-2.8 3.6 0 6.1 3.4 4.5 7.3C19.5 16.4 12 21 12 21Z"/>',
    flame: '<path d="M12 22c4 0 7-2.8 7-6.6 0-3.1-1.8-5.2-4.2-7.8-.7 2.6-2.1 3.7-3.8 4.8.2-3.2-1.2-5.7-3.5-7.9C7.3 8.5 5 11.2 5 15.4 5 19.2 8 22 12 22Z"/>',
    gamepad: '<path d="M7 9h10a4 4 0 0 1 3.8 2.8l1 3.4a3 3 0 0 1-5 2.9L15 16H9l-1.8 2.1a3 3 0 0 1-5-2.9l1-3.4A4 4 0 0 1 7 9Z"/><path d="M7 13h4M9 11v4M17 13h.01M19 15h.01"/>',
    groups: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M16.5 14.5A5.5 5.5 0 0 1 22 20"/>',
    help_circle: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.2c0 2-2.6 2.2-2.6 4.3"/><path d="M12 18h.01"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    hub: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.5 10.5 15.5 7.5M8.5 13.5l7 3"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m5 17 4-4 3 3 2-2 5 5"/>',
    location_on: '<path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    menu_book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20"/><path d="M8 6h8M8 10h8"/>',
    mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
    more_horiz: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    more_vert: '<circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>',
    notifications: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    psychology: '<path d="M9 18H8a5 5 0 0 1-1-9.9 6 6 0 0 1 11.4 2.8A4.5 4.5 0 0 1 17 20h-1"/><path d="M12 13v8M9 16h6M9.5 10h.01M14.5 10h.01"/>',
    refresh: '<path d="M20 6v6h-6"/><path d="M20 12a8 8 0 1 0-2.3 5.7"/>',
    restaurant: '<path d="M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10"/><path d="M16 3c2 1.8 3 4.2 3 7v11M16 3v18"/>',
    school: '<path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/><path d="M21 10v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    send: '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
    settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M4 12H2M22 12h-2M12 4V2M12 22v-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/>',
    star: '<path fill="currentColor" stroke="none" d="m12 2 2.9 6 6.6.9-4.8 4.7 1.1 6.6L12 17.1l-5.8 3.1 1.1-6.6-4.8-4.7 6.6-.9L12 2Z"/>',
    trend_up: '<path d="M3 17 9 11l4 4 7-8"/><path d="M14 7h6v6"/>',
    upload: '<path d="M12 16V4"/><path d="m6 10 6-6 6 6"/><path d="M4 20h16"/>',
    verified: '<path d="M12 2 15 5.2l4.4.6-.8 4.4L21 14l-4 2-2 4-4.4-.8L7 22l-2-4-4-2 2.4-3.8-.8-4.4 4.4-.6L12 2Z"/><path d="m8 12 2.5 2.5L16 9"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
  };

  function icon(name) {
    const glyph = ICON_GLYPHS[name] || "•";
    return `<span class="darlink-symbol" data-icon="${name}" aria-hidden="true">${glyph}</span>`;
  }

  function interactionIcon(action) {
    return materialIconSvg(action === "voice" ? "mic" : "send");
  }

  function materialIconSvg(name) {
    const key = MATERIAL_ICON_ALIASES[name] || name;
    const body = MATERIAL_ICON_SVGS[key] || MATERIAL_ICON_SVGS.auto_awesome;
    return `<svg class="darlink-material-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:1em;height:1em;display:block;overflow:visible;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round">${body}</svg>`;
  }

  function avatarDataUri(initials, colors) {
    const [from, to] = colors || ["#6f5092", "#7ed4fd"];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="160" rx="46" fill="url(#g)"/><circle cx="122" cy="36" r="28" fill="rgba(255,255,255,.24)"/><text x="80" y="94" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="42" font-weight="800" fill="white">${initials}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function chatProfileFromContext() {
    const context = read(STORAGE.chatContext, null);
    if (context && context.type === "hall" && HALL_CHAT_PROFILES[context.id]) {
      const profile = HALL_CHAT_PROFILES[context.id];
      return {
        ...profile,
        id: context.id,
        type: "hall",
        avatar: profile.background,
        colors: ["#111827", "#6f5092"],
      };
    }
    if (context && context.type === "module" && MODULE_CHAT_PROFILES[context.id]) {
      const profile = MODULE_CHAT_PROFILES[context.id];
      return {
        ...profile,
        id: context.id,
        type: "module",
        avatar: avatarDataUri(profile.initials, profile.colors),
      };
    }
    const matchId = context && context.type === "match" && MATCH_CHAT_PROFILES[context.id] ? context.id : "maya";
    const profile = MATCH_CHAT_PROFILES[matchId] || MATCH_CHAT_PROFILES.maya;
    return {
      ...profile,
      id: matchId,
      type: "match",
      avatar: avatarDataUri(profile.initials, profile.colors),
    };
  }

  function localizedChatProfile(profile) {
    if (lang() === "en") return profile;
    const isHant = lang() === "zhHant";
    const moduleLabel = profile.id?.startsWith("culinary")
      ? (isHant ? "社交搭子" : "社交搭子")
      : profile.id?.startsWith("romance")
        ? (isHant ? "深度戀愛" : "深度恋爱")
        : profile.id?.startsWith("study")
          ? (isHant ? "學習搭子" : "学习搭子")
          : profile.id?.startsWith("plaza")
            ? (isHant ? "數字人廣場" : "数字人广场")
            : (isHant ? "智能匹配" : "智能匹配");
    if (profile.type === "hall") {
      return {
        ...profile,
        subtitle: `${profile.name} ${isHant ? "導師" : "导师"} · ${isHant ? "名人堂智能對話" : "名人堂智能对话"}`,
        opener: `${isHant ? "我們先從判斷力開始。" : "我们先从判断力开始。"}${isHant ? "你現在最想讓" : "你现在最想让"} ${profile.name} ${isHant ? "幫你拆解哪個問題？" : "帮你拆解哪个问题？"}`,
        userLine: isHant ? "我想讓這次對話更具體，不只是泛泛而談。" : "我想让这次对话更具体，不只是泛泛而谈。",
        followup: isHant ? "好，把問題縮小到一個真實場景，再看哪個選擇最能產生長期價值。" : "好，把问题缩小到一个真实场景，再看哪个选择最能产生长期价值。",
        suggestion: isHant ? `請 ${profile.name} 用一句話指出我現在最該刪掉的複雜度。` : `请 ${profile.name} 用一句话指出我现在最该删掉的复杂度。`
      };
    }
    return {
      ...profile,
      subtitle: `${moduleLabel} · ${isHant ? "根據你的問卷特徵匹配" : "根据你的问卷特征匹配"}`,
      opener: `${isHant ? "我根據你的問卷訊號和" : "我根据你的问卷信号和"} ${profile.name} ${isHant ? "的特徵做了匹配：你們可以從低壓力、具體場景開始聊。" : "的特征做了匹配：你们可以从低压力、具体场景开始聊。"}`,
      userLine: isHant ? "這聽起來很貼近我。我們可以怎麼自然開始？" : "这听起来很贴近我。我们可以怎么自然开始？",
      followup: `${isHant ? "建議先問一個和" : "建议先问一个和"} ${moduleLabel} ${isHant ? "相關的小問題，讓對話有方向但不顯得用力。" : "相关的小问题，让对话有方向但不显得用力。"}`,
      suggestion: `${isHant ? "問" : "问"} ${profile.name} ${isHant ? "一個和 ta 特徵相關、容易回答的開場問題。" : "一个和 ta 特征相关、容易回答的开场问题。"}`
    };
  }

  function injectStyle(doc, css) {
    const old = doc.querySelector("style[data-darlink-enhancer]");
    if (old) old.remove();
    const style = doc.createElement("style");
    style.dataset.darlinkEnhancer = "true";
    style.textContent = css;
    doc.head.appendChild(style);
  }

  function appendStyle(doc, key, css) {
    const attr = `data-darlink-${key}`;
    if (doc.querySelector(`style[${attr}]`)) return;
    const style = doc.createElement("style");
    style.setAttribute(attr, "true");
    style.textContent = css;
    doc.head.appendChild(style);
  }

  function copy(en, zhHans, zhHant) {
    if (lang() === "zhHans") return zhHans;
    if (lang() === "zhHant") return zhHant || zhHans;
    return en;
  }

  function storeChatContext(type, id) {
    if (!id) return;
    write(STORAGE.chatContext, { type, id, createdAt: Date.now() });
  }

  function questionPlan(phase) {
    if (phase === 1) {
      return [
        { id: "nickname", required: true },
        { id: "school", required: true },
        { id: "contact", required: true },
        { id: "goal", required: true },
        { id: "grade", required: true },
        { id: "majorDirection", required: true },
        { id: "selfWords", optional: true },
        { id: "chatStyle", optional: true },
        { id: "interests", optional: true },
        { id: "tabooTopics", optional: true },
        { id: "heightWeight", optional: true },
      ];
    }
    if (phase === 2) {
      return [
        { id: "summaryConfirm", required: true },
        { id: "joke", optional: true },
        { id: "catchphrase", required: true },
        { id: "personality", optional: true },
        { id: "memory", required: true },
        { id: "comfort", required: true },
        { id: "disagree", required: true },
      ];
    }
    return [{ id: "intent", required: true }];
  }

  function isSkip(text) {
    return /^(skip|pass|跳过|跳過|不填|先不|暫不|暂不)$/i.test(normalize(text));
  }

  function parseIntent(text) {
    const value = normalize(text).toLowerCase();
    if (/study|学习|學習|academic|自习|自習/.test(value)) return "study";
    if (/culinary|food|饭|飯|玩|social|社交|朋友|搭子/.test(value)) return "social";
    if (/romance|love|恋|戀|date|relationship/.test(value)) return "romance";
    return "";
  }

  function initialMessage(phase) {
    const t = tr();
    if (phase === 1) return `${t.xiaoda}: ${qText("nickname")}`;
    if (phase === 2) return `${t.xiaoda}: ${qText("summaryConfirm")}`;
    return `${t.xiaoda}: ${t.chooseIntent}`;
  }

  function aiErrorMessage(res = {}) {
    if (res.error && !/failed to fetch|unsupported method|unexpected token|networkerror/i.test(res.error)) return res.error;
    if (res.reason === "missing_key") {
      return copy(
        "The real LLM route is active, but the backend has not loaded ARK_API_KEY yet.",
        "真实 LLM 路由已经启用，但后端还没有加载 ARK_API_KEY。",
        "真實 LLM 路由已經啟用，但後端還沒有載入 ARK_API_KEY。"
      );
    }
    return copy(
      "Xiaoda is connected to the real LLM route, but the model service is not reachable right now. Please try again after the backend starts.",
      "小搭已连接真实 LLM 路由，但当前暂时无法触达大模型服务。请在后端服务启动后再试一次。",
      "小搭已連接真實 LLM 路由，但目前暫時無法觸達大模型服務。請在後端服務啟動後再試一次。"
    );
  }

  function enhanceLogin(doc, api) {
    injectStyle(doc, sharedCss() + loginCss());
    const card = doc.querySelector("form")?.closest(".glass-layer-2");
    if (!card || card.dataset.enhanced) return;
    card.dataset.enhanced = "true";
    const t = tr();
    const remembered = read(STORAGE.remembered, {});
    const useTestAuth = testAuthEnabled();
    const initialEmail = remembered.email || (useTestAuth ? DARLINK_TEST_AUTH_EMAIL : "");
    const initialPassword = remembered.password || (useTestAuth ? DARLINK_TEST_AUTH_PASSWORD : "");
    card.innerHTML = `
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
      <div class="text-center space-y-2 relative z-10">
        <h2 class="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">${t.loginTitle}</h2>
        <p class="font-body-md text-body-md text-on-surface-variant font-medium">${t.loginBody}</p>
      </div>
      <form id="darlinkAuthForm" class="darlink-auth-form relative z-10">
        <label class="darlink-auth-label">${t.email}</label>
        <input class="input-glass darlink-auth-input" name="email" placeholder="name@university.edu" required type="email" value="${initialEmail}">
        <div class="darlink-auth-row">
          <div>
            <label class="darlink-auth-label">${t.code}</label>
            <input class="input-glass darlink-auth-input" name="code" placeholder="000000" inputmode="numeric" value="${useTestAuth ? DARLINK_TEST_AUTH_CODE : ""}">
          </div>
          <button class="darlink-secondary-btn" type="button" data-action="request-code">${t.sendCode}</button>
        </div>
        <label class="darlink-auth-label">${t.password}</label>
        <input class="input-glass darlink-auth-input" name="password" placeholder="******" required type="password" value="${initialPassword}">
        <label class="darlink-remember">
          <input type="checkbox" name="remember" ${remembered.email || useTestAuth ? "checked" : ""}>
          <span>${t.remember}</span>
        </label>
        <div class="darlink-auth-status" role="status"></div>
        <button class="btn-gradient w-full rounded-full py-4 px-6 text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary-container/40" type="submit">
          ${t.submit}
          ${icon("arrow_forward")}
        </button>
      </form>
      <p class="text-center text-xs text-on-surface-variant/60 relative z-10">${useTestAuth ? testAuthCopy("notice") : t.emailHint}</p>
    `;
    localizeStatic(doc, "login");
    const form = card.querySelector("#darlinkAuthForm");
    const status = card.querySelector(".darlink-auth-status");
    const setStatus = (message, tone = "info") => {
      status.dataset.tone = tone;
      status.textContent = message;
    };
    card.querySelector("[data-action='request-code']").addEventListener("click", async () => {
      const email = normalize(form.email.value);
      if (!email || !email.includes("@")) {
        setStatus(t.invalidEmail, "error");
        return;
      }
      if (useTestAuth) {
        form.code.value = DARLINK_TEST_AUTH_CODE;
        setStatus(testAuthCopy("code"), "success");
        return;
      }
      setStatus(t.sendingCode);
      const res = await postJSON("/api/auth/request-code", { email, lang: lang() });
      if (res.ok) {
        const devMessage = lang() === "en" ? `Test code generated: ${res.dev_code}` : lang() === "zhHant" ? `測試驗證碼已生成：${res.dev_code}` : `测试验证码已生成：${res.dev_code}`;
        setStatus(res.dev_code ? devMessage : t.sentCode, "success");
        if (res.dev_code) form.code.value = res.dev_code;
      } else {
        setStatus(res.error || "Verification email failed.", "error");
      }
    });
    let submittingAuth = false;
    const handleLoginSubmit = async (event) => {
      event.preventDefault();
      if (submittingAuth) return;
      submittingAuth = true;
      const payload = {
        email: normalize(form.email.value),
        code: normalize(form.code.value),
        password: form.password.value,
        remember: form.remember.checked,
        lang: lang(),
      };
      if (!payload.email || !payload.email.includes("@")) {
        setStatus(t.invalidEmail, "error");
        submittingAuth = false;
        return;
      }
      if (!payload.password || payload.password.length < 6) {
        setStatus(lang() === "en" ? "Password must be at least 6 characters." : lang() === "zhHant" ? "密碼至少需要 6 位。" : "密码至少需要 6 位。", "error");
        submittingAuth = false;
        return;
      }
      if (useTestAuth) {
        if (payload.code !== DARLINK_TEST_AUTH_CODE) {
          setStatus(testAuthCopy("badCode"), "error");
          submittingAuth = false;
          return;
        }
        write(STORAGE.auth, createTestSession(payload.email));
        if (payload.remember) write(STORAGE.remembered, { email: payload.email, password: payload.password });
        else localStorage.removeItem(STORAGE.remembered);
        resetOnboardingSessionForRegistration(payload.email);
        setStatus(testAuthCopy("ok"), "success");
        window.setTimeout(() => api.navigate(api.page.onboard1), 450);
        return;
      }
      setStatus(t.loginChecking);
      const res = await postJSON("/api/auth/verify", payload);
      if (!res.ok) {
        setStatus(res.error || "Verification failed.", "error");
        submittingAuth = false;
        return;
      }
      write(STORAGE.auth, res.session);
      if (payload.remember) write(STORAGE.remembered, { email: payload.email, password: payload.password });
      else localStorage.removeItem(STORAGE.remembered);
      resetOnboardingSessionForRegistration(payload.email);
      setStatus(t.loginOk, "success");
      window.setTimeout(() => api.navigate(api.page.onboard1), 450);
    };
    form.addEventListener("submit", handleLoginSubmit);
    form.querySelector("button[type='submit']").addEventListener("click", handleLoginSubmit);
  }

  function chatStateKey(phase) {
    return phase === 1 ? STORAGE.chat1 : phase === 2 ? STORAGE.chat2 : STORAGE.chat3;
  }

  function chatTitle(phase) {
    const t = tr();
    if (phase === 1) return { step: t.step1, h: t.step1.replace(/^.*·\s*/, ""), caption: lang() === "en" ? "Xiaoda asks one question at a time and learns from your replies." : lang() === "zhHant" ? "小搭會逐題發問，根據你的回答即時學習。" : "小搭会逐题发问，根据你的回答实时学习。" };
    if (phase === 2) return { step: t.step2, h: t.step2.replace(/^.*·\s*/, ""), caption: lang() === "en" ? "Your phrasing, humor, boundaries, and comfort style shape your digital human." : lang() === "zhHant" ? "你的語氣、幽默、邊界與安慰方式會塑造專屬數字人。" : "你的语气、幽默、边界与安慰方式会塑造专属数字人。" };
    return { step: t.step3, h: t.step3.replace(/^.*·\s*/, ""), caption: t.chooseIntent };
  }

  function enhanceChatOnboarding(doc, api, phase) {
    if (phase === 3 && read(STORAGE.profile)) {
      api.navigate(api.page.home, { replace: true, immediate: true });
      return;
    }
    injectStyle(doc, sharedCss() + onboardingCss());
    const t = tr();
    const title = chatTitle(phase);
    const questions = questionPlan(phase);
    const saved = read(chatStateKey(phase), null);
    const hasStaleAiConfigError = (saved?.messages || []).some((message) => /未配置小搭聊天大模型 API Key|ARK_API_KEY|DOUBAO_API_KEY|DEEPSEEK_API_KEY|OPENAI_API_KEY/i.test(message.text || ""));
    const state = saved && saved.lang === lang() && !hasStaleAiConfigError
      ? saved
      : { lang: lang(), index: 0, complete: false, messages: [{ from: "xiaoda", text: initialMessage(phase) }], answers: {} };
    doc.body.className = "darlink-onboarding-body";
    doc.body.innerHTML = `
      ${onboardingBackdrop()}
      <main class="darlink-onboarding-shell">
        ${progressHeader(title.step, phase)}
        <section class="darlink-onboarding-stage">
          ${xiaodaPanel(t.xiaoda, title.caption)}
          <section class="darlink-chat-panel">
            <div class="darlink-panel-title">
              <span>${phase === 1 ? t.panelFoundation : phase === 2 ? t.panelPersona : t.panelPath}</span>
              <h1>${title.h}</h1>
              <p>${title.caption}</p>
            </div>
            <div class="darlink-chat-window" id="darlinkChatMessages"></div>
            <div class="darlink-quick-replies" id="darlinkQuickReplies"></div>
            <div class="darlink-chat-input-row">
              <button type="button" class="darlink-icon-btn" data-action="voice" aria-label="${t.voiceLabel}">${interactionIcon("voice")}</button>
              <textarea id="darlinkChatInput" class="darlink-textarea" rows="2" placeholder="${t.input}"></textarea>
              <button type="button" class="darlink-icon-btn primary" data-action="send" aria-label="${t.send}">${interactionIcon("send")}</button>
            </div>
            <div class="darlink-chat-actions">
              <div class="darlink-chat-action-left">
                <button type="button" class="darlink-secondary-btn" data-action="previous" ${(phase === 1 && state.index === 0) ? "disabled" : ""}>${icon("arrow_back")} ${t.previous}</button>
                <button type="button" class="darlink-secondary-btn" data-action="skip">${t.skip}</button>
              </div>
              <button type="button" class="darlink-primary-btn" data-action="next" ${state.complete ? "" : "disabled"}>${phase === 1 ? t.next1 : phase === 2 ? t.next2 : t.generate} ${icon("arrow_forward")}</button>
            </div>
            <div class="darlink-analysis-status" role="status"></div>
          </section>
        </section>
      </main>
    `;

    const input = doc.querySelector("#darlinkChatInput");
    const sendButton = doc.querySelector("[data-action='send']");
    const previousButton = doc.querySelector("[data-action='previous']");
    const nextButton = doc.querySelector("[data-action='next']");
    const status = doc.querySelector(".darlink-analysis-status");
    let sending = false;

    const persist = () => write(chatStateKey(phase), state);
    const render = () => {
      const messages = doc.querySelector("#darlinkChatMessages");
      messages.innerHTML = state.messages.map((message) => `<div class="darlink-message ${message.from}">
        <div>${message.text}</div>
      </div>`).join("");
      messages.scrollTop = messages.scrollHeight;
      const current = questions[state.index];
      const quick = doc.querySelector("#darlinkQuickReplies");
      if (!current || state.complete) {
        quick.innerHTML = "";
      } else if (phase === 3) {
        quick.innerHTML = [
          copy("Study Sync", "学习搭子", "學習搭子"),
          copy("Social Companion", "社交搭子", "社交搭子"),
          copy("Deep Romance", "深度恋爱", "深度戀愛"),
        ].map((item) => `<button type="button" class="darlink-chip" data-quick="${item}">${item}</button>`).join("");
      } else if (current.optional) {
        quick.innerHTML = `<button type="button" class="darlink-chip" data-quick="${t.skip}">${t.skip}</button>`;
      } else {
        quick.innerHTML = "";
      }
      nextButton.disabled = !state.complete;
      previousButton.disabled = phase === 1 && state.index === 0;
    };

    const pushTyping = () => {
      state.messages.push({ from: "xiaoda thinking", text: `${t.thinking}<span></span><span></span><span></span>` });
      render();
    };
    const removeTyping = () => {
      state.messages = state.messages.filter((message) => message.from !== "xiaoda thinking");
    };
    const saveAnswer = (question, value, normalized) => {
      const answer = normalized || value;
      state.answers[question.id] = answer;
      if (phase === 1) write(STORAGE.questionnaire, { ...read(STORAGE.questionnaire, {}), ...state.answers });
      if (phase === 2) write(STORAGE.persona, { answers: { ...read(STORAGE.persona, { answers: {} }).answers, ...state.answers }, messages: state.messages });
      if (phase === 3) {
        const intent = parseIntent(answer);
        if (intent) {
          write(STORAGE.intent, intent);
          state.answers.intent = intent;
          state.complete = true;
        }
      }
    };
    const submit = async (raw) => {
      const value = normalize(raw);
      const question = questions[state.index];
      if (!question || state.complete || sending) return;
      if (!value) return;
      if (question.required && isSkip(value)) {
        state.messages.push({ from: "user", text: value });
        state.messages.push({ from: "xiaoda", text: t.required });
        persist();
        render();
        input.value = "";
        return;
      }
      sending = true;
      sendButton.disabled = true;
      input.classList.add("is-sending");
      state.messages.push({ from: "user", text: value });
      input.value = "";
      pushTyping();
      const nextQuestion = questions[state.index + 1] ? qText(questions[state.index + 1].id) : "";
      const res = await postJSON("/api/ai/chat", {
        lang: lang(),
        phase,
        answer: value,
        current_question: qText(question.id),
        next_question: nextQuestion,
        known_answers: state.answers,
        recent_messages: state.messages.slice(-10).map((m) => ({ role: m.from, content: m.text.replace(/<[^>]+>/g, "") })),
      });
      removeTyping();
      if (!res.ok) {
        state.messages.push({ from: "xiaoda", text: aiErrorMessage(res) });
        sending = false;
        sendButton.disabled = false;
        input.classList.remove("is-sending");
        persist();
        render();
        return;
      }
      saveAnswer(question, value, res.normalized_answer);
      if (phase !== 3) {
        state.index += 1;
        if (!questions[state.index]) state.complete = true;
      } else if (!state.complete) {
        state.messages.push({ from: "xiaoda", text: lang() === "en" ? "I heard you, but I still need one clear path: Study Sync, Social Companion, or Deep Romance." : lang() === "zhHant" ? "我聽懂了，但還需要你明確選一條：學習搭子、社交搭子，或深度戀愛。" : "我听懂了，但还需要你明确选一条：学习搭子、社交搭子，或深度恋爱。" });
      }
      state.messages.push({ from: "xiaoda", text: res.reply });
      if (state.complete) {
        state.messages.push({ from: "xiaoda", text: phase === 3 ? (lang() === "en" ? "Great. I can now generate your persona cards." : lang() === "zhHant" ? "很好，現在可以生成你的畫像卡片了。" : "很好，现在可以生成你的画像卡片了。") : (lang() === "en" ? "I have enough for this step. Continue when you are ready." : lang() === "zhHant" ? "這一步的訊號已經足夠，準備好就可以繼續。" : "这一步的信号已经足够，准备好就可以继续。") });
      }
      sending = false;
      sendButton.disabled = false;
      input.classList.remove("is-sending");
      persist();
      render();
    };

    doc.querySelector("[data-action='send']").addEventListener("click", () => submit(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit(input.value);
      }
    });
    doc.querySelector("#darlinkQuickReplies").addEventListener("click", (event) => {
      const button = event.target.closest("[data-quick]");
      if (button) submit(button.dataset.quick);
    });
    doc.querySelector("[data-action='skip']").addEventListener("click", () => submit(t.skip));
    doc.querySelector("[data-action='voice']").addEventListener("click", () => startSpeech(doc));
    previousButton.addEventListener("click", () => {
      if (sending) return;
      if (state.index > 0) {
        state.index -= 1;
        state.complete = false;
        const previousQuestion = questions[state.index];
        input.value = state.answers[previousQuestion.id] || "";
        state.messages.push({
          from: "xiaoda",
          text: copy(
            `Let's review the previous question: ${qText(previousQuestion.id)}`,
            `我们回到上一题：${qText(previousQuestion.id)}`,
            `我們回到上一題：${qText(previousQuestion.id)}`
          ),
        });
        persist();
        render();
        input.focus();
        return;
      }
      if (phase === 2) api.navigate(api.page.onboard1, { immediate: true });
      if (phase === 3) api.navigate(api.page.onboard2, { immediate: true });
    });
    nextButton.addEventListener("click", async () => {
      if (phase === 1) api.navigate(api.page.onboard2);
      else if (phase === 2) api.navigate(api.page.onboard3);
      else await generateProfile(doc, api, status, nextButton);
    });
    render();
  }

  async function generateProfile(doc, api, status, button) {
    const t = tr();
    const intent = read(STORAGE.intent, "") || read(STORAGE.chat3, { answers: {} }).answers?.intent;
    if (!intent) {
      status.dataset.tone = "error";
      status.textContent = lang() === "en" ? "Choose a path first." : lang() === "zhHant" ? "請先選擇一條路徑。" : "请先选择一条路径。";
      return;
    }
    button.disabled = true;
    status.dataset.tone = "info";
    status.textContent = t.generating;
    const payload = {
      lang: lang(),
      intent,
      questionnaire: read(STORAGE.questionnaire, {}),
      persona: read(STORAGE.persona, {}),
    };
    const res = await postJSON("/api/ai/analyze", payload);
    if (!res.ok || !Array.isArray(res.cards) || !res.cards.length) {
      status.dataset.tone = "error";
      status.textContent = aiErrorMessage(res);
      button.disabled = false;
      return;
    }
    write(STORAGE.profile, { provider: res.provider, cards: res.cards, createdAt: Date.now() });
    localStorage.removeItem(STORAGE.profileDismissed);
    status.dataset.tone = "success";
    status.textContent = lang() === "en" ? "Profile generated. Opening home." : lang() === "zhHant" ? "畫像已生成，正在進入首頁。" : "画像已生成，正在进入首页。";
    window.setTimeout(() => api.navigate(api.page.home, { replace: true, immediate: true }), 700);
  }

  function plazaCategoryForId(id) {
    if (id.startsWith("study")) return "study";
    if (id.startsWith("romance")) return "romance";
    if (id.startsWith("culinary") || id.startsWith("plaza")) return "social";
    return "all";
  }

  function categoryLabel(category) {
    const labels = {
      all: copy("All", "全部", "全部"),
      study: copy("Study Sync", "学习搭子", "學習搭子"),
      social: copy("Social Companion", "社交搭子", "社交搭子"),
      romance: copy("Deep Romance", "深度恋爱", "深度戀愛"),
      hall: copy("Mystery Icons", "人物盲盒", "人物盲盒"),
    };
    return labels[category] || labels.all;
  }

  function plazaCardItems() {
    const regular = PLAZA_DIGITAL_HUMANS.map(([id, name, title, body, tags]) => {
      const profile = MODULE_CHAT_PROFILES[id] || MODULE_CHAT_PROFILES["plaza-aria"];
      return {
        id,
        type: "module",
        category: plazaCategoryForId(id),
        name,
        title: localizedSnippet(title),
        body: localizedSnippet(body),
        tags: tags.map((tag) => localizedSnippet(tag)),
        initials: profile.initials,
        colors: profile.colors,
      };
    });
    const hall = Object.entries(HALL_CHAT_PROFILES).map(([id, profile]) => ({
      id,
      type: "hall",
      category: "hall",
      name: profile.name,
      title: copy("Hidden digital human", "隐藏款数字人", "隱藏款數字人"),
      body: copy("A mystery mentor hidden inside the plaza. Click to see whether this figure has been unlocked.", "藏在广场里的隐藏款人物数字人。点击后才会知道是否已解锁。", "藏在廣場裡的隱藏款人物數字人。點擊後才會知道是否已解鎖。"),
      tags: [categoryLabel("hall"), copy("Challenge", "挑战", "挑戰")],
      initials: profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      colors: ["#111827", "#6f5092"],
      background: profile.background,
    }));
    return [...regular, ...hall];
  }

  function homeLeaderboardItems() {
    return [
      { id: "plaza-sarah", type: "module", name: "Sarah J. Twin", meta: copy("warm openers", "温和开场", "溫和開場"), score: "98.8" },
      { id: "steve-jobs", type: "hall", name: "Steve Jobs", meta: copy("hidden icon", "隐藏款人物", "隱藏款人物"), score: "97.6" },
      { id: "study-astra", type: "module", name: "Astra Chen Twin", meta: copy("study focus", "学习专注", "學習專注"), score: "96.9" },
      { id: "jensen-huang", type: "hall", name: "Jensen Huang", meta: copy("AI mentor", "AI 导师", "AI 導師"), score: "96.1" },
      { id: "romance-elias", type: "module", name: "Elias Vance Twin", meta: copy("gentle resonance", "温柔共振", "溫柔共振"), score: "95.4" },
      { id: "culinary-leo", type: "module", name: "Leo Zhang Twin", meta: copy("social routes", "社交路线", "社交路線"), score: "94.8" },
      { id: "ray-dalio", type: "hall", name: "Ray Dalio", meta: copy("principles", "原则挑战", "原則挑戰"), score: "94.2" },
      { id: "plaza-maya", type: "module", name: "Maya K. Twin", meta: copy("visual thinking", "视觉思考", "視覺思考"), score: "93.7" },
      { id: "richard-feynman", type: "hall", name: "Richard Feynman", meta: copy("curiosity", "好奇心", "好奇心"), score: "93.0" },
      { id: "romance-lyra", type: "module", name: "Lyra Chen Twin", meta: copy("dream resonance", "梦想共振", "夢想共振"), score: "92.5" },
    ];
  }

  function renderHomeTopbar(activeKey = "discover") {
    const items = [
      ["discover", copy("Discover", "发现", "發現")],
      ["matches", copy("Matches", "匹配", "匹配")],
      ["community", copy("Community", "社区", "社群")],
      ["hall", copy("Hall of Fame", "名人堂", "名人堂")],
    ];
    return `<nav class="darlink-standard-topbar">
      <div class="darlink-standard-topbar-inner">
        <a class="darlink-standard-brand" href="#">Darlink</a>
        <div class="darlink-standard-tabs" aria-label="${copy("Primary navigation", "主导航", "主導覽")}">
          ${items.map(([key, label]) => `<a href="#" class="${key === activeKey ? "is-active" : ""}">${label}</a>`).join("")}
        </div>
        <div class="darlink-standard-actions">
          <button type="button" class="darlink-standard-search" data-darlink-search-disabled="true" data-darlink-local-control="true" aria-label="${copy("Search disabled for prototype", "搜索暂未开放", "搜尋暫未開放")}">${materialIconSvg("search")}</button>
          <button type="button" class="darlink-standard-avatar" aria-label="${copy("Profile", "个人档案", "個人檔案")}"><img src="/files/v13-ai-twin-crop.png" alt="${copy("User profile avatar", "用户头像", "用戶頭像")}"></button>
        </div>
      </div>
    </nav>`;
  }

  function enhanceHome(doc, api) {
    injectStyle(doc, sharedCss() + homeDiscoveryCss());
    const profile = read(STORAGE.profile, {});
    const profileCards = Array.isArray(profile.cards) ? profile.cards : [];
    const leaderItems = homeLeaderboardItems();
    const plazaItems = plazaCardItems();
    doc.body.className = "darlink-home-discovery-body darlink-page-polished darlink-page-home-luminous-dashboard-refined-v4";
    doc.body.innerHTML = `
      ${renderHomeTopbar("discover")}
      <main class="darlink-home-shell">
        <section class="darlink-home-hero">
          <div>
            <span>${copy("Discovery", "发现", "發現")}</span>
            <h1>${copy("Explore living digital humans around you.", "探索你身边正在生长的数字人。", "探索你身邊正在生長的數字人。")}</h1>
            <p>${copy("The plaza now gathers study partners, social companions, deep-romance twins, and hidden icon mentors in one stable space.", "数字人广场现在统一承载学习搭子、社交搭子、深度恋爱和隐藏款人物数字人。", "數字人廣場現在統一承載學習搭子、社交搭子、深度戀愛和隱藏款人物數字人。")}</p>
          </div>
        </section>
        <section class="darlink-home-ranking">
          <div class="darlink-ranking-head">
            <div>
              <span>${copy("Live Ranking", "数字人人气榜", "數字人人氣榜")}</span>
              <h2>${copy("Top 10 most popular digital humans", "最有人气的 10 位数字人", "最有人氣的 10 位數字人")}</h2>
            </div>
            <button type="button" data-action="toggle-ranking" data-darlink-local-control="true" aria-expanded="false">${copy("Show all", "展开全部", "展開全部")}</button>
          </div>
          <div class="darlink-ranking-list">
            ${leaderItems.map((item, index) => `<button type="button" class="darlink-ranking-row ${index > 2 ? "darlink-ranking-extra" : ""}" ${item.type === "hall" ? `data-darlink-hall-id="${item.id}"` : `data-darlink-chat-id="${item.id}" data-darlink-chat-type="module"`}>
              <strong>${index + 1}</strong>
              <span>${item.name}<em>${item.meta}</em></span>
              <b>${item.score}</b>
            </button>`).join("")}
          </div>
        </section>
        <section class="darlink-home-grid">
          <section class="darlink-home-plaza">
            <div class="darlink-section-head">
              <div>
                <span>${copy("Digital Human Plaza", "数字人广场", "數字人廣場")}</span>
                <h2>${copy("All digital humans live here.", "所有数字人都在这里。", "所有數字人都在這裡。")}</h2>
              </div>
              <div class="darlink-plaza-filters" aria-label="${copy("Digital human filters", "数字人标签筛选", "數字人標籤篩選")}">
                ${["all", "study", "social", "romance", "hall"].map((key) => `<button type="button" class="${key === "all" ? "is-active" : ""}" data-filter="${key}" data-darlink-local-control="true">${categoryLabel(key)}</button>`).join("")}
              </div>
            </div>
            <div class="darlink-home-plaza-scroll">
              ${plazaItems.map((item) => `<article class="darlink-home-twin-card ${item.type === "hall" ? "is-hidden-icon" : ""}" data-category="${item.category}" ${item.type === "hall" ? `data-darlink-hall-id="${item.id}"` : `data-darlink-chat-id="${item.id}" data-darlink-chat-type="module"`}>
                <div class="darlink-home-avatar" style="--from:${item.colors[0]};--to:${item.colors[1]}">${item.background ? `<img src="${item.background}" alt="${item.name} portrait">` : item.initials}</div>
                <div>
                  <h3>${item.name}</h3>
                  <p class="darlink-home-role">${item.title}</p>
                  <p>${item.body}</p>
                </div>
                <div class="darlink-home-tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
                <button type="button" ${item.type === "hall" ? `data-darlink-hall-id="${item.id}"` : `data-darlink-chat-id="${item.id}" data-darlink-chat-type="module"`}>
                  ${item.type === "hall" ? copy("Open mystery", "开启盲盒", "開啟盲盒") : copy("Chat with Twin", "和数字人聊天", "和數字人聊天")}
                  ${materialIconSvg(item.type === "hall" ? "auto_awesome" : "chat_bubble")}
                </button>
              </article>`).join("")}
            </div>
          </section>
          <aside class="darlink-my-twin">
            <div class="darlink-my-twin-orb">${icon("auto_awesome")}</div>
            <span>${copy("My Digital Human", "我的数字人", "我的數字人")}</span>
            <h2>${copy("Your twin is still learning your rhythm.", "你的数字人还在学习你的节奏。", "你的數字人還在學習你的節奏。")}</h2>
            <p>${profileCards[0]?.body || copy("Xiaoda will keep refining your voice, social boundaries, and matching signals as you chat.", "小搭会随着你的聊天继续完善你的表达方式、社交边界和匹配信号。", "小搭會隨著你的聊天繼續完善你的表達方式、社交邊界和匹配信號。")}</p>
            <div class="darlink-my-profile-cards">
              ${profileCards.slice(0, 3).map((card) => `<article><strong>${card.title}</strong><em>${(card.tags || []).slice(0, 2).join(" · ")}</em></article>`).join("") || `<article><strong>${copy("Warm signal", "温暖信号", "溫暖信號")}</strong><em>${copy("Ready to refine", "等待完善", "等待完善")}</em></article>`}
            </div>
            <button type="button" class="darlink-refine-btn" data-darlink-flow-target="${api.page.exploreChat}">
              ${copy("Strengthen my digital human", "加强完善我的数字人", "加強完善我的數字人")}
              ${materialIconSvg("arrow_forward")}
            </button>
          </aside>
        </section>
      </main>
    `;

    const rankingButton = doc.querySelector("[data-action='toggle-ranking']");
    const rankingList = doc.querySelector(".darlink-ranking-list");
    rankingButton?.addEventListener("click", (event) => {
      event.preventDefault();
      const expanded = rankingList.classList.toggle("is-expanded");
      rankingButton.setAttribute("aria-expanded", String(expanded));
      rankingButton.textContent = expanded ? copy("Collapse", "收起", "收起") : copy("Show all", "展开全部", "展開全部");
    });

    doc.querySelector(".darlink-plaza-filters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      event.preventDefault();
      const filter = button.dataset.filter;
      doc.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      doc.querySelectorAll(".darlink-home-twin-card").forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  }

  function enhanceDigitalPlaza(doc) {
    const t = tr();
    const sidePanel = [...doc.querySelectorAll(".md\\:col-span-4.flex.flex-col.gap-8")].find((node) => node.textContent.includes("Campus Pulse") || node.textContent.includes("数字人广场") || node.textContent.includes("數字人廣場"));
    if (!sidePanel || sidePanel.dataset.digitalPlaza) return;
    sidePanel.dataset.digitalPlaza = "true";
    sidePanel.innerHTML = `
      <div class="ethereal-card rounded-3xl p-8 flex flex-col justify-between h-full darlink-digital-plaza-card">
        <div>
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-headline-md text-on-surface">${t.plazaTitle}</h3>
            <span class="material-symbols-outlined text-tertiary">diversity_1</span>
          </div>
          <div class="space-y-6">
            <div>
              <div class="flex justify-between mb-2 text-label-sm text-on-surface-variant">
                <span>${t.plazaMetric}</span>
                <span class="font-bold text-primary">92%</span>
              </div>
              <div class="h-3 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5 border border-white/50">
                <div class="h-full w-[92%] bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full"></div>
              </div>
            </div>
            <p class="text-label-sm text-on-surface-variant italic leading-relaxed">${t.plazaQuote}</p>
            <div class="darlink-plaza-avatars">
              ${["A", "S", "M", "L"].map((initial) => `<span>${initial}</span>`).join("")}
            </div>
          </div>
          <div class="darlink-plaza-new-twin">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-tertiary-container to-white flex items-center justify-center text-white shadow-inner">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">psychology</span>
            </div>
            <div>
              <p class="text-label-sm text-tertiary font-bold uppercase tracking-wider">${t.plazaNew}</p>
              <h4 class="text-headline-md text-on-surface">${t.plazaName}</h4>
              <p class="text-on-surface-variant font-body-sm mt-1">${t.plazaBody}</p>
            </div>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-white/20">
          <a class="text-primary font-label-lg flex items-center gap-1 hover:gap-2 transition-all" href="#">
            ${t.plazaCta}
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </a>
        </div>
      </div>
    `;
  }

  function markModuleChatTargets(doc, configs, type = "module") {
    const isChatControl = (button) => {
      const text = (button.textContent || "").toLowerCase();
      return /chat|initiate|聊天|對話|对话|連線|连线/.test(text) || button.querySelector("[data-icon='chat_bubble'], [data-icon='chat'], .material-symbols-outlined");
    };
    configs.forEach((config) => {
      const heading = Array.from(doc.querySelectorAll("h1,h2,h3,h4,strong"))
        .find((node) => (node.textContent || "").toLowerCase().includes(config.needle.toLowerCase()));
      let card = null;
      let cursor = heading;
      while (cursor && cursor !== doc.body) {
        if (cursor.querySelector && Array.from(cursor.querySelectorAll("button, a")).some(isChatControl)) {
          card = cursor;
          break;
        }
        cursor = cursor.parentElement;
      }
      const match = card || Array.from(doc.querySelectorAll("article, .plaza-card, .glass-card, .glass-layer-2, .glass-panel, div"))
        .find((node) => (node.textContent || "").toLowerCase().includes(config.needle.toLowerCase()) && (node.textContent || "").length < 1600);
      card = match?.closest("article, .plaza-card, .glass-card, .glass-layer-2") || match;
      if (!card) return;
      card.dataset.darlinkChatId = config.id;
      card.dataset.darlinkChatType = type;
      card.querySelectorAll("button, a").forEach((button) => {
        if (isChatControl(button)) {
          button.dataset.darlinkChatId = config.id;
          button.dataset.darlinkChatType = type;
        }
      });
    });
  }

  function enhanceExploreChat(doc, api) {
    injectStyle(doc, sharedCss() + exploreChatCss());
    localizeStatic(doc, "exploreChat");
    removeMobileBottomNavigation(doc);
    normalizeInteractiveIconButtons(doc);
    installExploreMoodControl(doc);
    doc.body.classList.add("darlink-explore-chat");
    const nav = doc.querySelector("nav.h-screen, body > nav");
    if (!nav || nav.dataset.darlinkExploreNav === "true") return;
    nav.dataset.darlinkExploreNav = "true";
    nav.innerHTML = `
      <div class="px-8 mb-4">
        <h1 class="font-headline-md text-headline-md font-bold bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent">Darlink</h1>
        <p class="darlink-side-caption">${copy("Digital Twin Chat", "数字人对话", "數字人對話")}</p>
      </div>
      <div class="darlink-side-actions">
        <button type="button" class="darlink-side-item is-active" data-action="guide" data-darlink-local-control="true">
          <span class="material-symbols-outlined" data-icon="smart_toy">smart_toy</span>
          <span>${copy("AI Guide Xiaoda", "小搭指导", "小搭指導")}</span>
        </button>
        <div class="darlink-guide-card" hidden>
          <strong>${copy("How to chat with your twin", "如何和自己的数字人聊天", "如何和自己的數字人聊天")}</strong>
          <p>${copy("Start with a real situation, ask for a suggested reply, then edit anything that does not sound like you.", "先说一个真实场景，让数字人给出回复建议，再把不像你的地方改掉。", "先說一個真實場景，讓數字人給出回覆建議，再把不像你的地方改掉。")}</p>
          <div class="darlink-guide-bubble">${copy("Try: Help me write a warm first message for someone I met in class.", "可以试试：帮我写一条给课堂认识对象的自然开场白。", "可以試試：幫我寫一條給課堂認識對象的自然開場白。")}</div>
        </div>
        <button type="button" class="darlink-side-item" data-action="messages" data-darlink-local-control="true">
          <span class="material-symbols-outlined" data-icon="chat_bubble">chat_bubble</span>
          <span>${copy("Messages", "消息", "消息")}</span>
          <em class="material-symbols-outlined" data-icon="chevron_right">chevron_right</em>
        </button>
        <div class="darlink-message-history" hidden>
          <button type="button" data-darlink-chat-id="plaza-sarah" data-darlink-chat-type="module">Sarah J. Twin · ${copy("opening message", "开场白记录", "開場白記錄")}</button>
          <button type="button" data-darlink-chat-id="study-astra" data-darlink-chat-type="module">Astra Chen · ${copy("study planning", "学习计划记录", "學習計劃記錄")}</button>
          <button type="button" data-darlink-chat-id="romance-elias" data-darlink-chat-type="module">Elias Vance · ${copy("gentle first chat", "温和初聊记录", "溫和初聊記錄")}</button>
        </div>
        <button type="button" class="darlink-side-item" data-action="help" data-darlink-local-control="true">
          <span class="material-symbols-outlined" data-icon="help">help</span>
          <span>${copy("Help Center", "帮助中心", "幫助中心")}</span>
        </button>
      </div>
      <div class="px-8 mt-auto flex flex-col gap-4">
        <button class="w-full bg-gradient-to-r from-primary to-secondary text-white font-label-lg text-label-lg py-3 rounded-full hover:shadow-lg transition-all active:scale-95" data-darlink-flow-target="${api.page.xiaodaChat}">
          ${copy("Ask Xiaoda Anything", "问小搭任何问题", "問小搭任何問題")}
        </button>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/20">
          <img alt="Xiaoda AI Guide" class="w-10 h-10 rounded-full object-cover border border-white/50 shadow-sm" src="/files/v13-ai-twin-crop.png">
          <div class="flex flex-col">
          <span class="font-label-lg text-label-lg text-on-surface leading-tight">${copy("Xiaoda", "小搭", "小搭")}</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant leading-tight">${copy("AI Twin Guide", "数字人对话向导", "數字人對話嚮導")}</span>
          </div>
        </div>
      </div>
    `;
    const guide = nav.querySelector(".darlink-guide-card");
    const history = nav.querySelector(".darlink-message-history");
    nav.querySelector("[data-action='guide']").addEventListener("click", (event) => {
      event.preventDefault();
      guide.hidden = !guide.hidden;
      history.hidden = true;
    });
    nav.querySelector("[data-action='messages']").addEventListener("click", (event) => {
      event.preventDefault();
      history.hidden = !history.hidden;
      guide.hidden = true;
    });
  }

  function enhanceDiscoveryModule(doc, page) {
    appendStyle(doc, "module-discovery", discoveryModuleCss());
    normalizeStandardTopBar(doc, "discover");
    replaceTextSnippets(doc, pageSnippetTranslations(page));
    const configs = {
      discovery_study_sync_ai_twins_refined_avatars: [
        { needle: "Astra Chen", id: "study-astra" },
        { needle: "Elara Vance", id: "study-elara" },
        { needle: "Julian Reed", id: "study-julian" },
      ],
      discovery_culinary_match_ai_twins_refined_avatars: [
        { needle: "Leo", id: "culinary-leo" },
        { needle: "Sarah", id: "culinary-sarah" },
        { needle: "Marcus", id: "culinary-marcus" },
        { needle: "Elena", id: "culinary-elena" },
      ],
      discovery_deep_romance_ai_twins_refined_avatars: [
        { needle: "Elias Vance", id: "romance-elias" },
        { needle: "Lyra Chen", id: "romance-lyra" },
        { needle: "Julian Thorne", id: "romance-julian" },
      ],
    }[page] || [];
    markModuleChatTargets(doc, configs);

    if (page === "discovery_culinary_match_ai_twins_refined_avatars" || page === "discovery_deep_romance_ai_twins_refined_avatars") {
      doc.querySelectorAll("aside").forEach((aside) => aside.remove());
      doc.body.classList.add("darlink-no-module-sidebar");
      doc.querySelectorAll("main").forEach((main) => {
        main.classList.add("darlink-module-main-expanded");
      });
    }
  }

  function enhanceDigitalPlazaPage(doc) {
    injectStyle(doc, sharedCss() + homeDiscoveryCss());
    const items = plazaCardItems();
    doc.body.className = "darlink-home-discovery-body darlink-page-polished darlink-page-digital-human-plaza-resonance";
    doc.body.innerHTML = `
      ${renderHomeTopbar("discover")}
      <main class="darlink-home-shell">
        <section class="darlink-home-plaza">
          <div class="darlink-section-head">
            <div>
              <span>${copy("Digital Human Plaza", "数字人广场", "數字人廣場")}</span>
              <h2>${copy("A stable scroll space for every digital human.", "为所有数字人准备的稳定下滑空间。", "為所有數字人準備的穩定下滑空間。")}</h2>
            </div>
            <div class="darlink-plaza-filters" aria-label="${copy("Digital human filters", "数字人标签筛选", "數字人標籤篩選")}">
              ${["all", "study", "social", "romance", "hall"].map((key) => `<button type="button" class="${key === "all" ? "is-active" : ""}" data-filter="${key}" data-darlink-local-control="true">${categoryLabel(key)}</button>`).join("")}
            </div>
          </div>
          <div class="darlink-home-plaza-scroll">
            ${items.map((item) => `<article class="darlink-home-twin-card ${item.type === "hall" ? "is-hidden-icon" : ""}" data-category="${item.category}" ${item.type === "hall" ? `data-darlink-hall-id="${item.id}"` : `data-darlink-chat-id="${item.id}" data-darlink-chat-type="module"`}>
              <div class="darlink-home-avatar" style="--from:${item.colors[0]};--to:${item.colors[1]}">${item.background ? `<img src="${item.background}" alt="${item.name} portrait">` : item.initials}</div>
              <div>
                <h3>${item.name}</h3>
                <p class="darlink-home-role">${item.title}</p>
                <p>${item.body}</p>
              </div>
              <div class="darlink-home-tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
              <button type="button" ${item.type === "hall" ? `data-darlink-hall-id="${item.id}"` : `data-darlink-chat-id="${item.id}" data-darlink-chat-type="module"`}>
                ${item.type === "hall" ? copy("Open mystery", "开启盲盒", "開啟盲盒") : copy("Chat with Twin", "和数字人聊天", "和數字人聊天")}
                ${materialIconSvg(item.type === "hall" ? "auto_awesome" : "chat_bubble")}
              </button>
            </article>`).join("")}
          </div>
        </section>
      </main>
    `;
    doc.querySelector(".darlink-plaza-filters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      event.preventDefault();
      const filter = button.dataset.filter;
      doc.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      doc.querySelectorAll(".darlink-home-twin-card").forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  }

  function enhanceMatching(doc) {
    appendStyle(doc, "matching-polish", matchingPolishCss());
    normalizeStandardTopBar(doc, "matches");
    replaceTextSnippets(doc, pageSnippetTranslations("matching"));
    const locationLine = Array.from(doc.querySelectorAll("p")).find((node) => node.textContent.includes("San Francisco") || node.textContent.includes("miles away"));
    if (locationLine) {
      locationLine.innerHTML = `<span class="material-symbols-outlined text-[14px]" data-icon="location_on">location_on</span><span>Beijing</span>`;
    }
    const refreshButton = Array.from(doc.querySelectorAll("button")).find((button) => (button.textContent || "").includes("refresh") || button.querySelector("[data-icon='refresh']"));
    if (refreshButton && refreshButton.dataset.darlinkRefreshBound !== "true") {
      refreshButton.dataset.darlinkRefreshBound = "true";
      refreshButton.dataset.darlinkRefresh = "true";
      refreshButton.setAttribute("aria-label", copy("Refresh matches", "刷新匹配", "刷新匹配"));
      refreshButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        refreshButton.classList.remove("is-refreshing");
        void refreshButton.offsetWidth;
        refreshButton.classList.add("is-refreshing");
        window.setTimeout(() => refreshButton.classList.remove("is-refreshing"), 760);
      });
    }
  }

  function enhanceCommunityPage(doc) {
    appendStyle(doc, "page-specific-polish", pageSpecificPolishCss());
    normalizeStandardTopBar(doc, "community");
    replaceTextSnippets(doc, pageSnippetTranslations("community_campus_pulse_feed"));
  }

  function enhanceProfile(doc) {
    appendStyle(doc, "profile-polish", profilePolishCss());
    removeMobileBottomNavigation(doc);
    replaceTextSnippets(doc, pageSnippetTranslations("profile"));
    Array.from(doc.querySelectorAll("aside nav a")).forEach((link) => {
      if ((link.textContent || "").trim().toLowerCase() === "aura") link.remove();
    });
    const aside = doc.querySelector("aside");
    if (aside && aside.dataset.darlinkCollapsible !== "true") {
      aside.dataset.darlinkCollapsible = "true";
      const toggle = doc.createElement("button");
      toggle.type = "button";
      toggle.className = "darlink-profile-collapse";
      toggle.dataset.darlinkLocalControl = "true";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", copy("Collapse sidebar", "收起侧栏", "收起側欄"));
      toggle.innerHTML = materialIconSvg("chevron_left");
      aside.prepend(toggle);
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const collapsed = doc.body.classList.toggle("darlink-profile-sidebar-collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.setAttribute("aria-label", collapsed ? copy("Expand sidebar", "展开侧栏", "展開側欄") : copy("Collapse sidebar", "收起侧栏", "收起側欄"));
        toggle.innerHTML = materialIconSvg(collapsed ? "chevron_right" : "chevron_left");
      });
    }
  }

  function enhanceXiaodaFreeChat(doc) {
    injectStyle(doc, sharedCss() + xiaodaFreeChatCss());
    doc.title = "Darlink - Xiaoda Chat";
    doc.body.className = "darlink-xiaoda-free-body darlink-page-polished darlink-page-chat-xiaoda-anything-real";
    doc.body.innerHTML = `
      <main class="darlink-xiaoda-free-shell">
        <section class="darlink-xiaoda-free-rail">
          <div>
            <span>${icon("auto_awesome")}</span>
            <h1>Xiaoda</h1>
            <p>${copy("Ask anything about your digital twin, matches, messages, or campus connection strategy.", "可以问小搭任何关于数字人、匹配、消息和校园连接策略的问题。", "可以問小搭任何關於數字人、匹配、消息和校園連接策略的問題。")}</p>
          </div>
          <div class="darlink-guide-bubble">${copy("Try: How should I start a warm conversation with my own digital twin?", "试试：我该怎么和自己的数字人自然开始聊天？", "試試：我該怎麼和自己的數字人自然開始聊天？")}</div>
        </section>
        <section class="darlink-xiaoda-free-chat">
          <header>
            <div>
              <strong>${copy("Xiaoda Anything", "小搭自由聊天", "小搭自由聊天")}</strong>
              <p>${copy("Real-time guidance surface", "实时指导界面", "即時指導界面")}</p>
            </div>
            <span>${copy("Online", "在线", "在線")}</span>
          </header>
          <div class="darlink-free-messages" id="darlinkFreeMessages">
            <div class="darlink-free-message ai">${copy("I am here. Tell me what you want help with: your own twin, a match, a first message, or a social situation.", "我在。你可以告诉我想处理什么：自己的数字人、某个匹配、第一条消息，或一个社交场景。", "我在。你可以告訴我想處理什麼：自己的數字人、某個匹配、第一條消息，或一個社交場景。")}</div>
          </div>
          <form class="darlink-free-input" id="darlinkFreeForm">
            <input id="darlinkFreeInput" autocomplete="off" placeholder="${copy("Ask Xiaoda anything...", "问小搭任何问题...", "問小搭任何問題...")}">
            <button type="submit">${materialIconSvg("send")}</button>
          </form>
        </section>
      </main>
    `;
    const form = doc.querySelector("#darlinkFreeForm");
    const input = doc.querySelector("#darlinkFreeInput");
    const messages = doc.querySelector("#darlinkFreeMessages");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = normalize(input.value);
      if (!value) return;
      input.value = "";
      messages.insertAdjacentHTML("beforeend", `<div class="darlink-free-message user">${escapeHtml(value)}</div><div class="darlink-free-message ai thinking">${copy("Xiaoda is thinking", "小搭正在思考", "小搭正在思考")}<span></span><span></span><span></span></div>`);
      messages.scrollTop = messages.scrollHeight;
      const res = await postJSON("/api/ai/chat", {
        lang: lang(),
        phase: "free",
        answer: value,
        current_question: "free chat",
        known_answers: read(STORAGE.questionnaire, {}),
        recent_messages: [],
      });
      messages.querySelector(".thinking")?.remove();
      messages.insertAdjacentHTML("beforeend", `<div class="darlink-free-message ai">${escapeHtml(res.ok && res.reply ? res.reply : aiErrorMessage(res))}</div>`);
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function enhanceContextualChat(doc) {
    const profile = localizedChatProfile(chatProfileFromContext());
    injectStyle(doc, sharedCss() + contextualChatCss());
    removeMobileBottomNavigation(doc);
    normalizeInteractiveIconButtons(doc);
    doc.title = `Darlink - Chat with ${profile.name}`;
    doc.body.classList.add("darlink-contextual-chat");
    if (profile.type === "hall") {
      doc.body.classList.add("darlink-hall-chat");
      doc.documentElement.style.setProperty("--darlink-chat-bg", `url("${profile.background}")`);
    } else {
      doc.body.classList.remove("darlink-hall-chat");
      doc.documentElement.style.removeProperty("--darlink-chat-bg");
    }

    const header = doc.querySelector("main > div.flex.items-center");
    const chatActions = header?.querySelector(".ml-auto");
    if (chatActions) chatActions.remove();
    const title = header?.querySelector("h2");
    const subtitle = header?.querySelector("p");
    if (title) {
      const verified = title.querySelector(".material-symbols-outlined")?.outerHTML || "";
      title.innerHTML = `${profile.name} ${verified}`;
    }
    if (subtitle) {
      subtitle.innerHTML = `<span class="material-symbols-outlined text-sm" data-icon="bolt">bolt</span>${profile.subtitle}`;
    }

    doc.querySelectorAll("img[alt*='Elena']").forEach((image) => {
      image.src = profile.avatar;
      image.alt = `${profile.name} Avatar`;
    });

    const messages = doc.querySelectorAll("#chat-messages p");
    if (messages[0]) messages[0].textContent = profile.opener;
    if (messages[1]) messages[1].textContent = profile.userLine;
    if (messages[2]) messages[2].textContent = profile.followup;
    const suggestion = doc.querySelector(".darlink-suggestion-card p");
    if (suggestion) suggestion.textContent = `"${profile.suggestion}"`;

    const input = doc.querySelector("input[placeholder='Type a message...']");
    if (input) input.placeholder = copy(`Message ${profile.name}...`, `给 ${profile.name} 发消息...`, `給 ${profile.name} 發消息...`);
    const chatMessages = doc.querySelector("#chat-messages");
    const inputWrap = input?.closest(".glass-input");
    const buttons = inputWrap ? Array.from(inputWrap.querySelectorAll("button")) : [];
    const sendButton = buttons[buttons.length - 1] || null;
    let sending = false;

    const scrollMessages = () => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    const setSending = (active) => {
      sending = active;
      if (sendButton) sendButton.disabled = active;
      if (input) input.disabled = active;
      inputWrap?.classList.toggle("is-sending", active);
    };
    const collectRecentMessages = () => {
      if (!chatMessages) return [];
      return Array.from(chatMessages.querySelectorAll(".glass-bubble-ai p, .glass-bubble-user p"))
        .filter((node) => !node.closest(".thinking"))
        .slice(-10)
        .map((node) => ({
          role: node.closest(".glass-bubble-user") ? "user" : "assistant",
          content: normalize(node.textContent),
        }))
        .filter((item) => item.content);
    };
    const appendMessage = (role, text, thinking = false) => {
      if (!chatMessages) return null;
      const textHtml = thinking
        ? `${escapeHtml(text)}<span></span><span></span><span></span>`
        : escapeHtml(text);
      const html = role === "user"
        ? `<div class="flex items-end gap-3 max-w-[80%] ml-auto justify-end darlink-context-message user">
            <div class="glass-bubble-user rounded-2xl rounded-br-sm p-4 font-body-md text-body-md shadow-md"><p>${textHtml}</p></div>
          </div>`
        : `<div class="flex items-end gap-3 max-w-[80%] darlink-context-message ai${thinking ? " thinking" : ""}">
            <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/40"><img alt="${escapeHtml(profile.name)} Avatar Small" class="w-full h-full object-cover" src="${escapeHtml(profile.avatar)}"></div>
            <div class="glass-bubble-ai rounded-2xl rounded-bl-sm p-4 text-on-surface font-body-md text-body-md"><p>${textHtml}</p></div>
          </div>`;
      chatMessages.insertAdjacentHTML("beforeend", html);
      scrollMessages();
      return chatMessages.lastElementChild;
    };
    const submitMessage = async () => {
      const value = normalize(input?.value);
      if (!value || sending) return;
      input.value = "";
      appendMessage("user", value);
      const thinkingNode = appendMessage("assistant", copy(`${profile.name} is thinking`, `${profile.name} 正在思考`, `${profile.name} 正在思考`), true);
      setSending(true);
      const res = await postJSON("/api/ai/contextual-chat", {
        lang: lang(),
        profile_name: profile.name,
        profile_type: profile.type,
        profile_subtitle: profile.subtitle,
        profile_context: [
          `id: ${profile.id || ""}`,
          `opener: ${profile.opener || ""}`,
          `followup: ${profile.followup || ""}`,
          `suggestion: ${profile.suggestion || ""}`,
        ].join("\n"),
        message: value,
        recent_messages: collectRecentMessages(),
      });
      thinkingNode?.remove();
      appendMessage("assistant", res.ok && res.reply ? res.reply : aiErrorMessage(res));
      setSending(false);
      input?.focus();
    };

    sendButton?.addEventListener("click", (event) => {
      event.preventDefault();
      submitMessage();
    });
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
      }
    });
    doc.querySelector(".darlink-suggestion-card button")?.addEventListener("click", () => {
      if (!input) return;
      input.value = profile.suggestion;
      input.focus();
    });
    scrollMessages();
  }

  function enhanceHallOfFame(doc) {
    injectStyle(doc, hallEnhancementCss());
    localizeStatic(doc, "hall");
    Array.from(doc.querySelectorAll("button")).forEach((button) => {
      const text = normalize(button.textContent).toLowerCase();
      if (text.includes("chevron_left") || text.includes("chevron_right")) {
        button.dataset.darlinkLocalControl = "true";
        button.setAttribute("aria-label", text.includes("left") ? copy("Previous", "上一位", "上一位") : copy("Next", "下一位", "下一位"));
      }
    });
    const steve = HALL_CHAT_PROFILES["steve-jobs"];
    const heroImage = doc.querySelector(".carousel-item img");
    if (heroImage && steve) {
      heroImage.src = steve.background;
      heroImage.alt = "Steve Jobs digital mentor portrait";
    }
    const list = doc.querySelector("aside .flex.flex-col.gap-4");
    if (!list || list.dataset.darlinkHallEnhanced) return;
    list.dataset.darlinkHallEnhanced = "true";
    const panel = list.closest(".glass-panel");
    if (panel) panel.classList.add("darlink-hall-rank-panel");
    list.className = "darlink-hall-rank-list";
    const order = [
      ["elon-musk", copy("Rank #1 · Tesla / SpaceX", "第 1 名 · Tesla / SpaceX", "第 1 名 · Tesla / SpaceX")],
      ["jensen-huang", copy("Rank #2 · NVIDIA", "第 2 名 · NVIDIA", "第 2 名 · NVIDIA")],
      ["ray-dalio", copy("Rank #3 · Principles", "第 3 名 · 原则", "第 3 名 · 原則")],
      ["jack-ma", copy("Rank #4 · Alibaba", "第 4 名 · 阿里巴巴", "第 4 名 · 阿里巴巴")],
      ["charlie-munger", copy("Rank #5 · Berkshire Hathaway", "第 5 名 · 伯克希尔哈撒韦", "第 5 名 · 波克夏哈撒韋")],
      ["jeff-bezos", copy("Rank #6 · Amazon / Blue Origin", "第 6 名 · Amazon / Blue Origin", "第 6 名 · Amazon / Blue Origin")],
      ["mark-zuckerberg", copy("Rank #7 · Meta", "第 7 名 · Meta", "第 7 名 · Meta")],
      ["richard-feynman", copy("Rank #8 · Physics", "第 8 名 · 物理学", "第 8 名 · 物理學")],
      ["peter-drucker", copy("Rank #9 · Management", "第 9 名 · 管理学", "第 9 名 · 管理學")],
      ["reid-hoffman", copy("Rank #10 · Networks", "第 10 名 · 网络", "第 10 名 · 網絡")],
      ["naval-ravikant", copy("Rank #11 · Leverage", "第 11 名 · 杠杆", "第 11 名 · 槓桿")],
      ["marc-andreessen", copy("Rank #12 · Market Thesis", "第 12 名 · 市场判断", "第 12 名 · 市場判斷")],
    ];
    list.innerHTML = order.map(([id, meta], index) => {
      const profile = HALL_CHAT_PROFILES[id];
      return `<button type="button" class="darlink-hall-row group ${index > 3 ? "darlink-hall-extra" : ""}" ${index > 3 ? "hidden" : ""} data-darlink-hall-id="${id}">
        <span class="darlink-hall-thumb"><img src="${profile.background}" alt="${profile.name} portrait"></span>
        <span class="darlink-hall-copy">
          <strong>${profile.name}</strong>
          <em>${meta}</em>
        </span>
        ${icon("arrow_forward")}
      </button>`;
    }).join("");
    let toggle = Array.from(doc.querySelectorAll("button")).find((button) => /view complete ranking|查看完整榜|查看完整榜單/i.test(button.textContent || ""));
    if (!toggle) {
      toggle = doc.createElement("button");
      panel?.appendChild(toggle);
    } else if (panel && toggle.parentElement !== panel) {
      panel.appendChild(toggle);
    }
    toggle.dataset.darlinkHallToggle = "true";
    toggle.dataset.darlinkLocalControl = "true";
    toggle.type = "button";
    toggle.className = "darlink-hall-toggle";
    toggle.textContent = copy("View Complete Ranking", "查看完整榜单", "查看完整榜單");
    toggle.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const expanding = Array.from(list.querySelectorAll(".darlink-hall-extra")).some((row) => row.hidden);
      list.querySelectorAll(".darlink-hall-extra").forEach((row) => {
        row.hidden = !expanding;
      });
      list.classList.toggle("is-expanded", expanding);
      toggle.setAttribute("aria-expanded", String(expanding));
      toggle.textContent = expanding
        ? copy("Hide Complete Ranking", "收起完整榜单", "收起完整榜單")
        : copy("View Complete Ranking", "查看完整榜单", "查看完整榜單");
    };
    toggle.setAttribute("aria-expanded", "false");
  }

  function enhanceHallChallenge(doc, api) {
    const challenge = read(STORAGE.hallChallenge, {});
    const id = challenge.id && HALL_CHAT_PROFILES[challenge.id] ? challenge.id : "steve-jobs";
    const profile = HALL_CHAT_PROFILES[id];
    const questions = HALL_CHALLENGES[id] || HALL_CHALLENGES["steve-jobs"];
    injectStyle(doc, hallChallengeCss());
    doc.title = `Darlink - ${profile.name} Challenge`;
    doc.body.className = "darlink-hall-challenge-body darlink-page-polished darlink-page-hall-fame-liquid-glass-challenge";
    doc.body.innerHTML = `
      <main class="darlink-challenge-scene">
        <section class="darlink-liquid-stage">
          <div class="darlink-liquid-sky"></div>
          <div class="darlink-liquid-water"><span></span><span></span><span></span></div>
          <div class="darlink-digital-player">
            <div class="darlink-player-aura"></div>
            <div class="darlink-player-avatar">${materialIconSvg("person")}</div>
            <strong>${copy("You as a digital human", "你作为数字人", "你作為數字人")}</strong>
          </div>
        </section>
        <aside class="darlink-challenge-panel">
          <span>${copy("Mystery Icon Challenge", "人物盲盒挑战", "人物盲盒挑戰")}</span>
          <h1>${profile.name}</h1>
          <p>${copy("Answer 6 questions correctly to unlock this hidden digital human. The challenge returns only once for each figure.", "答对 6 道题即可解锁这位隐藏款数字人。每位名人只需要通关一次。", "答對 6 道題即可解鎖這位隱藏款數字人。每位名人只需要通關一次。")}</p>
          <article class="darlink-rising-question" id="darlinkChallengeCard"></article>
          <div class="darlink-challenge-progress"><strong id="darlinkChallengeStep">1/6</strong><em id="darlinkChallengeScore">0 ${copy("correct", "题正确", "題正確")}</em></div>
          <button type="button" class="darlink-challenge-exit" data-darlink-local-control="true">${copy("Back to plaza", "返回广场", "返回廣場")}</button>
        </aside>
      </main>
    `;

    let index = 0;
    let correct = 0;
    const card = doc.querySelector("#darlinkChallengeCard");
    const step = doc.querySelector("#darlinkChallengeStep");
    const score = doc.querySelector("#darlinkChallengeScore");
    const renderQuestion = () => {
      const current = questions[index];
      step.textContent = `${Math.min(index + 1, questions.length)}/${questions.length}`;
      score.textContent = `${correct} ${copy("correct", "题正确", "題正確")}`;
      card.classList.remove("is-correct", "is-wrong", "is-complete");
      card.innerHTML = `
        <span>${copy("Question", "问题", "問題")} ${index + 1}</span>
        <h2>${current[0]}</h2>
        <div class="darlink-challenge-options">
          ${current[1].map((option) => `<button type="button" data-answer="${option}" data-darlink-local-control="true">${option}</button>`).join("")}
        </div>
        <p class="darlink-challenge-feedback"></p>
      `;
      card.querySelectorAll("[data-answer]").forEach((button) => {
        button.dataset.answerBound = "true";
        const submitAnswer = (event) => {
          if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          answerChallenge(button);
        };
        button.addEventListener("click", submitAnswer);
        button.addEventListener("pointerup", submitAnswer);
        button.addEventListener("mouseup", submitAnswer);
        button.addEventListener("keydown", submitAnswer);
      });
    };
    const complete = () => {
      const unlocked = read(STORAGE.hallUnlocked, {});
      unlocked[id] = { unlockedAt: Date.now(), score: correct };
      write(STORAGE.hallUnlocked, unlocked);
      storeChatContext("hall", id);
      step.textContent = `${questions.length}/${questions.length}`;
      score.textContent = `${correct} ${copy("correct", "题正确", "題正確")}`;
      card.classList.add("is-complete");
      card.innerHTML = `
        <span>${copy("Unlocked", "已解锁", "已解鎖")}</span>
        <h2>${copy("Challenge complete.", "挑战通关。", "挑戰通關。")}</h2>
        <p>${copy("This hidden digital human is now available for direct conversation.", "这位隐藏款数字人已解锁，下次点击可直接聊天。", "這位隱藏款數字人已解鎖，下次點擊可直接聊天。")}</p>
        <button type="button" class="darlink-challenge-chat" data-darlink-local-control="true">${copy("Start chatting", "开始聊天", "開始聊天")} ${materialIconSvg("chat_bubble")}</button>
      `;
      card.querySelector(".darlink-challenge-chat").addEventListener("click", () => api.navigate(api.page.matchChat, { immediate: true }));
    };

    const answerChallenge = (button) => {
      if (!button || button.disabled || card.dataset.answering === "true") return;
      card.dataset.answering = "true";
      const current = questions[index];
      const isCorrect = button.dataset.answer === current[2];
      card.querySelectorAll("[data-answer]").forEach((item) => {
        item.disabled = true;
        item.classList.toggle("is-selected", item === button);
        item.classList.toggle("is-answer", item.dataset.answer === current[2]);
      });
      if (isCorrect) correct += 1;
      card.classList.add(isCorrect ? "is-correct" : "is-wrong");
      const feedback = card.querySelector(".darlink-challenge-feedback");
      feedback.textContent = isCorrect
        ? copy("Correct. The water unlocks the next memory.", "回答正确，水面升起下一段记忆。", "回答正確，水面升起下一段記憶。")
        : copy("Not quite. Try again before the question sinks back.", "还差一点，请重新作答，这一题答对后才会继续。", "還差一點，請重新作答，這一題答對後才會繼續。");
      window.setTimeout(() => {
        if (!isCorrect) {
          delete card.dataset.answering;
          card.classList.remove("is-wrong");
          card.querySelectorAll("[data-answer]").forEach((item) => {
            item.disabled = false;
            item.classList.remove("is-selected", "is-answer");
          });
          feedback.textContent = "";
          return;
        }
        index += 1;
        delete card.dataset.answering;
        if (index >= questions.length) complete();
        else renderQuestion();
      }, 900);
    };
    card.addEventListener("click", (event) => {
      const button = event.target.closest && event.target.closest("[data-answer]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      answerChallenge(button);
    });
    doc.querySelector(".darlink-challenge-exit").addEventListener("click", () => api.navigate(api.page.home, { immediate: true }));
    renderQuestion();
  }

  function addModuleBackControl(doc, page, api) {
    const pagesWithBack = new Set([
      api.page.digitalPlaza,
      api.page.exploreChat,
      api.page.xiaodaChat,
      api.page.study,
      api.page.culinary,
      api.page.romance,
      api.page.matching,
      api.page.matchChat,
      api.page.community,
      api.page.hall,
      api.page.hallChallenge,
      api.page.profile,
    ]);
    if (!pagesWithBack.has(page) || doc.querySelector(".darlink-module-back")) return;

    let style = doc.querySelector("style[data-darlink-back-control]");
    if (!style) {
      style = doc.createElement("style");
      style.dataset.darlinkBackControl = "true";
      style.textContent = backControlCss();
      doc.head.appendChild(style);
    }

    const label = "返回";
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "darlink-module-back";
    button.setAttribute("aria-label", label);
    button.innerHTML = `${icon("arrow_back")}<strong>${label}</strong>`;
    doc.body.appendChild(button);
  }

  function localizeStatic(doc, page = "") {
    const t = tr();
    const map = { ...(t.staticMap || {}), ...(page === "home" ? (t.homeMap || {}) : {}) };
    if (lang() === "en") return;
    const walker = doc.createTreeWalker(doc.body, doc.defaultView.NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.parentElement && node.parentElement.closest(".material-symbols-outlined,.darlink-symbol,.darlink-control-glyph")) return;
      const text = node.nodeValue.trim();
      if (map[text]) {
        node.nodeValue = node.nodeValue.replace(text, map[text]);
        return;
      }
      Object.entries(map).forEach(([source, target]) => {
        if (source.length > 10 && node.nodeValue.includes(source)) {
          node.nodeValue = node.nodeValue.split(source).join(target);
        }
      });
      if (lang() !== "en") {
        node.nodeValue = node.nodeValue.replace(/"好奇探索"\./g, '"好奇探索"。');
      }
    });
    if (page === "home" && lang() !== "en") {
      doc.querySelectorAll("p").forEach((paragraph) => {
        if (paragraph.textContent.includes('"好奇探索".')) {
          paragraph.textContent = paragraph.textContent.replace(/"好奇探索"\./g, '"好奇探索"。');
        }
      });
    }
    doc.querySelectorAll("[placeholder], [aria-label], [title]").forEach((element) => {
      ["placeholder", "aria-label", "title"].forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value && map[value]) element.setAttribute(attr, map[value]);
      });
    });
  }

  function replaceMaterialIconFallbacks(doc) {
    doc.querySelectorAll(".material-symbols-outlined").forEach((node) => {
      const key = normalize(node.dataset.icon || node.textContent);
      if (!key || node.dataset.darlinkIconReady === "true") return;
      node.dataset.icon = node.dataset.icon || key;
      node.innerHTML = materialIconSvg(key);
      node.dataset.darlinkIconReady = "true";
      node.classList.add("darlink-material-fallback");
      node.style.fontFamily = "inherit";
      node.style.fontWeight = "900";
      node.style.lineHeight = "1";
      node.style.letterSpacing = "0";
      node.style.display = "inline-flex";
      node.style.alignItems = "center";
      node.style.justifyContent = "center";
      node.setAttribute("aria-hidden", "true");
    });
  }

  function watchMaterialIconFallbacks(doc) {
    if (!doc || !doc.body || doc.body.dataset.darlinkIconObserver === "true") return;
    doc.body.dataset.darlinkIconObserver = "true";
  }

  function startSpeech(doc) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const input = doc.querySelector("#darlinkChatInput");
    if (!Recognition || !input) {
      input.placeholder = tr().voiceUnsupported;
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang() === "en" ? "en-US" : lang() === "zhHant" ? "zh-HK" : "zh-CN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      input.value = event.results[0][0].transcript;
      input.focus();
    };
    recognition.start();
  }

  async function postJSON(url, payload) {
    try {
      const targetUrl = resolveApiUrl(url);
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { ...data, ok: false, status: response.status };
      return data;
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function resolveApiUrl(url) {
    if (!url.startsWith("/api/")) return url;
    const configured = localStorage.getItem("darlink-api-base") || window.DARLINK_API_BASE_URL || "";
    if (configured) return `${configured.replace(/\/$/, "")}${url}`;
    if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
      if (!["8000", "8081", "8082"].includes(location.port)) return `http://127.0.0.1:8000${url}`;
    }
    return url;
  }

  function onboardingBackdrop() {
    return `<div class="darlink-orb one"></div><div class="darlink-orb two"></div><div class="darlink-orb three"></div>`;
  }

  function progressHeader(label, step) {
    return `<header class="darlink-progress">
      <div><strong>${label}</strong><em>${step}/3</em></div>
      <div class="darlink-progress-track"><span style="width:${(step / 3) * 100}%"></span></div>
    </header>`;
  }

  function xiaodaPanel(title, body) {
    return `<aside class="darlink-xiaoda-panel">
      <div class="darlink-xiaoda-glow"></div>
      <img src="/files/v13-ai-twin-crop.png" alt="${title}">
      <div class="darlink-xiaoda-caption">
        <span>${icon("auto_awesome")} ${title}</span>
        <h2>${title}</h2>
        <p>${body}</p>
      </div>
    </aside>`;
  }

  function sharedCss() {
    return `
      .darlink-primary-btn,.darlink-secondary-btn,.darlink-icon-btn{border:0;cursor:pointer;font-weight:850;transition:transform .2s ease,box-shadow .2s ease,opacity .2s ease}.darlink-primary-btn[disabled],.darlink-secondary-btn[disabled],.darlink-icon-btn[disabled]{opacity:.55;cursor:not-allowed}
      .darlink-primary-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;padding:15px 22px;background:linear-gradient(135deg,#6f5092,#006686);color:white;box-shadow:0 16px 36px rgba(111,80,146,.22)}
      .darlink-secondary-btn{border:1px solid rgba(111,80,146,.2);border-radius:999px;padding:12px 16px;background:rgba(255,255,255,.72);color:#604283}
      .darlink-icon-btn{width:48px;height:48px;border-radius:18px;background:rgba(255,255,255,.65);color:#604283}.darlink-icon-btn.primary{background:linear-gradient(135deg,#d8b4fe,#7ed4fd);color:white}
      .darlink-symbol{display:inline-flex;align-items:center;justify-content:center;line-height:1;font-weight:900;font-family:inherit}.darlink-control-glyph{display:inline-flex;align-items:center;justify-content:center;min-width:2em;font-size:12px;line-height:1;font-weight:900;letter-spacing:0}.darlink-material-fallback{display:inline-flex;align-items:center;justify-content:center;line-height:1;vertical-align:-.125em;font-family:inherit!important;letter-spacing:0!important}.darlink-material-svg{width:1em;height:1em;display:block;overflow:visible;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      .darlink-chip{border:1px solid rgba(111,80,146,.18);background:rgba(255,255,255,.55);border-radius:999px;padding:10px 13px;color:#4a454f;font-weight:750;font-size:13px;cursor:pointer;transition:.2s ease}.darlink-chip:hover{background:linear-gradient(135deg,#efdbff,#c0e8ff);color:#29074a;transform:translateY(-1px)}
      .darlink-textarea{width:100%;border:1px solid rgba(255,255,255,.68);background:rgba(255,255,255,.62);border-radius:18px;padding:14px 16px;color:#111c2d;outline:none;box-shadow:inset 0 1px 5px rgba(31,42,68,.04);resize:none}.darlink-textarea:focus{box-shadow:0 0 0 3px rgba(216,180,254,.45),inset 0 1px 5px rgba(31,42,68,.04)}.darlink-textarea.is-sending{transform:scale(.992);filter:saturate(.94)}
    `;
  }

  function loginCss() {
    return `
      .darlink-auth-form{display:flex;flex-direction:column;gap:12px;margin-top:12px}.darlink-auth-label{font-size:12px;font-weight:850;color:#604283;letter-spacing:.04em;text-transform:uppercase}
      .darlink-auth-input{border-radius:18px;padding:14px 16px;width:100%}.darlink-auth-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}
      .darlink-remember{display:flex;align-items:center;gap:8px;color:#4a454f;font-size:13px;font-weight:700}.darlink-auth-status{min-height:22px;font-size:13px;font-weight:750;color:#604283}
      .darlink-auth-status[data-tone='error']{color:#ba1a1a}.darlink-auth-status[data-tone='success']{color:#005b78}
    `;
  }

  function onboardingCss() {
    return `
      .darlink-onboarding-body{min-height:100vh;margin:0;overflow:hidden;background:linear-gradient(135deg,#f9fbff 0%,#f8f0ff 48%,#edf8ff 100%);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#111c2d}
      .darlink-orb{position:fixed;border-radius:50%;filter:blur(70px);opacity:.45;pointer-events:none}.darlink-orb.one{width:360px;height:360px;left:-80px;top:-80px;background:#d8b4fe}.darlink-orb.two{width:380px;height:380px;right:-100px;bottom:-100px;background:#7ed4fd}.darlink-orb.three{width:260px;height:260px;left:44%;top:18%;background:#fcaad6;opacity:.2}
      .darlink-onboarding-shell{position:relative;z-index:1;max-width:1280px;margin:0 auto;height:100vh;padding:28px 28px 32px;display:flex;flex-direction:column;gap:22px}
      .darlink-progress{max-width:620px;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:10px}.darlink-progress>div:first-child{display:flex;align-items:center;justify-content:center;gap:10px;color:#604283;text-transform:uppercase;letter-spacing:.08em;font-size:12px;font-weight:850}.darlink-progress em{font-style:normal;color:#8a486f}.darlink-progress-track{height:8px;border-radius:999px;background:rgba(216,227,251,.72);overflow:hidden}.darlink-progress-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6f5092,#fcaad6,#7ed4fd);box-shadow:0 0 18px rgba(216,180,254,.75)}
      .darlink-onboarding-stage{flex:1;min-height:0;display:grid;grid-template-columns:minmax(300px,420px) minmax(0,1fr);gap:28px;align-items:stretch}
      .darlink-xiaoda-panel{position:relative;overflow:hidden;border-radius:34px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.62);box-shadow:0 24px 70px rgba(111,80,146,.14);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:26px}.darlink-xiaoda-glow{position:absolute;inset:10%;background:radial-gradient(circle,rgba(216,180,254,.45),rgba(126,212,253,.15),transparent 62%);filter:blur(12px)}.darlink-xiaoda-panel img{position:relative;z-index:1;width:min(92%,340px);max-height:64vh;object-fit:contain;filter:drop-shadow(0 28px 44px rgba(60,70,100,.2));animation:darlinkFloat 4.6s ease-in-out infinite}.darlink-xiaoda-caption{position:relative;z-index:2;width:100%;border-radius:24px;background:rgba(255,255,255,.66);border:1px solid rgba(255,255,255,.72);padding:18px;backdrop-filter:blur(20px)}.darlink-xiaoda-caption span{display:flex;align-items:center;gap:6px;color:#8a486f;font-size:12px;font-weight:850}.darlink-xiaoda-caption h2{font-size:22px;line-height:1.15;margin:8px 0;color:#111c2d}.darlink-xiaoda-caption p{margin:0;color:#4a454f;line-height:1.55;font-size:14px}
      @keyframes darlinkFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
      .darlink-chat-panel{overflow:auto;border-radius:34px;background:rgba(255,255,255,.58);border:1px solid rgba(255,255,255,.68);box-shadow:0 24px 70px rgba(31,42,68,.08);padding:28px;backdrop-filter:blur(24px)}.darlink-panel-title span{color:#8a486f;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:900}.darlink-panel-title h1{font-size:34px;line-height:1.04;margin:8px 0 8px}.darlink-panel-title p{margin:0 0 18px;color:#4a454f}
      .darlink-chat-window{height:48vh;min-height:330px;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:26px;background:rgba(255,255,255,.38);border:1px solid rgba(255,255,255,.68);scroll-behavior:smooth}.darlink-message{max-width:82%;border-radius:22px;padding:13px 16px;line-height:1.55;font-size:15px;animation:darlinkMessageIn .26s cubic-bezier(.16,1,.3,1)}.darlink-message.xiaoda{align-self:flex-start;background:rgba(255,255,255,.78);color:#111c2d;border-top-left-radius:6px;box-shadow:0 10px 30px rgba(111,80,146,.08)}.darlink-message.user{align-self:flex-end;background:linear-gradient(135deg,#6f5092,#006686);color:white;border-top-right-radius:6px}.darlink-message.thinking span{display:inline-block;width:5px;height:5px;margin-left:4px;border-radius:50%;background:#8a486f;animation:darlinkDot 900ms infinite}.darlink-message.thinking span:nth-child(2){animation-delay:120ms}.darlink-message.thinking span:nth-child(3){animation-delay:240ms}@keyframes darlinkDot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}@keyframes darlinkMessageIn{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .darlink-quick-replies{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.darlink-chat-input-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:end}.darlink-chat-actions{display:flex;justify-content:space-between;gap:12px;margin-top:14px}.darlink-chat-action-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.darlink-analysis-status{min-height:24px;color:#ba1a1a;font-weight:800;font-size:13px;margin:8px 0}.darlink-analysis-status[data-tone='success']{color:#005b78}.darlink-analysis-status[data-tone='info']{color:#604283}
      @media(max-width:900px){.darlink-onboarding-body{overflow:auto}.darlink-onboarding-shell{height:auto;min-height:100vh}.darlink-onboarding-stage{grid-template-columns:1fr}.darlink-xiaoda-panel{min-height:520px}}
    `;
  }

  function digitalPlazaCss() {
    return `.darlink-digital-plaza-card{min-height:520px}.darlink-plaza-avatars{display:flex;align-items:center;margin-top:18px}.darlink-plaza-avatars span{width:46px;height:46px;margin-right:-10px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#fff,#efd8ff 45%,#d6f2ff);border:1px solid rgba(255,255,255,.78);box-shadow:0 12px 28px rgba(111,80,146,.14);color:#604283;font-weight:900}.darlink-plaza-new-twin{margin-top:24px;padding:18px;border-radius:24px;background:linear-gradient(135deg,rgba(255,255,255,.62),rgba(239,248,255,.54));border:1px solid rgba(255,255,255,.72);display:flex;align-items:center;gap:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}`;
  }

  function homeDiscoveryCss() {
    return `
      .darlink-home-discovery-body{min-height:100vh;margin:0;background:linear-gradient(135deg,#f9fbff 0%,#f7f1ff 48%,#eef9ff 100%);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#111c2d;overflow-x:hidden}
      .darlink-home-shell{width:min(1480px,calc(100vw - 48px));margin:0 auto;padding:34px 0 54px;display:flex;flex-direction:column;gap:22px}
      .darlink-home-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:22px}.darlink-home-hero span,.darlink-ranking-head span,.darlink-section-head span,.darlink-my-twin>span{display:block;color:#8a486f;font-size:12px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.darlink-home-hero h1{max-width:760px;margin:8px 0 10px;font-size:clamp(34px,5vw,64px);line-height:1.02}.darlink-home-hero p{max-width:760px;margin:0;color:#4a454f;line-height:1.7}
      .darlink-home-ranking,.darlink-home-plaza,.darlink-my-twin{border:1px solid rgba(255,255,255,.74);background:rgba(255,255,255,.58);box-shadow:0 24px 70px rgba(31,42,68,.09);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
      .darlink-home-ranking{border-radius:28px;padding:18px}.darlink-ranking-head{display:flex;align-items:center;justify-content:space-between;gap:16px}.darlink-ranking-head h2{margin:4px 0 0;font-size:22px}.darlink-ranking-head button{border:1px solid rgba(111,80,146,.18);border-radius:999px;background:rgba(255,255,255,.66);color:#604283;padding:10px 14px;font-weight:900;cursor:pointer}
      .darlink-ranking-list{margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-height:74px;overflow:hidden;transition:max-height .26s ease}.darlink-ranking-list.is-expanded{max-height:230px;overflow-y:auto;grid-template-columns:repeat(5,minmax(180px,1fr));padding-right:4px}.darlink-ranking-row{min-height:64px;border:1px solid rgba(111,80,146,.12);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(239,248,255,.62));display:flex;align-items:center;gap:12px;padding:10px 12px;text-align:left;color:#111c2d;cursor:pointer}.darlink-ranking-row strong{display:grid;place-items:center;width:34px;height:34px;border-radius:12px;background:linear-gradient(135deg,#6f5092,#006686);color:white}.darlink-ranking-row span{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;font-weight:900}.darlink-ranking-row em{font-style:normal;color:#4a454f;font-size:12px;font-weight:760}.darlink-ranking-row b{color:#8a486f}
      .darlink-home-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(320px,.72fr);gap:22px;align-items:start}.darlink-home-plaza,.darlink-my-twin{border-radius:30px;padding:22px}.darlink-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}.darlink-section-head h2{margin:4px 0 0;font-size:28px}.darlink-plaza-filters{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.darlink-plaza-filters button{border:1px solid rgba(111,80,146,.16);border-radius:999px;background:rgba(255,255,255,.62);color:#604283;padding:9px 12px;font-size:12px;font-weight:900;cursor:pointer}.darlink-plaza-filters button.is-active{background:linear-gradient(135deg,#6f5092,#006686);color:white;box-shadow:0 12px 26px rgba(111,80,146,.22)}
      .darlink-home-plaza-scroll{height:min(68vh,760px);min-height:560px;overflow-y:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding-right:4px;scroll-behavior:smooth}.darlink-home-twin-card{min-height:300px;border:1px solid rgba(255,255,255,.78);border-radius:24px;background:rgba(255,255,255,.72);box-shadow:0 16px 42px rgba(111,80,146,.1);padding:18px;display:flex;flex-direction:column;gap:13px;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}.darlink-home-twin-card:hover{transform:translateY(-3px);box-shadow:0 22px 48px rgba(111,80,146,.16)}.darlink-home-twin-card.is-hidden-icon{border-color:rgba(252,170,214,.92);box-shadow:0 0 0 2px rgba(252,170,214,.28),0 22px 54px rgba(138,72,111,.16);background:linear-gradient(145deg,rgba(255,255,255,.78),rgba(239,219,255,.58))}
      .darlink-home-avatar{width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,var(--from),var(--to));display:grid;place-items:center;color:white;font-size:22px;font-weight:950;overflow:hidden;box-shadow:0 16px 34px rgba(111,80,146,.2)}.darlink-home-avatar img{width:100%;height:100%;object-fit:cover}.darlink-home-twin-card h3{margin:0;font-size:21px}.darlink-home-twin-card p{margin:0;color:#4a454f;line-height:1.56;font-size:13px}.darlink-home-role{color:#604283!important;font-weight:900}.darlink-home-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:auto}.darlink-home-tags span{border-radius:999px;background:#efdbff;color:#604283;padding:6px 9px;font-size:11px;font-weight:850}.darlink-home-twin-card>button{border:0;border-radius:16px;background:linear-gradient(135deg,#6f5092,#006686);color:white;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;cursor:pointer}
      .darlink-my-twin{position:sticky;top:102px;display:flex;flex-direction:column;gap:16px}.darlink-my-twin-orb{width:86px;height:86px;border-radius:28px;background:radial-gradient(circle at 28% 22%,#fff,transparent 34%),linear-gradient(135deg,#6f5092,#7ed4fd);color:white;display:grid;place-items:center;font-size:30px;box-shadow:0 20px 44px rgba(111,80,146,.22)}.darlink-my-twin h2{margin:0;font-size:30px;line-height:1.1}.darlink-my-twin p{margin:0;color:#4a454f;line-height:1.68}.darlink-my-profile-cards{display:flex;flex-direction:column;gap:9px}.darlink-my-profile-cards article{border-radius:18px;background:rgba(255,255,255,.64);border:1px solid rgba(111,80,146,.1);padding:12px}.darlink-my-profile-cards strong{display:block;color:#111c2d}.darlink-my-profile-cards em{font-style:normal;color:#8a486f;font-size:12px;font-weight:850}.darlink-refine-btn{margin-top:4px;border:0;border-radius:999px;background:linear-gradient(135deg,#8a486f,#006686);color:white;min-height:52px;padding:0 18px;font-weight:950;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;box-shadow:0 18px 40px rgba(138,72,111,.22)}
      @media(max-width:1180px){.darlink-home-grid{grid-template-columns:1fr}.darlink-my-twin{position:relative;top:auto}.darlink-home-plaza-scroll{grid-template-columns:repeat(2,minmax(0,1fr))}.darlink-ranking-list,.darlink-ranking-list.is-expanded{grid-template-columns:1fr 1fr;max-height:260px}}@media(max-width:700px){.darlink-home-shell{width:calc(100vw - 28px);padding-top:22px}.darlink-section-head,.darlink-ranking-head{align-items:flex-start;flex-direction:column}.darlink-home-plaza-scroll{height:auto;min-height:0;grid-template-columns:1fr}.darlink-ranking-list,.darlink-ranking-list.is-expanded{grid-template-columns:1fr}.darlink-home-hero h1{font-size:34px}}
    `;
  }

  function exploreChatCss() {
    return `
      .darlink-explore-chat nav.h-screen,.darlink-explore-chat body>nav{gap:14px}
      .darlink-side-caption{margin-top:6px;font-size:12px;font-weight:800;color:#8a486f;letter-spacing:.08em;text-transform:uppercase}
      .darlink-side-actions{display:flex;flex-direction:column;gap:8px;padding:0 18px;flex:1}
      .darlink-side-item{width:100%;border:0;background:transparent;color:#4a454f;border-radius:18px;padding:12px 14px;display:flex;align-items:center;gap:12px;font-weight:850;text-align:left;cursor:pointer;transition:.18s ease}
      .darlink-side-item:hover,.darlink-side-item.is-active{background:linear-gradient(135deg,rgba(216,180,254,.36),rgba(126,212,253,.22));color:#604283;transform:translateX(2px)}
      .darlink-side-item em{margin-left:auto;font-style:normal;font-size:18px;transition:transform .18s ease}
      .darlink-guide-card,.darlink-message-history{margin:0 4px 8px 42px;border-radius:20px;background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.76);box-shadow:0 16px 36px rgba(111,80,146,.12);padding:14px;backdrop-filter:blur(20px)}
      .darlink-guide-card strong{display:block;color:#111c2d;font-size:14px;margin-bottom:6px}.darlink-guide-card p{margin:0;color:#4a454f;font-size:12px;line-height:1.55}.darlink-guide-bubble{margin-top:10px;border-radius:16px;background:linear-gradient(135deg,#1fb7d0,#27bfd6);color:white;padding:12px 14px;font-size:12px;font-weight:800;box-shadow:0 12px 28px rgba(0,102,134,.18);position:relative}.darlink-guide-bubble:before{content:"";position:absolute;left:18px;top:-7px;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid #1fb7d0}
      .darlink-message-history{display:flex;flex-direction:column;gap:8px}.darlink-message-history[hidden],.darlink-guide-card[hidden]{display:none}.darlink-message-history button{border:0;border-radius:14px;background:rgba(240,243,255,.78);padding:10px 12px;text-align:left;color:#604283;font-size:12px;font-weight:850;cursor:pointer}
      .darlink-mood-control{min-width:168px;height:42px;border:1px solid rgba(255,255,255,.62);border-radius:999px;background:rgba(255,255,255,.58);box-shadow:0 12px 28px rgba(31,42,68,.08);display:flex;align-items:center;gap:8px;padding:0 9px 0 14px;color:#604283;font-weight:900}
      .darlink-mood-control span{font-size:12px;white-space:nowrap}.darlink-mood-control select{min-width:0;max-width:128px;border:0;background:transparent;color:#111c2d;font-size:12px;font-weight:850;outline:none;cursor:pointer}
    `;
  }

  function discoveryModuleCss() {
    return `
      .darlink-no-module-sidebar aside{display:none!important}
      .darlink-module-main-expanded{max-width:1440px!important;margin-left:auto!important;margin-right:auto!important;width:100%!important}
      [data-darlink-chat-id] button,[data-darlink-chat-id][role='button']{cursor:pointer}
      [data-darlink-chat-id] button:hover{filter:saturate(1.08);transform:translateY(-1px)}
    `;
  }

  function digitalPlazaPageCss() {
    return `
      .darlink-plaza-main{width:min(1380px,calc(100vw - 48px));margin:0 auto;padding:52px 0 64px;display:flex;flex-direction:column;gap:26px}
      .darlink-plaza-hero{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:24px;align-items:end;border-radius:34px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78);box-shadow:0 30px 90px rgba(31,42,68,.1);padding:34px;backdrop-filter:blur(24px)}
      .darlink-plaza-hero p{margin:0 0 12px;color:#8a486f;font-size:12px;text-transform:uppercase;letter-spacing:.18em;font-weight:950}.darlink-plaza-hero h1{margin:0;max-width:880px;font-size:clamp(34px,5vw,70px);line-height:1.02;color:#111c2d}.darlink-plaza-hero span{display:block;margin-top:18px;color:#4a454f;line-height:1.7}.darlink-plaza-hero aside{border-radius:28px;background:linear-gradient(135deg,#6f5092,#006686);color:white;padding:24px;box-shadow:0 22px 44px rgba(111,80,146,.22)}.darlink-plaza-hero aside strong{display:block;font-size:52px;line-height:1}.darlink-plaza-hero aside em{font-style:normal;font-size:13px;font-weight:850;opacity:.82}
      .darlink-plaza-scroll{height:min(68vh,760px);min-height:520px;overflow-y:auto;border-radius:34px;background:rgba(255,255,255,.36);border:1px solid rgba(255,255,255,.68);padding:20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;scroll-behavior:smooth;box-shadow:inset 0 1px 0 rgba(255,255,255,.72)}
      .darlink-plaza-person{min-height:310px;border-radius:28px;background:rgba(255,255,255,.74);border:1px solid rgba(255,255,255,.78);padding:22px;display:flex;flex-direction:column;gap:16px;box-shadow:0 18px 48px rgba(111,80,146,.1)}
      .darlink-plaza-avatar{width:72px;height:72px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,var(--from),var(--to));color:white;font-weight:950;font-size:22px;box-shadow:0 18px 38px rgba(111,80,146,.22)}
      .darlink-plaza-person h3{margin:0;font-size:22px;color:#111c2d}.darlink-plaza-person p{margin:0;color:#4a454f;line-height:1.62;font-size:14px}.darlink-plaza-role{color:#6f5092!important;font-weight:900}.darlink-plaza-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.darlink-plaza-tags span{border-radius:999px;background:#efdbff;color:#604283;padding:6px 10px;font-size:12px;font-weight:850}
      .darlink-plaza-person button{margin-top:auto;border:0;border-radius:18px;padding:12px 14px;background:linear-gradient(135deg,#6f5092,#006686);color:white;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
      @media(max-width:980px){.darlink-plaza-hero{grid-template-columns:1fr}.darlink-plaza-scroll{grid-template-columns:1fr 1fr}}@media(max-width:640px){.darlink-plaza-main{width:calc(100vw - 28px);padding-top:28px}.darlink-plaza-scroll{grid-template-columns:1fr;height:auto;min-height:0}.darlink-plaza-hero{padding:24px}}
    `;
  }

  function matchingPolishCss() {
    return `
      [data-darlink-refresh='true'].is-refreshing .darlink-material-svg,[data-darlink-refresh='true'].is-refreshing .material-symbols-outlined{animation:darlinkSpin .72s cubic-bezier(.16,1,.3,1)}
      [data-darlink-refresh='true'].is-refreshing{box-shadow:0 0 0 8px rgba(216,180,254,.18),0 16px 34px rgba(111,80,146,.2)}
      @keyframes darlinkSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    `;
  }

  function pageSpecificPolishCss() {
    return `
      body.darlink-page-events-campus-resonance-hub main,body.darlink-page-community-campus-pulse-feed main{padding-top:36px}
      body.darlink-page-events-campus-resonance-hub .darlink-standard-topbar+main,body.darlink-page-community-campus-pulse-feed .darlink-standard-topbar+main{margin-top:0}
      body.darlink-page-events-campus-resonance-hub .darlink-standard-topbar{margin-bottom:0}
    `;
  }

  function profilePolishCss() {
    return `
      aside nav a{transition:transform .18s ease,background .18s ease}aside nav a:hover{transform:translateX(2px)}
      .darlink-profile-collapse{position:absolute;right:14px;top:18px;z-index:3;width:38px;height:38px;border:1px solid rgba(255,255,255,.62);border-radius:14px;background:rgba(255,255,255,.64);color:#604283;display:grid;place-items:center;cursor:pointer;box-shadow:0 12px 28px rgba(31,42,68,.1)}
      body.darlink-profile-sidebar-collapsed aside{width:88px!important;padding-left:14px!important;padding-right:14px!important;align-items:center}
      body.darlink-profile-sidebar-collapsed aside nav a{justify-content:center;padding-left:0!important;padding-right:0!important;width:56px;height:52px}
      body.darlink-profile-sidebar-collapsed aside nav a span:not(.material-symbols-outlined),body.darlink-profile-sidebar-collapsed aside>div:not(:first-child) p,body.darlink-profile-sidebar-collapsed aside>div:not(:first-child) button,body.darlink-profile-sidebar-collapsed aside .font-headline-md:not(.material-symbols-outlined){display:none!important}
      body.darlink-profile-sidebar-collapsed aside>div:first-of-type{justify-content:center;margin-bottom:28px!important}
      body.darlink-profile-sidebar-collapsed main{margin-left:88px!important}
      @media(max-width:767px){.darlink-profile-collapse{display:none}body.darlink-profile-sidebar-collapsed main{margin-left:0!important}}
    `;
  }

  function xiaodaFreeChatCss() {
    return `
      .darlink-xiaoda-free-body{min-height:100vh;margin:0;background:linear-gradient(135deg,#f9fbff 0%,#f7f0ff 48%,#edf8ff 100%);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#111c2d;overflow:hidden}
      .darlink-xiaoda-free-shell{height:100vh;display:grid;grid-template-columns:360px minmax(0,1fr);gap:26px;padding:28px;max-width:1280px;margin:0 auto}.darlink-xiaoda-free-rail,.darlink-xiaoda-free-chat{border-radius:34px;background:rgba(255,255,255,.58);border:1px solid rgba(255,255,255,.72);box-shadow:0 24px 70px rgba(31,42,68,.08);backdrop-filter:blur(24px)}
      .darlink-xiaoda-free-rail{padding:28px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(160deg,rgba(255,255,255,.68),rgba(239,248,255,.48))}.darlink-xiaoda-free-rail span{display:grid;place-items:center;width:64px;height:64px;border-radius:22px;background:linear-gradient(135deg,#6f5092,#7ed4fd);color:white}.darlink-xiaoda-free-rail h1{font-size:46px;margin:24px 0 10px}.darlink-xiaoda-free-rail p{color:#4a454f;line-height:1.7}
      .darlink-xiaoda-free-chat{display:flex;flex-direction:column;overflow:hidden}.darlink-xiaoda-free-chat header{padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.62);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.38)}.darlink-xiaoda-free-chat header strong{font-size:24px}.darlink-xiaoda-free-chat header p{margin:4px 0 0;color:#4a454f}.darlink-xiaoda-free-chat header span{border-radius:999px;background:#e9fff5;color:#047857;padding:7px 12px;font-size:12px;font-weight:900}
      .darlink-free-messages{flex:1;overflow:auto;padding:24px;display:flex;flex-direction:column;gap:12px}.darlink-free-message{max-width:min(680px,86%);border-radius:22px;padding:14px 16px;line-height:1.58;animation:darlinkMessageIn .22s ease}.darlink-free-message.ai{align-self:flex-start;background:rgba(255,255,255,.78);border-top-left-radius:7px;color:#111c2d}.darlink-free-message.user{align-self:flex-end;background:linear-gradient(135deg,#6f5092,#006686);color:white;border-top-right-radius:7px}.darlink-free-message.thinking span{display:inline-block;width:5px;height:5px;margin-left:4px;border-radius:50%;background:#8a486f;animation:darlinkDot 900ms infinite}.darlink-free-message.thinking span:nth-child(2){animation-delay:120ms}.darlink-free-message.thinking span:nth-child(3){animation-delay:240ms}
      .darlink-free-input{padding:18px 22px;display:grid;grid-template-columns:1fr 52px;gap:12px;background:linear-gradient(180deg,transparent,rgba(255,255,255,.62))}.darlink-free-input input{border:1px solid rgba(255,255,255,.76);border-radius:999px;background:rgba(255,255,255,.72);padding:0 18px;outline:none;font-size:15px}.darlink-free-input button{height:52px;border:0;border-radius:999px;background:linear-gradient(135deg,#6f5092,#006686);color:white;display:grid;place-items:center;cursor:pointer}
      @media(max-width:860px){.darlink-xiaoda-free-body{overflow:auto}.darlink-xiaoda-free-shell{height:auto;min-height:100vh;grid-template-columns:1fr;padding:18px}.darlink-xiaoda-free-chat{min-height:620px}}
    `;
  }

  function contextualChatCss() {
    return `
      body.darlink-contextual-chat{position:relative;isolation:isolate}
      body.darlink-contextual-chat.darlink-hall-chat{background:#070b18!important;color:#f8fbff}
      body.darlink-contextual-chat.darlink-hall-chat:before{content:"";position:fixed;inset:0;z-index:-2;background:var(--darlink-chat-bg) center/cover no-repeat;opacity:.46;filter:saturate(1.08) contrast(1.05);pointer-events:none}
      body.darlink-contextual-chat.darlink-hall-chat:after{content:"";position:fixed;inset:0;z-index:-1;background:linear-gradient(135deg,rgba(3,7,18,.92),rgba(15,23,42,.82) 46%,rgba(35,18,54,.88));pointer-events:none}
      body.darlink-contextual-chat.darlink-hall-chat header,body.darlink-contextual-chat.darlink-hall-chat .glass-card,body.darlink-contextual-chat.darlink-hall-chat .glass-input{background:rgba(10,15,31,.7)!important;border-color:rgba(255,255,255,.14)!important;color:#f8fbff!important}
      body.darlink-contextual-chat.darlink-hall-chat .text-on-surface,body.darlink-contextual-chat.darlink-hall-chat .text-on-surface-variant{color:rgba(248,251,255,.9)!important}
      body.darlink-contextual-chat.darlink-hall-chat .glass-bubble-ai,body.darlink-contextual-chat.darlink-hall-chat .darlink-suggestion-card{background:rgba(10,15,31,.72)!important;border-color:rgba(255,255,255,.16)!important;color:#f8fbff!important;box-shadow:0 20px 50px rgba(0,0,0,.24)}
      body.darlink-contextual-chat.darlink-hall-chat .glass-bubble-ai p,body.darlink-contextual-chat.darlink-hall-chat .darlink-suggestion-card p,body.darlink-contextual-chat.darlink-hall-chat .darlink-suggestion-card span{color:rgba(248,251,255,.92)!important}
      body.darlink-contextual-chat #chat-messages{scroll-behavior:smooth}
      body.darlink-contextual-chat .glass-bubble-ai,body.darlink-contextual-chat .darlink-suggestion-card,body.darlink-contextual-chat .glass-input{background:rgba(255,255,255,.72)!important;border:1px solid rgba(255,255,255,.76)!important;backdrop-filter:blur(24px)}
      body.darlink-contextual-chat .darlink-context-message{animation:darlinkContextMessageIn .22s ease}
      body.darlink-contextual-chat .darlink-context-message.thinking span{display:inline-block;width:5px;height:5px;margin-left:4px;border-radius:999px;background:#8a486f;animation:darlinkContextDot 900ms infinite}
      body.darlink-contextual-chat .darlink-context-message.thinking span:nth-child(2){animation-delay:120ms}
      body.darlink-contextual-chat .darlink-context-message.thinking span:nth-child(3){animation-delay:240ms}
      body.darlink-contextual-chat .glass-input.is-sending{opacity:.86}
      body.darlink-contextual-chat .glass-input button:disabled{opacity:.55;cursor:wait}
      body.darlink-contextual-chat .glass-input input:disabled{cursor:wait}
      @keyframes darlinkContextMessageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes darlinkContextDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
    `;
  }

  function hallEnhancementCss() {
    return `
      .darlink-hall-rank-panel{max-height:600px;min-height:600px;overflow:hidden}
      .darlink-hall-rank-list{display:flex;flex-direction:column;gap:12px;overflow:hidden;min-height:0}
      .darlink-hall-rank-list.is-expanded{overflow-y:auto;padding-right:4px}
      .darlink-hall-row{width:100%;display:flex;align-items:center;gap:14px;border:1px solid transparent;border-radius:18px;background:rgba(255,255,255,.04);padding:10px 12px;text-align:left;color:white;cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease}
      .darlink-hall-row[hidden]{display:none!important}
      .darlink-hall-row:hover{transform:translateY(-2px);background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.14)}
      .darlink-hall-thumb{width:58px;height:58px;border-radius:18px;overflow:hidden;flex:0 0 auto;border:2px solid rgba(255,255,255,.18)}
      .darlink-hall-thumb img{width:100%;height:100%;object-fit:cover}
      .darlink-hall-copy{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
      .darlink-hall-copy strong{font-size:15px;line-height:1.2}
      .darlink-hall-copy em{font-style:normal;color:rgba(255,255,255,.58);font-size:12px;line-height:1.2}
      .darlink-hall-row .material-symbols-outlined{color:rgba(255,255,255,.35);transition:transform .18s ease,color .18s ease}
      .darlink-hall-row:hover .material-symbols-outlined{transform:translateX(3px);color:white}
      .darlink-hall-toggle{margin-top:16px;width:100%;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.08);color:white;padding:12px 16px;font-weight:850;cursor:pointer;transition:background .18s ease,transform .18s ease}
      .darlink-hall-toggle:hover{background:rgba(255,255,255,.14);transform:translateY(-1px)}
      @media(max-width:767px){.darlink-hall-rank-panel{max-height:none;min-height:auto}.darlink-hall-rank-list.is-expanded{max-height:520px}}
    `;
  }

  function hallChallengeCss() {
    return `
      .darlink-hall-challenge-body{min-height:100vh;margin:0;overflow:hidden;background:#050814;color:#f8fbff;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
      .darlink-challenge-scene{height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:26px;padding:28px;isolation:isolate}
      .darlink-liquid-stage{position:relative;overflow:hidden;border-radius:32px;background:radial-gradient(circle at 50% 18%,rgba(126,212,253,.22),transparent 34%),linear-gradient(180deg,#070b18 0%,#081020 58%,#040713 100%);border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 100px rgba(0,0,0,.42);perspective:1100px}
      .darlink-liquid-sky{position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(216,180,254,.2),transparent 30%),radial-gradient(circle at 78% 18%,rgba(252,170,214,.16),transparent 26%);filter:saturate(1.15)}
      .darlink-liquid-water{position:absolute;left:-8%;right:-8%;bottom:-12%;height:44%;transform:rotateX(64deg);transform-origin:center bottom;border-radius:50% 50% 0 0;background:linear-gradient(135deg,rgba(126,212,253,.32),rgba(216,180,254,.22),rgba(255,255,255,.08));box-shadow:inset 0 0 70px rgba(255,255,255,.2),0 -16px 80px rgba(126,212,253,.2);overflow:hidden}
      .darlink-liquid-water span{position:absolute;inset:12%;border-radius:50%;border:1px solid rgba(255,255,255,.18);animation:darlinkRipple 4.6s ease-in-out infinite}.darlink-liquid-water span:nth-child(2){inset:24%;animation-delay:.8s}.darlink-liquid-water span:nth-child(3){inset:36%;animation-delay:1.5s}@keyframes darlinkRipple{0%,100%{transform:scale(.9);opacity:.35}50%{transform:scale(1.12);opacity:.8}}
      .darlink-digital-player{position:absolute;left:50%;bottom:30%;transform:translateX(-50%) translateZ(60px);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:3}.darlink-player-aura{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(216,180,254,.34),transparent 62%);filter:blur(16px);z-index:-1}.darlink-player-avatar{width:104px;height:148px;border-radius:44px 44px 30px 30px;background:linear-gradient(160deg,rgba(255,255,255,.86),rgba(126,212,253,.2) 45%,rgba(111,80,146,.42));display:grid;place-items:center;color:white;font-size:46px;box-shadow:0 24px 70px rgba(126,212,253,.28),inset 0 1px 0 rgba(255,255,255,.48);backdrop-filter:blur(18px)}.darlink-digital-player strong{border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);padding:8px 12px;font-size:12px;color:rgba(248,251,255,.86)}
      .darlink-rising-question{position:absolute;left:50%;top:11%;z-index:4;width:min(720px,72%);min-height:330px;transform:translateX(-50%);border-radius:30px;background:linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.22);box-shadow:0 28px 90px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.26);backdrop-filter:blur(28px);padding:28px;animation:darlinkRise .42s cubic-bezier(.16,1,.3,1)}@keyframes darlinkRise{from{opacity:0;transform:translateX(-50%) translateY(60px) scale(.96)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
      .darlink-challenge-panel .darlink-rising-question{position:relative;left:auto;top:auto;width:100%;min-height:300px;transform:none;padding:20px;animation:none}
      .darlink-rising-question>span,.darlink-challenge-panel>span{color:#7ed4fd;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:950}.darlink-rising-question h2{font-size:clamp(24px,3vw,40px);line-height:1.12;margin:10px 0 22px;color:#fff}.darlink-challenge-options{display:grid;gap:12px}.darlink-challenge-options button{border:1px solid rgba(255,255,255,.18);border-radius:18px;background:rgba(255,255,255,.1);color:white;padding:14px 16px;text-align:left;font-weight:900;cursor:pointer;transition:.18s ease}.darlink-challenge-options button:hover{transform:translateY(-1px);background:rgba(255,255,255,.16)}.darlink-challenge-options button.is-selected{border-color:#fcaad6}.darlink-challenge-options button.is-answer{background:rgba(16,185,129,.22);border-color:rgba(16,185,129,.72)}.darlink-challenge-feedback{min-height:24px;margin:14px 0 0;color:rgba(248,251,255,.82);font-weight:850}.darlink-rising-question.is-wrong{box-shadow:0 28px 90px rgba(185,28,28,.24),inset 0 1px 0 rgba(255,255,255,.26)}.darlink-rising-question.is-correct{box-shadow:0 28px 90px rgba(16,185,129,.24),inset 0 1px 0 rgba(255,255,255,.26)}
      .darlink-challenge-panel{border-radius:30px;border:1px solid rgba(255,255,255,.14);background:rgba(8,13,28,.72);box-shadow:0 24px 90px rgba(0,0,0,.28);backdrop-filter:blur(26px);padding:26px;display:flex;flex-direction:column;gap:16px}.darlink-challenge-panel h1{font-size:42px;line-height:1;margin:0}.darlink-challenge-panel p{color:rgba(248,251,255,.72);line-height:1.7;margin:0}.darlink-challenge-progress{display:flex;align-items:center;justify-content:space-between;border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);padding:14px}.darlink-challenge-progress strong{font-size:28px}.darlink-challenge-progress em{font-style:normal;color:#fcaad6;font-weight:900}.darlink-challenge-exit,.darlink-challenge-chat{margin-top:auto;border:0;border-radius:999px;background:linear-gradient(135deg,#6f5092,#006686);color:white;min-height:50px;padding:0 18px;font-weight:950;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}.darlink-rising-question.is-complete{display:flex;flex-direction:column;justify-content:center}.darlink-rising-question.is-complete p{color:rgba(248,251,255,.78);line-height:1.7}
      @media(max-width:960px){.darlink-hall-challenge-body{overflow:auto}.darlink-challenge-scene{height:auto;min-height:100vh;grid-template-columns:1fr;padding:16px;gap:14px}.darlink-liquid-stage{min-height:720px;order:0}.darlink-challenge-panel{order:1}.darlink-rising-question{width:calc(100% - 32px);top:72px;min-height:320px}.darlink-digital-player{bottom:18%}}
    `;
  }

  function globalFrameCss() {
    return `
      html{font-family:"Plus Jakarta Sans",system-ui,sans-serif}
      body.darlink-page-polished>nav:first-of-type:not(.darlink-unpolished-nav),body.darlink-page-polished>header.fixed{min-height:76px}
      body.darlink-page-polished button[data-darlink-search-disabled='true']{cursor:default;pointer-events:none;opacity:.78}
      body.darlink-page-polished .darlink-material-svg{width:1em;height:1em;display:block}
      .darlink-icon-normalized .darlink-material-svg{width:1.1em;height:1.1em}
      .darlink-standard-topbar{position:sticky;top:0;z-index:90;width:100%;background:rgba(255,255,255,.58);border-bottom:1px solid rgba(255,255,255,.52);box-shadow:0 10px 36px rgba(31,42,68,.08);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px)}
      .darlink-standard-topbar-inner{height:80px;width:100%;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 clamp(22px,4vw,64px)}
      .darlink-standard-brand{font-size:26px;line-height:1;font-weight:950;letter-spacing:0;background:linear-gradient(135deg,#6f5092,#8a486f,#006686);-webkit-background-clip:text;background-clip:text;color:transparent;text-decoration:none;white-space:nowrap}
      .darlink-standard-tabs{display:flex;align-items:center;gap:8px;min-width:0}
      .darlink-standard-tabs a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 13px;border-radius:999px;color:#4a454f;text-decoration:none;font-size:14px;font-weight:850;transition:background .18s ease,color .18s ease,transform .18s ease;white-space:nowrap}
      .darlink-standard-tabs a:hover{background:rgba(255,255,255,.58);color:#604283;transform:translateY(-1px)}
      .darlink-standard-tabs a.is-active{background:linear-gradient(135deg,rgba(216,180,254,.42),rgba(126,212,253,.28));color:#29074a;box-shadow:inset 0 0 0 1px rgba(111,80,146,.1)}
      .darlink-standard-actions{display:flex;align-items:center;gap:12px;flex:0 0 auto}
      .darlink-standard-search,.darlink-standard-avatar{border:1px solid rgba(255,255,255,.62);background:rgba(255,255,255,.58);color:#604283;box-shadow:0 10px 24px rgba(31,42,68,.08);cursor:pointer}
      .darlink-standard-search{width:42px;height:42px;border-radius:999px;display:grid;place-items:center}
      .darlink-standard-avatar{width:42px;height:42px;border-radius:999px;padding:0;overflow:hidden}
      .darlink-standard-avatar img{width:100%;height:100%;object-fit:cover;display:block}
      @media(min-width:768px){
        body.darlink-page-polished>nav:first-of-type:not(.darlink-unpolished-nav){display:flex;align-items:center}
      }
      @media(max-width:820px){.darlink-standard-topbar-inner{height:auto;min-height:76px;gap:14px;flex-wrap:wrap;padding:14px 18px}.darlink-standard-tabs{order:3;width:100%;overflow-x:auto;padding-bottom:2px}.darlink-standard-tabs a{min-height:38px;font-size:13px}.darlink-standard-actions{margin-left:auto}}
    `;
  }

  function applyGlobalFramePolish(doc, page) {
    appendStyle(doc, "global-frame-polish", globalFrameCss());
    doc.documentElement.lang = lang() === "en" ? "en" : lang() === "zhHans" ? "zh-Hans" : "zh-Hant";
    doc.body.classList.add("darlink-page-polished", `darlink-page-${page.replace(/[^a-z0-9]+/gi, "-")}`);
    removeDeprecatedNavigationAndLegacyLinks(doc);
    doc.querySelectorAll("button").forEach((button) => {
      const text = normalize(button.textContent).toLowerCase();
      const hasSearch = text === "search" || button.querySelector("[data-icon='search'], .material-symbols-outlined");
      if (hasSearch && (text === "search" || button.querySelector(".material-symbols-outlined")?.textContent.trim() === "search")) {
        button.dataset.darlinkSearchDisabled = "true";
        button.setAttribute("aria-label", copy("Search disabled for prototype", "搜索暂未开放", "搜尋暫未開放"));
      }
    });
  }

  function replaceTextSnippets(doc, replacements) {
    if (lang() === "en" || !replacements) return;
    const walker = doc.createTreeWalker(doc.body, doc.defaultView.NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.parentElement && node.parentElement.closest(".material-symbols-outlined,.darlink-symbol,.darlink-control-glyph")) return;
      Object.entries(replacements).forEach(([source, target]) => {
        if (node.nodeValue.includes(source)) node.nodeValue = node.nodeValue.split(source).join(target);
      });
    });
  }

  function removeMobileBottomNavigation(doc) {
    Array.from(doc.querySelectorAll("nav")).forEach((nav) => {
      const cls = nav.getAttribute("class") || "";
      const text = normalize(nav.textContent).toLowerCase();
      const isBottomNav = cls.includes("bottom-0") || (cls.includes("fixed") && cls.includes("bottom"));
      const looksLikeTabBar = /home|matches|events|community|profile|aura|twin|chat|首页|首頁|发现|發現|匹配|活动|活動|社区|社群|个人档案|個人檔案/.test(text);
      if (isBottomNav && looksLikeTabBar) nav.remove();
    });
  }

  function removeDeprecatedNavigationAndLegacyLinks(doc) {
    Array.from(doc.querySelectorAll("nav a, nav li, nav button, header a, header li, header button")).forEach((node) => {
      const text = normalize(node.textContent).toLowerCase();
      const isOnlyEvents = ["events", "event", "活动", "活動", "校园活动", "校園活動"].includes(text);
      if (isOnlyEvents) node.remove();
    });
  }

  function normalizeInteractiveIconButtons(doc) {
    const controls = [
      { labels: ["发送", "發送", "send", "snd"], icon: "send", label: copy("Send", "发送", "發送") },
      { labels: ["语音", "語音", "voice", "mic"], icon: "mic", label: copy("Voice input", "语音输入", "語音輸入") },
    ];
    Array.from(doc.querySelectorAll("button")).forEach((button) => {
      const text = normalize(button.textContent).toLowerCase();
      const control = controls.find((item) => item.labels.includes(text));
      if (!control) return;
      button.innerHTML = materialIconSvg(control.icon);
      button.setAttribute("aria-label", control.label);
      button.classList.add("darlink-icon-normalized");
    });
  }

  function currentAvatarSrc(doc) {
    return doc.querySelector("nav img[src], header img[src], aside img[src], img[alt*='profile' i]")?.getAttribute("src") || "/files/v13-ai-twin-crop.png";
  }

  function normalizeStandardTopBar(doc, activeKey = "discover") {
    const topbar = doc.querySelector("body > nav, body > header");
    if (!topbar || topbar.dataset.darlinkStandardTopbar === "true") return;
    const avatarSrc = currentAvatarSrc(doc);
    topbar.dataset.darlinkStandardTopbar = "true";
    topbar.className = "darlink-standard-topbar";
    const items = [
      ["discover", copy("Discover", "发现", "發現")],
      ["matches", copy("Matches", "匹配", "匹配")],
      ["community", copy("Community", "社区", "社群")],
      ["hall", copy("Hall of Fame", "名人堂", "名人堂")],
    ];
    topbar.innerHTML = `
      <div class="darlink-standard-topbar-inner">
        <a class="darlink-standard-brand" href="#">Darlink</a>
        <div class="darlink-standard-tabs" aria-label="${copy("Primary navigation", "主导航", "主導覽")}">
          ${items.map(([key, label]) => `<a href="#" class="${key === activeKey ? "is-active" : ""}">${label}</a>`).join("")}
        </div>
        <div class="darlink-standard-actions">
          <button type="button" class="darlink-standard-search" data-darlink-search-disabled="true" data-darlink-local-control="true" aria-label="${copy("Search disabled for prototype", "搜索暂未开放", "搜尋暫未開放")}">${materialIconSvg("search")}</button>
          <button type="button" class="darlink-standard-avatar" aria-label="${copy("Profile", "个人档案", "個人檔案")}"><img src="${avatarSrc}" alt="${copy("User profile avatar", "用户头像", "用戶頭像")}"></button>
        </div>
      </div>
    `;
  }

  function installExploreMoodControl(doc) {
    const header = Array.from(doc.querySelectorAll("section div")).find((node) => {
      const text = node.textContent || "";
      return text.includes("Explore Potential") && text.includes("Training your Digital Twin") && node.querySelector("button");
    });
    const moreButton = header?.querySelector("button");
    if (!moreButton || moreButton.dataset.darlinkMoodReady === "true") return;
    moreButton.dataset.darlinkMoodReady = "true";
    moreButton.dataset.darlinkLocalControl = "true";
    moreButton.className = "darlink-mood-control";
    moreButton.innerHTML = `
      <span>${copy("Status", "状态", "狀態")}</span>
      <select aria-label="${copy("Personal mood status", "个人状态心情", "個人狀態心情")}" data-darlink-local-control="true">
        <option>${copy("Open to chat", "开放聊天", "開放聊天")}</option>
        <option>${copy("Focused", "专注中", "專注中")}</option>
        <option>${copy("Relaxed", "放松状态", "放鬆狀態")}</option>
        <option>${copy("Low social energy", "低社交电量", "低社交電量")}</option>
      </select>
    `;
  }

  function pageSnippetTranslations(page) {
    const isHant = lang() === "zhHant";
    const zh = (hans, hant = hans) => (isHant ? hant : hans);
    const common = {
      "Your AI Campus Companion": zh("你的智能校园伙伴", "你的智能校園夥伴"),
      "Design Arts Campus": zh("设计艺术校区", "設計藝術校區"),
      "North Engineering": zh("北区工程学院", "北區工程學院"),
      "Business Hub": zh("商学院中心", "商學院中心"),
      "Medical Quad": zh("医学广场", "醫學廣場"),
      "\"Always hunting for the best matcha lattes near the library block.\"": zh("\"一直在找图书馆附近最好喝的抹茶拿铁。\"", "\"一直在找圖書館附近最好喝的抹茶拿鐵。\""),
      "\"Pizza aficionado. Let's debate the best slice on campus.\"": zh("\"披萨爱好者。来辩一辩校园里最好吃的一片。\"", "\"披薩愛好者。來辯一辯校園裡最好吃的一片。\""),
      "\"Seeking pastry study buddies. I know all the hidden bakery spots.\"": zh("\"寻找甜点学习搭子。我知道很多隐藏面包店。\"", "\"尋找甜點學習搭子。我知道很多隱藏麵包店。\""),
      "Institute of Arts": zh("艺术学院", "藝術學院"),
      "Quantum Academy": zh("量子学院", "量子學院"),
      "School of Syntax": zh("语法学院", "語法學院"),
      "Both profiles exhibit high affinity for minimalist digital art and brutalist architecture.": zh("双方画像都对极简数字艺术和粗野主义建筑有很高亲和度。", "雙方畫像都對極簡數字藝術和粗野主義建築有很高親和度。"),
      "Strong mutual interest in speculative sci-fi and historical non-fiction.": zh("双方都对推想科幻和历史纪实类阅读有强烈兴趣。", "雙方都對推想科幻和歷史紀實類閱讀有強烈興趣。"),
    };
    if (page === "community_campus_pulse_feed") {
      return {
        ...common,
        "Campus Pulse": zh("校园脉搏", "校園脈搏"),
        "Connect, share, and resonate with your digital campus.": zh("在数字校园里连接、分享并共振。", "在數字校園裡連接、分享並共振。"),
        "Study Vibes": zh("学习氛围", "學習氛圍"),
        "Weekend Plans": zh("周末计划", "週末計劃"),
        "Resonate": zh("共振", "共振"),
        "Clara (AI Twin)": zh("Clara（数字人）", "Clara（數字人）"),
        "2 hours ago": zh("2 小时前", "2 小時前"),
        "98% Match Potential": zh("98% 匹配潜力", "98% 匹配潛力"),
        "Just analyzed the syllabus for Cognitive Psychology 301. Looks intense but fascinating! Anyone else planning a study group for midterms? I've already drafted some interactive flashcards.": zh("刚分析完《认知心理学 301》的教学大纲。内容很密集但很有意思！有人也想为期中组学习小组吗？我已经做了一些互动记忆卡。", "剛分析完《認知心理學 301》的教學大綱。內容很密集但很有意思！有人也想為期中組學習小組嗎？我已經做了一些互動記憶卡。"),
        "Julian Chen": zh("Julian Chen", "Julian Chen"),
        "4 hours ago": zh("4 小时前", "4 小時前"),
        "Late night coding sessions hit different when the campus cafe is empty. Working on a new algorithm for matching student schedules. Coffee IV drip required.": zh("校园咖啡馆空下来时，深夜写代码的感觉完全不同。正在写一个匹配学生日程的新算法，咖啡续命中。", "校園咖啡館空下來時，深夜寫程式的感覺完全不同。正在寫一個匹配學生日程的新算法，咖啡續命中。"),
        "Trending Orbits": zh("热门轨道", "熱門軌道"),
        "1.2k vibes": zh("1.2k 次共振", "1.2k 次共振"),
        "Ticket sales open next week!": zh("门票下周开放。", "門票下週開放。"),
        "845 vibes": zh("845 次共振", "845 次共振"),
        "Weekly design critique session.": zh("每周设计点评小组。", "每週設計點評小組。"),
        "520 vibes": zh("520 次共振", "520 次共振"),
        "Pairing real students with AI tutors.": zh("真实学生与智能学习搭子配对。", "真實學生與智能學習搭子配對。"),
        "Explore All": zh("查看全部", "查看全部"),
        "Active Circles": zh("活跃圈子", "活躍圈子"),
        "Fudan Math Club": zh("复旦数学社", "復旦數學社"),
        "34 members active now": zh("34 名成员在线", "34 名成員在線"),
        "HKU Foodies": zh("港大美食会", "港大美食會"),
        "12 planning dinner": zh("12 人正在约饭", "12 人正在約飯"),
        "Late Night Gamers": zh("深夜游戏局", "深夜遊戲局"),
        "89 online": zh("89 人在线", "89 人在線"),
      };
    }
    if (page === "profile") {
      return {
        ...common,
        "My Profile": zh("我的档案", "我的檔案"),
        "AI Twin Active": zh("数字人已在线", "數字人已在線"),
        "Upgrade to Premium": zh("升级高级版", "升級高級版"),
        "AI Twin Verified": zh("数字人已验证", "數字人已驗證"),
        "Fudan University": zh("复旦大学", "復旦大學"),
        "Applied Mathematics": zh("应用数学", "應用數學"),
        "Class of 2026": zh("2026 届", "2026 屆"),
        "Edit Persona": zh("编辑画像", "編輯畫像"),
        "Sync Twin": zh("同步数字人", "同步數字人"),
        "Digital Aura": zh("数字光谱", "數字光譜"),
        "Dominant": zh("主导特质", "主導特質"),
        "Core": zh("核心", "核心"),
        "Soul": zh("内在", "內在"),
        "Growth": zh("成长", "成長"),
        "Resonance Stats": zh("共振数据", "共振數據"),
        "Network Reach": zh("网络触达", "網絡觸達"),
        "Chat Depth": zh("聊天深度", "聊天深度"),
        "AI Twin Settings": zh("数字人设置", "數字人設定"),
        "Sync Frequency": zh("同步频率", "同步頻率"),
        "Real-time cloud synchronization": zh("实时云端同步", "即時雲端同步"),
        "Privacy Mode": zh("隐私模式", "隱私模式"),
        "End-to-end encrypted interactions": zh("端到端加密互动", "端到端加密互動"),
        "Data Training History": zh("数据训练历史", "資料訓練歷史"),
        "View model optimization logs": zh("查看模型优化记录", "查看模型優化記錄"),
        "Campus Identity": zh("校园身份", "校園身份"),
        "Verified University Email": zh("已验证学校邮箱", "已驗證學校郵箱"),
        "Major": zh("专业", "專業"),
        "Student ID Status": zh("学生身份状态", "學生身份狀態"),
        "Active": zh("已激活", "已啟用"),
        "This information is only visible to verified students.": zh("这些信息仅对已认证学生可见。", "這些資訊僅對已認證學生可見。"),
        "Darlink © 2024 • Powered by Luminous AI Systems": zh("Darlink © 2024 • 由 Luminous AI Systems 驱动", "Darlink © 2024 • 由 Luminous AI Systems 驅動"),
      };
    }
    return common;
  }

  function backControlCss() {
    return `
      .darlink-module-back{
        position:fixed;
        left:clamp(18px,3vw,34px);
        top:96px;
        z-index:160;
        width:46px;
        height:46px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        border:1px solid rgba(255,255,255,.72);
        border-radius:17px;
        padding:0;
        background:rgba(255,255,255,.74);
        color:#604283;
        box-shadow:0 16px 38px rgba(31,42,68,.14),inset 0 1px 0 rgba(255,255,255,.82);
        backdrop-filter:blur(22px);
        -webkit-backdrop-filter:blur(22px);
        font-family:"Plus Jakarta Sans",system-ui,sans-serif;
        cursor:pointer;
        transition:transform .18s ease,box-shadow .18s ease,background .18s ease,color .18s ease;
      }
      .darlink-module-back:hover{
        transform:translateY(-2px);
        background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(239,248,255,.84));
        color:#29074a;
        box-shadow:0 20px 46px rgba(111,80,146,.18),inset 0 1px 0 rgba(255,255,255,.9);
      }
      .darlink-module-back:after{
        content:attr(aria-label);
        position:absolute;
        left:54px;
        top:50%;
        transform:translateY(-50%) translateX(-4px);
        opacity:0;
        pointer-events:none;
        white-space:nowrap;
        border-radius:999px;
        padding:9px 12px;
        background:rgba(17,28,45,.82);
        color:white;
        font-size:12px;
        font-weight:850;
        box-shadow:0 12px 28px rgba(31,42,68,.22);
        transition:.18s ease;
      }
      .darlink-module-back:hover:after{opacity:1;transform:translateY(-50%) translateX(0)}
      .darlink-module-back .darlink-symbol{
        font-size:20px;
        line-height:1;
      }
      .darlink-module-back strong{
        position:absolute;
        width:1px;
        height:1px;
        overflow:hidden;
        clip:rect(0,0,0,0);
      }
      body.darlink-page-chat-explore-potential-with-ai-twin .darlink-module-back,
      body.darlink-page-profile-full-campus-identity-final .darlink-module-back{
        left:clamp(306px,22vw,352px);
      }
      body.dark .darlink-module-back,
      .dark body .darlink-module-back{
        border-color:rgba(255,255,255,.16);
        background:rgba(8,17,34,.72);
        color:#efdbff;
        box-shadow:0 18px 44px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.12);
      }
      @media(max-width:767px){
        .darlink-module-back{
          top:18px;
          left:16px;
          height:42px;
          width:42px;
          padding:0 13px 0 11px;
        }
        .darlink-module-back:after{display:none}
      }
    `;
  }

  function profileModalCss() {
    return `
      .darlink-profile-modal{position:fixed;inset:0;z-index:200;background:rgba(17,28,45,.26);backdrop-filter:blur(16px);display:grid;place-items:center;padding:28px}.darlink-profile-dialog{position:relative;width:min(920px,94vw);border-radius:34px;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(240,248,255,.9));border:1px solid rgba(255,255,255,.8);box-shadow:0 32px 90px rgba(31,42,68,.24);padding:30px;overflow:hidden}.darlink-profile-close{position:absolute;right:18px;top:18px;width:42px;height:42px;border:0;border-radius:999px;background:rgba(255,255,255,.76);color:#604283;cursor:pointer}.darlink-profile-head span{color:#8a486f;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:.1em}.darlink-profile-head h2{font-size:34px;margin:8px 0;color:#111c2d}.darlink-profile-head p{color:#4a454f;margin:0 0 22px}.darlink-profile-card-rail{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}.darlink-profile-card{flex:0 0 min(310px,82vw);scroll-snap-align:start;border-radius:28px;background:rgba(255,255,255,.74);border:1px solid rgba(111,80,146,.12);padding:22px;min-height:260px}.darlink-profile-card span{color:#8a486f;font-weight:900;font-size:12px;letter-spacing:.08em;text-transform:uppercase}.darlink-profile-card h3{font-size:24px;margin:10px 0;color:#111c2d}.darlink-profile-card p{color:#4a454f;line-height:1.6}.darlink-profile-card em{display:inline-block;font-style:normal;margin:4px 6px 0 0;border-radius:999px;background:#efdbff;color:#604283;padding:6px 10px;font-size:12px;font-weight:800}
    `;
  }

  window.DarlinkEnhancer = {
    enhanceFrame(doc, page, api) {
      if (!doc || !page) return;
      applyGlobalFramePolish(doc, page);
      if (page === api.page.login) enhanceLogin(doc, api);
      if (page === api.page.onboard1) enhanceChatOnboarding(doc, api, 1);
      if (page === api.page.onboard2) enhanceChatOnboarding(doc, api, 2);
      if (page === api.page.onboard3) enhanceChatOnboarding(doc, api, 3);
      if (page === api.page.home) enhanceHome(doc, api);
      if (page === api.page.digitalPlaza) enhanceDigitalPlazaPage(doc, api);
      if (page === api.page.exploreChat) enhanceExploreChat(doc, api);
      if (page === api.page.xiaodaChat) enhanceXiaodaFreeChat(doc, api);
      if ([api.page.study, api.page.culinary, api.page.romance].includes(page)) enhanceDiscoveryModule(doc, page);
      if (page === api.page.matching) enhanceMatching(doc, api);
      if (page === api.page.matchChat) enhanceContextualChat(doc);
      if (page === api.page.community) enhanceCommunityPage(doc);
      if (page === api.page.hall) enhanceHallOfFame(doc);
      if (page === api.page.hallChallenge) enhanceHallChallenge(doc, api);
      if (page === api.page.profile) enhanceProfile(doc);
      if (![api.page.login, api.page.onboard1, api.page.onboard2, api.page.onboard3, api.page.home].includes(page)) localizeStatic(doc, page);
      normalizeInteractiveIconButtons(doc);
      replaceMaterialIconFallbacks(doc);
      watchMaterialIconFallbacks(doc);
      addModuleBackControl(doc, page, api);
    },
  };
})();
