(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const smooth = t => t * t * (3 - 2 * t);
const seen = (el, cb, th = .25) => new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { threshold: th }).observe(el);

/* theme */
$("#theme").onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("kx-lp-theme", r.dataset.theme); } catch (e) {}
};

/* nav edge, menu closes on pick */
const nav = $("#nav");
$$(".menu-pop a").forEach(a => a.addEventListener("click", () => $(".menu").removeAttribute("open")));

/* copy the connect line */
const copyBtn = $("#copy");
copyBtn.onclick = async () => {
  const text = $("#cl").textContent.trim();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    const r = document.createRange(); r.selectNodeContents($("#cl"));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    try { ok = document.execCommand("copy"); } catch (e2) {}
  }
  const l = copyBtn.querySelector("span");
  l.textContent = ok ? "Copied" : "Select and copy";
  copyBtn.classList.toggle("done", ok);
  clearTimeout(copyBtn._t);
  copyBtn._t = setTimeout(() => { l.textContent = "Copy"; copyBtn.classList.remove("done"); }, 2400);
};

/* ============ HERO: a teammate types, Rina says yes, agents run, a receipt prints. Loops on its own. ============ */
const hero = $(".hero"), sheet = $("#sheet"), yes = $("#yes"), yesL = $("#yes-l"), lanes = $$(".lane"), cur = $("#cursor"), rc = $("#rcount");
const SCRIPT = [
  [300, 0, "run", "Reading the Software System: <b>billing-web</b>, <b>invoices-api</b>"],
  [1900, 0, "run", "Editing <b>export.ts</b> and <b>InvoiceTable.tsx</b>"],
  [3500, 0, "run", "Tests: <b>18 passed</b>"],
  [4900, 0, "done", "Opened pull request <b>#318</b>"],
  [5100, 1, "run", "Reviewing <b>#318</b>"],
  [6500, 1, "run", "Asked for a check on empty tax rows"],
  [7200, 0, "done", "Fixed empty tax rows, opened <b>#319</b>"],
  [8300, 1, "done", "Approved <b>#318</b> and <b>#319</b>"],
  [8600, 2, "run", "Opening <b>/invoices</b> in Chromium"],
  [9800, 2, "run", "Clicked <b>Export CSV</b>"],
  [11000, 2, "done", "Checked the file: <b>120 rows</b>, tax column there"],
];
const LABEL = { run: "Running", done: "Done", idle: "Idle" };
let timers = [], phase = "idle", heroVisible = true;
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const setLane = (i, st, html, type) => {
  const ln = lanes[i], log = $(".log", ln);
  ln.classList.remove("run", "done"); if (st !== "idle") ln.classList.add(st);
  $(".state span", ln).textContent = LABEL[st];
  if (!type) { log.innerHTML = html; return; }
  const plain = html.replace(/<[^>]+>/g, ""); let n = 0;
  const car = '<span class="car"></span>';
  const tick = () => {
    n += 2; log.innerHTML = plain.slice(0, n).replace(/&/g, "&amp;").replace(/</g, "&lt;") + car;
    if (n < plain.length) later(16, tick); else log.innerHTML = html + (st === "run" ? car : "");
  };
  tick();
};
const finalState = () => {
  timers.forEach(clearTimeout); timers = [];
  sheet.classList.remove("wait"); cur.className = "cursor"; rc.textContent = "3";
  hero.classList.add("go", "printed"); yesL.textContent = "Yes, approved";
  const last = {}; SCRIPT.forEach(s => last[s[1]] = s);
  Object.values(last).forEach(s => setLane(s[1], "done", s[3]));
  phase = "done";
};
const reset = () => {
  timers.forEach(clearTimeout); timers = [];
  hero.classList.remove("go", "printed"); yesL.textContent = "Yes";
  sheet.classList.add("wait"); rc.textContent = "2"; cur.className = "cursor";
  lanes.forEach((_, i) => setLane(i, "idle", "Waiting for yes"));
  phase = "idle";
};
const run = () => {
  if (phase === "run") return;
  timers.forEach(clearTimeout); timers = [];
  sheet.classList.remove("wait");
  phase = "run";
  hero.classList.remove("go"); void hero.offsetWidth; hero.classList.add("go");
  yesL.textContent = "Yes, approved";
  SCRIPT.forEach(([t, i, st, h]) => later(t, () => setLane(i, st, h, true)));
  later(11800, () => { hero.classList.add("printed"); phase = "done"; });
  later(19000, () => { if (heroVisible) cycle(); else phase = "waiting"; });
};
/* one cycle: Ayu finishes typing, a reaction lands, Rina's cursor presses yes */
const cycle = () => {
  reset();
  later(1400, () => { sheet.classList.remove("wait"); rc.textContent = "3"; $(".react", sheet).classList.add("bump"); later(600, () => $(".react", sheet).classList.remove("bump")); });
  later(2300, () => cur.classList.add("on"));
  later(2700, () => cur.classList.add("go"));
  later(3700, () => { cur.classList.add("click"); run(); });
  later(4300, () => cur.classList.remove("on", "click"));
};
yes.addEventListener("click", () => { if (phase !== "run") { cur.className = "cursor"; run(); } });
$("#replay").addEventListener("click", () => cycle());
if (RM) finalState();
else {
  seen(hero, v => { heroVisible = v; if (v && (phase === "waiting" || phase === "idle" && !timers.length)) cycle(); }, .15);
}

/* ============ ledger: strike the old, slide in the new ============ */
const ledger = $("#ledger");
if (RM) ledger.classList.add("still");
else { ledger.classList.add("arm"); seen(ledger, v => { if (v) ledger.classList.add("on"); }, .3); }

/* ============ FOUR ERAS: vertical scroll drives a horizontal rail; each scene runs on its own clock ============ */
const eras = $("#eras"), rail = $("#erail"), eraEls = $$(".era", rail), N = eraEls.length;
const yrbig = $("#yrbig"), ticks = $$(".ticks span"), tickbar = $("#tickbar"), edist = $("#edist");
const YEARS = [1843, 1936, 1969, 2026], HUES = ["#9A6212", "#2F6F8F", "#4F7044", "#5F8D4E"];
// gears
$$(".gear").forEach(g => {
  const T = +g.dataset.teeth, r1 = 78, r2 = 94, pts = [];
  for (let i = 0; i < T * 4; i++) {
    const a = (i / (T * 4)) * Math.PI * 2, r = (i % 4 < 2) ? r2 : r1;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  g.innerHTML = `<g><path d="M${pts.join("L")}Z"/><circle r="40" fill="none" stroke-width="2"/><circle class="hub" r="12"/>${[0, 1, 2, 3, 4, 5].map(k => { const a = k * Math.PI / 3; return `<circle r="9" cx="${(Math.cos(a) * 58).toFixed(1)}" cy="${(Math.sin(a) * 58).toFixed(1)}" fill="none"/>`; }).join("")}</g>`;
});
// tape
const TAPE = "0110100101110010".split("").concat(["_"]), tape = $("#tape");
tape.innerHTML = TAPE.map(c => `<span class="${c === "_" ? "blank" : ""}">${c}</span>`).join("");
const cells = $$("span", tape), tstate = $("#tstate"), rrows = $$(".rules-card div");
// terminal
const CODE = [["main()\n{\n    printf(", ""], ['"hello, world\\n"', "s"], [");\n}\n\n$ cc hello.c\n$ ./a.out\n", ""], ["hello, world", "o"]];
const CLEN = CODE.reduce((n, c) => n + c[0].length, 0), cterm = $("#cterm");
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let lastCN = -1;
const drawTerm = t => {
  const n = Math.round(CLEN * clamp(t * 1.1)); if (n === lastCN) return; lastCN = n;
  let left = n, out = "";
  for (const [txt, cls] of CODE) { if (left <= 0) break; const part = txt.slice(0, left); left -= part.length; out += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part); }
  cterm.innerHTML = out + '<span class="car"></span>';
};
const layers = eraEls.map(e => $$(".L", e).map(l => [l, +(l.dataset.d || 0)]));
const scene = [
  (t, el) => { // 1843: rows written one by one, ink underline, gears turn
    $$(".row", el).forEach((r, k) => r.classList.toggle("on", t > k * .18 + .02));
    $(".ink path", el).style.strokeDashoffset = 320 * (1 - clamp((t - .7) / .3));
  },
  (t, el) => { // 1936: the head walks the tape and flips each symbol
    const k = Math.min(cells.length - 1, Math.floor(clamp(t) * cells.length));
    const w = cells[0].getBoundingClientRect().width - 1;
    tape.style.transform = `translateX(${-(k + .5) * w}px)`;
    cells.forEach((c, i) => { const done = i < k && TAPE[i] !== "_"; c.classList.toggle("done", done); c.textContent = TAPE[i] === "_" ? "_" : done ? (TAPE[i] === "0" ? "1" : "0") : TAPE[i]; });
    const sym = TAPE[k]; rrows.forEach((r, i) => r.classList.toggle("hit", (sym === "0" && i === 0) || (sym === "1" && i === 1) || (sym === "_" && i === 2)));
    tstate.textContent = sym === "_" ? "halt" : "q1";
  },
  t => drawTerm(t),
  (t, el) => { // today: comments, a yes, agents below the line
    $$(".bub", el).forEach((b, k) => b.classList.toggle("on", t > .08 + k * .2));
    $(".nyes", el).classList.toggle("on", t > .66);
    $$(".chip", el).forEach((c, k) => c.classList.toggle("on", t > .74 + k * .08));
  },
];
let erasOn = false, gearA = $(".gA g"), gearB = $(".gB g"), spin = 0;
const erasDraw = () => {
  const r = eras.getBoundingClientRect(), stageH = innerHeight - 64;
  const p = clamp(-r.top / Math.max(1, r.height - stageH));
  const pos = p * (N - 1 + .6);                         // each era holds for a while, then slides
  const i = Math.min(N - 1, Math.floor(pos)), f = pos - i;
  const s = i < N - 1 ? smooth(clamp((f - .6) / .4)) : 0;
  const off = i + s;
  rail.style.transform = `translate3d(${-off * 100}%,0,0)`;
  const curI = Math.round(off);
  eraEls.forEach((e, k) => {
    e.classList.toggle("cur", k === curI);
    const u = k - off;                                    // -1..1 around the current panel
    layers[k].forEach(([l, d]) => { l.style.transform = `translate3d(${u * d * -90}px,${(Math.abs(u)) * d * 24}px,0) rotate(${u * d * -2}deg)`; });
    const t = k < i ? 1 : k > i ? 0 : clamp(f / .6);
    scene[k](ease(t), e);
  });
  // year counter, ticks, distance bar
  const y = Math.round(YEARS[i] + (YEARS[Math.min(N - 1, i + 1)] - YEARS[i]) * s);
  yrbig.textContent = curI === N - 1 && s === 0 ? "Today" : y;
  yrbig.style.color = HUES[curI];
  ticks.forEach((t, k) => t.classList.toggle("on", k <= curI));
  tickbar.style.width = `${(off / (N - 1)) * 100}%`;
  edist.style.width = `${(off / (N - 1)) * 100}%`;
  spin = p * 720;
};
if (RM) { eraEls.forEach((e, k) => { e.classList.add("cur"); scene[k](1, e); }); }
else {
  seen(eras, v => { erasOn = v; }, 0);
  // gears keep turning on their own, faster while you scroll
  let gt = 0;
  const gearLoop = now => {
    if (erasOn) { gt = now / 1000; gearA.style.transform = `rotate(${gt * 14 + spin}deg)`; gearB.style.transform = `rotate(${-(gt * 14 + spin) * 14 / 9 + 10}deg)`; }
    requestAnimationFrame(gearLoop);
  };
  requestAnimationFrame(gearLoop);
}

/* ============ the loop: a note travels the line, out past the yes and back ============ */
const loop = $("#loop"), steps = $$(".step", loop), NS = "http://www.w3.org/2000/svg";
let svg, base, tok, halo, len = 0, wide = false, segs = [], loopOn = false;
const layout = () => {
  wide = innerWidth > 900;
  if (!wide) { if (svg) svg.remove(), svg = null; return; }
  if (!svg) {
    svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "path"); svg.setAttribute("aria-hidden", "true");
    base = document.createElementNS(NS, "path"); base.setAttribute("class", "ink");
    halo = document.createElementNS(NS, "circle"); halo.setAttribute("class", "halo"); halo.setAttribute("r", 14);
    tok = document.createElementNS(NS, "circle"); tok.setAttribute("class", "tok"); tok.setAttribute("r", 7);
    svg.append(base, halo, tok); loop.append(svg);
  }
  const lr = loop.getBoundingClientRect();
  const pts = steps.map(s => { const r = $(".node", s).getBoundingClientRect(); return [r.left - lr.left + r.width / 2, r.top - lr.top + r.height / 2]; });
  let d = `M${pts[0][0]} ${pts[0][1]}`; const R = 22;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (Math.abs(y1 - y0) < 2) { d += ` L${x1} ${y1}`; continue; }
    const sy = Math.sign(y1 - y0), sx = Math.sign(x1 - x0) || 1;
    if (y1 > y0) d += ` L${x1 - sx * R} ${y0} Q${x1} ${y0} ${x1} ${y0 + sy * R} L${x1} ${y1}`;
    else d += ` L${x0} ${y1 - sy * R} Q${x0} ${y1} ${x0 + sx * R} ${y1} L${x1} ${y1}`;
  }
  base.setAttribute("d", d); len = base.getTotalLength();
  // where along the path each node sits
  segs = pts.map(([x, y]) => { let best = 0, bd = 1e9; for (let l = 0; l <= len; l += 4) { const q = base.getPointAtLength(l), dd = (q.x - x) ** 2 + (q.y - y) ** 2; if (dd < bd) { bd = dd; best = l; } } return best; });
};
let lt0 = 0;
const loopFrame = now => {
  if (wide && svg && loopOn && !RM) {
    if (!lt0) lt0 = now;
    const T = 9000, k = ((now - lt0) % T) / T, l = len * smooth(k);
    const q = base.getPointAtLength(l);
    tok.setAttribute("cx", q.x); tok.setAttribute("cy", q.y); halo.setAttribute("cx", q.x); halo.setAttribute("cy", q.y);
    steps.forEach((s, i) => s.classList.toggle("lit", l >= segs[i] - 2));
  }
  requestAnimationFrame(loopFrame);
};
const narrowLit = () => { if (wide) return; const vh = innerHeight; steps.forEach(s => s.classList.toggle("lit", RM || s.getBoundingClientRect().top < vh * .7)); };
seen(loop, v => { loopOn = v; if (!v) lt0 = 0; }, .2);
if (RM) steps.forEach(s => s.classList.add("lit"));
requestAnimationFrame(loopFrame);

/* ============ scroll + resize ============ */
let raf = 0;
const onScroll = () => { nav.classList.toggle("stuck", scrollY > 8); if (!RM) erasDraw(); narrowLit(); };
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
addEventListener("resize", () => { requestAnimationFrame(() => { layout(); onScroll(); }); });
document.fonts && document.fonts.ready.then(() => { layout(); onScroll(); });
layout(); onScroll();

/* ============ Activities: new turning points keep arriving ============ */
const feed = $("#feed");
const EVENTS = [
  ["sh", "Shipped", "CSV export is live for Finance", "Downloaded March. All 120 rows are there.", "Ayu"],
  ["", "Started", "Dark mode for the billing portal", "Customers keep asking for it.", "Dimas"],
  ["ap", "Approved", "Plan, ceiling $4.50", "Two steps, fine by me.", "Rina"],
  ["fx", "Fixed", "Timezone off by one on receipts", "The browser agent caught it.", "Ayu"],
  ["sh", "Shipped", "Dark mode for the billing portal", "Looks right on my phone too.", "Dimas"],
  ["", "Started", "Export invoices as PDF", "Same columns as the CSV, please.", "Rina"],
];
let ev = 0, feedOn = false;
const stamp = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const pushEvent = () => {
  if (!feedOn || document.hidden) return;
  const [c, tag, title, quote, who] = EVENTS[ev++ % EVENTS.length];
  const li = document.createElement("li"); li.className = "enter";
  li.innerHTML = `<span class="tag ${c}">${tag}</span><div><b>${title}</b><q>${quote}</q><div class="m">${who} · ${stamp()}</div></div>`;
  const last = feed.lastElementChild; last.classList.add("leave");
  setTimeout(() => { last.remove(); feed.prepend(li); }, 380);
};
if (!RM) { seen(feed, v => feedOn = v, .3); setInterval(pushEvent, 3600); }

/* ============ four kinds of session: advances on its own, pauses on hover or focus ============ */
const KINDS = [
  { t: "A requirement becomes milestones, sprints, and tickets. Each ticket becomes a plan.",
    f: [["", "i-note", "Requirement", "Billing exports for Finance"], ["ag", "i-layers", "Milestones and sprints", "2 milestones, 3 sprints"], ["ag", "i-ticket", "Tickets", "9 tickets"], ["", "i-check", "Plans", "One per ticket, each with a ceiling"]] },
  { t: "A plan, your yes, tested pull requests, and a receipt.",
    f: [["", "i-note", "Plan", "4 steps, ceiling $6.00"], ["y", "", "Yes", ""], ["ag", "i-pr", "Pull requests", "2, tests passed"], ["", "i-receipt", "Receipt", "Kept in the record"]] },
  { t: "A browser agent clicks through what shipped and reports only what it ran.",
    f: [["", "i-check", "Shipped", "CSV export for Finance"], ["ag", "i-pointer", "Browser agent", "Opened /invoices, clicked Export CSV"], ["", "i-receipt", "Report", "3 steps run, 3 passed"]] },
  { t: "The agent watches logs and alerts, opens the issue, and works the fix.",
    f: [["ag", "i-pulse", "Watches", "A timeout in the invoices-api logs"], ["ag", "i-alert", "Issue", "CSV export times out past 5,000 rows"], ["ag", "i-hammer", "Fix", "A plan for the fix, with a ceiling"], ["y", "", "Yes", ""]] },
];
const tabs = $$("#ktabs [role=tab]"), panel = $("#kp"), kinds = $(".kinds");
let curTab = 0;
const show = (i, focus) => {
  curTab = i;
  tabs.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; const bar = $(".bar", b); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; });
  panel.setAttribute("aria-labelledby", tabs[i].id);
  const k = KINDS[i];
  panel.innerHTML = `<p>${esc(k.t)}</p><div class="flow">${k.f.map(([c, ic, b, s], n) =>
    c === "y" ? `<div class="y" style="--i:${n}">${b}</div>` : `<div class="${c}" style="--i:${n}"><span class="fi"><svg class="ico"><use href="#${ic}"/></svg></span><b>${esc(b)}</b>${esc(s)}</div>`).join("")}</div><span class="eg">Example</span>`;
  if (focus) tabs[i].focus();
};
tabs.forEach((b, i) => {
  b.addEventListener("click", () => show(i));
  $(".bar", b).addEventListener("animationend", () => { if (!RM && curTab === i) show((i + 1) % tabs.length); });
  b.addEventListener("keydown", e => {
    const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); show((i + k + tabs.length) % tabs.length, true); }
    if (e.key === "Home") { e.preventDefault(); show(0, true); }
    if (e.key === "End") { e.preventDefault(); show(tabs.length - 1, true); }
  });
});
seen(kinds, v => kinds.classList.toggle("hold", !v), .3);
if (RM) kinds.classList.add("hold");
show(0);
})();
