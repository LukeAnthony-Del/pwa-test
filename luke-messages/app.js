(function () {
  "use strict";

  const ICONS = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    call: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 4.8h2.1l1.1 2.8-1.6 1a12 12 0 0 0 5.6 5.6l1-1.6 2.8 1.1v2.1a2 2 0 0 1-2 2A13.2 13.2 0 0 1 6.2 6.8a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    compose: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18 10l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12.5 6.5 4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    import: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10M8.5 10.5 12 14l3.5-3.5M5 19h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bubble: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 16.2 4.2 20l3.6-1.3A8 8 0 1 0 6.2 16.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    person: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.6 19.2c1.2-2.9 3.4-4.3 6.4-4.3s5.2 1.4 6.4 4.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    in: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7 7 17M7 9v8h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    missed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 9v8H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    backspace: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-5-6 5-6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m11 10 4 4M15 10l-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };

  const PALETTE = ["#1e5344", "#3d4f6f", "#6a4b3a", "#6e3d4a", "#3e5d57", "#5c5340", "#2f4a44", "#3f5c4b"];
  const state = { messages: new Map(), calls: new Map(), contacts: new Map() };
  const dirty = { messages: new Set(), calls: new Set(), contacts: new Set(), deleteContacts: new Set() };
  const threadIndex = new Map();
  const byThread = new Map();
  const limits = new Map();
  let db = null;
  let persistChain = Promise.resolve();
  let threadsDirty = true;
  let messagesDirty = true;
  let dataVersion = 0;
  let conversationCache = null;
  let callCache = null;
  let contactCache = null;
  let importing = false;
  let dialed = "";
  let deferredPrompt = null;
  let toastTimer = 0;
  let parkedScroll = null;
  let listPaint = { screen: "", query: "", version: -1 };
  const listWindow = { messages: 80, calls: 80, contacts: 120 };

  const $ = (id) => document.getElementById(id);

  function icon(name, small) {
    const node = document.createElement("span");
    node.className = small ? "icon sm" : "icon";
    node.innerHTML = ICONS[name] || "";
    return node;
  }

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

  function hash(value) {
    let h = 2166136261;
    const text = String(value);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function formatPhone(raw) {
    const text = String(raw || "").trim();
    const digits = text.replace(/\D/g, "");
    const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    if (national.length === 10) return "(" + national.slice(0, 3) + ") " + national.slice(3, 6) + "-" + national.slice(6);
    return text || "Unknown";
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
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const remain = total % 60;
    if (minutes >= 60) return Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
    if (minutes) return minutes + "m " + remain + "s";
    return total + "s";
  }

  function initials(name) {
    const parts = String(name || "").replace(/[^\p{L}\p{N} ]+/gu, "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "#";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function avatarText(title) {
    if (/^[\d()+\-\s.]+$/.test(title || "")) return String(title).replace(/\D/g, "").slice(-2) || "#";
    return initials(title);
  }

  function colorFor(id) {
    let h = 0;
    const text = String(id || "");
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }

  function avatar(title, id, large) {
    return el("span", { class: large ? "avatar lg" : "avatar", style: "background:" + colorFor(id || title), "aria-hidden": "true" }, avatarText(title));
  }

  function plural(count, word) {
    return new Intl.NumberFormat().format(count) + " " + word + (count === 1 ? "" : "s");
  }

  function phoneHref(raw, kind, body) {
    const text = String(raw || "").trim();
    const plus = text.startsWith("+");
    const digits = text.replace(/\D/g, "");
    if (digits.length < 3 || digits.length > 15) return "";
    const number = (plus ? "+" : "") + digits;
    if (kind === "tel") return "tel:" + number;
    if (!body) return "sms:" + number;
    const encoded = encodeURIComponent(body);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return ios ? "sms:" + number + "&body=" + encoded : "sms:" + number + "?body=" + encoded;
  }

  function openLink(href) {
    if (!href) return false;
    const link = document.createElement("a");
    link.href = href;
    document.body.append(link);
    link.click();
    link.remove();
    return true;
  }

  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      node.hidden = true;
    }, 4600);
  }

  function invalidate() {
    threadsDirty = true;
    messagesDirty = true;
    conversationCache = null;
    callCache = null;
    contactCache = null;
    dataVersion += 1;
    listPaint.version = -1;
  }

  function ensureThreads() {
    if (!threadsDirty) return;
    threadIndex.clear();
    for (const contact of state.contacts.values()) {
      for (const phone of contact.phones) {
        const key = LukeParse.threadKey(phone);
        if (key && !threadIndex.has(key)) threadIndex.set(key, contact.id);
      }
    }
    threadsDirty = false;
  }

  function ensureMessages() {
    if (!messagesDirty) return;
    ensureThreads();
    byThread.clear();
    for (const message of state.messages.values()) {
      let list = byThread.get(message.thread);
      if (!list) byThread.set(message.thread, (list = []));
      list.push(message);
    }
    for (const list of byThread.values()) list.sort((a, b) => a.date - b.date || a.id.localeCompare(b.id));
    messagesDirty = false;
  }

  function contactForThread(thread) {
    ensureThreads();
    const id = threadIndex.get(thread);
    return id ? state.contacts.get(id) : null;
  }

  function messagesFor(thread) {
    ensureMessages();
    return byThread.get(thread) || [];
  }

  function addressForThread(thread) {
    const contact = contactForThread(thread);
    if (contact) {
      const phone = contact.phones.find((item) => LukeParse.threadKey(item) === thread);
      if (phone) return phone;
    }
    const list = messagesFor(thread);
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].address) return list[i].address;
    }
    return thread.startsWith("g:") ? "" : thread;
  }

  function titleForThread(thread) {
    const contact = contactForThread(thread);
    if (contact && contact.name) return contact.name;
    return formatPhone(addressForThread(thread) || thread);
  }

  function canReach(thread) {
    if (!thread || String(thread).startsWith("g:")) return false;
    return Boolean(phoneHref(addressForThread(thread), "tel"));
  }

  function conversations() {
    if (conversationCache) return conversationCache;
    ensureMessages();
    const rows = [];
    for (const [thread, list] of byThread) {
      const last = list[list.length - 1];
      let unread = 0;
      for (const message of list) if (message.direction === "in" && !message.read) unread += 1;
      rows.push({ thread, last, unread });
    }
    rows.sort((a, b) => b.last.date - a.last.date);
    conversationCache = rows;
    return rows;
  }

  function allCalls() {
    if (!callCache) callCache = [...state.calls.values()].sort((a, b) => b.date - a.date);
    return callCache;
  }

  function allContacts() {
    if (!contactCache) {
      contactCache = [...state.contacts.values()].sort((a, b) => contactTitle(a).localeCompare(contactTitle(b)));
    }
    return contactCache;
  }

  function contactTitle(contact) {
    return contact.name || formatPhone(contact.phones[0] || contact.emails[0] || "Unknown");
  }

  function upsertPerson({ name, phones, emails }) {
    const cleanPhones = [];
    for (const phone of phones || []) {
      const value = String(phone || "").trim();
      const key = LukeParse.threadKey(value);
      if (!key || cleanPhones.some((item) => LukeParse.threadKey(item) === key)) continue;
      cleanPhones.push(value);
    }
    const cleanEmails = [...new Set((emails || []).map((item) => String(item || "").trim()).filter(Boolean))];
    const nameClean = LukeParse.cleanName(name);
    if (!nameClean && !cleanPhones.length && !cleanEmails.length) return null;
    ensureThreads();
    let contact = null;
    for (const phone of cleanPhones) {
      const id = threadIndex.get(LukeParse.threadKey(phone));
      if (id && state.contacts.has(id)) {
        contact = state.contacts.get(id);
        break;
      }
    }
    let created = false;
    if (!contact) {
      const seed = cleanPhones[0] ? LukeParse.threadKey(cleanPhones[0]) : hash(cleanEmails[0] || nameClean);
      contact = { id: cleanPhones[0] ? "c:" + seed : "c:e:" + seed, name: "", phones: [], emails: [] };
      created = true;
    }
    let changed = created;
    if (nameClean && contact.name !== nameClean && (!contact.name || nameClean.length >= contact.name.length)) {
      contact.name = nameClean;
      changed = true;
    }
    for (const phone of cleanPhones) {
      if (!contact.phones.some((item) => LukeParse.threadKey(item) === LukeParse.threadKey(phone))) {
        contact.phones.push(phone);
        changed = true;
      }
    }
    for (const email of cleanEmails) {
      if (!contact.emails.includes(email)) {
        contact.emails.push(email);
        changed = true;
      }
    }
    state.contacts.set(contact.id, contact);
    for (const phone of contact.phones) {
      const stubId = "c:" + LukeParse.threadKey(phone);
      if (stubId !== contact.id && state.contacts.has(stubId)) {
        const stub = state.contacts.get(stubId);
        if (stub.name && !contact.name) contact.name = stub.name;
        for (const email of stub.emails) if (!contact.emails.includes(email)) contact.emails.push(email);
        state.contacts.delete(stubId);
        dirty.deleteContacts.add(stubId);
        changed = true;
      }
    }
    for (const phone of contact.phones) {
      const key = LukeParse.threadKey(phone);
      if (key) threadIndex.set(key, contact.id);
    }
    if (changed) dirty.contacts.add(contact.id);
    contactCache = null;
    return { contact, created };
  }

  function addMessage(record, source) {
    const thread = LukeParse.threadKey(record.address);
    if (!thread || !record.body || !record.date) return { fresh: false, created: false };
    const message = {
      id: "m:" + thread + ":" + record.date + ":" + record.direction + ":" + hash(record.body),
      thread,
      address: record.address,
      body: record.body,
      date: record.date,
      direction: record.direction === "in" ? "in" : "out",
      read: record.read !== false,
      source: source || "import",
    };
    const fresh = !state.messages.has(message.id);
    if (fresh) {
      state.messages.set(message.id, message);
      dirty.messages.add(message.id);
      messagesDirty = true;
      conversationCache = null;
    }
    const person = upsertPerson({ name: record.name, phones: [record.address] });
    return { fresh, created: !!(person && person.created) };
  }

  function addCall(record) {
    const thread = LukeParse.threadKey(record.number);
    if (!thread || !record.date) return { fresh: false, created: false };
    const call = {
      id: "call:" + thread + ":" + record.date + ":" + record.kind + ":" + (record.duration || 0),
      thread,
      number: record.number,
      date: record.date,
      duration: record.duration || 0,
      kind: record.kind || "missed",
    };
    const fresh = !state.calls.has(call.id);
    if (fresh) {
      state.calls.set(call.id, call);
      dirty.calls.add(call.id);
      callCache = null;
    }
    const person = upsertPerson({ name: record.name, phones: [record.number] });
    return { fresh, created: !!(person && person.created) };
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("luke-messages", 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("messages")) database.createObjectStore("messages", { keyPath: "id" });
        if (!database.objectStoreNames.contains("calls")) database.createObjectStore("calls", { keyPath: "id" });
        if (!database.objectStoreNames.contains("contacts")) database.createObjectStore("contacts", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getDb() {
    if (!db) db = await openDb();
    return db;
  }

  function getAll(database, store) {
    return new Promise((resolve, reject) => {
      const request = database.transaction(store, "readonly").objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function putAll(database, store, items) {
    if (!items.length) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(store, "readwrite");
      const objectStore = tx.objectStore(store);
      items.forEach((item) => objectStore.put(item));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function deleteIds(database, store, ids) {
    if (!ids.length) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(store, "readwrite");
      const objectStore = tx.objectStore(store);
      ids.forEach((id) => objectStore.delete(id));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function flush() {
    const messageIds = [...dirty.messages];
    const callIds = [...dirty.calls];
    const contactIds = [...dirty.contacts];
    const deleteContactIds = [...dirty.deleteContacts];
    dirty.messages.clear();
    dirty.calls.clear();
    dirty.contacts.clear();
    dirty.deleteContacts.clear();
    if (!messageIds.length && !callIds.length && !contactIds.length && !deleteContactIds.length) return;
    try {
      const database = await getDb();
      await deleteIds(database, "contacts", deleteContactIds);
      await putAll(database, "messages", messageIds.map((id) => state.messages.get(id)).filter(Boolean));
      await putAll(database, "calls", callIds.map((id) => state.calls.get(id)).filter(Boolean));
      await putAll(database, "contacts", contactIds.map((id) => state.contacts.get(id)).filter(Boolean));
    } catch (error) {
      messageIds.forEach((id) => dirty.messages.add(id));
      callIds.forEach((id) => dirty.calls.add(id));
      contactIds.forEach((id) => dirty.contacts.add(id));
      deleteContactIds.forEach((id) => dirty.deleteContacts.add(id));
      throw error;
    }
  }

  function persist() {
    const job = persistChain.then(flush);
    persistChain = job.catch(() => {});
    return job;
  }

  async function load() {
    const database = await getDb();
    const [messages, calls, contacts] = await Promise.all([
      getAll(database, "messages"),
      getAll(database, "calls"),
      getAll(database, "contacts"),
    ]);
    messages.forEach((item) => state.messages.set(item.id, item));
    calls.forEach((item) => state.calls.set(item.id, item));
    contacts.forEach((item) => state.contacts.set(item.id, item));
    invalidate();
  }

  async function readFile(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text;
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) text = new TextDecoder("utf-16le").decode(bytes);
    else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) text = new TextDecoder("utf-16be").decode(bytes);
    else text = new TextDecoder("utf-8").decode(bytes);
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return text;
  }

  async function importText(name, text) {
    const parsed = await LukeParse.parseBackup(name, text);
    if (parsed.kind === "zip") {
      return { error: "Unzip that backup first, then import the XML file inside." };
    }
    if (parsed.kind === "unknown") {
      return { error: "That file isn’t a messages backup, call log, or contacts export." };
    }
    let messages = 0;
    let calls = 0;
    let contacts = 0;
    for (const record of parsed.messages) {
      const saved = addMessage(record, "import");
      if (saved.fresh) messages += 1;
      if (saved.created) contacts += 1;
    }
    for (const record of parsed.calls) {
      const saved = addCall(record);
      if (saved.fresh) calls += 1;
      if (saved.created) contacts += 1;
    }
    for (const record of parsed.contacts) {
      const saved = upsertPerson(record);
      if (saved && saved.created) contacts += 1;
    }
    invalidate();
    try {
      await persist();
    } catch (error) {
      return { error: "This backup is too big for the browser’s storage." };
    }
    return { messages, calls, contacts, empty: messages + calls + contacts === 0 };
  }

  async function importFiles(fileList) {
    if (importing) return;
    const files = [...fileList];
    if (!files.length) return;
    importing = true;
    $("pick-file").disabled = true;
    const status = $("import-status");
    let messages = 0;
    let calls = 0;
    let contacts = 0;
    let errors = 0;
    try {
      for (const file of files) {
        if (file.size > 150 * 1024 * 1024) {
          errors += 1;
          status.textContent = file.name + " is over 150 MB. Export a smaller backup and try again.";
          continue;
        }
        status.textContent = "Reading " + file.name + "…";
        const result = await importText(file.name, await readFile(file));
        if (result.error) {
          errors += 1;
          status.textContent = result.error;
          toast(result.error);
          continue;
        }
        messages += result.messages;
        calls += result.calls;
        contacts += result.contacts;
      }
      const summary = "Imported " + plural(messages, "message") + ", " + plural(calls, "call") + ", and " + plural(contacts, "contact") + ".";
      if (messages + calls + contacts > 0) {
        status.textContent = summary;
        toast(summary);
      } else if (!errors) status.textContent = "No new messages, calls, or contacts were in that file.";
      render();
    } finally {
      importing = false;
      $("pick-file").disabled = false;
      $("file").value = "";
    }
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, "");
    if (raw.startsWith("t/")) return { name: "thread", screen: "messages", thread: decodeURIComponent(raw.slice(2)) };
    if (raw.startsWith("c/")) return { name: "contact", screen: "contacts", id: decodeURIComponent(raw.slice(2)) };
    if (raw.startsWith("calls")) return { name: "calls", screen: "calls" };
    if (raw.startsWith("contacts")) return { name: "contacts", screen: "contacts" };
    return { name: "messages", screen: "messages" };
  }

  function go(path) {
    const next = "#" + path;
    if (location.hash === next || (path === "/" && (location.hash === "" || location.hash === "#" || location.hash === "#/"))) {
      render();
      return;
    }
    location.hash = next;
  }

  function query() {
    return $("search").value.trim().toLowerCase();
  }

  function matches(q, parts) {
    if (!q) return true;
    return parts.join(" ").toLowerCase().includes(q);
  }

  function emptyState(title, copy, action, label) {
    const mark = el("div", { class: "empty-mark", "aria-hidden": "true" }, icon(action === "keypad" ? "call" : "bubble"));
    return el("div", { class: "empty" }, [
      mark,
      el("h2", null, title),
      el("p", null, copy),
      el("button", { type: "button", class: "btn", "data-action": action }, label),
    ]);
  }

  function renderMessages(force) {
    const q = query();
    if (!force && listPaint.screen === "messages" && listPaint.query === q && listPaint.version === dataVersion) return;
    listPaint = { screen: "messages", query: q, version: dataVersion };
    const screen = $("screen-messages");
    screen.replaceChildren();
    const rows = conversations().filter((row) => matches(q, [titleForThread(row.thread), addressForThread(row.thread), row.last.body]));
    if (!rows.length) {
      screen.append(
        state.messages.size
          ? el("p", { class: "nothing" }, "Nothing matches.")
          : emptyState(
              "No messages yet",
              "Import a backup from the phone that uses Google Messages. You can read those chats here, text from your number, and start calls.",
              "import",
              "Import"
            )
      );
      return;
    }
    const shown = rows.slice(0, listWindow.messages);
    const frag = document.createDocumentFragment();
    shown.forEach((row) => {
      const title = titleForThread(row.thread);
      const button = el("button", { type: "button", class: row.unread ? "row unread" : "row", "data-action": "open-thread", "data-thread": row.thread }, [
        avatar(title, row.thread),
        el("span", null, [
          el("span", { class: "title-line" }, el("strong", null, title)),
          el("span", { class: "sub-line" }, el("span", null, row.last.body.replace(/\s+/g, " "))),
        ]),
        el("span", { class: "when" }, [
          formatWhen(row.last.date),
          row.unread ? el("span", { class: "badge" }, row.unread > 99 ? "99+" : String(row.unread)) : null,
        ]),
      ]);
      frag.append(button);
    });
    screen.append(frag);
    if (rows.length > shown.length) {
      screen.append(el("button", { type: "button", class: "earlier", "data-action": "more-list", "data-list": "messages" }, "Show more"));
    }
  }

  function renderCalls(force) {
    const q = query();
    if (!force && listPaint.screen === "calls" && listPaint.query === q && listPaint.version === dataVersion) return;
    listPaint = { screen: "calls", query: q, version: dataVersion };
    const screen = $("screen-calls");
    screen.replaceChildren();
    const rows = allCalls().filter((call) => matches(q, [titleForThread(call.thread), call.number, call.kind]));
    if (!rows.length) {
      screen.append(
        state.calls.size
          ? el("p", { class: "nothing" }, "Nothing matches.")
          : emptyState("No calls yet", "Call history shows up after you import a call-log backup. You can still dial from the keypad.", "keypad", "Open keypad")
      );
      return;
    }
    const shown = rows.slice(0, listWindow.calls);
    const frag = document.createDocumentFragment();
    shown.forEach((call) => {
      const title = titleForThread(call.thread);
      const label = call.kind === "out" ? "Outgoing" : call.kind === "in" ? "Incoming" : "Missed";
      const detail = label + (call.kind !== "missed" && call.duration > 0 ? " · " + formatDuration(call.duration) : "");
      frag.append(
        el("button", { type: "button", class: "row", "data-action": "call-number", "data-number": call.number }, [
          avatar(title, call.thread),
          el("span", null, [
            el("span", { class: "title-line" }, el("strong", { class: call.kind === "missed" ? "missed-name" : "" }, title)),
            el("span", { class: "call-kind " + call.kind }, [icon(call.kind === "out" ? "out" : call.kind === "in" ? "in" : "missed", true), detail]),
          ]),
          el("span", { class: "when" }, formatWhen(call.date)),
        ])
      );
    });
    screen.append(frag);
    if (rows.length > shown.length) screen.append(el("button", { type: "button", class: "earlier", "data-action": "more-list", "data-list": "calls" }, "Show more"));
  }

  function renderContacts(force) {
    const q = query();
    if (!force && listPaint.screen === "contacts" && listPaint.query === q && listPaint.version === dataVersion) return;
    listPaint = { screen: "contacts", query: q, version: dataVersion };
    const screen = $("screen-contacts");
    screen.replaceChildren();
    const rows = allContacts().filter((contact) => matches(q, [contact.name, ...contact.phones, ...contact.emails]));
    if (!rows.length) {
      screen.append(
        state.contacts.size
          ? el("p", { class: "nothing" }, "Nothing matches.")
          : emptyState("No contacts yet", "Import a contacts file, or bring people in with a message backup.", "import", "Import")
      );
      return;
    }
    const shown = rows.slice(0, listWindow.contacts);
    const frag = document.createDocumentFragment();
    let letter = "";
    shown.forEach((contact) => {
      const title = contactTitle(contact);
      const next = (title[0] || "#").toUpperCase();
      if (!q && next !== letter) {
        letter = next;
        frag.append(el("h3", { class: "letter" }, letter));
      }
      frag.append(
        el("button", { type: "button", class: "row", "data-action": "open-contact", "data-id": contact.id }, [
          avatar(title, contact.id),
          el("span", null, [
            el("span", { class: "title-line" }, el("strong", null, title)),
            el("span", { class: "sub-line" }, el("span", null, contact.phones[0] ? formatPhone(contact.phones[0]) : contact.emails[0] || "")),
          ]),
        ])
      );
    });
    screen.append(frag);
    if (rows.length > shown.length) screen.append(el("button", { type: "button", class: "earlier", "data-action": "more-list", "data-list": "contacts" }, "Show more"));
  }

  function renderThread(thread, mode) {
    const title = titleForThread(thread);
    const address = addressForThread(thread);
    const who = $("thread-who");
    who.replaceChildren(avatar(title, thread), el("span", null, [el("strong", null, title), el("small", null, formatPhone(address || ""))]));
    const call = $("thread-call");
    call.hidden = !canReach(thread);
    call.dataset.number = address || "";
    const note = $("composer-note");
    note.textContent = canReach(thread)
      ? "Send opens your phone’s texting app so the message goes out on your number. A copy stays here."
      : "This conversation doesn’t have a single phone number to text. You can still read it here.";
    const log = $("log");
    const previousHeight = mode === "keep" ? log.scrollHeight : 0;
    const all = messagesFor(thread);
    const limit = limits.get(thread) || 200;
    const start = Math.max(0, all.length - limit);
    const frag = document.createDocumentFragment();
    if (!all.length) frag.append(el("p", { class: "nothing" }, "No messages saved here yet."));
    if (start > 0) frag.append(el("button", { type: "button", class: "earlier", "data-action": "earlier" }, "Earlier messages (" + start + ")"));
    let lastDay = "";
    let lastDirection = "";
    let lastDate = 0;
    all.slice(start).forEach((message) => {
      const day = dayLabel(message.date);
      if (day !== lastDay) {
        frag.append(el("div", { class: "day" }, day));
        lastDay = day;
        lastDirection = "";
      }
      const tight = lastDirection === message.direction && message.date - lastDate < 120000;
      const time = new Date(message.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      frag.append(
        el("div", { class: "bubble-row " + message.direction + (tight ? " tight" : "") }, [
          el("div", { class: "bubble" }, [message.body, el("time", { datetime: new Date(message.date).toISOString() }, time)]),
        ])
      );
      lastDirection = message.direction;
      lastDate = message.date;
    });
    log.replaceChildren(frag);
    if (mode === "keep") log.scrollTop = log.scrollHeight - previousHeight;
    else requestAnimationFrame(() => {
      log.scrollTop = log.scrollHeight;
    });
    document.title = title + " · Luke Messages";
  }

  function renderPerson(id) {
    const contact = state.contacts.get(id);
    const body = $("person-body");
    body.replaceChildren();
    if (!contact) {
      body.append(el("p", { class: "nothing" }, "That contact isn’t here."));
      return;
    }
    const title = contactTitle(contact);
    body.append(avatar(title, contact.id, true), el("h2", null, title));
    const detail = el("div", { class: "detail" });
    contact.phones.forEach((phone) => {
      const thread = LukeParse.threadKey(phone);
      detail.append(
        el("div", { class: "detail-row" }, [
          el("span", null, [el("strong", null, formatPhone(phone)), el("span", null, "Phone")]),
          el("span", { class: "detail-actions" }, [
            el("button", { type: "button", "data-action": "open-thread", "data-thread": thread }, "Text"),
            el("button", { type: "button", "data-action": "call-number", "data-number": phone }, "Call"),
          ]),
        ])
      );
    });
    contact.emails.forEach((email) => {
      detail.append(
        el("div", { class: "detail-row" }, [
          el("span", null, [el("strong", null, email), el("span", null, "Email")]),
          el("a", { href: "mailto:" + encodeURIComponent(email) }, "Email"),
        ])
      );
    });
    if (!contact.phones.length && !contact.emails.length) detail.append(el("div", { class: "detail-row" }, "No phone number saved."));
    body.append(detail);
    document.title = title + " · Luke Messages";
  }

  function showScreen(name) {
    ["messages", "calls", "contacts"].forEach((screen) => {
      $("screen-" + screen).classList.toggle("on", screen === name);
      document.querySelector('[data-tab="' + screen + '"]').classList.toggle("on", screen === name);
    });
    const placeholders = { messages: "Search messages", calls: "Search calls", contacts: "Search contacts" };
    $("search").placeholder = placeholders[name];
    $("fab").hidden = name !== "calls";
    $("search-wrap").hidden = false;
  }

  function closeSheets() {
    $("import-sheet").hidden = true;
    $("compose-sheet").hidden = true;
    $("keypad").hidden = true;
    resetClearButton();
  }

  function render() {
    const route = parseRoute();
    const overlay = route.name === "thread" || route.name === "contact";
    document.body.classList.toggle("locked", overlay);
    if (overlay && parkedScroll == null) parkedScroll = $("main").scrollTop;
    $("thread").hidden = route.name !== "thread";
    $("person").hidden = route.name !== "contact";
    if (route.name === "thread") {
      $("search-wrap").hidden = true;
      $("fab").hidden = true;
      renderThread(route.thread);
      markRead(route.thread);
      return;
    }
    if (route.name === "contact") {
      $("search-wrap").hidden = true;
      $("fab").hidden = true;
      renderPerson(route.id);
      return;
    }
    document.title = "Luke Messages";
    closeSheets();
    showScreen(route.screen);
    if (route.screen === "messages") renderMessages();
    if (route.screen === "calls") renderCalls();
    if (route.screen === "contacts") renderContacts();
    if (parkedScroll != null) {
      const y = parkedScroll;
      parkedScroll = null;
      requestAnimationFrame(() => {
        $("main").scrollTop = y;
      });
    }
  }

  async function markRead(thread) {
    const pending = [];
    for (const message of messagesFor(thread)) {
      if (message.direction === "in" && !message.read) {
        message.read = true;
        pending.push(message);
        dirty.messages.add(message.id);
      }
    }
    if (!pending.length) return;
    invalidate();
    try {
      await persist();
    } catch (error) {
      toast("Couldn’t update this chat on this device.");
    }
  }

  function sendCurrent() {
    const route = parseRoute();
    if (route.name !== "thread") return;
    const thread = route.thread;
    const body = $("draft").value.trim();
    const address = addressForThread(thread);
    if (!canReach(thread)) {
      toast("This chat doesn’t have a phone number Luke Messages can text.");
      return;
    }
    if (body) {
      addMessage({ address, body, date: Date.now(), direction: "out", read: true }, "phone");
      invalidate();
      persist().catch(() => toast("The copy couldn’t be saved on this device."));
      $("draft").value = "";
      $("draft").style.height = "auto";
      renderThread(thread);
    }
    const href = phoneHref(address, "sms", body);
    if (openLink(href)) toast(body ? "Your phone’s texting app should open with this message." : "Your phone’s texting app should open.");
    else toast("This device can’t open the texting app. The message is saved here.");
  }

  function startThread(raw, name) {
    const thread = LukeParse.threadKey(raw);
    if (!thread || String(thread).startsWith("g:")) {
      toast("Enter a phone number to text.");
      return;
    }
    upsertPerson({ name: name || "", phones: [raw] });
    invalidate();
    persist().catch(() => {});
    $("compose-sheet").hidden = true;
    go("t/" + encodeURIComponent(thread));
  }

  function renderComposeResults() {
    const value = $("compose-to").value.trim();
    const q = value.toLowerCase();
    const box = $("compose-results");
    box.replaceChildren();
    const people = allContacts()
      .filter((contact) => matches(q, [contact.name, ...contact.phones]))
      .slice(0, 8);
    people.forEach((contact) => {
      const phone = contact.phones[0];
      if (!phone) return;
      box.append(
        el("button", { type: "button", class: "row", "data-action": "start", "data-number": phone, "data-name": contact.name || "" }, [
          avatar(contactTitle(contact), contact.id),
          el("span", null, [
            el("span", { class: "title-line" }, el("strong", null, contactTitle(contact))),
            el("span", { class: "sub-line" }, el("span", null, formatPhone(phone))),
          ]),
        ])
      );
    });
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 3 && !people.some((contact) => contact.phones.some((phone) => LukeParse.threadKey(phone) === LukeParse.threadKey(value)))) {
      box.append(el("button", { type: "button", class: "row", "data-action": "start", "data-number": value, "data-name": "" }, "Text " + formatPhone(value)));
    }
  }

  function renderDial() {
    const node = $("dial-display");
    if (!dialed) {
      node.textContent = "Enter a number";
      node.classList.add("is-empty");
      return;
    }
    node.classList.remove("is-empty");
    const digits = dialed.replace(/\D/g, "");
    if (digits.length === 10) node.textContent = formatPhone(digits);
    else if (digits.length === 11 && digits.startsWith("1")) node.textContent = "+1 " + formatPhone(digits);
    else node.textContent = dialed;
  }

  function pushDial(char) {
    if (char === "+") {
      if (!dialed.startsWith("+")) dialed = "+" + dialed;
    } else if (/[0-9*#]/.test(char) && dialed.replace(/\D/g, "").length < 15) dialed += char;
    renderDial();
  }

  function dialAction(kind) {
    if (dialed.replace(/\D/g, "").length < 3) {
      toast("Enter a phone number first.");
      return;
    }
    if (kind === "text") {
      startThread(dialed, "");
      $("keypad").hidden = true;
      return;
    }
    const href = phoneHref(dialed, "tel");
    if (!openLink(href)) toast("This device can’t start a phone call.");
  }

  function resetClearButton() {
    const button = document.querySelector('[data-action="clear"]');
    if (!button) return;
    button.dataset.armed = "";
    button.textContent = "Remove everything saved here";
  }

  async function clearAll() {
    if (importing) return;
    await persistChain.catch(() => {});
    if (db) {
      db.close();
      db = null;
    }
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase("luke-messages");
      request.onsuccess = resolve;
      request.onerror = resolve;
      request.onblocked = resolve;
    });
    state.messages.clear();
    state.calls.clear();
    state.contacts.clear();
    dirty.messages.clear();
    dirty.calls.clear();
    dirty.contacts.clear();
    dirty.deleteContacts.clear();
    limits.clear();
    invalidate();
    $("import-status").textContent = "";
    resetClearButton();
    toast("Removed everything saved in Luke Messages on this device.");
    go("/");
  }

  async function pickDeviceContacts() {
    if (!navigator.contacts || !navigator.contacts.select) {
      toast("This browser can’t share contacts. Import a CSV or vCard instead.");
      return;
    }
    let picked = [];
    try {
      picked = await navigator.contacts.select(["name", "tel", "email"], { multiple: true });
    } catch (error) {
      return;
    }
    let contacts = 0;
    for (const person of picked) {
      const saved = upsertPerson({
        name: (person.name && person.name[0]) || "",
        phones: person.tel || [],
        emails: person.email || [],
      });
      if (saved && saved.created) contacts += 1;
    }
    invalidate();
    await persist();
    const summary = "Added " + plural(contacts, "contact") + ".";
    $("import-status").textContent = summary;
    toast(summary);
    render();
  }

  function installHelp() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "On iPhone, open this page in Safari, tap Share, then Add to Home Screen.";
    return "In Chrome, open the menu and tap Install app or Add to Home Screen.";
  }

  function setupInstall() {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone || sessionStorage.getItem("luke-install-hide") === "1") return;
    $("install").hidden = false;
  }

  function bindViewport() {
    const apply = () => {
      const viewport = window.visualViewport;
      const height = viewport ? viewport.height : window.innerHeight;
      const top = viewport ? viewport.offsetTop : 0;
      document.documentElement.style.setProperty("--vvh", height + "px");
      document.documentElement.style.setProperty("--vvtop", top + "px");
    };
    apply();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", apply);
      window.visualViewport.addEventListener("scroll", apply);
    }
    window.addEventListener("resize", apply);
  }

  function paintChrome() {
    document.querySelector('[data-action="compose"]').append(icon("compose"));
    document.querySelector('[data-action="import"]').append(icon("import"));
    document.querySelectorAll('[data-action="back"]').forEach((button) => button.append(icon("back")));
    document.querySelectorAll('[data-action="close-import"], [data-action="close-compose"], [data-action="close-keypad"]').forEach((button) => button.append(icon("close")));
    $("thread-call").append(icon("call"));
    $("install-hide").textContent = "";
    $("install-hide").append(icon("close"));
    const tabs = { messages: ["bubble", "Messages"], calls: ["call", "Calls"], contacts: ["person", "Contacts"] };
    Object.entries(tabs).forEach(([name, spec]) => {
      const button = document.querySelector('[data-tab="' + name + '"]');
      button.append(icon(spec[0]), spec[1]);
    });
    const keys = $("keys");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].forEach((digit) => {
      keys.append(el("button", { type: "button", "data-action": "dial", "data-digit": digit }, digit));
    });
    document.querySelector('[data-action="dial-back"]').append(icon("backspace"));
    const plus = el("button", { type: "button", class: "earlier", "data-action": "dial", "data-digit": "+" }, "Add +");
    $("dial-display").before(plus);
  }

  function onClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "tab") {
      parkedScroll = null;
      go(target.dataset.tab === "messages" ? "/" : target.dataset.tab);
      return;
    }
    if (action === "import") {
      $("import-sheet").hidden = false;
      return;
    }
    if (action === "close-import") {
      $("import-sheet").hidden = true;
      resetClearButton();
      return;
    }
    if (action === "pick") {
      $("file").click();
      return;
    }
    if (action === "pick-contacts") {
      pickDeviceContacts();
      return;
    }
    if (action === "clear") {
      if (target.dataset.armed !== "1") {
        target.dataset.armed = "1";
        target.textContent = "Tap again to remove everything";
        return;
      }
      clearAll();
      return;
    }
    if (action === "compose") {
      $("compose-to").value = "";
      renderComposeResults();
      $("compose-sheet").hidden = false;
      $("compose-to").focus();
      return;
    }
    if (action === "close-compose") {
      $("compose-sheet").hidden = true;
      return;
    }
    if (action === "start") {
      startThread(target.dataset.number, target.dataset.name);
      return;
    }
    if (action === "open-thread") {
      go("t/" + encodeURIComponent(target.dataset.thread));
      return;
    }
    if (action === "open-contact") {
      go("c/" + encodeURIComponent(target.dataset.id));
      return;
    }
    if (action === "back") {
      go(parseRoute().name === "contact" ? "contacts" : "/");
      return;
    }
    if (action === "call-open" || action === "call-number") {
      const number = target.dataset.number || addressForThread(parseRoute().thread || "");
      if (!openLink(phoneHref(number, "tel"))) toast("This device can’t start a phone call.");
      return;
    }
    if (action === "keypad") {
      $("keypad").hidden = false;
      return;
    }
    if (action === "close-keypad") {
      $("keypad").hidden = true;
      return;
    }
    if (action === "dial") {
      pushDial(target.dataset.digit);
      return;
    }
    if (action === "dial-back") {
      dialed = dialed.slice(0, -1);
      renderDial();
      return;
    }
    if (action === "dial-call") {
      dialAction("call");
      return;
    }
    if (action === "dial-text") {
      dialAction("text");
      return;
    }
    if (action === "earlier") {
      const thread = parseRoute().thread;
      limits.set(thread, (limits.get(thread) || 200) + 200);
      renderThread(thread, "keep");
      return;
    }
    if (action === "more-list") {
      listWindow[target.dataset.list] += 80;
      listPaint.version = -1;
      render();
    }
  }

  function bind() {
    document.body.addEventListener("click", onClick);
    window.addEventListener("hashchange", render);
    $("search").addEventListener("input", () => {
      listPaint.version = -1;
      $("main").scrollTop = 0;
      parkedScroll = null;
      render();
    });
    $("file").addEventListener("change", () => importFiles($("file").files));
    $("composer").addEventListener("submit", (event) => {
      event.preventDefault();
      sendCurrent();
    });
    $("draft").addEventListener("input", () => {
      $("draft").style.height = "auto";
      $("draft").style.height = Math.min($("draft").scrollHeight, 120) + "px";
    });
    $("compose-to").addEventListener("input", renderComposeResults);
    $("install-go").addEventListener("click", async () => {
      if (!deferredPrompt) {
        toast(installHelp());
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      $("install").hidden = true;
    });
    $("install-hide").addEventListener("click", () => {
      sessionStorage.setItem("luke-install-hide", "1");
      $("install").hidden = true;
    });
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      if (sessionStorage.getItem("luke-install-hide") !== "1") $("install").hidden = false;
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSheets();
      if ($("keypad").hidden) return;
      if (/^[0-9*#]$/.test(event.key)) {
        pushDial(event.key);
        event.preventDefault();
      } else if (event.key === "+") pushDial("+");
      else if (event.key === "Backspace") {
        dialed = dialed.slice(0, -1);
        renderDial();
        event.preventDefault();
      } else if (event.key === "Enter") dialAction("call");
    });
    window.addEventListener("dragover", (event) => event.preventDefault());
    window.addEventListener("drop", (event) => {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.files.length) {
        $("import-sheet").hidden = false;
        importFiles(event.dataTransfer.files);
      }
    });
    if (navigator.contacts && navigator.contacts.select) $("pick-contacts").hidden = false;
  }

  async function boot() {
    paintChrome();
    bindViewport();
    bind();
    setupInstall();
    try {
      await load();
    } catch (error) {
      toast("Messages saved on this device could not be opened.");
    }
    $("boot").hidden = true;
    render();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  const ready = boot();
  window.LukeMessages = { importText, state, ready, linkFor: phoneHref };
})();
