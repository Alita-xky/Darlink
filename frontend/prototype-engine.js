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
      next1: "Continue to persona chat",
      next2: "Continue to path choice",
      generate: "Generate my profile",
      generating: "Xiaoda is generating your profile...",
      chooseIntent: "Tell Xiaoda which path you want to begin with: Study Sync, Culinary Match, or Deep Romance.",
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
        "Culinary Match": "Culinary Match",
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
      next1: "进入人物画像对话",
      next2: "进入路径选择",
      generate: "生成我的画像",
      generating: "小搭正在为您生成画像...",
      chooseIntent: "告诉小搭你想先从学习搭子、饭搭子 / 玩搭子，还是恋爱对象开始。",
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
        "Culinary Match": "饭搭子",
        "Deep Romance": "恋爱对象",
      },
      staticMap: {
        "Discover": "发现",
        "Matches": "匹配",
        "Events": "活动",
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
        "Today, 2:45 PM": "今天 2:45 PM",
        "AI Active": "智能已激活",
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
      next1: "進入人物畫像對話",
      next2: "進入路徑選擇",
      generate: "生成我的畫像",
      generating: "小搭正在為您生成畫像...",
      chooseIntent: "告訴小搭你想先從學習搭子、飯搭子 / 玩搭子，還是戀愛對象開始。",
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
        "Culinary Match": "飯搭子",
        "Deep Romance": "戀愛對象",
      },
      staticMap: {
        "Discover": "發現",
        "Matches": "匹配",
        "Events": "活動",
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
        "Today, 2:45 PM": "今天 2:45 PM",
        "AI Active": "智能已啟用",
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
      intent: "Which path should Xiaoda open first: Study Sync, Culinary Match, or Deep Romance?",
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
      intent: "你希望小搭先开启哪条路径：学习搭子、饭搭子 / 玩搭子，还是恋爱对象？",
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
      intent: "你希望小搭先開啟哪條路徑：學習搭子、飯搭子 / 玩搭子，還是戀愛對象？",
    },
  };

  function lang() {
    return localStorage.getItem("darlink-lang") || "en";
  }

  function tr() {
    return TEXT[lang()] || TEXT.en;
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

  function normalize(value) {
    return String(value || "").trim();
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
    const glyph = action === "voice" ? "语音" : "发送";
    return `<span class="darlink-control-glyph" aria-hidden="true">${glyph}</span>`;
  }

  function materialIconSvg(name) {
    const key = MATERIAL_ICON_ALIASES[name] || name;
    const body = MATERIAL_ICON_SVGS[key] || MATERIAL_ICON_SVGS.auto_awesome;
    return `<svg class="darlink-material-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
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
        type: "hall",
        avatar: profile.background,
        colors: ["#111827", "#6f5092"],
      };
    }
    const matchId = context && context.type === "match" && MATCH_CHAT_PROFILES[context.id] ? context.id : "maya";
    const profile = MATCH_CHAT_PROFILES[matchId] || MATCH_CHAT_PROFILES.maya;
    return {
      ...profile,
      type: "match",
      avatar: avatarDataUri(profile.initials, profile.colors),
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
    if (/culinary|food|饭|飯|玩|social|朋友|搭子/.test(value)) return "social";
    if (/romance|love|恋|戀|date|relationship/.test(value)) return "romance";
    return "";
  }

  function initialMessage(phase) {
    const t = tr();
    if (phase === 1) return `${t.xiaoda}: ${qText("nickname")}`;
    if (phase === 2) return `${t.xiaoda}: ${qText("summaryConfirm")}`;
    return `${t.xiaoda}: ${t.chooseIntent}`;
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
              <button type="button" class="darlink-secondary-btn" data-action="skip">${t.skip}</button>
              <button type="button" class="darlink-primary-btn" data-action="next" ${state.complete ? "" : "disabled"}>${phase === 1 ? t.next1 : phase === 2 ? t.next2 : t.generate} ${icon("arrow_forward")}</button>
            </div>
            <div class="darlink-analysis-status" role="status"></div>
          </section>
        </section>
      </main>
    `;

    const input = doc.querySelector("#darlinkChatInput");
    const sendButton = doc.querySelector("[data-action='send']");
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
        quick.innerHTML = ["Study Sync", "Culinary Match", "Deep Romance"].map((item) => `<button type="button" class="darlink-chip" data-quick="${item}">${item}</button>`).join("");
      } else if (current.optional) {
        quick.innerHTML = `<button type="button" class="darlink-chip" data-quick="${t.skip}">${t.skip}</button>`;
      } else {
        quick.innerHTML = "";
      }
      nextButton.disabled = !state.complete;
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
        state.messages.push({ from: "xiaoda", text: res.error || "Xiaoda could not respond right now." });
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
        state.messages.push({ from: "xiaoda", text: lang() === "en" ? "I heard you, but I still need one clear path: Study Sync, Culinary Match, or Deep Romance." : lang() === "zhHant" ? "我聽懂了，但還需要你明確選一條：學習搭子、飯搭子 / 玩搭子，或戀愛對象。" : "我听懂了，但还需要你明确选一条：学习搭子、饭搭子 / 玩搭子，或恋爱对象。" });
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
      status.textContent = res.error || "AI profile generation failed.";
      button.disabled = false;
      return;
    }
    write(STORAGE.profile, { provider: res.provider, cards: res.cards, createdAt: Date.now() });
    localStorage.removeItem(STORAGE.profileDismissed);
    status.dataset.tone = "success";
    status.textContent = lang() === "en" ? "Profile generated. Opening home." : lang() === "zhHant" ? "畫像已生成，正在進入首頁。" : "画像已生成，正在进入首页。";
    window.setTimeout(() => api.navigate(api.page.home, { replace: true, immediate: true }), 700);
  }

  function enhanceHome(doc) {
    injectStyle(doc, profileModalCss() + digitalPlazaCss());
    localizeStatic(doc, "home");
    enhanceDigitalPlaza(doc);
    doc.defaultView.setTimeout(() => localizeStatic(doc, "home"), 0);
    const profile = read(STORAGE.profile);
    const dismissed = read(STORAGE.profileDismissed, false);
    if (!profile || dismissed || doc.querySelector(".darlink-profile-modal")) return;
    const t = tr();
    const modal = doc.createElement("div");
    modal.className = "darlink-profile-modal";
    modal.innerHTML = `
      <div class="darlink-profile-dialog">
        <button type="button" class="darlink-profile-close" aria-label="${t.close}">${icon("close")}</button>
        <div class="darlink-profile-head">
          <span>${t.modalKicker}</span>
          <h2>${t.modalTitle}</h2>
          <p>${t.modalBody}</p>
        </div>
        <div class="darlink-profile-card-rail">
          ${(profile.cards || []).map((card) => `<article class="darlink-profile-card">
            <span>${card.label}</span>
            <h3>${card.title}</h3>
            <p>${card.body}</p>
            <div>${(card.tags || []).map((tag) => `<em>${tag}</em>`).join("")}</div>
          </article>`).join("")}
        </div>
      </div>
    `;
    doc.body.appendChild(modal);
    modal.querySelector(".darlink-profile-close").addEventListener("click", () => {
      write(STORAGE.profileDismissed, true);
      modal.remove();
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

  function enhanceContextualChat(doc) {
    const profile = chatProfileFromContext();
    injectStyle(doc, contextualChatCss());
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
    if (input) input.placeholder = `Message ${profile.name}...`;
  }

  function enhanceHallOfFame(doc) {
    injectStyle(doc, hallEnhancementCss());
    const steve = HALL_CHAT_PROFILES["steve-jobs"];
    const heroImage = doc.querySelector(".carousel-item img");
    if (heroImage && steve) {
      heroImage.src = steve.background;
      heroImage.alt = "Steve Jobs digital mentor portrait";
    }
    const list = doc.querySelector("aside .flex.flex-col.gap-4");
    if (!list || list.dataset.darlinkHallEnhanced) return;
    list.dataset.darlinkHallEnhanced = "true";
    const order = [
      ["elon-musk", "Rank #1 · Tesla / SpaceX"],
      ["jensen-huang", "Rank #2 · NVIDIA"],
      ["ray-dalio", "Rank #3 · Principles"],
      ["jack-ma", "Rank #4 · Alibaba"],
      ["charlie-munger", "Rank #5 · Berkshire Hathaway"],
      ["jeff-bezos", "Rank #6 · Amazon / Blue Origin"],
      ["mark-zuckerberg", "Rank #7 · Meta"],
      ["richard-feynman", "Rank #8 · Physics"],
      ["peter-drucker", "Rank #9 · Management"],
      ["reid-hoffman", "Rank #10 · Networks"],
      ["naval-ravikant", "Rank #11 · Leverage"],
      ["marc-andreessen", "Rank #12 · Market Thesis"],
    ];
    list.innerHTML = order.map(([id, meta]) => {
      const profile = HALL_CHAT_PROFILES[id];
      return `<button type="button" class="darlink-hall-row group" data-darlink-hall-id="${id}">
        <span class="darlink-hall-thumb"><img src="${profile.background}" alt="${profile.name} portrait"></span>
        <span class="darlink-hall-copy">
          <strong>${profile.name}</strong>
          <em>${meta}</em>
        </span>
        ${icon("arrow_forward")}
      </button>`;
    }).join("");
  }

  function addModuleBackControl(doc, page, api) {
    const pagesWithBack = new Set([
      api.page.digitalPlaza,
      api.page.exploreChat,
      api.page.study,
      api.page.culinary,
      api.page.romance,
      api.page.matching,
      api.page.matchChat,
      api.page.events,
      api.page.community,
      api.page.hall,
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
    let pending = false;
    const schedule = () => {
      if (pending) return;
      pending = true;
      doc.defaultView.requestAnimationFrame(() => {
        pending = false;
        replaceMaterialIconFallbacks(doc);
      });
    };
    const observer = new doc.defaultView.MutationObserver(schedule);
    observer.observe(doc.body, { childList: true, subtree: true });
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
      const response = await fetch(url, {
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

  function onboardingBackdrop() {
    return `<div class="darlink-orb one"></div><div class="darlink-orb two"></div><div class="darlink-orb three"></div>`;
  }

  function progressHeader(label, step) {
    return `<header class="darlink-progress">
      <div><span>${icon("person")}</span><strong>${label}</strong><em>${step}/3</em></div>
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
      .darlink-quick-replies{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.darlink-chat-input-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:end}.darlink-chat-actions{display:flex;justify-content:space-between;gap:12px;margin-top:14px}.darlink-analysis-status{min-height:24px;color:#ba1a1a;font-weight:800;font-size:13px;margin:8px 0}.darlink-analysis-status[data-tone='success']{color:#005b78}.darlink-analysis-status[data-tone='info']{color:#604283}
      @media(max-width:900px){.darlink-onboarding-body{overflow:auto}.darlink-onboarding-shell{height:auto;min-height:100vh}.darlink-onboarding-stage{grid-template-columns:1fr}.darlink-xiaoda-panel{min-height:520px}}
    `;
  }

  function digitalPlazaCss() {
    return `.darlink-digital-plaza-card{min-height:520px}.darlink-plaza-avatars{display:flex;align-items:center;margin-top:18px}.darlink-plaza-avatars span{width:46px;height:46px;margin-right:-10px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#fff,#efd8ff 45%,#d6f2ff);border:1px solid rgba(255,255,255,.78);box-shadow:0 12px 28px rgba(111,80,146,.14);color:#604283;font-weight:900}.darlink-plaza-new-twin{margin-top:24px;padding:18px;border-radius:24px;background:linear-gradient(135deg,rgba(255,255,255,.62),rgba(239,248,255,.54));border:1px solid rgba(255,255,255,.72);display:flex;align-items:center;gap:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}`;
  }

  function contextualChatCss() {
    return `
      body.darlink-contextual-chat{position:relative;isolation:isolate}
      body.darlink-contextual-chat.darlink-hall-chat:before{content:"";position:fixed;inset:0;z-index:-2;background:var(--darlink-chat-bg) center/cover no-repeat;opacity:.18;filter:saturate(.9) contrast(.9);pointer-events:none}
      body.darlink-contextual-chat.darlink-hall-chat:after{content:"";position:fixed;inset:0;z-index:-1;background:linear-gradient(135deg,rgba(249,249,255,.9),rgba(255,255,255,.78) 48%,rgba(239,248,255,.86));pointer-events:none}
      body.darlink-contextual-chat #chat-messages{scroll-behavior:smooth}
      body.darlink-contextual-chat .glass-bubble-ai,body.darlink-contextual-chat .darlink-suggestion-card,body.darlink-contextual-chat .glass-input{background:rgba(255,255,255,.72)!important;border:1px solid rgba(255,255,255,.76)!important;backdrop-filter:blur(24px)}
    `;
  }

  function hallEnhancementCss() {
    return `
      .darlink-hall-row{width:100%;display:flex;align-items:center;gap:14px;border:1px solid transparent;border-radius:18px;background:rgba(255,255,255,.04);padding:10px 12px;text-align:left;color:white;cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease}
      .darlink-hall-row:hover{transform:translateY(-2px);background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.14)}
      .darlink-hall-thumb{width:58px;height:58px;border-radius:18px;overflow:hidden;flex:0 0 auto;border:2px solid rgba(255,255,255,.18)}
      .darlink-hall-thumb img{width:100%;height:100%;object-fit:cover}
      .darlink-hall-copy{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
      .darlink-hall-copy strong{font-size:15px;line-height:1.2}
      .darlink-hall-copy em{font-style:normal;color:rgba(255,255,255,.58);font-size:12px;line-height:1.2}
      .darlink-hall-row .material-symbols-outlined{color:rgba(255,255,255,.35);transition:transform .18s ease,color .18s ease}
      .darlink-hall-row:hover .material-symbols-outlined{transform:translateX(3px);color:white}
    `;
  }

  function backControlCss() {
    return `
      .darlink-module-back{
        position:fixed;
        left:clamp(16px,3vw,34px);
        top:92px;
        z-index:160;
        height:46px;
        display:inline-flex;
        align-items:center;
        gap:8px;
        border:1px solid rgba(255,255,255,.72);
        border-radius:999px;
        padding:0 16px 0 13px;
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
      .darlink-module-back .darlink-symbol{
        font-size:20px;
        line-height:1;
      }
      .darlink-module-back strong{
        font-size:13px;
        line-height:1;
        font-weight:850;
        letter-spacing:0;
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
          padding:0 13px 0 11px;
        }
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
      if (page === api.page.login) enhanceLogin(doc, api);
      if (page === api.page.onboard1) enhanceChatOnboarding(doc, api, 1);
      if (page === api.page.onboard2) enhanceChatOnboarding(doc, api, 2);
      if (page === api.page.onboard3) enhanceChatOnboarding(doc, api, 3);
      if (page === api.page.home) enhanceHome(doc, api);
      if (page === api.page.matchChat) enhanceContextualChat(doc);
      if (page === api.page.hall) enhanceHallOfFame(doc);
      if (![api.page.login, api.page.onboard1, api.page.onboard2, api.page.onboard3, api.page.home].includes(page)) localizeStatic(doc, page);
      replaceMaterialIconFallbacks(doc);
      watchMaterialIconFallbacks(doc);
      addModuleBackControl(doc, page, api);
    },
  };
})();
