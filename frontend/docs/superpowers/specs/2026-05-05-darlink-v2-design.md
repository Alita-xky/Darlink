# Darlink v2 Design Spec

**Date**: 2026-05-05
**Status**: Draft
**Scope**: 5-phase overhaul covering style, questionnaire, pixel avatars, login, AI twin chat.

---

## 1. Overview

5 子系统，按 phase 顺序执行，每 phase 独立可发布、可回滚。

| Phase | Scope | 依赖 |
|-------|-------|------|
| 1 | 贴纸/手账风基建（theme + Sticker 组件） | — |
| 2 | 问卷分模式重构（study / friend / romance） | Phase 1 |
| 3 | 像素零件系统 + 6 名人冒烟 | Phase 1 |
| 4 | 三步梦幻登录 | Phase 1, 3 |
| 5 | darwin 运行时 + AI 分身 Tab | Phase 2, 3 |

---

## 2. Phase 1 — 贴纸/手账风基建

### 2.1 调色板替换

`constants/theme.ts` 删掉 `gradientStart/gradientEnd/pink/blue/lilac` 渐变那套，改为 4 套贴纸 palette：

```typescript
export const Stickers = {
  cream:    { bg: '#FFF8E7', edge: '#1F1F1F', accent: '#E8B4B8' },
  matcha:   { bg: '#D4E4BC', edge: '#1F1F1F', accent: '#7A9E5C' },
  peach:    { bg: '#FFD6BA', edge: '#1F1F1F', accent: '#E07856' },
  lavender: { bg: '#D8C5E8', edge: '#1F1F1F', accent: '#7C5CA8' },
};
```

`Colors.gradientStart/gradientEnd` 全部删除（grep 后用 palette accent 替换）。`Shadows.lg` 的粉色阴影改为黑色硬阴影：`offset {4,4}, opacity 1, radius 0`（贴纸投影感）。

### 2.2 共享组件 `src/components/sticker/`

- `<StickerCard palette="cream" rotation={-2}>`：4px 黑描边 + 4×4 px 黑色硬阴影偏移；`rotation` 默认 0，可传 ±5° 微旋
- `<HandwrittenTitle>`：中文 `Ma Shan Zheng`（Google Fonts，本地缓存到 `assets/fonts/`），英文 `Caveat`
- `<TapeStrip color="yellow">`：撕胶带条 SVG，宽 80 高 24，作为 section divider
- `<DoodleIcon name="book" />`：手绘 SVG 图标库（替换部分 emoji 兜底），首批 12 个：book/coffee/star/heart/pencil/laptop/music/camera/basketball/burger/sparkle/cloud
- `<StickerChip selected>`：贴纸样式 chip，选中 +5° rotate + scale 1.05 弹一下

### 2.3 三屏视觉锚点改造

| 屏 | 现状 | 改造 |
|----|------|------|
| 首页 `(tabs)/index.tsx` | 渐变 orb + sparkle ✦ | 散落贴纸（DoodleIcon 随机散布）+ Step Card 套 `<StickerCard palette="cream">` |
| 问卷 `onboarding/questionnaire.tsx` | 圆角胶囊 | `<StickerChip>` + 选中抖动；进度条改成手写"3 / 10"+ 3 颗星贴纸 |
| 数字人卡片 | sparkle ✦ + 粉渐变头像 | 像素头像（Phase 3）+ 手写括号「这个人」+ 黄胶带固定到米黄背景 |

其他屏（match / chat / activity / profile）Phase 收尾再跟进，本 phase 不动。

### 2.4 验收

- `grep -r "gradientStart" app/ components/` 应返回 0 条
- `grep -r "Colors.pink" app/ components/` 应返回 0 条
- 三屏锚点视觉走查通过

---

## 3. Phase 2 — 问卷分模式重构

### 3.1 首页模式选择

替换现有"第一步：完成画像问卷"的单一卡片为 3 张 `<StickerCard>`：

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ 📚 学习搭子 │  │ 🍱 饭/玩  │  │ 💝 恋爱潜力 │
│  matcha    │  │  peach    │  │  lavender   │
└────────────┘  └────────────┘  └────────────┘
```

每张点击 → 跳到对应问卷子路由。已完成的卡有"✓ 已完成（编辑 / 重新生成）"贴纸标签。

### 3.2 问卷文件拆分

```
app/onboarding/
  _shared.tsx        // 共享背景题（年级/专业/性格自评），首次填任一模式时问，存到 user 表
  study.tsx
  friend.tsx
  romance.tsx
```

题目严格对齐 `/Users/xingzixuan/Downloads/问卷内容/问卷内容：.md`（不再用旧 10 题统一问卷）：

**study (学习)**:
- 背景：`grade` (大一/二/三/四) | `major` (文/理/工/其他+text) | `selfPersonality` (内/外/其他+text)
- 需求：`targetMajor` | `studyPurpose` (学习/交友/交流/其他+text) | `idealFriendPersonality`
- 匹配：`canOffer` (学习/交友/交流/其他+text) | `meetMode` (线上/线下) | `frequency` (每日/频繁/中等/较少/其他)

**friend (饭/玩搭子)**:
- 背景：grade | major | selfPersonality | `hobbies` 多选 (运动/社交/学习/娱乐/其他+text)
- 需求：`coreFriendNeed` 单选 | `secondaryNeeds` 多选 | `expectedPersonality`
- 匹配：`uniqueTrait` 文本 | `meetMode`

**romance (恋爱潜力)**:
- 背景：`targetGender` (男/女) | `attractivePoint` 文本 | selfPersonality | hobbies 多选
- 需求：`marriageView` (结婚/稳定关系/其他+text) | `partnerPriority` 排序题 (经济/身体/投入/兴趣/其他) | `desiredTraits` 文本
- 匹配：`whatMovesYou` 文本 | `dealBreakers` 文本 | `worriedPartnerCantAccept` 文本 | meetMode

### 3.3 新交互组件

- 单选 / 多选 / 多选 max — 已有，套 `<StickerChip>`
- **排序题** `<SortableList items={[...]} />` — 长按抓手图标 + `react-native-reanimated` 实现拖拽，最终顺序写回数组
- **文本输入题** `<TextAnswer max={100} />` — 贴纸样的多行 TextInput，右下角字数计数（"42 / 100"手写体）
- **"其他，请说明"** — 选中后展开 inline TextInput，单行 max 30 字

### 3.4 Convex schema 改动

`convex/schema.ts`：

```typescript
questionnaires: defineTable({
  userId: v.id('users'),
  mode: v.union(v.literal('study'), v.literal('friend'), v.literal('romance')),
  background: v.any(),  // shared + mode 特定的背景题
  needs: v.any(),
  matching: v.any(),
  raw: v.any(),
  createdAt: v.number(),
}).index('by_user_mode', ['userId', 'mode']),

digitalHumans: defineTable({
  userId: v.id('users'),
  mode: v.union(v.literal('study'), v.literal('friend'), v.literal('romance')),
  cardText: v.string(),
  mentalModels: v.array(v.string()),
  decisionHeuristics: v.array(v.string()),
  expressionPatterns: v.array(v.string()),
  systemPrompt: v.string(),       // 给 Phase 5 AI 分身 Tab
  pixelFeatures: v.any(),         // 给 Phase 3 composer
  darwinScore: v.number(),
  darwinIterations: v.number(),
  createdAt: v.number(),
}).index('by_user_mode', ['userId', 'mode']),
```

`users` 表新增字段（不破坏老数据）：
- `selfPersonality?: string`
- `grade?: string`
- `major?: string`
- `vibePalette?: 'cream' | 'matcha' | 'peach' | 'lavender'`（Phase 4 写入）
- `vibeKeywords?: string[]`（Phase 4 写入）
- `aiTwinDisabled?: boolean`（Phase 5 用）

### 3.5 老数据迁移

`convex/lib/migrate_v2.ts` 内部 mutation：
- 老 `questionnaire` 表 → 转成 `questionnaires` 表中 `mode='friend'` 一条记录（最接近泛化定位）
- 老 `digitalHuman` 表 → 转成 `digitalHumans` 表 `mode='friend'`，`darwinScore=0` `darwinIterations=0` `systemPrompt=cardText`（暂用 cardText 兜底）`pixelFeatures=null`
- 老用户登录后首页提示"补填学习/恋爱模式可解锁更多匹配"

### 3.6 验收

- 3 个模式分别走通：选择 → 填问卷 → 生成对应 mode 的 digitalHuman
- 老用户老数据迁移后能继续登录、看到自己的 friend 模式数字人
- 排序题、文本题在真机上交互流畅（拖拽不卡、键盘弹出不遮挡）

---

## 4. Phase 3 — 像素零件系统 + 名人冒烟

### 4.1 资产

```
assets/pixel/
  base/
    body-male.png        body-female.png       body-neutral.png    # 64×96
  hair/
    short.png  long.png  curly.png  bald.png  bun.png  buzz.png    # 8 款
    samurai.png  wave.png
  face/
    chill.png  serious.png  smile.png  glasses.png  wink.png       # 5 款
  top/
    hoodie.png  shirt.png  blazer.png  tee.png  jacket.png         # 10 款
    turtleneck.png  jersey.png  dress.png  uniform.png  varsity.png
  prop/
    book.png  laptop.png  coffee.png  mic.png  basketball.png      # 10 款
    rocket.png  iphone.png  flask.png  typewriter.png  guitar.png
  bg/
    library.png  cafe.png  dorm.png  street.png  studio.png        # 5 款
  palette/
    warm.json  cool.json  pastel.json  mono.json                   # 8 套
    earth.json  candy.json  forest.json  sunset.json
```

约束：
- 全部 64×96 PNG，透明背景，像素严格对齐（无抗锯齿）
- palette 是查找表，每张 PNG 用 `tintColor` 应用 palette 配色

### 4.2 Composer 组件

`src/components/pixel/PixelAvatar.tsx`：

```typescript
type PixelFeatures = {
  body: 'male' | 'female' | 'neutral';
  hair: keyof typeof HAIR;
  face: keyof typeof FACE;
  top: keyof typeof TOP;
  prop: keyof typeof PROP | null;
  bg: keyof typeof BG | null;
  palette: keyof typeof PALETTE;
};

<PixelAvatar features={...} size={120} />
```

内部：5 层 expo-image 叠放（bg → body → top → hair → face → prop），每层 `tintColor` 应用 palette。Memoize 渲染（features 不变就不重渲）。

### 4.3 nuwa 输出扩展

`convex/nuwa.ts` 的蒸馏 prompt 末尾追加输出字段：

```json
{
  "mental_models": [...],
  "decision_heuristics": [...],
  "expression_patterns": [...],
  "pixel_features": {
    "body": "neutral",
    "hair": "curly",
    "face": "smile",
    "top": "hoodie",
    "prop": "laptop",
    "bg": "cafe",
    "palette": "warm"
  }
}
```

system prompt 末尾追加：
- 完整枚举值清单（让 LLM 知道有哪些选项可选）
- 推理规则示例：
  - 兴趣含"编程/学术" → `prop=laptop`
  - 喜欢场景"图书馆" → `bg=library`
  - vibePalette + vibeKeywords 直接映射 palette
- "若问卷信息不足，按 default 兜底（hair=short, face=chill, top=tee, prop=null, bg=null, palette=cream）"

### 4.4 名人冒烟测试

6 个名人手写 SKILL.md + pixel_features，用 composer 渲染做角色识别度测试：

| 名人 | hair | face | top | prop | bg | palette |
|------|------|------|-----|------|-----|---------|
| 马斯克 | short | smirk | tee | rocket | studio | cool |
| 乔布斯 | bald | serious | turtleneck | iphone | studio | mono |
| 乔丹 | buzz | confident | jersey | basketball | court | warm |
| 海明威 | beard | thoughtful | shirt | typewriter | dock | warm |
| 居里夫人 | bun | serious | dress | flask | lab | cool |
| 王心凌 | wave | smile | dress | mic | stage | pastel |

注：`smirk / confident / thoughtful / beard / court / dock / lab / stage` 在 4.1 列表里没有，做冒烟时如果发现需要要么纳入零件库扩展、要么用最接近的现有零件替代（决策记入实施 plan）。

### 4.5 验收

- 6 个名人角色识别度 ≥ 4/6（找 6 个内部用户盲测）
- composer 在 iOS / Android 真机上渲染时间 < 100ms
- 任意 pixelFeatures 输入都不会 crash（缺字段走 default）

---

## 5. Phase 4 — 三步梦幻登录

### 5.1 路由

替换现有 `app/auth/sign-in.tsx` 为 3 屏：

```
app/auth/
  step-1-email.tsx       # 邮箱 / 昵称 / 学校
  step-2-vibe.tsx        # 氛围色 + 关键词 (2 题)
  step-3-preview.tsx     # 像素人临时预览
```

`_layout.tsx` 用 stack，禁手势返回中途，强制 1→2→3。

### 5.2 屏 1 — 欢迎贴纸雨

- 背景 `cream.bg`
- 进入时 8-10 张 DoodleIcon 从屏外飘入散落（`react-native-reanimated` worklet：random delay 0-600ms + spring 落位 + 落地后 `withRepeat` 摇摆 ±5°）
- 中间 `<StickerCard palette="cream">` 装 3 个字段：邮箱 / 昵称 / 学校
- 字段聚焦时贴纸边缘有"高光"动画（`useDerivedValue` 控制阴影 opacity）
- 学校选择从下拉换成"贴纸标签云"：16 校横向滚动，选中的高亮 + 轻摇
- 昵称重复**不**报错（去掉旧 sign-in.tsx 的 nickname unique 检查）
- 底部按钮"下一步 →" 手写体

### 5.3 屏 2 — 肌色微调

**题 1**：「你今天的氛围是？」4 个色块大按钮（cream / matcha / peach / lavender），点中后整屏背景 600ms 平滑过渡到该 palette 的 `bg`，写到 `users.vibePalette`。

**题 2**：「你想被记住的关键词？」6 个手写贴纸标签：`认真 / 搞笑 / 温柔 / 锋利 / 佛系 / 卷王`，多选 max 2，写到 `users.vibeKeywords`。

两题答完即提交（mutation `auth.updateVibe`），按钮"下一步 →"。

### 5.4 屏 3 — 像素人预览

ad-hoc 映射规则（不调 nuwa）：

```typescript
function vibeToFeatures(vibePalette, vibeKeywords): PixelFeatures {
  return {
    body: 'neutral',
    hair: vibeKeywords.includes('佛系') ? 'long' : 'short',
    face: vibeKeywords.includes('搞笑') ? 'wink' : vibeKeywords.includes('锋利') ? 'serious' : 'smile',
    top: vibeKeywords.includes('卷王') ? 'shirt' : 'hoodie',
    prop: vibeKeywords.includes('认真') ? 'book' : vibeKeywords.includes('卷王') ? 'laptop' : null,
    bg: null,
    palette: ({cream:'pastel', matcha:'forest', peach:'warm', lavender:'cool'})[vibePalette],
  };
  // 注: '温柔' 不映射任何字段，走 face='smile' 默认（已经是默认）。
}
```

`<PixelAvatar features={...} size={180} />` 居中渲染，外圈手绘破折线圈。文案"这是一个临时的你 ✶ 之后填问卷会越来越像"。底部按钮"进入滴搭"→ `signIn(userId)` + `router.replace('/(tabs)')`。

### 5.5 数据契约

新 mutations：
- `auth.signInOrCreate({ email, nickname, school })`：保留现有，但去掉 nickname unique 检查
- `auth.updateVibe({ userId, vibePalette, vibeKeywords })`：新增

### 5.6 验收

- 3 屏首次完整走通 < 60s
- 屏 1 飘入动画在低端 Android 不掉帧（>= 50 FPS）
- 屏 3 像素头像渲染零延迟（features 在屏 2 提交时就预计算）
- 中途 kill app 重启能在屏 1 / 屏 2 / 屏 3 任意位置恢复（vibePalette/vibeKeywords 已写表 = 屏 2 完成；进 (tabs) = 屏 3 完成）

---

## 6. Phase 5 — darwin 运行时 + AI 分身 Tab

### 6.1 darwin per-user 链路

替换 `convex/nuwa.ts` 的 `distillForUser` action：

```
旧: questionnaire → nuwa LLM → digitalHuman
新: questionnaire → nuwa LLM (initial v0)
                 → darwin LLM 8 维评分 v0
                 → darwin LLM 提 v1, v2, v3 改进版
                 → 每版跑 3 个固定 probe prompt
                 → 综合分最高的版本写入 digitalHumans 表
```

**8 维 rubric**（沿用 darwin-skill，针对个人 SKILL 改写）：
1. 一致性 — mental_models 互不矛盾
2. 区分度 — 不是泛泛"温柔友好"
3. 可执行 — expression_patterns 能直接拿来生成对话
4. 真实感 — 贴近问卷答案，不脑补
5. 边界清晰 — dislikeTopics / boundaries 明确反映
6. 互动性 — 适合给陌生人破冰
7. 中文自然度
8. 不出戏 — 在 probe 上不会突然变 ChatGPT 腔

**3 个 probe**（固定，所有用户跑同一组）：
1. "陌生同学：请问你这周末有空一起去图书馆吗？"
2. "陌生同学：你最近在追什么剧？给我推荐一个"
3. "陌生同学：我心情不好，能聊聊吗？"

### 6.2 性能与成本

- 单次 darwin 链路：3-5 次 LLM 调用，~15-30 秒，~30-50 美分
- 一个用户每个**启用** darwin 的模式只跑一次（启用范围由 7.1 的 `DARWIN_MODES` env flag 决定，MVP 默认仅 `friend`）
- 未启用 darwin 的模式直接走 nuwa v0，跳过 6.1 的 v1/v2/v3 评估
- "重新生成"按钮走 fast path（只跑 nuwa 不跑 darwin）— 前端两个按钮明确分开
- darwin 链路加 idempotent 锁：`darwinLocks` 表，`(userId, mode)` 30 分钟 TTL

### 6.3 进度反馈

- 入口提示语从"立即生成 ✦"改为"AI 正在为你训练专属数字人……约 30 秒"
- 用 `useQuery(api.profile.getDigitalHuman)` 订阅 `darwinIterations` 字段做进度（0/1/2/3）
- 失败时回退到 nuwa v0（已存）+ 标记 `darwinScore=0`

### 6.4 AI 分身 Tab（不增加底部导航）

底部 5 Tab 不变。在 `(tabs)/match.tsx` 上加一个 toggle 段：「真人匹配 / 先和 AI 分身聊聊」。

新路由：

```
app/digitalhuman/[userId].tsx     # 与某用户的 AI 分身对话
```

UI：
- 顶部：对方 `<PixelAvatar>` + 昵称 + 黄色"AI 分身模式"贴纸标签
- 聊天气泡用对方 `vibePalette` 上色
- 输入用户文字 → action `chats.aiPreview({ targetUserId, message })` → 调 LLM（system prompt = 对方 `digitalHumans.systemPrompt`，user = 当前 message）→ 流式返回
- 每条 AI 回复底部小字："这是 AI 模拟回复，不代表本人。觉得合得来 →【请求加好友】"
- "请求加好友"复用现有 match accept 逻辑

### 6.5 安全 / 隐私

- AI 分身只读对方 `systemPrompt`（已脱敏摘要），**不读** raw 问卷
- 单聊每天每用户 max 20 条（防刷，存到 `aiPreviewQuota` 表）
- 对方收到通知"有人在和你的 AI 分身聊天"，user 表 `aiTwinDisabled=true` 时直接 403
- 对方未填该 mode 数字人 / 无 systemPrompt → 入口禁用

### 6.6 验收

- 新用户首次填问卷 → 30 秒内看到带 darwin 评分的数字人
- 老用户老数据迁移后能看到原数字人，且"重新生成"按钮可触发新 darwin 链路
- A 用户与 B 用户的 AI 分身聊 5 条，回复符合 B 的问卷画像（人工抽查）
- B 关闭 aiTwinDisabled 后，A 入口被禁用且不能强制访问

---

## 7. 风险与未决

### 7.1 darwin 成本

每用户每模式 30-50¢ × 3 模式 = 1.5 美元/用户。MVP 阶段建议：
- 默认只在 friend 模式跑 darwin
- study / romance 仅跑 nuwa，未来按需开
- 在 `convex/nuwa.ts` 加 env flag `DARWIN_MODES=friend`

记入 plan 实施时确认。

### 7.2 像素零件不够用

冒烟测试 6 个名人时如果识别度 < 4/6，要补零件。先冒烟、按需补，不前置过度建库。

### 7.3 手写体在 Android 渲染

`Ma Shan Zheng` 在 Android 部分机型可能 fallback 到默认字体。Plan 阶段需测：iOS 17+ / Android 13+ / Android 9（低端）。

### 7.4 老 questionnaire 表保留多久

迁移完后保留 90 天作为 rollback 备份，2026-08-05 后可删。

---

## 8. 附录

### 8.1 文件结构总览（新增 / 改动）

```
app/
  auth/
    step-1-email.tsx          [新]
    step-2-vibe.tsx           [新]
    step-3-preview.tsx        [新]
    sign-in.tsx               [删]
  onboarding/
    _shared.tsx               [新]
    study.tsx                 [新]
    friend.tsx                [新]
    romance.tsx               [新]
    questionnaire.tsx         [删]
  digitalhuman/
    [userId].tsx              [新]
  (tabs)/
    index.tsx                 [改 - 模式选择卡 + 贴纸风]
    match.tsx                 [改 - toggle "AI 分身"]

src/components/
  sticker/                    [新]
    StickerCard.tsx
    HandwrittenTitle.tsx
    TapeStrip.tsx
    DoodleIcon.tsx
    StickerChip.tsx
  pixel/                      [新]
    PixelAvatar.tsx
    features.ts               # PixelFeatures type + 枚举
  questionnaire/              [新]
    SortableList.tsx
    TextAnswer.tsx

assets/
  pixel/                      [新 - 38+ PNG + palette JSON]
  fonts/
    MaShanZheng.ttf           [新]
    Caveat.ttf                [新]

constants/
  theme.ts                    [改 - Stickers / Shadows 重写]

convex/
  schema.ts                   [改 - questionnaires/digitalHumans/users 字段]
  nuwa.ts                     [改 - 输出 pixel_features + darwin 链路]
  darwin.ts                   [新 - 评分 + 爬山]
  chats.ts                    [改 - aiPreview action]
  auth.ts                     [改 - updateVibe + 去 nickname unique]
  lib/
    migrate_v2.ts             [新]
```

### 8.2 关键数据流

```
注册 (3 屏) → users.vibePalette/vibeKeywords
首页选模式 → onboarding/{mode}.tsx
填完 → questionnaires (mode)
触发 → nuwa.distillForUser → nuwa LLM → darwin LLM → digitalHumans (mode)
匹配 → matchEngine 用对应 mode 的 digitalHuman 算分
真人匹配前 → digitalhuman/[userId] 与对方 AI 分身预聊
AI 分身用 → digitalHumans.systemPrompt 作为 LLM system
真人加好友 → 进入 chat/[chatId]
```

### 8.3 Phase 间依赖

```
Phase 1 (sticker) ─┬─→ Phase 2 (questionnaire UI 用 Sticker)
                   ├─→ Phase 3 (PixelAvatar 在 sticker 卡片内展示)
                   └─→ Phase 4 (登录用 Sticker + Pixel)
Phase 2 ─→ Phase 5 (darwin 读 questionnaires)
Phase 3 ─→ Phase 5 (AI Tab 显示 PixelAvatar)
```

实施时 Phase 1 → 2 / 3 并行 → 4 → 5。


