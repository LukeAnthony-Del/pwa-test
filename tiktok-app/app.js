const SHORTS_API = "https://yt.chocolatemoo53.com";
const CRED_KEY = "tt-fingerprint";
const TOPICS = ["cooking", "travel", "funny", "animals", "sports", "music", "food", "nature", "dance", "tech", "basketball", "ocean"];

function hashStats(id) {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h >>>= 0;
  return {
    likes: 1200 + (h % 850000),
    comments: 8 + (h % 9000),
    saves: 40 + (h % 70000),
    shares: 12 + (h % 20000),
  };
}

const STARTER = {
  id: "Q8m8dKKnHF4",
  handle: "BBCComedyGreats",
  name: "BBC Comedy Greats",
  authorId: "UC7foTxErVJKorAitAcJuqDA",
  caption: "Don't mention the war | Fawlty Towers | BBC Comedy Greats",
  ...hashStats("Q8m8dKKnHF4"),
};

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

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4c-.4 0-7.7-4.3-9.4-8.4C1.2 8.8 2.5 5.4 5.7 4.6c1.9-.5 3.7.3 5 2.1L12 8.2l1.3-1.5c1.3-1.8 3.1-2.6 5-2.1 3.2.8 4.5 4.2 3.1 7.4-1.7 4.1-9 8.4-9.4 8.4z" fill="currentColor"/></svg>';
const HEART_LINE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.6c-.3 0-6.6-3.7-8.1-7.2C2.7 9.6 3.8 6.7 6.5 6c1.6-.4 3.1.2 4.2 1.8L12 9.4l1.3-1.6c1.1-1.6 2.6-2.2 4.2-1.8 2.7.7 3.8 3.6 2.6 6.4-1.5 3.5-7.8 7.2-8.1 7.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
const COMMENT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.4a7.4 7.4 0 0 0-6.4 11.1l-1.2 2.9a.7.7 0 0 0 .9.9l2.9-1.2A7.4 7.4 0 1 0 12 4.4z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="8.7" cy="12" r="1.05" fill="currentColor"/><circle cx="12" cy="12" r="1.05" fill="currentColor"/><circle cx="15.3" cy="12" r="1.05" fill="currentColor"/></svg>';
const BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.2h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.2a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const BOOK_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.2h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.2a1 1 0 0 1 1-1z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.8 4.2c.5-.5 1.4-.1 1.4.6v2.2c2.4.3 6.2 1.8 6.6 6.1.1.8-.8 1.2-1.3.6-1.4-1.6-3.4-2.5-5.3-2.7v2.6c0 .7-.9 1.1-1.4.6l-6.7-5.6a.8.8 0 0 1 0-1.2l6.7-5.2z" fill="currentColor"/></svg>';
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
let unlocked = false;
let fingerBusy = false;
let installPrompt = null;
let creatorToken = 0;
let searchTimer = 0;
let searchToken = 0;
let searchTerm = "";
let searchPage = 1;
let searchDone = false;
let followTurn = 0;
const sessionFriends = [];
const manual = [];
const live = [];
const followingVideos = [];
const searchVideos = [];
const followJobs = [];
const channelCache = new Map();
const knownVideos = new Map();
knownVideos.set(STARTER.id, STARTER);
let pool = [];
let poolCursor = 0;
let poolReady = false;
let pumping = false;
let liveFailed = false;
let topicIndex = 0;
const channelJobs = [];

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

function decodeText(value) {
  let text = String(value ?? "");
  const box = document.createElement("textarea");
  for (let i = 0; i < 2; i++) {
    box.innerHTML = text;
    if (box.value === text) break;
    text = box.value;
  }
  return text;
}

function escapeHtml(value) {
  return decodeText(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[ch]));
}

function captionHtml(text) {
  return decodeText(text).split(/(#[\p{L}\p{N}_]+)/gu).map((part) => {
    if (/^#[\p{L}\p{N}_]+$/u.test(part)) return `<b class="tag">${escapeHtml(part)}</b>`;
    return escapeHtml(part);
  }).join("");
}

function cssUrl(url) {
  return String(url || "").replace(/["\\()]/g, "");
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

const watchedIds = new Set((load("tt-seen", []) || []).filter((id) => isId(id) && id !== STARTER.id));
const sessionIds = new Set();

function holdId(id) {
  if (isId(id)) sessionIds.add(id);
}

function skipFetched(id) {
  return !isId(id) || id === STARTER.id || watchedIds.has(id) || sessionIds.has(id);
}

function watchId(id) {
  if (!unlocked || !isId(id) || id === STARTER.id || watchedIds.has(id)) return;
  watchedIds.add(id);
  save("tt-seen", [...watchedIds].slice(-5000));
}

function everyVideo() {
  const seen = new Set();
  const list = [];
  for (const video of [STARTER, ...manual, ...live, ...followingVideos, ...searchVideos, ...knownVideos.values()]) {
    if (!video || !isId(video.id) || seen.has(video.id)) continue;
    seen.add(video.id);
    list.push(video);
  }
  return list;
}

function currentList() {
  if (feedMode === "search") return searchVideos;
  if (feedMode === "following") {
    const followed = follows();
    if (unlocked) return followingVideos;
    return [STARTER, ...manual].filter((video) => followed[video.handle]);
  }
  if (!unlocked) return [STARTER, ...manual];
  return [...manual, ...live].filter((video) => video.id !== STARTER.id);
}

function videoById(id) {
  return knownVideos.get(id) || everyVideo().find((video) => video.id === id);
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
  const sound = `original sound - ${decodeText(video.name)}`;
  const photo = video.avatar ? ` has-photo" style="--h:${hue(video.handle)};background-image:url('${cssUrl(video.avatar)}')` : `" style="--h:${hue(video.handle)}`;
  return `<article class="slide" data-id="${video.id}">
    <div class="stage">
      <img class="poster" alt="" src="${poster(video.id)}" data-fallback="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" />
    </div>
    <div class="hit" data-action="hit"></div>
    <div class="scrim"></div>
    <div class="pause-icon">${PLAY}</div>
    <div class="err">
      <p>This Short can't play here</p>
      <button type="button" data-action="next">Next</button>
    </div>
    <div class="meta">
      <button class="handle" type="button" data-action="creator" data-handle="${escapeHtml(video.handle)}">@${escapeHtml(video.handle)}</button>
      <p class="caption" data-action="caption">${captionHtml(video.caption)}</p>
      <div class="sound">${NOTE}<div class="marquee"><span>${escapeHtml(sound)}</span></div></div>
    </div>
    <div class="rail">
      <div class="avatar-wrap${followed ? " followed" : ""}">
        <button class="avatar${photo}" type="button" data-action="creator" data-handle="${escapeHtml(video.handle)}" aria-label="${escapeHtml(video.name)}">${initial(video.name)}</button>
        <button class="plus" type="button" data-action="follow" data-handle="${escapeHtml(video.handle)}" aria-label="Follow">+</button>
      </div>
      <button type="button" data-action="like" class="${liked ? "on" : ""}" aria-label="Like">${liked ? HEART : HEART_LINE}<span class="like-count">${compact(video.likes + (liked ? 1 : 0))}</span></button>
      <button type="button" data-action="comment" aria-label="Comments">${COMMENT}<span class="comment-count">${compact(video.comments + (comments()[video.id] || []).length)}</span></button>
      <button type="button" data-action="save" class="save${saved ? " on" : ""}" aria-label="Save">${saved ? BOOK_ON : BOOK}<span class="save-count">${compact(video.saves + (saved ? 1 : 0))}</span></button>
      <button type="button" data-action="share" aria-label="Share">${SHARE}<span>${compact(video.shares)}</span></button>
      <div class="disc" style="background-image:url('${poster(video.id)}')" aria-hidden="true"></div>
    </div>
  </article>`;
}

function bindPosters() {
  scroller.querySelectorAll(".poster").forEach((img) => {
    if (img.dataset.bound) return;
    img.dataset.bound = "1";
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

function shouldPlay() {
  return screen === "feed" && !searchOpen && !document.hidden;
}

function frameSrc(id, autoplay) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    controls: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    fs: "0",
    disablekb: "1",
    iv_load_policy: "3",
    cc_load_policy: "0",
    enablejsapi: "1",
    origin: location.origin,
  });
  return `https://www.youtube.com/embed/${id}?${params}`;
}

function commandFrame(frame, func, args) {
  if (!frame?.contentWindow) return;
  frame.contentWindow.postMessage(JSON.stringify({
    event: "command",
    func,
    args: args || [],
  }), "*");
}

function preloadFrame(index) {
  const slide = slideAt(index);
  if (!slide || slide.querySelector("iframe")) return;
  const iframe = document.createElement("iframe");
  iframe.className = "holder";
  iframe.title = "Short";
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  const startNow = index === activeIndex || index === activeIndex + 1;
  iframe.src = frameSrc(slide.dataset.id, startNow);
  iframe.addEventListener("load", () => {
    iframe.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: iframe.id || String(index) }), "*");
    commandFrame(iframe, "unloadModule", ["captions"]);
    syncOne(index);
  });
  slide.querySelector(".stage").appendChild(iframe);
}

function warmIndexes(index) {
  const count = slideCount();
  const list = [];
  for (const offset of [0, 1, 2, -1]) {
    const next = index + offset;
    if (next >= 0 && next < count && !list.includes(next)) list.push(next);
  }
  return list;
}

function syncOne(index) {
  const slide = slideAt(index);
  const frame = slide?.querySelector("iframe");
  if (!slide || !frame) return;
  const active = index === activeIndex;
  const warm = index === activeIndex + 1;
  const play = shouldPlay() && ((active && !userPaused) || warm);
  slide.classList.toggle("is-active", active);
  if (play) {
    commandFrame(frame, "mute");
    commandFrame(frame, "playVideo");
    if (active && soundOn && !userPaused) commandFrame(frame, "unMute");
  } else {
    commandFrame(frame, "mute");
    commandFrame(frame, "pauseVideo");
  }
}

function syncAll() {
  const keep = new Set(warmIndexes(Math.max(activeIndex, 0)));
  scroller.querySelectorAll(".slide").forEach((slide, index) => {
    if (!keep.has(index)) slide.querySelector("iframe")?.remove();
  });
  keep.forEach((index) => preloadFrame(index));
  keep.forEach((index) => syncOne(index));
}

function pumpIfNeeded(index) {
  if (!unlocked || index < slideCount() - 2) return;
  if (feedMode === "foryou") pumpLive();
  else if (feedMode === "following") pumpFollowing();
  else if (feedMode === "search") pumpSearch();
}

function setActive(index) {
  if (index < 0 || !slideCount()) return;
  if (index === activeIndex) {
    syncAll();
    pumpIfNeeded(index);
    return;
  }
  userPaused = false;
  activeIndex = index;
  scroller.querySelectorAll(".slide").forEach((slide) => slide.classList.remove("is-paused", "is-active"));
  const slide = slideAt(index);
  slide?.classList.add("is-active");
  if (slide?.dataset.id) watchId(slide.dataset.id);
  const handle = slide?.querySelector("[data-action='creator']")?.dataset.handle;
  if (handle) resolveChannel(handle).then((meta) => { if (meta) paintAvatar(handle, meta); });
  syncAll();
  pumpIfNeeded(index);
}

function enableSound() {
  soundOn = true;
  soundBtn.hidden = true;
  userPaused = false;
  slideAt(activeIndex)?.classList.remove("is-paused");
  syncOne(activeIndex);
}

function togglePause() {
  const slide = slideAt(activeIndex);
  const frame = slide?.querySelector("iframe");
  if (!slide || !frame) return;
  if (slide.classList.contains("is-playing") && !userPaused) {
    userPaused = true;
    slide.classList.add("is-paused");
    commandFrame(frame, "pauseVideo");
  } else {
    userPaused = false;
    slide.classList.remove("is-paused");
    if (soundOn) commandFrame(frame, "unMute");
    commandFrame(frame, "playVideo");
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
  if (map[handle]) {
    delete map[handle];
    const jobAt = followJobs.findIndex((job) => job.handle === handle);
    if (jobAt >= 0) followJobs.splice(jobAt, 1);
  } else {
    const video = everyVideo().find((item) => item.handle === handle);
    map[handle] = {
      handle,
      name: video?.name || handle,
      authorId: video?.authorId || "",
      avatar: video?.avatar || "",
      description: "",
    };
    pushActivity(`You followed @${handle}`);
    resolveChannel(handle).then((meta) => { if (meta) paintAvatar(handle, meta); });
  }
  save("tt-follows", map);
  scroller.querySelectorAll("[data-handle]").forEach((node) => {
    if (node.dataset.handle !== handle) return;
    node.closest(".avatar-wrap")?.classList.toggle("followed", !!map[handle]);
  });
  toast(map[handle] ? "Following" : "Unfollowed");
  if (feedMode === "following") setFeedMode("following");
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

function creatorSheet(handle, name, description, avatar, followed, videos) {
  const photo = avatar ? ` has-photo" style="--h:${hue(handle)};background-image:url('${cssUrl(avatar)}')` : `" style="--h:${hue(handle)}`;
  const bio = description ? `<p class="bio">${escapeHtml(description)}</p>` : "";
  const grid = videos.length
    ? `<div class="grid">${videos.map((video) => `<button type="button" data-action="open" data-id="${video.id}" style="background-image:url('${poster(video.id)}')" aria-label="${escapeHtml(video.caption)}"></button>`).join("")}</div>`
    : "";
  return `<div class="grab"></div>
    <header>@${escapeHtml(handle)}<button type="button" data-action="close" aria-label="Close">×</button></header>
    <div class="body">
      <div class="profile-head">
        <div class="avatar${photo}">${initial(name)}</div>
        <h2 style="margin:0">${escapeHtml(name)}</h2>
        <p class="muted">@${escapeHtml(handle)}</p>
        ${bio}
        <button class="follow${followed ? " on" : ""}" type="button" data-action="follow" data-handle="${escapeHtml(handle)}">${followed ? "Following" : "Follow"}</button>
      </div>
      ${grid}
    </div>`;
}

async function openCreator(handle) {
  const known = everyVideo().filter((video) => video.handle === handle);
  const person = known[0] || { name: handle, avatar: "" };
  const saved = follows()[handle];
  const savedMeta = saved && saved !== true ? saved : null;
  const token = ++creatorToken;
  openSheet(creatorSheet(handle, savedMeta?.name || person.name, savedMeta?.description || "", savedMeta?.avatar || person.avatar || "", !!saved, known));
  const meta = await resolveChannel(handle);
  if (!meta || token !== creatorToken || !sheetOpen) return;
  let shorts = known;
  try {
    const data = await fetchJson(`${SHORTS_API}/api/v1/channels/${meta.authorId}/shorts`);
    const extra = (data.videos || []).slice(0, 18).filter((item) => isId(item.videoId)).map((item) => asVideo({
      id: item.videoId,
      handle,
      name: meta.name,
      caption: item.title,
      authorId: meta.authorId,
      avatar: meta.avatar,
    }));
    if (extra.length) shorts = extra;
  } catch { /* keep the videos already on screen */ }
  if (token !== creatorToken || !sheetOpen) return;
  openSheet(creatorSheet(handle, meta.name || person.name, meta.description || "", meta.avatar || "", !!follows()[handle], shorts));
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
  if (currentList().some((video) => video.id === id) || manual.some((video) => video.id === id)) {
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
  const video = asVideo({ id, handle, name: author, caption: title });
  holdId(id);
  manual.unshift(video);
  closeSheet();
  feedMode = "foryou";
  screen = "feed";
  paintScreens();
  renderFeed(false);
  toast("Added to your feed");
}

function openVideo(id) {
  const video = videoById(id);
  if (!video) return;
  if (!currentList().some((item) => item.id === id)) {
    holdId(id);
    manual.unshift(video);
    feedMode = "foryou";
  }
  closeSheet();
  closeSearch();
  showScreen("feed");
  renderFeed(false);
  const index = currentList().findIndex((item) => item.id === id);
  if (index >= 0) {
    scroller.scrollTop = index * scroller.clientHeight;
    setActive(index);
  }
}

function asVideo(raw) {
  const video = {
    ...hashStats(raw.id),
    id: raw.id,
    handle: String(raw.handle || "youtube").replace(/^@/, ""),
    name: decodeText(raw.name || "YouTube"),
    caption: decodeText(raw.caption || "Short"),
    authorId: raw.authorId || "",
    avatar: raw.avatar || "",
  };
  const prior = knownVideos.get(video.id);
  if (prior) {
    prior.name = video.name || prior.name;
    prior.caption = video.caption || prior.caption;
    prior.authorId = prior.authorId || video.authorId;
    prior.avatar = prior.avatar || video.avatar;
    if (video.handle && video.handle !== "youtube") prior.handle = video.handle;
    return prior;
  }
  knownVideos.set(video.id, video);
  return video;
}

function bestThumb(list) {
  if (!Array.isArray(list) || !list.length) return "";
  return [...list].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || "";
}

function paintAvatar(handle, meta) {
  if (!meta?.avatar) return;
  document.querySelectorAll(".avatar").forEach((node) => {
    if (node.dataset.handle !== handle) return;
    node.classList.add("has-photo");
    node.style.backgroundImage = `url("${cssUrl(meta.avatar)}")`;
  });
}

function normHandle(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function resolveChannel(handle) {
  if (!handle) return null;
  if (channelCache.has(handle)) return channelCache.get(handle);
  const job = fetchChannel(handle);
  channelCache.set(handle, job);
  return job;
}

async function fetchChannel(handle) {
  try {
    const video = everyVideo().find((item) => item.handle === handle && item.authorId);
    const saved = follows()[handle];
    let authorId = (saved && saved.authorId) || video?.authorId || "";
    if (!authorId) {
      const list = await fetchJson(`${SHORTS_API}/api/v1/search?q=${encodeURIComponent(handle)}&type=channel`);
      const items = Array.isArray(list) ? list : [];
      const wanted = normHandle(handle);
      const hit = items.find((item) => normHandle(item.author) === wanted || normHandle(item.authorUrl).includes(wanted)) || items[0];
      authorId = hit?.authorId || "";
    }
    if (!authorId) return null;
    const full = await fetchJson(`${SHORTS_API}/api/v1/channels/${authorId}`);
    const record = {
      handle,
      authorId,
      name: decodeText(full.author || handle),
      description: decodeText(full.description || ""),
      avatar: bestThumb(full.authorThumbnails),
    };
    const map = follows();
    if (map[handle]) {
      map[handle] = record;
      save("tt-follows", map);
    }
    everyVideo().forEach((item) => {
      if (item.handle === handle && record.avatar) item.avatar = record.avatar;
    });
    paintAvatar(handle, record);
    return record;
  } catch {
    channelCache.delete(handle);
    return null;
  }
}

function isSimon(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase() === "simon devera";
}

function bytesToB64(bytes) {
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64ToBytes(value) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyFingerprint() {
  if (!window.PublicKeyCredential || !navigator.credentials) return "unsupported";
  const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  if (!available) return "unsupported";
  const saved = localStorage.getItem(CRED_KEY);
  if (!saved) {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "TikTok" },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "phone",
          displayName: "Phone",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    });
    if (!cred) return false;
    localStorage.setItem(CRED_KEY, bytesToB64(new Uint8Array(cred.rawId)));
    return true;
  }
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: "public-key", id: b64ToBytes(saved) }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  return Boolean(assertion);
}

async function loadPool() {
  if (poolReady) return;
  try {
    const response = await fetch("./shorts.json");
    if (response.ok) pool = await response.json();
  } catch { /* The live Shorts source can still continue the feed. */ }
  poolReady = true;
}

function takePool(count) {
  const out = [];
  while (out.length < count && poolCursor < pool.length) {
    const raw = pool[poolCursor++];
    if (skipFetched(raw.id)) continue;
    holdId(raw.id);
    out.push(asVideo(raw));
  }
  return out;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function fetchLiveBatch(want) {
  const found = [];
  let guard = 0;
  while (found.length < want && guard < 8) {
    guard += 1;
    if (!channelJobs.length) {
      const topic = TOPICS[topicIndex % TOPICS.length];
      topicIndex += 1;
      const channels = await fetchJson(`${SHORTS_API}/api/v1/search?q=${encodeURIComponent(topic)}&type=channel`);
      const channel = (Array.isArray(channels) ? channels : []).find((item) => item.authorId);
      if (!channel) continue;
      channelJobs.push({ id: channel.authorId, continuation: "" });
    }
    const job = channelJobs[0];
    const path = job.continuation
      ? `${SHORTS_API}/api/v1/channels/${job.id}/shorts?continuation=${encodeURIComponent(job.continuation)}`
      : `${SHORTS_API}/api/v1/channels/${job.id}/shorts`;
    let data;
    try {
      data = await fetchJson(path);
    } catch {
      channelJobs.shift();
      continue;
    }
    const videos = Array.isArray(data.videos) ? data.videos : [];
    if (data.continuation) job.continuation = data.continuation;
    else channelJobs.shift();
    if (!videos.length) continue;
    for (const item of videos) {
      const seconds = item.lengthSeconds || 0;
      if (skipFetched(item.videoId) || seconds > 70) continue;
      holdId(item.videoId);
      found.push(asVideo({
        id: item.videoId,
        handle: String(item.author || "youtube").replace(/\s+/g, "").slice(0, 28),
        name: item.author || "YouTube",
        caption: item.title || "Short",
        authorId: item.authorId || job.id,
        avatar: bestThumb(item.authorThumbnails),
      }));
      if (found.length >= want) break;
    }
  }
  return found;
}

function appendSlides(videos) {
  if (!videos.length || !scroller.querySelector(".slide")) return;
  const chunk = document.createElement("div");
  chunk.innerHTML = videos.map((video) => slideHtml(video)).join("");
  const slides = [...chunk.children];
  slides.forEach((slide) => scroller.appendChild(slide));
  bindPosters();
  sizeSlides();
  syncAll();
}

async function pumpLive() {
  if (!unlocked || pumping) return;
  const pooled = takePool(8);
  if (pooled.length) {
    live.push(...pooled);
    if (screen === "feed" && feedMode === "foryou") appendSlides(pooled);
    return;
  }
  pumping = true;
  try {
    const fresh = await fetchLiveBatch(8);
    if (!fresh.length) return;
    live.push(...fresh);
    if (screen === "feed" && feedMode === "foryou") appendSlides(fresh);
  } catch {
    if (!liveFailed) {
      liveFailed = true;
      toast("Couldn't load more Shorts");
    }
  } finally {
    pumping = false;
  }
}

async function startUnlimited() {
  await loadPool();
  const first = takePool(10);
  live.push(...first);
  feedMode = "foryou";
  showScreen("feed");
  renderFeed(false);
  pumpLive();
}

async function fetchFollowBatch(want) {
  const handles = Object.keys(follows());
  for (const handle of handles) {
    if (followJobs.some((job) => job.handle === handle)) continue;
    const saved = follows()[handle];
    const authorId = saved && saved.authorId;
    if (authorId) {
      followJobs.push({ handle, authorId, name: saved.name || handle, continuation: "", stall: 0 });
    } else {
      const meta = await resolveChannel(handle);
      if (meta?.authorId) followJobs.push({ handle, authorId: meta.authorId, name: meta.name || handle, continuation: "", stall: 0 });
    }
  }
  for (let i = followJobs.length - 1; i >= 0; i--) {
    if (!follows()[followJobs[i].handle]) followJobs.splice(i, 1);
  }
  const found = [];
  let guard = 0;
  while (found.length < want && followJobs.length && guard < 8) {
    guard += 1;
    const job = followJobs[followTurn % followJobs.length];
    followTurn += 1;
    const path = job.continuation
      ? `${SHORTS_API}/api/v1/channels/${job.authorId}/shorts?continuation=${encodeURIComponent(job.continuation)}`
      : `${SHORTS_API}/api/v1/channels/${job.authorId}/shorts`;
    let data;
    try {
      data = await fetchJson(path);
    } catch {
      job.dead = true;
      continue;
    }
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const previous = job.continuation;
    if (data.continuation && data.continuation !== previous) job.continuation = data.continuation;
    else if (!data.continuation) job.dead = true;
    let added = 0;
    for (const item of videos) {
      const seconds = item.lengthSeconds || 0;
      if (skipFetched(item.videoId) || seconds > 70) continue;
      holdId(item.videoId);
      added += 1;
      found.push(asVideo({
        id: item.videoId,
        handle: job.handle,
        name: item.author || job.name,
        caption: item.title || "Short",
        authorId: item.authorId || job.authorId,
        avatar: follows()[job.handle]?.avatar || "",
      }));
      if (found.length >= want) break;
    }
    job.stall = added ? 0 : (job.stall || 0) + 1;
    if (job.stall >= 2) job.dead = true;
  }
  for (let i = followJobs.length - 1; i >= 0; i--) {
    if (followJobs[i].dead) followJobs.splice(i, 1);
  }
  return found;
}

async function pumpFollowing() {
  if (!unlocked || pumping) return;
  pumping = true;
  try {
    const fresh = await fetchFollowBatch(8);
    if (!fresh.length) return;
    followingVideos.push(...fresh);
    if (screen === "feed" && feedMode === "following" && scroller.querySelector(".slide")) appendSlides(fresh);
  } catch {
    toast("Couldn't load Shorts from people you follow");
  } finally {
    pumping = false;
  }
}

async function fetchSearchBatch(want) {
  const found = [];
  let guard = 0;
  while (found.length < want && !searchDone && guard < 5) {
    guard += 1;
    let data;
    try {
      data = await fetchJson(`${SHORTS_API}/api/v1/search?q=${encodeURIComponent(searchTerm)}&type=video&duration=short&page=${searchPage}`);
    } catch {
      searchDone = true;
      break;
    }
    searchPage += 1;
    const items = Array.isArray(data) ? data : [];
    if (!items.length) {
      searchDone = true;
      break;
    }
    for (const item of items) {
      const seconds = item.lengthSeconds || 0;
      if (skipFetched(item.videoId) || seconds > 70) continue;
      holdId(item.videoId);
      found.push(asVideo({
        id: item.videoId,
        handle: String(item.author || "youtube").replace(/\s+/g, "").slice(0, 28),
        name: item.author || "YouTube",
        caption: item.title || "Short",
        authorId: item.authorId || "",
        avatar: bestThumb(item.authorThumbnails),
      }));
      if (found.length >= want) break;
    }
    if (searchPage > 12) searchDone = true;
  }
  return found;
}

async function pumpSearch() {
  if (pumping || searchDone || !searchTerm) return;
  pumping = true;
  try {
    const fresh = await fetchSearchBatch(8);
    if (!fresh.length) return;
    searchVideos.push(...fresh);
    if (screen === "feed" && feedMode === "search" && scroller.querySelector(".slide")) appendSlides(fresh);
  } catch {
    toast("Couldn't load more Shorts");
  } finally {
    pumping = false;
  }
}

async function runSearch(term) {
  const clean = decodeText(term).trim();
  if (!clean) return;
  searchTerm = clean;
  searchPage = 1;
  searchDone = false;
  searchVideos.splice(0);
  feedMode = "search";
  closeSearch();
  showScreen("feed");
  document.querySelectorAll("[data-mode]").forEach((button) => button.classList.remove("on"));
  scroller.innerHTML = `<div class="empty"><h2>Searching</h2><p>${escapeHtml(clean)}</p></div>`;
  const fresh = await fetchSearchBatch(8);
  if (feedMode !== "search" || searchTerm !== clean) return;
  searchVideos.push(...fresh);
  renderFeed(false);
  if (!fresh.length) toast("No Shorts for that");
}

async function setFeedMode(mode) {
  feedMode = mode;
  showScreen("feed");
  if (mode === "following" && unlocked && !followingVideos.length) {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.classList.toggle("on", button.dataset.mode === "following");
    });
    scroller.innerHTML = `<div class="empty"><h2>Loading Shorts</h2><p>From people you follow.</p></div>`;
    await pumpFollowing();
    if (feedMode !== "following") return;
  }
  renderFeed(false);
}

async function addFriend(name) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return;
  if (sessionFriends.some((person) => person.name.toLowerCase() === clean.toLowerCase())) {
    toast("Already added");
    return;
  }
  if (!isSimon(clean)) {
    sessionFriends.push({ name: clean });
    renderFriends();
    return;
  }
  if (fingerBusy) return;
  fingerBusy = true;
  toast("Use your fingerprint");
  try {
    const ok = await verifyFingerprint();
    if (ok === "unsupported") {
      toast("This phone has no fingerprint or face unlock");
      return;
    }
    if (!ok) {
      toast("Fingerprint didn't unlock the feed");
      return;
    }
    sessionFriends.push({ name: "Simon Devera" });
    unlocked = true;
    renderFriends();
    toast("Feed unlocked");
    await startUnlimited();
  } catch {
    toast("Fingerprint didn't unlock the feed");
  } finally {
    fingerBusy = false;
  }
}

function renderFriends() {
  const rows = sessionFriends.map((person) => `<div class="row"><div class="avatar" style="--h:${hue(person.name)}">${initial(person.name)}</div><div><b>${escapeHtml(person.name)}</b><small>${isSimon(person.name) ? "Feed unlocked" : "Friend"}</small></div></div>`).join("");
  document.querySelector("#friends").innerHTML = `<div class="page"><h1>Friends</h1><form class="add-friend" data-form="friend"><input name="name" maxlength="40" placeholder="Add a person" autocomplete="off" enterkeyhint="done" /><button type="submit">Add</button></form>${rows || `<p class="muted">People you add show up here.</p>`}</div>`;
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
  const liked = everyVideo().filter((video) => likes()[video.id]);
  const saved = everyVideo().filter((video) => saves()[video.id]);
  const list = profileTab === "liked" ? liked : saved;
  const cells = list.length
    ? list.map((video) => `<button type="button" data-action="open" data-id="${video.id}" style="background-image:url('${poster(video.id)}')" aria-label="${escapeHtml(video.caption)}"></button>`).join("")
    : `<div class="blank">${profileTab === "liked" ? "Videos you like will appear here." : "Saved videos will appear here."}</div>`;
  const installLabel = installedAlready() ? "Installed" : "Install";
  document.querySelector("#profile").innerHTML = `<div class="page"><div class="profile-head"><div class="avatar" style="--h:${hue(me.handle)}">${initial(me.name)}</div><h1 style="margin-bottom:4px">${escapeHtml(me.name)}</h1><p class="muted" style="margin-top:0">@${escapeHtml(me.handle)}</p><button class="ghost" type="button" data-action="edit-profile">Edit profile</button><button class="primary install-btn" type="button" data-action="install">${installLabel}</button></div><div class="stats"><div><b>${compact(Object.keys(follows()).length)}</b><span>Following</span></div><div><b>0</b><span>Followers</span></div><div><b>${compact(liked.length)}</b><span>Likes</span></div></div><div class="subtabs" style="justify-content:center"><button type="button" data-action="profile-tab" data-tab="liked" class="${profileTab === "liked" ? "on" : ""}">Liked</button><button type="button" data-action="profile-tab" data-tab="saved" class="${profileTab === "saved" ? "on" : ""}">Saved</button></div>${list.length ? `<div class="grid">${cells}</div>` : cells}</div>`;
}

function installedAlready() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

async function installApp() {
  if (installedAlready()) {
    toast("Already on your home screen");
    return;
  }
  if (installPrompt) {
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* The prompt was dismissed. */ }
    installPrompt = null;
    if (screen === "profile") renderProfile();
    return;
  }
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    openSheet(`<div class="grab"></div><header>Install<button type="button" data-action="close" aria-label="Close">×</button></header><div class="body"><p>In Safari, tap Share, then <b>Add to Home Screen</b>.</p></div>`);
    return;
  }
  toast("Open the browser menu and choose Install app");
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
    scroller.querySelectorAll("iframe").forEach((frame) => {
      commandFrame(frame, "mute");
      commandFrame(frame, "pauseVideo");
    });
  }
}

function resultRow(video) {
  return `<button class="row" type="button" data-action="open" data-id="${video.id}"><span class="avatar" style="--h:${hue(video.handle)}">${initial(video.name)}</span><span><b>@${escapeHtml(video.handle)}</b><small>${escapeHtml(video.caption)}</small></span></button>`;
}

function openSearch() {
  searchOpen = true;
  searchLayer.hidden = false;
  searchLayer.innerHTML = `<div class="search-bar"><input type="search" placeholder="Search Shorts" autocomplete="off" enterkeyhint="search" /><button type="button" data-action="close-search">Cancel</button></div><div class="results"></div>`;
  const input = searchLayer.querySelector("input");
  const results = searchLayer.querySelector(".results");
  const paint = async () => {
    const token = ++searchToken;
    const query = input.value.trim();
    const id = parseId(query);
    if (!query) {
      results.innerHTML = `<div class="blank">Search for a sound, a creator, or a topic.</div>`;
      return;
    }
    if (id) {
      results.innerHTML = `<button class="row" type="button" data-action="add-query"><span class="avatar" style="--h:330">+</span><span><b>Add this Short</b><small>${escapeHtml(id)}</small></span></button>`;
      return;
    }
    results.innerHTML = `<div class="blank">Looking for “${escapeHtml(query)}”…</div>`;
    let suggestions = [query];
    try {
      const data = await fetchJson(`${SHORTS_API}/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
      if (Array.isArray(data.suggestions) && data.suggestions.length) suggestions = data.suggestions.slice(0, 12);
    } catch { /* The typed words are still a search. */ }
    if (token !== searchToken) return;
    results.innerHTML = suggestions.map((item) => `<button class="suggest" type="button" data-action="suggest" data-q="${escapeHtml(item)}"><b>${escapeHtml(item)}</b><small>Shorts</small></button>`).join("");
  };
  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(paint, 180);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const id = parseId(input.value);
    if (id) addShort(input.value);
    else runSearch(input.value);
  });
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
    setFeedMode(target.dataset.mode);
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
  } else if (action === "suggest") {
    runSearch(target.dataset.q || "");
  } else if (action === "open" && id) {
    openVideo(id);
  } else if (action === "install") {
    installApp();
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
  if (form.dataset.form === "friend") addFriend(form.elements.name.value);
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

window.addEventListener("message", (event) => {
  if (!String(event.origin).includes("youtube.com")) return;
  let data = event.data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { return; }
  }
  if (!data || typeof data !== "object") return;
  const frame = [...scroller.querySelectorAll("iframe")].find((node) => node.contentWindow === event.source);
  const slide = frame?.closest(".slide");
  if (!slide) return;
  const state = data.event === "onStateChange"
    ? Number(data.info)
    : (data.event === "infoDelivery" ? Number(data.info?.playerState) : NaN);
  if (state === 1) {
    slide.classList.add("is-playing");
    commandFrame(frame, "unloadModule", ["captions"]);
    if (slide.classList.contains("is-active") && !userPaused) slide.classList.remove("is-paused");
  }
  if (state === 0) {
    commandFrame(frame, "seekTo", [0, true]);
    commandFrame(frame, "playVideo");
  }
  if (data.event === "onError") {
    const code = Number(data.info);
    if (code === 5) return;
    slide.classList.add("is-error");
    const slides = [...scroller.querySelectorAll(".slide")];
    const index = slides.indexOf(slide);
    if (index === activeIndex && slides.length > 1) {
      setTimeout(() => {
        if (index === activeIndex) go(index >= slides.length - 1 ? -1 : 1);
      }, 400);
    }
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  if (screen === "profile") renderProfile();
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  toast("Installed");
  if (screen === "profile") renderProfile();
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  unlocked = false;
  sessionFriends.splice(0);
  manual.splice(0);
  live.splice(0);
  followingVideos.splice(0);
  searchVideos.splice(0);
  followJobs.splice(0);
  poolCursor = 0;
  sessionIds.clear();
  feedMode = "foryou";
  searchTerm = "";
  renderFeed(false);
});

paintInboxDot();
renderFeed(false);
paintScreens();
