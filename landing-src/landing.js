(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const OUT = "cubic-bezier(.16,1,.3,1)", INOUT = "cubic-bezier(.65,0,.35,1)", IN = "cubic-bezier(.55,0,1,.45)";

/* Cancellable timing: every scene gets a run token; when the visitor moves on, the old run stops at its next wait. */
class Stop extends Error {}
const run = () => ({ alive: true });
const wait = (tok, ms) => new Promise((res, rej) => { if (!tok.alive) return rej(new Stop()); setTimeout(() => tok.alive ? res() : rej(new Stop()), ms); });
const anim = (tok, el, kf, o) => { if (!tok.alive) return Promise.reject(new Stop()); const a = el.animate(kf, { fill: "forwards", easing: OUT, ...o }); return a.finished.then(() => { if (!tok.alive) throw new Stop(); }, () => { throw new Stop(); }); };
/* Positions inside a host, in the host's own units (scenes are scaled boards, so screen pixels are divided back out). */
const rel = (el, host) => { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(), k = host.offsetWidth ? b.width / host.offsetWidth : 1; return { x: (a.left - b.left) / k, y: (a.top - b.top) / k, w: a.width / k, h: a.height / k }; };

/* ---------- nav, theme, copy, menu ---------- */
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), { passive: true });
$("#theme").onclick = () => { const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; try { localStorage.setItem("kx-lp-theme", r.dataset.theme); } catch (e) {} };
try { const t = localStorage.getItem("kx-lp-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
const mb = $("#menuBtn"), dr = $("#drawer");
mb.onclick = () => { const o = !dr.classList.contains("open"); dr.classList.toggle("open", o); mb.setAttribute("aria-expanded", o); mb.setAttribute("aria-label", o ? "Close menu" : "Open menu"); };
$$("a", dr).forEach(a => a.addEventListener("click", () => { dr.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); }));
$("#copyBtn").onclick = async () => {
  const t = $("#cline").textContent, st = $("#copyStatus"), b = $("#copyBtn");
  try { await navigator.clipboard.writeText(t); } catch (e) { const r = document.createRange(); r.selectNodeContents($("#cline")); getSelection().removeAllRanges(); getSelection().addRange(r); }
  b.textContent = "Copied"; st.textContent = "Copied. Paste it into your agent; it follows the link and connects this computer.";
  setTimeout(() => { b.textContent = "Copy"; st.textContent = "Your agent follows the link and connects this computer."; }, 2400);
};

/* ---------- reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
$$(".rv").forEach(el => RM ? el.classList.add("in") : io.observe(el));

/* ---------- "Gone": each old ritual gets struck through, one after another ---------- */
const gone = $("#gone");
new IntersectionObserver((es, o) => es.forEach(e => { if (!e.isIntersecting) return; o.disconnect();
  $$(".it", gone).forEach((it, i) => RM ? it.classList.add("x") : setTimeout(() => it.classList.add("x"), 350 + i * 260)); }), { threshold: .6 }).observe(gone);

/* =================================================================
   HERO: four rooms, one job. Each room shows the instruction of its
   era being carried out: Note G drives the engine, a rule table drives
   the tape, source code is written then run by someone else, and a
   plain note is discussed, approved and built by agents.
   ================================================================= */
const ROOMS = [
  { label: "1843 · The Analytical Engine", yr: "1843", t: "Ada Lovelace writes the first program.", p: "For Charles Babbage’s Analytical Engine, a machine that was never built. Her Note G sets out, step by step, how it would compute Bernoulli numbers." },
  { label: "1936 · A tape and its rules", yr: "1936", t: "Alan Turing turns computing into an idea.", p: "A tape, a head that reads and writes, and a table of rules. Turing showed this one simple machine can carry out any calculation that can be written as steps." },
  { label: "1969 · Unix and C", yr: "1969", t: "Unix and C make software a team sport.", p: "At Bell Labs, from 1969 to 1972: an operating system and a language people could read and share. Code starts to outlive its authors, and teams build it together." },
  { label: "Today · A team and its agents", yr: "Today", t: "People decide, and agents build in the background.", p: "Each person brings their own view to one note: a comment, a doubt, a yes. The agents follow the discussion and build what the team agreed on, on the team’s own computers." },
];
const scenes = $$(".scene"), stageLabel = $("#stageLabel"), stage = $("#stage");
const fit = () => { const k = Math.min(stage.clientWidth / 600, (stage.clientHeight - 40) / 410); stage.style.setProperty("--k", k); $$(".scene-in", stage).forEach(s => s.style.left = (stage.clientWidth - 600 * k) / 2 + "px"); };
new ResizeObserver(fit).observe(stage); fit();
const rooms = $$(".tl .room"), playBtn = $("#playBtn");

/* --- 1843 --- */
const G = [
  ["1", "×", "¹V₂ × ¹V₃", "= 2n"], ["2", "−", "¹V₄ − ¹V₁", "= 2n − 1"], ["3", "+", "¹V₅ + ¹V₁", "= 2n + 1"],
  ["4", "÷", "²V₅ ÷ ²V₄", "= (2n−1)÷(2n+1)"], ["5", "÷", "¹V₁₁ ÷ ¹V₂", "= ½ · …"], ["6", "−", "⁰V₁₃ − ²V₁₁", "= A₀"],
];
const g43 = $("#g43");
g43.innerHTML = G.map(r => `<div class="row" style="display:contents">${r.map((c, k) => `<span class="${k > 1 ? "" : "ink3"}"><span class="w">${c}</span></span>`).join("")}</div>`).join("");
const wheels = $$(".s43 .wheel");
$$(".s43 .cl").forEach((c, k) => c.textContent = ["V₁–V₄", "V₅–V₈", "V₁₁–V₁₄"][k]);
wheels.forEach(w => { w.querySelector(".digits").innerHTML = Array.from({ length: 10 }, (_, d) => `<span>${d}</span>`).join(""); });
const setWheel = (w, d, ms, tok) => { const h = 31;
  const el = w.querySelector(".digits"); if (!ms) { el.style.transform = `translateY(${-d * h}px)`; return Promise.resolve(); }
  return anim(tok, el, [{ transform: getComputedStyle(el).transform === "none" ? "translateY(0)" : getComputedStyle(el).transform }, { transform: `translateY(${-d * h}px)` }], { duration: ms, easing: "cubic-bezier(.3,1.35,.5,1)" }); };
const DIG = [[2, 0, 0, 4], [1, 7, 3, 0], [3, 1, 0, 9], [0, 6, 4, 2], [5, 2, 8, 1], [3, 0, 3, 0]];
function reset43() {
  $$(".s43 .row > span").forEach(s => { s.getAnimations().forEach(a => a.cancel()); s.style.opacity = 0; s.querySelector(".w").getAnimations().forEach(a => a.cancel()); s.querySelector(".w").style.clipPath = "inset(0 100% 0 0)"; });
  wheels.forEach(w => { w.classList.remove("lit"); w.querySelector(".digits").getAnimations().forEach(a => a.cancel()); setWheel(w, 0); });
  const r = $("#r43"); r.getAnimations().forEach(a => a.cancel()); r.style.opacity = 0; $("#quill").getAnimations().forEach(a => a.cancel()); $("#quill").style.opacity = 0;
}
function final43() { $$(".s43 .row > span").forEach(s => { s.style.opacity = 1; s.querySelector(".w").style.clipPath = "none"; }); DIG[5].forEach((d, k) => [0, 1, 2].forEach(c => setWheel(wheels[c * 4 + k], DIG[2 + c][k]))); $("#r43").style.opacity = 1; }
async function play43(tok) {
  const host = $(".s43 .scene-in"), quill = $("#quill"), rows = $$(".s43 .row");
  quill.style.opacity = 1;
  for (let i = 0; i < rows.length; i++) {
    const cells = $$(":scope > span", rows[i]);
    for (const c of cells) {
      const w = c.querySelector(".w"); c.style.opacity = 1;
      const r = rel(w, host), dur = 160 + w.textContent.length * 34;
      quill.animate([{ transform: `translate(${r.x - 4}px,${r.y - 22}px)` }, { transform: `translate(${r.x + r.w - 4}px,${r.y - 22}px)` }], { duration: dur, fill: "forwards", easing: "linear" });
      await anim(tok, w, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], { duration: dur, easing: "linear" });
    }
    /* the engine answers: one column turns, its wheels settle on new figures */
    const col = i % 3, set = wheels.slice(col * 4, col * 4 + 4);
    set.forEach(w => w.classList.add("lit"));
    await Promise.all(set.map((w, k) => setWheel(w, DIG[i][k], 520 + k * 90, tok)));
    await wait(tok, 140); set.forEach(w => w.classList.remove("lit"));
  }
  quill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
  await anim(tok, $("#r43"), [{ opacity: 0, transform: "translateY(6px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 600 });
  await wait(tok, 1800);
}

/* --- 1936: a correct little machine — it inverts every bit, then halts on a blank --- */
const TAPE = ["_", "_", "0", "1", "1", "0", "1", "0", "_", "_", "_"], START = 2;
const tapeEl = $("#tape");
let tapeCells = [];
function build36() { tapeEl.innerHTML = TAPE.map(s => `<div class="cell"><b>${s === "_" ? "" : s}</b></div>`).join(""); tapeCells = $$(".cell", tapeEl); }
build36();
const cellX = i => -(tapeCells[i].offsetLeft + tapeCells[i].offsetWidth / 2);
function reset36() { tapeEl.getAnimations().forEach(a => a.cancel()); build36(); tapeEl.style.transform = `translateX(${cellX(START)}px)`; $$(".s36 .rule").forEach(r => r.classList.remove("lit")); const h = $("#halt"); h.getAnimations().forEach(a => a.cancel()); h.style.opacity = 0; $("#hst").textContent = "q1"; }
function final36() { reset36(); TAPE.forEach((s, i) => { if (s === "0" || s === "1") tapeCells[i].querySelector("b").textContent = s === "0" ? "1" : "0"; }); tapeEl.style.transform = `translateX(${cellX(8)}px)`; $('.s36 .rule[data-r="2"]').classList.add("lit"); $("#halt").style.opacity = 1; $("#hst").textContent = "halt"; }
async function play36(tok) {
  let pos = START;
  await wait(tok, 500);
  while (TAPE[pos] !== "_") {
    const sym = tapeCells[pos].querySelector("b").textContent, rule = sym === "0" ? 0 : 1;
    $$(".s36 .rule").forEach(r => r.classList.toggle("lit", +r.dataset.r === rule));
    await wait(tok, 380);
    /* write: the old symbol lifts away, the new one drops in */
    const b = tapeCells[pos].querySelector("b");
    await anim(tok, b, [{ transform: "none", opacity: 1 }, { transform: "translateY(-14px)", opacity: 0 }], { duration: 180, easing: IN, fill: "none" });
    b.textContent = sym === "0" ? "1" : "0";
    await anim(tok, b, [{ transform: "translateY(14px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 280, fill: "none" });
    /* move right: the tape slides under a fixed head */
    const from = cellX(pos); pos++;
    await anim(tok, tapeEl, [{ transform: `translateX(${from}px)` }, { transform: `translateX(${cellX(pos)}px)` }], { duration: 420, easing: INOUT });
  }
  $$(".s36 .rule").forEach(r => r.classList.toggle("lit", r.dataset.r === "2"));
  $("#hst").textContent = "halt";
  await anim(tok, $("#halt"), [{ opacity: 0, transform: "translate(-50%,8px)" }, { opacity: 1, transform: "translate(-50%,0)" }], { duration: 500 });
  await wait(tok, 2000);
}

/* --- 1969: written in one place, run by someone else --- */
const CODE = 'main() {\n        printf("hello, world\\n");\n}', SH = [["$ ", "cc hello.c"], ["$ ", "a.out"]];
const codeEl = $("#code"), shEl = $("#sh"), fileEl = $("#file");
const cur = '<span class="c"></span>';
function reset69() { codeEl.innerHTML = cur; shEl.innerHTML = '<span class="p">$ </span>' + cur; fileEl.getAnimations().forEach(a => a.cancel()); fileEl.style.opacity = 0; }
const escH = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function final69() { codeEl.innerHTML = escH(CODE); shEl.innerHTML = '<span class="p">$ </span>cc hello.c\n<span class="p">$ </span>a.out\nhello, world\n<span class="p">$ </span>' + cur; }
async function type(tok, el, prefix, text, speed = 34) {
  for (let i = 1; i <= text.length; i++) { el.innerHTML = prefix + escH(text.slice(0, i)) + cur; await wait(tok, text[i - 1] === "\n" ? 260 : speed + (Math.random() * 30 | 0)); }
}
async function play69(tok) {
  await wait(tok, 400);
  await type(tok, codeEl, "", CODE, 30);
  codeEl.innerHTML = escH(CODE) + cur;
  await wait(tok, 500);
  /* the file travels from one terminal to the other, on an arc */
  const host = $(".s69 .scene-in"), a = rel($(".s69 .t1"), host), b = rel($(".s69 .t2"), host), f = rel(fileEl, host);
  const sx = a.x + a.w * .45 - f.x, sy = a.y + a.h * .55 - f.y, ex = b.x + b.w * .35 - f.x, ey = b.y + 18 - f.y;
  await anim(tok, fileEl, [
    { opacity: 0, transform: `translate(${sx}px,${sy}px) scale(.9)` },
    { opacity: 1, transform: `translate(${sx}px,${sy - 8}px) scale(1)`, offset: .15 },
    { opacity: 1, transform: `translate(${(sx + ex) / 2}px,${Math.min(sy, ey) - 36}px) rotate(-4deg)`, offset: .55 },
    { opacity: 1, transform: `translate(${ex}px,${ey}px) rotate(0)`, offset: .9 },
    { opacity: 0, transform: `translate(${ex}px,${ey + 6}px) scale(.94)` }], { duration: 1500, easing: INOUT });
  let done = "";
  for (const [p, cmd] of SH) {
    await type(tok, shEl, done + '<span class="p">' + p + "</span>", cmd, 60);
    await wait(tok, 380); done += '<span class="p">' + p + "</span>" + cmd + "\n";
  }
  done += "hello, world\n"; shEl.innerHTML = done + '<span class="p">$ </span>' + cur;
  await wait(tok, 2400);
}

/* --- Today: a note, a discussion, a yes, and agents at work --- */
function resetNow() {
  $$(".sNow .cm, .sNow .re .chip, .sNow .yes, #run, .sNow .done, #cur").forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = 0; });
  $$("#agents li").forEach(l => l.classList.remove("lit")); $$("#run .steps i").forEach(i => i.style.setProperty("--p", 0));
  const y = $(".sNow .yes .btn"); y.textContent = "Yes, run the plan"; y.getAnimations().forEach(a => a.cancel());
}
function finalNow() { $$(".sNow .cm, .sNow .re .chip, .sNow .yes, #run, .sNow .done").forEach(e => e.style.opacity = 1); $$("#agents li").slice(0, 2).forEach(l => l.classList.add("lit")); $$("#run .steps i").forEach(i => i.style.setProperty("--p", 1)); $(".sNow .yes .btn").textContent = "Approved"; }
const fill = (tok, i, ms) => { const s = performance.now(); return new Promise((res, rej) => { const f = t => { if (!tok.alive) return rej(new Stop()); const k = Math.min(1, (t - s) / ms), e = 1 - Math.pow(1 - k, 3); i.style.setProperty("--p", e); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); }); };
async function playNow(tok) {
  const host = $(".sNow .scene-in");
  await wait(tok, 500);
  for (const c of $$(".sNow .cm")) { await anim(tok, c, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 520 }); await wait(tok, 380); }
  for (const c of $$(".sNow .re .chip")) { await anim(tok, c, [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1.08)", offset: .7 }, { opacity: 1, transform: "scale(1)" }], { duration: 420 }); }
  await anim(tok, $(".sNow .yes"), [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 480 });
  /* a person, not an agent, presses yes */
  const yb = $(".sNow .yes .btn"), t = rel(yb, host), c = $("#cur");
  await anim(tok, c, [{ opacity: 0, transform: `translate(${600 * .55}px,${410 * .9}px)` }, { opacity: 1, transform: `translate(${t.x + t.w * .6}px,${t.y + t.h * .55}px)` }], { duration: 900, easing: INOUT });
  await anim(tok, yb, [{ transform: "scale(1)" }, { transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 260, fill: "none" });
  yb.textContent = "Approved";
  c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards", delay: 300 });
  const ag = $$("#agents li");
  ag[0].classList.add("lit"); await wait(tok, 260); ag[1].classList.add("lit");
  await anim(tok, $("#run"), [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 520 });
  for (const i of $$("#run .steps i")) await fill(tok, i, 760);
  await anim(tok, $(".sNow .done"), [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 480 });
  await wait(tok, 2400);
}

const SCN = [[reset43, play43, final43], [reset36, play36, final36], [reset69, play69, final69], [resetNow, playNow, finalNow]];
let cur_ = -1, tok = run(), auto = !RM, inView = false, fillAnim = null;
const EST = [10500, 9800, 11000, 10500];
function setPlayBtn() { playBtn.setAttribute("aria-label", auto ? "Pause the tour" : "Play the tour"); playBtn.innerHTML = auto ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>'; }
async function go(i, user) {
  tok.alive = false; tok = run(); const my = tok;
  const prev = cur_; cur_ = i;
  rooms.forEach((b, k) => { b.setAttribute("aria-pressed", k === i); const f = b.querySelector(".fill"); f.getAnimations().forEach(a => a.cancel()); f.style.transform = k < i && auto ? "scaleX(1)" : "scaleX(0)"; });
  stageLabel.textContent = ROOMS[i].label;
  $("#capYr").textContent = ROOMS[i].yr; $("#capT").textContent = ROOMS[i].t; $("#capP").textContent = ROOMS[i].p;
  SCN[i][0]();
  const inc = scenes[i], out = prev >= 0 && prev !== i ? scenes[prev] : null;
  if (RM) { scenes.forEach(s => s.classList.toggle("on", s === inc)); SCN[i][2](); return; }
  inc.classList.add("on");
  if (out) out.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${i > prev ? -28 : 28}px)` }], { duration: 420, easing: OUT, fill: "forwards" }).finished.then(() => { if (cur_ !== prev) { out.classList.remove("on"); out.getAnimations().forEach(a => a.cancel()); } }).catch(() => {});
  inc.getAnimations().forEach(a => a.cancel());
  inc.animate([{ opacity: 0, transform: `translateX(${prev < 0 || i > prev ? 28 : -28}px)` }, { opacity: 1, transform: "none" }], { duration: 620, easing: OUT, delay: out ? 120 : 0, fill: "backwards" });
  scenes.forEach(s => { if (s !== inc && s !== out) s.classList.remove("on"); });
  if (auto) { const f = rooms[i].querySelector(".fill"); fillAnim = f.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: EST[i], easing: "linear", fill: "forwards" }); if (!inView) fillAnim.pause(); }
  try {
    if (!inView) await new Promise(r => { const c = setInterval(() => { if (inView || !my.alive) { clearInterval(c); r(); } }, 200); });
    await SCN[i][1](my);
    if (auto && my.alive) go((i + 1) % SCN.length);
  } catch (e) { if (!(e instanceof Stop)) console.error(e); }
}
rooms.forEach((b, k) => b.onclick = () => { auto = false; setPlayBtn(); go(k, true); });
playBtn.onclick = () => { auto = !auto; setPlayBtn(); if (auto) go((cur_ + 1) % SCN.length); else { fillAnim?.cancel(); } };
if (RM) { playBtn.hidden = true; }
setPlayBtn();
new IntersectionObserver(es => es.forEach(e => { inView = e.isIntersecting; if (fillAnim) inView ? fillAnim.play() : fillAnim.pause(); })).observe(stage);
go(0);

/* =================================================================
   HOW IT WORKS: signals fall through the waterline into the session;
   the plan and the result rise back up to the people.
   ================================================================= */
const water = $("#water"), log = $("#log"), loopBtns = $$("#loop button");
const sig = n => $(`.sig[data-s="${n}"]`);
const L = (cls, t) => ({ cls, t });
const STEPS = [
  [["down", "note", [L("dim", "> session open · waiting for signals"), L("hi", "> read the note · 3 paragraphs")]], ["down", "comment", [L("hi", "> comment folded into the plan")]], ["down", "reaction", [L("hi", "> reaction noted · priority up")]]],
  [["log", [L("dim", "› plan.write — scope, risks, tests"), L("ok", "✓ ceiling quoted · 25 min")]], ["up", "Plan · ceiling 25 min"]],
  [["down", "yes", [L("ok", "✓ yes recorded · authority granted")]]],
  [["log", [L("hi", "› build on branch kx/invoice-csv"), L("dim", "› second agent reviewing"), L("ok", "✓ review passed · 0 blocking")]]],
  [["log", [L("hi", "› browser run · 12 steps in a real browser"), L("ok", "✓ screenshots kept with the run")]], ["down", "reply", [L("hi", "> reply read · answered in the thread")]]],
  [["up", "2 pull requests · receipt"], ["down", "accept", [L("ok", "✓ accepted · receipt written to the record")]]],
];
let wtok = run(), wstep = -1, wauto = !RM, winView = false, wbar = null;
function addLine(l, instant) {
  const d = document.createElement("div"); d.className = l.cls; d.textContent = l.t; log.append(d);
  while (log.children.length > 9) log.firstElementChild.remove();
  if (!instant && !RM) { d.animate([{ clipPath: "inset(0 100% 0 0)", opacity: .4 }, { clipPath: "inset(0 0 0 0)", opacity: 1 }], { duration: Math.min(900, 180 + l.t.length * 14), easing: `steps(${Math.min(40, l.t.length)})` }); }
}
const WL = () => water.clientHeight * .44;
async function drop(tok, name) {
  const s = sig(name); s.classList.add("lit");
  const r = rel(s, water), x = r.x + r.w / 2, y0 = r.y + r.h, sess = rel($(".session"), water);
  const d = document.createElement("span"); d.className = "drop"; water.append(d);
  const wl = WL(), y1 = sess.y + 20;
  try {
    await anim(tok, d, [{ transform: `translate(${x - 4}px,${y0}px) scale(.4)`, opacity: 0 }, { transform: `translate(${x - 4}px,${y0 + 6}px) scale(1)`, opacity: 1, offset: .12 }, { transform: `translate(${x - 4}px,${wl - 4}px) scale(1,1.25)`, opacity: 1 }], { duration: 620, easing: IN });
    ripple(x, wl);
    const sx = Math.min(Math.max(x, sess.x + 30), sess.x + sess.w - 30);
    await anim(tok, d, [{ transform: `translate(${x - 4}px,${wl - 4}px)`, opacity: 1 }, { transform: `translate(${sx - 4}px,${y1}px) scale(.7)`, opacity: 0 }], { duration: 520, easing: OUT });
  } finally { d.remove(); setTimeout(() => s.classList.remove("lit"), 500); }
}
function ripple(x, y) { for (let k = 0; k < 2; k++) { const r = document.createElement("span"); r.className = "ring"; water.append(r); r.animate([{ transform: `translate(${x - 6}px,${y - 2.5}px) scale(.6)`, opacity: .9 }, { transform: `translate(${x - 6}px,${y - 2.5}px) scale(${5 + k * 3})`, opacity: 0 }], { duration: 900 + k * 300, delay: k * 140, easing: OUT }).finished.then(() => r.remove()); } }
async function rise(tok, text) {
  const sess = rel($(".session"), water), b = document.createElement("span"); b.className = "bubble"; b.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>${text}`; water.append(b);
  const w = b.offsetWidth, x = sess.x + sess.w / 2 - w / 2, wl = WL();
  try {
    await anim(tok, b, [{ transform: `translate(${x}px,${sess.y + 30}px) scale(.85)`, opacity: 0 }, { transform: `translate(${x}px,${wl + 4}px)`, opacity: 1, offset: .55 }, { transform: `translate(${x}px,${wl - 56}px)`, opacity: 1 }], { duration: 1300, easing: OUT });
    ripple(x + w / 2, wl);
    await wait(tok, 1100);
    await anim(tok, b, [{ opacity: 1 }, { opacity: 0, transform: `translate(${x}px,${wl - 70}px)` }], { duration: 380 });
  } finally { b.remove(); }
}
async function playStep(i, tok) {
  for (const a of STEPS[i]) {
    if (a[0] === "down") { await drop(tok, a[1]); for (const l of a[2]) { addLine(l); await wait(tok, 320); } }
    else if (a[0] === "log") { for (const l of a[1]) { addLine(l); await wait(tok, 520); } }
    else if (a[0] === "up") { await rise(tok, a[1]); }
    await wait(tok, 260);
  }
}
const WEST = [5200, 4200, 2200, 3200, 3800, 3600];
async function wgo(i) {
  wtok.alive = false; wtok = run(); const my = wtok; wstep = i;
  loopBtns.forEach((b, k) => { if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); const bar = b.querySelector(".bar"); bar.getAnimations().forEach(a => a.cancel()); });
  $$(".drop,.bubble", water).forEach(e => e.remove());
  if (RM) { log.innerHTML = ""; STEPS.slice(0, i + 1).forEach(s => s.forEach(a => (a[0] === "down" ? a[2] : a[0] === "log" ? a[1] : []).forEach(l => addLine(l, true)))); return; }
  if (i === 0) log.innerHTML = "";
  if (wauto) { wbar = loopBtns[i].querySelector(".bar").animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: WEST[i], easing: "linear", fill: "forwards" }); if (!winView) wbar.pause(); }
  try {
    if (!winView) await new Promise(r => { const c = setInterval(() => { if (winView || !my.alive) { clearInterval(c); r(); } }, 200); });
    await playStep(i, my); await wait(my, 700);
    if (wauto && my.alive) wgo((i + 1) % STEPS.length);
  } catch (e) { if (!(e instanceof Stop)) console.error(e); }
}
loopBtns.forEach((b, k) => b.onclick = () => { wauto = false; wgo(k); });
new IntersectionObserver(es => es.forEach(e => { winView = e.isIntersecting; if (wbar) winView ? wbar.play() : wbar.pause(); if (winView && wstep < 0) wgo(0); }), { threshold: .35 }).observe(water);
if (RM) wgo(5);
})();
