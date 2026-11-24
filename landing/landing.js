(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const smooth = t => t * t * (3 - 2 * t);
const seen = (el, cb, th = .25) => el && new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { threshold: th }).observe(el);
const escT = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const noop = () => {};
/* Home and Features share this file; every block runs only when its section is on the page. */
let measurePin = noop, measureWeek = noop, weekDraw = noop, measureTheory = noop, theoryDraw = noop, layout = noop, narrowLit = noop, drawMerge = noop, railDraw = noop, rulesDraw = noop, kDraw = noop, kLayout = noop;
let duties = [], rItems = [];

/* theme */
const flipTheme = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("kx-theme", r.dataset.theme); } catch (e) {}
};
$("#theme").onclick = flipTheme;
$$("[data-theme-alt]").forEach(b => b.onclick = flipTheme);
/* record on a phone: the rail fills as the teams scroll into the record */
railDraw = () => { if (innerWidth > 900 || !merge) return; const r = merge.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height * .9))); merge.style.setProperty("--railp", (RM ? 100 : p * 100).toFixed(1) + "%"); };


/* nav edge, menu closes on pick */
const nav = $("#nav");
$$(".menu-pop a").forEach(a => a.addEventListener("click", () => $(".menu").removeAttribute("open")));

/* copy the connect line */
const copyBtn = $("#copy");
if (copyBtn) copyBtn.onclick = async () => {
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
const ppBar = document.querySelector(".pin-meter i b"), wkBar = document.querySelector(".week-meter i b");
const pin = $("#heroPin"), hero = $(".hero"), sheet = $("#sheet");
if (sheet) {
const yes = $("#yes"), yesL = $("#yes-l"), lanes = $$(".lane"), cur = $("#cursor"), rc = $("#rcount"), react = $(".react", sheet);
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
  if (ppBar) ppBar.style.transform = `scaleX(${clamp(ms / TOTAL)})`;
  lastMs = ms;
};
let clock = 0, heroVisible = true, replayFrom = 0, scrollMs = 0, pinned = false, prevT = 0;
let stTop = 64, heroH = 0;
measurePin = () => {
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
  if (heroVisible || ms !== lastMs) renderHero(ms);
  requestAnimationFrame(heroFrame);
};
yes.addEventListener("click", () => { clock = Math.max(clock, YES_AT); });
$("#replay").addEventListener("click", () => { clock = 0; replayFrom = pinProgress(); });
if (RM) renderHero(TOTAL);
else { seen(hero, v => heroVisible = v, .15); measurePin(); requestAnimationFrame(heroFrame); }
}

/* ============ the same week: pinned; blocks hand off, gather on Monday morning, then a held summary ============ */
const week = $("#week");
if (week) {
const blks = $$(".blk", week), nows = $$(".now-list li", week), hback = $("#hback");
const wTrack = $("#weekTrack"), wStick = $("#weekStick");
let wTop = 64, wH = 0, wGathered = false;
measureWeek = () => {
  if (RM) return;
  wTrack.classList.remove("wpin");
  wH = wStick.offsetHeight; const air = 40;
  wTop = Math.min(64 + air, innerHeight - wH);
  wTrack.classList.toggle("wpin", wH <= innerHeight - 64 - 8);
  wTrack.style.setProperty("--wh", wH + "px"); wTrack.style.setProperty("--wt", wTop + "px");
  wGathered = false;
};
const weekProgress = () => {
  if (!wTrack.classList.contains("wpin")) { const r = week.getBoundingClientRect(); return clamp((innerHeight * .8 - r.top) / (r.height * 1.4)); }
  const r = wTrack.getBoundingClientRect(), span = wTrack.offsetHeight - wH;
  return clamp((wTop - r.top) / Math.max(1, span));
};
const gatherTargets = () => {
  // each agent chip flies to a stacked slot in Monday's first hours
  const handoff = $(".handoff", week);
  week.classList.remove("gather");
  const hb = handoff.getBoundingClientRect();
  let y = hb.top + 30, total = 0;
  blks.forEach(b => { const ag = $(".ag", b); ag.style.setProperty("--gw", (hb.width - 12) + "px"); ag.style.width = (hb.width - 12) + "px"; });
  blks.forEach((b, i) => {
    const ag = $(".ag", b); ag.style.removeProperty("--gx"); ag.style.removeProperty("--gy");
    const a = ag.getBoundingClientRect();
    ag.style.setProperty("--gx", (hb.left + 6 - a.left) + "px");
    ag.style.setProperty("--gy", (y - a.top) + "px");
    y += a.height + 4; total += a.height + 4;
  });
  blks.forEach(b => { $(".ag", b).style.width = ""; });
  const rowPx = parseFloat(getComputedStyle($(".cal-b", week)).gridTemplateRows) || 26;
  const chipH = $(".ag", blks[0]).getBoundingClientRect().height || 30;
  week.style.setProperty("--he", Math.min(17, Math.ceil((30 + total + 8) / rowPx) + 1));
  wGathered = true;
};
/* The week plays on its own once you see it: the five chores go to agents one by one and the hours count up.
   Only the hand-off (the chores gathering into one column) waits for the scroll. */
let wAuto = RM ? 1 : 0, wAutoOn = false, wLast = 0;
const weekTick = now => {
  const dt = wLast ? Math.min(64, now - wLast) : 16; wLast = now;
  const sp = weekProgress(), fast = sp > .3 ? 5 : 1;          // scrolled ahead: finish the chores quickly
  wAuto = Math.min(1, wAuto + dt * fast / 4200);
  weekDraw();
  if (wAuto < 1 && wAutoOn) requestAnimationFrame(weekTick); else wLast = 0;
};
seen(week, v => { wAutoOn = v; if (v && wAuto < 1) requestAnimationFrame(weekTick); }, .35);
weekDraw = () => {
  const sp = RM ? 1 : weekProgress();
  let hrs = 0;
  blks.forEach((b, i) => { const on = wAuto >= (i + 1) / 5 - .001; b.classList.toggle("gone", on); nows[i].classList.toggle("on", on); if (on) hrs += +b.dataset.h; });
  if (hback._v !== hrs) { hback._v = hrs; hback.textContent = (hrs % 1 ? hrs.toFixed(1) : hrs) + " h"; }
  const g = wAuto >= 1 && sp > .35;
  if (g && !week.classList.contains("gather")) { if (!wGathered) gatherTargets(); week.classList.add("gather"); }
  if (!g && week.classList.contains("gather")) week.classList.remove("gather");
  week.classList.toggle("done", g && sp > .6);
  week.classList.toggle("ready", wAuto >= 1);
  if (wkBar) wkBar.style.transform = `scaleX(${clamp(sp / .6)})`;
};
[...blks, ...nows].forEach(el => {
  const i = el.dataset.i;
  el.addEventListener("pointerenter", () => { blks[i].classList.add("hl"); nows[i].classList.add("hl"); });
  el.addEventListener("pointerleave", () => { blks[i].classList.remove("hl"); nows[i].classList.remove("hl"); });
});
}

/* ============ theory: the quote writes itself, the duty in view comes forward ============ */
/* Scroll scenes follow the scroll with a little inertia instead of jumping to it: a trackpad flick or a mouse
   wheel notch moves the target, and the scene glides there (time constant tau, frame-rate independent). */
const follow = (render, tau) => {
  let cur = null, tgt = 0, last = 0, on = false;
  const step = now => {
    const dt = last ? Math.min(64, now - last) : 16; last = now;
    cur += (tgt - cur) * (1 - Math.exp(-dt / tau));
    if (Math.abs(tgt - cur) < .0003) cur = tgt;
    render(cur);
    if (cur !== tgt) requestAnimationFrame(step); else { on = false; last = 0; }
  };
  return v => { tgt = v; if (cur === null || RM) { cur = v; render(v); return; } if (!on) { on = true; requestAnimationFrame(step); } };
};
const theory = $("#theory");
if (theory) {
const naurP = $("#naur p"), theoryL = $(".theory-l"); duties = $$("#duties li");
const naurPrev = $("#naur").previousElementSibling;
let naurGap = 0, theoryHold = 0; measureTheory = () => {
  naurGap = parseFloat(getComputedStyle($("#naur")).marginTop) || 0; theoryHold = parseFloat(getComputedStyle(theoryL, "::after").height) || 0; };
naurP.innerHTML = naurP.textContent.split(/(\s+)/).map(w => /\s+/.test(w) ? w : `<span class="w${/theory|insight/.test(w) ? " key" : ""}">${escT(w)}</span>`).join("");
const words = $$(".w", naurP);
const lightNaur = follow(q => words.forEach((w, i) => w.classList.toggle("on", i / words.length < q)), 320);
theoryDraw = () => {
  const r = theory.getBoundingClientRect(), vh = innerHeight;
  /* The quote lights word by word while it is held on screen, finishing with room to read it before it moves on. */
  const wide = innerWidth > 900;
  let q = 1;
  if (!RM && wide) q = clamp((vh * .55 - r.top) / (r.height * .42));
  else if (!RM) { const natural = naurPrev.getBoundingClientRect().bottom + naurGap; q = clamp((vh * .8 - natural) / (vh * .8 - 96 + theoryHold * .55)); }
  lightNaur(q);
  /* A duty stays lit until the next one has clearly taken the reading line (no flicker near the middle),
     so "Lead the vision." keeps the stage a little longer before the list moves on. */
  let best = 0;
  duties.forEach((d, i) => { const b = d.getBoundingClientRect(); if (i && b.top + b.height / 2 < vh * .42) best = i; });
  if (!document.documentElement.classList.contains("rvm")) duties.forEach((d, i) => d.classList.toggle("on", RM || i === best));
};
}

/* ============ THE DIORAMA: a room tour. Four rooms side by side in one isometric house (art/house.svg), joined by one strip of instructions along the back wall. The tour starts on the
   whole house, then the camera (the svg viewBox) moves into each room, holds it to be read, and moves on. ============ */
const dio = $("#dio");
if (dio) {
const world = $("#dioWorld"), label = $("#dioLabel"), dtabs = $$(".dio-tab"), dcaps = $$(".dio-cap"), dpause = $("#dioPause");
const KEYS = ["1843", "1936", "1969", "today"];
const CAMS = { all: [-134.3,  -242.1,  1007.1,  755.3], "1843": [-169.6,  -132.6,  435.7,  326.8], "1936": [45,  -61.5,  435.7,  326.8], "1969": [259.5,  9.5,  435.7,  326.8], today: [474,  80.6,  435.7,  326.8] };
const LABELS = { all: "1843 to now", "1843": "1843 · The Analytical Engine", "1936": "1936 · A tape and its rules", "1969": "1969 · Unix and C", today: "Today · A team and its agents" };
const inOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const HOLD = 7000, OVERVIEW = 3200;          // a room is held long enough to read its caption; the whole house briefly
let svg = null, cam = CAMS.all.slice(), camFrom = cam, camTo = cam, c0 = 0, cDur = 0;
let cur = -1, playing = !RM, on = false, held = false, t0 = 0;
const setView = v => { cam = v; if (svg) svg.setAttribute("viewBox", v.map(n => n.toFixed(1)).join(" ")); };
const moveTo = (to, dur) => { camFrom = cam.slice(); camTo = to; c0 = performance.now(); cDur = RM ? 0 : dur; if (!cDur) setView(to); };
/* the house is inlined once fetched, so the camera can move; until then (or without script) the picture shows the whole house */
fetch("/art/house.svg").then(r => r.ok ? r.text() : Promise.reject()).then(txt => {
  world.innerHTML = txt; svg = world.querySelector("svg");
  svg.removeAttribute("width"); svg.removeAttribute("height"); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-hidden", "true");
  show(cur, true); setView(cam);
}).catch(() => {});
let labelT;
const show = (i, quiet) => {
  const key = i < 0 ? "all" : KEYS[i];
  if (svg) {
    if (i < 0) delete svg.dataset.cur; else svg.dataset.cur = key;
    svg.querySelectorAll(".dw-room").forEach(g => g.classList.toggle("on", g.dataset.room === key));
  }
  if (quiet) return;
  dtabs.forEach((b, k) => { b.setAttribute("aria-selected", k === i); b.tabIndex = k === (i < 0 ? 0 : i) ? 0 : -1; b.style.setProperty("--f", 0); });
  dcaps.forEach(c => c.classList.toggle("cur", c.dataset.k === (i < 0 ? "all" : String(i))));
  clearTimeout(labelT); label.classList.add("swap");
  labelT = setTimeout(() => { label.textContent = LABELS[key]; label.classList.remove("swap"); }, RM ? 0 : 260);
};
const go = (i, focus) => {
  const from = cur; cur = i; t0 = 0;
  show(i);
  const far = from < 0 || i < 0;            // zooming in or out takes a little longer than walking next door
  moveTo(CAMS[i < 0 ? "all" : KEYS[i]], far ? 1900 : 1500 + Math.max(0, Math.abs(i - from) - 1) * 400);
  if (focus) dtabs[i].focus();
};
const setPlaying = v => { playing = v; dio.classList.toggle("paused", !v); dpause.setAttribute("aria-pressed", !v); dpause.setAttribute("aria-label", v ? "Pause the tour" : "Play the tour"); t0 = 0; };
const frame = now => {
  if (cDur) {
    const k = Math.min(1, (now - c0) / cDur), e = inOut(k);
    setView(camFrom.map((a, j) => a + (camTo[j] - a) * e));
    if (k >= 1) cDur = 0;
  } else if (on && playing) {
    if (!t0) t0 = now;
    const el = now - t0, hold = cur < 0 ? OVERVIEW : HOLD;
    if (cur >= 0) dtabs[cur].style.setProperty("--f", Math.min(1, el / hold).toFixed(3));
    if (el > hold && !held) go(cur === KEYS.length - 1 ? -1 : cur + 1);
  }
  requestAnimationFrame(frame);
};
dtabs.forEach((b, i) => {
  b.addEventListener("click", () => go(i));
  b.addEventListener("keydown", e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault(); go(((cur < 0 ? 0 : cur) + d + KEYS.length) % KEYS.length, true); });
});
dpause.addEventListener("click", () => setPlaying(!playing));
/* reading a room holds the tour there; it moves on again when the pointer or focus leaves */
dio.addEventListener("pointerenter", () => held = true); dio.addEventListener("pointerleave", () => held = false);
dio.parentElement.addEventListener("focusin", () => held = true); dio.parentElement.addEventListener("focusout", () => held = false);
if (RM) { playing = false; dpause.hidden = true; }
show(-1);
seen(dio, v => { on = v; if (v) t0 = 0; }, .2);
requestAnimationFrame(frame);
}

/* ============ the loop: a note travels the line, out past the yes and back ============ */
const loop = $("#loop");
if (loop) {
const steps = $$(".step", loop), NS = "http://www.w3.org/2000/svg";
let svg, base, tok, halo, len = 0, wide = false, segs = [], loopOn = false;
layout = () => {
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
narrowLit = () => { if (wide) return; const vh = innerHeight; steps.forEach(s => s.classList.toggle("lit", RM || s.getBoundingClientRect().top < vh * .7)); };
seen(loop, v => { loopOn = v; if (!v) lt0 = 0; }, .2);
if (RM) steps.forEach(s => s.classList.add("lit"));
requestAnimationFrame(loopFrame);
}


/* ============ the record: three teams flow into one timeline ============ */
const merge = $("#merge");
if (merge) {
const mlines = $(".merge-lines", merge), teamEls = $$(".teams li", merge), recEl = $(".rec", merge);
drawMerge = () => {
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
  ["", "Started", "Export invoices as PDF", "Same columns as the CSV, please.", "Billing", "Rachel"],
  ["ap", "Approved", "Plan, ceiling $3.20", "Offline first, sync later.", "Mobile", "Anna"],
  ["fx", "Fixed", "Revenue report missed refunds", "The second agent spotted it.", "Data", "Daniel"],
  ["sh", "Shipped", "Offline mode for orders", "Tested on a slow train. Works.", "Mobile", "Anna"],
  ["sh", "Shipped", "Nightly revenue report", "Finance has it by 7 a.m.", "Data", "Rachel"],
  ["", "Started", "Dark mode for the billing portal", "Customers keep asking for it.", "Billing", "Daniel"],
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
}

/* ============ rules: the item in view drives the example on the left ============ */
const spent = $("#spent"); rItems = $$("#rlist > li"); const rVis = $$(".rstage .rule");
let rCur = -1, spentRun = false;
const runSpent = () => {
  if (spentRun) return; spentRun = true;
  if (RM) { spent.textContent = "$3.40"; return; }
  const t0 = performance.now();
  const tick = now => { const k = clamp((now - t0 - 200) / 2200); spent.textContent = "$" + (3.4 * ease(k)).toFixed(2); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};
rulesDraw = () => {
  const vh = innerHeight; let best = 0, bd = 1e9;
  rItems.forEach((li, i) => { const b = li.getBoundingClientRect(), c = b.top + Math.min(b.height, 260) / 2, d = Math.abs(c - vh * .45); if (d < bd) { bd = d; best = i; } });
  if (best === rCur) return; rCur = best;
  rItems.forEach((li, i) => li.classList.toggle("on", i === best));
  rVis.forEach((v, i) => { v.classList.toggle("show", i === best); if (i === best) v.classList.add("on"); });
  if (rVis[best] && rVis[best].dataset.k === "m") runSpent();
};
/* Phones: each rule arrives on its own as it scrolls in (no pinned stage there). */
if (!RM && "IntersectionObserver" in window && matchMedia("(max-width:900px)").matches && (rItems.length || duties.length)) {
  document.documentElement.classList.add("rvm");
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); const mb = e.target.querySelector(".rule-v.inline .meter-l b"); if (mb) { const t0 = performance.now(); const tick = now => { const k = clamp((now - t0 - 700) / 1200); mb.textContent = "$" + (3.4 * ease(k)).toFixed(2); if (k < 1) requestAnimationFrame(tick); }; mb.textContent = "$0.00"; requestAnimationFrame(tick); } } }), { rootMargin: "0px 0px -18% 0px" });
  rItems.forEach(li => rio.observe(li));
  /* the four duties and the record's pieces arrive the same way */
  const aio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in", "on"); aio.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
  [...duties, ...$$(".teams li"), $(".merge-cap"), $(".rec")].forEach(el => el && aio.observe(el));
}
if (RM && spent) { rItems.forEach(li => li.classList.add("on")); rVis.forEach(v => v.classList.add("on", "show")); spent.textContent = "$3.40"; }

/* ============ four kinds of session: scroll moves across the tabs ============ */
const KINDS = [
  { h: "Project Management", p: "A requirement becomes milestones, sprints, and tickets. Each ticket becomes a plan.",
    s: [["p", "i-note", "Requirement", "Billing exports for Finance"], ["a", "i-layers", "Milestones and sprints", "2 milestones, 3 sprints"], ["a", "i-ticket", "Tickets", "9 tickets"], ["a", "i-note", "A plan per ticket", "Each with a ceiling"], ["y", "", "Yes", ""]] },
  { h: "Engineering", p: "A plan, your yes, tested pull requests, and a receipt.",
    s: [["p", "i-note", "Note", "Invoices: export to CSV"], ["a", "i-note", "Plan", "4 steps, ceiling $6.00"], ["y", "", "Yes", ""], ["a", "i-pr", "Tested pull requests", "#318, #319, 18 tests"], ["p", "i-receipt", "Receipt", "You accept it"]] },
  { h: "QA", p: "A browser agent clicks through what shipped and reports only what it ran.",
    s: [["p", "i-check", "What shipped", "CSV export for Finance"], ["a", "i-pointer", "Browser agent", "Opens /invoices, clicks Export CSV"], ["p", "i-receipt", "Report", "Only what it ran: 3 steps"]] },
  { h: "Ops", p: "The agent watches logs and alerts, opens the issue, and works the fix.",
    s: [["a", "i-pulse", "Watches", "Logs and alerts"], ["a", "i-alert", "Opens the issue", "Export times out past 5,000 rows"], ["a", "i-hammer", "Works the fix", "A plan with a ceiling"], ["y", "", "Yes", ""], ["a", "i-pr", "Fix shipped", "Tested pull request"]] },
];
const ktrack = $("#ktrack");
if (ktrack) {
const ktabs = $$("#ktabs [role=tab]"), kdia = $("#kdia"), kpH = $("#kp-h"), kpP = $("#kp-p"), kpan = $("#kp");
let kCur = -1, kSteps = [], kTok = null, kFlow = null;

const kShow = i => {
  if (i === kCur) return; kCur = i;
  ktabs.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; });
  kpan.setAttribute("aria-labelledby", ktabs[i].id);
  const k = KINDS[i];
  kpH.textContent = k.h; kpP.textContent = k.p;
  [kpH, kpP].forEach(e => { e.style.animation = "none"; void e.offsetWidth; e.style.animation = ""; });
  const who = { p: "You", a: "Agent", y: "You" };
  kdia.innerHTML = `<div class="kflow" style="--n:${k.s.length}"><span class="ktrack" aria-hidden="true"><i class="ktok"></i></span><ol class="ksteps">${k.s.map(([side, ic, t, d], n) =>
    `<li class="kst ${side}" style="--k:${n}"><span class="kdot">${side === "y" ? "Yes" : `<svg class="ico"><use href="#${ic}"/></svg>`}</span><span class="klab"><em>${who[side]}</em><b>${escT(t)}</b>${d ? `<small>${escT(d)}</small>` : ""}</span></li>`).join("")}</ol></div>`;
  kFlow = $(".kflow", kdia); kTok = $(".ktok", kdia); kSteps = $$(".kst", kdia); kt0 = 0;
};
const kTrackP = () => { const r = ktrack.getBoundingClientRect(), span = ktrack.offsetHeight - (innerHeight - 64); return clamp((64 - r.top) / Math.max(1, span)); };
kDraw = () => {
  if (RM) return;
  const p = kTrackP(), pos = p * KINDS.length * .999, i = Math.min(KINDS.length - 1, Math.floor(pos));
  ktabs.forEach((b, j) => $("b", b).style.setProperty("--f", j < i ? 1 : j > i ? 0 : pos - i));
  kShow(i);
};
ktabs.forEach((b, i) => {
  b.addEventListener("click", () => {
    if (RM) { kShow(i); return; }
    const top = ktrack.getBoundingClientRect().top + scrollY - 64, span = ktrack.offsetHeight - (innerHeight - 64);
    scrollTo({ top: top + span * (i + .5) / KINDS.length, behavior: "smooth" });
  });
  b.addEventListener("keydown", e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault();
    const n = (i + d + ktabs.length) % ktabs.length; ktabs[n].focus(); ktabs[n].click();
  });
});
let kt0 = 0, kOn = false;
seen(ktrack, v => kOn = v, 0);
const kFrame = now => {
  if (kOn && !RM && kFlow) {
    if (!kt0) kt0 = now;
    const n = kSteps.length, T = 1300 * n, f = ((now - kt0) % (T + 1000)) / T, p = smooth(clamp(f));
    (kFlow.querySelector(".ktrack") || kFlow).style.setProperty("--tp", p);
    const at = p * (n - 1);
    kSteps.forEach((s, j) => { s.classList.toggle("hot", f <= 1 && Math.abs(at - j) < .22); s.classList.toggle("past", f <= 1 && at > j + .2); });
  }
  requestAnimationFrame(kFrame);
};
kShow(0); requestAnimationFrame(kFrame);
}


/* ============ parallax: layers drift at their own speed as they pass ============ */
const pxEls = RM ? [] : $$("[data-px]").map(el => [el, +el.dataset.px]);
const pxDraw = () => {
  const vh = innerHeight;
  for (const [el, k] of pxEls) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) continue;
    const off = (r.top + r.height / 2 - vh / 2) - (el._py || 0);
    const y = -off * k; el._py = y;
    el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
  }
};
/* the note sheet leans toward the pointer */
if (!RM && matchMedia("(pointer:fine)").matches && $("#sheet")) {
  const sh = $("#sheet");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    sh.style.transform = `perspective(1200px) rotateY(${(x * 4).toFixed(2)}deg) rotateX(${(-y * 3).toFixed(2)}deg)`;
  });
  hero.addEventListener("pointerleave", () => { sh.style.transform = ""; });
}

/* ============ section transitions: each section's content rises in, moss bands lift as they arrive ============ */
const rises = RM ? [] : $$("[data-rise]").map(sec => [sec, $(":scope > .wrap", sec), sec.classList.contains("moss")]);
const riseDraw = () => {
  const vh = innerHeight;
  for (const [sec, wrap, moss] of rises) {
    const r = sec.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) continue;
    const enter = clamp((vh - r.top) / (vh * .75));        // 0 when the top touches the fold, 1 well inside
    const leave = clamp((-r.bottom + vh * .55) / (vh * .55)); // starts as the bottom passes the upper half
    if (wrap) wrap.style.transform = `translate3d(0,${((1 - ease(enter)) * 90 - leave * 40).toFixed(1)}px,0)`;
    if (moss) sec.classList.toggle("flat", enter > .55);
  }
};

/* ============ scroll + resize ============ */
let raf = 0;
/* Each scroll scene only runs while its section is near the screen. Section extents are measured once per layout
   (not every frame), so a frame no longer reads layout for scenes far away; that read-write churn is what made
   scrolling stutter on phones. */
const ZONES = [["#week-sec", () => weekDraw()], ["#theory", () => theoryDraw()],
  ["#workflow", () => narrowLit()], ["#record", () => railDraw()], ["#rules", () => rulesDraw()], ["#sessions", () => kDraw()]]
  .map(([sel, fn]) => ({ el: document.querySelector(sel), fn, top: 0, bot: 0 })).filter(z => z.el);
const measureZones = () => ZONES.forEach(z => { const r = z.el.getBoundingClientRect(); z.top = r.top + scrollY; z.bot = r.bottom + scrollY; });
const onScroll = () => {
  const y = scrollY, vh = innerHeight;
  nav.classList.toggle("stuck", y > 8);
  for (const z of ZONES) if (y + vh * 1.6 > z.top && y - vh * .6 < z.bot) z.fn();
  pxDraw(); riseDraw();
};
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
addEventListener("resize", () => { requestAnimationFrame(relayout); });
const relayout = () => { if (!RM) { measurePin(); measureWeek(); } layout(); drawMerge(); kLayout(); measureTheory(); measureZones(); ZONES.forEach(z => z.fn()); onScroll(); };
document.fonts && document.fonts.ready.then(relayout);
addEventListener("load", relayout);
relayout();
/* close: strike the old habits once the section is on screen */
{ const c = $(".close"); if (c) { let done = false; seen(c, v => { if (v && !done) { done = true; c.classList.add("in"); } }, .12); } }
})();

