const KEY = "pickle-central-v1";
const COIN = `<img class="coin" src="credit-icon.png" alt="" />`;
const defaultPaddles = () => [
  { id: "p1", label: "One pickleball paddle", credits: 3 },
  { id: "p2", label: "Two pickleball paddles", credits: 5 },
];
const defaultBalls = () => [
  { id: "b1", label: "One pickleball set", credits: 3 },
  { id: "b2", label: "Two pickleball sets", credits: 5 },
  { id: "b3", label: "Three ball sets", credits: 7 },
  { id: "b4", label: "Selkirk™ Pro S1 Pickleballs (Cost 5 Credits)", credits: 5 },
];
const defaultEquipment = () => [
  { id: "stock-paddles", name: "Paddles", qty: 12 },
  { id: "stock-balls", name: "Balls", qty: 40 },
];
const defaultQuestions = () => ["What got damaged?", "Describe the damage"];
const defaultState = () => ({
  people: [],
  packs: [
    { id: "pack-5", name: "5 credits", credits: 5, price: 20 },
    { id: "pack-10", name: "10 credits", credits: 10, price: 35 },
    { id: "pack-20", name: "20 credits", credits: 20, price: 60 },
  ],
  sales: [],
  bookings: [],
  equipment: defaultEquipment(),
  paddles: defaultPaddles(),
  balls: defaultBalls(),
  damageQuestions: defaultQuestions(),
  expenses: [],
  terms:
    "Equipment rented from Pickle Central stays our property and must be returned at the end of the booking. Credits are charged at the rates shown when you confirm. You are responsible for loss or damage beyond normal wear. Your signature confirms you have read these terms and agree to them.",
  creditTerms:
    "Credits bought from Pickle Central are for equipment rental at the rates shown. They are not cash. Your signature confirms you have read these terms and agree to them.",
});

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    const next = { ...defaultState(), ...saved };
    if (typeof saved.terms !== "string") next.terms = defaultState().terms;
    if (typeof saved.creditTerms !== "string") next.creditTerms = defaultState().creditTerms;
    if (!Array.isArray(saved.paddles)) next.paddles = defaultPaddles();
    if (!Array.isArray(saved.balls)) next.balls = defaultBalls();
    if (!Array.isArray(saved.damageQuestions)) next.damageQuestions = defaultQuestions();
    if (!Array.isArray(saved.expenses)) next.expenses = [];
    const source = Array.isArray(saved.equipment) ? saved.equipment : defaultEquipment();
    next.equipment = source
      .filter((item) => !/^nets?$/i.test(String(item.name || "").trim()))
      .map((item) => ({
        id: item.id || uid(),
        name: /^outdoor balls$/i.test(String(item.name || "")) ? "Balls" : item.name,
        qty: Number(item.qty) || 0,
      }));
    if (!next.equipment.length) next.equipment = defaultEquipment();
    return next;
  } catch {
    return defaultState();
  }
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
let state = load();
if (!state.packs?.length) state.packs = defaultState().packs;
if (!state.people) state.people = [];
save();

function money(n) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(Number(n) || 0);
}
function creditsLabel(n) {
  return `<span class="credits-chip">${COIN}${Number(n) || 0}</span>`;
}
function formatDate(iso) {
  if (!iso) return "Select date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function closeMenus(except) {
  document.querySelectorAll(".menu.open").forEach((el) => {
    if (el !== except) el.classList.remove("open");
  });
}
document.addEventListener("click", () => closeMenus());

function pickerButton(root, label) {
  root.innerHTML = `<button type="button" class="picker-btn"><span>${label}</span>▾</button><div class="menu"></div>`;
  const btn = root.querySelector(".picker-btn");
  const menu = root.querySelector(".menu");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !menu.classList.contains("open");
    closeMenus();
    menu.classList.toggle("open", open);
  });
  menu.addEventListener("click", (e) => e.stopPropagation());
  return { btn, menu };
}

function namePicker(root, { allowNew, filter, showCredits = true }) {
  const people = state.people.filter(filter || (() => true));
  const { btn, menu } = pickerButton(root, root.dataset.label || "Select a person");
  menu.innerHTML = people
    .map((p) => `<button type="button" data-id="${p.id}">${esc(p.name)}${showCredits ? ` · ${p.credits} ${COIN}` : ""}</button>`)
    .join("") + (allowNew ? `<button type="button" class="new" data-new="1">+ New person</button>
      <div class="new-person"><input placeholder="Full name" /><button type="button" class="btn" style="width:auto;padding:10px 12px">Add</button></div>` : "");
  if (!people.length && !allowNew) {
    menu.innerHTML = `<div class="opt">No one with credits yet</div>`;
  }
  menu.querySelectorAll("button[data-id]").forEach((item) => {
    item.addEventListener("click", () => {
      const person = state.people.find((p) => p.id === item.dataset.id);
      root.dataset.id = person.id;
      root.dataset.label = person.name;
      btn.querySelector("span").innerHTML = `${person.name}`;
      menu.classList.remove("open");
      root.dispatchEvent(new Event("change"));
    });
  });
  const addWrap = menu.querySelector(".new-person");
  menu.querySelector("button[data-new]")?.addEventListener("click", () => addWrap.classList.add("show"));
  addWrap?.querySelector(".btn")?.addEventListener("click", () => {
    const name = addWrap.querySelector("input").value.trim();
    if (!name) return;
    const person = { id: uid(), name, credits: 0 };
    state.people.push(person);
    save();
    root.dataset.id = person.id;
    root.dataset.label = person.name;
    btn.querySelector("span").textContent = person.name;
    menu.classList.remove("open");
    render();
    root.dispatchEvent(new Event("change"));
  });
}

function datePicker(root, value) {
  let view = new Date((value || todayISO()) + "T00:00:00");
  root.dataset.value = value || todayISO();
  const { btn, menu } = pickerButton(root, formatDate(root.dataset.value));
  function paint() {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const title = view.toLocaleDateString([], { month: "long", year: "numeric" });
    let cells = ["S","M","T","W","T","F","S"].map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < start; i++) cells += "<div></div>";
    for (let d = 1; d <= days; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells += `<button type="button" class="${iso === root.dataset.value ? "sel" : ""}" data-iso="${iso}">${d}</button>`;
    }
    menu.innerHTML = `<div class="calendar">
      <div class="cal-head">
        <button type="button" data-nav="-1">‹</button>
        <span>${title}</span>
        <button type="button" data-nav="1">›</button>
      </div>
      <div class="cal-grid">${cells}</div>
    </div>`;
    menu.querySelector("[data-nav='-1']").addEventListener("click", () => {
      view = new Date(year, month - 1, 1);
      paint();
    });
    menu.querySelector("[data-nav='1']").addEventListener("click", () => {
      view = new Date(year, month + 1, 1);
      paint();
    });
    menu.querySelectorAll("[data-iso]").forEach((day) => {
      day.addEventListener("click", () => {
        root.dataset.value = day.dataset.iso;
        btn.querySelector("span").textContent = formatDate(day.dataset.iso);
        menu.classList.remove("open");
      });
    });
  }
  paint();
}

function packPicker(root) {
  const pack = state.packs.find((p) => p.id === root.dataset.id) || state.packs[0];
  if (pack) {
    root.dataset.id = pack.id;
  }
  const label = pack ? `${pack.name} · ${pack.credits} credits · ${money(pack.price)}` : "Select a pack";
  const { btn, menu } = pickerButton(root, label);
  menu.innerHTML = state.packs
    .map((p) => `<button type="button" data-id="${p.id}">${p.name} · ${p.credits} credits · ${money(p.price)}</button>`)
    .join("") || `<div class="opt">Add a pack in Settings</div>`;
  menu.querySelectorAll("button[data-id]").forEach((item) => {
    item.addEventListener("click", () => {
      const p = state.packs.find((x) => x.id === item.dataset.id);
      root.dataset.id = p.id;
      btn.querySelector("span").textContent = `${p.name} · ${p.credits} credits · ${money(p.price)}`;
      menu.classList.remove("open");
    });
  });
}

function renderPeople() {
  const box = document.getElementById("people-list");
  if (!state.people.length) {
    box.innerHTML = `<p class="empty">No customers yet. Add credits below.</p>`;
    return;
  }
  box.innerHTML = `<div class="people-grid">${state.people
    .map(
      (p) => `<article class="person-cell">
        <button type="button" class="icon-btn person-del" data-del="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">✕</button>
        <div class="name">${esc(p.name)}</div>
        <div class="credits-chip">${COIN}${p.credits}</div>
      </article>`
    )
    .join("")}</div>`;
  box.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const person = state.people.find((p) => p.id === btn.dataset.del);
      if (!person || !confirm(`Remove ${person.name} and their credits?`)) return;
      state.people = state.people.filter((p) => p.id !== person.id);
      save();
      render();
    });
  });
}

function expenseTotal() {
  return state.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function renderFinance() {
  const sales = state.sales.reduce((s, x) => s + Number(x.price), 0);
  const expenses = expenseTotal();
  const outstanding = state.people.reduce((s, p) => s + Number(p.credits), 0);
  const used = state.bookings.filter((b) => !b.refunded).reduce((s, b) => s + Number(b.credits), 0);
  document.getElementById("fin-profit").textContent = money(sales - expenses);
  document.getElementById("fin-sales").textContent = money(sales);
  document.getElementById("fin-exp").textContent = money(expenses);
  document.getElementById("fin-out").innerHTML = creditsLabel(outstanding);
  document.getElementById("fin-used").innerHTML = creditsLabel(used);
  document.getElementById("fin-books").textContent = String(state.bookings.length);
}

function renderExpenses() {
  const box = document.getElementById("expense-list");
  document.getElementById("exp-total").textContent = money(expenseTotal());
  if (!state.expenses.length) {
    box.innerHTML = `<p class="empty">No expenses yet.</p>`;
    return;
  }
  box.innerHTML = state.expenses
    .map(
      (item) => `<article class="swipe" data-id="${esc(item.id)}">
        <button type="button" class="swipe-bin" aria-label="Delete ${esc(item.name)}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        </button>
        <div class="swipe-front">
          <div>
            <b>${esc(item.name)}</b>
            ${item.date ? `<div class="review-meta">${esc(formatDate(item.date))}</div>` : ""}
            ${item.memo ? `<div class="review-meta">${esc(item.memo)}</div>` : ""}
          </div>
          <span>${money(item.amount)}</span>
        </div>
      </article>`
    )
    .join("");
  box.querySelectorAll(".swipe").forEach((row) => bindSwipe(row));
  box.querySelectorAll(".swipe-bin").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".swipe");
      state.expenses = state.expenses.filter((item) => item.id !== row.dataset.id);
      save();
      renderExpenses();
      renderFinance();
    });
  });
}

function bindSwipe(row, openPx = 76) {
  const front = row.querySelector(".swipe-front");
  row.style.setProperty("--open", `${openPx}px`);
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dragging = false;
  let horizontal = false;

  function down(x, y) {
    startX = x;
    startY = y;
    dx = 0;
    dragging = true;
    horizontal = false;
    front.style.transition = "none";
  }

  function move(x, y, event) {
    if (!dragging) return;
    const mx = x - startX;
    const my = y - startY;
    if (!horizontal) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      if (Math.abs(my) > Math.abs(mx)) {
        dragging = false;
        front.style.transition = "";
        front.style.transform = "";
        return;
      }
      horizontal = true;
    }
    if (event.cancelable) event.preventDefault();
    const base = row.classList.contains("is-open") ? openPx : 0;
    const next = Math.max(0, Math.min(openPx, base + mx));
    dx = mx;
    front.style.transform = `translateX(${next}px)`;
  }

  function finish() {
    if (!dragging && !horizontal) return;
    dragging = false;
    const base = row.classList.contains("is-open") ? openPx : 0;
    const open = base + dx > openPx / 2;
    row.classList.toggle("is-open", open);
    front.style.transition = "";
    front.style.transform = open ? `translateX(${openPx}px)` : "";
    dx = 0;
    horizontal = false;
  }

  front.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    down(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });
  front.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    move(touch.clientX, touch.clientY, event);
  }, { passive: false });
  front.addEventListener("touchend", finish);
  front.addEventListener("touchcancel", finish);

  front.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    down(event.clientX, event.clientY);
    front.setPointerCapture(event.pointerId);
  });
  front.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    move(event.clientX, event.clientY, event);
  });
  front.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") return;
    finish();
  });
  front.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "touch") return;
    finish();
  });
}

function renderPacks() {
  const box = document.getElementById("pack-list");
  box.innerHTML = state.packs
    .map(
      (p) => `<div class="pack-edit" data-id="${p.id}">
        <input data-k="name" value="${p.name}" />
        <input data-k="credits" type="number" min="1" value="${p.credits}" />
        <input data-k="price" type="number" min="0" step="0.01" value="${p.price}" />
        <button type="button" class="icon-btn" data-del-pack="${p.id}">✕</button>
      </div>`
    )
    .join("");
  box.querySelectorAll(".pack-edit").forEach((row) => {
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        const pack = state.packs.find((p) => p.id === row.dataset.id);
        const key = input.dataset.k;
        pack[key] = key === "name" ? input.value : Number(input.value);
        save();
        renderPickers();
      });
    });
  });
  box.querySelectorAll("[data-del-pack]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.packs = state.packs.filter((p) => p.id !== btn.dataset.delPack);
      save();
      render();
    });
  });
}

function renderCatalog(listId, items, key) {
  const box = document.getElementById(listId);
  if (box.contains(document.activeElement)) return;
  box.innerHTML = items
    .map(
      (item) => `<div class="rental-edit" data-id="${esc(item.id)}">
        <input data-k="label" value="${esc(item.label)}" aria-label="Rental name" />
        <input data-k="credits" type="number" min="0" value="${Number(item.credits) || 0}" aria-label="Credit cost" />
        <button type="button" class="icon-btn" data-del-rental="${esc(item.id)}" data-kind="${key}">✕</button>
      </div>`
    )
    .join("");
  box.querySelectorAll(".rental-edit").forEach((row) => {
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        const item = state[key].find((entry) => entry.id === row.dataset.id);
        if (!item) return;
        item[input.dataset.k] = input.dataset.k === "label" ? input.value : Math.max(0, Number(input.value) || 0);
        if (input.dataset.k === "credits") input.value = item.credits;
        save();
        renderChoices();
        updateBill();
      });
    });
  });
  box.querySelectorAll("[data-del-rental]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state[key] = state[key].filter((entry) => entry.id !== btn.dataset.delRental);
      if (key === "paddles" && paddleId === btn.dataset.delRental) paddleId = "";
      if (key === "balls" && ballId === btn.dataset.delRental) ballId = "";
      save();
      render();
    });
  });
}

function renderQuestions() {
  const box = document.getElementById("question-list");
  if (box.contains(document.activeElement)) return;
  box.innerHTML = state.damageQuestions
    .map(
      (question, index) => `<div class="question-edit">
        <input data-q="${index}" value="${esc(question)}" aria-label="Damage question ${index + 1}" />
        <button type="button" class="icon-btn" data-del-q="${index}">✕</button>
      </div>`
    )
    .join("");
  box.querySelectorAll("[data-q]").forEach((input) => {
    input.addEventListener("change", () => {
      state.damageQuestions[Number(input.dataset.q)] = input.value;
      save();
    });
  });
  box.querySelectorAll("[data-del-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.damageQuestions.splice(Number(btn.dataset.delQ), 1);
      save();
      render();
    });
  });
}

function damageSummary(booking) {
  if (booking.gearStatus !== "issue") return "";
  const lines = [];
  if (booking.missing?.length) lines.push(`Not returned: ${booking.missing.join(", ")}`);
  (booking.damageAnswers || []).forEach((entry) => {
    if (String(entry.answer || "").trim()) lines.push(`${entry.question}: ${entry.answer.trim()}`);
  });
  return lines.join("\n") || "Some gear was not returned or was damaged.";
}

function renderReviews() {
  const box = document.getElementById("review-list");
  const bookings = [...state.bookings].reverse();
  if (!bookings.length) {
    box.innerHTML = `<p class="empty">No bookings yet.</p>`;
    return;
  }
  box.innerHTML = bookings
    .map((booking) => {
      const rented = [booking.paddle, booking.balls].filter(Boolean).map((item) => esc(item)).join("<br>");
      const summary = damageSummary(booking);
      const pending = !booking.gearStatus;
      const reviewed = Boolean(booking.gearStatus);
      return `<article class="swipe review-swipe${pending ? " is-pending" : ""}${reviewed ? " is-reviewed" : ""}${booking.refunded ? " is-refunded" : ""}" data-id="${esc(booking.id)}">
        <div class="swipe-actions">
          <button type="button" class="swipe-cash" data-refund="${esc(booking.id)}" aria-label="Refund ${esc(booking.customer)}" ${booking.refunded ? "disabled" : ""}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>
          </button>
          <button type="button" class="swipe-bin" data-remove-booking="${esc(booking.id)}" aria-label="Remove ${esc(booking.customer)}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
        <div class="swipe-front">
          <div class="review-body">
            <b>${esc(booking.customer)}</b>
            <div class="review-meta">${esc(formatDate(booking.date))} · ${Number(booking.credits) || 0} credits${booking.refunded ? " · Refunded" : ""}</div>
            <div class="review-rented">${rented || "No gear recorded"}</div>
            ${booking.gearStatus === "ok" ? `<div class="review-summary">All gear returned, no damage.</div>` : ""}
            ${summary ? `<div class="review-summary">${esc(summary)}</div>` : ""}
          </div>
          ${reviewed
            ? `<button type="button" class="review-edit" data-review="${esc(booking.id)}" aria-label="Edit review"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>`
            : `<button type="button" class="btn review-go" data-review="${esc(booking.id)}">Review</button>`}
          <button type="button" class="review-sign" data-sign="${esc(booking.id)}" aria-label="View signature">
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3.2l3.4 3.4L9.2 15.8H5.8v-3.4L15 3.2z"/><path d="M13.6 4.6l2.4 2.4"/><path d="M3 19c1.8-1.7 2.6 1.5 4.2 0s2.6 1.6 4.2 0 2.6 1.6 4.2 0 2.4 1.5 4 0 2.2 1.4 3.4-.2"/></svg>
          </button>
        </div>
      </article>`;
    })
    .join("");
  box.querySelectorAll(".swipe").forEach((row) => bindSwipe(row, 152));
  box.querySelectorAll("[data-review]").forEach((btn) => {
    btn.addEventListener("pointerdown", (event) => event.stopPropagation());
    btn.addEventListener("click", () => openReview(btn.dataset.review));
  });
  box.querySelectorAll("[data-sign]").forEach((btn) => {
    btn.addEventListener("pointerdown", (event) => event.stopPropagation());
    btn.addEventListener("click", () => openSignature(btn.dataset.sign));
  });
  box.querySelectorAll("[data-refund]").forEach((btn) => {
    btn.addEventListener("click", () => refundBooking(btn.dataset.refund));
  });
  box.querySelectorAll("[data-remove-booking]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bookings = state.bookings.filter((item) => item.id !== btn.dataset.removeBooking);
      save();
      render();
    });
  });
}

function refundBooking(id) {
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking || booking.refunded) return;
  const person = state.people.find((item) => item.id === booking.personId) || state.people.find((item) => item.name === booking.customer);
  if (!person) {
    alert("That customer is no longer on Buy Credits, so these credits cannot be returned.");
    return;
  }
  person.credits += Number(booking.credits) || 0;
  booking.refunded = true;
  save();
  render();
}

let damageBookingId = "";
let reviewBookingId = "";

function openSignature(id) {
  const booking = state.bookings.find((item) => item.id === id);
  const img = document.getElementById("signature-image");
  const selfie = document.getElementById("signature-selfie");
  const missing = document.getElementById("signature-missing");
  const has = Boolean(booking && typeof booking.signature === "string" && booking.signature.startsWith("data:image"));
  const hasSelfie = Boolean(booking && typeof booking.selfie === "string" && booking.selfie.startsWith("data:image"));
  img.hidden = !has;
  missing.hidden = has;
  img.src = has ? booking.signature : "";
  selfie.hidden = !hasSelfie;
  selfie.src = hasSelfie ? booking.selfie : "";
  document.getElementById("signature-modal").hidden = false;
}

function openReview(id) {
  if (!state.bookings.some((item) => item.id === id)) return;
  reviewBookingId = id;
  document.getElementById("review-modal").hidden = false;
}

function closeReview() {
  document.getElementById("review-modal").hidden = true;
  reviewBookingId = "";
}

function openDamage(id) {
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return;
  damageBookingId = id;
  const items = [booking.paddle, booking.balls].filter(Boolean);
  const missing = new Set(booking.missing || []);
  const answers = new Map((booking.damageAnswers || []).map((entry) => [entry.question, entry.answer]));
  document.getElementById("damage-form").innerHTML = `
    <div>
      <div class="field-label">Mark gear that was not returned</div>
      ${
        items.length
          ? items
              .map(
                (item) => `<label class="miss-row"><input type="checkbox" data-missing="${esc(item)}" ${missing.has(item) ? "checked" : ""}/> ${esc(item)}</label>`
              )
              .join("")
          : `<p class="empty">No gear was recorded on this booking.</p>`
      }
    </div>
    ${state.damageQuestions
      .map(
        (question, index) => `<div>
          <div class="field-label">${esc(question)}</div>
          <textarea class="damage-q" data-q="${index}">${esc(answers.get(question) || "")}</textarea>
        </div>`
      )
      .join("")}
    <p class="error" id="damage-error"></p>`;
  document.getElementById("damage-modal").hidden = false;
}

function closeDamage() {
  document.getElementById("damage-modal").hidden = true;
  damageBookingId = "";
}

let paddleId = "";
let ballId = "";

function renderChoices() {
  const paint = (id, options, selected, set) => {
    document.getElementById(id).innerHTML = options
      .map(
        (o) => `<button type="button" class="choice ${selected === o.id ? "on" : ""}" data-id="${o.id}">
          <span class="choice-name">${esc(o.label)}</span><small>${o.credits} credits</small>
        </button>`
      )
      .join("");
    document.querySelectorAll(`#${id} .choice`).forEach((btn) => {
      btn.addEventListener("click", () => {
        set(btn.dataset.id === selected ? "" : btn.dataset.id);
        renderChoices();
        updateBill();
      });
    });
  };
  if (!state.paddles.some((item) => item.id === paddleId)) paddleId = "";
  if (!state.balls.some((item) => item.id === ballId)) ballId = "";
  paint("paddle-choices", state.paddles, paddleId, (v) => (paddleId = v));
  paint("ball-choices", state.balls, ballId, (v) => (ballId = v));
}

function bookingTotal() {
  const paddle = state.paddles.find((p) => p.id === paddleId);
  const ball = state.balls.find((b) => b.id === ballId);
  return (paddle?.credits || 0) + (ball?.credits || 0);
}

function updateBill() {
  const total = bookingTotal();
  const person = state.people.find((p) => p.id === document.getElementById("book-customer").dataset.id);
  const who = document.getElementById("bill-who");
  const remain = document.getElementById("bill-remain");
  const remainRow = document.getElementById("bill-remain-row");
  document.getElementById("bill-total").innerHTML = creditsLabel(total);
  if (!person) {
    who.textContent = "Select a customer";
    document.getElementById("bill-current").textContent = "—";
    remain.textContent = "—";
    remainRow.classList.remove("low");
    return;
  }
  const left = Number(person.credits) - total;
  who.textContent = person.name;
  document.getElementById("bill-current").innerHTML = creditsLabel(person.credits);
  remain.innerHTML = creditsLabel(left);
  remainRow.classList.toggle("low", left < 0);
}

function renderPickers() {
  namePicker(document.getElementById("credit-name"), { allowNew: true, showCredits: false });
  namePicker(document.getElementById("book-customer"), {
    allowNew: false,
    showCredits: false,
    filter: (p) => p.credits > 0,
  });
  datePicker(document.getElementById("credit-date"), document.getElementById("credit-date").dataset.value || todayISO());
  datePicker(document.getElementById("book-date"), document.getElementById("book-date").dataset.value || todayISO());
  packPicker(document.getElementById("credit-pack"));
}

function renderTerms() {
  const editor = document.getElementById("terms-editor");
  if (document.activeElement !== editor) editor.value = state.terms || "";
  const creditEditor = document.getElementById("credit-terms-editor");
  if (document.activeElement !== creditEditor) creditEditor.value = state.creditTerms || "";
}

function render() {
  renderPeople();
  renderFinance();
  renderPacks();
  renderCatalog("paddle-list", state.paddles, "paddles");
  renderCatalog("ball-list", state.balls, "balls");
  renderQuestions();
  renderTerms();
  renderReviews();
  renderExpenses();
  renderChoices();
  renderPickers();
  updateBill();
}

document.getElementById("add-pack").addEventListener("click", () => {
  state.packs.push({ id: uid(), name: "New pack", credits: 5, price: 20 });
  save();
  render();
});

document.getElementById("add-paddle").addEventListener("click", () => {
  state.paddles.push({ id: uid(), label: "New paddle option", credits: 3 });
  save();
  render();
});

document.getElementById("add-ball").addEventListener("click", () => {
  state.balls.push({ id: uid(), label: "New ball option", credits: 3 });
  save();
  render();
});

document.getElementById("add-question").addEventListener("click", () => {
  state.damageQuestions.push("New damage question");
  save();
  render();
});

document.getElementById("credit-form").addEventListener("submit", submitCreditPurchase);

function bindPad(canvasId, blockId, clearId) {
  const canvas = document.getElementById(canvasId);
  const block = document.getElementById(blockId);
  const clearBtn = document.getElementById(clearId);
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let signed = false;
  function size() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2) return;
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = 160 * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.strokeStyle = "#142141";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
  }
  function pos(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (block.classList.contains("is-locked")) return;
    event.preventDefault();
    drawing = true;
    const { x, y } = pos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    event.preventDefault();
    const { x, y } = pos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    signed = true;
  });
  canvas.addEventListener("pointerup", () => {
    drawing = false;
  });
  canvas.addEventListener("pointerleave", () => {
    drawing = false;
  });
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signed = false;
  });
  return {
    isSigned: () => signed,
    dataURL: () => canvas.toDataURL(),
    size,
    setEnabled(on) {
      block.classList.toggle("is-locked", !on);
      clearBtn.disabled = !on;
      if (!on) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signed = false;
      }
    },
  };
}

const bookPad = bindPad("sign", "sign-block", "clear-sign");
const creditPad = bindPad("credit-sign", "credit-sign-block", "clear-credit-sign");
window.addEventListener("resize", () => {
  if (document.getElementById("booking").classList.contains("is-active")) bookPad.size();
  if (document.getElementById("credits").classList.contains("is-active")) creditPad.size();
});

let bookingSelfie = "";
let selfieStream = null;
let selfieToken = 0;

function stopSelfieCamera() {
  if (!selfieStream) return;
  selfieStream.getTracks().forEach((track) => track.stop());
  selfieStream = null;
}

function showBookingSelfie(src) {
  const preview = document.getElementById("booking-selfie");
  if (!src) {
    preview.hidden = true;
    preview.removeAttribute("src");
    return;
  }
  preview.src = src;
  preview.hidden = false;
}

async function takeBookingSelfie() {
  const token = ++selfieToken;
  bookingSelfie = "";
  showBookingSelfie("");
  const err = document.getElementById("book-error");
  const box = document.getElementById("agree-terms");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    box.checked = false;
    bookPad.setEnabled(false);
    err.textContent = "This phone cannot take a photo from the browser.";
    return;
  }
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "user" }, width: { ideal: 480 }, height: { ideal: 640 } },
    });
    selfieStream = stream;
    if (token !== selfieToken) return;
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    if (video.readyState < 2) {
      await new Promise((resolve) => video.addEventListener("loadeddata", resolve, { once: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (token !== selfieToken || !box.checked) return;
    const width = 320;
    const ratio = video.videoWidth ? video.videoHeight / video.videoWidth : 1.25;
    const height = Math.max(1, Math.round(width * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    bookingSelfie = canvas.toDataURL("image/jpeg", 0.72);
    showBookingSelfie(bookingSelfie);
    err.textContent = "";
  } catch {
    if (token !== selfieToken) return;
    bookingSelfie = "";
    showBookingSelfie("");
    box.checked = false;
    bookPad.setEnabled(false);
    err.textContent = "Allow the front camera so a photo can be taken.";
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (selfieStream === stream) selfieStream = null;
    }
  }
}

document.getElementById("agree-terms").addEventListener("change", () => {
  const on = document.getElementById("agree-terms").checked;
  bookPad.setEnabled(on);
  if (document.getElementById("booking").classList.contains("is-active")) bookPad.size();
  if (!on) {
    selfieToken += 1;
    bookingSelfie = "";
    stopSelfieCamera();
    showBookingSelfie("");
    return;
  }
  takeBookingSelfie();
});
document.getElementById("agree-credit-terms").addEventListener("change", () => {
  creditPad.setEnabled(document.getElementById("agree-credit-terms").checked);
  if (document.getElementById("credits").classList.contains("is-active")) creditPad.size();
});

const termsModal = document.getElementById("terms-modal");
function openTerms(text) {
  document.getElementById("terms-body").textContent = text || "";
  termsModal.hidden = false;
}
document.getElementById("open-terms").addEventListener("click", () => openTerms(state.terms));
document.getElementById("open-credit-terms").addEventListener("click", () => openTerms(state.creditTerms));
document.getElementById("terms-close").addEventListener("click", () => {
  termsModal.hidden = true;
});
termsModal.addEventListener("click", (event) => {
  if (event.target === termsModal) termsModal.hidden = true;
});

const damageModal = document.getElementById("damage-modal");
document.getElementById("damage-cancel").addEventListener("click", closeDamage);
document.getElementById("damage-save").addEventListener("click", () => {
  const booking = state.bookings.find((item) => item.id === damageBookingId);
  if (!booking) return;
  const missing = [...document.querySelectorAll("#damage-form [data-missing]:checked")].map((input) => input.dataset.missing);
  const damageAnswers = state.damageQuestions.map((question, index) => ({
    question,
    answer: document.querySelector(`#damage-form [data-q="${index}"]`)?.value.trim() || "",
  }));
  const error = document.getElementById("damage-error");
  if (!missing.length && !damageAnswers.some((entry) => entry.answer)) {
    error.textContent = "Mark missing gear or answer a damage question.";
    return;
  }
  booking.gearStatus = "issue";
  booking.missing = missing;
  booking.damageAnswers = damageAnswers;
  save();
  closeDamage();
  render();
});
damageModal.addEventListener("click", (event) => {
  if (event.target === damageModal) closeDamage();
});
document.getElementById("review-ok").addEventListener("click", () => {
  const booking = state.bookings.find((item) => item.id === reviewBookingId);
  if (!booking) return;
  booking.gearStatus = "ok";
  booking.missing = [];
  booking.damageAnswers = [];
  save();
  closeReview();
  renderReviews();
});
document.getElementById("review-bad").addEventListener("click", () => {
  const id = reviewBookingId;
  closeReview();
  openDamage(id);
});
document.getElementById("review-cancel").addEventListener("click", closeReview);
document.getElementById("signature-close").addEventListener("click", () => {
  document.getElementById("signature-modal").hidden = true;
});
document.getElementById("signature-modal").addEventListener("click", (event) => {
  if (event.target.id === "signature-modal") document.getElementById("signature-modal").hidden = true;
});
document.getElementById("review-modal").addEventListener("click", (event) => {
  if (event.target.id === "review-modal") closeReview();
});
document.getElementById("terms-editor").addEventListener("input", () => {
  state.terms = document.getElementById("terms-editor").value;
  save();
});
document.getElementById("credit-terms-editor").addEventListener("input", () => {
  state.creditTerms = document.getElementById("credit-terms-editor").value;
  save();
});

function shake(button) {
  button.classList.remove("shake");
  void button.offsetWidth;
  button.classList.add("shake");
}

document.getElementById("booking-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const person = state.people.find((p) => p.id === document.getElementById("book-customer").dataset.id);
  const total = bookingTotal();
  const err = document.getElementById("book-error");
  const button = document.querySelector("#booking-form [type=submit]");
  if (!person) {
    err.textContent = "Select a customer with credits.";
    shake(button);
    return;
  }
  if (!paddleId && !ballId) {
    err.textContent = "Select paddles or balls to rent.";
    shake(button);
    return;
  }
  if (person.credits < total) {
    err.textContent = `${person.name} only has ${person.credits} credits remaining.`;
    shake(button);
    return;
  }
  if (!document.getElementById("agree-terms").checked) {
    err.textContent = "Please agree to the terms and conditions.";
    shake(button);
    return;
  }
  if (!bookPad.isSigned()) {
    err.textContent = "Customer signature is required.";
    shake(button);
    return;
  }
  if (!bookingSelfie) {
    err.textContent = "Allow the front camera so a photo can be taken.";
    shake(button);
    return;
  }
  person.credits -= total;
  state.bookings.push({
    id: uid(),
    personId: person.id,
    customer: person.name,
    date: document.getElementById("book-date").dataset.value,
    paddle: state.paddles.find((p) => p.id === paddleId)?.label || "",
    balls: state.balls.find((b) => b.id === ballId)?.label || "",
    refunded: false,
    gearStatus: "",
    missing: [],
    damageAnswers: [],
    credits: total,
    signature: bookPad.dataURL(),
    selfie: bookingSelfie,
  });
  save();
  paddleId = "";
  ballId = "";
  document.getElementById("agree-terms").checked = false;
  bookPad.setEnabled(false);
  err.textContent = "";
  render();
  askNotify();
  showSuccess("Successfully booked", () => {
    clearBooking();
    showTab("finance");
  });
});

function submitCreditPurchase(event) {
  event.preventDefault();
  const nameRoot = document.getElementById("credit-name");
  const pack = state.packs.find((p) => p.id === document.getElementById("credit-pack").dataset.id);
  const person = state.people.find((p) => p.id === nameRoot.dataset.id);
  const err = document.getElementById("credit-error");
  const button = document.querySelector("#credit-form [type=submit]");
  if (!person) {
    err.textContent = "Choose or add a person.";
    shake(button);
    return;
  }
  if (!pack) {
    err.textContent = "Choose a credit pack.";
    shake(button);
    return;
  }
  if (!document.getElementById("agree-credit-terms").checked) {
    err.textContent = "Please agree to the terms and conditions.";
    shake(button);
    return;
  }
  if (!creditPad.isSigned()) {
    err.textContent = "Customer signature is required.";
    shake(button);
    return;
  }
  person.credits += Number(pack.credits);
  state.sales.push({
    id: uid(),
    personId: person.id,
    date: document.getElementById("credit-date").dataset.value,
    packId: pack.id,
    credits: pack.credits,
    price: pack.price,
    memo: document.getElementById("credit-memo").value.trim(),
    signature: creditPad.dataURL(),
  });
  save();
  err.textContent = "";
  showSuccess("Successfully purchased", () => {
    clearCreditPurchase();
    showTab("finance");
  });
}

const bookedModal = document.getElementById("booked-modal");
const bookedSound = document.getElementById("booked-sound");
let afterSuccess = () => {};
function showSuccess(title, done) {
  document.getElementById("booked-title").textContent = title;
  afterSuccess = done;
  bookedModal.hidden = false;
  bookedSound.currentTime = 0;
  const playing = bookedSound.play();
  if (playing) playing.catch(() => {});
}
document.getElementById("booked-ok").addEventListener("click", () => {
  bookedModal.hidden = true;
  bookedSound.pause();
  bookedSound.currentTime = 0;
  const done = afterSuccess;
  afterSuccess = () => {};
  done();
});

function clearBooking() {
  paddleId = "";
  ballId = "";
  const customer = document.getElementById("book-customer");
  delete customer.dataset.id;
  delete customer.dataset.label;
  document.getElementById("agree-terms").checked = false;
  bookPad.setEnabled(false);
  bookingSelfie = "";
  showBookingSelfie("");
  document.getElementById("book-error").textContent = "";
  document.getElementById("book-date").dataset.value = todayISO();
  render();
}

function clearCreditPurchase() {
  const name = document.getElementById("credit-name");
  delete name.dataset.id;
  delete name.dataset.label;
  document.getElementById("credit-memo").value = "";
  document.getElementById("credit-date").dataset.value = todayISO();
  document.getElementById("agree-credit-terms").checked = false;
  creditPad.setEnabled(false);
  document.getElementById("credit-error").textContent = "";
  render();
}

function showTab(id) {
  document.querySelectorAll(".tabs button").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === id));
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("is-active", page.id === id));
  document.querySelector(".app").classList.toggle("no-tabs", id === "expenses");
  if (id === "booking") bookPad.size();
  if (id === "credits") creditPad.size();
  if (id === "reviews") askNotify();
}

document.getElementById("book-customer").addEventListener("change", updateBill);

document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});

document.getElementById("view-expenses").addEventListener("click", () => showTab("expenses"));
document.getElementById("expenses-back").addEventListener("click", () => showTab("finance"));
function closeExpense() {
  document.getElementById("expense-modal").hidden = true;
  document.getElementById("expense-form").reset();
}
document.getElementById("add-expense").addEventListener("click", () => {
  document.getElementById("expense-form").reset();
  datePicker(document.getElementById("exp-date"), todayISO());
  document.getElementById("expense-modal").hidden = false;
  document.getElementById("exp-name").focus();
});
document.getElementById("expense-cancel").addEventListener("click", closeExpense);
document.getElementById("expense-modal").addEventListener("click", (event) => {
  if (event.target.id === "expense-modal") closeExpense();
});
document.getElementById("expense-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("exp-name").value.trim();
  const amount = Number(document.getElementById("exp-amount").value);
  const memo = document.getElementById("exp-memo").value.trim();
  const date = document.getElementById("exp-date").dataset.value || todayISO();
  if (!name || document.getElementById("exp-amount").value === "" || !(amount >= 0)) return;
  state.expenses.unshift({ id: uid(), name, amount, memo, date });
  save();
  closeExpense();
  renderExpenses();
  renderFinance();
});
document.getElementById("reset-all").addEventListener("click", () => {
  if (!confirm("Delete all bookings, credit sales, expenses, and credit balances? This cannot be undone.")) return;
  state.bookings = [];
  state.sales = [];
  state.expenses = [];
  state.people.forEach((person) => {
    person.credits = 0;
  });
  save();
  render();
});

function askNotify() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  Notification.requestPermission();
}

let reviewPingBusy = false;
function pingPendingReviews() {
  if (reviewPingBusy || !("Notification" in window) || Notification.permission !== "granted") return;
  const pending = state.bookings.filter((booking) => !booking.gearStatus && !booking.reviewPinged);
  if (!pending.length) return;
  reviewPingBusy = true;
  const notify = navigator.serviceWorker?.ready
    ? navigator.serviceWorker.ready.then((reg) =>
        reg.showNotification("Booking Review Pending", { icon: "icon-192.png", tag: "booking-review-pending" })
      )
    : Promise.resolve(new Notification("Booking Review Pending"));
  notify
    .then(() => {
      pending.forEach((booking) => {
        booking.reviewPinged = true;
      });
      save();
    })
    .catch(() => {})
    .finally(() => {
      reviewPingBusy = false;
    });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") pingPendingReviews();
});
window.addEventListener("pagehide", pingPendingReviews);

render();
if (new URLSearchParams(location.search).get("review") === "1") showTab("reviews");

document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
document.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1 && event.cancelable) event.preventDefault();
}, { passive: false });
document.addEventListener("wheel", (event) => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });

let pullStartX = 0;
let pullStartY = 0;
let pullTracking = false;
document.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1) return;
  if (event.target.closest("input, textarea, select, canvas")) return;
  pullStartX = event.touches[0].clientX;
  pullStartY = event.touches[0].clientY;
  pullTracking = true;
}, { passive: true });
document.addEventListener("touchend", (event) => {
  if (!pullTracking) return;
  pullTracking = false;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - pullStartX;
  const dy = touch.clientY - pullStartY;
  if (Math.abs(dy) < 120 || Math.abs(dy) < Math.abs(dx)) return;
  document.body.classList.toggle("tabs-down", dy > 0);
}, { passive: true });

const installBtn = document.getElementById("install");
let deferredPrompt;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
