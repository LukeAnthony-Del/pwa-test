const KEY = "pickle-central-v1";
const COIN = `<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" stroke="none">C</text></svg>`;
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
  terms:
    "Equipment rented from Pickle Central stays our property and must be returned at the end of the booking. Credits are charged at the rates shown when you confirm. You are responsible for loss or damage beyond normal wear. Your signature confirms you have read these terms and agree to them.",
});

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    const next = { ...defaultState(), ...saved };
    if (typeof saved.terms !== "string") next.terms = defaultState().terms;
    if (!Array.isArray(saved.paddles)) next.paddles = defaultPaddles();
    if (!Array.isArray(saved.balls)) next.balls = defaultBalls();
    if (!Array.isArray(saved.damageQuestions)) next.damageQuestions = defaultQuestions();
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
  return `$${Number(n || 0).toFixed(2)}`;
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

function namePicker(root, { allowNew, filter }) {
  const people = state.people.filter(filter || (() => true));
  const { btn, menu } = pickerButton(root, root.dataset.label || "Select a person");
  menu.innerHTML = people
    .map((p) => `<button type="button" data-id="${p.id}">${p.name} · ${p.credits} ${COIN}</button>`)
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
  box.innerHTML = state.people
    .map(
      (p) => `<div class="person-row card">
        <span class="name">${p.name}</span>
        <span class="credits-chip">${COIN}${p.credits}</span>
        <button type="button" class="icon-btn" data-del="${p.id}" aria-label="Remove ${p.name}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>
          </svg>
        </button>
      </div>`
    )
    .join("");
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

function renderEquipment() {
  const box = document.getElementById("equipment-list");
  if (box.contains(document.activeElement)) return;
  box.innerHTML = state.equipment
    .map(
      (item) => `<article class="stock-row card">
        <span class="name">${esc(item.name)}</span>
        <input type="number" min="0" step="1" value="${Number(item.qty) || 0}" data-stock="${esc(item.id)}" aria-label="${esc(item.name)} in stock" />
      </article>`
    )
    .join("");
  box.querySelectorAll("[data-stock]").forEach((input) => {
    input.addEventListener("change", () => {
      const item = state.equipment.find((row) => row.id === input.dataset.stock);
      if (!item) return;
      item.qty = Math.max(0, Number(input.value) || 0);
      input.value = item.qty;
      save();
    });
  });
}

function renderFinance() {
  const sales = state.sales.reduce((s, x) => s + Number(x.price), 0);
  const outstanding = state.people.reduce((s, p) => s + Number(p.credits), 0);
  const used = state.bookings.filter((b) => !b.refunded).reduce((s, b) => s + Number(b.credits), 0);
  document.getElementById("fin-sales").textContent = money(sales);
  document.getElementById("fin-out").innerHTML = `${outstanding}`;
  document.getElementById("fin-used").textContent = String(used);
  document.getElementById("fin-books").textContent = String(state.bookings.length);
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
      return `<article class="review">
        <div class="review-top">
          <div class="who">
            <b>${esc(booking.customer)}</b>
            <div class="review-meta">${esc(formatDate(booking.date))} · ${Number(booking.credits) || 0} credits${booking.refunded ? " · Refunded" : ""}</div>
          </div>
          <div class="marks">
            <button type="button" class="mark ${booking.gearStatus === "ok" ? "on-ok" : ""}" data-ok="${esc(booking.id)}" aria-label="All gear returned with no damage">✓</button>
            <button type="button" class="mark ${booking.gearStatus === "issue" ? "on-bad" : ""}" data-bad="${esc(booking.id)}" aria-label="Gear missing or damaged">✕</button>
          </div>
        </div>
        <div class="review-rented">${rented || "No gear recorded"}</div>
        ${booking.gearStatus === "ok" ? `<div class="review-summary">All gear returned, no damage.</div>` : ""}
        ${summary ? `<div class="review-summary">${esc(summary)}</div>` : ""}
        <div class="review-actions">
          <button type="button" class="btn ghost" data-refund="${esc(booking.id)}" ${booking.refunded ? "disabled" : ""}>Refund</button>
          <button type="button" class="btn danger" data-remove-booking="${esc(booking.id)}">Remove</button>
        </div>
      </article>`;
    })
    .join("");
  box.querySelectorAll("[data-ok]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const booking = state.bookings.find((item) => item.id === btn.dataset.ok);
      if (!booking) return;
      if (booking.gearStatus === "ok") {
        booking.gearStatus = "";
      } else {
        booking.gearStatus = "ok";
        booking.missing = [];
        booking.damageAnswers = [];
      }
      save();
      renderReviews();
    });
  });
  box.querySelectorAll("[data-bad]").forEach((btn) => {
    btn.addEventListener("click", () => openDamage(btn.dataset.bad));
  });
  box.querySelectorAll("[data-refund]").forEach((btn) => {
    btn.addEventListener("click", () => refundBooking(btn.dataset.refund));
  });
  box.querySelectorAll("[data-remove-booking]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const booking = state.bookings.find((item) => item.id === btn.dataset.removeBooking);
      if (!booking || !confirm(`Remove ${booking.customer}'s booking? Credits stay spent unless you refund first.`)) return;
      state.bookings = state.bookings.filter((item) => item.id !== booking.id);
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
    alert("That customer is no longer in Credits, so these credits cannot be returned.");
    return;
  }
  if (!confirm(`Refund ${booking.credits} credits to ${person.name}?`)) return;
  person.credits += Number(booking.credits) || 0;
  booking.refunded = true;
  save();
  render();
}

let damageBookingId = "";

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
  document.getElementById("bill-total").innerHTML = `${COIN}${total} credits`;
  const person = state.people.find((p) => p.id === document.getElementById("book-customer").dataset.id);
  const err = document.getElementById("book-error");
  if (!person) {
    err.textContent = "";
    return;
  }
  err.textContent = person.credits < total ? `${person.name} only has ${person.credits} credits remaining.` : "";
}

function renderPickers() {
  namePicker(document.getElementById("credit-name"), { allowNew: true });
  namePicker(document.getElementById("book-customer"), {
    allowNew: false,
    filter: (p) => p.credits > 0,
  });
  datePicker(document.getElementById("credit-date"), document.getElementById("credit-date").dataset.value || todayISO());
  datePicker(document.getElementById("book-date"), document.getElementById("book-date").dataset.value || todayISO());
  packPicker(document.getElementById("credit-pack"));
}

function renderTerms() {
  const editor = document.getElementById("terms-editor");
  if (document.activeElement === editor) return;
  editor.value = state.terms || "";
}

function render() {
  renderPeople();
  renderEquipment();
  renderFinance();
  renderPacks();
  renderCatalog("paddle-list", state.paddles, "paddles");
  renderCatalog("ball-list", state.balls, "balls");
  renderQuestions();
  renderTerms();
  renderReviews();
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

document.getElementById("credit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const nameRoot = document.getElementById("credit-name");
  const pack = state.packs.find((p) => p.id === document.getElementById("credit-pack").dataset.id);
  let person = state.people.find((p) => p.id === nameRoot.dataset.id);
  if (!person) {
    alert("Choose or add a person.");
    return;
  }
  if (!pack) {
    alert("Choose a credit pack in Settings first.");
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
  });
  save();
  document.getElementById("credit-memo").value = "";
  render();
});

const canvas = document.getElementById("sign");
const ctx = canvas.getContext("2d");
function sizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = 160 * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.strokeStyle = "#142141";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
}
sizeCanvas();
window.addEventListener("resize", sizeCanvas);
let drawing = false;
let signed = false;
function pos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: p.clientX - r.left, y: p.clientY - r.top };
}
function start(e) {
  if (document.getElementById("sign-block").classList.contains("is-locked")) return;
  e.preventDefault();
  drawing = true;
  const { x, y } = pos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
}
function move(e) {
  if (!drawing) return;
  e.preventDefault();
  const { x, y } = pos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  signed = true;
}
function end() {
  drawing = false;
}
canvas.addEventListener("pointerdown", start);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", end);
canvas.addEventListener("pointerleave", end);
document.getElementById("clear-sign").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  signed = false;
});

function setSignEnabled(on) {
  document.getElementById("sign-block").classList.toggle("is-locked", !on);
  document.getElementById("clear-sign").disabled = !on;
  if (!on) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signed = false;
  }
}

document.getElementById("agree-terms").addEventListener("change", () => {
  setSignEnabled(document.getElementById("agree-terms").checked);
});

const termsModal = document.getElementById("terms-modal");
document.getElementById("open-terms").addEventListener("click", () => {
  document.getElementById("terms-body").textContent = state.terms || "";
  termsModal.hidden = false;
});
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
document.getElementById("terms-editor").addEventListener("input", () => {
  state.terms = document.getElementById("terms-editor").value;
  save();
});

document.getElementById("booking-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const person = state.people.find((p) => p.id === document.getElementById("book-customer").dataset.id);
  const total = bookingTotal();
  const err = document.getElementById("book-error");
  if (!person) {
    err.textContent = "Select a customer with credits.";
    return;
  }
  if (!paddleId && !ballId) {
    err.textContent = "Select paddles or balls to rent.";
    return;
  }
  if (person.credits < total) {
    err.textContent = `${person.name} only has ${person.credits} credits remaining.`;
    return;
  }
  if (!document.getElementById("agree-terms").checked) {
    err.textContent = "Please agree to the terms and conditions.";
    return;
  }
  if (!signed) {
    err.textContent = "Customer signature is required.";
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
    signature: canvas.toDataURL(),
  });
  save();
  paddleId = "";
  ballId = "";
  document.getElementById("agree-terms").checked = false;
  setSignEnabled(false);
  signed = false;
  err.textContent = "";
  render();
  showBooked();
});

const bookedModal = document.getElementById("booked-modal");
const bookedSound = document.getElementById("booked-sound");
function showBooked() {
  bookedModal.hidden = false;
  bookedSound.currentTime = 0;
  const playing = bookedSound.play();
  if (playing) playing.catch(() => {});
}
document.getElementById("booked-ok").addEventListener("click", () => {
  bookedModal.hidden = true;
  bookedSound.pause();
  bookedSound.currentTime = 0;
});

document.getElementById("book-customer").addEventListener("change", updateBill);

document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((t) => t.classList.toggle("is-active", t === btn));
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("is-active", p.id === btn.dataset.tab));
    if (btn.dataset.tab === "booking") sizeCanvas();
  });
});

render();

const status = document.getElementById("status");
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
if (window.matchMedia("(display-mode: standalone)").matches) {
  status.textContent = "Running as installed app.";
}
