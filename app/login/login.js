/* Sign-in page and its variants (/login, #night, #split). Split from pages-more.js; uses ui.js helpers and data.js. */
/* ---------- Sign in: Backstage sign-in page with the Google provider, as live ---------- */
/* Sign in: the live Backstage page with the Google provider only. The page is a field of stage glyphs, the product's
   own mark: work queued, moving, delivered, and the few waiting for a person. The sign-in sits in a clearing at the
   centre. Hover a waiting glyph to see what it waits for; pressing Sign in sets the waiting ones moving again. */
/* Three sign-in designs for comparison, one process: Google-only Backstage sign-in with the same help and error.
   A (/login) the field, B (/login#night) the dark contour night, C (/login#split) sign-in beside the product. */
const LOGIN_VARIANTS = [["", "Field"], ["night", "Night"], ["split", "Split"]];
function loginBits() {
  const busy = S.loginStep === "busy", err = S.loginStep === "error";
  return {
    err: err ? `<div class="callout danger" role="alert">${ic("circle-alert")}<span class="grow"><b>The Google sign-in window closed before it finished.</b> Allow pop-ups for app.konteks.io and try again.</span></div>` : "",
    btn: `<button class="btn btn-primary google" type="button" id="gBtn" ${busy ? 'disabled aria-busy="true"' : ""}>${busy ? `<span class="spin"></span>Waiting for Google…` : `${ic("log-in")}Sign in with Google`}</button>`,
    help: `<p class="auth-help">Use the Google account your workspace invited.</p>`,
    base: `<footer class="auth-base"><span>${ic("shield-check")}Runs on your team's computers. Konteks never holds a provider key.</span><span class="auth-demo"><span class="label">Demo</span><nav class="auth-vars" aria-label="Sign-in designs">${LOGIN_VARIANTS.map(([k, l]) => `<a href="#${k}" ${(S.loginVar || "") === k ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav><button class="btn btn-ghost btn-sm" type="button" id="gErr">Show the error state</button></span></footer>`,
  };
}
function pageLogin() {
  if (S.loginVar === "night") return pageLoginNight();
  if (S.loginVar === "split") return pageLoginSplit();
  const busy = S.loginStep === "busy", err = S.loginStep === "error";
  return `<div class="auth">
    <canvas class="field" id="field" aria-hidden="true"></canvas>
    <div class="field-tip" id="fieldTip" role="presentation" hidden></div>
    <main class="auth-main" id="main" tabindex="-1">
      <div class="auth-card">
        <span class="auth-mark"><span class="brand-mark">K</span>Konteks</span>
        <h1>Your agents kept working.</h1>
        <p class="auth-lede">Plans, estimates and deliveries move on their own. The few that need a person are waiting for you.</p>
        ${err ? `<div class="callout danger" role="alert">${ic("circle-alert")}<span class="grow"><b>The Google sign-in window closed before it finished.</b> Allow pop-ups for app.konteks.io and try again.</span></div>` : ""}
        <button class="btn btn-primary google" type="button" id="gBtn" ${busy ? 'disabled aria-busy="true"' : ""}>${busy ? `<span class="spin"></span>Waiting for Google…` : `${ic("log-in")}Sign in with Google`}</button>
        <p class="auth-help">Use the Google account your workspace invited.</p>
        <ul class="auth-legend" aria-label="What the field shows"><li><i class="lg-d"></i>Delivered</li><li><i class="lg-p"></i>In progress</li><li><i class="lg-y"></i>Needs a person</li></ul>
      </div>
    </main>
    ${loginBits().base}
  </div>`;
}
/* B · Night: a dark matcha ground with slow contour lines and a quiet column; the agents' work drifts past below. */
function nightContours() {
  let out = "";
  for (let k = 0; k < 30; k++) {
    let d = "";
    for (let x = -60; x <= 1500; x += 30) {
      const y = 70 + k * 30 + 48 * Math.sin(x / 230 + k * .33) + 26 * Math.sin(x / 97 + k * .7) + 14 * Math.sin(x / 53 + k * 1.3) + k * k * .15 * Math.sin(x / 400);
      d += (x === -60 ? "M" : " L") + x + "," + y.toFixed(1);
    }
    out += `<path d="${d}" class="${k % 5 ? "" : "major"}"/>`;
  }
  return out;
}
const NIGHT_CHIPS = [["done", "PR #142 merged"], ["run", "TKT-2 delivering on rf-01"], ["plan", "Plan written · Rental checkout"], ["wait", "Estimate waits for approval"],
  ["done", "Receipt settled · 1.84 SP"], ["plan", "Breakdown ready · HRIS README"], ["run", "Planning · Invoice export"]];
function pageLoginNight() {
  const b = loginBits(), chips = NIGHT_CHIPS.map(([k, t]) => `<span class="n-chip"><i class="n-${k}"></i>${t}</span>`).join("");
  return `<div class="auth auth-n">
    <svg class="n-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g>${nightContours()}</g></svg>
    <header class="n-top"><span class="auth-mark"><span class="brand-mark">K</span>Konteks</span></header>
    <main class="n-main" id="main" tabindex="-1">
      <div class="n-col">
        <span class="n-tile" aria-hidden="true"><span class="brand-mark">K</span></span>
        <h1>Sign in to Konteks</h1>
        <p class="auth-lede">Your agents kept working while you were away. A few things are waiting for you.</p>
        ${b.err}${b.btn}${b.help}
      </div>
      <div class="n-rail" aria-hidden="true"><div class="n-track">${chips}${chips}</div></div>
    </main>
    ${b.base}
  </div>`;
}
/* What Konteks stands for, as the product states it (PRODUCT.md › Positioning). */
const SPLIT_PROS = [["server", "On your runtimes", "Agents run on your team's computers. Konteks never holds a provider key."],
  ["calculator", "Quoted before it runs", "Every delivery has a price in Story Points before anything starts."],
  ["receipt", "Settled on use", "Only what was used is charged, with a receipt for each delivery."]];
/* C · Split: sign in on paper; the product itself on the moss panel beside it (the real Work In Progress page and a real decision card). */
function pageLoginSplit() {
  const b = loginBits(), v = S.viewAs; S.viewAs = "approver";
  const card = shotOf(attentionCard(iniById["INI-139"])); S.viewAs = v;
  return `<div class="auth auth-s">
    <section class="s-left">
      <header class="s-top"><span class="auth-mark"><span class="brand-mark">K</span>Konteks</span></header>
      <main class="s-form" id="main" tabindex="-1">
        <h1>Welcome back.</h1>
        <p class="auth-lede">Sign in to see what your agents moved and what is waiting for you.</p>
        ${b.err}${b.btn}${b.help}
        <div class="s-card-m" aria-hidden="true" inert>${card}</div>
      </main>
      ${b.base}
    </section>
    <aside class="s-right" aria-hidden="true" inert>
      <div class="s-head"><b>Nothing runs until a person approves it.</b><span>Agents plan, estimate and deliver on your own runtimes. You decide what spends.</span></div>
      <div class="s-stage"><div class="s-shot"><div class="ov-shot-in">${shotOf(pageWork())}</div></div>
      <div class="s-card">${card}</div></div>
      <ul class="s-pros">${SPLIT_PROS.map(([i, t, d]) => `<li>${ic(i)}<b>${t}</b><span>${d}</span></li>`).join("")}</ul>
    </aside>
  </div>`;
}
/* The field: one canvas, a glyph every 32px. Colours come from the tokens, so dark mode follows. */
const WAITS = ["Estimate ready · up to 2.15 SP", "Breakdown ready for review", "Plan ready: create tickets", "Repository needed for TKT-1", "Pull request ready for review", "Konteks asked a question about the plan", "Decide: continue TKT-1?"];
function startField(cv) {
  const ctx = cv.getContext("2d"), tip = $("#fieldTip"), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let C = {}, cells = [], W = 0, H = 0, step = 32, mouse = { x: -999, y: -999 }, last = performance.now(), hot = null;
  const pal = () => { C = { q: css("--line-strong"), p: css("--accent-fill"), d: css("--accent-strong"), y: css("--accent"), halo: css("--focus"), fill: css("--surface") }; };
  const size = () => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = W < 600 ? 28 : 32; const cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1, ox = (W - (cols - 1) * step) / 2, oy = (H - (rows - 1) * step) / 2;
    const old = cells; cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const prev = old[r * cols + c], x = ox + c * step, y = oy + r * step, k = Math.random();
      cells.push(prev ? Object.assign(prev, { x, y }) : { x, y, s: k < .012 ? "y" : k < .36 ? "d" : k < .62 ? "p" : "q", t: Math.random(), v: .04 + Math.random() * .1, pop: 0, w: WAITS[(r * 7 + c * 3) % WAITS.length], z: 1 });
    }
  };
  /* The clearing: glyphs fade out around the sign-in card, whatever the window size, so the words always read. */
  const clear = () => {
    const card = $(".auth-card"), cr = card?.getBoundingClientRect(), r = cv.getBoundingClientRect();
    if (!cr) return cells.forEach(g => g.a = 1);
    const cx = cr.left - r.left + cr.width / 2, cy = cr.top - r.top + cr.height / 2, rx = cr.width / 2 + 70, ry = cr.height / 2 + 56;
    cells.forEach(g => { const d = Math.hypot((g.x - cx) / rx, (g.y - cy) / ry); g.a = d < 1 ? 0 : Math.min(1, (d - 1) / .45); });
  };
  const glyph = (g, now) => {
    if (!g.a) return;
    const A = g.a, near = Math.hypot(g.x - mouse.x, g.y - mouse.y), lift = still ? 1 : 1 + Math.max(0, 1 - near / 120) * .45;
    g.z += (lift - g.z) * .18; const R = 7 * g.z + (g.pop > 0 ? g.pop * 3 : 0);
    ctx.lineWidth = 2;
    if (g.s === "d") { ctx.fillStyle = C.d; ctx.globalAlpha = A * (.42 + g.pop * .5); ctx.beginPath(); ctx.arc(g.x, g.y, R - 1.5, 0, 7); ctx.fill(); return; }
    if (g.s === "y") {
      const pulse = still ? .5 : (Math.sin(now / 500 + g.x) + 1) / 2;
      ctx.fillStyle = C.halo; ctx.globalAlpha = A * (.45 + pulse * .5); ctx.beginPath(); ctx.arc(g.x, g.y, R + 6 + pulse * 4, 0, 7); ctx.fill();
      ctx.globalAlpha = A; ctx.lineWidth = 2.5; ctx.fillStyle = C.fill; ctx.strokeStyle = C.y; ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, 7); ctx.fill(); ctx.stroke(); return;
    }
    ctx.strokeStyle = C.q; ctx.globalAlpha = A * .8; ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, 7); ctx.stroke();
    if (g.s === "p") { ctx.globalAlpha = A; ctx.strokeStyle = C.p; ctx.beginPath(); ctx.arc(g.x, g.y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.t); ctx.stroke(); }
  };
  const tick = now => {
    if (!cv.isConnected) { removeEventListener("resize", onResize); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1;
    for (const g of cells) {
      if (!still) {
        if (g.s === "p") { g.t += g.v * dt; if (g.t >= 1) { g.s = Math.random() < .015 ? "y" : "d"; g.t = 0; g.pop = 1; } }
        else if (g.s === "q" && Math.random() < .0016) { g.s = "p"; g.t = 0; }
        else if (g.s === "d" && Math.random() < .0009) { g.s = "q"; }
        else if (g.s === "y" && Math.random() < .0012) { g.s = "p"; g.t = 0; g.pop = 1; }
        if (g.pop > 0) g.pop = Math.max(0, g.pop - dt * 4);
      }
      glyph(g, now);
    }
    if (!still) requestAnimationFrame(tick);
  };
  const onResize = () => { size(); clear(); if (still) tick(performance.now()); };
  /* Hover: a waiting glyph names what it waits for. */
  cv.parentElement.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    hot = cells.find(g => g.s === "y" && g.a > .5 && Math.hypot(g.x - mouse.x, g.y - mouse.y) < 14) || null;
    if (hot && !e.target.closest(".auth-card,.auth-base")) { tip.hidden = false; tip.textContent = hot.w; tip.style.left = r.left + hot.x + "px"; tip.style.top = r.top + hot.y - 18 + "px"; } else tip.hidden = true;
  });
  cv.parentElement.addEventListener("pointerleave", () => { mouse = { x: -999, y: -999 }; tip.hidden = true; });
  new MutationObserver(() => pal()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  addEventListener("resize", onResize);
  pal(); size(); clear(); requestAnimationFrame(tick);
  /* Your decision unblocks the work: everything waiting starts moving. */
  return { release: () => cells.forEach(g => { if (g.s === "y") { g.s = "p"; g.t = 0; g.v = .35 + Math.random() * .3; g.pop = 1; } }) };
}
function bindLogin() {
  const f = $("#field") ? startField($("#field")) : null;
  /* Split: the product shot renders at 1280px and scales to the panel. */
  $$(".s-shot").forEach(box => { const fit = () => box.style.setProperty("--k", box.clientWidth / 1280); fit(); new ResizeObserver(fit).observe(box); });
  $("#gBtn")?.addEventListener("click", () => { f?.release(); sfx("ok"); S.loginStep = "busy"; const b = $("#gBtn"); b.disabled = true; b.setAttribute("aria-busy", "true"); b.innerHTML = `<span class="spin"></span>Waiting for Google…`; setTimeout(() => { S.loginStep = "idle"; location.hash = "work"; }, 1400); });
  $("#gErr")?.addEventListener("click", () => { S.loginStep = "error"; render(); });
}
