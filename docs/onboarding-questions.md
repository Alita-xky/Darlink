# 小搭 onboarding 三步对话 · 问题清单（可编辑）

> 用途：修改下方「你的修改版」列，改完后同步到 **`frontend/onboarding-config.js`**（唯一配置源）。
>
> 代码位置：`frontend/onboarding-config.js` → `questionText` / `step1Fields` / `step2Questions`

---

## 流程总览

| 步骤 | 页面 | 目标 | 题数 |
|------|------|------|------|
| **步骤 1/3** | onboard1 | 收集基础身份与匹配信号 | 6 必填 + 5 选填 |
| **步骤 2/3** | onboard2 | 蒸馏语气、幽默、边界、安慰方式 | 1 确认 + 4 必填 + 2 选填 |
| **步骤 3/3** | onboard3 | 选择首条社交路径 | 1 必填 |

每答一题：用户发送 → 后端 LLM 生成过渡回复 → 进入下一题。选填题可点「跳过」。

---

## 步骤 1/3 · 基础信息对话

**开场白（首条小搭消息）**  
- EN: `Xiaoda: What nickname would you like people to call you?`  
- 简: `小搭：你希望别人怎么称呼你？可以是昵称。`  
- 繁: `小搭：你希望別人怎麼稱呼你？可以是暱稱。`

| # | 字段 ID | 必填 | 简体问题（当前） | 你的修改版（简体） |
|---|---------|------|------------------|-------------------|
| 1 | `nickname` | ✅ | 你希望别人怎么称呼你？可以是昵称。 | |
| 2 | `school` | ✅ | 你来自哪所高校？请写学校官方名称。 | |
| 3 | `contact` | ✅ | 请留下一个后续匹配可用的联系方式，例如微信、WhatsApp 或 Instagram，小搭会帮你保护边界。 | |
| 4 | `goal` | ✅ | 你现在最想找哪类连接：学习伙伴、社交搭子，还是恋爱对象？ | |
| 5 | `grade` | ✅ | 你现在是几年级或哪个学习阶段？ | |
| 6 | `majorDirection` | ✅ | 你的专业或学科方向是什么？ | |
| 7 | `selfWords` | 选填 | 选填：用三个词形容你自己。 | |
| 8 | `chatStyle` | 选填 | 选填：什么样的聊天方式最像你？ | |
| 9 | `interests` | 选填 | 选填：告诉小搭最多五个可以用来破冰的兴趣。 | |
| 10 | `tabooTopics` | 选填 | 选填：初次认识时有没有你不希望对方触碰的话题？ | |
| 11 | `heightWeight` | 选填 | 选填：身高体重只有你愿意才需要说，也可以跳过。 | |

**步骤 1 完成后**：点击「进入人物画像对话」→ 进入步骤 2。

---

## 步骤 2/3 · 人物画像蒸馏

**开场白（首条小搭消息）**  
- 由 LLM 根据步骤 1 答案生成实时总结（`phase2-summary`），若 LLM 失败则用本地 fallback 模板。  
- Fallback 简: `小搭：我先根据第一步做一个实时总结：{nickname}目前的关键信号是 …。如果哪里不准，你可以直接纠正我…`

| # | 字段 ID | 必填 | 简体问题（当前） | 你的修改版（简体） |
|---|---------|------|------------------|-------------------|
| 1 | `summaryConfirm` | ✅ | 我先总结一下目前对你的理解，你觉得准确吗？ | |
| 2 | `joke` | 选填 | 发我一个能代表你幽默感的梗、玩笑或一句话。 | |
| 3 | `catchphrase` | ✅ | 你放松的时候常说的一句话是什么？ | |
| 4 | `personality` | 选填 | 如果你知道 MBTI、星座或其他性格标签，可以只作为参考告诉我。 | |
| 5 | `memory` | ✅ | 讲一个影响你交朋友或信任他人的经历。 | |
| 6 | `comfort` | ✅ | 你压力大的时候，别人怎样回应会让你觉得被安慰？ | |
| 7 | `disagree` | ✅ | 你和别人意见不同时，通常会怎样表达？ | |

**步骤 2 完成后**：点击「进入路径选择」→ 进入步骤 3。

---

## 步骤 3/3 · 第一条社交路径

**开场白（首条小搭消息）**  
- 简: `小搭：告诉小搭你想先从学习伙伴、社交搭子，还是恋爱对象开始。`

| # | 字段 ID | 必填 | 简体问题（当前） | 你的修改版（简体） |
|---|---------|------|------------------|-------------------|
| 1 | `intent` | ✅ | 你希望小搭先开启哪条路径：学习搭子、社交搭子，还是深度恋爱？ | |

**路径选项（快捷 chips）**  
- 学习伙伴 / Study Partner → `study`  
- 社交搭子 / Social Companion → `social`  
- 恋爱对象 / Romance Partner → `romance`

**步骤 3 完成后**：点击「生成我的画像」→ 调用 LLM 生成 3 张 persona 卡片。

---

## 英文 / 繁体对照（当前版本，供一并修改）

修改简体时，如需同步 EN / 繁体，可在下方填写：

### 步骤 1（EN）

| ID | 当前英文 | 你的修改版 |
|----|----------|------------|
| nickname | What nickname would you like people to call you? | |
| school | Which university are you from? Please use the official school name. | |
| contact | Leave one contact method Xiaoda can protect for later matching… | |
| goal | What kind of connection are you mainly looking for now… | |
| grade | Which year or study stage are you in? | |
| majorDirection | What is your major or academic direction? | |
| selfWords | Optional: use three words to describe yourself. | |
| chatStyle | Optional: what kind of chat style feels most like you? | |
| interests | Optional: tell Xiaoda up to five interests… | |
| tabooTopics | Optional: are there topics you prefer new people avoid at first? | |
| heightWeight | Optional: share height/weight only if you want. You can skip. | |

### 步骤 2（EN）

| ID | 当前英文 | 你的修改版 |
|----|----------|------------|
| summaryConfirm | I will summarize what I know so far. Does it feel accurate? | |
| joke | Send me a joke, meme style, or one sentence that represents your humor. | |
| catchphrase | What phrase do you often say when you are relaxed? | |
| personality | If you know your MBTI, zodiac… share it only as a reference. | |
| memory | Tell me one experience that shaped how you make friends or trust people. | |
| comfort | When you are stressed, what kind of response from another person comforts you? | |
| disagree | When you disagree with someone, how do you usually express it? | |

### 步骤 3（EN）

| ID | 当前英文 | 你的修改版 |
|----|----------|------------|
| intent | Which path should Xiaoda open first: Study Sync, Social Companion, or Deep Romance? | |

> 繁体版与简体一一对应，见代码 `QUESTION_TEXT.zhHant`。

---

## LLM 行为说明（改问题时请注意）

1. **每轮请求**会带上 `current_question`、`next_question`、`known_answers`、最近 6 条消息。  
2. **步骤 2 开场**单独请求 `phase: "phase2-summary"`，要求 LLM 总结步骤 1，且不要用「准确吗」式问法。  
3. **选填跳过**不会写入 `answers`，但会推进到下一题。  
4. **改 wording 后**需同步三语 `QUESTION_TEXT.en / zhHans / zhHant`，否则切换语言时无法正确映射历史消息。

---

## 提交修改方式

1. 在本文件「你的修改版」列填好新文案。  
2. 如需增删题目，注明：新增/删除哪一题、是否必填、放在第几步第几题。  
3. 发给开发后，将更新 `QUESTION_TEXT` + `questionPlan()`，并 bump `app.html` 缓存版本。
