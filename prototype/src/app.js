/* ---------- router ----------
   Hash routes. "settings" and "customize" are reserved by the host, so sections use their own names. */
const ROUTES = {
  overview: [pageOverview, bindOverview, "pitch", "Pitch"], foundations: [pageFoundations, bindDocs, "foundations", "Design system"],
  components: [pageComponents, bindCatalog, "components", "Komponen"], code: [pageCode, bindCode, "code", "Kode"],
  login: [pageLogin, bindLogin, "login", "Sign in"],
  work: [pageWork, bindWork, "demo", "Work In Progress"], initiative: [pageInitiative, bindInitiative, "demo", () => (iniById[S.cur] || INITIATIVES[0]).title],
  session: [pageSession, bindSession, "demo", "TKT-1 session"], activities: [pageActivities, bindActivities, "demo", "Activities"],
  issues: [pageIssues, bindSysFilter, "demo", "Issues"], releases: [pageReleases, bindReleases, "demo", "Releases"], release: [pageRelease, bindRelease, "demo", () => { const r = relById[S.rel] || RELEASES[0]; return r.status === "candidate" ? "Release candidate" : r.version; }], leaders: [pageLeaders, () => {}, "demo", "Leaders"],
  runtimes: [pageRuntimes, bindRuntimes, "demo", "Runtimes · Customize"], runtime: [pageRuntime, bindRuntime, "demo", () => (rtById[S.rt] || RUNTIMES[0]).name],
  access: [pageAccess, bindAccess, "demo", "Access · Customize"], models: [pageModels, () => { bindCz(); bindLock(); }, "demo", "Models · Customize"],
  context: [pageContext, bindContext, "demo", "Context · Customize"], skills: [pageSkills, bindSkills, "demo", "Skills · Customize"],
  tools: [pageTools, bindTools, "demo", "Tools · Customize"], mcps: [pageMcps, bindMcps, "demo", "MCPs · Customize"],
  connectors: [pageConnectors, bindConnectors, "demo", "Connectors · Customize"], vcs: [pageVcs, bindVcs, "demo", "VCS Connectors · Customize"],
  operations: [pageOperations, bindOperations, "demo", "Operations · Customize"],
  general: [pageGeneral, bindGeneral, "demo", "General · Settings"], plan: [pagePlan, bindPlan, "demo", "Plan · Settings"], usage: [pageUsage, bindUsage, "demo", "Usage · Settings"],
  budgets: [pageBudgets, bindLock, "demo", "Budgets · Settings"], payments: [pagePayments, bindPayments, "demo", "Payments · Settings"],
};
/* ---------- the four views ----------
   The proposal is four separate addresses: / (landing page, built elsewhere), /design-system, /login and /app.
   This one file serves the last three; the path decides which view it is, the hash picks a page inside it. */
const VIEW = (() => { const p = location.pathname.replace(/\/+$/, ""); return p.endsWith("/login") ? "login" : p.endsWith("/app") ? "app" : "ds"; })();
const VIEW_HOME = { ds: "overview", login: "login", app: "work" };
const viewOf = section => ["pitch", "foundations", "components", "code"].includes(section) ? "ds" : section === "login" ? "login" : "app";
function viewUrl(view, key, sub) {
  if (view === "ds") return "/design-system" + (key === "overview" ? "" : "#" + key);
  if (view === "login") return "/login" + (sub ? "#" + sub : "");
  return "/app" + (key === "work" && !sub ? "" : "#" + key + (sub ? "/" + sub : ""));
}
function topbar(section) {
  if (VIEW !== "ds") return "";
  const links = [["overview", "Pitch", "pitch"], ["foundations", "Foundations", "foundations"], ["components", "Komponen", "components"], ["code", "Kode", "code"]];
  return `<header class="pbar" id="pbar"><div class="pbar-in"><a href="#overview" class="brand" style="text-decoration:none;color:inherit"><span class="brand-mark">K</span>Konteks<small>design system</small></a>
    <nav class="pnav" aria-label="Design system">${links.map(([h, l, k]) => `<a href="#${h}" ${section === k ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
    <div class="pbar-tools"><span class="synthetic">Data contoh</span><button class="btn btn-ghost btn-sm" id="fontBtn" aria-haspopup="menu" data-tip="Bandingkan huruf">${ic("type")}<span class="hide-sm">${FONTS.find(f => f[0] === S.font)[1]}</span></button><button class="btn btn-ghost btn-icon btn-sm" id="soundBtn" aria-pressed="${S.sound}" aria-label="${S.sound ? "Sounds on" : "Sounds off"}" data-tip="${S.sound ? "Sounds on" : "Sounds off"}">${ic(S.sound ? "volume-2" : "volume-x")}</button><button class="btn btn-ghost btn-icon btn-sm" id="themeBtn" aria-label="Switch theme" data-tip="Switch theme">${ic("sun-moon")}</button></div></div></header>`;
}
function bindTopbar() {
  if (!$("#pbar")) return;
  $("#fontBtn").onclick = e => menu(e.currentTarget, FONTS.map(([k, l, note]) => ({ label: l + (note ? " · " + note : ""), icon: S.font === k ? "check" : "", run: () => setFont(k) })));
  $("#soundBtn").onclick = () => { setSound(!S.sound); render(); };
  $("#themeBtn").onclick = () => { const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; try { localStorage.setItem("kx-theme", r.dataset.theme); } catch (e) {} };
}
function render() {
  /* Sub-routes: "#access/people" gives every Access tab its own URL (UX-032). */
  let [key, sub] = location.hash.slice(1).split("/");
  /* Inside /login the hash is the variant: /login#night. */
  if (VIEW === "login" && (!key || ["night", "split", "receipt", "flow"].includes(key))) { sub = key; key = "login"; }
  if (!key) key = VIEW_HOME[VIEW];
  /* A page that belongs to another view (an old link, or "#login" from Sign out) moves to that view's own address. */
  if (ROUTES[key] && viewOf(ROUTES[key][2]) !== VIEW) { location.replace(viewUrl(viewOf(ROUTES[key][2]), key, sub)); return; }
  if (key === "access") S.accessTab = ACCESS_TABS.some(([k]) => k === sub) ? sub : "overview";
  /* "#initiative/activities": the same detail page, opened from Activities, goes back there (live: ?from=activities). */
  if (key === "initiative") S.iniFrom = sub === "activities" ? "activities" : "work";
  /* Older links to the first B and C designs land on their replacements. */
  if (key === "login" && (sub === "receipt" || sub === "flow")) { history.replaceState(null, "", "#" + (sub === "receipt" ? "night" : "split")); return render(); }
  if (key === "login") S.loginVar = ["night", "split"].includes(sub) ? sub : "";
  const badSub = sub && !(key === "access" && ACCESS_TABS.some(([k]) => k === sub)) && !(key === "initiative" && sub === "activities") && !(key === "login" && ["night", "split"].includes(sub));
  const known = badSub ? null : ROUTES[key];
  const [page, bind, section, title] = known || [notFound, () => {}, "demo", "Not found"];
  /* Only the design system has the top bar; sign in and the demo app read like the product. */
  document.documentElement.classList.toggle("pb-off", VIEW !== "ds");
  if (render._last !== key + (sub ? "/" + sub : "")) { $$(".scrim,.drawer,.dialog,.menu,.floatpop,.pop-fixed").forEach(e => e.remove()); document.removeEventListener("keydown", overlayKey); }
  const keepScroll = render._last === key + (sub ? "/" + sub : ""), y = scrollY;
  /* Loading state (DS-10): an initiative opened for the first time shows a skeleton shaped like the page, not "Loading…". */
  if (key === "initiative" && S.iniLoaded !== S.cur) {
    document.getElementById("root").innerHTML = topbar(section) + shell(iniBack()[0], iniBack()[1], iniSkeleton());
    drawIcons(); bindShell(); bindTopbar(); render._last = key;
    document.title = "Loading · Konteks"; document.documentElement.lang = S.lang === "id" ? "id" : "en";
    clearTimeout(render._sk); render._sk = setTimeout(() => { S.iniLoaded = S.cur; if (location.hash.slice(1).split("/")[0] === "initiative") render(); }, 550);
    return;
  }
  document.getElementById("root").innerHTML = topbar(section) + page();
  drawIcons(); bindShell(); bind();
  bindTopbar();
  scrollTo(0, keepScroll ? y : 0);
  render._last = key + (sub ? "/" + sub : "");
  document.title = (typeof title === "function" ? title() : title) + " · Konteks";
  document.documentElement.lang = S.lang === "id" ? "id" : "en";
}
/* Unknown route: a real 404 inside the shell (UX-032), not the Runtimes page. */
function iniSkeleton() {
  const l = (w, h = 12) => `<span class="sk" style="width:${w};height:${h}px"></span>`;
  return `<div class="page-col" aria-busy="true" aria-label="Loading the initiative"><div style="display:grid;gap:10px;padding-top:8px">${l("62%", 22)}${l("38%")}</div>
    <div style="display:flex;gap:8px">${l("64px", 26)}${l("88px", 26)}${l("76px", 26)}</div>
    <div class="dc" style="padding:16px;display:grid;gap:10px">${l("30%")}${l("70%", 16)}${l("92%")}${l("84%")}<div style="display:flex;gap:8px">${l("96px", 32)}${l("72px", 32)}</div></div>
    <div style="display:grid;gap:8px">${l("24%", 14)}${l("100%", 64)}</div></div>`;
}
function notFound() {
  return shell("", `<h2 class="top-t">Not found</h2>`, `<div class="notfound"><h3>This page doesn't exist</h3><p>Nothing lives at <code>#${esc(location.hash.slice(1))}</code>. The link may be from an older version.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-primary btn-sm" href="#work">Work In Progress</a><a class="btn btn-ghost btn-sm" href="#runtimes">Customize</a></div></div>`);
}
/* Typeface comparison: swaps --sans (and --mono for superfamilies) across the whole prototype. */
const FONTS = [["inter", "Inter", "usulan"], ["plex", "IBM Plex Sans", "rekomendasi"], ["figtree", "Figtree", ""], ["geist", "Geist", ""], ["dmsans", "DM Sans", "aplikasi sekarang"]];
function setFont(k) { S.font = k; if (k === "inter") delete document.documentElement.dataset.font; else document.documentElement.dataset.font = k; try { localStorage.setItem("kx-font", k); } catch (e) {} render(); }
try { S.font = localStorage.getItem("kx-font") || "inter"; } catch (e) { S.font = "inter"; }
if (!FONTS.some(f => f[0] === S.font)) S.font = "inter";
if (S.font !== "inter") document.documentElement.dataset.font = S.font;
addEventListener("hashchange", render);
render();
