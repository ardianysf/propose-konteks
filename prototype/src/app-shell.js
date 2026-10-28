/* ---------- demo app state ---------- */
const S = {
  viewAs: "contributor",   // contributor | approver: shows how permission changes the attention card
  cur: "INI-139",          // initiative shown on the detail page
  rt: "rf-01",             // runtime shown on the runtime page
  sys: null,               // System filter, shared by Work In Progress, Activities, Issues, Releases
  approved: false,
  accessTab: "overview", ctxTab: "files", skillTab: "installed", loginStep: "idle",
  harness: null, invFilter: "all", lang: "en", bannerGone: (() => { try { return localStorage.getItem("kx-conn-banner") === "gone"; } catch (e) { return false; } })(),
};
try { const v = localStorage.getItem("kx-viewas"); if (v) S.viewAs = v; S.rail = !!localStorage.getItem("kx-rail"); S.sideW = +localStorage.getItem("kx-sidew") || 240; } catch (e) { S.sideW = 240; }
S.newVersion = true;
try { S.sound = localStorage.getItem("kx-sound") !== "off"; } catch (e) { S.sound = true; }

const NAV = [
  ["activities", "#activities", "activity", "Activities"],
  ["work", "#work", "square-kanban", "Work In Progress"],
  ["issues", "#issues", "bug", "Issues"],
  ["releases", "#releases", "rocket", "Releases"],
  ["leaders", "#leaders", "list-ordered", "Leaders"],
  ["customize", "#runtimes", "sliders-horizontal", "Customize"],
];
/* "Needs you" = you are the one who can act now. An estimate you drive but cannot approve waits on the approver instead. */
const actsNow = i => i.tone !== "running" && i.driver === "ay" && !(i.kind === "estimate" && S.viewAs !== "approver" && !S.approved);
const attentionCount = () => INITIATIVES.filter(actsNow).length;

function shell(active, top, body, { flush = false } = {}) {
  const need = attentionCount();
  /* Runtimes, compact: one segmented bar for the fleet (it links to the Runtimes table), then only what is yours:
     your own computers and Work Locally. Other people's runtimes are one click away behind the bar. */
  const cnt = k => RUNTIMES.filter(r => r.status === k).length, ready = cnt("ready"), paused = cnt("paused"), off = cnt("offline");
  const mine = RUNTIMES.filter(r => r.owner === "Ardian Yusuf");
  const fleet = `${ready} of ${RUNTIMES.length} runtimes ready`;
  const mineRow = r => { const [k, l] = RT_STATUS[r.status]; return `<a href="#runtime" data-rtgo="${r.id}" data-tip="${esc(r.name)}: ${l}" aria-label="${esc(r.name)}, your computer: ${l}" ${active === "runtime" && S.rt === r.id ? 'aria-current="page"' : ""}><span class="ic-dot">${ic(r.os === "macOS" ? "laptop" : "monitor")}<span class="rt-dot ${k}" aria-hidden="true"></span></span><span class="lbl">${esc(r.name)}</span><span class="rt-st lbl">${l}</span></a>`; };
  return `<a class="skip" href="#main" id="skipLink">Skip to content</a><div class="app ${S.rail ? "railed" : ""}" id="app" style="--side-w:${S.sideW || 240}px">
  <aside class="side" aria-label="Workspace navigation">
    <div class="side-top"><button class="ws" type="button" id="wsBtn" aria-haspopup="menu" aria-label="Workspace: Refactory" data-tip="Refactory"><span class="brand-mark">R</span><b class="lbl">Refactory</b>${ic("chevrons-up-down")}</button><button class="btn btn-ghost btn-icon btn-sm rel" type="button" id="bellBtn" aria-label="Notifications, ${notifItems().filter(n => n[0]).length} unread" data-tip="Notifications">${ic("bell")}<span class="unread" style="position:absolute;top:5px;right:5px"></span></button></div>
    <nav class="nav" aria-label="Main">
      ${NAV.map(([k, h, i, l]) => `<a href="${h}" data-tip="${l}" ${active === k ? 'aria-current="page"' : ""} ${k === "work" ? `aria-label="Work In Progress: ${need} need you"` : ""}>${ic(i)}<span class="lbl">${l}</span>${k === "work" ? `<span class="count hot">${need}</span>` : ""}</a>`).join("")}
    </nav>
    <section class="side-sec" aria-labelledby="rtH">
      <div class="side-h"><span id="rtH">Runtimes</span><button type="button" id="sideConnect" aria-label="Connect a runtime" data-tip="Connect a runtime">${ic("plus")}</button></div>
      <a class="fleet" href="#runtimes" data-tip="${fleet}" aria-label="${fleet}. ${paused} not accepting work, ${off} not connected. Open Runtimes" ${active === "runtime" && !mine.some(r => r.id === S.rt) ? 'aria-current="page"' : ""}>
        <span class="fleet-ic">${ic("server")}</span>
        <span class="fleet-b lbl"><span class="hbar" aria-hidden="true"><i class="ok" style="flex:${ready}"></i><i class="warn" style="flex:${paused}"></i><i class="off" style="flex:${off}"></i></span>
          <span class="fleet-t"><b>${ready} ready</b>${paused ? `<span><i class="lg warn"></i>${paused} not accepting work</span>` : ""}${off ? `<span><i class="lg off"></i>${off} not connected</span>` : ""}</span></span></a>
    </section>
    <section class="side-sec" aria-labelledby="mineH">
      <div class="side-h"><span id="mineH">Your computer${mine.length === 1 ? "" : "s"}</span></div>
      <nav class="nav mine-nav" aria-label="Your computers">
        ${mine.length ? mine.map(mineRow).join("") : `<button type="button" id="sideConnectMine" data-tip="Connect this computer">${ic("laptop")}<span class="lbl">Connect this computer</span></button>`}
        <button type="button" id="sideLocal" data-tip="Work Locally">${ic("terminal-square")}<span class="lbl">Work Locally</span><span class="rt-st lbl">MCP</span></button>
      </nav>
    </section>
    <div class="side-foot">
      <div class="side-resize" id="sideResize" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" aria-valuemin="200" aria-valuemax="360" aria-valuenow="${S.sideW || 240}" tabindex="0"></div>
      <div class="side-me"><button class="me" type="button" id="meBtn" aria-haspopup="menu" aria-label="Account menu" data-tip="Ardian Yusuf">${av("ay")}<span style="min-width:0"><b>Ardian Yusuf</b><small>ardian@refactory.id</small></span></button>
        <button class="btn btn-ghost btn-icon btn-sm rail-btn" type="button" id="railBtn" data-tip="${S.rail ? "Expand sidebar" : "Collapse sidebar"}" aria-label="${S.rail ? "Expand sidebar" : "Collapse sidebar"}">${ic(S.rail ? "panel-left-open" : "panel-left-close")}</button></div>
    </div>
  </aside>
  <main class="main" id="main" tabindex="-1">
    ${S.newVersion ? `<div class="newver" role="status">${ic("circle-arrow-up")}<span>A new version of Konteks is ready.</span><button class="btn btn-sm" type="button" id="reloadBtn">Reload</button><button class="btn btn-ghost btn-icon btn-sm" type="button" id="newverX" aria-label="Dismiss">${ic("x")}</button></div>` : ""}
    <header class="top ${top ? "" : "bare"}"><button class="btn btn-ghost btn-icon btn-sm mobile-nav" type="button" id="navToggle" aria-label="Open navigation">${ic("panel-left")}</button>${top || `<span class="top-mt">${({ activities: "Activities", work: "Work In Progress", issues: "Issues", releases: "Releases", leaders: "Leaders", customize: "Customize", settings: "Settings" })[active] || ""}</span>`}</header>
    ${flush ? body : `<div class="content">${body}</div>`}
  </main>
  <nav class="tabbar" aria-label="Mobile">
    <a href="#activities" ${active === "activities" ? 'aria-current="page"' : ""}>${ic("activity")}Activities</a>
    <a href="#work" ${active === "work" ? 'aria-current="page"' : ""}>${ic("square-kanban")}Work<span class="count">${need}</span></a>
    <a href="#releases" ${active === "releases" ? 'aria-current="page"' : ""}>${ic("rocket")}Releases</a>
    <a href="#runtimes" ${active === "customize" ? 'aria-current="page"' : ""}>${ic("sliders-horizontal")}Customize</a>
    <button type="button" id="moreTab" aria-label="More: Issues, Leaders, runtimes and account" ${["issues", "leaders", "runtime", "settings"].includes(active) ? 'aria-current="page"' : ""}>${ic("menu")}More</button>
  </nav>
</div>`;
}

/* Page header: title, one-line subtitle, page actions (the pattern every live page already uses). */
const phead = (title, sub, actions = "") => `<div class="phead"><div class="phead-row"><h1 class="ph-t">${title}</h1>${actions ? `<div class="ph-a">${actions}</div>` : ""}</div>${sub ? `<p>${sub}</p>` : ""}</div>`;

/* System filter: one searchable combobox instead of a 24-chip row (UX-044). Same filter, shared across pages. */
function sysFilter() {
  const cur = S.sys ? sysById[S.sys].name : null;
  return `<div class="filters">
    <div class="combo sysf" id="sysCombo"><button class="chipbtn ${cur ? "on" : ""} combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" data-val="${cur ? esc(cur) : "All systems"}">${ic("box")}<span>${cur ? `System: <b>${esc(cur)}</b>` : "All systems"}</span>${ic("chevron-down")}</button></div>
    ${cur ? `<button class="btn btn-ghost btn-icon btn-sm" type="button" id="editSys" aria-label="Edit ${esc(cur)}" data-tip="Edit ${esc(cur)}">${ic("pencil")}</button><button class="btn btn-ghost btn-sm" type="button" id="clearSys">Show all systems</button>` : ""}
    <button class="btn btn-ghost btn-sm" type="button" id="newSys" style="margin-left:auto">${ic("plus")}New System</button>
  </div>`;
}
function bindSysFilter() {
  comboBind("sysCombo", [["", [["All systems", ""], ...SYSTEMS.map(s => [s.name, ""])]]], name => { const s = SYSTEMS.find(x => x.name === name); S.sys = s ? s.id : null; render(); });
  $("#clearSys")?.addEventListener("click", () => { S.sys = null; render(); });
  $("#editSys")?.addEventListener("click", () => editSystem(sysById[S.sys].name));
  $("#newSys")?.addEventListener("click", createSystem);
}

function bindShell() {
  /* The "needs you" badge bumps when its number changes. */
  const need = attentionCount(); if (S._need !== undefined && S._need !== need) $$(".nav .count.hot, .tabbar .count").forEach(c => c.classList.add("bump")); S._need = need;
  const nav = () => $("#app").classList.toggle("nav-open");
  $("#navToggle")?.addEventListener("click", nav);
  $("#moreTab")?.addEventListener("click", nav);
  $("#bellBtn")?.addEventListener("click", e => notifPopover(e.currentTarget));
  $("#railBtn")?.addEventListener("click", () => { S.rail = !S.rail; try { localStorage.setItem("kx-rail", S.rail ? "1" : ""); } catch (e) {} render(); });
  $("#skipLink")?.addEventListener("click", e => { e.preventDefault(); $("#main")?.focus(); });
  $("#meBtn")?.addEventListener("click", e => menu(e.currentTarget, accountMenuItems()));
  $("#wsBtn")?.addEventListener("click", e => menu(e.currentTarget, workspaceMenuItems()));
  $("#sideConnect")?.addEventListener("click", connectRuntime);
  $("#sideConnectMine")?.addEventListener("click", connectRuntime);
  $("#sideLocal")?.addEventListener("click", workLocally);
  $("#reloadBtn")?.addEventListener("click", () => { S.newVersion = false; toast("Konteks reloaded"); render(); });
  $("#newverX")?.addEventListener("click", () => { S.newVersion = false; $(".newver")?.remove(); });
  const rz = $("#sideResize"), app = $("#app");
  const setW = w => { S.sideW = Math.max(200, Math.min(360, Math.round(w))); app.style.setProperty("--side-w", S.sideW + "px"); rz.setAttribute("aria-valuenow", S.sideW); try { localStorage.setItem("kx-sidew", S.sideW); } catch (e) {} };
  rz?.addEventListener("pointerdown", e => { e.preventDefault(); rz.setPointerCapture(e.pointerId); const mv = ev => setW(ev.clientX); rz.onpointermove = mv; rz.onpointerup = () => { rz.onpointermove = null; }; });
  rz?.addEventListener("keydown", e => { if (e.key === "ArrowLeft") setW(S.sideW - 16); if (e.key === "ArrowRight") setW(S.sideW + 16); });
  $$("[data-rtgo]").forEach(a => a.addEventListener("click", () => { S.rt = a.dataset.rtgo; S.harness = null; if (location.hash === "#runtime") render(); }));
}

function viewAsToggle() {
  return `<div class="seg demo-only" role="group" aria-label="Demo only: preview the page as a role" data-tip="Demo only: preview by role">
    <button type="button" data-viewas="contributor" aria-pressed="${S.viewAs === "contributor"}">As Contributor</button>
    <button type="button" data-viewas="approver" aria-pressed="${S.viewAs === "approver"}">As Approver</button></div>`;
}
function bindViewAs(rerender) {
  $$("[data-viewas]").forEach(b => b.onclick = () => { S.viewAs = b.dataset.viewas; try { localStorage.setItem("kx-viewas", S.viewAs); } catch (e) {} rerender(); });
}

/* Account menu, grouped: who you are, your settings, language as one two-way choice, then help and sign-out.
   Work Locally moved to the sidebar, next to your computers. */
function accountMenuItems() {
  const setLang = l => { S.lang = l; document.documentElement.lang = l; toast(l === "en" ? "Language: English" : "Bahasa: Indonesia. Teks demo ini hanya dalam bahasa Inggris"); };
  return [
    { head: `${av("ay")}<span><b>Ardian Yusuf</b><small>ardian@refactory.id</small><small>Engineering Contributor</small></span>` }, "-",
    { label: "Settings", icon: "settings", run: () => { location.hash = "general"; } },
    { choice: "Language", options: [["EN", "English", S.lang === "en", () => setLang("en")], ["ID", "Bahasa Indonesia", S.lang === "id", () => setLang("id")]] }, "-",
    { label: "Support", icon: "life-buoy", run: supportDialog },
    { label: "Sign out", icon: "log-out", run: () => { S.loginStep = "idle"; location.hash = "login"; } },
  ];
}
function workspaceMenuItems() {
  return [{ label: "Refactory", icon: "check" }, "-",
    { label: "Manage workspace", icon: "settings-2", run: () => { location.hash = "general"; } },
    { label: "Create workspace", icon: "plus", run: createWorkspace }];
}
