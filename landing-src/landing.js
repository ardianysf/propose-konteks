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

/* ============ HERO: pinned until the demo is done. Time plays it; scrolling plays it faster. ============ */
const pin = $("#heroPin"), hero = $(".hero"), sheet = $("#sheet"), yes = $("#yes"), yesL = $("#yes-l"), lanes = $$(".lane"), cur = $("#cursor"), rc = $("#rcount"), react = $(".react", sheet);
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
const YES_AT = 3700, FOLD_AT = 16000, PRINT_AT = 16400, TOTAL = 17200;
const laneKey = [];
const strip = h => h.replace(/<[^>]+>/g, "");
const escT = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const drawLane = (i, lm) => {
  let step = null; for (const s of SCRIPT) if (s[1] === i && s[0] <= lm) step = s;
  const st = step ? step[2] : "idle";
  const ln = lanes[i], log = $(".log", ln);
  let html;
  if (!step) html = "Waiting for yes";
  else {
    const plain = strip(step[3]), n = Math.floor((lm - step[0]) / 9);
    html = n >= plain.length ? step[3] + (st === "run" ? '<span class="car"></span>' : "") : escT(plain.slice(0, n)) + '<span class="car"></span>';
  }
  const key = st + "|" + html;
  if (laneKey[i] === key) return; laneKey[i] = key;
  ln.classList.toggle("run", st === "run"); ln.classList.toggle("done", st === "done");
  $(".state span", ln).textContent = LABEL[st];
  log.innerHTML = html;
};
let lastMs = -1;
const renderHero = ms => {
  if (lastMs < 1400 && ms >= 1400 && ms < 2600) { react.classList.remove("bump"); void react.offsetWidth; react.classList.add("bump"); }
  sheet.classList.toggle("wait", ms < 1400);
  rc.textContent = ms < 1400 ? "2" : "3";
  cur.classList.toggle("on", ms >= 2300 && ms < 4300);
  cur.classList.toggle("go", ms >= 2700 && ms < 4300);
  cur.classList.toggle("click", ms >= 3550 && ms < 3900);
  const go = ms >= YES_AT;
  if (go !== hero.classList.contains("go")) { hero.classList.toggle("go", go); yesL.textContent = go ? "Yes, approved" : "Yes"; }
  const lm = ms - YES_AT; for (let i = 0; i < lanes.length; i++) drawLane(i, lm);
  hero.classList.toggle("folded", ms >= FOLD_AT);
  hero.classList.toggle("printed", ms >= PRINT_AT);
  pin.style.setProperty("--pp", clamp(ms / TOTAL));
  lastMs = ms;
};
let clock = 0, heroVisible = true, replayFrom = 0, scrollMs = 0, pinned = false, prevT = 0;
let stTop = 64, heroH = 0;
const measurePin = () => {
  document.documentElement.classList.remove("pinned");
  const had = [hero.classList.contains("folded"), hero.classList.contains("printed")];
  const lanesEl = $(".lanes", hero); lanesEl.style.minHeight = "";
  hero.classList.add("measure");
  hero.classList.remove("folded", "printed"); const l1 = lanesEl.offsetHeight;
  hero.classList.add("folded", "printed"); const l2 = lanesEl.offsetHeight;
  lanesEl.style.minHeight = Math.max(l1, l2) + "px";
  const h1 = hero.offsetHeight, h2 = h1;
  hero.classList.remove("measure");
  hero.classList.toggle("folded", had[0]); hero.classList.toggle("printed", had[1]);
  heroH = Math.max(h1, h2);
  stTop = Math.min(64, innerHeight - heroH);
  pinned = !RM;
  pin.style.setProperty("--hh", heroH + "px"); pin.style.setProperty("--st", stTop + "px");
  document.documentElement.classList.toggle("pinned", pinned);
};
const pinProgress = () => {
  if (!pinned) return 0;
  const r = pin.getBoundingClientRect(), span = pin.offsetHeight - heroH;
  return clamp((stTop - r.top) / Math.max(1, span));
};
const heroFrame = now => {
  const dt = prevT ? Math.min(100, now - prevT) : 0; prevT = now;
  if (heroVisible) clock += dt;
  const sp = pinProgress();
  scrollMs = sp > replayFrom ? (sp - replayFrom) / Math.max(.001, 1 - replayFrom) * TOTAL * 1.18 : 0;
  let ms = Math.min(TOTAL, Math.max(clock, scrollMs));
  // after a long hold at the top, play it again
  if (clock > TOTAL + 9000 && sp < .02) { clock = 0; replayFrom = 0; }
  renderHero(ms);
  requestAnimationFrame(heroFrame);
};
yes.addEventListener("click", () => { clock = Math.max(clock, YES_AT); });
$("#replay").addEventListener("click", () => { clock = 0; replayFrom = pinProgress(); });
if (RM) renderHero(TOTAL);
else { seen(hero, v => heroVisible = v, .15); measurePin(); requestAnimationFrame(heroFrame); }

/* ============ the same week: blocks leave the calendar as you scroll ============ */
const week = $("#week"), blks = $$(".blk", week), nows = $$(".now-list li", week);
const weekDraw = () => {
  const r = week.getBoundingClientRect(), vh = innerHeight;
  const k = RM ? 1 : clamp((vh * .8 - r.top) / (r.height * .95));
  blks.forEach((b, i) => { const on = k > (i + 1) / 6.2; b.classList.toggle("gone", on); nows[i].classList.toggle("on", on); });
};
[...blks, ...nows].forEach(el => {
  const i = el.dataset.i;
  el.addEventListener("pointerenter", () => { blks[i].classList.add("hl"); nows[i].classList.add("hl"); });
  el.addEventListener("pointerleave", () => { blks[i].classList.remove("hl"); nows[i].classList.remove("hl"); });
});

/* ============ theory: the quote writes itself, the duty in view comes forward ============ */
const naurP = $("#naur p"), theory = $("#theory"), duties = $$("#duties li");
naurP.innerHTML = naurP.textContent.split(/(\s+)/).map(w => /\s+/.test(w) ? w : `<span class="w${/theory|insight/.test(w) ? " key" : ""}">${escT(w)}</span>`).join("");
const words = $$(".w", naurP);
const theoryDraw = () => {
  const r = theory.getBoundingClientRect(), vh = innerHeight;
  const q = RM ? 1 : clamp((vh * .75 - r.top) / (vh * .9));
  words.forEach((w, i) => w.classList.toggle("on", i / words.length < q));
  let best = -1, bd = 1e9;
  duties.forEach((d, i) => { const b = d.getBoundingClientRect(), c = b.top + b.height / 2, dd = Math.abs(c - vh * .5); if (dd < bd) { bd = dd; best = i; } });
  duties.forEach((d, i) => d.classList.toggle("on", RM || i === best));
};

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


/* ============ the record: three teams flow into one timeline ============ */
const merge = $("#merge"), mlines = $(".merge-lines", merge), teamEls = $$(".teams li", merge), recEl = $(".rec", merge);
const drawMerge = () => {
  if (innerWidth <= 900) { mlines.innerHTML = ""; return; }
  const mr = merge.getBoundingClientRect(), rr = recEl.getBoundingClientRect();
  const x1 = rr.left - mr.left, y1 = rr.top - mr.top + rr.height * .42;
  let out = "";
  teamEls.forEach((t, i) => {
    const b = t.getBoundingClientRect(), x0 = b.right - mr.left, y0 = b.top - mr.top + b.height / 2, mx = (x0 + x1) / 2;
    const d = `M${x0} ${y0} C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    out += `<path id="ml${i}" d="${d}"/>` + (RM ? "" : `<circle r="4"><animateMotion dur="2.2s" begin="${i * .6}s" repeatCount="indefinite"><mpath href="#ml${i}"/></animateMotion></circle>`);
  });
  mlines.innerHTML = out;
};
const feed = $("#feed");
const EVENTS = [
  ["", "Started", "Export invoices as PDF", "Same columns as the CSV, please.", "Billing", "Rina"],
  ["ap", "Approved", "Plan, ceiling $3.20", "Offline first, sync later.", "Mobile", "Ayu"],
  ["fx", "Fixed", "Revenue report missed refunds", "The second agent spotted it.", "Data", "Dimas"],
  ["sh", "Shipped", "Offline mode for orders", "Tested on a slow train. Works.", "Mobile", "Ayu"],
  ["sh", "Shipped", "Nightly revenue report", "Finance has it by 7 a.m.", "Data", "Rina"],
  ["", "Started", "Dark mode for the billing portal", "Customers keep asking for it.", "Billing", "Dimas"],
];
let ev = 0, feedOn = false;
const stamp = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const pushEvent = () => {
  if (!feedOn || document.hidden) return;
  const [c, tag, title, quote, team, who] = EVENTS[ev++ % EVENTS.length];
  const li = document.createElement("li"); li.className = "enter";
  li.innerHTML = `<span class="tag ${c}">${tag}</span><div><b>${title}</b><q>${quote}</q><div class="m"><em>${team}</em> ${who}, ${stamp()}</div></div>`;
  const last = feed.lastElementChild; last.classList.add("leave");
  setTimeout(() => { last.remove(); feed.prepend(li); }, 380);
};
if (!RM) { seen(feed, v => feedOn = v, .3); setInterval(pushEvent, 3400); }

/* ============ rules: each example plays when it comes into view ============ */
const spent = $("#spent");
$$(".rule").forEach(r => seen(r, v => {
  if (!v || r.classList.contains("on")) return;
  r.classList.add("on");
  if (r.dataset.k === "m") {
    if (RM) { spent.textContent = "$3.40"; return; }
    const t0 = performance.now();
    const tick = now => { const k = clamp((now - t0 - 200) / 2200); spent.textContent = "$" + (3.4 * ease(k)).toFixed(2); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
}, .35));
if (RM) $$(".rule").forEach(r => r.classList.add("on"));

/* ============ scroll + resize ============ */
let raf = 0;
const onScroll = () => { nav.classList.toggle("stuck", scrollY > 8); if (!RM) erasDraw(); narrowLit(); weekDraw(); theoryDraw(); };
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
addEventListener("resize", () => { requestAnimationFrame(() => { if (!RM) measurePin(); layout(); drawMerge(); onScroll(); }); });
const relayout = () => { if (!RM) measurePin(); layout(); drawMerge(); onScroll(); };
document.fonts && document.fonts.ready.then(relayout);
addEventListener("load", relayout);
relayout();
})();
