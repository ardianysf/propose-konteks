(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* theme */
$("#theme").onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("kx-lp-theme", r.dataset.theme); } catch (e) {}
};

/* nav edge + menu closes on pick */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("stuck", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
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

/* hero: nothing below the line runs until yes */
const hero = $(".hero"), yes = $("#yes"), yesL = $("#yes-l"), lanes = $$(".lane");
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
let timers = [], running = false, played = false;
const setLane = (i, st, html, type) => {
  const ln = lanes[i], log = $(".log", ln);
  ln.classList.remove("run", "done"); if (st !== "idle") ln.classList.add(st);
  $(".state span", ln).textContent = LABEL[st];
  if (!type) { log.innerHTML = html; return; }
  // type the plain text, then swap in the marked-up line
  const plain = html.replace(/<[^>]+>/g, ""); let n = 0;
  log.textContent = ""; const car = '<span class="car"></span>';
  const tick = () => {
    n += 2; log.innerHTML = plain.slice(0, n).replace(/&/g, "&amp;").replace(/</g, "&lt;") + car;
    if (n < plain.length) timers.push(setTimeout(tick, 16)); else log.innerHTML = html + (st === "run" ? car : "");
  };
  tick();
};
const reset = () => {
  timers.forEach(clearTimeout); timers = [];
  hero.classList.remove("go", "printed"); yesL.textContent = "Yes"; yes.disabled = false;
  lanes.forEach((_, i) => setLane(i, "idle", "Waiting for yes"));
  running = false;
};
const finish = () => {
  hero.classList.add("go", "printed"); yesL.textContent = "Yes, approved"; yes.disabled = true;
  const last = {}; SCRIPT.forEach(s => last[s[1]] = s);
  Object.values(last).forEach(s => setLane(s[1], "done", s[3]));
};
const run = () => {
  if (running) return; running = played = true;
  if (RM) { finish(); return; }
  hero.classList.add("go"); yesL.textContent = "Yes, approved"; yes.disabled = true;
  SCRIPT.forEach(([t, i, st, h]) => timers.push(setTimeout(() => setLane(i, st, h, true), t)));
  timers.push(setTimeout(() => { hero.classList.add("printed"); running = false; }, 12000));
};
yes.addEventListener("click", run);
$("#replay").addEventListener("click", () => { reset(); requestAnimationFrame(() => setTimeout(run, 250)); yes.focus({ preventScroll: true }); });
if (RM) finish();
else {
  // autoplay once, a moment after the hero is seen, unless the visitor presses yes first
  let auto;
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !played) auto = setTimeout(() => { if (!played) run(); }, 2600);
    else clearTimeout(auto);
  }), { threshold: .6 }).observe(yes);
}

/* ledger strike */
const ledger = $("#ledger");
if (RM || !("IntersectionObserver" in window)) ledger.classList.add("still");
else new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { ledger.classList.add("on"); o.disconnect(); } }), { threshold: .35 }).observe(ledger);

/* the loop: one line that crosses below and comes back, drawn as you read */
const loop = $("#loop"), steps = $$(".step", loop);
const NS = "http://www.w3.org/2000/svg";
let svg, base, ink, len = 0, wide = false;
const layout = () => {
  wide = innerWidth > 900;
  if (!wide) { if (svg) svg.remove(), svg = null; return; }
  if (!svg) {
    svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "path"); svg.setAttribute("aria-hidden", "true");
    base = document.createElementNS(NS, "path"); base.setAttribute("class", "base");
    ink = document.createElementNS(NS, "path"); ink.setAttribute("class", "ink");
    svg.append(base, ink); loop.append(svg);
  }
  const lr = loop.getBoundingClientRect();
  const pts = steps.map(s => { const r = $(".node", s).getBoundingClientRect(); return [r.left - lr.left + r.width / 2, r.top - lr.top + r.height / 2]; });
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  const R = 22;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (Math.abs(y1 - y0) < 2) { d += ` L${x1} ${y1}`; continue; }
    const sy = Math.sign(y1 - y0), sx = Math.sign(x1 - x0) || 1;
    if (y1 > y0) d += ` L${x1 - sx * R} ${y0} Q${x1} ${y0} ${x1} ${y0 + sy * R} L${x1} ${y1}`;
    else d += ` L${x0} ${y1 - sy * R} Q${x0} ${y1} ${x0 + sx * R} ${y1} L${x1} ${y1}`;
  }
  base.setAttribute("d", d); ink.setAttribute("d", d);
  len = ink.getTotalLength();
  ink.style.strokeDasharray = len; draw();
};
const draw = () => {
  const r = loop.getBoundingClientRect(), vh = innerHeight;
  let p = RM ? 1 : (vh * .78 - r.top) / (r.height + vh * .1);
  p = Math.max(0, Math.min(1, p));
  if (wide && ink) ink.style.strokeDashoffset = len * (1 - p);
  steps.forEach((s, i) => {
    let lit;
    if (wide) lit = p >= i / (steps.length - 1) - .001 && p > 0;
    else { const nr = s.getBoundingClientRect(); lit = RM || nr.top < vh * .7; }
    s.classList.toggle("lit", lit);
  });
};
let raf = 0;
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }, { passive: true });
addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { raf = 0; layout(); }); });
document.fonts && document.fonts.ready.then(layout);
layout();

/* four kinds of session */
const KINDS = [
  { t: "A requirement becomes milestones, sprints, and tickets. Each ticket becomes a plan.",
    f: [["", "Requirement", "Billing exports for Finance"], ["ag", "Milestones and sprints", "2 milestones, 3 sprints"], ["ag", "Tickets", "9 tickets"], ["", "Plans", "One per ticket, each with a ceiling"]] },
  { t: "A plan, your yes, tested pull requests, and a receipt.",
    f: [["", "Plan", "4 steps, ceiling $6.00"], ["y", "Yes", ""], ["ag", "Pull requests", "2, tests passed"], ["", "Receipt", "Kept in the record"]] },
  { t: "A browser agent clicks through what shipped and reports only what it ran.",
    f: [["", "Shipped", "CSV export for Finance"], ["ag", "Browser agent", "Opened /invoices, clicked Export CSV"], ["", "Report", "3 steps run, 3 passed"]] },
  { t: "The agent watches logs and alerts, opens the issue, and works the fix.",
    f: [["ag", "Watches", "A timeout in the invoices-api logs"], ["ag", "Issue", "CSV export times out past 5,000 rows"], ["ag", "Fix", "A plan for the fix, with a ceiling"], ["y", "Yes", ""]] },
];
const tabs = $$("#ktabs [role=tab]"), panel = $("#kp");
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const show = (i, focus) => {
  tabs.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; });
  panel.setAttribute("aria-labelledby", tabs[i].id);
  const k = KINDS[i];
  panel.innerHTML = `<p>${esc(k.t)}</p><div class="flow">${k.f.map(([c, b, s], n) =>
    c === "y" ? `<div class="y" style="--i:${n}">${b}</div>` : `<div class="${c}" style="--i:${n}"><b>${esc(b)}</b>${esc(s)}</div>`).join("")}</div><span class="eg">Example</span>`;
  if (focus) tabs[i].focus();
};
tabs.forEach((b, i) => {
  b.addEventListener("click", () => show(i));
  b.addEventListener("keydown", e => {
    const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); show((i + k + tabs.length) % tabs.length, true); }
    if (e.key === "Home") { e.preventDefault(); show(0, true); }
    if (e.key === "End") { e.preventDefault(); show(tabs.length - 1, true); }
  });
});
show(0);
})();
