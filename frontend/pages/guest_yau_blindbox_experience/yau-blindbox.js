(() => {
  "use strict";

  const YAU_GUESS_SCRIPT = [
    "你最近還學數學嗎？別跟我說只是刷題，那樣很可惜。",
    "分數當然重要，但不要把它當成全部。這是你們學習的一個極小部分。",
    "現在有些學生題做得很多，可是真問他為什麼，反而說不清楚。成績看著好，底子卻虛。",
    "豈止是不滿意。有些成績拿出來宣傳，反而讓人擔心。這樣的成績，使人汗顏！如此成績，如何招生？",
    "更糟的是，有些地方把數學搞成包裝，把教育搞成表演，已經到了無恥的地步。",
  ];
  const YAU_GUESS_FAIL = "我宣布你已經不是我的學生了！";
  const YAU_SMS_SUFFIX = "--發自我的手機";
  const SEND_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function seededShuffle(items, seed) {
    const out = items.slice();
    let state = seed >>> 0;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function buildYauQuizOptions() {
    const pool = [
      { id: "shing-tung-yau", label: "丘*桐" },
      { id: "yang-zhenning", label: "杨*宁" },
      { id: "chen-jingrun", label: "陈*润" },
      { id: "hua-luogeng", label: "华*庚" },
    ];
    return seededShuffle(pool, Date.now() + 17).map((opt, index) => ({
      ...opt,
      key: String.fromCharCode(65 + index),
      correct: opt.id === "shing-tung-yau",
    }));
  }

  function formatYauBlindboxReply(raw) {
    let cleaned = String(raw || "").trim();
    cleaned = cleaned.replace(/\n?(--[发發]自我的手機|\/\/發自我的手機)\s*$/u, "").trim();
    if (!cleaned) return "";
    return `${cleaned}\n${YAU_SMS_SUFFIX}`;
  }

  function yauReplyBody(raw) {
    return String(raw || "").replace(/\n?(--[发發]自我的手機|\/\/發自我的手機)\s*$/u, "").trim();
  }

  async function postJSON(url, payload, timeoutMs = 45000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { ...data, ok: false };
      return data;
    } catch (error) {
      return { ok: false, error: error.message || "network_error" };
    } finally {
      window.clearTimeout(timer);
    }
  }

  function mountGuestYauBlindbox() {
    document.title = "Darlink · 人物盲盒体验";
    let userTurns = 0;
    let phase = "script";
    let sending = false;
    const messages = [{ from: "qiu", text: formatYauBlindboxReply(YAU_GUESS_SCRIPT[0]) }];

    document.body.innerHTML = `
      <main class="darlink-challenge-scene darlink-yau-guess-scene">
        <section class="darlink-liquid-stage" aria-hidden="true">
          <div class="darlink-liquid-sky"></div>
          <div class="darlink-liquid-water"><span></span><span></span><span></span></div>
          <div class="darlink-digital-player">
            <div class="darlink-player-aura"></div>
            <div class="darlink-player-avatar">??</div>
            <strong>神秘人物</strong>
          </div>
        </section>
        <aside class="darlink-challenge-panel darlink-yau-guess-panel">
          <span>人物盲盒</span>
          <h1>猜猜我是誰</h1>
          <div class="darlink-yau-chat" id="darlinkYauMessages" aria-live="polite"></div>
          <form class="darlink-yau-input-row" id="darlinkYauForm">
            <textarea id="darlinkYauInput" rows="2" placeholder="随便说点什么..."></textarea>
            <button type="submit" aria-label="发送">${SEND_ICON}</button>
          </form>
          <p class="darlink-guest-footnote">访客体验：聊 5 轮后猜出神秘人物。无需登录。</p>
        </aside>
      </main>
    `;

    const messagesEl = document.getElementById("darlinkYauMessages");
    const input = document.getElementById("darlinkYauInput");
    const form = document.getElementById("darlinkYauForm");

    const render = () => {
      messagesEl.innerHTML = messages.map((message) => {
        if (message.from === "qiu") {
          const body = message.typing
            ? '<p class="darlink-yau-typing"><span></span><span></span><span></span></p>'
            : `<p>${escapeHtml(message.text)}</p>`;
          return `<div class="darlink-yau-msg qiu"><span>??</span>${body}</div>`;
        }
        return `<div class="darlink-yau-msg user"><p>${escapeHtml(message.text)}</p></div>`;
      }).join("");
      messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const setTyping = (active) => {
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i].typing) messages.splice(i, 1);
      }
      if (active) messages.push({ from: "qiu", text: "", typing: true });
      render();
    };

    const fetchYauReply = async (userAnswer, turnIndex, anchorScript) => {
      const recent_messages = messages
        .filter((message) => !message.typing)
        .slice(-8)
        .map((message) => ({
          role: message.from === "user" ? "user" : "assistant",
          content: yauReplyBody(message.text),
        }));
      const payload = {
        lang: "zhHant",
        phase: "celebrity-yau-guess",
        answer: userAnswer,
        current_question: `盲盒對話第 ${turnIndex} 輪`,
        next_question: turnIndex + 1 < YAU_GUESS_SCRIPT.length ? YAU_GUESS_SCRIPT[turnIndex + 1] : "",
        known_answers: { turn: turnIndex, anchor_script: anchorScript, user_message: userAnswer },
        recent_messages,
      };
      let lastError = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, 500));
        const res = await postJSON("/api/ai/chat", payload);
        if (res.ok && res.reply && yauReplyBody(res.reply).length >= 12) return res.reply;
        lastError = res.error || res.reason || "short reply";
      }
      throw lastError || new Error("yau-guess-llm-failed");
    };

    const openYauQuizModal = () => {
      phase = "quiz";
      input.disabled = true;
      form.hidden = true;
      const options = buildYauQuizOptions();
      const overlay = document.createElement("div");
      overlay.className = "darlink-yau-quiz-overlay";
      overlay.innerHTML = `
        <section class="darlink-yau-quiz-modal" role="dialog" aria-modal="true">
          <span>最后一关</span>
          <h2>猜猜我是谁？</h2>
          <p>请从下面选一个答案。</p>
          <div class="darlink-challenge-options">
            ${options.map((opt) => `<button type="button" data-quiz-option="${opt.id}">${opt.key}. ${escapeHtml(opt.label)}</button>`).join("")}
          </div>
        </section>`;
      document.body.appendChild(overlay);
      overlay.querySelectorAll("[data-quiz-option]").forEach((button) => {
        button.addEventListener("click", () => {
          const chosen = options.find((opt) => opt.id === button.dataset.quizOption);
          overlay.remove();
          if (chosen?.correct) showYauRewardModal();
          else showYauFailModal();
        });
      });
    };

    const showYauRewardModal = () => {
      phase = "done";
      const overlay = document.createElement("div");
      overlay.className = "darlink-yau-quiz-overlay darlink-yau-reward-overlay";
      overlay.innerHTML = `
        <section class="darlink-yau-quiz-modal darlink-yau-reward-modal">
          <div class="darlink-yau-watch-scene">
            <div class="darlink-yau-watch-glow"></div>
            <div class="darlink-yau-watch-ring"></div>
            <div class="darlink-yau-watch">⌚</div>
          </div>
          <h2>奖励到手！</h2>
          <p>你猜对了神秘人物。感谢体验本次盲盒挑战。</p>
          <button type="button" class="darlink-guest-action" id="darlinkGuestReplayBtn">再玩一次</button>
        </section>`;
      document.body.appendChild(overlay);
      overlay.querySelector("#darlinkGuestReplayBtn").addEventListener("click", () => {
        window.location.reload();
      });
    };

    const showYauFailModal = () => {
      phase = "done";
      const overlay = document.createElement("div");
      overlay.className = "darlink-yau-quiz-overlay darlink-yau-fail-overlay";
      overlay.innerHTML = `
        <section class="darlink-yau-quiz-modal darlink-yau-fail-modal">
          <h2>${escapeHtml(YAU_GUESS_FAIL)}</h2>
          <p>没关系，再试一次吧。</p>
          <button type="button" class="darlink-guest-action" id="darlinkGuestRetryBtn">再试一次</button>
        </section>`;
      document.body.appendChild(overlay);
      overlay.querySelector("#darlinkGuestRetryBtn").addEventListener("click", () => {
        window.location.reload();
      });
    };

    const submit = async (raw) => {
      const value = normalize(raw);
      if (!value || phase !== "script" || sending) return;
      sending = true;
      input.disabled = true;
      messages.push({ from: "user", text: value });
      render();
      try {
        userTurns += 1;
        if (userTurns < YAU_GUESS_SCRIPT.length) {
          setTyping(true);
          try {
            const reply = await Promise.race([
              fetchYauReply(value, userTurns, YAU_GUESS_SCRIPT[userTurns]),
              new Promise((_, reject) => window.setTimeout(() => reject(new Error("yau-guess-timeout")), 50000)),
            ]);
            messages.push({ from: "qiu", text: formatYauBlindboxReply(reply) });
          } catch {
            userTurns -= 1;
            messages.push({ from: "qiu", text: "小搭還沒想好，請再發一次。" });
          } finally {
            setTyping(false);
          }
        } else {
          messages.push({ from: "qiu", text: "五輪聊完了，來最後一題。" });
          render();
          window.setTimeout(openYauQuizModal, 420);
        }
      } finally {
        sending = false;
        input.disabled = phase !== "script";
        render();
      }
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const draft = input.value;
      input.value = "";
      submit(draft);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const draft = input.value;
        input.value = "";
        submit(draft);
      }
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountGuestYauBlindbox);
  } else {
    mountGuestYauBlindbox();
  }
})();
