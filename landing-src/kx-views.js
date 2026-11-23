/* Konteks proposal: one switcher shared by the four views (landing, design system, sign in, demo app).
   A tab hangs under each view's own top bar; it opens a small menu of the four views and the theme.
   Loaded on every page as /kx-views.js. Pages stay fully usable without it. */
(() => {
  if (window.__kxv) return; window.__kxv = 1;
  const d = document, root = d.documentElement;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const VIEWS = [
    ["site", "/", "Landing page", "Landing", "The marketing site, pricing, journal and docs"],
    ["ds", "/design-system", "Design system", "System", "Pitch, foundations, components and code"],
    ["login", "/login", "Sign in", "Sign in", "The sign-in page and its variants"],
    ["app", "/app", "Demo app", "Demo", "Work In Progress, sessions, releases, settings"],
  ];
  const cur = path.startsWith("/design-system") || path.startsWith("/prototype") ? "ds" : path.startsWith("/login") ? "login" : path.startsWith("/app") ? "app" : "site";
  const curV = VIEWS.find(v => v[0] === cur);

  const css = `
.kxv{--kxv-bg:#171b16;--kxv-ink:#eef2ea;--kxv-ink2:#b7c0b1;--kxv-line:#2c3329;--kxv-hi:#232a20;--kxv-acc:#9dc47b;--kxv-on:#13200c;
  position:fixed;z-index:95;right:max(16px,env(safe-area-inset-right,0px));top:var(--kxv-top,0px);font:500 13px/1.2 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  view-transition-name:kx-views;transition:translate .3s cubic-bezier(.2,.8,.2,1),opacity .3s}
.kxv.away{translate:0 -120%;opacity:0;pointer-events:none}
.kxv-tab{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px 0 9px;border:0;border-radius:0 0 9px 9px;background:var(--kxv-bg);color:var(--kxv-ink);font:inherit;cursor:pointer;box-shadow:0 6px 18px -8px rgba(0,0,0,.45)}
.kxv-tab:hover{background:var(--kxv-hi)}
.kxv-tab:focus-visible,.kxv-menu a:focus-visible,.kxv-menu button:focus-visible{outline:2px solid var(--kxv-acc);outline-offset:2px}
.kxv-tab svg{width:14px;height:14px;flex:none}
.kxv-tab .chev{transition:rotate .2s}
.kxv[data-open] .kxv-tab .chev{rotate:180deg}
.kxv-tab b{font-weight:600}
.kxv-tab .k{color:var(--kxv-ink2);font-weight:500}
.kxv-menu{position:absolute;right:0;top:calc(100% + 6px);width:min(300px,calc(100vw - 32px));padding:6px;border-radius:14px;background:var(--kxv-bg);color:var(--kxv-ink);border:1px solid var(--kxv-line);box-shadow:0 18px 48px -16px rgba(0,0,0,.55);
  opacity:0;translate:0 -6px;visibility:hidden;transition:opacity .18s,translate .22s cubic-bezier(.2,.8,.2,1),visibility 0s .22s}
.kxv[data-open] .kxv-menu{opacity:1;translate:0 0;visibility:visible;transition:opacity .18s,translate .22s cubic-bezier(.2,.8,.2,1)}
.kxv-menu p{margin:0;padding:8px 10px 6px;font-size:12px;color:var(--kxv-ink2)}
.kxv-menu a{display:grid;grid-template-columns:auto 1fr auto;column-gap:10px;align-items:center;padding:9px 10px;border-radius:9px;color:inherit;text-decoration:none}
.kxv-menu a:hover{background:var(--kxv-hi)}
.kxv-menu a .n{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:var(--kxv-hi);color:var(--kxv-ink2);font-size:11.5px;font-weight:600;grid-row:span 2}
.kxv-menu a b{font-weight:600;font-size:14px}
.kxv-menu a small{grid-column:2;font-size:12px;color:var(--kxv-ink2);margin-top:2px}
.kxv-menu a .here{grid-row:1;grid-column:3;font-size:11.5px;color:var(--kxv-acc)}
.kxv-menu a[aria-current]{background:var(--kxv-hi)}
.kxv-menu a[aria-current] .n{background:var(--kxv-acc);color:var(--kxv-on)}
.kxv-menu hr{border:0;border-top:1px solid var(--kxv-line);margin:6px 4px}
.kxv-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:9px 10px;border:0;border-radius:9px;background:none;color:var(--kxv-ink2);font:inherit;cursor:pointer;text-align:left}
.kxv-menu button:hover{background:var(--kxv-hi);color:var(--kxv-ink)}
.kxv-menu button svg{width:15px;height:15px}
.kxv-menu kbd{margin-left:auto;font:500 11.5px/1 ui-monospace,monospace;color:var(--kxv-ink2);border:1px solid var(--kxv-line);border-radius:5px;padding:3px 5px}
@media (max-width:560px){.kxv-tab .k{display:none}}
/* In the demo app on a phone the tab would sit on the product's own controls; the views live in the More drawer instead. */
@media (max-width:860px){.kxv[data-view="app"]{display:none}}
.kxv-side{display:none}
@media (max-width:860px){.kxv-side{display:grid;gap:2px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line,#ddd)}
.kxv-side p{margin:0 8px 4px;font-size:12px;color:var(--ink-3,#777)}
.kxv-side a{display:flex;align-items:center;gap:10px;min-height:40px;padding:0 8px;border-radius:8px;color:var(--ink-2,#444);text-decoration:none;font-size:14px}
.kxv-side a:hover{background:var(--hover,rgba(0,0,0,.05))}
.kxv-side a[aria-current]{color:var(--ink,#111);font-weight:600}
.kxv-side a .n{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:600;background:var(--sunken,#eee);color:var(--ink-3,#777)}
.kxv-side a[aria-current] .n{background:var(--accent,#4a7a2e);color:var(--on-accent,#fff)}}
@media (prefers-reduced-motion:reduce){.kxv,.kxv-menu,.kxv-tab .chev{transition:none}}
@media print{.kxv{display:none}}`;
  const st = d.createElement("style"); st.textContent = css; d.head.appendChild(st);

  const I = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18"/></svg>',
  };
  const wrap = d.createElement("div");
  wrap.className = "kxv"; wrap.dataset.view = cur;
  wrap.innerHTML = `<button class="kxv-tab" type="button" aria-expanded="false" aria-controls="kxvMenu">${I.grid}<span class="k">View:</span><b>${curV[3]}</b>${I.chev}</button>
  <nav class="kxv-menu" id="kxvMenu" aria-label="Proposal views"><p>Konteks proposal, four views</p>
  ${VIEWS.map(([k, href, name, , note], i) => `<a href="${href}"${k === cur ? ' aria-current="page"' : ""}><span class="n">${i + 1}</span><b>${name}</b>${k === cur ? '<span class="here">You are here</span>' : ""}<small>${note}</small></a>`).join("")}
  <hr><button type="button" data-kxv-theme>${I.theme}<span>Switch theme</span></button></nav>`;
  const tab = wrap.querySelector(".kxv-tab"), menu = wrap.querySelector(".kxv-menu");
  const setOpen = on => { on ? wrap.setAttribute("data-open", "") : wrap.removeAttribute("data-open"); tab.setAttribute("aria-expanded", on); if (on) (menu.querySelector("[aria-current]") || menu.querySelector("a")).focus(); };
  tab.addEventListener("click", () => setOpen(!wrap.hasAttribute("data-open")));
  d.addEventListener("click", e => { if (!wrap.contains(e.target)) setOpen(false); });
  d.addEventListener("keydown", e => {
    if (e.key === "Escape" && wrap.hasAttribute("data-open")) { setOpen(false); tab.focus(); }
    /* Alt + 1..4 jumps straight to a view. */
    if (e.altKey && !e.metaKey && !e.ctrlKey && /^Digit[1-4]$/.test(e.code)) { const v = VIEWS[+e.code.slice(5) - 1]; if (v[0] !== cur) { e.preventDefault(); location.href = v[1]; } }
  });
  menu.addEventListener("keydown", e => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    const items = [...menu.querySelectorAll("a,button")], i = items.indexOf(d.activeElement);
    e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
  });
  menu.querySelector("[data-kxv-theme]").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("kx-theme", root.dataset.theme); } catch (e) {}
  });
  d.body.appendChild(wrap);

  /* The tab hangs under whichever top bar the view has: the landing nav, the design-system bar, or the app's own bar on a phone. */
  const anchor = () => d.querySelector("#nav") || d.querySelector(".pbar") || (innerWidth <= 860 ? d.querySelector("header.top") : null);
  const sideLinks = () => {
    if (cur !== "app") return;
    const side = d.querySelector(".side");
    if (!side || side.querySelector(".kxv-side")) return;
    const box = d.createElement("nav"); box.className = "kxv-side"; box.setAttribute("aria-label", "Proposal views");
    box.innerHTML = "<p>Proposal views</p>" + VIEWS.map(([k, href, name], i) => `<a href="${href}"${k === cur ? ' aria-current="page"' : ""}><span class="n">${i + 1}</span>${name}</a>`).join("");
    side.appendChild(box);
  };
  sideLinks();
  const place = () => { const a = anchor(); const b = a ? Math.max(0, a.getBoundingClientRect().bottom) : 0; wrap.style.setProperty("--kxv-top", b + "px"); };
  place();
  addEventListener("resize", place, { passive: true });
  new MutationObserver(() => requestAnimationFrame(() => { place(); sideLinks(); })).observe(d.getElementById("root") || d.body, { childList: true });
  /* Out of the way while reading down a long page, back as soon as the reader scrolls up. */
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    if (!wrap.hasAttribute("data-open")) wrap.classList.toggle("away", y > lastY && y > 240);
    lastY = y; place();
  }, { passive: true });
  wrap.addEventListener("focusin", () => wrap.classList.remove("away"));

  /* Warm the other views so a switch feels instant. */
  if (HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
    const s = d.createElement("script"); s.type = "speculationrules";
    s.textContent = JSON.stringify({ prefetch: [{ urls: VIEWS.filter(v => v[0] !== cur).map(v => v[1]), eagerness: "moderate" }] });
    d.head.appendChild(s);
  } else {
    tab.addEventListener("pointerenter", () => VIEWS.forEach(v => { if (v[0] === cur) return; const l = d.createElement("link"); l.rel = "prefetch"; l.href = v[1]; d.head.appendChild(l); }), { once: true });
  }
})();
