(() => {
  "use strict";

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
    events: "events_campus_resonance_hub",
    community: "community_campus_pulse_feed",
    hall: "hall_of_fame_legendary_pioneers_gallery",
    profile: "profile_full_campus_identity_final",
  };

  const PAGES = new Set(Object.values(PAGE));
  const LANDING = "__landing__";
  const frame = document.getElementById("flowFrame");
  const status = document.getElementById("flowStatus");
  const profileHotspot = document.getElementById("profileHotspot");
  const topNavHotspots = document.getElementById("topNavHotspots");
  const PAGE_ASSET_VERSION = "20260629-3";

  let currentPage = null;
  let previousPage = PAGE.home;
  let pageHistory = [];
  let backNavigationRequested = false;
  let routeToken = 0;

  const PAGE_LABELS = {
    zhHans: {
      [PAGE.login]: "学校邮箱验证",
      [PAGE.onboard1]: "小搭基础信息对话",
      [PAGE.onboard2]: "小搭人物画像对话",
      [PAGE.onboard3]: "小搭社交路径选择",
      [PAGE.home]: "首页",
      [PAGE.digitalPlaza]: "数字人广场",
      [PAGE.exploreChat]: "数字人潜力探索",
      [PAGE.xiaodaChat]: "小搭自由聊天",
      [PAGE.study]: "学习搭子发现",
      [PAGE.culinary]: "饭搭子发现",
      [PAGE.romance]: "恋爱对象发现",
      [PAGE.matching]: "共振匹配网络",
      [PAGE.matchChat]: "智能聊天",
      [PAGE.events]: "校园活动",
      [PAGE.community]: "校园社区",
      [PAGE.hall]: "名人堂",
      [PAGE.profile]: "个人档案",
    },
    zhHant: {
      [PAGE.login]: "學校郵箱驗證",
      [PAGE.onboard1]: "小搭基礎資訊對話",
      [PAGE.onboard2]: "小搭人物畫像對話",
      [PAGE.onboard3]: "小搭社交路徑選擇",
      [PAGE.home]: "首頁",
      [PAGE.digitalPlaza]: "數字人廣場",
      [PAGE.exploreChat]: "數字人潛力探索",
      [PAGE.xiaodaChat]: "小搭自由聊天",
      [PAGE.study]: "學習搭子發現",
      [PAGE.culinary]: "飯搭子發現",
      [PAGE.romance]: "戀愛對象發現",
      [PAGE.matching]: "共振匹配網絡",
      [PAGE.matchChat]: "智能聊天",
      [PAGE.events]: "校園活動",
      [PAGE.community]: "校園社群",
      [PAGE.hall]: "名人堂",
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

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function pageFromHash() {
    const raw = decodeURIComponent((window.location.hash || "").replace(/^#/, "")).trim();
    if (PAGES.has(raw)) return raw;
    if (PAGE[raw]) return PAGE[raw];
    return PAGE.login;
  }

  function prettyPage(page) {
    const labels = PAGE_LABELS[lang()];
    if (labels && labels[page]) return labels[page];
    return page
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function pageUrl(page) {
    return `pages/${page}/code.html?v=${PAGE_ASSET_VERSION}`;
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
    if (!PAGES.has(page)) return;
    if (page === currentPage && frame.src.includes(pageUrl(page))) return;

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
    syncHash(page, Boolean(options.replace));
    document.title = `Darlink - ${prettyPage(page)}`;
    if (status) {
      const label = prettyPage(page);
      status.textContent = lang() === "en" ? `Navigated to ${label}` : lang() === "zhHant" ? `已前往${label}` : `已前往${label}`;
    }

    window.setTimeout(() => {
      if (nextToken !== routeToken) return;
      frame.src = pageUrl(page);
    }, options.immediate ? 0 : 120);
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
      [PAGE.events]: ["events", "event", "campus resonance events", "活动", "活動", "校园活动", "校園活動"],
      [PAGE.community]: ["community", "社区", "社群", "校园社区", "校園社群"],
      [PAGE.hall]: ["hall of fame", "hall", "名人堂"],
      [PAGE.profile]: ["profile", "my profile", "个人档案", "我的档案", "個人檔案", "我的檔案"],
    };
    return Object.entries(aliases).find(([, values]) => values.includes(cleaned))?.[0] || null;
  }

  function routeByNavigation(element, label) {
    if (!isNavContext(element)) return null;
    const shortLabel = navControlLabel(element);
    const exactRoute = exactNavRoute(shortLabel);
    if (exactRoute) return exactRoute;

    if (hasAny(shortLabel, ["hall of fame", "名人堂"]) || shortLabel === "hall") return PAGE.hall;
    if (hasAny(shortLabel, ["community", "社区", "社群"])) return PAGE.community;
    if (hasAny(shortLabel, ["events", "campus resonance events", "活动", "活動"])) return PAGE.events;
    if (hasAny(shortLabel, ["matches", "match", "匹配"])) return PAGE.matching;
    if (hasAny(shortLabel, ["discover", "home", "首页", "首頁", "发现", "發現"])) return PAGE.home;
    if (hasAny(shortLabel, ["profile", "my profile", "个人档案", "我的档案", "個人檔案", "我的檔案"])) return PAGE.profile;

    return null;
  }

  function targetForLabel(page, label) {
    if (page === PAGE.home) {
      if (hasAny(label, ["view detailed insights", "view digital humans", "查看数字人", "查看數字人", "数字人广场", "數字人廣場", "digital human plaza", "digital humans"])) return PAGE.digitalPlaza;
      if (hasAny(label, ["explore potential", "探索潜力", "探索潛力"])) return PAGE.exploreChat;
      if (hasAny(label, ["study sync", "学习搭子", "學習搭子"])) return PAGE.study;
      if (hasAny(label, ["culinary match", "饭搭子", "飯搭子"])) return PAGE.culinary;
      if (hasAny(label, ["deep romance", "恋爱对象", "戀愛對象"])) return PAGE.romance;
    }

    if ([PAGE.exploreChat, PAGE.study, PAGE.culinary, PAGE.romance].includes(page) && hasAny(label, ["ask xiaoda anything", "问小搭", "問小搭", "小搭聊天"])) {
      return PAGE.xiaodaChat;
    }

    if (page === PAGE.digitalPlaza && hasAny(label, ["explore potential", "探索潜力", "探索潛力"])) {
      return PAGE.exploreChat;
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

  function hallContextFromElement(element, label) {
    const explicit = element.closest && element.closest("[data-darlink-hall-id]");
    if (explicit && explicit.dataset.darlinkHallId) return explicit.dataset.darlinkHallId;
    const combined = `${directText(element)} ${label}`;
    const pairs = [
      ["steve jobs", "steve-jobs"],
      ["elon musk", "elon-musk"],
      ["jensen huang", "jensen-huang"],
      ["jack ma", "jack-ma"],
      ["warren buffett", "charlie-munger"],
      ["tim cook", "steve-jobs"],
      ["ray dalio", "ray-dalio"],
      ["peter drucker", "peter-drucker"],
      ["richard feynman", "richard-feynman"],
      ["charlie munger", "charlie-munger"],
      ["reid hoffman", "reid-hoffman"],
      ["jeff bezos", "jeff-bezos"],
      ["naval ravikant", "naval-ravikant"],
      ["marc andreessen", "marc-andreessen"],
      ["mark zuckerberg", "mark-zuckerberg"],
      ["chat with me", "steve-jobs"],
    ];
    const found = pairs.find(([needle]) => combined.includes(needle));
    return found ? found[1] : "";
  }

  function storeChatContext(type, id) {
    if (!id) return;
    localStorage.setItem("darlink-chat-context", JSON.stringify({ type, id, createdAt: Date.now() }));
  }

  function previousForBack() {
    while (pageHistory.length) {
      const page = pageHistory.pop();
      if (page && page !== currentPage && PAGES.has(page)) return page;
    }
    if (currentPage === PAGE.login) return LANDING;
    if (currentPage === PAGE.onboard2) return PAGE.onboard1;
    if (currentPage === PAGE.onboard3) return PAGE.onboard2;
    if ([PAGE.digitalPlaza, PAGE.exploreChat, PAGE.xiaodaChat, PAGE.study, PAGE.culinary, PAGE.romance, PAGE.matching, PAGE.matchChat, PAGE.events, PAGE.community, PAGE.hall, PAGE.profile].includes(currentPage)) {
      return previousPage || PAGE.home;
    }
    return PAGE.home;
  }

  function routeForPage(element, label, event) {
    const hashPage = pageFromHash();
    if (hashPage !== currentPage && PAGES.has(hashPage)) {
      currentPage = hashPage;
      window.__DARLINK_FLOW_CURRENT_PAGE = currentPage;
    }

    const localLabel = directText(element);
    if (isSearchControl(element, localLabel || label)) return null;
    if (isRefreshControl(element, localLabel || label)) return null;

    const explicitChat = dataChatContextFromElement(element);
    if (explicitChat) {
      storeChatContext(explicitChat.type, explicitChat.id);
      return PAGE.matchChat;
    }

    if ([PAGE.study, PAGE.culinary, PAGE.romance, PAGE.digitalPlaza].includes(currentPage) && hasAny(label, ["chat with twin", "initiate heart-to-heart", "initiate heart to heart", "open chat", "chat"])) {
      const context = moduleContextFromElement(currentPage, element, label);
      if (context) {
        storeChatContext(context.type, context.id);
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

      case PAGE.hall: {
        if (hasAny(localLabel, ["chevron_left", "chevron_right", "‹", "›"])) return null;
        const hallId = hallContextFromElement(element, label);
        if (hallId && hasAny(label, ["chat with me", "arrow_forward", "steve jobs", "elon musk", "jensen huang", "jack ma", "warren buffett", "tim cook", "ray dalio", "peter drucker", "richard feynman", "charlie munger", "reid hoffman", "jeff bezos", "naval ravikant", "marc andreessen", "mark zuckerberg"])) {
          storeChatContext("hall", hallId);
          return PAGE.matchChat;
        }
        break;
      }

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
    return Boolean(
      element.closest(
        "#darlinkAuthForm, .darlink-onboarding-shell, .darlink-profile-modal, [data-darlink-local-control]"
      )
    );
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
        navigate(route, { immediate: true, fromBack });
      },
      true
    );
  }

  frame.addEventListener("load", () => {
    frame.classList.remove("is-loading");
    bindFrameClicks();
    if (window.DarlinkEnhancer && frame.contentDocument) {
      window.DarlinkEnhancer.enhanceFrame(frame.contentDocument, currentPage, {
        navigate,
        page: PAGE,
      });
    }
  });

  if (profileHotspot) {
    profileHotspot.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(PAGE.profile);
    });
  }

  if (topNavHotspots) {
    topNavHotspots.addEventListener("click", (event) => {
      const button = event.target && event.target.closest && event.target.closest("[data-route]");
      if (!button) return;
      event.preventDefault();
      navigate(button.dataset.route);
    });
  }

  window.addEventListener("message", (event) => {
    if (!event.data || event.data.type !== "darlink:navigate") return;
    navigate(event.data.page);
  });

  window.addEventListener("hashchange", () => {
    const page = pageFromHash();
    if (page !== currentPage) navigate(page, { replace: true, immediate: true });
  });

  navigate(pageFromHash(), { replace: true, immediate: true });
})();
