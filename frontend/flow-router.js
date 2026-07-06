(() => {
  "use strict";

  installPlazaLeaderboardStorageGuard();
  installHomePerfFetchHotfix();
  let cachedPlazaLeaderboardItems = null;

  const PAGE = {
    login: "login_luminous_identity_english_refined",
    onboard1: "onboarding_xiaoda_interactive_ai_guidance",
    onboard2: "onboarding_xiaoda_interactive_ai_guidance_step_2_progress_updated",
    onboard3: "onboarding_xiaoda_guidance_step_3_intent_selection",
    home: "home_luminous_dashboard_refined_v4",
    digitalPlaza: "digital_human_plaza_resonance",
    exploreChat: "chat_explore_potential_with_ai_twin",
    xiaodaChat: "chat_xiaoda_anything_real",
    study: "discovery_study_sync_ai_twins_refined_avatars",
    culinary: "discovery_culinary_match_ai_twins_refined_avatars",
    romance: "discovery_deep_romance_ai_twins_refined_avatars",
    matching: "matching_luminous_resonance_network_final_polish",
    matchChat: "chat_luminous_intelligence_refined_v3",
    community: "community_campus_pulse_feed",
    celebrityChallenge: "celebrity_mystery_liquid_glass_challenge",
    profile: "profile_full_campus_identity_final",
  };

  const PAGES = new Set(Object.values(PAGE));
  const ONBOARD_PAGES = new Set([PAGE.login, PAGE.onboard1, PAGE.onboard2, PAGE.onboard3]);
  const BACK_PARENT = {
    [PAGE.celebrityChallenge]: PAGE.home,
    [PAGE.matchChat]: PAGE.home,
    [PAGE.digitalPlaza]: PAGE.home,
    [PAGE.exploreChat]: PAGE.home,
    [PAGE.xiaodaChat]: PAGE.home,
    [PAGE.study]: PAGE.home,
    [PAGE.culinary]: PAGE.home,
    [PAGE.romance]: PAGE.home,
    [PAGE.matching]: PAGE.home,
    [PAGE.community]: PAGE.home,
    [PAGE.profile]: PAGE.home,
  };
  const LANDING = "__landing__";
  const frame = document.getElementById("flowFrame");
  const status = document.getElementById("flowStatus");
  const profileHotspot = document.getElementById("profileHotspot");
  const topNavHotspots = document.getElementById("topNavHotspots");
  const SHELL_TABS = new Set([PAGE.home, PAGE.matching, PAGE.community, PAGE.profile]);

  const PAGE_ASSET_VERSION = "20260705-home-plaza-no-overlap-1";

  let currentPage = null;
  let previousPage = PAGE.home;
  let pageHistory = [];
  let backNavigationRequested = false;
  let routeToken = 0;

  const PAGE_LABELS = {
    zhHans: {
      [PAGE.login]: "学校邮箱验证",
      [PAGE.onboard1]: "小搭基础信息问卷",
      [PAGE.onboard2]: "小搭人物画像对话",
      [PAGE.onboard3]: "小搭社交路径选择",
      [PAGE.home]: "首页",
      [PAGE.digitalPlaza]: "数字人广场",
      [PAGE.exploreChat]: "数字人潜力探索",
      [PAGE.xiaodaChat]: "小搭自由聊天",
      [PAGE.study]: "学习伙伴发现",
      [PAGE.culinary]: "社交搭子发现",
      [PAGE.romance]: "恋爱对象发现",
      [PAGE.matching]: "共振匹配网络",
      [PAGE.matchChat]: "智能聊天",
      [PAGE.community]: "校园社区",
      [PAGE.celebrityChallenge]: "人物盲盒挑战",
      [PAGE.profile]: "个人档案",
    },
    zhHant: {
      [PAGE.login]: "學校郵箱驗證",
      [PAGE.onboard1]: "小搭基礎資訊問卷",
      [PAGE.onboard2]: "小搭人物畫像對話",
      [PAGE.onboard3]: "小搭社交路徑選擇",
      [PAGE.home]: "首頁",
      [PAGE.digitalPlaza]: "數字人廣場",
      [PAGE.exploreChat]: "數字人潛力探索",
      [PAGE.xiaodaChat]: "小搭自由聊天",
      [PAGE.study]: "學習搭子發現",
      [PAGE.culinary]: "社交搭子發現",
      [PAGE.romance]: "戀愛對象發現",
      [PAGE.matching]: "共振匹配網絡",
      [PAGE.matchChat]: "智能聊天",
      [PAGE.community]: "校園社群",
      [PAGE.celebrityChallenge]: "人物盲盒挑戰",
      [PAGE.profile]: "個人檔案",
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

  function uiLabel(en, zhHans, zhHant) {
    if (lang() === "zhHans") return zhHans;
    if (lang() === "zhHant") return zhHant;
    return en;
  }

  function escapeHtmlLite(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function installHomePerfFetchHotfix() {
    if (window.__darlinkHomePerfFetchPatched) return;
    window.__darlinkHomePerfFetchPatched = true;
    const nativeFetch = window.fetch.bind(window);

    function readPlazaFeedCache() {
      try {
        const raw = localStorage.getItem("darlink-plaza-feed");
        return raw ? JSON.parse(raw) : null;
      } catch (_error) {
        return null;
      }
    }

    function writePlazaFeedCache(data) {
      try {
        const prev = readPlazaFeedCache() || {};
        localStorage.setItem("darlink-plaza-feed", JSON.stringify({
          real_users: data.real_users || prev.real_users || [],
          demo_users: data.demo_users || [],
          fetchedAt: Date.now(),
        }));
      } catch (_error) {
        /* ignore */
      }
    }

    window.fetch = function darlinkPerfFetch(input, init) {
      const url = String(typeof input === "string" ? input : input?.url || "");
      const method = String(init?.method || "GET").toUpperCase();

      if (url.includes("/api/user/onboarding-complete") && method === "POST") {
        const skipUntil = Number(sessionStorage.getItem("darlink-home-publish-skip-until") || 0);
        if (skipUntil > Date.now()) {
          return Promise.resolve(new Response(
            JSON.stringify({ ok: true, deduped: true }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ));
        }
        return nativeFetch(input, init).then((response) => {
          if (response.ok) {
            sessionStorage.setItem("darlink-home-publish-skip-until", String(Date.now() + 20 * 60 * 1000));
          }
          return response;
        });
      }

      if (url.includes("/api/plaza/feed") && method === "GET") {
        const cached = readPlazaFeedCache();
        if (cached?.fetchedAt && Date.now() - cached.fetchedAt < 3 * 60 * 1000) {
          nativeFetch(input, init)
            .then((response) => response.json())
            .then((data) => { if (data?.ok) writePlazaFeedCache(data); })
            .catch(() => {});
          return Promise.resolve(new Response(
            JSON.stringify({ ok: true, real_users: cached.real_users || [], demo_users: cached.demo_users || [] }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ));
        }
      }

      if (url.includes("/api/user/onboarding-profile") && method === "GET") {
        const cacheKey = "darlink-onboarding-profile-cache";
        try {
          const raw = sessionStorage.getItem(cacheKey);
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed?.fetchedAt && Date.now() - parsed.fetchedAt < 90000 && parsed.body) {
            nativeFetch(input, init)
              .then((response) => response.json())
              .then((data) => {
                if (data?.ok) sessionStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), body: data }));
              })
              .catch(() => {});
            return Promise.resolve(new Response(
              JSON.stringify(parsed.body),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ));
          }
        } catch (_error) {
          /* fall through */
        }
        return nativeFetch(input, init).then(async (response) => {
          try {
            const data = await response.clone().json();
            if (data?.ok) {
              sessionStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), body: data }));
            }
          } catch (_error) {
            /* ignore */
          }
          return response;
        });
      }

      return nativeFetch(input, init);
    };
  }

  function prefetchHomeData() {
    try {
      const raw = localStorage.getItem("darlink-auth-session");
      if (!raw) return;
      const token = JSON.parse(raw)?.token;
      if (!token) return;
      const encoded = encodeURIComponent(token);
      window.fetch(`/api/user/onboarding-profile?user_token=${encoded}`);
      window.fetch("/api/plaza/feed");
    } catch (_error) {
      /* ignore */
    }
  }

  function installPlazaLeaderboardStorageGuard() {
    if (window.__darlinkPlazaClickStorageBlocked) return;
    window.__darlinkPlazaClickStorageBlocked = true;
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "darlink-plaza-clicks") return;
      return nativeSetItem.call(this, key, value);
    };
  }

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeRoutePage(page) {
    if (page === PAGE.digitalPlaza) return PAGE.home;
    return page;
  }

  function pageFromHash() {
    const raw = decodeURIComponent((window.location.hash || "").replace(/^#/, "")).trim();
    if (raw === "events_campus_resonance_hub" || raw === "events") return PAGE.home;
    if (raw === "hall_of_fame_legendary_pioneers_gallery" || raw === "hall") return PAGE.home;
    if (raw === "hall_fame_liquid_glass_challenge") return PAGE.celebrityChallenge;
    if (PAGES.has(raw)) return normalizeRoutePage(raw);
    if (PAGE[raw]) return normalizeRoutePage(PAGE[raw]);
    return PAGE.login;
  }

  function prettyPage(page) {
    const labels = PAGE_LABELS[lang()];
    if (labels && labels[page]) return labels[page];
    return page
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function pageUrl(page, bust = false) {
    const base = `pages/${page}/code.html?v=${PAGE_ASSET_VERSION}`;
    return bust ? `${base}&_=${Date.now()}` : base;
  }

  function hashMatchesPage(page) {
    const raw = decodeURIComponent((window.location.hash || "").replace(/^#/, "")).trim();
    return raw === page;
  }

  function pageFromFrameSrc() {
    const match = (frame.src || "").match(/\/pages\/([^/]+)\/code\.html/);
    return match && PAGES.has(match[1]) ? normalizeRoutePage(match[1]) : null;
  }

  function syncRouteFromHash() {
    const page = pageFromHash();
    if (!PAGES.has(page)) {
      navigate(PAGE.home, { replace: true, immediate: true, force: true, fromHistory: true });
      return;
    }
    navigate(page, { replace: true, immediate: true, force: true, fromHistory: true });
  }

  function shouldReplaceHash(page, options = {}) {
    if (options.pushHistory) return false;
    if (options.replace || options.fromBack || options.fromHistory) return true;
    if (SHELL_TABS.has(page)) return true;
    if (currentPage && SHELL_TABS.has(currentPage) && SHELL_TABS.has(page)) return true;
    if (ONBOARD_PAGES.has(page) || ONBOARD_PAGES.has(currentPage)) return false;
    return true;
  }

  function syncHash(page, replace) {
    const target = `#${encodeURIComponent(page)}`;
    if (window.location.hash === target) return;
    if (replace) {
      window.history.replaceState(null, "", target);
    } else {
      window.history.pushState(null, "", target);
    }
  }

  function updateProfileHotspot(page) {
    if (!profileHotspot) return;
    profileHotspot.setAttribute("aria-label", uiLabel("Open profile", "打开个人档案", "打開個人檔案"));
    const hideOnPages = new Set([PAGE.login, PAGE.onboard1, PAGE.onboard2, PAGE.onboard3]);
    profileHotspot.hidden = hideOnPages.has(page);
  }

  function updateTopNavHotspots(page) {
    if (!topNavHotspots) return;
    topNavHotspots.hidden = true;
  }

  function navigate(page, options = {}) {
    page = normalizeRoutePage(page);
    if (!PAGES.has(page)) return;
    const frameMatches = frame.src && frame.src.includes(`/pages/${page}/code.html`);
    if (!options.force && page === currentPage && frameMatches) {
      if (!hashMatchesPage(page)) syncHash(page, true);
      return;
    }

    const nextToken = ++routeToken;
    const oldPage = currentPage;
    if (oldPage && oldPage !== page) {
      previousPage = oldPage;
      if (!options.replace && !options.fromBack) {
        if (pageHistory[pageHistory.length - 1] !== oldPage) pageHistory.push(oldPage);
        if (pageHistory.length > 40) pageHistory = pageHistory.slice(-40);
      }
    }
    currentPage = page;
    window.__DARLINK_FLOW_CURRENT_PAGE = currentPage;
    updateProfileHotspot(page);
    updateTopNavHotspots(page);

    frame.classList.add("is-loading");
    frame.setAttribute("title", uiLabel("Darlink connected app flow", "Darlink 连贯应用流程", "Darlink 連貫應用流程"));
    syncHash(page, shouldReplaceHash(page, options));
    document.title = `Darlink - ${prettyPage(page)}`;
    if (status) {
      const label = prettyPage(page);
      status.textContent = lang() === "en" ? `Navigated to ${label}` : lang() === "zhHant" ? `已前往${label}` : `已前往${label}`;
    }

    const bustCache = Boolean(options.force || options.fromHistory || options.fromBack);
    window.setTimeout(() => {
      if (nextToken !== routeToken) return;
      frame.src = pageUrl(page, bustCache);
    }, options.immediate ? 0 : 120);
  }

  function isRealFramePageSrc(src) {
    return /\/pages\/[^/]+\/code\.html/.test(String(src || ""));
  }

  let homeEnhanceWatchToken = 0;

  function homeFrameLooksReady(doc) {
    return Boolean(doc?.querySelector?.(".darlink-home-shell:not(.darlink-home-booting)"));
  }

  function ensureHomeBootStyles(doc) {
    if (!doc?.head || doc.querySelector("style[data-darlink-home-boot]")) return;
    const style = doc.createElement("style");
    style.dataset.darlinkHomeBoot = "true";
    style.textContent = `
      .darlink-home-discovery-body{
        min-height:100vh;margin:0;
        background:linear-gradient(135deg,#f9fbff 0%,#f7f1ff 48%,#eef9ff 100%);
        font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#111c2d;
      }
      .darlink-home-shell.darlink-home-booting{
        min-height:100vh;display:grid;place-items:center;padding:32px;
      }
      .darlink-home-boot-card{
        width:min(420px,88vw);border-radius:28px;padding:28px 24px;text-align:center;
        background:rgba(255,255,255,.72);border:1px solid rgba(111,80,146,.12);
        box-shadow:0 24px 70px rgba(31,42,68,.1);
      }
      .darlink-home-boot-spinner{
        width:42px;height:42px;margin:0 auto 16px;border-radius:50%;
        border:3px solid rgba(111,80,146,.16);border-top-color:#6f5092;
        animation:darlinkHomeBootSpin .8s linear infinite;
      }
      @keyframes darlinkHomeBootSpin{to{transform:rotate(360deg)}}
      .darlink-home-boot-card p{margin:0;color:#604283;font-size:14px;font-weight:750;line-height:1.6}
      .darlink-home-plaza-scroll{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:auto;gap:16px;align-content:start}
      .darlink-home-twin-card{min-height:300px;display:flex;flex-direction:column;gap:10px;padding:18px;overflow:hidden;border:1px solid rgba(255,255,255,.78);border-radius:24px;background:rgba(255,255,255,.72)}
      .darlink-home-avatar{width:72px;height:72px;flex:0 0 72px;border-radius:22px;overflow:hidden}
      .darlink-card-copy{flex:0 1 auto;overflow:hidden}
      .darlink-home-tags{flex:1 1 auto;min-height:52px;display:flex;flex-wrap:wrap;gap:6px;overflow:hidden}
      .darlink-plaza-chat-btn{flex:0 0 42px;min-height:42px;margin-top:auto}
      @media(max-width:1180px){.darlink-home-plaza-scroll{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:700px){.darlink-home-plaza-scroll{grid-template-columns:1fr}}

    `;
    doc.head.appendChild(style);
  }

  function revealHomeFrame(doc) {
    if (!doc?.documentElement) return;
    doc.documentElement.classList.remove("darlink-static-shell");
    doc.documentElement.classList.add("darlink-home-enhanced");
    doc.getElementById("darlink-pre-enhance")?.remove();
    frame.classList.remove("is-loading");
  }

  function bootstrapHomeLoadingShell(doc) {
    if (!doc?.body) return;
    ensureHomeBootStyles(doc);
    doc.body.className = "darlink-home-discovery-body darlink-page-polished darlink-page-home-luminous-dashboard-refined-v4";
    doc.body.innerHTML = `
      <main class="darlink-home-shell darlink-home-booting" aria-busy="true">
        <div class="darlink-home-boot-card">
          <div class="darlink-home-boot-spinner" aria-hidden="true"></div>
          <p>${uiLabel("Loading your digital human plaza...", "正在加载数字人广场...", "正在載入數字人廣場...")}</p>
        </div>
      </main>
    `;
    revealHomeFrame(doc);
  }

  function runHomeEnhancement(doc) {
    const token = ++homeEnhanceWatchToken;
    bootstrapHomeLoadingShell(doc);

    let enhanceInFlight = false;
    const enhanceOnce = () => {
      if (token !== homeEnhanceWatchToken || !window.DarlinkEnhancer || enhanceInFlight) return;
      enhanceInFlight = true;
      try {
        window.DarlinkEnhancer.enhanceFrame(doc, PAGE.home, { navigate, page: PAGE });
      } catch (_error) {
        enhanceInFlight = false;
      }
    };

    enhanceOnce();

    let observer = null;
    const stopWatch = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    observer = new MutationObserver(() => {
      if (token !== homeEnhanceWatchToken) {
        stopWatch();
        return;
      }
      if (homeFrameLooksReady(doc)) {
        enhanceInFlight = false;
        revealHomeFrame(doc);
        injectProfileUiHotfix(doc);
        stopWatch();
      }
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true });

    window.setTimeout(() => {
      stopWatch();
      if (token !== homeEnhanceWatchToken || homeFrameLooksReady(doc)) return;
      enhanceInFlight = false;
      enhanceOnce();
    }, 5000);
  }

  function readAvatarDraftSrc() {
    try {
      const raw = localStorage.getItem("darlink-avatar-draft");
      if (!raw) return "";
      const draft = JSON.parse(raw);
      return draft && draft.src ? String(draft.src) : "";
    } catch (_error) {
      return "";
    }
  }

  function buildDefaultAvatarDataUri(initials) {
    const from = "#6f5092";
    const to = "#7ed4fd";
    const safe = String(initials || "DT").slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="160" rx="46" fill="url(#g)"/><circle cx="122" cy="36" r="28" fill="rgba(255,255,255,.24)"/><text x="80" y="94" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="42" font-weight="800" fill="white">${safe}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function readTwinDisplayName() {
    try {
      const raw = localStorage.getItem("darlink-profile-cards");
      if (!raw) return uiLabel("Digital Twin", "数字人", "數字人");
      const profile = JSON.parse(raw);
      const name = (profile?.twinName || profile?.nickname || "").trim();
      return name || uiLabel("Digital Twin", "数字人", "數字人");
    } catch (_error) {
      return uiLabel("Digital Twin", "数字人", "數字人");
    }
  }

  function switchAppLang(code) {
    if (!["en", "zhHans", "zhHant"].includes(code)) return;
    localStorage.setItem("darlink-lang", code);
    const page = currentPage || pageFromFrameSrc() || pageFromHash();
    if (page && PAGES.has(page) && frame) {
      frame.src = pageUrl(page, true);
      return;
    }
    window.location.reload();
  }
  window.__darlinkSwitchLang = switchAppLang;

  function userTopbarAvatarMarkup() {
    const label = uiLabel("Profile", "个人档案", "個人檔案");
    const alt = uiLabel("User profile avatar", "用户头像", "用戶頭像");
    const src = readAvatarDraftSrc();
    if (src) {
      return `<button type="button" class="darlink-standard-avatar has-image" aria-label="${label}"><img src="${src}" alt="${alt}"></button>`;
    }
    return `<button type="button" class="darlink-standard-avatar is-icon" aria-label="${label}"><svg class="darlink-material-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></button>`;
  }

  function langSwitchMarkup() {
    const current = lang();
    return `<div class="darlink-lang-switch" role="group" aria-label="${uiLabel("Language", "语言", "語言")}">
      <button type="button" class="darlink-lang-btn${current === "en" ? " is-active" : ""}" data-lang="en" data-darlink-local-control="true">EN</button>
      <button type="button" class="darlink-lang-btn${current === "zhHans" ? " is-active" : ""}" data-lang="zhHans" data-darlink-local-control="true">${uiLabel("简", "简", "簡")}</button>
      <button type="button" class="darlink-lang-btn${current === "zhHant" ? " is-active" : ""}" data-lang="zhHant" data-darlink-local-control="true">${uiLabel("繁", "繁", "繁")}</button>
    </div>`;
  }

  function renderStandardTopbarMarkup(activeKey = "discover") {
    const items = [
      ["discover", uiLabel("Discover", "发现", "發現")],
      ["matches", uiLabel("Matches", "匹配", "匹配")],
      ["community", uiLabel("Community", "社区", "社群")],
    ];
    return `<nav class="darlink-standard-topbar" data-darlink-standard-topbar="true">
      <div class="darlink-standard-topbar-inner">
        <a class="darlink-standard-brand" href="/landing-v14.html" target="_top" data-darlink-local-control="true">Darlink</a>
        <div class="darlink-standard-tabs" aria-label="${uiLabel("Primary navigation", "主导航", "主導覽")}">
          ${items.map(([key, label]) => `<a href="#" class="${activeKey && key === activeKey ? "is-active" : ""}">${label}</a>`).join("")}
        </div>
        <div class="darlink-standard-actions">
          ${langSwitchMarkup()}
          ${userTopbarAvatarMarkup()}
        </div>
      </div>
    </nav>`;
  }

  function bindSelfChatLangSwitch(doc, root) {
    if (!doc || !root || root.dataset.darlinkLangBound === "true") return;
    root.dataset.darlinkLangBound = "true";
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      switchAppLang(button.dataset.lang);
    });
  }

  function injectSelfChatTopbar(doc) {
    try {
      if (!doc?.body?.classList?.contains("darlink-page-chat-explore-potential-with-ai-twin")) return;
      if (doc.querySelector(".darlink-standard-topbar")) return;
      const main = doc.querySelector("main.darlink-avatar-refine-shell");
      if (!main) return;
      const wrap = doc.createElement("div");
      wrap.innerHTML = renderStandardTopbarMarkup("discover");
      const topbar = wrap.firstElementChild;
      if (!topbar) return;
      doc.body.insertBefore(topbar, main);
      bindSelfChatLangSwitch(doc, topbar);
      markKnownTargets(doc);
    } catch (_error) {
      /* keep chat usable even if topbar injection fails */
    }
  }

  const SIMILARITY_HALF_SATURATION = 48;

  function readTwinProfileSignalBonus() {
    try {
      const raw = localStorage.getItem("darlink-profile-cards");
      if (!raw) return 6;
      const profile = JSON.parse(raw);
      const cards = Array.isArray(profile?.cards) ? profile.cards.length : 0;
      const tags = Array.isArray(profile?.twinTags) ? profile.twinTags.length : 0;
      const hasName = Boolean((profile?.twinName || profile?.nickname || "").trim());
      return 8 + cards * 4 + tags * 2 + (hasName ? 6 : 0);
    } catch (_error) {
      return 6;
    }
  }

  function computeTwinSimilaritySignal(doc) {
    const userMessages = doc?.querySelectorAll(".darlink-avatar-messages .darlink-free-message.user").length || 0;
    return readTwinProfileSignalBonus() + userMessages * 5;
  }

  /** p = 100s/(s+τ): strictly increasing, p < 100 for every finite s > 0. */
  function twinSimilarityPercent(signal) {
    const s = Math.max(0, Number(signal) || 0);
    const percent = (100 * s) / (s + SIMILARITY_HALF_SATURATION);
    const rounded = Math.floor(percent * 10) / 10;
    return rounded >= 100 ? 99.9 : rounded;
  }

  function formatSimilarityPercent(value) {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }

  function updateSelfChatSimilarityMeter(doc) {
    const meter = doc?.querySelector(".darlink-twin-similarity");
    if (!meter) return;
    const percent = twinSimilarityPercent(computeTwinSimilaritySignal(doc));
    const valueEl = meter.querySelector(".darlink-twin-similarity-value");
    const fillEl = meter.querySelector(".darlink-twin-similarity-fill");
    if (valueEl) valueEl.textContent = `${formatSimilarityPercent(percent)}%`;
    if (fillEl) fillEl.style.width = `${percent}%`;
    meter.setAttribute("aria-valuenow", String(percent));
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "100");
  }

  function bindSelfChatSimilarityObserver(doc) {
    if (!doc || doc.__darlinkSimilarityObserved) return;
    const messages = doc.querySelector(".darlink-avatar-messages");
    if (!messages) return;
    doc.__darlinkSimilarityObserved = true;
    const observer = new MutationObserver(() => updateSelfChatSimilarityMeter(doc));
    observer.observe(messages, { childList: true, subtree: true });
    doc.__darlinkSimilarityObserver = observer;
  }

  function injectSelfChatSimilarityMeter(doc) {
    try {
      if (!doc?.body?.classList?.contains("darlink-page-chat-explore-potential-with-ai-twin")) return;
      const header = doc.querySelector(".darlink-avatar-chat header");
      if (!header) return;
      if (!header.querySelector(".darlink-twin-similarity")) {
        const meter = doc.createElement("div");
        meter.className = "darlink-twin-similarity";
        meter.setAttribute("role", "progressbar");
        meter.setAttribute(
          "aria-label",
          uiLabel("Digital twin similarity", "数字人相似度", "數字人相似度")
        );
        meter.innerHTML = `
          <div class="darlink-twin-similarity-meta">
            <span class="darlink-twin-similarity-label">${uiLabel("Similarity", "相似度", "相似度")}</span>
            <span class="darlink-twin-similarity-value">0%</span>
          </div>
          <div class="darlink-twin-similarity-track" aria-hidden="true">
            <div class="darlink-twin-similarity-fill"></div>
          </div>
        `;
        header.appendChild(meter);
      }
      updateSelfChatSimilarityMeter(doc);
      bindSelfChatSimilarityObserver(doc);
      window.setTimeout(() => updateSelfChatSimilarityMeter(doc), 800);
      window.setTimeout(() => updateSelfChatSimilarityMeter(doc), 1800);
    } catch (_error) {
      /* cosmetic only */
    }
  }

  function injectSelfChatUiHotfix(doc) {
    try {
      if (!doc?.body?.classList?.contains("darlink-page-chat-explore-potential-with-ai-twin")) return;
      doc.querySelector(".darlink-mood-control")?.remove();
      doc.querySelector(".darlink-avatar-refine-note")?.remove();
      const header = doc.querySelector(".darlink-avatar-chat header");
      if (!header || header.querySelector(".darlink-self-chat-avatar")) return;
      let inner = header.querySelector(".darlink-self-chat-head > div");
      if (!inner) {
        const kids = Array.from(header.children).filter((node) => node.tagName === "DIV" && !node.classList.contains("darlink-self-chat-head"));
        inner = kids[0] || null;
      }
      if (!inner) {
        inner = doc.createElement("div");
        const twinName = readTwinDisplayName();
        const safeName = twinName.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        const subtitle = uiLabel(
          "Chat with your own digital human — the more you talk, the more it becomes you.",
          "和你自己的数字人对话，越聊越像你。",
          "和你自己的數字人對話，越聊越像你。"
        );
        inner.innerHTML = `<strong>${safeName}</strong><p>${subtitle}</p>`;
        header.appendChild(inner);
      }
      if (inner.classList.contains("darlink-self-chat-head")) return;
      const twinName = inner.querySelector("strong")?.textContent?.trim() || readTwinDisplayName();
      const initials = twinName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "").slice(0, 2).toUpperCase() || "DT";
      const uploaded = readAvatarDraftSrc();
      const wrap = doc.createElement("div");
      wrap.className = "darlink-self-chat-head";
      const avatar = doc.createElement("span");
      avatar.className = `darlink-self-chat-avatar${uploaded ? " has-image" : " is-default"}`;
      const img = doc.createElement("img");
      img.src = uploaded || buildDefaultAvatarDataUri(initials);
      img.alt = twinName;
      avatar.appendChild(img);
      wrap.appendChild(avatar);
      header.insertBefore(wrap, inner);
      wrap.appendChild(inner);
    } catch (_error) {
      /* keep chat usable even if cosmetic hotfix fails */
    }
  }

  function decorateProfileSignalTags(doc) {
    if (!doc) return;
    doc.querySelectorAll(".darlink-profile-page-card > div:last-child").forEach((wrap) => {
      if (!wrap.querySelector("em")) return;
      wrap.classList.add("darlink-profile-signal-tags");
    });
  }


  function authTestModeEnabled() {
    try {
      return new URLSearchParams(window.parent.location.search).get("auth") !== "real";
    } catch (_error) {
      return false;
    }
  }

  function patchAuthFormHotfix(doc) {
    const form = doc.getElementById("darlinkAuthForm");
    if (!form || form.dataset.darlinkAuthHotfix === "true") return;
    form.dataset.darlinkAuthHotfix = "true";

    const mainStatus = form.querySelector(".darlink-auth-status");
    const setMainStatus = (message, tone = "info") => {
      if (!mainStatus) return;
      mainStatus.dataset.tone = tone;
      mainStatus.textContent = message || "";
    };

    if (!doc.querySelector("style[data-darlink-auth-hotfix]")) {
      const style = doc.createElement("style");
      style.dataset.darlinkAuthHotfix = "true";
      style.textContent = `
        .darlink-forgot-password-row{display:flex;justify-content:flex-end;margin-top:-4px}
        .darlink-forgot-password-link{border:0;background:transparent;color:#604283;font-size:13px;font-weight:750;cursor:pointer;text-decoration:underline;padding:0}
        .darlink-forgot-modal{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:20px;background:rgba(26,20,35,.42);backdrop-filter:blur(8px)}
        .darlink-forgot-dialog{width:min(100%,420px);border-radius:24px;padding:24px;background:rgba(255,255,255,.92);box-shadow:0 24px 60px rgba(38,20,64,.22);display:flex;flex-direction:column;gap:12px}
        .darlink-forgot-dialog h3{margin:0;font-size:22px;color:#2b193f}
        .darlink-forgot-dialog p{margin:0;font-size:13px;color:#5d5270;line-height:1.5}
        .darlink-forgot-close{align-self:flex-end;border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#6d607c}
        .darlink-secondary-btn[disabled]{opacity:.55;cursor:not-allowed}
      `;
      doc.head.appendChild(style);
    }

    const CODE_COOLDOWN_SEC = 60;
    const cooldownLabels = new WeakMap();

    function normalizeAuthEmail(value) {
      return String(value || "").trim().toLowerCase();
    }

    function cooldownMessage(seconds) {
      return uiLabel(
        `Resend in ${seconds}s`,
        `${seconds} 秒后可再次发送`,
        `${seconds} 秒後可再次發送`,
      );
    }

    function applyButtonCooldown(button, seconds, baseLabel) {
      if (!button) return;
      if (!cooldownLabels.has(button)) cooldownLabels.set(button, baseLabel || button.textContent.trim());
      const base = cooldownLabels.get(button);
      let remaining = seconds;
      button.disabled = true;
      button.textContent = cooldownMessage(remaining);
      const timer = window.setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          window.clearInterval(timer);
          button.disabled = false;
          button.textContent = base;
          return;
        }
        button.textContent = cooldownMessage(remaining);
      }, 1000);
    }

    async function requestCodeWithCooldown(button, endpoint, email, setStatus, codeInput) {
      if (!button || button.disabled) return;
      if (!email || !email.includes("@")) {
        setStatus(uiLabel("Enter a valid email.", "请输入有效邮箱。", "請輸入有效郵箱。"), "error");
        return;
      }
      if (authTestModeEnabled()) return;

      const baseLabel = button.textContent.trim();
      setStatus(uiLabel("Sending code...", "正在发送验证码...", "正在發送驗證碼..."));
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, lang: lang() }),
        }).then((r) => r.json());
        if (res.reason === "rate_limited") {
          const wait = Number(res.retry_after || CODE_COOLDOWN_SEC);
          applyButtonCooldown(button, wait, baseLabel);
          setStatus(res.error || cooldownMessage(wait), "error");
          return;
        }
        if (!res.ok) {
          setStatus(res.error || uiLabel("Failed to send code.", "验证码发送失败。", "驗證碼發送失敗。"), "error");
          return;
        }
        if (res.dev_code && codeInput) codeInput.value = res.dev_code;
        setStatus(
          res.dev_code
            ? uiLabel(`Dev code: ${res.dev_code}`, `开发模式验证码：${res.dev_code}`, `開發模式驗證碼：${res.dev_code}`)
            : uiLabel("Code sent. Check your email.", "验证码已发送，请查收邮箱。", "驗證碼已發送，請查收郵箱。"),
          "success",
        );
        applyButtonCooldown(button, CODE_COOLDOWN_SEC, baseLabel);
      } catch (_error) {
        setStatus(uiLabel("Network error.", "网络错误。", "網路錯誤。"), "error");
      }
    }

    form.addEventListener(
      "click",
      (event) => {
        const btn = event.target.closest("[data-action='request-code']");
        if (!btn || btn.closest(".darlink-forgot-modal")) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        requestCodeWithCooldown(
          btn,
          "/api/auth/request-code",
          normalizeAuthEmail(form.email?.value || ""),
          setMainStatus,
          form.code,
        );
      },
      true,
    );

    if (!form.querySelector("[data-action='forgot-password']")) {
      const row = doc.createElement("p");
      row.className = "darlink-forgot-password-row";
      row.innerHTML = `<button type="button" class="darlink-forgot-password-link" data-action="forgot-password" data-darlink-local-control="true">${uiLabel("Forgot password?", "忘记密码？", "忘記密碼？")}</button>`;
      const passwordInput = form.querySelector("input[name='password']");
      if (passwordInput) passwordInput.insertAdjacentElement("afterend", row);
      else form.appendChild(row);
    }

    function closeForgotModal() {
      doc.querySelector(".darlink-forgot-modal")?.remove();
    }

    function openForgotModal() {
      closeForgotModal();
      const email = normalizeAuthEmail(form.email?.value || "");
      const modal = doc.createElement("section");
      modal.className = "darlink-forgot-modal";
      modal.innerHTML = `
        <div class="darlink-forgot-dialog" role="dialog" aria-modal="true">
          <button type="button" class="darlink-forgot-close" data-action="close-forgot" data-darlink-local-control="true" aria-label="${uiLabel("Close", "关闭", "關閉")}">×</button>
          <h3>${uiLabel("Reset password", "重置密码", "重設密碼")}</h3>
          <p>${uiLabel("Use your school email to receive a code and set a new password.", "使用学校邮箱接收验证码并设置新密码。", "使用學校郵箱接收驗證碼並設定新密碼。")}</p>
          <label class="darlink-auth-label">${uiLabel("Email", "邮箱", "郵箱")}</label>
          <input class="input-glass darlink-auth-input" name="reset-email" type="email" required value="${email.replace(/"/g, "&quot;")}">
          <div class="darlink-auth-row">
            <div>
              <label class="darlink-auth-label">${uiLabel("Verification code", "验证码", "驗證碼")}</label>
              <input class="input-glass darlink-auth-input" name="reset-code" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
            </div>
            <button class="darlink-secondary-btn" type="button" data-action="request-reset-code" data-darlink-local-control="true">${uiLabel("Send code", "发送验证码", "發送驗證碼")}</button>
          </div>
          <label class="darlink-auth-label">${uiLabel("New password", "新密码", "新密碼")}</label>
          <input class="input-glass darlink-auth-input" name="reset-password" type="password" required>
          <label class="darlink-auth-label">${uiLabel("Confirm password", "确认密码", "確認密碼")}</label>
          <input class="input-glass darlink-auth-input" name="reset-password-confirm" type="password" required>
          <div class="darlink-auth-status darlink-forgot-status" role="status"></div>
          <button class="btn-gradient w-full rounded-full py-4 px-6 text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary-container/40" type="button" data-action="submit-reset" data-darlink-local-control="true">${uiLabel("Reset password", "重置密码", "重設密碼")}</button>
        </div>`;
      doc.body.appendChild(modal);

      const forgotStatus = modal.querySelector(".darlink-forgot-status");
      const setForgotStatus = (message, tone = "info") => {
        forgotStatus.dataset.tone = tone;
        forgotStatus.textContent = message || "";
      };

      modal.querySelector("[data-action='close-forgot']")?.addEventListener("click", closeForgotModal);
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeForgotModal();
      });
      modal.querySelector("[name='reset-code']")?.addEventListener("input", (event) => {
        event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
      });
      modal.querySelector("[data-action='request-reset-code']")?.addEventListener("click", () => {
        requestCodeWithCooldown(
          modal.querySelector("[data-action='request-reset-code']"),
          "/api/auth/forgot-password/request-code",
          normalizeAuthEmail(modal.querySelector("[name='reset-email']").value),
          setForgotStatus,
          modal.querySelector("[name='reset-code']"),
        );
      });
      modal.querySelector("[data-action='submit-reset']")?.addEventListener("click", async () => {
        const resetEmail = normalizeAuthEmail(modal.querySelector("[name='reset-email']").value);
        const code = String(modal.querySelector("[name='reset-code']").value || "").replace(/\D/g, "");
        const password = modal.querySelector("[name='reset-password']").value || "";
        const confirm = modal.querySelector("[name='reset-password-confirm']").value || "";
        if (!resetEmail || !resetEmail.includes("@")) {
          setForgotStatus(uiLabel("Enter a valid email.", "请输入有效邮箱。", "請輸入有效郵箱。"), "error");
          return;
        }
        if (!code) {
          setForgotStatus(uiLabel("Enter the verification code.", "请输入验证码。", "請輸入驗證碼。"), "error");
          return;
        }
        if (password.length < 6) {
          setForgotStatus(uiLabel("Password must be at least 6 characters.", "密码至少需要 6 位。", "密碼至少需要 6 位。"), "error");
          return;
        }
        if (password !== confirm) {
          setForgotStatus(uiLabel("Passwords do not match.", "两次密码不一致。", "兩次密碼不一致。"), "error");
          return;
        }
        setForgotStatus(uiLabel("Resetting password...", "正在重置密码...", "正在重設密碼..."));
        try {
          const res = await fetch("/api/auth/forgot-password/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: resetEmail, code, password, lang: lang() }),
          }).then((r) => r.json());
          if (!res.ok) {
            setForgotStatus(res.error || uiLabel("Password reset failed.", "密码重置失败。", "密碼重設失敗。"), "error");
            return;
          }
          closeForgotModal();
          if (form.email) form.email.value = resetEmail;
          if (form.password) form.password.value = "";
          setMainStatus(
            res.message || uiLabel("Password reset successful. Sign in with your new password.", "密码已重置，请使用新密码登录。", "密碼已重設，請使用新密碼登入。"),
            "success",
          );
        } catch (_error) {
          setForgotStatus(uiLabel("Network error.", "网络错误。", "網路錯誤。"), "error");
        }
      });
    }

    form.addEventListener(
      "click",
      (event) => {
        if (!event.target.closest("[data-action='forgot-password']")) return;
        event.preventDefault();
        openForgotModal();
      },
      true,
    );
  }


  function readAuthTokenFromDoc(doc) {
    try {
      const raw = doc.defaultView?.localStorage?.getItem("darlink-auth-session");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.token || "";
    } catch (_error) {
      return "";
    }
  }

  function isAvatarImageSrc(value) {
    const src = String(value || "").trim();
    return src.startsWith("data:image/")
      || src.startsWith("https://")
      || src.startsWith("http://")
      || src.startsWith("/files/")
      || src.startsWith("/static/");
  }

  function readStoredProfileAvatar(doc) {
    try {
      const ls = doc.defaultView?.localStorage;
      if (!ls) return "";
      const direct = ls.getItem("darlink-profile-cards");
      if (direct) {
        const profile = JSON.parse(direct);
        const avatar = String(profile?.avatar || "").trim();
        if (isAvatarImageSrc(avatar)) return avatar;
      }
      const pathsRaw = ls.getItem("darlink-path-profiles");
      if (pathsRaw) {
        const paths = JSON.parse(pathsRaw);
        for (const key of Object.keys(paths || {})) {
          const avatar = String(paths[key]?.avatar || "").trim();
          if (isAvatarImageSrc(avatar)) return avatar;
        }
      }
    } catch (_error) {
      /* ignore */
    }
    return "";
  }

  function ensureAvatarDraft(doc, src) {
    if (!src || readAvatarDraftSrc()) return;
    try {
      doc.defaultView?.localStorage?.setItem(
        "darlink-avatar-draft",
        JSON.stringify({ src, updatedAt: Date.now(), syncedFrom: "server" }),
      );
    } catch (_error) {
      /* ignore */
    }
  }

  function patchProfileAvatarHotfix(doc) {
    if (!doc?.body?.classList?.contains("darlink-page-profile-full-campus-identity-final")) return;
    if (doc.body.dataset.darlinkProfileAvatarHotfix === "true") return;
    doc.body.dataset.darlinkProfileAvatarHotfix = "true";

    let serverAvatarPromise = null;

    function fetchServerAvatar(doc) {
      if (!serverAvatarPromise) {
        const token = readAuthTokenFromDoc(doc);
        if (!token) {
          serverAvatarPromise = Promise.resolve("");
        } else {
          serverAvatarPromise = fetch(
            `/api/user/onboarding-profile?user_token=${encodeURIComponent(token)}`,
          )
            .then((response) => response.json())
            .then((res) => {
              const avatar = String(res?.avatar || res?.onboarding?.avatar || "").trim();
              return isAvatarImageSrc(avatar) ? avatar : "";
            })
            .catch(() => "");
        }
      }
      return serverAvatarPromise;
    }

    async function syncProfileHeroAvatar() {
      const avatarImg = doc.querySelector(
        "main section .avatar-glow img, main section .w-48 img, main section .w-56 img",
      );
      if (!avatarImg) return;

      let src = readAvatarDraftSrc() || readStoredProfileAvatar(doc);
      if (!src) src = await fetchServerAvatar(doc);
      if (!isAvatarImageSrc(src)) return;

      if (avatarImg.src !== src) {
        avatarImg.src = src;
        avatarImg.classList.add("darlink-profile-avatar-synced");
      }
      ensureAvatarDraft(doc, src);
    }

    syncProfileHeroAvatar();
    [400, 900, 1800].forEach((delay) => {
      window.setTimeout(() => {
        syncProfileHeroAvatar();
      }, delay);
    });
  }

  function patchFriendDmHotfix(doc) {
    const isCommunity = doc?.body?.classList?.contains("darlink-page-community-campus-pulse-feed");
    const isProfile = doc?.body?.classList?.contains("darlink-page-profile-full-campus-identity-final");
    if (!isCommunity && !isProfile) return;
    if (doc.body.dataset.darlinkFriendDmHotfix === "true") return;
    doc.body.dataset.darlinkFriendDmHotfix = "true";

    if (!doc.querySelector("style[data-darlink-friend-dm-hotfix]")) {
      const style = doc.createElement("style");
      style.dataset.darlinkFriendDmHotfix = "true";
      style.textContent = `
        .darlink-friend-dm-modal{position:fixed;inset:0;z-index:13000;display:grid;place-items:center;padding:16px;background:rgba(17,22,35,.45);backdrop-filter:blur(10px)}
        .darlink-friend-dm-dialog{width:min(100%,520px);max-height:min(82vh,720px);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 28px 80px rgba(31,42,68,.22);display:flex;flex-direction:column;overflow:hidden}
        .darlink-friend-dm-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(111,80,146,.12)}
        .darlink-friend-dm-head h3{margin:0;flex:1;font-size:18px;color:#111c2d}
        .darlink-friend-dm-close{border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#6d607c}
        .darlink-friend-dm-messages{flex:1;overflow:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,rgba(249,249,255,.9),rgba(255,255,255,.72))}
        .darlink-friend-dm-bubble{max-width:82%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.55;word-break:break-word}
        .darlink-friend-dm-bubble.is-me{align-self:flex-end;background:linear-gradient(135deg,#6f5092,#006686);color:#fff;border-bottom-right-radius:6px}
        .darlink-friend-dm-bubble.is-them{align-self:flex-start;background:rgba(255,255,255,.88);color:#111c2d;border:1px solid rgba(111,80,146,.12);border-bottom-left-radius:6px}
        .darlink-friend-dm-compose{display:flex;gap:10px;padding:14px 16px;border-top:1px solid rgba(111,80,146,.12)}
        .darlink-friend-dm-compose input{flex:1;border-radius:999px;border:1px solid rgba(111,80,146,.18);padding:12px 16px;font-size:14px;background:rgba(255,255,255,.88)}
        .darlink-friend-dm-compose button{border:0;border-radius:999px;padding:10px 16px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#6f5092,#006686);color:#fff}
        .darlink-friend-dm-empty{margin:auto;color:#6d607c;font-size:13px;text-align:center;padding:24px 12px}
        .darlink-profile-friend-list .darlink-friend-actions{margin-left:auto}
      `;
      doc.head.appendChild(style);
    }

    let dmPollTimer = null;
    let activeDm = null;

    function closeFriendDmModal() {
      if (dmPollTimer) {
        window.clearInterval(dmPollTimer);
        dmPollTimer = null;
      }
      activeDm = null;
      doc.querySelector(".darlink-friend-dm-modal")?.remove();
    }

    function renderDmMessages(container, messages, myUserId) {
      if (!messages.length) {
        container.innerHTML = `<div class="darlink-friend-dm-empty">${uiLabel("Say hello to your friend.", "跟好友打个招呼吧。", "跟好友打個招呼吧。")}</div>`;
        return;
      }
      container.innerHTML = messages.map((msg) => {
        const mine = Number(msg.sender_id) === Number(myUserId);
        return `<div class="darlink-friend-dm-bubble ${mine ? "is-me" : "is-them"}">${escapeHtmlLite(msg.text || "")}</div>`;
      }).join("");
      container.scrollTop = container.scrollHeight;
    }

    async function pollDmMessages() {
      if (!activeDm) return;
      const token = readAuthTokenFromDoc(doc);
      if (!token) return;
      try {
        const res = await fetch(
          `/api/friends/dm/${encodeURIComponent(activeDm.conversationId)}/messages?user_token=${encodeURIComponent(token)}&after_id=${encodeURIComponent(activeDm.lastId || 0)}`,
        ).then((r) => r.json());
        if (!res.ok || !Array.isArray(res.messages) || !res.messages.length) return;
        activeDm.messages.push(...res.messages);
        activeDm.lastId = res.messages[res.messages.length - 1].id;
        const box = doc.querySelector(".darlink-friend-dm-messages");
        if (box) renderDmMessages(box, activeDm.messages, activeDm.myUserId);
      } catch (_error) {
        /* ignore poll errors */
      }
    }

    async function openFriendDmModal(targetProfileId) {
      const token = readAuthTokenFromDoc(doc);
      if (!token) {
        window.alert(uiLabel("Please log in first.", "请先登录。", "請先登入。"));
        return;
      }
      closeFriendDmModal();
      const res = await fetch("/api/friends/dm/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: token, target_profile_id: targetProfileId }),
      }).then((r) => r.json());
      if (!res.ok) {
        window.alert(res.reason === "not_friends"
          ? uiLabel("You can only message accepted friends.", "只能给已接受的好友发消息。", "只能給已接受的好友發訊息。")
          : uiLabel("Could not open chat.", "无法打开聊天。", "無法開啟聊天。"));
        return;
      }
      const otherName = res.other_user?.twinName || res.other_user?.nickname || uiLabel("Friend", "好友", "好友");
      const modal = doc.createElement("section");
      modal.className = "darlink-friend-dm-modal";
      modal.innerHTML = `
        <div class="darlink-friend-dm-dialog" role="dialog" aria-modal="true">
          <div class="darlink-friend-dm-head">
            <h3>${escapeHtmlLite(otherName)}</h3>
            <button type="button" class="darlink-friend-dm-close" data-action="close-friend-dm" data-darlink-local-control="true" aria-label="${uiLabel("Close", "关闭", "關閉")}">×</button>
          </div>
          <div class="darlink-friend-dm-messages"></div>
          <form class="darlink-friend-dm-compose">
            <input type="text" name="text" maxlength="2000" placeholder="${uiLabel("Type a message...", "输入消息...", "輸入訊息...")}" autocomplete="off">
            <button type="submit">${uiLabel("Send", "发送", "發送")}</button>
          </form>
        </div>`;
      doc.body.appendChild(modal);
      const messages = Array.isArray(res.messages) ? res.messages.slice() : [];
      const lastId = messages.length ? messages[messages.length - 1].id : 0;
      activeDm = {
        conversationId: res.conversation_id,
        targetProfileId,
        messages,
        lastId,
        myUserId: res.my_user_id || null,
      };
      const box = modal.querySelector(".darlink-friend-dm-messages");
      renderDmMessages(box, messages, activeDm.myUserId);
      modal.querySelector("[data-action='close-friend-dm']")?.addEventListener("click", closeFriendDmModal);
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeFriendDmModal();
      });
      modal.querySelector("form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const input = modal.querySelector("input[name='text']");
        const text = (input?.value || "").trim();
        if (!text || !activeDm) return;
        const sendRes = await fetch(`/api/friends/dm/${encodeURIComponent(activeDm.conversationId)}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: token, text }),
        }).then((r) => r.json());
        if (!sendRes.ok || !sendRes.message) return;
        input.value = "";
        activeDm.messages.push(sendRes.message);
        activeDm.lastId = sendRes.message.id;
        renderDmMessages(box, activeDm.messages, activeDm.myUserId);
      });
      dmPollTimer = window.setInterval(pollDmMessages, 3000);
    }

    function decorateFriendCards(friends, friendsList) {
      if (!friendsList) return;
      const cards = [...friendsList.querySelectorAll(".darlink-friend-card")];
      friends.forEach((friend, index) => {
        const card = cards[index];
        if (!card) return;
        card.dataset.friendUserId = String(friend.user_id || "");
        card.dataset.friendProfileId = friend.profile_id || `user-${friend.user_id}`;
        let actions = card.querySelector(".darlink-friend-actions");
        if (!actions) {
          actions = doc.createElement("div");
          actions.className = "darlink-friend-actions";
          card.appendChild(actions);
        }
        if (!actions.querySelector('[data-action="friend-dm"]')) {
          const btn = doc.createElement("button");
          btn.type = "button";
          btn.className = "accept";
          btn.dataset.action = "friend-dm";
          btn.dataset.darlinkLocalControl = "true";
          btn.textContent = uiLabel("Message", "发消息", "發消息");
          actions.appendChild(btn);
        }
      });
    }

    async function syncFriendDmButtons() {
      const token = readAuthTokenFromDoc(doc);
      if (!token) return;
      try {
        const res = await fetch(`/api/friends/list?user_token=${encodeURIComponent(token)}`).then((r) => r.json());
        if (!res.ok || !Array.isArray(res.friends)) return;
        const communityList = doc.querySelector('.darlink-friend-hub [data-list="friends"]');
        const profileList = doc.querySelector('[data-list="profile-friends"]');
        if (communityList) decorateFriendCards(res.friends, communityList);
        if (profileList) decorateFriendCards(res.friends.slice(0, 6), profileList);
      } catch (_error) {
        /* ignore */
      }
    }

    doc.body.addEventListener(
      "click",
      (event) => {
        const btn = event.target.closest('[data-action="friend-dm"]');
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        const card = btn.closest(".darlink-friend-card");
        const profileId = card?.dataset.friendProfileId;
        if (!profileId) return;
        openFriendDmModal(profileId);
      },
      true,
    );

    syncFriendDmButtons();
    const observer = new MutationObserver(() => syncFriendDmButtons());
    const hub = doc.querySelector(".darlink-friend-hub");
    const profileFriends = doc.querySelector(".darlink-profile-friends-card");
    if (hub) observer.observe(hub, { childList: true, subtree: true });
    if (profileFriends) observer.observe(profileFriends, { childList: true, subtree: true });
    window.setInterval(syncFriendDmButtons, 8000);
  }

  function patchHomeMyTwinRefineButton(doc) {
    if (!doc?.body?.classList?.contains("darlink-page-home-luminous-dashboard-refined-v4")) return;
    const btn = doc.querySelector(".darlink-my-twin .darlink-refine-btn");
    if (!btn) return;
    if (btn.dataset.darlinkFlowTarget === PAGE.exploreChat) return;
    btn.dataset.darlinkFlowTarget = PAGE.exploreChat;
  }

  function injectProfileUiHotfix(doc) {
    if (!doc || !doc.head) return;
    try {
      if (!doc.querySelector("style[data-darlink-profile-ui-hotfix]")) {
        const style = doc.createElement("style");
        style.dataset.darlinkProfileUiHotfix = "true";
        style.textContent = `
        body.darlink-page-profile-full-campus-identity-final .darlink-module-back,
        body.darlink-page-chat-explore-potential-with-ai-twin .darlink-module-back{
          left:clamp(12px,2vw,24px)!important;
        }
        body.darlink-page-chat-explore-potential-with-ai-twin .darlink-module-back{
          top:92px!important;
        }
        body.darlink-page-digital-human-plaza-resonance .darlink-module-back{
          left:clamp(10px,1.6vw,22px)!important;
        }
        @media(max-width:767px){
          body.darlink-page-profile-full-campus-identity-final .darlink-module-back,
          body.darlink-page-digital-human-plaza-resonance .darlink-module-back{
            left:12px!important;
          }
          body.darlink-page-chat-explore-potential-with-ai-twin .darlink-module-back{
            top:128px!important;
          }
        }
        .darlink-profile-signal-tags{
          display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;
        }
        .darlink-profile-signal-tags em{
          display:inline-flex;align-items:center;font-style:normal;border-radius:999px;
          background:#efdbff;color:#604283;padding:6px 10px;font-size:12px;font-weight:850;
          line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }
        body.darlink-page-chat-explore-potential-with-ai-twin .darlink-avatar-chat header{
          justify-content:space-between!important;
          align-items:center!important;
          gap:16px;
        }
        .darlink-self-chat-head{
          display:flex;align-items:center;gap:14px;min-width:0;flex:1;
        }
        .darlink-twin-similarity{
          flex:0 0 auto;width:min(168px,32vw);display:flex;flex-direction:column;gap:8px;
        }
        .darlink-twin-similarity-meta{
          display:flex;align-items:baseline;justify-content:space-between;gap:8px;
        }
        .darlink-twin-similarity-label{
          font-size:12px;font-weight:850;color:#8a486f;letter-spacing:.04em;white-space:nowrap;
        }
        .darlink-twin-similarity-value{
          font-size:18px;font-weight:950;color:#604283;line-height:1;font-variant-numeric:tabular-nums;
        }
        .darlink-twin-similarity-track{
          height:8px;border-radius:999px;background:rgba(111,80,146,.12);overflow:hidden;
          box-shadow:inset 0 1px 2px rgba(31,42,68,.06);
        }
        .darlink-twin-similarity-fill{
          height:100%;width:0%;border-radius:inherit;
          background:linear-gradient(90deg,#6f5092,#7ed4fd,#006686);
          transition:width .45s ease;
        }
        @media(max-width:640px){
          .darlink-twin-similarity{width:120px}
          .darlink-twin-similarity-value{font-size:16px}
        }
        .darlink-self-chat-head>div{min-width:0}
        .darlink-self-chat-avatar{
          width:52px;height:52px;border-radius:18px;overflow:hidden;flex:0 0 auto;
          background:linear-gradient(135deg,#6f5092,#7ed4fd);
          box-shadow:0 12px 28px rgba(111,80,146,.18);display:grid;place-items:center;
        }
        .darlink-self-chat-avatar img{width:100%;height:100%;object-fit:cover;display:block}
        body.darlink-page-chat-explore-potential-with-ai-twin .darlink-avatar-refine-shell{
          height:calc(100vh - 80px);
          padding-top:0;
        }
        body.darlink-page-chat-explore-potential-with-ai-twin .darlink-avatar-refine-shell--chat-only .darlink-avatar-chat{
          min-height:calc(100vh - 80px - 28px);
        }
        @media(max-width:820px){
          body.darlink-page-chat-explore-potential-with-ai-twin .darlink-avatar-refine-shell{
            height:calc(100vh - 76px);
          }
          body.darlink-page-chat-explore-potential-with-ai-twin .darlink-avatar-refine-shell--chat-only .darlink-avatar-chat{
            min-height:calc(100vh - 76px - 18px);
          }
        }
      `;
        doc.head.appendChild(style);
      }
      decorateProfileSignalTags(doc);
      injectSelfChatTopbar(doc);
      injectSelfChatUiHotfix(doc);
      injectSelfChatSimilarityMeter(doc);
      patchPlazaLeaderboardHotfix(doc);
      patchAuthFormHotfix(doc);
      patchProfileAvatarHotfix(doc);
      patchFriendDmHotfix(doc);
      patchHomeMyTwinRefineButton(doc);
      if (doc.body?.classList?.contains("darlink-page-profile-full-campus-identity-final")) {
        window.setTimeout(() => decorateProfileSignalTags(doc), 700);
      }
    } catch (_error) {
      /* never block frame render */
    }
  }

  function reEnhanceFrame(page) {
    const doc = frame.contentDocument;
    if (!doc || !window.DarlinkEnhancer) return;
    const enhancePage = page || pageFromFrameSrc() || currentPage || pageFromHash();
    try {
      window.DarlinkEnhancer.enhanceFrame(doc, enhancePage, {
        navigate,
        page: PAGE,
      });
      injectProfileUiHotfix(doc);
    } catch (_error) {
      /* keep navigation usable */
    }
  }

  function collectText(element) {
    const parts = [];
    let node = element;

    for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
      if (node.getAttribute) {
        const aria = node.getAttribute("aria-label");
        const title = node.getAttribute("title");
        const alt = node.getAttribute("alt") || node.getAttribute("data-alt");
        if (aria) parts.push(aria);
        if (title) parts.push(title);
        if (alt) parts.push(alt);
      }
      const text = node.innerText || node.textContent || "";
      if (text) parts.push(text);
    }

    return normalize(parts.join(" "));
  }

  function directText(element) {
    const aria = element.getAttribute && element.getAttribute("aria-label");
    const title = element.getAttribute && element.getAttribute("title");
    const text = element.innerText || element.textContent || "";
    return normalize([aria, title, text].filter(Boolean).join(" "));
  }

  function hasAny(label, phrases) {
    return phrases.some((phrase) => label.includes(phrase));
  }

  function isBack(label) {
    return hasAny(label, ["arrow_back", " back", "back ", "返回"]);
  }

  function isNavContext(element) {
    if (!element || !element.closest) return false;
    return ["A", "LI"].includes(element.tagName) || (element.tagName === "BUTTON" && Boolean(element.closest("nav, header, aside")));
  }

  function navControlLabel(element) {
    if (!element || !element.closest) return "";
    const control = element.closest("a,button,li,[role='button']") || element;
    return directText(control);
  }

  function exactNavRoute(label) {
    if (!label) return null;
    const cleaned = normalize(label.replace(/\s+/g, " "));
    const aliases = {
      [PAGE.home]: ["discover", "home", "首页", "首頁", "发现", "發現"],
      [PAGE.matching]: ["matches", "match", "匹配"],
      [PAGE.community]: ["community", "社区", "社群", "校园社区", "校園社群"],
      [PAGE.profile]: ["profile", "my profile", "个人档案", "我的档案", "個人檔案", "我的檔案"],
    };
    return Object.entries(aliases).find(([, values]) => values.includes(cleaned))?.[0] || null;
  }

  function routeByNavigation(element, label) {
    if (!isNavContext(element)) return null;
    const shortLabel = navControlLabel(element);
    const exactRoute = exactNavRoute(shortLabel);
    if (exactRoute) return exactRoute;

    if (hasAny(shortLabel, ["community", "社区", "社群"])) return PAGE.community;
    if (hasAny(shortLabel, ["matches", "match", "匹配"])) return PAGE.matching;
    if (hasAny(shortLabel, ["discover", "home", "首页", "首頁", "发现", "發現"])) return PAGE.home;
    if (hasAny(shortLabel, ["profile", "my profile", "个人档案", "我的档案", "個人檔案", "我的檔案"])) return PAGE.profile;

    return null;
  }

  function targetForLabel(page, label) {
    if (page === PAGE.home) {
      if (
        hasAny(label, [
          "strengthen my digital human",
          "加强完善我的数字人",
          "加強完善我的數字人",
          "完善我的数字人",
          "完善我的數字人",
        ])
      ) {
        return PAGE.exploreChat;
      }
      if (hasAny(label, ["explore potential", "探索潜力", "探索潛力"])) return PAGE.exploreChat;
    }

    if ([PAGE.exploreChat, PAGE.study, PAGE.culinary, PAGE.romance].includes(page) && hasAny(label, ["ask xiaoda anything", "问小搭", "問小搭", "小搭聊天"])) {
      return PAGE.xiaodaChat;
    }

    if (page === PAGE.matching && hasAny(label, ["maya k.", "resonance level", "initiate connect"])) {
      return PAGE.matchChat;
    }

    return null;
  }

  function markKnownTargets(doc) {
    const page = currentPage || pageFromHash();
    const candidates = doc.querySelectorAll("a, button, li, .cursor-pointer, [class*='cursor-pointer'], img");
    candidates.forEach((element) => {
      if (element.closest && element.closest("[data-darlink-local-control]")) return;
      if (element.dataset && element.dataset.darlinkLocalControl) return;
      const localLabel = directText(element);
      const label = localLabel || collectText(element);
      const avatarRoute = isProfileAvatarCandidate(element, label) ? PAGE.profile : null;
      const navRoute = routeByNavigation(element, label);
      const pageRoute = targetForLabel(page, localLabel) || targetForLabel(page, label);
      const route = avatarRoute || pageRoute || navRoute;
      if (route) element.dataset.darlinkFlowTarget = route;
      if (avatarRoute) {
        const avatarShell = element.closest("button, a, div");
        if (avatarShell) avatarShell.dataset.darlinkFlowTarget = avatarRoute;
      }
    });
  }

  function isTopRightAvatar(element, event) {
    const doc = element.ownerDocument;
    const win = doc.defaultView;
    if (!win) return false;

    const rect = element.getBoundingClientRect();
    const x = event.clientX || rect.left;
    const y = event.clientY || rect.top;
    const nearTopRight = (x > win.innerWidth - 190 && y < 190) || (rect.right > win.innerWidth - 120 && rect.top < 190);
    if (!nearTopRight) return false;

    const label = collectText(element);
    if (hasAny(label, ["search", "refresh", "notifications", "more_horiz", "more_vert", "videocam", "搜索", "搜尋", "刷新"])) return false;

    const container = element.closest && element.closest("button, a, div");
    const hasImage = element.matches("img") || Boolean(container && container.querySelector("img"));
    const avatarClass = normalize((container && container.className) || element.className || "");
    return hasImage || avatarClass.includes("avatar") || (avatarClass.includes("rounded-full") && hasAny(label, ["profile", "avatar", "个人", "個人"]));
  }

  function isProfileAvatarCandidate(element, label) {
    if (!element.matches || !element.matches("img")) return false;
    if (!element.closest("nav, header")) return false;
    return hasAny(label, ["user profile", "your avatar", "profile avatar", "small circular avatar"]);
  }

  function isMatchingNode(element, label) {
    if (element.closest && element.closest("[data-darlink-local-control]")) return false;
    if (element.closest && element.closest("[data-darlink-match-id]")) return true;
    const initials = new Set(["ej", "al", "sj", "mk", "rd", "lx", "zh", "pt", "yi"]);
    if (initials.has(directText(element))) return true;
    if (hasAny(label, ["maya k.", "resonance level", "initiate connect", "chat_bubble"])) return true;
    return false;
  }

  function matchContextFromElement(element, label) {
    const explicit = element.closest && element.closest("[data-darlink-match-id]");
    if (explicit && explicit.dataset.darlinkMatchId) return explicit.dataset.darlinkMatchId;
    const direct = directText(element);
    const combined = `${direct} ${label}`;
    const pairs = [
      ["ej", "elena"],
      ["al", "aria"],
      ["sj", "sarah"],
      ["mk", "maya"],
      ["maya k.", "maya"],
      ["rd", "rui"],
      ["lx", "lina"],
      ["zh", "zoe"],
      ["pt", "priya"],
      ["yi", "yuki"],
      ["initiate connect", "maya"],
      ["chat_bubble", "maya"],
    ];
    const found = pairs.find(([needle]) => combined.includes(needle));
    return found ? found[1] : "maya";
  }

  function hasMaterialIcon(element, iconName) {
    const candidates = [element, ...(element.querySelectorAll ? Array.from(element.querySelectorAll("[data-icon], .material-symbols-outlined")) : [])];
    return candidates.some((node) => normalize(node.dataset?.icon || node.textContent).includes(iconName));
  }

  function isSearchControl(element, label) {
    return hasMaterialIcon(element, "search") || hasAny(label, ["search", "搜索", "搜尋"]);
  }

  function isRefreshControl(element, label) {
    return hasMaterialIcon(element, "refresh") || hasAny(label, ["refresh", "刷新"]);
  }

  function dataChatContextFromElement(element) {
    const explicit = element.closest && element.closest("[data-darlink-chat-id]");
    if (!explicit || !explicit.dataset.darlinkChatId) return null;
    return {
      id: explicit.dataset.darlinkChatId,
      type: explicit.dataset.darlinkChatType || "module",
    };
  }

  function moduleContextFromElement(page, element, label) {
    const explicit = dataChatContextFromElement(element);
    if (explicit) return explicit;
    const combined = `${directText(element)} ${label}`;
    const pairs = [
      ["astra chen", "study-astra"],
      ["elara vance", "study-elara"],
      ["julian reed", "study-julian"],
      ["leo", "culinary-leo"],
      ["sarah", "culinary-sarah"],
      ["marcus", "culinary-marcus"],
      ["elena", "culinary-elena"],
      ["elias vance", "romance-elias"],
      ["lyra chen", "romance-lyra"],
      ["julian thorne", "romance-julian"],
      ["aria liu twin", "plaza-aria"],
      ["maya k. twin", "plaza-maya"],
      ["sarah j. twin", "plaza-sarah"],
    ];
    const found = pairs.find(([needle]) => combined.includes(needle));
    if (found) return { type: "module", id: found[1] };
    if (page === PAGE.study) return { type: "module", id: "study-astra" };
    if (page === PAGE.culinary) return { type: "module", id: "culinary-leo" };
    if (page === PAGE.romance) return { type: "module", id: "romance-elias" };
    if (page === PAGE.digitalPlaza) return { type: "module", id: "plaza-aria" };
    return null;
  }

  function celebrityContextFromElement(element, label) {
    const explicit = element.closest && element.closest("[data-darlink-celebrity-id]");
    if (explicit && explicit.dataset.darlinkCelebrityId) return explicit.dataset.darlinkCelebrityId;
    const combined = `${directText(element)} ${label}`;
    const pairs = [
      ["jackie chan", "jackie-chan"],
      ["big brother action", "jackie-chan"],
      ["elon musk", "elon-musk"],
      ["mars meme ceo", "elon-musk"],
      ["shing-tung yau", "shing-tung-yau"],
      ["math emperor", "shing-tung-yau"],
      ["人物盲盒 #1", "jackie-chan"],
      ["人物盲盒 #2", "shing-tung-yau"],
      ["人物盲盒 #3", "elon-musk"],
      ["mystery icon #1", "jackie-chan"],
      ["mystery icon #2", "shing-tung-yau"],
      ["mystery icon #3", "elon-musk"],
      ["丘*桐", "shing-tung-yau"],
      ["成*", "jackie-chan"],
      ["马*克", "elon-musk"],
      ["馬*克", "elon-musk"],
      ["j* · action", "jackie-chan"],
      ["m* k · mars", "elon-musk"],
      ["y* yau · geometry", "shing-tung-yau"],
    ];
    const found = pairs.find(([needle]) => combined.includes(needle));
    return found ? found[1] : "";
  }

  function plazaMetaFromElement(element) {
    const card = element?.closest?.(".darlink-home-twin-card, .darlink-ranking-row");
    if (!card) return { name: "", meta: "" };
    const name = card.querySelector("h3")?.textContent?.trim()
      || card.querySelector("span")?.childNodes?.[0]?.textContent?.trim()
      || "";
    const rawMeta = card.querySelector(".darlink-home-role")?.textContent?.trim()
      || card.querySelector("span em")?.textContent?.trim()
      || card.querySelector("em")?.textContent?.trim()
      || "";
    return { name, meta: sanitizePlazaLeaderboardMeta(rawMeta) };
  }

  function isPlazaChatEntryClick(element) {
    if (!element?.closest) return false;
    if (element.closest('[data-action="chat-plaza-twin"]')) return true;
    const chatBtn = element.closest(".darlink-plaza-chat-btn");
    if (chatBtn) {
      const celebrityId = chatBtn.dataset.darlinkCelebrityId;
      if (celebrityId) {
        const unlocked = readJson("darlink-celebrity-unlocked", {});
        return Boolean(unlocked[celebrityId]);
      }
      return Boolean(chatBtn.dataset.darlinkChatId);
    }
    const row = element.closest(".darlink-ranking-row");
    if (row) {
      const celebrityId = row.dataset.darlinkCelebrityId;
      if (celebrityId) {
        const unlocked = readJson("darlink-celebrity-unlocked", {});
        return Boolean(unlocked[celebrityId]);
      }
      return Boolean(row.dataset.darlinkChatId);
    }
    return false;
  }

  async function fetchGlobalPlazaLeaderboard(limit = 3) {
    const res = await fetch(`/api/plaza/leaderboard?limit=${encodeURIComponent(limit)}`);
    return res.json();
  }

  async function recordGlobalPlazaClick(payload) {
    if (!payload?.id || !payload?.type) return;
    try {
      await fetch("/api/plaza/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const doc = frame.contentDocument;
      if (doc) refreshPlazaLeaderboardInDoc(doc);
    } catch (_error) {
      /* cosmetic counter */
    }
  }

  function maybeRecordPlazaChatEntry(element, context) {
    if (!context?.id || !context?.type) return;
    if (!["user_twin", "celebrity", "module"].includes(context.type)) return;
    if (!isPlazaChatEntryClick(element)) return;
    const meta = plazaMetaFromElement(element);
    recordGlobalPlazaClick({
      id: context.id,
      type: context.type,
      name: meta.name || "",
      meta: meta.meta || "",
    });
  }


  function plazaRankLabelSet() {
    return new Set([
      uiLabel("Champion", "冠军", "冠軍"),
      uiLabel("Runner-up", "亚军", "亞軍"),
      uiLabel("Third place", "季军", "季軍"),
      "Champion", "Runner-up", "Third place",
      "冠军", "亚军", "季军", "冠軍", "亞軍", "季軍",
      "1", "2", "3",
    ]);
  }

  function sanitizePlazaLeaderboardMeta(meta) {
    const raw = String(meta || "").trim();
    if (!raw) return "";
    const parts = raw.split(/\s*[·•]\s*/).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1 && plazaRankLabelSet().has(parts[0])) {
      return parts.slice(1).join(" · ").trim();
    }
    return raw;
  }

  function renderGlobalPlazaLeaderboardMarkup(items) {
    if (!items.length) {
      return `<div class="darlink-ranking-empty">${uiLabel(
        "Start chatting with digital humans in the plaza to fill the board.",
        "在广场里和数字人开始聊天后，才会计入人气榜。",
        "在廣場裡和數字人開始聊天後，才會計入人氣榜。"
      )}</div>`;
    }
    const rankLabels = [
      uiLabel("Champion", "冠军", "冠軍"),
      uiLabel("Runner-up", "亚军", "亞軍"),
      uiLabel("Third place", "季军", "季軍"),
    ];
    return items.map((item, index) => {
      const attrs = item.type === "celebrity"
        ? `data-darlink-celebrity-id="${escapeHtmlLite(item.id)}"`
        : `data-darlink-chat-id="${escapeHtmlLite(item.id)}" data-darlink-chat-type="${escapeHtmlLite(item.type || "user_twin")}"`;
      const rankLabel = rankLabels[index] || String(index + 1);
      const metaText = sanitizePlazaLeaderboardMeta(item.meta) || uiLabel("Campus digital human", "校园数字人", "校園數字人");
      return `<button type="button" class="darlink-ranking-row" ${attrs}>
        <strong title="${escapeHtmlLite(rankLabel)}">${index + 1}</strong>
        <span>${escapeHtmlLite(item.name || uiLabel("Digital human", "数字人", "數字人"))}<em>${escapeHtmlLite(rankLabel)} · ${escapeHtmlLite(metaText)}</em></span>
      </button>`;
    }).join("");
  }

  function applyPlazaLeaderboardToList(list, items) {
    if (!list) return;
    cachedPlazaLeaderboardItems = items || [];
    list.dataset.darlinkGlobalLeaderboard = "true";
    list.innerHTML = renderGlobalPlazaLeaderboardMarkup(cachedPlazaLeaderboardItems);
    queueMicrotask(() => {
      delete list.dataset.darlinkGlobalLeaderboard;
    });
  }

  function restoreCachedPlazaLeaderboard(doc) {
    if (!cachedPlazaLeaderboardItems) return;
    const list = doc?.querySelector?.(".darlink-ranking-list");
    if (!list || list.dataset.darlinkGlobalLeaderboard === "true") return;
    applyPlazaLeaderboardToList(list, cachedPlazaLeaderboardItems);
  }

  async function refreshPlazaLeaderboardInDoc(doc) {
    const list = doc?.querySelector?.(".darlink-ranking-list");
    if (!list) return;
    try {
      const res = await fetchGlobalPlazaLeaderboard(3);
      if (!res?.ok) return;
      applyPlazaLeaderboardToList(list, res.items || []);
    } catch (_error) {
      /* ignore */
    }
  }

  function patchPlazaLeaderboardHotfix(doc) {
    if (!doc?.body?.classList?.contains("darlink-page-home-luminous-dashboard-refined-v4")) return;
    installPlazaLeaderboardStorageGuard();
    if (doc.head && !doc.querySelector("style[data-darlink-plaza-leaderboard-hotfix]")) {
      const style = doc.createElement("style");
      style.dataset.darlinkPlazaLeaderboardHotfix = "true";
      style.textContent = `.darlink-ranking-row > b{display:none!important;}`;
      doc.head.appendChild(style);
    }
    refreshPlazaLeaderboardInDoc(doc);
    if (doc.body.dataset.plazaLeaderboardHotfix === "true") return;
    doc.body.dataset.plazaLeaderboardHotfix = "true";

    doc.body.addEventListener(
      "click",
      (event) => {
        if (event.target.closest(".darlink-ranking-list")) {
          event.stopImmediatePropagation();
          return;
        }
      },
      true
    );

    const plazaScroll = doc.querySelector(".darlink-home-plaza-scroll");
    if (plazaScroll && plazaScroll.dataset.darlinkPlazaLeaderboardGuard !== "true") {
      plazaScroll.dataset.darlinkPlazaLeaderboardGuard = "true";
      plazaScroll.addEventListener(
        "click",
        (event) => {
          if (!event.target.closest(".darlink-home-twin-card")) return;
          if (isPlazaChatEntryClick(event.target)) return;
          restoreCachedPlazaLeaderboard(doc);
        },
        false
      );
    }

    const observer = new MutationObserver(() => {
      const btn = doc.querySelector('[data-action="chat-plaza-twin"]');
      if (!btn || btn.dataset.globalPlazaClickBound === "true") return;
      btn.dataset.globalPlazaClickBound = "true";
      btn.addEventListener(
        "click",
        () => {
          const profileId = btn.dataset.profileId || btn.getAttribute("data-profile-id");
          if (!profileId) return;
          const name = doc.querySelector(".darlink-plaza-twin-modal h2")?.textContent?.trim() || "";
          recordGlobalPlazaClick({
            id: profileId,
            type: "user_twin",
            name,
            meta: uiLabel("Campus digital human", "校园数字人", "校園數字人"),
          });
        },
        true
      );
    });
    observer.observe(doc.body, { childList: true, subtree: true });

    const rankingList = doc.querySelector(".darlink-ranking-list");
    if (rankingList && rankingList.dataset.darlinkRankingApiGuard !== "true") {
      rankingList.dataset.darlinkRankingApiGuard = "true";
      const rankingObserver = new MutationObserver(() => {
        if (rankingList.dataset.darlinkGlobalLeaderboard === "true") return;
        restoreCachedPlazaLeaderboard(doc);
      });
      rankingObserver.observe(rankingList, { childList: true, subtree: true });
    }
  }

  function storeChatContext(type, id) {
    if (!id) return;
    localStorage.setItem("darlink-chat-context", JSON.stringify({ type, id, createdAt: Date.now() }));
  }

  function readJson(key, fallback = {}) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function routeForCelebrityDigitalHuman(id, element) {
    if (!id) return null;
    const unlocked = readJson("darlink-celebrity-unlocked", {});
    if (unlocked[id]) {
      storeChatContext("celebrity", id);
      maybeRecordPlazaChatEntry(element, { id, type: "celebrity" });
      return PAGE.matchChat;
    }
    localStorage.setItem("darlink-celebrity-challenge", JSON.stringify({ id, createdAt: Date.now() }));
    return PAGE.celebrityChallenge;
  }

  function previousForBack() {
    const inMainApp = currentPage && !ONBOARD_PAGES.has(currentPage);
    while (pageHistory.length) {
      const page = pageHistory.pop();
      if (!page || page === currentPage || !PAGES.has(page)) continue;
      if (inMainApp && ONBOARD_PAGES.has(page)) continue;
      return page;
    }
    if (currentPage === PAGE.login) return LANDING;
    if (currentPage === PAGE.onboard2) return PAGE.onboard1;
    if (currentPage === PAGE.onboard3) return PAGE.onboard2;
    if (BACK_PARENT[currentPage]) return BACK_PARENT[currentPage];
    if ([PAGE.digitalPlaza, PAGE.exploreChat, PAGE.xiaodaChat, PAGE.study, PAGE.culinary, PAGE.romance, PAGE.matching, PAGE.matchChat, PAGE.community, PAGE.celebrityChallenge, PAGE.profile].includes(currentPage)) {
      return previousPage || PAGE.home;
    }
    return PAGE.home;
  }

  function routeForPage(element, label, event) {
    const localLabel = directText(element);
    if (isSearchControl(element, localLabel || label)) return null;
    if (isRefreshControl(element, localLabel || label)) return null;

    const explicitChat = dataChatContextFromElement(element);
    if (explicitChat) {
      storeChatContext(explicitChat.type, explicitChat.id);
      maybeRecordPlazaChatEntry(element, explicitChat);
      return PAGE.matchChat;
    }

    const explicitCelebrity = element.closest && element.closest("[data-darlink-celebrity-id]");
    if (explicitCelebrity && explicitCelebrity.dataset.darlinkCelebrityId) {
      return routeForCelebrityDigitalHuman(explicitCelebrity.dataset.darlinkCelebrityId, element);
    }

    if ([PAGE.study, PAGE.culinary, PAGE.romance, PAGE.digitalPlaza].includes(currentPage) && hasAny(label, ["chat with twin", "initiate heart-to-heart", "initiate heart to heart", "open chat", "chat"])) {
      const context = moduleContextFromElement(currentPage, element, label);
      if (context) {
        storeChatContext(context.type, context.id);
        maybeRecordPlazaChatEntry(element, context);
        return PAGE.matchChat;
      }
    }

    if (currentPage === PAGE.matching && isMatchingNode(element, label)) {
      storeChatContext("match", matchContextFromElement(element, label));
    }
    const pageTarget = targetForLabel(currentPage, localLabel);
    if (pageTarget) return pageTarget;

    if (isBack(label)) {
      backNavigationRequested = true;
      return previousForBack();
    }
    if (currentPage !== PAGE.matchChat && currentPage !== PAGE.xiaodaChat && isTopRightAvatar(element, event)) return PAGE.profile;

    const markedTarget = element.closest && element.closest("[data-darlink-flow-target]");
    if (markedTarget && markedTarget.dataset.darlinkFlowTarget) return markedTarget.dataset.darlinkFlowTarget;

    const navRoute = routeByNavigation(element, localLabel || label);
    if (navRoute) return navRoute;

    switch (currentPage) {
      case PAGE.login:
        if (hasAny(label, ["sync identity", "login with wechat", "login with apple", "login with google"])) return PAGE.onboard1;
        break;

      case PAGE.onboard1:
        if (hasAny(label, ["开启奇妙旅程"])) return PAGE.onboard2;
        break;

      case PAGE.onboard2:
        if (hasAny(label, ["next step"])) return PAGE.onboard3;
        break;

      case PAGE.onboard3:
        if (hasAny(label, ["完成并生成我的 ai 分身", "arrow_forward"])) return PAGE.home;
        break;

      case PAGE.home:
        return targetForLabel(PAGE.home, localLabel || label);

      case PAGE.matching:
        if (isMatchingNode(element, label)) {
          storeChatContext("match", matchContextFromElement(element, label));
          return PAGE.matchChat;
        }
        break;

      case PAGE.exploreChat:
      case PAGE.xiaodaChat:
      case PAGE.matchChat:
        if (hasAny(label, ["home", "discover"])) return PAGE.home;
        break;

      default:
        break;
    }

    return null;
  }

  function clickableFromEvent(event) {
    const target = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
    if (!target || !target.closest) return null;
    return target.closest("[data-darlink-flow-target], a, button, [role='button'], li, .cursor-pointer, [class*='cursor-pointer'], img");
  }

  function isEnhancedFlowControl(element) {
    if (!element || !element.closest) return false;
    if (
      element.closest(
        "#darlinkAuthForm, .darlink-onboarding-shell, .darlink-profile-modal, .darlink-yau-guess-body, .darlink-celebrity-challenge-body, [data-darlink-local-control]"
      )
    ) {
      return true;
    }
    const flowTarget = element.closest("[data-darlink-flow-target]");
    if (flowTarget && flowTarget.dataset.darlinkFlowTarget) return false;
    return false;
  }

  function bindFrameClicks() {
    const doc = frame.contentDocument;
    if (!doc || doc.__darlinkFlowBound) return;
    doc.__darlinkFlowBound = true;
    markKnownTargets(doc);

    doc.addEventListener(
      "click",
      (event) => {
        if (doc.getElementById("darlinkAuthForm") || doc.body.classList.contains("darlink-onboarding-body")) return;

        const element = clickableFromEvent(event);
        if (!element) return;
        if (isEnhancedFlowControl(element)) return;

        const label = collectText(element);
        backNavigationRequested = false;
        const route = routeForPage(element, label, event);
        const fromBack = backNavigationRequested;
        backNavigationRequested = false;
        if (!route) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (route === LANDING) {
          window.location.href = "/v14";
          return;
        }
        const replaceHistory = fromBack || SHELL_TABS.has(route) || (currentPage && SHELL_TABS.has(currentPage) && SHELL_TABS.has(route));
        navigate(route, { immediate: true, fromBack, replace: replaceHistory });
      },
      true
    );
  }

  frame.addEventListener("load", () => {
    if (!isRealFramePageSrc(frame.src)) {
      window.requestAnimationFrame(() => frame.classList.remove("is-loading"));
      return;
    }

    const rawMatch = (frame.src || "").match(/\/pages\/([^/]+)\/code\.html/);
    const rawPage = rawMatch && PAGES.has(rawMatch[1]) ? rawMatch[1] : null;
    if (rawPage === PAGE.digitalPlaza) {
      navigate(PAGE.home, { replace: true, immediate: true, force: true, fromHistory: true });
      window.requestAnimationFrame(() => frame.classList.remove("is-loading"));
      return;
    }
    const srcPage = pageFromFrameSrc();
    if (srcPage && srcPage !== currentPage) {
      currentPage = srcPage;
      window.__DARLINK_FLOW_CURRENT_PAGE = currentPage;
      if (!hashMatchesPage(srcPage)) syncHash(srcPage, true);
    }
    bindFrameClicks();
    const enhancePage = srcPage || currentPage || pageFromHash();
    if (enhancePage === PAGE.home && frame.contentDocument) {
      runHomeEnhancement(frame.contentDocument);
      return;
    }
    try {
      if (window.DarlinkEnhancer && frame.contentDocument) {
        window.DarlinkEnhancer.enhanceFrame(frame.contentDocument, enhancePage, {
          navigate,
          page: PAGE,
        });
        injectProfileUiHotfix(frame.contentDocument);
      }
    } catch (_error) {
      /* keep shell usable if a page enhancer throws */
    }
    window.requestAnimationFrame(() => frame.classList.remove("is-loading"));
  });

  if (profileHotspot) {
    profileHotspot.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(PAGE.profile, { replace: true });
    });
  }

  if (topNavHotspots) {
    topNavHotspots.addEventListener("click", (event) => {
      const button = event.target && event.target.closest && event.target.closest("[data-route]");
      if (!button) return;
      event.preventDefault();
      navigate(button.dataset.route, { replace: true });
    });
  }

  window.addEventListener("message", (event) => {
    if (!event.data) return;
    if (event.data.type === "darlink:iframe-bfcache") {
      const page = event.data.page || pageFromFrameSrc() || currentPage || pageFromHash();
      navigate(page, { replace: true, immediate: true, force: true, fromHistory: true });
      window.setTimeout(() => reEnhanceFrame(page), 0);
      return;
    }
    if (event.data.type === "darlink:switch-lang") {
      switchAppLang(event.data.lang);
      return;
    }
    if (event.data.type !== "darlink:navigate") return;
    navigate(event.data.page, { replace: !ONBOARD_PAGES.has(event.data.page) });
  });

  window.addEventListener("hashchange", () => {
    syncRouteFromHash();
  });

  window.addEventListener("popstate", () => {
    frame.src = "about:blank";
    syncRouteFromHash();
    window.setTimeout(() => reEnhanceFrame(pageFromHash()), 320);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    frame.src = "about:blank";
    syncRouteFromHash();
    window.setTimeout(() => reEnhanceFrame(pageFromHash()), 320);
  });

  function resolveInitialPage() {
    const hashRaw = decodeURIComponent((window.location.hash || "").replace(/^#/, "")).trim();
    const hashPage = pageFromHash();
    if (hashRaw && PAGES.has(hashPage)) return hashPage;
    const sessionPage = window.DarlinkSession?.resolveInitialPage?.();
    if (sessionPage && PAGES.has(sessionPage)) return sessionPage;
    return hashPage;
  }

  prefetchHomeData();
  const bootPage = resolveInitialPage();
  navigate(bootPage, { replace: true, immediate: true, force: true });
  window.history.replaceState({ darlink: PAGE_ASSET_VERSION, page: bootPage }, "", `#${encodeURIComponent(bootPage)}`);
})();
