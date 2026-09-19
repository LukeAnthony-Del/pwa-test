const KEY = "pickle-central-v1";
const COIN = `<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" stroke="none">C</text></svg>`;
const PADDLES = [
  { id: "p1", label: "One pickleball paddle", credits: 3 },
  { id: "p2", label: "Two pickleball paddles", credits: 5 },
];
const BALLS = [
  { id: "b1", label: "One pickleball set", credits: 3 },
  { id: "b2", label: "Two pickleball sets", credits: 5 },
  { id: "b3", label: "Three ball sets", credits: 7 },
];
const defaultState = () => ({
  people: [],
  packs: [
    { id: "pack-5", name: "5 credits", credits: 5, price: 20 },
    { id: "pack-10", name: "10 credits", credits: 10, price: 35 },
    { id: "pack-20", name: "20 credits", credits: 20, price: 60 },
  ],
  sales: [],
  bookings: [],
  equipment: [
    { name: "Paddles", qty: 12, notes: "In shed" },
    { name: "Outdoor balls", qty: 40, notes: "Yellow" },
    { name: "Nets", qty: 2, notes: "Court 1 & 2" },
  ],
});

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}
function load() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaultState();
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
let state = load();
if (!state.packs?.length) state.packs = defaultState().packs;
if (!state.people) state.people = [];

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
  document.getElementById("equipment-list").innerHTML = state.equipment
    .map((item) => `<article class="card"><strong>${item.name} · ${item.qty}</strong><span>${item.notes || ""}</span></article>`)
    .join("");
}

function renderFinance() {
  const sales = state.sales.reduce((s, x) => s + Number(x.price), 0);
  const outstanding = state.people.reduce((s, p) => s + Number(p.credits), 0);
  const used = state.bookings.reduce((s, b) => s + Number(b.credits), 0);
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

let paddleId = "";
let ballId = "";

function renderChoices() {
  const paint = (id, options, selected, set) => {
    document.getElementById(id).innerHTML = options
      .map(
        (o) => `<button type="button" class="choice ${selected === o.id ? "on" : ""}" data-id="${o.id}">
          ${o.label}<small>${COIN}${o.credits} credits</small>
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
  paint("paddle-choices", PADDLES, paddleId, (v) => (paddleId = v));
  paint("ball-choices", BALLS, ballId, (v) => (ballId = v));
}

function bookingTotal() {
  const paddle = PADDLES.find((p) => p.id === paddleId);
  const ball = BALLS.find((b) => b.id === ballId);
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

function render() {
  renderPeople();
  renderEquipment();
  renderFinance();
  renderPacks();
  renderChoices();
  renderPickers();
  updateBill();
}

document.getElementById("add-pack").addEventListener("click", () => {
  state.packs.push({ id: uid(), name: "New pack", credits: 5, price: 20 });
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
  ctx.strokeStyle = "#14301f";
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
    paddle: PADDLES.find((p) => p.id === paddleId)?.label || "",
    balls: BALLS.find((b) => b.id === ballId)?.label || "",
    credits: total,
    signature: canvas.toDataURL(),
  });
  save();
  paddleId = "";
  ballId = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  signed = false;
  err.textContent = "";
  render();
  alert("Booked.");
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
