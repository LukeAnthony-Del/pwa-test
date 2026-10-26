const BUILTIN = [
  { id: "7gV-0be8WqE", handle: "missfoxyasmr", name: "miss foxy", caption: "Real vs fake mango cracking #asmr #satisfying #mango", likes: 980000, comments: 6200, saves: 74000, shares: 21000 },
  { id: "ou0nl5ET0HA", handle: "dameuniverse", name: "Dame Universe", caption: "That hooper who says they're just shoes #basketball #kobe #fyp", likes: 151957, comments: 1680, saves: 12400, shares: 4200 },
  { id: "DQYc93f7FJw", handle: "TravelPleasure.", name: "Travel Pleasure", caption: "Best places to visit in Italy #shorts #travel #italy", likes: 98000, comments: 1400, saves: 22000, shares: 6400 },
  { id: "tyBJvOsaVys", handle: "louisgantus", name: "Louis Gantus", caption: "He hates this #cooking #food #recipe", likes: 241000, comments: 3100, saves: 18600, shares: 5400 },
  { id: "-OTqZWLJO9s", handle: "Tech_Foodie", name: "Tech Foodie", caption: "Ice + salt experiment #scienceexperiment #shorts", likes: 540000, comments: 4700, saves: 31000, shares: 9800 },
  { id: "pyAejtUlKPA", handle: "ashkan_ws", name: "Ashkan Sadeghi", caption: "Giant beluga fish with rice 🐟🔥🍚 #fish #cooking #shorts", likes: 1600000, comments: 11200, saves: 88000, shares: 24000 },
  { id: "himxIytMI5I", handle: "HatrickX", name: "HatrickX", caption: "Basketball moments 😅 #basketball #nba #shorts", likes: 840, comments: 22, saves: 60, shares: 18 },
  { id: "pP44i6A2Kds", handle: "JasminandJames", name: "Jasmin and James", caption: "Dreams come true 😳😍 #puppy #cat #kitten #pets", likes: 22000, comments: 480, saves: 3100, shares: 860 },
  { id: "K3UGd3By864", handle: "941krew", name: "941 KREW", caption: "Love Park legend #skateboarding #skate #shorts", likes: 186, comments: 8, saves: 14, shares: 4 },
  { id: "fu5jboOyNH0", handle: "Rookie.Ranks2", name: "rookie ranks", caption: "Ranking the most satisfying videos 🧼 #satisfying #asmr", likes: 4100, comments: 90, saves: 610, shares: 140 },
  { id: "Zi1WqiSLLKE", handle: "TinyShorts-w5l", name: "Tiny Shorts", caption: "Travel spots with whale sharks that look unreal 🤯 #travel #nature", likes: 74, comments: 3, saves: 9, shares: 2 },
  { id: "F-n0Zp0GBKA", handle: "oyefoodievlogs", name: "Oye Foodie Vlogs", caption: "Agra famous barule, just ₹10 😍 #streetfood #food #shorts", likes: 87000, comments: 960, saves: 5400, shares: 1200 },
  { id: "vQ3NZZ8hhbs", handle: "ashleymarkleeats", name: "Ashley Markle Eats", caption: "Viral pumpkin cheese dip 🧀🎃 #recipe #cooking #snacks", likes: 18000, comments: 240, saves: 4100, shares: 730 },
  { id: "x-T_35ijqX0", handle: "TrainSmartDog", name: "Train Smart Dog", caption: "This puppy swims, jumps, and climbs back out 🐕 #puppy #germanshepherd", likes: 9200, comments: 140, saves: 860, shares: 210 },
  { id: "4BrrdNc3DqU", handle: "FKnowra-t2q", name: "Knowra", caption: "Most beautiful places on earth 😱✨ #adventure #travel #nature", likes: 1200, comments: 36, saves: 280, shares: 70 },
];

const SEEDS = [
  ["alex", "I watched this way too many times"],
  ["sam", "the end caught me off guard"],
  ["riley", "sending this to the group chat"],
  ["jordan", "why is this actually perfect"],
  ["casey", "ok I need the full version"],
  ["drew", "wait go back"],
  ["quinn", "this showed up at the right time"],
  ["morgan", "the sound makes it"],
];

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2 4.9 13.4C2.8 11.4 2.7 8.2 4.7 6.2a4.4 4.4 0 0 1 6.4 0L12 7.1l.9-.9a4.4 4.4 0 0 1 6.4 0c2 2 1.9 5.2-.2 7.2L12 20.2z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const HEART_LINE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2 4.9 13.4C2.8 11.4 2.7 8.2 4.7 6.2a4.4 4.4 0 0 1 6.4 0L12 7.1l.9-.9a4.4 4.4 0 0 1 6.4 0c2 2 1.9 5.2-.2 7.2L12 20.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const COMMENT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 16.4 4.4 19.6c-.3.5.2 1.1.7.8L9.2 18.7A7.6 7.6 0 1 0 6.2 16.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.2h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.2a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const BOOK_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.2h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.2a1 1 0 0 1 1-1z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5.2 19.2 10 14 14.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.2 10H10.2A5.2 5.2 0 0 0 5 15.2V19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.2V6.4l10-2v10.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="7.2" cy="17.2" r="2.1" fill="currentColor"/><circle cx="17.2" cy="15" r="2.1" fill="currentColor"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.2v9.6l8.2-4.8L9 7.2z" fill="#fff"/></svg>';

const app = document.querySelector("#app");
const scroller = document.querySelector("#scroller");
const sheet = document.querySelector("#sheet");
const backdrop = document.querySelector("#backdrop");
const searchLayer = document.querySelector("#search");
const soundBtn = document.querySelector("#sound");
const inboxDot = document.querySelector("#inbox-dot");

const players = new Map();
const ready = new WeakSet();
let ytOk = false;
let activeIndex = -1;
let userPaused = false;
let soundOn = false;
let feedMode = "foryou";
let screen = "feed";
let searchOpen = false;
let sheetOpen = false;
let inboxTab = "activity";
let profileTab = "liked";
let toastTimer = 0;
let lastTap = 0;
let tapTimer = 0;
let commentFor = null;

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function likes() { return load("tt-likes", {}); }
function saves() { return load("tt-saves", {}); }
function follows() { return load("tt-follows", {}); }
function comments() { return load("tt-comments", {}); }
function profile() { return load("tt-profile", { name: "You", handle: "you" }); }

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function captionHtml(text) {
  return escapeHtml(text).replace(/#([\p{L}\p{N}_]+)/gu, '<b class="tag">#$1</b>');
}

function compact(n) {
  n = Math.max(0, Math.round(n));
  if (n >= 1000000) return String(+(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)).replace(/\.0$/, "") + "M";
  if (n >= 1000) return String(+(n / 1000).toFixed(n >= 10000 ? 0 : 1)).replace(/\.0$/, "") + "K";
  return String(n);
}

function hue(text) {
  let h = 7;
  for (const ch of text) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

function initial(name) {
  const ch = [...String(name).trim()][0] || "?";
  return escapeHtml(ch.toUpperCase());
}

function isId(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

function addedVideos() {
  return load("tt-added", []).filter((video) => video && isId(video.id));
}

function catalog() {
  const seen = new Set();
  const list = [];
  for (const video of [...addedVideos(), ...BUILTIN]) {
    if (!isId(video.id) || seen.has(video.id)) continue;
    seen.add(video.id);
    list.push(video);
  }
  return list;
}

function currentList() {
  const list = catalog();
  if (feedMode === "following") {
    const followed = follows();
    return list.filter((video) => followed[video.handle]);
  }
  return list;
}

function videoById(id) {
  return catalog().find((video) => video.id === id);
}

function poster(id) {
  return `https://i.ytimg.com/vi/${id}/oar2.jpg`;
}

function ago(time) {
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h";
  return Math.floor(seconds / 86400) + "d";
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

function pushActivity(text) {
  const items = load("tt-activity", []);
  items.unshift({ text, t: Date.now(), seen: false });
  save("tt-activity", items.slice(0, 40));
  paintInboxDot();
}

function paintInboxDot() {
  const unseen = load("tt-activity", []).some((item) => !item.seen);
  inboxDot.hidden = !unseen;
}

function slideHtml(video) {
  const liked = !!likes()[video.id];
  const saved = !!saves()[video.id];
  const followed = !!follows()[video.handle];
  const sound = `original sound - ${video.name}`;
  return `<article class="slide" data-id="${video.id}">
    <div class="stage">
      <img class="poster" alt="" src="${poster(video.id)}" data-fallback="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" />
    </div>
    <div class="hit" data-action="hit"></div>
    <div class="scrim"></div>
    <div class="pause-icon">${PLAY}</div>
    <div class="tap-play">${PLAY}</div>
    <div class="err">
      <p>This Short can't play here</p>
      <button type="button" data-action="next">Next</button>
    </div>
    <div class="meta">
      <p class="handle">@${escapeHtml(video.handle)}</p>
      <p class="caption" data-action="caption">${captionHtml(video.caption)}</p>
      <div class="sound">${NOTE}<div class="marquee"><span>${escapeHtml(sound)}</span></div></div>
    </div>
    <div class="rail">
      <div class="avatar-wrap${followed ? " followed" : ""}">
        <button class="avatar" type="button" data-action="creator" data-handle="${escapeHtml(video.handle)}" style="--h:${hue(video.handle)}" aria-label="${escapeHtml(video.name)}">${initial(video.name)}</button>
        <button class="plus" type="button" data-action="follow" data-handle="${escapeHtml(video.handle)}" aria-label="Follow">+</button>
      </div>
      <button type="button" data-action="like" class="${liked ? "on" : ""}" aria-label="Like">${liked ? HEART : HEART_LINE}<span class="like-count">${compact(video.likes + (liked ? 1 : 0))}</span></button>
      <button type="button" data-action="comment" aria-label="Comments">${COMMENT}<span class="comment-count">${compact(video.comments + (comments()[video.id] || []).length)}</span></button>
      <button type="button" data-action="save" class="save${saved ? " on" : ""}" aria-label="Save">${saved ? BOOK_ON : BOOK}<span class="save-count">${compact(video.saves + (saved ? 1 : 0))}</span></button>
      <button type="button" data-action="share" aria-label="Share">${SHARE}<span>${compact(video.shares)}</span></button>
      <div class="disc" aria-hidden="true"></div>
    </div>
  </article>`;
}

function bindPosters() {
  scroller.querySelectorAll(".poster").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
    });
  });
}

function sizeSlides() {
  const height = scroller.clientHeight;
  scroller.querySelectorAll(".slide").forEach((slide) => {
    slide.style.height = height + "px";
  });
}

function slideCount() {
  return scroller.querySelectorAll(".slide").length;
}

function slideAt(index) {
  return scroller.querySelectorAll(".slide")[index] || null;
}

function destroyPlayers() {
  for (const player of players.values()) {
    try { player.destroy(); } catch { /* already gone */ }
  }
  players.clear();
}

function renderFeed(keepIndex) {
  destroyPlayers();
  const list = currentList();
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("on", button.dataset.mode === feedMode);
  });
  if (!list.length) {
    activeIndex = -1;
    scroller.innerHTML = `<div class="empty"><h2>Follow creators</h2><p>Videos from people you follow show up here.</p><button class="primary" type="button" data-action="mode" data-mode="foryou">Watch For You</button></div>`;
    return;
  }
  const next = keepIndex ? Math.min(Math.max(activeIndex, 0), list.length - 1) : 0;
  scroller.innerHTML = list.map((video) => slideHtml(video)).join("");
  bindPosters();
  sizeSlides();
  activeIndex = -1;
  userPaused = false;
  scroller.scrollTop = next * scroller.clientHeight;
  setActive(next);
}

function styleFrame(player) {
  try {
    const iframe = player.getIframe();
    iframe.title = "Short";
    iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;transform:scale(1.14);transform-origin:center center;pointer-events:none;";
  } catch { /* player not ready */ }
}

function shouldPlay() {
  return screen === "feed" && !searchOpen && !document.hidden;
}

function syncOne(index) {
  const player = players.get(index);
  if (!player || !ready.has(player)) return;
  const slide = slideAt(index);
  const play = index === activeIndex && shouldPlay() && !userPaused;
  try {
    if (play) {
      player.mute();
      player.playVideo();
      if (soundOn) player.unMute();
    } else {
      player.mute();
      player.pauseVideo();
    }
  } catch { /* ignore player races */ }
  slide?.classList.toggle("is-active", index === activeIndex);
}

function syncAll() {
  const keep = new Set([activeIndex - 1, activeIndex, activeIndex + 1].filter((index) => index >= 0 && index < slideCount()));
  for (const [index, player] of [...players]) {
    if (!keep.has(index)) {
      try { player.destroy(); } catch { /* ignore */ }
      players.delete(index);
    }
  }
  keep.forEach((index) => ensurePlayer(index));
  keep.forEach((index) => syncOne(index));
}

function ensurePlayer(index) {
  if (!ytOk || index < 0 || index >= slideCount() || players.has(index)) return;
  const slide = slideAt(index);
  const id = slide.dataset.id;
  const holder = document.createElement("div");
  holder.className = "holder";
  holder.id = "yt" + index + id;
  slide.querySelector(".stage").appendChild(holder);
  const player = new YT.Player(holder, {
    videoId: id,
    playerVars: {
      autoplay: 0,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      fs: 0,
      disablekb: 1,
      iv_load_policy: 3,
      cc_load_policy: 0,
      origin: location.origin,
    },
    events: {
      onReady: (event) => {
        if (players.get(index) !== player) return;
        ready.add(player);
        styleFrame(player);
        syncOne(index);
        if (index === activeIndex) {
          setTimeout(() => {
            if (index === activeIndex && !slide.classList.contains("is-playing")) slide.classList.add("needs-tap");
          }, 1800);
        }
      },
      onStateChange: (event) => {
        if (players.get(index) !== player) return;
        if (event.data === YT.PlayerState.PLAYING) {
          slide.classList.add("is-playing");
          slide.classList.remove("needs-tap");
          if (index === activeIndex) slide.classList.remove("is-paused");
        }
        if (event.data === YT.PlayerState.ENDED) {
          try { player.seekTo(0, true); player.playVideo(); } catch { /* ignore */ }
        }
      },
      onError: () => {
        slide.classList.add("is-error");
        slide.classList.remove("needs-tap");
        if (index === activeIndex && slideCount() > 1) {
          setTimeout(() => {
            if (index === activeIndex) go(index >= slideCount() - 1 ? -1 : 1);
          }, 500);
        }
      },
    },
  });
  players.set(index, player);
}

function setActive(index) {
  if (index < 0 || !slideCount()) return;
  if (index === activeIndex) {
    syncAll();
    return;
  }
  userPaused = false;
  activeIndex = index;
  scroller.querySelectorAll(".slide").forEach((slide) => slide.classList.remove("is-paused", "is-active"));
  slideAt(index)?.classList.add("is-active");
  syncAll();
}

function enableSound() {
  soundOn = true;
  soundBtn.hidden = true;
  const player = players.get(activeIndex);
  if (player && ready.has(player)) {
    try { player.unMute(); player.playVideo(); } catch { /* ignore */ }
  }
}

function togglePause() {
  const player = players.get(activeIndex);
  const slide = slideAt(activeIndex);
  if (!player || !ready.has(player)) {
    userPaused = false;
    slide?.classList.remove("needs-tap");
    syncAll();
    return;
  }
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    userPaused = true;
    player.pauseVideo();
    slide?.classList.add("is-paused");
  } else {
    userPaused = false;
    if (soundOn) player.unMute();
    player.playVideo();
    slide?.classList.remove("is-paused", "needs-tap");
  }
}

function go(delta) {
  const count = slideCount();
  if (!count) return;
  const index = Math.max(0, Math.min(count - 1, activeIndex + delta));
  scroller.scrollTo({ top: index * scroller.clientHeight, behavior: "smooth" });
}

function paintSlide(id) {
  const video = videoById(id);
  if (!video) return;
  scroller.querySelectorAll(".slide").forEach((slide) => {
    if (slide.dataset.id !== id) return;
    const liked = !!likes()[id];
    const saved = !!saves()[id];
    const likeBtn = slide.querySelector("[data-action='like']");
    likeBtn.classList.toggle("on", liked);
    likeBtn.querySelector("svg").outerHTML = liked ? HEART : HEART_LINE;
    likeBtn.querySelector(".like-count").textContent = compact(video.likes + (liked ? 1 : 0));
    const saveBtn = slide.querySelector("[data-action='save']");
    saveBtn.classList.toggle("on", saved);
    saveBtn.querySelector("svg").outerHTML = saved ? BOOK_ON : BOOK;
    saveBtn.querySelector(".save-count").textContent = compact(video.saves + (saved ? 1 : 0));
    slide.querySelector(".comment-count").textContent = compact(video.comments + (comments()[id] || []).length);
    const followed = !!follows()[video.handle];
    slide.querySelector(".avatar-wrap").classList.toggle("followed", followed);
  });
}

function burst(event) {
  const slide = event.target.closest(".slide");
  if (!slide) return;
  const rect = slide.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "burst";
  el.style.left = event.clientX - rect.left + "px";
  el.style.top = event.clientY - rect.top + "px";
  el.innerHTML = HEART;
  slide.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function toggleLike(id, fromDoubleTap) {
  const map = likes();
  const video = videoById(id);
  if (!map[id]) {
    map[id] = true;
    if (video && !fromDoubleTap) pushActivity(`You liked a video by @${video.handle}`);
    if (navigator.vibrate) navigator.vibrate(12);
  } else if (!fromDoubleTap) {
    delete map[id];
  }
  save("tt-likes", map);
  paintSlide(id);
}

function toggleSave(id) {
  const map = saves();
  if (map[id]) delete map[id];
  else map[id] = true;
  save("tt-saves", map);
  paintSlide(id);
  toast(map[id] ? "Saved" : "Removed");
}

function toggleFollow(handle) {
  const map = follows();
  if (map[handle]) delete map[handle];
  else {
    map[handle] = true;
    pushActivity(`You followed @${handle}`);
  }
  save("tt-follows", map);
  scroller.querySelectorAll("[data-handle]").forEach((node) => {
    if (node.dataset.handle !== handle) return;
    node.closest(".avatar-wrap")?.classList.toggle("followed", !!map[handle]);
  });
  toast(map[handle] ? "Following" : "Unfollowed");
  if (feedMode === "following") renderFeed(true);
  if (screen === "friends") renderFriends();
}

function activeId() {
  return slideAt(activeIndex)?.dataset.id || null;
}

function onHit(event) {
  const now = Date.now();
  if (now - lastTap < 280) {
    clearTimeout(tapTimer);
    lastTap = 0;
    const id = event.target.closest(".slide")?.dataset.id;
    if (id) {
      burst(event);
      if (!likes()[id]) toggleLike(id, true);
      else paintSlide(id);
    }
    enableSound();
    return;
  }
  lastTap = now;
  tapTimer = setTimeout(() => {
    if (!soundOn) enableSound();
    else togglePause();
  }, 260);
}

function openSheet(html) {
  sheet.innerHTML = html;
  sheet.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => sheet.classList.add("show"));
  sheetOpen = true;
}

function closeSheet() {
  document.activeElement?.blur?.();
  sheet.classList.remove("show");
  sheetOpen = false;
  commentFor = null;
  backdrop.hidden = true;
  setTimeout(() => {
    if (!sheetOpen) sheet.hidden = true;
  }, 280);
}

function seedComments(id) {
  const start = [...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % SEEDS.length;
  return [0, 1, 2, 3].map((offset) => SEEDS[(start + offset) % SEEDS.length]);
}

function openComments(id) {
  const video = videoById(id);
  if (!video) return;
  commentFor = id;
  const mine = comments()[id] || [];
  const total = video.comments + mine.length;
  const rows = [
    ...mine.map((item) => commentRow(profile().name, item.text, ago(item.t))),
    ...seedComments(id).map(([name, text]) => commentRow(name, text, "")),
  ].join("");
  openSheet(`<div class="grab"></div>
    <header>${compact(total)} comments<button type="button" data-action="close" aria-label="Close">×</button></header>
    <div class="comments">${rows}</div>
    <form class="composer" data-form="comment">
      <input name="text" maxlength="180" placeholder="Add comment..." autocomplete="off" />
      <button type="submit">Post</button>
    </form>`);
  sheet.querySelector("input")?.focus();
}

function commentRow(name, text, when) {
  return `<div class="comment"><div class="avatar" style="--h:${hue(name)}">${initial(name)}</div><div><b>${escapeHtml(name)}${when ? " · " + escapeHtml(when) : ""}</b><p>${escapeHtml(text)}</p></div></div>`;
}

function sendComment(text) {
  const value = text.trim();
  if (!value || !commentFor) return;
  const all = comments();
  const list = all[commentFor] || [];
  list.unshift({ text: value, t: Date.now() });
  all[commentFor] = list.slice(0, 30);
  save("tt-comments", all);
  const video = videoById(commentFor);
  if (video) pushActivity(`You commented on @${video.handle}`);
  paintSlide(commentFor);
  openComments(commentFor);
}

function openShare(id) {
  const url = `https://www.youtube.com/shorts/${id}`;
  openSheet(`<div class="grab"></div>
    <header>Share<button type="button" data-action="close" aria-label="Close">×</button></header>
    <div class="menu">
      <button type="button" data-action="native-share" data-url="${url}">Share to...</button>
      <button type="button" data-action="copy" data-url="${url}">Copy link</button>
      <button type="button" data-action="youtube" data-url="${url}">Open on YouTube</button>
    </div>`);
}

async function nativeShare(url) {
  const video = videoById(activeId());
  if (navigator.share) {
    try {
      await navigator.share({ title: video?.caption || "Short", url });
      closeSheet();
      return;
    } catch { /* cancelled */ }
  }
  copyLink(url);
}

function copyLink(url) {
  const done = () => toast("Link copied");
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done).catch(done);
  else done();
  closeSheet();
}

function openCreator(handle) {
  const videos = catalog().filter((video) => video.handle === handle);
  const person = videos[0];
  if (!person) return;
  const followed = !!follows()[handle];
  openSheet(`<div class="grab"></div>
    <header>@${escapeHtml(handle)}<button type="button" data-action="close" aria-label="Close">×</button></header>
    <div class="body">
      <div class="profile-head">
        <div class="avatar" style="--h:${hue(handle)}">${initial(person.name)}</div>
        <h2 style="margin:0">${escapeHtml(person.name)}</h2>
        <p class="muted">@${escapeHtml(handle)}</p>
        <button class="follow${followed ? " on" : ""}" type="button" data-action="follow" data-handle="${escapeHtml(handle)}">${followed ? "Following" : "Follow"}</button>
      </div>
      <div class="grid">${videos.map((video) => `<button type="button" data-action="open" data-id="${video.id}" style="background-image:url('${poster(video.id)}')" aria-label="Play"></button>`).join("")}</div>
    </div>`);
}

function openAdd() {
  openSheet(`<div class="grab"></div>
    <header>Add a Short<button type="button" data-action="close" aria-label="Close">×</button></header>
    <form class="stack" data-form="add">
      <p class="muted">Paste a YouTube Shorts link. It plays in the feed with these controls.</p>
      <input name="url" placeholder="https://www.youtube.com/shorts/..." autocomplete="off" inputmode="url" />
      <button class="primary wide" type="submit">Add to For You</button>
    </form>`);
  sheet.querySelector("input")?.focus();
}

function parseId(input) {
  const text = String(input).trim();
  const match = text.match(/(?:shorts\/|watch\?v=|youtu\.be\/|embed\/|v\/)([A-Za-z0-9_-]{11})/);
  if (match) return match[1];
  if (isId(text)) return text;
  return null;
}

async function addShort(raw) {
  const id = parseId(raw);
  if (!id) {
    toast("Paste a YouTube Shorts link");
    return;
  }
  if (catalog().some((video) => video.id === id)) {
    closeSheet();
    openVideo(id);
    toast("Already in your feed");
    return;
  }
  let title = "YouTube Short";
  let author = "YouTube";
  let handle = "youtube";
  try {
    const response = await fetch("https://www.youtube.com/oembed?url=" + encodeURIComponent("https://www.youtube.com/shorts/" + id) + "&format=json");
    if (response.ok) {
      const data = await response.json();
      title = data.title || title;
      author = data.author_name || author;
      const slug = String(data.author_url || "").split("/").filter(Boolean).pop() || handle;
      handle = slug.replace(/^@/, "");
    }
  } catch { /* keep the fallback label */ }
  const added = addedVideos();
  added.unshift({ id, handle, name: author, caption: title, likes: 0, comments: 0, saves: 0, shares: 0 });
  save("tt-added", added);
  closeSheet();
  feedMode = "foryou";
  screen = "feed";
  paintScreens();
  renderFeed(false);
  toast("Added to your feed");
}

function openVideo(id) {
  feedMode = "foryou";
  closeSheet();
  closeSearch();
  showScreen("feed");
  renderFeed(false);
  const index = currentList().findIndex((video) => video.id === id);
  if (index >= 0) {
    scroller.scrollTop = index * scroller.clientHeight;
    setActive(index);
  }
}

function renderFriends() {
  const people = [];
  const seen = new Set();
  for (const video of catalog()) {
    if (seen.has(video.handle)) continue;
    seen.add(video.handle);
    people.push(video);
  }
  const followed = follows();
  document.querySelector("#friends").innerHTML = `<div class="page"><h1>Friends</h1><p class="muted">Suggested accounts</p>${people.map((person) => {
    const on = !!followed[person.handle];
    return `<div class="row"><button class="avatar" type="button" data-action="open-handle" data-handle="${escapeHtml(person.handle)}" style="--h:${hue(person.handle)}">${initial(person.name)}</button><button type="button" data-action="open-handle" data-handle="${escapeHtml(person.handle)}" style="background:none;border:0;color:#fff;text-align:left;padding:0"><b>${escapeHtml(person.name)}</b><small>@${escapeHtml(person.handle)}</small></button><button class="follow${on ? " on" : ""}" type="button" data-action="follow" data-handle="${escapeHtml(person.handle)}">${on ? "Following" : "Follow"}</button></div>`;
  }).join("")}</div>`;
}

function renderInbox() {
  const items = load("tt-activity", []);
  const activity = inboxTab === "activity"
    ? (items.length
      ? items.map((item) => `<div class="activity"><div class="avatar" style="--h:${hue(item.text)}">${initial("Y")}</div><p>${escapeHtml(item.text)}<br><small class="muted">${ago(item.t)}</small></p></div>`).join("")
      : `<div class="blank">Notifications will appear here when you like, comment, or follow.</div>`)
    : `<div class="blank">Messages from friends will show up here.</div>`;
  document.querySelector("#inbox").innerHTML = `<div class="page"><h1>Inbox</h1><div class="subtabs"><button type="button" data-action="inbox-tab" data-tab="activity" class="${inboxTab === "activity" ? "on" : ""}">All activity</button><button type="button" data-action="inbox-tab" data-tab="messages" class="${inboxTab === "messages" ? "on" : ""}">Messages</button></div>${activity}</div>`;
  if (inboxTab === "activity") {
    save("tt-activity", items.map((item) => ({ ...item, seen: true })));
    paintInboxDot();
  }
}

function renderProfile() {
  const me = profile();
  const liked = catalog().filter((video) => likes()[video.id]);
  const saved = catalog().filter((video) => saves()[video.id]);
  const list = profileTab === "liked" ? liked : saved;
  const cells = list.length
    ? list.map((video) => `<button type="button" data-action="open" data-id="${video.id}" style="background-image:url('${poster(video.id)}')" aria-label="${escapeHtml(video.caption)}"></button>`).join("")
    : `<div class="blank">${profileTab === "liked" ? "Videos you like will appear here." : "Saved videos will appear here."}</div>`;
  document.querySelector("#profile").innerHTML = `<div class="page"><div class="profile-head"><div class="avatar" style="--h:${hue(me.handle)}">${initial(me.name)}</div><h1 style="margin-bottom:4px">${escapeHtml(me.name)}</h1><p class="muted" style="margin-top:0">@${escapeHtml(me.handle)}</p><button class="ghost" type="button" data-action="edit-profile">Edit profile</button></div><div class="stats"><div><b>${compact(Object.keys(follows()).length)}</b><span>Following</span></div><div><b>0</b><span>Followers</span></div><div><b>${compact(liked.length)}</b><span>Likes</span></div></div><div class="subtabs" style="justify-content:center"><button type="button" data-action="profile-tab" data-tab="liked" class="${profileTab === "liked" ? "on" : ""}">Liked</button><button type="button" data-action="profile-tab" data-tab="saved" class="${profileTab === "saved" ? "on" : ""}">Saved</button></div>${list.length ? `<div class="grid">${cells}</div>` : cells}</div>`;
}

function openEditProfile() {
  const me = profile();
  openSheet(`<div class="grab"></div>
    <header>Edit profile<button type="button" data-action="close" aria-label="Close">×</button></header>
    <form class="stack" data-form="profile">
      <input name="name" maxlength="24" value="${escapeHtml(me.name)}" placeholder="Name" />
      <input name="handle" maxlength="24" value="${escapeHtml(me.handle)}" placeholder="username" />
      <button class="primary wide" type="submit">Save</button>
    </form>`);
}

function paintScreens() {
  document.querySelectorAll(".screen").forEach((el) => el.classList.toggle("on", el.id === screen));
  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.classList.toggle("on", button.dataset.screen === screen);
  });
}

function showScreen(name) {
  screen = name;
  paintScreens();
  if (name === "friends") renderFriends();
  if (name === "inbox") renderInbox();
  if (name === "profile") renderProfile();
  if (name === "feed") syncAll();
  else {
    for (const player of players.values()) {
      if (!ready.has(player)) continue;
      try { player.mute(); player.pauseVideo(); } catch { /* ignore */ }
    }
  }
}

function resultRow(video) {
  return `<button class="row" type="button" data-action="open" data-id="${video.id}"><span class="avatar" style="--h:${hue(video.handle)}">${initial(video.name)}</span><span><b>@${escapeHtml(video.handle)}</b><small>${escapeHtml(video.caption)}</small></span></button>`;
}

function openSearch() {
  searchOpen = true;
  searchLayer.hidden = false;
  searchLayer.innerHTML = `<div class="search-bar"><input type="search" placeholder="Search or paste a Shorts link" autocomplete="off" /><button type="button" data-action="close-search">Cancel</button></div><div class="results"></div>`;
  const input = searchLayer.querySelector("input");
  const results = searchLayer.querySelector(".results");
  const paint = () => {
    const query = input.value.trim().toLowerCase();
    const id = parseId(input.value);
    const extra = id ? `<button class="row" type="button" data-action="add-query"><span class="avatar" style="--h:330">+</span><span><b>Add this Short</b><small>${escapeHtml(id)}</small></span></button>` : "";
    const matches = catalog().filter((video) => {
      if (!query) return true;
      const blob = `${video.handle} ${video.name} ${video.caption}`.toLowerCase();
      return blob.includes(query);
    }).slice(0, 20);
    results.innerHTML = extra + (matches.map(resultRow).join("") || `<div class="blank">No videos match that.</div>`);
  };
  input.addEventListener("input", paint);
  paint();
  input.focus();
  syncAll();
}

function closeSearch() {
  searchOpen = false;
  searchLayer.hidden = true;
  searchLayer.innerHTML = "";
  syncAll();
}

function indexFromScroll() {
  const height = scroller.clientHeight || 1;
  return Math.max(0, Math.min(slideCount() - 1, Math.round(scroller.scrollTop / height)));
}

scroller.addEventListener("scroll", () => {
  if (!slideCount()) return;
  const index = indexFromScroll();
  if (index !== activeIndex) setActive(index);
}, { passive: true });

window.addEventListener("resize", () => {
  const index = activeIndex;
  sizeSlides();
  if (index >= 0) scroller.scrollTop = index * scroller.clientHeight;
  if (window.visualViewport && sheetOpen) {
    const inset = Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop);
    sheet.style.paddingBottom = inset ? inset + "px" : "";
  }
});

document.addEventListener("visibilitychange", () => syncAll());

let pointerStart = null;

scroller.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("[data-action='hit']")) return;
  pointerStart = { x: event.clientX, y: event.clientY };
});

app.addEventListener("pointerup", (event) => {
  if (!pointerStart || !event.target.closest("[data-action='hit']")) {
    pointerStart = null;
    return;
  }
  const dx = Math.abs(event.clientX - pointerStart.x);
  const dy = Math.abs(event.clientY - pointerStart.y);
  pointerStart = null;
  if (dx > 14 || dy > 14) return;
  onHit(event);
});

app.addEventListener("pointercancel", () => {
  pointerStart = null;
});

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.dataset.action === "hit") return;
  const action = target.dataset.action;
  const slide = target.closest(".slide");
  const id = target.dataset.id || slide?.dataset.id || activeId();
  if (action === "mode") {
    feedMode = target.dataset.mode;
    showScreen("feed");
    renderFeed(false);
  } else if (action === "screen") {
    closeSearch();
    if (target.dataset.screen === "feed" && screen === "feed") {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    showScreen(target.dataset.screen);
  } else if (action === "search") {
    openSearch();
  } else if (action === "close-search") {
    closeSearch();
  } else if (action === "sound") {
    enableSound();
  } else if (action === "like" && id) {
    toggleLike(id, false);
  } else if (action === "comment" && id) {
    openComments(id);
  } else if (action === "save" && id) {
    toggleSave(id);
  } else if (action === "share" && id) {
    openShare(id);
  } else if (action === "follow") {
    toggleFollow(target.dataset.handle);
    if (sheetOpen && commentFor == null) openCreator(target.dataset.handle);
  } else if (action === "creator") {
    openCreator(target.dataset.handle);
  } else if (action === "caption") {
    target.classList.toggle("open");
  } else if (action === "next") {
    go(1);
  } else if (action === "close") {
    closeSheet();
  } else if (action === "copy") {
    copyLink(target.dataset.url);
  } else if (action === "youtube") {
    window.open(target.dataset.url, "_blank", "noopener");
    closeSheet();
  } else if (action === "native-share") {
    nativeShare(target.dataset.url);
  } else if (action === "add") {
    openAdd();
  } else if (action === "add-query") {
    addShort(searchLayer.querySelector("input")?.value || "");
  } else if (action === "open" && id) {
    openVideo(id);
  } else if (action === "open-handle") {
    const first = catalog().find((video) => video.handle === target.dataset.handle);
    if (first) openVideo(first.id);
  } else if (action === "inbox-tab") {
    inboxTab = target.dataset.tab;
    renderInbox();
  } else if (action === "profile-tab") {
    profileTab = target.dataset.tab;
    renderProfile();
  } else if (action === "edit-profile") {
    openEditProfile();
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target;
  event.preventDefault();
  if (form.dataset.form === "comment") sendComment(form.elements.text.value);
  if (form.dataset.form === "add") addShort(form.elements.url.value);
  if (form.dataset.form === "profile") {
    const name = form.elements.name.value.trim() || "You";
    const handle = (form.elements.handle.value.trim() || "you").replace(/^@/, "").replace(/\s+/g, "");
    save("tt-profile", { name, handle });
    closeSheet();
    renderProfile();
    toast("Profile saved");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (searchOpen) closeSearch();
    else if (sheetOpen) closeSheet();
  }
  const typing = document.activeElement && /input|textarea/i.test(document.activeElement.tagName);
  if (typing || screen !== "feed") return;
  if (event.key === "ArrowDown") { event.preventDefault(); go(1); }
  if (event.key === "ArrowUp") { event.preventDefault(); go(-1); }
  if (event.key === " ") { event.preventDefault(); if (!soundOn) enableSound(); else togglePause(); }
  if (event.key === "l" || event.key === "L") { const id = activeId(); if (id) toggleLike(id, false); }
});

let ytSettled = false;
window.onYouTubeIframeAPIReady = () => {
  if (ytSettled) return;
  ytSettled = true;
  ytOk = true;
  if (screen === "feed") setActive(activeIndex < 0 ? 0 : activeIndex);
};
const ytScript = document.createElement("script");
ytScript.src = "https://www.youtube.com/iframe_api";
ytScript.onerror = () => toast("Can't reach YouTube right now");
document.head.appendChild(ytScript);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");

paintInboxDot();
renderFeed(false);
paintScreens();
