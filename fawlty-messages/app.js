/* Fawlty Messages
   Each device listens on ntfy topic fawlty-u-CODE.
   Direct messages are published to the other person's topic.
   Each group uses fawlty-g-CODE. Members publish there once.
   Payloads are JSON objects with v:1. */
(function () {
  "use strict";

  const STORAGE_KEY = "fawlty-messages-v1";
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const USER_PREFIX = "fawlty-u-";
  const GROUP_PREFIX = "fawlty-g-";
  const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const EMOJIS = ["😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😭", "👍", "👎", "❤️", "🔥", "🎉", "🙏", "😮", "😢", "😎", "🤝", "✅", "👀", "💯", "🏨", "🔔", "☕"];
  const PALETTE = ["#6f2430", "#3e5c4b", "#3d4f6f", "#6a4b3a", "#6e3d4a", "#3e5d57", "#5c5340", "#2f4a44"];
  const ICONS = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    emoji: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 10.2h.01M15 10.2h.01M8.8 14.2c.8 1.2 2 1.8 3.2 1.8s2.4-.6 3.2-1.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  const $ = (id) => document.getElementById(id);
  const conns = new Map();
  const wanted = new Set();
  const retryCount = new Map();
  const retryTimers = new Map();
  const receiptTimers = new Map();
  const limits = new Map();

  let state = null;
  let seen = new Set();
  let openId = "";
  let pickId = "";
  let reply = null;
  let chips = [];
  let batchDepth = 0;
  let deferredPrompt = null;
  let toastTimer = 0;
  let persistTimer = 0;
  let lastRefresh = 0;
  let refreshTimer = 0;
  let pressTimer = 0;
  let pressX = 0;
  let pressY = 0;
  let suppressClick = false;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else node.setAttribute(key, value);
    });
    for (const child of [].concat(children || [])) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function icon(name) {
    const span = document.createElement("span");
    span.className = "icon";
    span.innerHTML = ICONS[name] || "";
    return span;
  }

  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function hash(value) {
    let h = 2166136261;
    const text = String(value);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function randomCode() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  }

  function isCode(value) {
    return typeof value === "string" && value.length === 8 && [...value].every((ch) => ALPHABET.includes(ch));
  }

  function classifyCode(input) {
    const raw = String(input || "").trim().toUpperCase();
    const group = raw.includes("FAWLTY-G-") || /^G[: ]/.test(raw);
    let s = raw.replace(/^HTTPS?:\/\/(?:WWW\.)?NTFY\.SH\//, "");
    s = s.replace(/^FAWLTY-U-/, "").replace(/^FAWLTY-G-/, "");
    s = s.replace(/[^A-Z0-9]/g, "");
    if (s.length > 8 && s.startsWith("FAWLTYU")) s = s.slice(7);
    if (s.length > 8 && s.startsWith("FAWLTYG")) s = s.slice(7);
    if (!isCode(s)) return { code: "", group };
    return { code: s, group };
  }

  function pretty(code) {
    const s = String(code || "");
    return s.length === 8 ? s.slice(0, 4) + "-" + s.slice(4) : s;
  }

  function cleanName(value) {
    return String(value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 32);
  }

  function cleanMessage(value) {
    return String(value || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, 2000);
  }

  function cleanEmoji(value) {
    const s = String(value || "");
    return s && s.length <= 16 ? s : "";
  }

  function ms(ts) {
    const n = Number(ts);
    if (!n) return Date.now();
    return n < 1e12 ? n * 1000 : n;
  }

  function userTopic(code) { return USER_PREFIX + code; }
  function groupTopic(code) { return GROUP_PREFIX + code; }
  function isUserTopic(topic) { return String(topic || "").startsWith(USER_PREFIX); }
  function isGroupTopic(topic) { return String(topic || "").startsWith(GROUP_PREFIX); }
  function topicFor(chat) { return chat.kind === "group" ? groupTopic(chat.code) : userTopic(chat.code); }
  function myName() { return cleanName(state.me.name) || "Guest"; }

  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 4200);
  }

  function failToast(err) {
    if (err && err.status === 429) toast("ntfy.sh is pausing messages. Wait a moment, then try again.");
    else if (err && err.status === 413) toast("That message is too long for ntfy.sh.");
    else toast("Couldn’t reach ntfy.sh. Try again.");
  }

  function blankDm(code) {
    return {
      id: "d:" + code, kind: "dm", code, nick: "", peerName: "", gname: "", admin: "", members: [],
      messages: [], unread: 0, unreadMark: "", updated: Date.now(), pin: false, mute: false,
      draft: "", readUptoTs: 0, pendingRead: "", sentRead: "", closed: "",
    };
  }

  function blankGroup(code, gname) {
    return {
      id: "g:" + code, kind: "group", code, nick: "", peerName: "", gname: cleanName(gname) || "Group",
      admin: "", members: [], messages: [], unread: 0, unreadMark: "", updated: Date.now(),
      pin: false, mute: false, draft: "", readUptoTs: 0, pendingRead: "", sentRead: "", closed: "",
    };
  }

  function hydrateChat(chat) {
    chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
    chat.members = Array.isArray(chat.members) ? chat.members : [];
    chat.draft = chat.draft || "";
    chat.unread = chat.unread || 0;
    chat.unreadMark = chat.unreadMark || "";
    chat.pendingRead = chat.pendingRead || "";
    chat.sentRead = chat.sentRead || "";
    chat.closed = chat.closed || "";
    chat.peerName = chat.peerName || "";
    chat.nick = chat.nick || "";
    chat.gname = chat.gname || (chat.kind === "group" ? "Group" : "");
    chat.admin = chat.admin || "";
    chat.pin = !!chat.pin;
    chat.mute = !!chat.mute;
    chat.readUptoTs = chat.readUptoTs || 0;
    chat.messages.forEach((msg) => {
      msg.reactions = msg.reactions || {};
      if (msg.hidden == null) msg.hidden = false;
      if (msg.deleted == null) msg.deleted = false;
    });
  }

  function loadState() {
    const fresh = () => ({ v: 1, me: { code: randomCode(), name: "" }, chats: {}, cursors: {}, seen: [], pending: [], dropped: [] });
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || typeof raw !== "object") return fresh();
      raw.v = 1;
      raw.me = raw.me || { code: "", name: "" };
      if (!isCode(raw.me.code)) raw.me.code = randomCode();
      raw.me.name = String(raw.me.name || "").slice(0, 32);
      raw.chats = raw.chats && typeof raw.chats === "object" ? raw.chats : {};
      raw.cursors = raw.cursors || {};
      raw.seen = Array.isArray(raw.seen) ? raw.seen : [];
      raw.pending = Array.isArray(raw.pending) ? raw.pending : [];
      raw.dropped = Array.isArray(raw.dropped) ? raw.dropped : [];
      Object.keys(raw.chats).forEach((id) => {
        const chat = raw.chats[id];
        if (!chat || !isCode(chat.code)) delete raw.chats[id];
        else hydrateChat(chat);
      });
      return raw;
    } catch (e) {
      return fresh();
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      Object.values(state.chats).forEach((chat) => {
        if (chat.messages.length > 80) chat.messages.splice(0, chat.messages.length - 80);
      });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch (e2) { toast("This device is out of room for messages."); }
    }
  }

  function persistSoon() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persist, 250);
  }

  function seedSeen() {
    seen = new Set(state.seen || []);
    Object.values(state.chats).forEach((chat) => chat.messages.forEach((msg) => msg.id && seen.add(msg.id)));
  }

  function markSeen(id) {
    if (!id || seen.has(id)) return;
    seen.add(id);
    state.seen.push(id);
    if (state.seen.length > 3000) state.seen.splice(0, state.seen.length - 2500);
  }

  function findMessage(chat, id) {
    if (!chat || !id) return null;
    for (let i = chat.messages.length - 1; i >= 0; i--) if (chat.messages[i].id === id) return chat.messages[i];
    return null;
  }

  function findAny(id) {
    for (const chat of Object.values(state.chats)) {
      const msg = findMessage(chat, id);
      if (msg) return { chat, msg };
    }
    return null;
  }

  function hasId(id) {
    return !!(id && (seen.has(id) || findAny(id)));
  }

  function trimChat(chat) {
    const extra = chat.messages.length - 400;
    if (extra <= 0) return;
    chat.messages.splice(0, extra).forEach((msg) => markSeen(msg.id));
  }

  function insertMessage(chat, msg) {
    if (!msg || !msg.id || hasId(msg.id)) return false;
    msg.ts = ms(msg.ts);
    let i = 0;
    while (i < chat.messages.length && chat.messages[i].ts <= msg.ts) i += 1;
    chat.messages.splice(i, 0, msg);
    markSeen(msg.id);
    chat.updated = Math.max(chat.updated || 0, msg.ts);
    trimChat(chat);
    return true;
  }

  function addSystem(chat, id, text, ts) {
    return insertMessage(chat, { id, system: true, text, ts: ts || Date.now(), hidden: false });
  }

  function titleOf(chat) {
    if (!chat) return "Fawlty Messages";
    if (chat.nick) return chat.nick;
    if (chat.kind === "group") return chat.gname || "Group";
    return chat.peerName || pretty(chat.code);
  }

  function subtitle(chat) {
    if (chat.kind === "dm") return pretty(chat.code);
    if (chat.closed === "removed") return "Removed";
    if (chat.closed === "left") return "You left";
    const names = chat.members.filter((m) => m.code !== state.me.code).map((m) => m.name || pretty(m.code));
    if (!names.length) return "Group · " + pretty(chat.code);
    return names.slice(0, 3).join(", ") + (names.length > 3 ? " +" + (names.length - 3) : "");
  }

  function lastVisible(chat) {
    for (let i = chat.messages.length - 1; i >= 0; i--) if (!chat.messages[i].hidden) return chat.messages[i];
    return null;
  }

  function preview(chat) {
    const last = lastVisible(chat);
    if (!last) return "No messages yet";
    if (last.system) return last.text;
    if (last.deleted) return "This message was deleted";
    const text = last.text.replace(/\s+/g, " ");
    if (last.mine) return "You: " + text;
    if (chat.kind === "group") return (last.name || "Someone") + ": " + text;
    return text;
  }

  function snippet(msg) {
    if (!msg || msg.deleted) return "Deleted message";
    return String(msg.text || "").replace(/\s+/g, " ").slice(0, 140);
  }

  function cleanQuote(q) {
    if (!q || typeof q !== "object" || !q.id) return null;
    return {
      id: String(q.id).slice(0, 80),
      name: cleanName(q.name) || "Message",
      text: String(q.text || "").replace(/\s+/g, " ").slice(0, 140),
    };
  }

  function readMembers(list) {
    const out = [];
    if (!Array.isArray(list)) return out;
    list.forEach((item) => {
      if (typeof item === "string") {
        if (isCode(item)) out.push({ code: item, name: "" });
      } else if (item && typeof item === "object") {
        const code = item.c || item.code;
        if (isCode(code)) out.push({ code, name: cleanName(item.n || item.name || "") });
      }
    });
    return out;
  }

function mergeMembers(chat, list, ts) {
  const incoming = readMembers(list);
  if (!incoming.length) return;
  const time = Number(ts) ? ms(ts) : 0;
  if (time && chat.membersAt && time < chat.membersAt) return;
  const prev = new Map(chat.members.map((m) => [m.code, m.name]));
  const next = [];
  const used = new Set();
  incoming.forEach((item) => {
    if (used.has(item.code)) return;
    used.add(item.code);
    next.push({ code: item.code, name: item.name || prev.get(item.code) || "" });
  });
  chat.members = next;
  if (time) chat.membersAt = time;
}

  function ensureDm(code, name) {
    const id = "d:" + code;
    if (!state.chats[id]) state.chats[id] = blankDm(code);
    const n = cleanName(name);
    if (n) state.chats[id].peerName = n;
    return state.chats[id];
  }

  function dmFor(p, create) {
    const other = p.from === state.me.code ? p.to : p.from;
    if (!isCode(other)) return null;
    if (!state.chats["d:" + other]) {
      if (!create) return null;
      state.chats["d:" + other] = blankDm(other);
    }
    return state.chats["d:" + other];
  }

  function openGroup(p, create) {
    if (!isCode(p.gid)) return null;
    const id = "g:" + p.gid;
    if (state.chats[id]) return state.chats[id];
    if (!create || (state.dropped || []).includes(id)) return null;
    const chat = blankGroup(p.gid, p.gname || "Group");
    state.chats[id] = chat;
    return chat;
  }

  function touchMe(chat) {
    const me = (chat.members || []).find((m) => m.code === state.me.code);
    if (me) me.name = myName();
  }

  function queue(p) {
    state.pending = state.pending || [];
    if (state.pending.some((item) => item.id === p.id)) return;
    state.pending.push({
      id: p.id, kind: p.kind, from: p.from, gid: p.gid || "", to: p.to || "",
      target: p.target || "", emoji: p.emoji || "", name: p.name || "",
    });
    if (state.pending.length > 80) state.pending.shift();
  }

  function setReaction(msg, code, emoji) {
    msg.reactions = msg.reactions || {};
    Object.keys(msg.reactions).forEach((key) => {
      msg.reactions[key] = msg.reactions[key].filter((c) => c !== code);
      if (!msg.reactions[key].length) delete msg.reactions[key];
    });
    if (!emoji) return;
    msg.reactions[emoji] = msg.reactions[emoji] || [];
    if (!msg.reactions[emoji].includes(code)) msg.reactions[emoji].push(code);
  }

  function myReaction(msg) {
    for (const [emoji, codes] of Object.entries(msg.reactions || {})) {
      if (codes.includes(state.me.code)) return emoji;
    }
    return "";
  }

  function flush(chat) {
    if (!state.pending || !state.pending.length) return;
    const keep = [];
    state.pending.forEach((p) => {
      const gid = isCode(p.gid) ? p.gid : "";
      const want = gid ? "g:" + gid : "d:" + (p.from === state.me.code ? p.to : p.from);
      if (want !== chat.id) { keep.push(p); return; }
      if (p.kind === "react") {
        const msg = findMessage(chat, p.target);
        if (!msg) { keep.push(p); return; }
        if (!msg.deleted && !msg.system) setReaction(msg, p.from, cleanEmoji(p.emoji));
        markSeen(p.id);
      } else if (p.kind === "delete") {
        const msg = findMessage(chat, p.target);
        if (!msg) { keep.push(p); return; }
        if (msg.from === p.from && !msg.system) {
          msg.deleted = true;
          msg.text = "";
          msg.reactions = {};
          msg.quote = null;
        }
        markSeen(p.id);
      } else keep.push(p);
    });
    state.pending = keep;
  }

  function markReadUpto(chat, id) {
    const idx = chat.messages.findIndex((m) => m.id === id);
    if (idx < 0) {
      chat.pendingRead = id;
      return;
    }
    let maxTs = chat.readUptoTs || 0;
    for (let i = 0; i <= idx; i++) {
      const msg = chat.messages[i];
      if (msg.mine && !msg.system && !msg.hidden && msg.status === "sent") maxTs = Math.max(maxTs, msg.ts);
    }
    chat.pendingRead = "";
    if (maxTs > (chat.readUptoTs || 0)) chat.readUptoTs = maxTs;
  }

  function afterMessage(chat) {
    if (chat.pendingRead) markReadUpto(chat, chat.pendingRead);
    flush(chat);
  }

  function bumpUnread(chat, id) {
    if (isWatching(chat.id)) return;
    if (!chat.unread) chat.unreadMark = id;
    chat.unread += 1;
  }

  function noteFor(chat, title, body) {
    if (!chat || chat.mute || isWatching(chat.id)) return null;
    return { chat, title, body: String(body || "").slice(0, 180) };
  }

  function parseBody(text) {
    if (!text || text[0] !== "{") return null;
    let data;
    try { data = JSON.parse(text); }
    catch (e) { return null; }
    if (!data || data.v !== 1 || typeof data.kind !== "string" || !isCode(data.from)) return null;
    if (!data.id || typeof data.id !== "string") data.id = "h:" + hash(text);
    data.id = String(data.id).slice(0, 80);
    data.name = cleanName(data.name);
    if (data.gid && !isCode(data.gid)) data.gid = "";
    if (data.to && !isCode(data.to)) data.to = "";
    if (data.admin && !isCode(data.admin)) data.admin = "";
    return data;
  }

  function apply(p) {
    switch (p.kind) {
      case "msg": return p.gid ? applyGroupMsg(p) : applyDmMsg(p);
      case "react": return applyReact(p);
      case "read": return applyRead(p);
      case "delete": return applyDelete(p);
      case "roster": return applyRoster(p);
      case "invite": return applyInvite(p);
      case "add": return applyAdd(p);
      case "join": return applyJoin(p);
      case "leave": return applyLeave(p);
      case "remove":
      case "kick": return applyRemove(p);
      case "rename": return applyRename(p);
      default: return null;
    }
  }

  function applyDmMsg(p) {
    if (!isCode(p.from) || p.from === state.me.code) return null;
    const text = cleanMessage(p.text || "");
    if (!text) return null;
    const chat = ensureDm(p.from, p.name);
    if (findMessage(chat, p.id)) return null;
    const ok = insertMessage(chat, {
      id: p.id, from: p.from, name: p.name || pretty(p.from), text, ts: ms(p.ts), mine: false,
      status: "sent", fwd: !!p.fwd, deleted: false, hidden: false, system: false,
      quote: cleanQuote(p.quote), reactions: {},
    });
    if (!ok) return null;
    if (isWatching(chat.id)) scheduleReceipt(chat);
    else bumpUnread(chat, p.id);
    afterMessage(chat);
    return { changed: true, chatId: chat.id, incoming: true, note: noteFor(chat, titleOf(chat), text) };
  }

  function applyGroupMsg(p) {
    if (!isCode(p.gid)) return null;
    const id = "g:" + p.gid;
    if (!state.chats[id]) {
      const mentioned = readMembers(p.members).some((m) => m.code === state.me.code);
      if (!mentioned && !wanted.has(groupTopic(p.gid)) && p.from !== state.me.code) return null;
      if ((state.dropped || []).includes(id)) return null;
      state.chats[id] = blankGroup(p.gid, p.gname || "Group");
    }
    const chat = state.chats[id];
    if (p.gname) chat.gname = cleanName(p.gname) || chat.gname;
    if (isCode(p.admin)) chat.admin = p.admin;
    if (p.members) mergeMembers(chat, p.members, p.ts);
    const existing = findMessage(chat, p.id);
    if (existing) {
      if (existing.mine && existing.status !== "sent") {
        existing.status = "sent";
        return { changed: true, chatId: chat.id };
      }
      return null;
    }
    const text = cleanMessage(p.text || "");
    if (!text) return null;
    const mine = p.from === state.me.code;
    const ok = insertMessage(chat, {
      id: p.id, from: p.from, name: p.name || pretty(p.from), text, ts: ms(p.ts), mine,
      status: "sent", fwd: !!p.fwd, deleted: false, hidden: false, system: false,
      quote: cleanQuote(p.quote), reactions: {},
    });
    if (!ok) return null;
    if (!mine) {
      const member = chat.members.find((m) => m.code === p.from);
      if (member) member.name = p.name || member.name;
      else chat.members.push({ code: p.from, name: p.name || "" });
    }
    if (!mine && !isWatching(chat.id)) bumpUnread(chat, p.id);
    if (!batchDepth && !chat.closed) listen(groupTopic(chat.code));
    afterMessage(chat);
    const body = (p.name || "Someone") + ": " + text;
    return { changed: true, chatId: chat.id, incoming: !mine, note: mine ? null : noteFor(chat, titleOf(chat), body) };
  }

  function applyReact(p) {
    if (seen.has(p.id)) return null;
    const chat = p.gid ? state.chats["g:" + p.gid] : dmFor(p, false);
    if (!chat) return null;
    const msg = findMessage(chat, p.target);
    if (!msg) {
      queue(p);
      return { changed: true, chatId: chat.id };
    }
    if (msg.deleted || msg.system) { markSeen(p.id); return null; }
    setReaction(msg, p.from, cleanEmoji(p.emoji));
    markSeen(p.id);
    return { changed: true, chatId: chat.id };
  }

  function applyRead(p) {
    if (!p.upto || p.from === state.me.code || seen.has(p.id)) return null;
    const chat = dmFor(p, false);
    if (!chat) return null;
    markSeen(p.id);
    const beforeTs = chat.readUptoTs || 0;
    const beforePending = chat.pendingRead || "";
    markReadUpto(chat, p.upto);
    if ((chat.readUptoTs || 0) === beforeTs && (chat.pendingRead || "") === beforePending) return null;
    return { changed: true, chatId: chat.id };
  }

  function applyDelete(p) {
    if (seen.has(p.id)) return null;
    const chat = p.gid ? state.chats["g:" + p.gid] : dmFor(p, false);
    if (!chat) return null;
    const msg = findMessage(chat, p.target);
    if (!msg) { queue(p); return { changed: true, chatId: chat.id }; }
    if (msg.from !== p.from || msg.system) { markSeen(p.id); return null; }
    msg.deleted = true;
    msg.text = "";
    msg.reactions = {};
    msg.quote = null;
    markSeen(p.id);
    return { changed: true, chatId: chat.id };
  }

  function applyRoster(p) {
    const chat = openGroup(p, true);
    if (!chat) return null;
    if (p.gname) chat.gname = cleanName(p.gname) || chat.gname;
    if (isCode(p.admin)) chat.admin = p.admin;
    if (p.members) mergeMembers(chat, p.members, p.ts);
    if (!batchDepth && !chat.closed && chat.members.some((m) => m.code === state.me.code)) listen(groupTopic(chat.code));
    return { changed: true, chatId: chat.id };
  }

  function applyInvite(p) {
    if (!isCode(p.gid)) return null;
    const id = "g:" + p.gid;
    state.dropped = (state.dropped || []).filter((item) => item !== id);
    let chat = state.chats[id];
    if (!chat) {
      chat = blankGroup(p.gid, p.gname || "Group");
      state.chats[id] = chat;
    }
    chat.closed = "";
    if (p.gname) chat.gname = cleanName(p.gname) || chat.gname;
    if (isCode(p.admin)) chat.admin = p.admin;
    if (p.members) mergeMembers(chat, p.members, p.ts);
    const fresh = !hasId(p.id);
    if (!fresh) return null;
    addSystem(chat, p.id, (p.name || "Someone") + " added you", p.ts);
    bumpUnread(chat, p.id);
    if (!batchDepth) {
      listen(groupTopic(p.gid));
      catchUp(groupTopic(p.gid)).then(() => { persist(); softRefresh(); }).catch(() => {});
    }
    return { changed: true, chatId: chat.id, note: noteFor(chat, titleOf(chat), (p.name || "Someone") + " added you") };
  }

  function addedText(p) {
    const targets = Array.isArray(p.targets) ? p.targets.filter(isCode) : [];
    if (p.from === state.me.code) {
      return targets.length === 1 ? "You added " + pretty(targets[0]) : "You added " + targets.length + " people";
    }
    const actor = p.name || pretty(p.from);
    if (targets.length === 1 && targets[0] === state.me.code) return actor + " added you";
    const names = targets.map((code) => (code === state.me.code ? "you" : pretty(code)));
    return actor + " added " + (names.join(", ") || "someone");
  }

  function applyAdd(p) {
    const chat = openGroup(p, true);
    if (!chat) return null;
    if (p.gname) chat.gname = cleanName(p.gname) || chat.gname;
    if (isCode(p.admin)) chat.admin = p.admin;
    if (p.members) mergeMembers(chat, p.members, p.ts);
    const targets = Array.isArray(p.targets) ? p.targets : [];
    if (targets.includes(state.me.code)) chat.closed = "";
    const fresh = !hasId(p.id);
    if (fresh) addSystem(chat, p.id, addedText(p), p.ts);
    if (!batchDepth && !chat.closed) listen(groupTopic(chat.code));
    const mention = fresh && targets.includes(state.me.code);
    if (mention) bumpUnread(chat, p.id);
    return fresh ? { changed: true, chatId: chat.id, note: mention ? noteFor(chat, titleOf(chat), addedText(p)) : null } : null;
  }

  function promoteAdmin(chat) {
    if (chat.closed) return;
    if (chat.admin && chat.members.some((m) => m.code === chat.admin)) return;
    const next = chat.members.map((m) => m.code).filter(isCode).sort()[0];
    if (!next) return;
    chat.admin = next;
    if (next === state.me.code) publishRoster(chat);
  }

  function applyJoin(p) {
    const chat = state.chats["g:" + p.gid];
    if (!chat || !isCode(p.gid)) return null;
    const exists = chat.members.some((m) => m.code === p.from);
    if (!exists) chat.members.push({ code: p.from, name: p.name || "" });
    else if (p.name) {
      const member = chat.members.find((m) => m.code === p.from);
      if (member) member.name = p.name;
    }
    const fresh = !hasId(p.id);
    if (fresh) {
      const text = p.from === state.me.code ? "You joined the group" : (p.name || pretty(p.from)) + " joined";
      addSystem(chat, p.id, text, p.ts);
    }
    if (p.from !== state.me.code && chat.admin === state.me.code && !exists) publishRoster(chat);
    return fresh || !exists ? { changed: true, chatId: chat.id } : null;
  }

  function applyLeave(p) {
    const chat = state.chats["g:" + p.gid];
    if (!chat || !isCode(p.gid)) return null;
    const fresh = !hasId(p.id);
    if (p.from === state.me.code) {
      chat.closed = chat.closed || "left";
      unlisten(groupTopic(chat.code));
    }
    chat.members = chat.members.filter((m) => m.code !== p.from);
    if (fresh) {
      const text = p.from === state.me.code ? "You left the group" : (p.name || pretty(p.from)) + " left";
      addSystem(chat, p.id, text, p.ts);
    }
    if (p.from !== state.me.code) promoteAdmin(chat);
    return fresh ? { changed: true, chatId: chat.id } : null;
  }

  function applyRemove(p) {
    if (!isCode(p.target)) return null;
    const chat = openGroup(p, p.target === state.me.code);
    if (!chat) return null;
    const fresh = !hasId(p.id);
    if (!fresh) return null;
    let text = (p.name || pretty(p.from)) + " removed " + (p.targetName || pretty(p.target));
    if (p.target === state.me.code) text = "You were removed";
    else if (p.from === state.me.code) text = "You removed " + (p.targetName || pretty(p.target));
    addSystem(chat, p.id, text, p.ts);
    chat.members = chat.members.filter((m) => m.code !== p.target);
    if (p.target === state.me.code) {
      chat.closed = "removed";
      unlisten(groupTopic(chat.code));
      bumpUnread(chat, p.id);
    } else promoteAdmin(chat);
    return {
      changed: true,
      chatId: chat.id,
      note: p.target === state.me.code ? noteFor(chat, titleOf(chat), "You were removed") : null,
    };
  }

  function applyRename(p) {
    const chat = openGroup(p, false);
    if (!chat) return null;
    const name = cleanName(p.gname);
    if (name) chat.gname = name;
    const fresh = !hasId(p.id);
    if (fresh) {
      const text = p.from === state.me.code ? "You named the group " + chat.gname : (p.name || "Someone") + " named the group " + chat.gname;
      addSystem(chat, p.id, text, p.ts);
    }
    return fresh ? { changed: true, chatId: chat.id } : null;
  }

  function ingest(topic, ntfy) {
    if (!ntfy || ntfy.event !== "message" || typeof ntfy.message !== "string") return null;
    if (typeof ntfy.time === "number") state.cursors[topic] = Math.max(state.cursors[topic] || 0, ntfy.time);
    const payload = parseBody(ntfy.message);
    if (!payload) return null;
    if (isGroupTopic(topic)) {
      const gid = topic.slice(GROUP_PREFIX.length);
      if (payload.gid && payload.gid !== gid) return null;
      payload.gid = gid;
    }
    if (isUserTopic(topic) && payload.kind === "msg" && payload.from === state.me.code) return null;
    return apply(payload);
  }

  function handle(topic, ntfy, live) {
    const result = ingest(topic, ntfy);
    if (!result || !result.changed) return;
    persist();
    if (!live) return;
    const route = currentRoute();
    if (route.name === "list") renderList();
    else if (route.name === "chat" && route.id === result.chatId) {
      const chat = state.chats[result.chatId];
      if (chat) {
        syncChrome(chat);
        renderLog(chat, "auto", !!result.incoming);
        updateActions();
      }
    } else if (route.name === "info" && route.id === result.chatId) renderInfo(result.chatId);
    updateBadge();
    if (result.note) notify(result.note);
  }

  async function publish(topic, payload) {
    const body = JSON.stringify(payload);
    if (body.length > 3900) {
      const err = new Error("big");
      err.status = 413;
      throw err;
    }
    const title = (payload.name || "Fawlty").slice(0, 80);
    const url = "https://ntfy.sh/" + encodeURIComponent(topic) + "?title=" + encodeURIComponent(title);
    let res;
    try {
      res = await fetch(url, { method: "POST", body, cache: "no-store" });
    } catch (e) {
      const err = new Error("network");
      err.status = 0;
      throw err;
    }
    if (!res.ok) {
      const err = new Error("ntfy");
      err.status = res.status;
      throw err;
    }
    const data = await res.json().catch(() => ({}));
    if (data && typeof data.time === "number") state.cursors[topic] = Math.max(state.cursors[topic] || 0, data.time);
    return data;
  }

  async function catchUp(topic) {
    const since = state.cursors[topic] > 0 ? String(state.cursors[topic] - 1) : "all";
    const res = await fetch("https://ntfy.sh/" + encodeURIComponent(topic) + "/json?poll=1&since=" + since, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    batchDepth += 1;
    let changed = false;
    text.split("\n").forEach((line) => {
      if (!line.trim()) return;
      try {
        const result = ingest(topic, JSON.parse(line));
        if (result && result.changed) changed = true;
      } catch (e) { /* ignore a bad line */ }
    });
    batchDepth -= 1;
    return changed;
  }

  function connect(topic) {
    if (!wanted.has(topic)) return;
    const prev = conns.get(topic);
    if (prev) { prev.dead = true; prev.close(); }
    const since = state.cursors[topic] > 0 ? String(state.cursors[topic] - 1) : "all";
    const es = new EventSource("https://ntfy.sh/" + encodeURIComponent(topic) + "/sse?since=" + since);
    conns.set(topic, es);
    es.onopen = () => { retryCount.set(topic, 0); updateNet(); };
    es.onmessage = (ev) => {
      try { handle(topic, JSON.parse(ev.data), true); }
      catch (e) { /* ignore keepalive noise */ }
    };
    es.onerror = () => {
      if (es.dead) return;
      es.dead = true;
      es.close();
      if (conns.get(topic) === es) conns.delete(topic);
      updateNet();
      if (!wanted.has(topic)) return;
      const n = (retryCount.get(topic) || 0) + 1;
      retryCount.set(topic, n);
      const wait = Math.min(20000, 700 * 2 ** Math.min(n, 5));
      const timer = setTimeout(() => { retryTimers.delete(topic); connect(topic); }, wait);
      retryTimers.set(topic, timer);
    };
  }

  function listen(topic) {
    wanted.add(topic);
    const es = conns.get(topic);
    if (es && !es.dead && es.readyState !== 2) return;
    connect(topic);
  }

  function unlisten(topic) {
    wanted.delete(topic);
    const timer = retryTimers.get(topic);
    if (timer) clearTimeout(timer);
    retryTimers.delete(topic);
    const es = conns.get(topic);
    if (!es) return;
    es.dead = true;
    es.close();
    conns.delete(topic);
  }

  async function sync() {
    const mine = userTopic(state.me.code);
    try { await catchUp(mine); } catch (e) { /* the live stream will retry */ }
    const groups = Object.values(state.chats).filter((chat) => chat.kind === "group" && !chat.closed);
    for (const chat of groups) {
      try { await catchUp(groupTopic(chat.code)); } catch (e) { /* keep going */ }
    }
    listen(mine);
    Object.values(state.chats).forEach((chat) => {
      if (chat.kind === "group" && !chat.closed) listen(groupTopic(chat.code));
    });
    lastRefresh = Date.now();
    persist();
    softRefresh();
    updateNet();
  }

  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      const now = Date.now();
      if (now - lastRefresh < 4000) return;
      lastRefresh = now;
      for (const topic of [...wanted]) {
        try { await catchUp(topic); } catch (e) { /* reconnect covers it */ }
        const es = conns.get(topic);
        if (!es || es.dead) connect(topic);
      }
      persist();
      softRefresh();
      updateNet();
    }, 250);
  }

  function updateNet() {
    const topic = userTopic(state.me.code);
    const es = conns.get(topic);
    const on = navigator.onLine && es && !es.dead && es.readyState === 1;
    $("dot").classList.toggle("on", !!on);
    $("dot").title = on ? "Connected" : navigator.onLine ? "Connecting" : "Offline";
    const problem = !navigator.onLine || (!on && (retryCount.get(topic) || 0) > 0);
    $("net").hidden = !problem;
    if (problem) $("net").textContent = navigator.onLine ? "Reconnecting…" : "Offline. Messages stay on this device until you retry.";
  }

  function isWatching(id) {
    if (document.visibilityState !== "visible") return false;
    const route = currentRoute();
    return route.name === "chat" && route.id === id;
  }

  function scheduleReceipt(chat) {
    if (!chat || chat.kind !== "dm" || !isWatching(chat.id) || receiptTimers.has(chat.id)) return;
    receiptTimers.set(chat.id, setTimeout(() => {
      receiptTimers.delete(chat.id);
      sendReceipt(chat);
    }, 700));
  }

  function sendReceipt(chat) {
    if (!isWatching(chat.id)) return;
    const last = [...chat.messages].reverse().find((msg) => !msg.hidden && !msg.system);
    if (!last || chat.sentRead === last.id) return;
    chat.sentRead = last.id;
    const payload = {
      v: 1, kind: "read", id: uid(), from: state.me.code, name: myName(), ts: Date.now(), to: chat.code, upto: last.id,
    };
    publish(userTopic(chat.code), payload).then(() => persist()).catch(() => { chat.sentRead = ""; });
  }

  function outgoingPayload(chat, msg) {
    const payload = { v: 1, kind: "msg", id: msg.id, from: state.me.code, name: myName(), ts: msg.ts, text: msg.text };
    if (msg.fwd) payload.fwd = true;
    if (msg.quote) payload.quote = msg.quote;
    if (chat.kind === "dm") payload.to = chat.code;
    if (chat.kind === "group") {
      touchMe(chat);
      payload.gid = chat.code;
      payload.gname = chat.gname;
      payload.admin = chat.admin;
      payload.members = chat.members.map((m) => ({ c: m.code, n: m.name || "" }));
    }
    return payload;
  }

  async function sendText(chat, text, extra) {
    extra = extra || {};
    if (chat.kind === "group" && chat.closed) {
      toast(chat.closed === "removed" ? "You were removed from this group." : "You left this group.");
      return;
    }
    const msg = {
      id: uid(), from: state.me.code, name: myName(), text, ts: Date.now(), mine: true, status: "pending",
      fwd: !!extra.fwd, deleted: false, hidden: false, system: false, quote: extra.quote || null, reactions: {},
    };
    insertMessage(chat, msg);
    if (openId === chat.id) {
      reply = null;
      chat.draft = "";
      $("draft").value = "";
      sizeDraft();
      syncSend();
      updateReplyBanner();
      renderLog(chat, "stick", false);
      updateActions();
    }
    persist();
    if (currentRoute().name === "list") renderList();
    try {
      await publish(topicFor(chat), outgoingPayload(chat, msg));
      if (msg.status !== "failed") msg.status = "sent";
    } catch (err) {
      if (msg.status !== "sent") {
        msg.status = "failed";
        failToast(err);
      }
    }
    persist();
    const route = currentRoute();
    if (route.name === "chat" && route.id === chat.id) renderLog(chat, "auto", false);
    else if (route.name === "list") renderList();
  }

  async function retryMessage(chat, msg) {
    if (!msg || msg.status !== "failed") return;
    msg.status = "pending";
    persist();
    if (currentRoute().id === chat.id) renderLog(chat, "auto", false);
    try {
      await publish(topicFor(chat), outgoingPayload(chat, msg));
      msg.status = "sent";
    } catch (err) {
      if (msg.status !== "sent") {
        msg.status = "failed";
        failToast(err);
      }
    }
    persist();
    if (currentRoute().name === "chat" && currentRoute().id === chat.id) renderLog(chat, "auto", false);
  }

  async function react(chat, msg, emoji) {
    if (!msg || msg.deleted || msg.system || msg.hidden) return;
    const prev = myReaction(msg);
    const next = prev === emoji ? "" : emoji;
    setReaction(msg, state.me.code, next);
    const id = uid();
    const payload = { v: 1, kind: "react", id, from: state.me.code, name: myName(), ts: Date.now(), target: msg.id, emoji: next };
    if (chat.kind === "group") payload.gid = chat.code;
    else payload.to = chat.code;
    persist();
    if (currentRoute().id === chat.id) {
      renderLog(chat, "auto", false);
      updateActions();
    }
    try {
      await publish(topicFor(chat), payload);
      markSeen(id);
      persist();
    } catch (err) {
      if (!seen.has(id)) {
        setReaction(msg, state.me.code, prev);
        persist();
        if (currentRoute().id === chat.id) {
          renderLog(chat, "auto", false);
          updateActions();
        }
      }
      failToast(err);
    }
  }

  function rosterPayload(chat, id) {
    touchMe(chat);
    return {
      v: 1, kind: "roster", id, from: state.me.code, name: myName(), ts: Date.now(),
      gid: chat.code, gname: chat.gname, admin: chat.admin,
      members: chat.members.map((m) => ({ c: m.code, n: m.name || "" })),
    };
  }

  function publishRoster(chat) {
    if (!chat || chat.closed || chat.admin !== state.me.code) return;
    publish(groupTopic(chat.code), rosterPayload(chat, uid())).catch(() => {});
  }

  function startDm(code, nick) {
    if (!isCode(code)) { toast("Enter a code like ABCD-EFGH."); return; }
    if (code === state.me.code) { toast("That’s your code. Share it with someone who should message you."); return; }
    const id = "d:" + code;
    if (!state.chats[id]) state.chats[id] = blankDm(code);
    const name = cleanName(nick);
    if (name) state.chats[id].nick = name;
    state.chats[id].updated = Date.now();
    persist();
    closeSheet();
    go("c/" + encodeURIComponent(id));
  }

  function createGroup(gname, codes) {
    const name = cleanName(gname);
    if (!name) { toast("Give the group a name."); return; }
    let code = randomCode();
    for (let i = 0; i < 5 && state.chats["g:" + code]; i++) code = randomCode();
    const chat = blankGroup(code, name);
    chat.admin = state.me.code;
    chat.members = [{ code: state.me.code, name: myName() }];
    chat.membersAt = Date.now();
    const unique = [];
    (codes || []).forEach((item) => {
      if (!isCode(item) || item === state.me.code || unique.includes(item)) return;
      if (chat.members.length >= 31) return;
      unique.push(item);
      chat.members.push({ code: item, name: "" });
    });
    state.chats[chat.id] = chat;
    addSystem(chat, uid(), "You created " + name);
    const eid = uid();
    if (unique.length) addSystem(chat, eid, unique.length === 1 ? "You added " + pretty(unique[0]) : "You added " + unique.length + " people");
    persist();
    listen(groupTopic(code));
    closeSheet();
    go("c/" + encodeURIComponent(chat.id));
    publish(groupTopic(code), rosterPayload(chat, uid())).catch(failToast);
    if (!unique.length) return;
    const payload = {
      v: 1, kind: "add", id: eid, from: state.me.code, name: myName(), ts: Date.now(),
      gid: code, gname: chat.gname, admin: chat.admin, targets: unique,
      members: chat.members.map((m) => ({ c: m.code, n: m.name || "" })),
    };
    publish(groupTopic(code), payload).catch(failToast);
    unique.forEach((item) => publish(userTopic(item), Object.assign({}, payload, { kind: "invite" })).catch(failToast));
  }

  async function joinGroup(code) {
    if (!isCode(code)) { toast("Enter a group code like ABCD-EFGH."); return; }
    const id = "g:" + code;
    state.dropped = (state.dropped || []).filter((item) => item !== id);
    let chat = state.chats[id];
    if (chat && !chat.closed) {
      closeSheet();
      go("c/" + encodeURIComponent(id));
      return;
    }
    if (!chat) {
      chat = blankGroup(code, "Group");
      state.chats[id] = chat;
    }
    chat.closed = "";
    closeSheet();
    go("c/" + encodeURIComponent(id));
    toast("Joining the group…");
    try { await catchUp(groupTopic(code)); }
    catch (err) { failToast(err); }
    listen(groupTopic(code));
    if (!chat.members.some((m) => m.code === state.me.code)) {
      chat.members.push({ code: state.me.code, name: myName() });
      chat.membersAt = Date.now();
      const eid = uid();
      addSystem(chat, eid, "You joined the group");
      chat.updated = Date.now();
      persist();
      softRefresh();
      publish(groupTopic(code), {
        v: 1, kind: "join", id: eid, from: state.me.code, name: myName(), ts: Date.now(), gid: code, gname: chat.gname || "Group",
      }).catch(failToast);
    } else {
      persist();
      softRefresh();
    }
  }

  async function leaveGroup(chat) {
    const eid = uid();
    addSystem(chat, eid, "You left the group");
    chat.closed = "left";
    chat.members = chat.members.filter((m) => m.code !== state.me.code);
    chat.membersAt = Date.now();
    unlisten(groupTopic(chat.code));
    clearPick();
    persist();
    closeSheet();
    render();
    try {
      await publish(groupTopic(chat.code), {
        v: 1, kind: "leave", id: eid, from: state.me.code, name: myName(), ts: Date.now(), gid: chat.code,
      });
    } catch (err) {
      toast("You left on this device. Couldn’t reach ntfy.sh, so the group may still include you.");
    }
  }

  async function addMembers(chat, codes) {
    const fresh = [];
    codes.forEach((code) => {
      if (!isCode(code) || code === state.me.code || fresh.includes(code)) return;
      if (chat.members.some((m) => m.code === code)) return;
      fresh.push(code);
    });
    if (!fresh.length) { toast("Those people are already in the group."); return; }
    if (chat.members.length + fresh.length > 31) { toast("Groups hold up to 30 people besides you."); return; }
    fresh.forEach((code) => chat.members.push({ code, name: "" }));
    chat.membersAt = Date.now();
    const eid = uid();
    addSystem(chat, eid, fresh.length === 1 ? "You added " + pretty(fresh[0]) : "You added " + fresh.length + " people");
    persist();
    const payload = {
      v: 1, kind: "add", id: eid, from: state.me.code, name: myName(), ts: Date.now(),
      gid: chat.code, gname: chat.gname, admin: chat.admin, targets: fresh,
      members: chat.members.map((m) => ({ c: m.code, n: m.name || "" })),
    };
    try {
      await publish(groupTopic(chat.code), payload);
      for (const code of fresh) await publish(userTopic(code), Object.assign({}, payload, { kind: "invite" }));
      toast(fresh.length === 1 ? "Added " + pretty(fresh[0]) : "Added " + fresh.length + " people");
    } catch (err) { failToast(err); }
    if (currentRoute().name === "info") renderInfo(chat.id);
  }

  async function removeMember(chat, code) {
    const member = chat.members.find((m) => m.code === code);
    const label = (member && member.name) || pretty(code);
    const eid = uid();
    addSystem(chat, eid, "You removed " + label);
    chat.members = chat.members.filter((m) => m.code !== code);
    chat.membersAt = Date.now();
    persist();
    const payload = {
      v: 1, kind: "remove", id: eid, from: state.me.code, name: myName(), ts: Date.now(),
      gid: chat.code, target: code, targetName: label, gname: chat.gname, admin: chat.admin,
      members: chat.members.map((m) => ({ c: m.code, n: m.name || "" })),
    };
    try {
      await publish(groupTopic(chat.code), payload);
      await publish(userTopic(code), Object.assign({}, payload, { kind: "kick" }));
    } catch (err) { failToast(err); }
    renderInfo(chat.id);
  }

  async function renameGroup(chat, name) {
    const next = cleanName(name);
    if (!next || next === chat.gname) return false;
    const eid = uid();
    chat.gname = next;
    addSystem(chat, eid, "You named the group " + next);
    persist();
    softRefresh();
    try {
      await publish(groupTopic(chat.code), {
        v: 1, kind: "rename", id: eid, from: state.me.code, name: myName(), ts: Date.now(), gid: chat.code, gname: next,
      });
    } catch (err) { failToast(err); }
    return true;
  }

  async function deleteEverywhere(chat, msg) {
    msg.deleted = true;
    msg.text = "";
    msg.reactions = {};
    msg.quote = null;
    const payload = { v: 1, kind: "delete", id: uid(), from: state.me.code, name: myName(), ts: Date.now(), target: msg.id };
    if (chat.kind === "group") payload.gid = chat.code;
    else payload.to = chat.code;
    markSeen(payload.id);
    clearPick();
    persist();
    renderLog(chat, "auto", false);
    try { await publish(topicFor(chat), payload); }
    catch (err) { toast("Deleted on this device. Couldn’t reach ntfy.sh, so others may still see it."); }
  }

  function hideMessage(chat, msg) {
    msg.hidden = true;
    if (pickId === msg.id) pickId = "";
    persist();
    renderLog(chat, "auto", false);
    updateActions();
  }

  function deleteChat(id) {
    const chat = state.chats[id];
    if (!chat) return;
    if (chat.kind === "group") {
      if (!chat.closed) {
        publish(groupTopic(chat.code), {
          v: 1, kind: "leave", id: uid(), from: state.me.code, name: myName(), ts: Date.now(), gid: chat.code,
        }).catch(() => {});
      }
      unlisten(groupTopic(chat.code));
      state.dropped = state.dropped || [];
      state.dropped.push(id);
      if (state.dropped.length > 200) state.dropped.splice(0, state.dropped.length - 200);
    }
    delete state.chats[id];
    if (openId === id) openId = "";
    pickId = "";
    persist();
    closeSheet();
    go("/");
  }

  async function notify(note) {
    if (!note || !note.chat || note.chat.mute || isWatching(note.chat.id)) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const opts = { body: note.body, icon: "icon-192.png", badge: "icon-192.png", tag: note.chat.id, renotify: true, data: { chatId: note.chat.id } };
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.showNotification(note.title, opts);
      else new Notification(note.title, opts);
    } catch (e) { /* alerts are optional */ }
  }

  async function updateBadge() {
    if (!navigator.setAppBadge) return;
    let n = 0;
    Object.values(state.chats).forEach((chat) => { if (!chat.mute) n += chat.unread || 0; });
    try {
      if (n) await navigator.setAppBadge(n);
      else await navigator.clearAppBadge();
    } catch (e) { /* badge is optional */ }
  }

  function currentRoute() {
    const raw = location.hash.replace(/^#\/?/, "");
    try {
      if (raw.startsWith("c/")) return { name: "chat", id: decodeURIComponent(raw.slice(2)) };
      if (raw.startsWith("i/")) return { name: "info", id: decodeURIComponent(raw.slice(2)) };
    } catch (e) { /* bad hash */ }
    return { name: "list", id: "" };
  }

  function go(path) {
    const next = "#" + path;
    const now = location.hash;
    if (now === next || (path === "/" && (now === "" || now === "#" || now === "#/"))) {
      render();
      return;
    }
    location.hash = path;
  }

  function sortedChats() {
    return Object.values(state.chats).sort((a, b) => Number(b.pin) - Number(a.pin) || (b.updated || 0) - (a.updated || 0));
  }

  function formatWhen(ts) {
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (now - date < 7 * 86400000 && date < now) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function dayLabel(ts) {
    const date = new Date(ts);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
  }

  function initials(name) {
    const parts = String(name || "").replace(/[^\p{L}\p{N} ]+/gu, " ").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "#";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function colorFor(id) {
    let h = 0;
    const text = String(id || "");
    for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }

  function avatarText(chat) {
    if (chat.kind === "dm" && !chat.nick && !chat.peerName) return chat.code.slice(-2);
    return initials(titleOf(chat));
  }

  function appendText(node, text) {
    const re = /https?:\/\/[^\s]+/gi;
    const str = String(text || "");
    let last = 0;
    let match = re.exec(str);
    while (match) {
      if (match.index > last) node.append(document.createTextNode(str.slice(last, match.index)));
      let url = match[0];
      const trail = url.match(/[).,!?;:]+$/);
      if (trail) url = url.slice(0, -trail[0].length);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = url;
      node.append(link);
      last = match.index + url.length;
      re.lastIndex = last;
      match = re.exec(str);
    }
    if (last < str.length) node.append(document.createTextNode(str.slice(last)));
  }

  function tickState(chat, msg) {
    if (!msg.mine || msg.system) return "";
    if (msg.status === "failed") return "failed";
    if (msg.status !== "sent") return "pending";
    if (chat.kind === "dm" && chat.readUptoTs && msg.ts <= chat.readUptoTs) return "read";
    return "sent";
  }

  function ticks(kind) {
    const span = document.createElement("span");
    span.className = "ticks " + kind;
    if (kind === "pending") {
      span.setAttribute("aria-label", "Sending");
      span.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 5.2V8l2 1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    } else if (kind === "failed") {
      span.setAttribute("aria-label", "Not sent");
      span.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.8v4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11" r=".8" fill="currentColor"/></svg>';
    } else if (kind === "sent") {
      span.setAttribute("aria-label", "Sent");
      span.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.2 6.2 11.5 13 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else if (kind === "read") {
      span.setAttribute("aria-label", "Read");
      span.innerHTML = '<svg viewBox="0 0 18 16" aria-hidden="true"><path d="M1.2 8.2 4.2 11.2 9 5.2M6.2 8.6 8.6 11.2 16.2 4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    return span;
  }

  function namesFor(chat, codes) {
    return codes.map((code) => {
      if (code === state.me.code) return "You";
      if (chat.kind === "dm") return titleOf(chat);
      const member = (chat.members || []).find((m) => m.code === code);
      return member && member.name ? member.name : pretty(code);
    }).join(", ");
  }

  function renderList() {
    const q = $("search").value.trim().toLowerCase();
    const rows = sortedChats().filter((chat) => {
      if (!q) return true;
      return [titleOf(chat), chat.code, pretty(chat.code), preview(chat), chat.peerName || "", chat.gname || ""].join(" ").toLowerCase().includes(q);
    });
    const list = $("list");
    list.replaceChildren();
    if (!rows.length) {
      list.append(q
        ? el("div", { class: "empty" }, [el("h2", null, "No chats match"), el("p", null, "Try another name or code.")])
        : el("div", { class: "empty" }, [
          el("h2", null, "No chats yet"),
          el("p", null, "Add someone’s code for a direct message, or start a group and share its code."),
          el("div", { class: "stack" }, [
            el("button", { type: "button", class: "btn full", "data-action": "sheet-dm" }, "New chat"),
            el("button", { type: "button", class: "btn ghost full", "data-action": "sheet-group" }, "New group"),
          ]),
        ]));
      return;
    }
    rows.forEach((chat) => {
      const last = lastVisible(chat);
      list.append(el("button", { type: "button", class: "row" + (chat.unread ? " unread" : "") + (chat.pin ? " pinned" : ""), "data-action": "open", "data-id": chat.id }, [
        el("span", { class: "avatar", style: "background:" + colorFor(chat.id) }, avatarText(chat)),
        el("span", { class: "row-main" }, [
          el("span", { class: "row-top" }, [el("strong", null, titleOf(chat)), el("span", { class: "when" }, last ? formatWhen(last.ts) : "")]),
          el("span", { class: "row-bot" }, [
            el("span", { class: "preview" }, preview(chat)),
            chat.mute ? el("span", { class: "flag" }, "Muted") : null,
            chat.unread ? el("span", { class: "badge" }, chat.unread > 99 ? "99+" : String(chat.unread)) : null,
          ]),
        ]),
      ]));
    });
  }

  function renderLog(chat, mode, announce) {
    const log = $("log");
    const near = log.scrollHeight - log.scrollTop - log.clientHeight < 120;
    const prevH = log.scrollHeight;
    const prevTop = log.scrollTop;
    const all = chat.messages;
    const limit = limits.get(chat.id) || 120;
    const start = Math.max(0, all.length - limit);
    const frag = document.createDocumentFragment();
    if (start > 0) frag.append(el("button", { type: "button", class: "earlier", "data-action": "earlier" }, "Earlier messages"));
    if (!all.some((msg) => !msg.hidden)) frag.append(el("p", { class: "system" }, chat.kind === "group" ? "Say hello to the group." : "Send a message. It goes through ntfy.sh."));
    let lastDay = "";
    let lastFrom = "";
    let lastTs = 0;
    let showedUnread = false;
    all.slice(start).forEach((msg) => {
      if (msg.hidden) return;
      const day = dayLabel(msg.ts);
      if (day !== lastDay) {
        frag.append(el("div", { class: "day" }, day));
        lastDay = day;
        lastFrom = "";
      }
      if (!showedUnread && chat.unreadMark && msg.id === chat.unreadMark) {
        frag.append(el("div", { class: "unread-line" }, "New messages"));
        showedUnread = true;
      }
      if (msg.system) {
        frag.append(el("div", { class: "system" }, msg.text));
        lastFrom = "";
        return;
      }
      const tight = lastFrom === msg.from && msg.ts - lastTs < 120000 && !msg.quote;
      const wrap = el("div", { class: "msg " + (msg.mine ? "out" : "in"), "data-mid": msg.id });
      if (chat.kind === "group" && !msg.mine && !tight) {
        wrap.append(el("div", { class: "sender", style: "color:" + colorFor(msg.from) }, msg.name || pretty(msg.from)));
      }
      const bubble = el("div", { class: "bubble" + (msg.id === pickId ? " picked" : ""), tabindex: "0", role: "button", "data-action": "pick", "data-id": msg.id });
      if (msg.fwd && !msg.deleted) bubble.append(el("span", { class: "fwd" }, "Forwarded"));
      if (msg.quote && !msg.deleted) {
        bubble.append(el("span", { class: "quote" }, [el("strong", null, msg.quote.name || "Reply"), msg.quote.text || ""]));
      }
      const body = el("span", { class: msg.deleted ? "body deleted" : "body" });
      if (msg.deleted) body.textContent = "This message was deleted";
      else appendText(body, msg.text);
      const time = new Date(msg.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const meta = el("span", { class: "meta" }, [el("time", { datetime: new Date(msg.ts).toISOString() }, time)]);
      const kind = tickState(chat, msg);
      if (kind) meta.append(ticks(kind));
      bubble.append(body, meta);
      wrap.append(bubble);
      const reacts = Object.entries(msg.reactions || {}).filter(([, codes]) => codes && codes.length);
      if (reacts.length && !msg.deleted) {
        const row = el("div", { class: "chips" });
        reacts.forEach(([emoji, codes]) => {
          const label = namesFor(chat, codes);
          row.append(el("button", {
            type: "button",
            class: codes.includes(state.me.code) ? "chip mine" : "chip",
            "data-action": "toggle-react",
            "data-emoji": emoji,
            "data-id": msg.id,
            title: label,
            "aria-label": emoji + ", " + label,
          }, emoji + " " + codes.length));
        });
        wrap.append(row);
      }
      if (msg.mine && msg.status === "failed") {
        wrap.append(el("button", { type: "button", class: "retry", "data-action": "retry", "data-id": msg.id }, "Not sent. Tap to retry."));
      }
      frag.append(wrap);
      lastFrom = msg.from;
      lastTs = msg.ts;
    });
    log.replaceChildren(frag);
    const stick = mode === "stick" || (mode === "auto" && near);
    const place = () => {
      if (stick) log.scrollTop = log.scrollHeight;
      else if (mode === "prepend") log.scrollTop = log.scrollHeight - prevH + prevTop;
      else log.scrollTop = prevTop;
    };
    place();
    if (stick) requestAnimationFrame(place);
    $("jump").hidden = stick || !announce;
    if (stick) $("jump").hidden = true;
  }

  function syncChrome(chat) {
    $("chat-name").textContent = titleOf(chat);
    $("chat-sub").textContent = subtitle(chat);
    const locked = chat.kind === "group" && !!chat.closed;
    $("composer").hidden = locked;
    $("locked").hidden = !locked;
    if (locked) {
      $("locked-text").textContent = chat.closed === "removed" ? "You were removed from this group." : "You left this group.";
      $("emoji-panel").hidden = true;
      $("actions").hidden = true;
    }
  }

  function renderChat(id) {
    const chat = state.chats[id];
    if (!chat) return;
    const enter = openId !== id;
    if (enter) {
      pickId = "";
      reply = null;
      if (!chat.unread) chat.unreadMark = "";
      chat.unread = 0;
      openId = id;
    }
    syncChrome(chat);
    document.title = titleOf(chat) + " · Fawlty Messages";
    renderLog(chat, enter ? "stick" : "auto", false);
    if (enter) {
      $("draft").value = chat.draft || "";
      sizeDraft();
      syncSend();
      $("emoji-panel").hidden = true;
      scheduleReceipt(chat);
    }
    updateReplyBanner();
    updateActions();
    updateBadge();
  }

  function renderInfo(id) {
    const chat = state.chats[id];
    const info = $("info");
    if (!chat) { info.replaceChildren(el("p", null, "That chat isn’t on this device.")); return; }
    const active = document.activeElement;
    if (active && active.closest && active.closest("#info") && ["add-code", "info-nick", "info-gname"].includes(active.id)) return;
    info.replaceChildren();
    info.append(el("div", { class: "avatar lg", style: "background:" + colorFor(chat.id) }, avatarText(chat)));
    info.append(el("h2", null, titleOf(chat)));
    info.append(el("div", { class: "info-code" }, pretty(chat.code)));
    const buttons = el("div", { class: "row-btns" });
    if (chat.kind === "group") {
      buttons.append(el("button", { type: "button", class: "btn", "data-action": "copy-group" }, "Copy code"));
      buttons.append(el("button", { type: "button", class: "btn ghost", "data-action": "share-group" }, "Share"));
    } else {
      buttons.append(el("button", { type: "button", class: "btn full", "data-action": "copy-peer" }, "Copy code"));
    }
    info.append(buttons);
    if (chat.kind === "dm") {
      info.append(el("label", { class: "field" }, ["Name on this device", el("input", { id: "info-nick", value: chat.nick || "", maxlength: "32", placeholder: chat.peerName || "Name", "aria-label": "Name" })]));
    } else {
      const nameInput = el("input", { id: "info-gname", value: chat.gname || "", maxlength: "40", "aria-label": "Group name" });
      if (chat.closed) nameInput.disabled = true;
      info.append(el("label", { class: "field" }, ["Group name", nameInput]));
      info.append(el("h3", null, "People"));
      chat.members.forEach((member) => {
        const row = el("div", { class: "member" }, [
          el("span", { class: "avatar", style: "background:" + colorFor(member.code) }, member.code === state.me.code ? initials(myName()) : initials(member.name || pretty(member.code))),
          el("span", { class: "person" }, [
            el("strong", null, member.code === state.me.code ? myName() + " (you)" : (member.name || pretty(member.code))),
            el("span", null, pretty(member.code)),
          ]),
        ]);
        if (member.code === chat.admin) row.append(el("span", { class: "admin-tag" }, "Admin"));
        if (!chat.closed && chat.admin === state.me.code && member.code !== state.me.code) {
          row.append(el("button", { type: "button", class: "text-btn", "data-action": "remove-member", "data-code": member.code }, "Remove"));
        }
        info.append(row);
      });
      if (!chat.closed) {
        info.append(el("label", { class: "field" }, ["Add someone", el("input", { id: "add-code", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", placeholder: "Their code", "aria-label": "Person code" })]));
        info.append(el("button", { type: "button", class: "btn ghost full", "data-action": "add-member" }, "Add to group"));
      }
    }
    const stack = el("div", { class: "stack" });
    stack.append(el("button", { type: "button", class: "btn ghost full", "data-action": "pin" }, chat.pin ? "Unpin" : "Pin"));
    stack.append(el("button", { type: "button", class: "btn ghost full", "data-action": "mute" }, chat.mute ? "Unmute" : "Mute"));
    if (chat.kind === "group" && !chat.closed) stack.append(el("button", { type: "button", class: "btn danger full", "data-action": "leave" }, "Leave group"));
    if (chat.kind === "group" && chat.closed) stack.append(el("button", { type: "button", class: "btn full", "data-action": "rejoin" }, "Join again"));
    stack.append(el("button", { type: "button", class: "btn danger full", "data-action": "delete-chat" }, "Delete chat"));
    info.append(stack);
    document.title = titleOf(chat) + " · Fawlty Messages";
  }

  function render() {
    let route = currentRoute();
    if ((route.name === "chat" || route.name === "info") && !state.chats[route.id]) {
      history.replaceState(null, "", location.pathname + location.search + "#/");
      route = { name: "list", id: "" };
    }
    if (openId && !(route.name === "chat" && route.id === openId)) {
      captureDraft();
      const prev = state.chats[openId];
      if (prev) prev.unreadMark = "";
      if (route.name !== "chat") openId = "";
    }
    $("view-list").hidden = route.name !== "list";
    $("view-chat").hidden = route.name !== "chat";
    $("view-info").hidden = route.name !== "info";
    if (route.name === "list") {
      document.title = titleCount();
      renderList();
    } else if (route.name === "chat") renderChat(route.id);
    else renderInfo(route.id);
    updateBadge();
  }

  function titleCount() {
    let n = 0;
    Object.values(state.chats).forEach((chat) => { n += chat.unread || 0; });
    return n ? "(" + n + ") Fawlty Messages" : "Fawlty Messages";
  }

  function softRefresh() {
    const route = currentRoute();
    if (route.name === "list") {
      document.title = titleCount();
      renderList();
    } else if (route.name === "chat" && state.chats[route.id]) {
      syncChrome(state.chats[route.id]);
      renderLog(state.chats[route.id], "auto", false);
      updateActions();
    } else if (route.name === "info" && state.chats[route.id]) renderInfo(route.id);
    updateBadge();
  }

  function captureDraft() {
    if (!openId || !state.chats[openId]) return;
    state.chats[openId].draft = $("draft").value;
    persistSoon();
  }

  function sizeDraft() {
    const draft = $("draft");
    draft.style.overflowY = "hidden";
    draft.style.height = "auto";
    const needed = draft.scrollHeight;
    draft.style.height = Math.min(needed, 120) + "px";
    if (needed > 120) draft.style.overflowY = "auto";
  }

  function syncSend() {
    $("send").disabled = !$("draft").value.trim();
  }

  function updateReplyBanner() {
    const bar = $("replying");
    if (!reply) { bar.hidden = true; return; }
    bar.hidden = false;
    $("reply-name").textContent = reply.name || "Reply";
    $("reply-text").textContent = reply.text || "";
  }

  function findPicked() {
    if (!pickId || !openId) return null;
    const chat = state.chats[openId];
    const msg = chat && findMessage(chat, pickId);
    if (!msg || msg.system || msg.hidden) return null;
    return { chat, msg };
  }

  function pick(id) {
    const chat = state.chats[openId];
    const msg = chat && findMessage(chat, id);
    if (!msg || msg.system || msg.hidden) return;
    pickId = id;
    updateActions();
  }

  function clearPick() {
    pickId = "";
    updateActions();
  }

  function updateActions() {
    const bar = $("actions");
    const found = findPicked();
    document.querySelectorAll(".bubble.picked").forEach((node) => node.classList.remove("picked"));
    if (!found) { bar.hidden = true; return; }
    bar.hidden = false;
    const node = document.querySelector('[data-mid="' + CSS.escape(found.msg.id) + '"] .bubble');
    if (node) node.classList.add("picked");
    const mine = myReaction(found.msg);
    $("reacts").hidden = !!found.msg.deleted;
    $("reacts").querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-pressed", btn.dataset.emoji === mine ? "true" : "false"));
    $("act-reply").hidden = !!found.msg.deleted;
    $("act-forward").hidden = !!found.msg.deleted;
    $("act-copy").hidden = !!found.msg.deleted;
    $("act-retry").hidden = found.msg.status !== "failed";
    $("act-delete-all").hidden = !found.msg.mine || !!found.msg.deleted;
    $("act-delete-all").dataset.armed = "";
    $("act-delete-all").textContent = "Delete for everyone";
    $("act-quote").hidden = !(found.msg.quote && found.msg.quote.id);
  }

  function openSheet(title, nodes) {
    const body = $("sheet-body");
    body.replaceChildren();
    body.append(
      el("div", { class: "grab", "aria-hidden": "true" }),
      el("div", { class: "sheet-head" }, [
        el("h2", { id: "sheet-title" }, title),
        el("button", { type: "button", class: "icon-btn", "data-action": "close-sheet", "aria-label": "Close" }, icon("close")),
      ])
    );
    nodes.forEach((node) => node && body.append(node));
    $("sheet").hidden = false;
    const input = body.querySelector("input, textarea");
    if (input) setTimeout(() => input.focus(), 40);
  }

  function closeSheet() {
    $("sheet").hidden = true;
    $("sheet-body").replaceChildren();
    chips = [];
  }

  function openDetails() {
    const alerts = "Notification" in window && Notification.permission === "granted" ? "Alerts are on" : "Turn on alerts";
    openSheet("Your code", [
      el("p", { class: "big-code" }, pretty(state.me.code)),
      el("div", { class: "row-btns" }, [
        el("button", { type: "button", class: "btn", "data-action": "copy-code" }, "Copy"),
        el("button", { type: "button", class: "btn ghost", "data-action": "share-code" }, "Share"),
      ]),
      el("p", null, "Give this code to someone so they can message you. A group has its own code, which you share from the group."),
      el("p", null, "Messages go through ntfy.sh. Anyone who has a code can send to it, so share codes only with the people who should have them."),
      el("p", null, "Keep Fawlty Messages open to see messages right away. Opening it later picks up messages still waiting on ntfy.sh, about 12 hours."),
      el("p", null, "This code stays on this device. Clearing the browser’s site data gives you a new one."),
      el("button", { type: "button", class: "btn full", "data-action": "alerts" }, alerts),
    ]);
  }

  function openNewMenu() {
    openSheet("New", [el("div", { class: "stack" }, [
      el("button", { type: "button", class: "btn full", "data-action": "sheet-dm" }, "New chat"),
      el("button", { type: "button", class: "btn full", "data-action": "sheet-group" }, "New group"),
      el("button", { type: "button", class: "btn ghost full", "data-action": "sheet-join" }, "Join group"),
    ])]);
  }

  function openDmSheet() {
    openSheet("New chat", [
      el("label", { class: "field" }, ["Their code", el("input", { id: "dm-code", type: "text", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", placeholder: "ABCD-EFGH", "aria-label": "Their code" })]),
      el("label", { class: "field" }, ["Name, if you want one", el("input", { id: "dm-nick", type: "text", maxlength: "32", placeholder: "What to call them", "aria-label": "Name" })]),
      el("button", { type: "button", class: "btn full", "data-action": "start-dm" }, "Start chat"),
    ]);
  }

  function openGroupSheet() {
    chips = [];
    openSheet("New group", [
      el("label", { class: "field" }, ["Group name", el("input", { id: "group-name", type: "text", maxlength: "40", placeholder: "Dining room", "aria-label": "Group name" })]),
      el("label", { class: "field" }, ["Add someone", el("input", { id: "member-code", type: "text", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", placeholder: "Their code", "aria-label": "Person code" })]),
      el("button", { type: "button", class: "btn ghost full", "data-action": "add-chip" }, "Add to group"),
      el("div", { id: "chips", class: "chip-row" }),
      el("p", null, "You can also create the group with just yourself, then share its code."),
      el("button", { type: "button", class: "btn full", "data-action": "create-group" }, "Create group"),
    ]);
  }

  function openJoinSheet() {
    openSheet("Join group", [
      el("label", { class: "field" }, ["Group code", el("input", { id: "join-code", type: "text", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", placeholder: "ABCD-EFGH", "aria-label": "Group code" })]),
      el("button", { type: "button", class: "btn full", "data-action": "join-group" }, "Join"),
    ]);
  }

  function renderChips() {
    const box = $("chips");
    if (!box) return;
    box.replaceChildren();
    chips.forEach((code) => box.append(el("button", { type: "button", "data-action": "drop-chip", "data-code": code }, pretty(code) + " ×")));
  }

  function addChip() {
    const input = $("member-code");
    if (!input) return;
    const parsed = classifyCode(input.value);
    if (!parsed.code) { toast("Enter a code like ABCD-EFGH."); return; }
    if (parsed.group) { toast("That’s a group code. Add a person’s code."); return; }
    if (parsed.code === state.me.code) { toast("That’s your code. Add someone else."); return; }
    if (!chips.includes(parsed.code)) {
      if (chips.length >= 30) { toast("Groups hold up to 30 people besides you."); return; }
      chips.push(parsed.code);
    }
    input.value = "";
    renderChips();
    input.focus();
  }

  function startFromSheet() {
    const parsed = classifyCode($("dm-code") ? $("dm-code").value : "");
    if (!parsed.code) { toast("Enter a code like ABCD-EFGH."); return; }
    if (parsed.group) { toast("That’s a group code. Use Join group."); return; }
    startDm(parsed.code, $("dm-nick") ? $("dm-nick").value : "");
  }

  function joinFromSheet() {
    const input = $("join-code");
    const raw = (input && input.value || "").toUpperCase();
    if (raw.includes("FAWLTY-U-")) { toast("That’s a personal code. Start a direct message instead."); return; }
    const parsed = classifyCode(raw);
    if (!parsed.code) { toast("Enter a group code like ABCD-EFGH."); return; }
    joinGroup(parsed.code);
  }

  function myShareText() {
    return "Message me on Fawlty Messages. My code is " + pretty(state.me.code);
  }

  function groupShareText(chat) {
    return "Join " + titleOf(chat) + " on Fawlty Messages. Group code: " + pretty(chat.code);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(label || "Copied");
    } catch (e) {
      toast(text);
    }
  }

  async function shareText(text) {
    if (navigator.share) {
      try { await navigator.share({ text }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    copyText(text, "Copied");
  }

  async function toggleAlerts() {
    if (!("Notification" in window)) { toast("This browser doesn’t show alerts."); return; }
    if (Notification.permission === "granted") { toast("Alerts are on."); return; }
    const result = await Notification.requestPermission();
    toast(result === "granted" ? "Alerts are on." : "Alerts stay off until the browser allows them.");
    const btn = document.querySelector('[data-action="alerts"]');
    if (btn && result === "granted") btn.textContent = "Alerts are on";
  }

  function openChatMenu() {
    const chat = state.chats[openId];
    if (!chat) return;
    openSheet(titleOf(chat), [el("div", { class: "stack" }, [
      el("button", { type: "button", class: "btn full", "data-action": "open-info" }, "Details"),
      el("button", { type: "button", class: "btn ghost full", "data-action": "pin" }, chat.pin ? "Unpin" : "Pin"),
      el("button", { type: "button", class: "btn ghost full", "data-action": "mute" }, chat.mute ? "Unmute" : "Mute"),
      el("button", { type: "button", class: "btn danger full", "data-action": "delete-chat" }, "Delete chat"),
    ])]);
  }

  function openForward() {
    const found = findPicked();
    if (!found || found.msg.deleted) return;
    const chats = sortedChats().filter((chat) => chat.id !== found.chat.id && !chat.closed);
    if (!chats.length) {
      openSheet("Forward", [el("p", null, "Start another chat first, then forward.")]);
      return;
    }
    const box = el("div", { class: "stack" });
    chats.forEach((chat) => box.append(el("button", { type: "button", class: "btn ghost full", "data-action": "forward-to", "data-id": chat.id }, titleOf(chat))));
    openSheet("Forward", [box]);
  }

  function jumpTo(id) {
    const node = document.querySelector('[data-mid="' + CSS.escape(id) + '"]');
    if (!node) { toast("That message is further up. Open earlier messages."); return; }
    node.scrollIntoView({ block: "center", behavior: "smooth" });
    node.classList.add("flash");
    setTimeout(() => node.classList.remove("flash"), 1000);
  }

  function arm(target, label) {
    if (target.dataset.armed === "1") return true;
    target.dataset.armed = "1";
    target.textContent = label;
    return false;
  }

  function activeChat() {
    const route = currentRoute();
    if (route.name === "chat" || route.name === "info") return state.chats[route.id] || null;
    if (openId) return state.chats[openId] || null;
    return null;
  }

  function onClick(event) {
    if (event.target.closest("a")) return;
    if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
    const target = event.target.closest("[data-action]");
    if (!target) {
      if (!event.target.closest("#actions") && !event.target.closest(".bubble") && !event.target.closest(".chips")) clearPick();
      return;
    }
    const action = target.dataset.action;
    const chat = activeChat();
    if (action === "new") return openNewMenu();
    if (action === "details") return openDetails();
    if (action === "sheet-dm") return openDmSheet();
    if (action === "sheet-group") return openGroupSheet();
    if (action === "sheet-join") return openJoinSheet();
    if (action === "close-sheet") return closeSheet();
    if (action === "copy-code") return copyText(pretty(state.me.code), "Code copied");
    if (action === "share-code") return shareText(myShareText());
    if (action === "alerts") return toggleAlerts();
    if (action === "install-go") {
      if (!deferredPrompt) { toast("In Chrome, open the menu and choose Install app."); return; }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { deferredPrompt = null; $("install").hidden = true; });
      return;
    }
    if (action === "install-hide") {
      sessionStorage.setItem("fawlty-install-hide", "1");
      $("install").hidden = true;
      return;
    }
    if (action === "start-dm") return startFromSheet();
    if (action === "add-chip") return addChip();
    if (action === "drop-chip") {
      chips = chips.filter((code) => code !== target.dataset.code);
      renderChips();
      return;
    }
    if (action === "create-group") return createGroup($("group-name") ? $("group-name").value : "", chips.slice());
    if (action === "join-group") return joinFromSheet();
    if (action === "back") {
      const route = currentRoute();
      if (route.name === "info") go("c/" + encodeURIComponent(route.id));
      else go("/");
      return;
    }
    if (action === "open") return go("c/" + encodeURIComponent(target.dataset.id));
    if (action === "open-info") {
      const route = currentRoute();
      const id = route.name === "chat" ? route.id : openId;
      closeSheet();
      if (id) go("i/" + encodeURIComponent(id));
      return;
    }
    if (action === "chat-menu") return openChatMenu();
    if (action === "pick") {
      const sel = window.getSelection && String(window.getSelection());
      if (sel) return;
      pick(target.dataset.id);
      return;
    }
    if (action === "jump-bottom") {
      if (chat) renderLog(chat, "stick", false);
      return;
    }
    if (action === "earlier") {
      if (!chat) return;
      limits.set(chat.id, (limits.get(chat.id) || 120) + 150);
      renderLog(chat, "prepend", false);
      return;
    }
    if (action === "emoji") {
      $("emoji-panel").hidden = !$("emoji-panel").hidden;
      return;
    }
    if (action === "insert-emoji") {
      const draft = $("draft");
      const emoji = target.dataset.emoji || "";
      const start = draft.selectionStart == null ? draft.value.length : draft.selectionStart;
      const end = draft.selectionEnd == null ? start : draft.selectionEnd;
      draft.value = draft.value.slice(0, start) + emoji + draft.value.slice(end);
      const pos = start + emoji.length;
      draft.focus();
      draft.setSelectionRange(pos, pos);
      if (openId && state.chats[openId]) state.chats[openId].draft = draft.value;
      sizeDraft();
      syncSend();
      return;
    }
    if (action === "cancel-reply") { reply = null; updateReplyBanner(); return; }
    if (action === "react" || action === "toggle-react") {
      const found = action === "toggle-react" && chat ? { chat, msg: findMessage(chat, target.dataset.id) } : findPicked();
      if (found && found.msg) react(found.chat, found.msg, target.dataset.emoji || "");
      return;
    }
    if (action === "reply") {
      const found = findPicked();
      if (!found || found.msg.deleted) return;
      reply = { id: found.msg.id, name: found.msg.mine ? "You" : (found.msg.name || "Message"), text: snippet(found.msg) };
      clearPick();
      updateReplyBanner();
      $("draft").focus();
      return;
    }
    if (action === "forward") return openForward();
    if (action === "forward-to") {
      const found = findPicked();
      const dest = state.chats[target.dataset.id];
      if (!found || !dest) return;
      const text = found.msg.text;
      closeSheet();
      clearPick();
      sendText(dest, text, { fwd: true });
      go("c/" + encodeURIComponent(dest.id));
      return;
    }
    if (action === "copy-msg") {
      const found = findPicked();
      if (found) copyText(found.msg.text, "Message copied");
      return;
    }
    if (action === "jump-quote") {
      const found = findPicked();
      if (found && found.msg.quote) jumpTo(found.msg.quote.id);
      return;
    }
    if (action === "retry" || action === "retry-pick") {
      const msg = action === "retry" ? findMessage(chat, target.dataset.id) : (findPicked() && findPicked().msg);
      const owner = action === "retry" ? chat : (findPicked() && findPicked().chat);
      if (owner && msg) retryMessage(owner, msg);
      return;
    }
    if (action === "delete-me") {
      const found = findPicked();
      if (found) hideMessage(found.chat, found.msg);
      return;
    }
    if (action === "delete-all") {
      const found = findPicked();
      if (!found) return;
      if (!arm(target, "Tap again to delete for everyone")) return;
      deleteEverywhere(found.chat, found.msg);
      return;
    }
    if (action === "rejoin") {
      const group = chat && chat.kind === "group" ? chat : null;
      if (group) joinGroup(group.code);
      return;
    }
    if (action === "pin" || action === "mute") {
      if (!chat) return;
      chat[action === "pin" ? "pin" : "mute"] = !chat[action === "pin" ? "pin" : "mute"];
      persist();
      closeSheet();
      softRefresh();
      if (currentRoute().name === "info") renderInfo(chat.id);
      return;
    }
    if (action === "leave") {
      if (!chat || chat.kind !== "group") return;
      if (!arm(target, "Tap again to leave")) return;
      leaveGroup(chat);
      return;
    }
    if (action === "delete-chat") {
      if (!chat) return;
      if (!arm(target, "Tap again to delete")) return;
      deleteChat(chat.id);
      return;
    }
    if (action === "copy-group" && chat) return copyText(pretty(chat.code), "Group code copied");
    if (action === "share-group" && chat) return shareText(groupShareText(chat));
    if (action === "copy-peer" && chat) return copyText(pretty(chat.code), "Code copied");
    if (action === "add-member") {
      if (!chat) return;
      const parsed = classifyCode($("add-code") ? $("add-code").value : "");
      if (!parsed.code) { toast("Enter a code like ABCD-EFGH."); return; }
      if (parsed.group) { toast("That’s a group code. Add a person’s code."); return; }
      addMembers(chat, [parsed.code]);
      return;
    }
    if (action === "remove-member") {
      if (!chat) return;
      if (!arm(target, "Tap again")) return;
      removeMember(chat, target.dataset.code);
    }
  }

  function bind() {
    document.body.addEventListener("click", onClick);
    $("sheet").addEventListener("click", (event) => { if (event.target.id === "sheet") closeSheet(); });
    window.addEventListener("hashchange", () => { closeSheet(); pickId = ""; render(); });
    $("search").addEventListener("input", () => { $("list").scrollTop = 0; renderList(); });
    $("my-name").addEventListener("input", () => {
      state.me.name = $("my-name").value.replace(/[\u0000-\u001f]/g, "").slice(0, 32);
      persistSoon();
    });
    $("my-name").addEventListener("change", () => {
      Object.values(state.chats).forEach((chat) => {
        const me = (chat.members || []).find((m) => m.code === state.me.code);
        if (me) me.name = myName();
      });
      persist();
    });
    $("composer").addEventListener("submit", (event) => {
      event.preventDefault();
      const route = currentRoute();
      const chat = state.chats[route.id];
      if (!chat || chat.closed) return;
      const text = cleanMessage($("draft").value);
      if (!text) return;
      const quote = reply ? { id: reply.id, name: reply.name, text: reply.text } : null;
      sendText(chat, text, { quote });
    });
    $("draft").addEventListener("input", () => {
      sizeDraft();
      syncSend();
      if (openId && state.chats[openId]) {
        state.chats[openId].draft = $("draft").value;
        persistSoon();
      }
    });
    $("draft").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && matchMedia("(pointer: fine)").matches) {
        event.preventDefault();
        $("composer").requestSubmit();
      }
    });
    $("draft").addEventListener("focus", () => {
      const chat = state.chats[openId];
      if (chat) renderLog(chat, "stick", false);
    });
    document.addEventListener("change", (event) => {
      const route = currentRoute();
      if (route.name !== "info") return;
      const chat = state.chats[route.id];
      if (!chat) return;
      if (event.target.id === "info-nick") {
        chat.nick = cleanName(event.target.value);
        persist();
        const heading = document.querySelector("#info h2");
        if (heading) heading.textContent = titleOf(chat);
      }
      if (event.target.id === "info-gname") {
        renameGroup(chat, event.target.value).then((changed) => {
          if (!changed) event.target.value = chat.gname;
          else renderInfo(chat.id);
        });
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.target && event.target.id === "draft") return;
      if (event.key === "Escape") {
        if (!$("sheet").hidden) closeSheet();
        else clearPick();
        return;
      }
      if (event.key === "Enter" && event.target.id === "dm-code") { event.preventDefault(); startFromSheet(); }
      if (event.key === "Enter" && event.target.id === "dm-nick") { event.preventDefault(); startFromSheet(); }
      if (event.key === "Enter" && event.target.id === "join-code") { event.preventDefault(); joinFromSheet(); }
      if (event.key === "Enter" && event.target.id === "member-code") { event.preventDefault(); addChip(); }
      if (event.key === "Enter" && event.target.id === "add-code") {
        event.preventDefault();
        const button = document.querySelector('[data-action="add-member"]');
        if (button) button.click();
      }
      if ((event.key === "Enter" || event.key === " ") && event.target.classList && event.target.classList.contains("bubble")) {
        event.preventDefault();
        pick(event.target.dataset.id);
      }
    });
    document.addEventListener("pointerdown", (event) => {
      const bubble = event.target.closest && event.target.closest(".bubble");
      if (!bubble || event.target.closest("a")) return;
      pressX = event.clientX;
      pressY = event.clientY;
      pressTimer = setTimeout(() => {
        suppressClick = true;
        if (navigator.vibrate) navigator.vibrate(10);
        pick(bubble.dataset.id);
      }, 420);
    });
    document.addEventListener("pointermove", (event) => {
      if (Math.hypot(event.clientX - pressX, event.clientY - pressY) > 8) clearTimeout(pressTimer);
    });
    document.addEventListener("pointerup", () => clearTimeout(pressTimer));
    document.addEventListener("pointercancel", () => clearTimeout(pressTimer));
    document.addEventListener("contextmenu", (event) => {
      const bubble = event.target.closest && event.target.closest(".bubble");
      if (!bubble) return;
      event.preventDefault();
      pick(bubble.dataset.id);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      refreshSoon();
      const route = currentRoute();
      if (route.name === "chat") scheduleReceipt(state.chats[route.id]);
    });
    window.addEventListener("online", () => { updateNet(); refreshSoon(); });
    window.addEventListener("offline", updateNet);
    window.addEventListener("pagehide", () => { captureDraft(); persist(); });
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      if (sessionStorage.getItem("fawlty-install-hide") !== "1") $("install").hidden = false;
    });
  }

  function setupInstall() {
    const standalone = matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone || sessionStorage.getItem("fawlty-install-hide") === "1") return;
    $("install").hidden = false;
  }

  function bindViewport() {
    const apply = () => {
      const viewport = window.visualViewport;
      document.documentElement.style.setProperty("--vvh", (viewport ? viewport.height : window.innerHeight) + "px");
      document.documentElement.style.setProperty("--vvtop", (viewport ? viewport.offsetTop : 0) + "px");
    };
    apply();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", apply);
      window.visualViewport.addEventListener("scroll", apply);
    }
    window.addEventListener("resize", apply);
  }

  function paintChrome() {
    document.querySelectorAll("[data-icon]").forEach((node) => {
      if (!node.querySelector(".icon")) node.append(icon(node.dataset.icon));
    });
    const box = $("reacts");
    if (!box.childElementCount) {
      REACTIONS.forEach((emoji) => box.append(el("button", { type: "button", "data-action": "react", "data-emoji": emoji, "aria-label": "React " + emoji }, emoji)));
    }
    const panel = $("emoji-panel");
    if (!panel.childElementCount) {
      EMOJIS.forEach((emoji) => panel.append(el("button", { type: "button", "data-action": "insert-emoji", "data-emoji": emoji, "aria-label": "Insert " + emoji }, emoji)));
    }
  }

  function boot() {
    state = loadState();
    seedSeen();
    $("my-code").textContent = pretty(state.me.code);
    $("my-name").value = state.me.name || "";
    paintChrome();
    bindViewport();
    bind();
    setupInstall();
    render();
    sync().catch(() => updateNet());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.open) go("c/" + encodeURIComponent(event.data.open));
      });
    }
    window.Fawlty = {
      get state() { return state; },
      pretty, classifyCode, userTopic, groupTopic,
    };
  }

  boot();
})();
