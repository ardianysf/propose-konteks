/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ic = (n, cls = "") => `<i data-lucide="${n}" class="${cls}" aria-hidden="true"></i>`;
/* One date formatter (DS-09). Demo clock: 27 Oct 2026, 19.40 WIB. Absolute time is the text; relative time is the tooltip.
   Today shows "Today, 12.40"; any other day shows the full date with the year. */
const NOW = new Date(2026, 9, 27, 19, 40);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad2 = n => String(n).padStart(2, "0");
function fmtDate(d) { const same = d.toDateString() === NOW.toDateString(); return (same ? "Today" : `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`) + `, ${pad2(d.getHours())}.${pad2(d.getMinutes())}`; }
function relTime(m) { return m < 60 ? `${m} minute${m === 1 ? "" : "s"} ago` : m < 1440 ? `${Math.round(m / 60)} hour${Math.round(m / 60) === 1 ? "" : "s"} ago` : `${Math.round(m / 1440)} day${Math.round(m / 1440) === 1 ? "" : "s"} ago`; }
const ago = m => { const d = new Date(NOW - m * 60000); return `<time datetime="${d.toISOString()}" title="${relTime(m)}">${fmtDate(d)}</time>`; };
const drawIcons = () => { if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.75 } }); };

/* Authored status glyphs: a circle that fills as an initiative moves from planning to delivery.
   Colour says who is waited on; the glyph always sits next to a text label. */
const STAGE_FRAC = { Planning: .25, Executing: .65, Done: 1 };
function sg(stage, tone) {
  const color = { decision: "var(--accent-strong)", blocked: "var(--danger)", waiting: "var(--ink-3)", running: "var(--info)", done: "var(--accent-strong)" }[tone] || "var(--ink-3)";
  if (tone === "blocked") return `<svg class="sg" viewBox="0 0 16 16" role="img" aria-label="${stage}, blocked"><circle cx="8" cy="8" r="6.5" fill="none" stroke="${color}" stroke-width="1.5"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  if (stage === "Done") return `<svg class="sg" viewBox="0 0 16 16" role="img" aria-label="Done"><circle cx="8" cy="8" r="7" fill="${color}"/><path d="M5 8.2l2 2 4-4.2" fill="none" stroke="var(--surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const f = STAGE_FRAC[stage] ?? 0, a = f * 2 * Math.PI, r = 3.6, x = 8 + r * Math.sin(a), y = 8 - r * Math.cos(a), large = f > .5 ? 1 : 0;
  return `<svg class="sg" viewBox="0 0 16 16" role="img" aria-label="${stage}"><circle cx="8" cy="8" r="6.5" fill="none" stroke="${color}" stroke-width="1.5"/><path d="M8 8 L8 ${8 - r} A${r} ${r} 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z" fill="${color}"/></svg>`;
}

const av = (id, lg) => { const p = PEOPLE[id]; return `<span class="av ${lg ? "av-lg" : ""}" title="${esc(p.name)}">${p.ini}</span>`; };
const sysTag = id => `<span class="tag sys-tag">${esc(sysById[id].name)}</span>`;
const st = (kind, text) => `<span class="st st-${kind}"><span class="dot"></span>${esc(text)}</span>`;
const RT_STATUS = { ready: ["ok", "Ready"], offline: ["muted", "Not connected"], paused: ["warn", "Not accepting work"] };
const rtStatus = r => st(...RT_STATUS[r.status]);

/* ---------- toasts, drawers, dialogs, menus ---------- */
function toast(msg, kind) {
  let host = $(".toasts"); if (!host) { host = document.createElement("div"); host.className = "toasts"; host.setAttribute("role", "status"); document.body.append(host); }
  const t = document.createElement("div"); t.className = "toast";
  if (kind === "err") t.classList.add("err");
  if (kind === "ask") t.classList.add("ask");
  t.innerHTML = `${ic(kind === "err" ? "circle-alert" : kind === "ask" ? "message-circle-question" : "check-circle-2")}<span>${esc(msg)}</span>`;
  host.append(t); drawIcons();
  if (kind === "err") sfx("error"); else if (kind !== "ask") sfx("ok");
  setTimeout(() => { t.classList.add("leaving"); setTimeout(() => t.remove(), 180); }, 4200);
}
/* Demo clock that keeps moving from NOW, so new messages get a real-looking time. */
const PAGE_T0 = performance.now();
const demoNow = () => new Date(+NOW + (performance.now() - PAGE_T0));

/* ---------- Sound ----------
   Five short tones, synthesised with Web Audio (no files): send, tick (a step or a pick), done (the agent finished),
   needs (the agent or a teammate needs you), ok (an action went through) and error. Quiet by design (−20 dB master),
   never looped, off with one switch (Settings › General, or the speaker in the pitch bar), remembered per browser. */
const SFX = {
  send: [[740, 0, .07, "sine", .5], [988, .05, .09, "sine", .4]],
  tick: [[1760, 0, .025, "sine", .18]],
  done: [[880, 0, .12, "sine", .5], [1318.5, .09, .22, "sine", .45]],
  needs: [[659.3, 0, .14, "triangle", .55], [987.8, .12, .14, "triangle", .5], [659.3, .26, .2, "triangle", .35]],
  ok: [[1046.5, 0, .1, "sine", .35]],
  error: [[233, 0, .16, "triangle", .6], [196, .12, .22, "triangle", .5]],
};
let AC = null;
function sfx(name) {
  if (!S.sound || !SFX[name]) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const master = AC.createGain(); master.gain.value = 0.1; master.connect(AC.destination);
    const t0 = AC.currentTime + 0.01;
    SFX[name].forEach(([f, at, dur, type, vol]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g); g.connect(master); o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
    });
  } catch (e) {}
}
function setSound(on) { S.sound = on; try { localStorage.setItem("kx-sound", on ? "on" : "off"); } catch (e) {} if (on) sfx("ok"); }

let lastFocus = null;
const layers = () => $$(".drawer:not(.leaving),.dialog:not(.leaving)");
/* Close the top layer only. Lower layers stay open and get focus back (UX-012). */
function closeOverlay() {
  const ls = layers(), top = ls[ls.length - 1]; if (!top) return;
  /* Exit is faster than entry and the element leaves the layer stack at once, so focus and Escape never wait on it. */
  const scrims = $$(".scrim:not(.leaving)"), sc = scrims[scrims.length - 1];
  [top, sc].forEach(n => { if (!n) return; n.classList.add("leaving"); n.setAttribute("aria-hidden", "true"); setTimeout(() => n.remove(), 150); });
  const next = layers().pop();
  if (next) (next._ret || next).focus(); else { document.removeEventListener("keydown", overlayKey); lastFocus?.focus(); }
}
function overlayKey(e) {
  /* Menus, popovers and comboboxes handle their own Escape first. */
  if ($(".menu") || $(".pop") || $(".floatpop")) return;
  const top = layers().pop(); if (!top) return;
  if (e.key === "Escape") { e.preventDefault(); closeOverlay(); return; }
  if (e.key === "Tab") { /* keep focus inside the top layer */
    const f = $$('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])', top).filter(x => x.offsetParent !== null);
    if (!f.length) { e.preventDefault(); top.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === top)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
function openLayer(el) {
  if (!layers().length) lastFocus = document.activeElement; else layers().pop()._ret = document.activeElement;
  const scrim = document.createElement("div"); scrim.className = "scrim" + (layers().length ? " stack" : "");
  scrim.onclick = () => { if (layers().pop() === el) closeOverlay(); };
  document.body.append(scrim, el);
  document.removeEventListener("keydown", overlayKey); document.addEventListener("keydown", overlayKey);
  drawIcons();
  el.tabIndex = -1; el.focus();
  el.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => { if (layers().includes(el)) { while (layers().pop() !== el) closeOverlay(); closeOverlay(); } }));
}
/* Overlay grammar (one rule, every screen):
   drawer  = look at or review an object without leaving the page (PRD, Breakdown, Updates, detail panels); stackable;
   modal   = fill in a form or a step and submit it (create, edit, request, connect);
   dialog  = confirm one consequence (approve with cost, decline, revoke, delete, ship);
   menu / popover = pick or navigate. */
function drawer(title, body, foot = "", sub = "", { wide = false } = {}) {
  const d = document.createElement("aside");
  d.className = "drawer" + (wide ? " wide" : ""); d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", title);
  d.innerHTML = `<div class="drawer-h"><h2>${esc(title)}</h2>${sub}<button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">${ic("x")}</button></div>
    <div class="drawer-b">${body}</div>${foot ? `<div class="drawer-f">${foot}</div>` : ""}`;
  openLayer(d); return d;
}
/* Modal: the one pattern for every create/edit form (UX-035). Title matches the button that opened it;
   footer is Cancel + one primary on the right; the primary stays off until required fields are valid. */
function modal(title, body, foot, { sub = "", wide = false } = {}) {
  const d = document.createElement("div");
  d.className = "dialog modal" + (wide ? " wide" : ""); d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", title);
  d.innerHTML = `<div class="modal-h"><div style="display:grid;gap:2px;min-width:0"><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">${ic("x")}</button></div>
    <div class="modal-b">${body}</div>${foot ? `<div class="dialog-f">${foot}</div>` : ""}`;
  openLayer(d); return d;
}
async function copyText(text, el) {
  try { await navigator.clipboard.writeText(text); toast("Copied"); }
  catch (e) { if (el?.select) el.select(); else if (el) { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); } toast("Selected. Press ⌘C to copy"); }
}
function bindCopy(root = document) { $$("[data-copy]", root).forEach(b => b.onclick = () => copyText(b.dataset.copy, b.closest(".cmd")?.querySelector("code"))); }
const cmd = (c, label = "Copy command") => `<div class="cmd"><code>${esc(c)}</code><button class="btn btn-ghost btn-sm" type="button" aria-label="${label}: ${esc(c)}" data-copy="${esc(c)}">${ic("copy")}Copy</button></div>`;

/* Replace a modal's content in place: a two-step form stays one window instead of closing and reopening. */
function modalStep(d, { sub, body, foot }) {
  if (sub !== undefined) { let p = d.querySelector(".modal-h p"); if (!p) { p = document.createElement("p"); d.querySelector(".modal-h h2").after(p); } p.innerHTML = sub; }
  d.querySelector(".modal-b").innerHTML = body; d.querySelector(".dialog-f").innerHTML = foot;
  drawIcons(); d.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => { if (layers().includes(d)) { while (layers().pop() !== d) closeOverlay(); closeOverlay(); } }));
  d.querySelector(".modal-b").scrollTop = 0; (d.querySelector(".modal-b [autofocus]") || d.querySelector(".dialog-f .btn-primary") || d).focus();
}
function dialog(title, text, confirmLabel, onConfirm, danger, { confirmHtml } = {}) {
  const d = document.createElement("div");
  d.className = "dialog"; d.setAttribute("role", "alertdialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", title);
  d.innerHTML = `<div class="dialog-b"><h2>${esc(title)}</h2><p>${text}</p></div>
    <div class="dialog-f"><button class="btn" data-close>Cancel</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-ok>${confirmHtml || esc(confirmLabel)}</button></div>`;
  openLayer(d);
  d.querySelector("[data-ok]").onclick = () => { closeOverlay(); onConfirm?.(); };
  d.querySelector("[data-ok]").focus();
  return d;
}
function menu(anchor, items) {
  /* Items: {label, icon, run, danger, kbd}; "-" a divider; {head: html} a non-interactive header;
     {choice, options: [[short, label, checked, run]]} a one-of-two row (e.g. language) read as menuitemradio. */
  $$(".menu").forEach(m => m.remove());
  const m = document.createElement("div"); m.className = "menu"; m.setAttribute("role", "menu");
  const runs = [];
  m.innerHTML = items.map(i => {
    if (i === "-") return "<hr>";
    if (i.head) return `<div class="menu-head" role="presentation">${i.head}</div>`;
    if (i.choice) return `<div class="menu-choice" role="group" aria-label="${esc(i.choice)}"><span>${esc(i.choice)}</span><span class="seg">${i.options.map(([s, l, on, run]) => { runs.push(run); return `<button type="button" role="menuitemradio" aria-checked="${on}" aria-pressed="${on}" aria-label="${esc(l)}" data-run="${runs.length - 1}">${esc(s)}</button>`; }).join("")}</span></div>`;
    runs.push(i.run); return `<button role="menuitem" class="${i.danger ? "danger" : ""}" data-run="${runs.length - 1}" data-k="${i.k || ""}">${i.icon ? ic(i.icon) : ""}${esc(i.label)}${i.kbd ? `<span class="kbd mk">${i.kbd}</span>` : ""}</button>`;
  }).join("");
  const r = anchor.getBoundingClientRect();
  m.style.position = "fixed"; document.body.append(m); drawIcons();
  const h = m.offsetHeight, w = m.offsetWidth;
  /* Open below the trigger, or above it when the trigger sits low (the account button at the foot of the sidebar). */
  m.style.top = (r.bottom + 4 + h > innerHeight ? Math.max(8, r.top - 4 - h) : r.bottom + 4) + "px";
  m.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
  const btns = $$("button", m); btns[0]?.focus();
  const close = () => { m.remove(); document.removeEventListener("mousedown", out); document.removeEventListener("keydown", key); anchor.focus(); };
  const out = e => { if (!m.contains(e.target)) close(); };
  const key = e => {
    const i = btns.indexOf(document.activeElement);
    if (e.key === "Escape") { e.stopImmediatePropagation(); close(); }
    if (e.key === "ArrowDown") { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
  };
  setTimeout(() => { document.addEventListener("mousedown", out); document.addEventListener("keydown", key); });
  btns.forEach(b => b.onclick = () => { const run = runs[+b.dataset.run]; close(); run?.(); });
}

/* Popover: a small anchored card for a glance (one question, one link). Closes on outside click and Escape. */
function popover(anchor, label, html) {
  $$(".floatpop").forEach(p => p.remove());
  const p = document.createElement("div"); p.className = "floatpop qpop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", label);
  p.innerHTML = html; document.body.append(p);
  const r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
  p.style.top = (r.bottom + 6 + h > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + "px"; p.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
  const close = (refocus = true) => { p.remove(); document.removeEventListener("mousedown", out); document.removeEventListener("keydown", key); if (refocus) anchor.focus(); };
  const out = e => { if (!p.contains(e.target) && e.target !== anchor) close(false); };
  const key = e => { if (e.key === "Escape") { e.stopImmediatePropagation(); close(); } };
  (p.querySelector("a,button") || p).focus();
  setTimeout(() => { document.addEventListener("mousedown", out); document.addEventListener("keydown", key); });
  return { el: p, close };
}
