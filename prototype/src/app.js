/* ---------- router ----------
   Hash routes. "settings" and "customize" are reserved by the host, so sections use their own names. */
const ROUTES = {
  overview: [pageOverview, bindOverview, "pitch", "Pitch"], foundations: [pageFoundations, bindDocs, "foundations", "Design system"],
  components: [pageComponents, bindCatalog, "components", "Komponen"], code: [pageCode, bindCode, "code", "Kode"],
  login: [pageLogin, bindLogin, "login", "Sign in"],
  work: [pageWork, bindWork, "demo", "Work In Progress"], initiative: [pageInitiative, bindInitiative, "demo", () => (iniById[S.cur] || INITIATIVES[0]).title],
  session: [pageSession, bindSession, "demo", "TKT-1 session"], activities: [pageActivities, bindActivities, "demo", "Activities"],
  issues: [pageIssues, bindSysFilter, "demo", "Issues"], releases: [pageReleases, bindReleases, "demo", "Releases"], leaders: [pageLeaders, () => {}, "demo", "Leaders"],
  runtimes: [pageRuntimes, bindRuntimes, "demo", "Runtimes · Customize"], runtime: [pageRuntime, bindRuntime, "demo", () => (rtById[S.rt] || RUNTIMES[0]).name],
  access: [pageAccess, bindAccess, "demo", "Access · Customize"], models: [pageModels, () => { bindCz(); bindLock(); }, "demo", "Models · Customize"],
  context: [pageContext, bindContext, "demo", "Context · Customize"], skills: [pageSkills, bindSkills, "demo", "Skills · Customize"],
  tools: [pageTools, bindTools, "demo", "Tools · Customize"], mcps: [pageMcps, bindMcps, "demo", "MCPs · Customize"],
  connectors: [pageConnectors, bindConnectors, "demo", "Connectors · Customize"], vcs: [pageVcs, bindVcs, "demo", "VCS Connectors · Customize"],
  operations: [pageOperations, bindOperations, "demo", "Operations · Customize"],
  general: [pageGeneral, bindGeneral, "demo", "General · Settings"], plan: [pagePlan, bindPlan, "demo", "Plan · Settings"], usage: [pageUsage, bindUsage, "demo", "Usage · Settings"],
  budgets: [pageBudgets, bindLock, "demo", "Budgets · Settings"], payments: [pagePayments, bindPayments, "demo", "Payments · Settings"],
};
function topbar(section) {
  const links = [["overview", "Pitch", "pitch"], ["foundations", "Design system", "foundations"], ["components", "Komponen", "components"], ["code", "Kode", "code"], ["work", "Demo app", "demo"], ["login", "Sign in", "login"]];
  return `<header class="pbar" id="pbar"><div class="pbar-in"><a href="#overview" class="brand" style="text-decoration:none;color:inherit"><span class="brand-mark">K</span>Konteks<small>redesign pitch</small></a>
    <nav class="pnav" aria-label="Pitch sections">${links.map(([h, l, k]) => `<a href="#${h}" ${section === k ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
    <div class="pbar-tools"><span class="synthetic">Data contoh</span><button class="btn btn-ghost btn-sm" id="fontBtn" aria-haspopup="menu" data-tip="Bandingkan huruf">${ic("type")}<span class="hide-sm">${FONTS.find(f => f[0] === S.font)[1]}</span></button><button class="btn btn-ghost btn-icon btn-sm" id="soundBtn" aria-pressed="${S.sound}" aria-label="${S.sound ? "Sounds on" : "Sounds off"}" data-tip="${S.sound ? "Sounds on" : "Sounds off"}">${ic(S.sound ? "volume-2" : "volume-x")}</button><button class="btn btn-ghost btn-icon btn-sm" id="themeBtn" aria-label="Switch theme" data-tip="Switch theme">${ic("sun-moon")}</button>${section === "demo" ? `<button class="btn btn-ghost btn-icon btn-sm" id="pbHide" aria-label="Hide the pitch bar" data-tip="Hide the pitch bar">${ic("chevron-up")}</button>` : ""}</div></div></header>
    ${section === "demo" ? `<button class="pb-tab" type="button" id="pbShow" aria-label="Show the pitch bar: Pitch, Design system, Komponen, Kode" aria-controls="pbar">${ic("chevron-down")}<span>Pitch</span></button>` : ""}`;
}
try { S.pbar = localStorage.getItem("kx-pbar") === "on"; } catch (e) { S.pbar = false; }
function bindTopbar() {
  $("#fontBtn").onclick = e => menu(e.currentTarget, FONTS.map(([k, l, note]) => ({ label: l + (note ? " · " + note : ""), icon: S.font === k ? "check" : "", run: () => setFont(k) })));
  const setPb = on => { S.pbar = on; try { localStorage.setItem("kx-pbar", on ? "on" : ""); } catch (e) {} document.documentElement.classList.toggle("pb-off", !on && !!$("#pbShow")); if (on) { document.documentElement.classList.add("pb-in"); setTimeout(() => document.documentElement.classList.remove("pb-in"), 300); } (on ? $("#pbHide") : $("#pbShow"))?.focus(); };
  $("#pbHide") && ($("#pbHide").onclick = () => setPb(false));
  $("#pbShow") && ($("#pbShow").onclick = () => setPb(true));
  /* On a phone the pull tab would sit on the banner, so the same control lives in the app's top bar. */
  if ($("#pbShow") && $("header.top") && !$("#pbShowM")) { $("header.top").insertAdjacentHTML("beforeend", `<button class="btn btn-ghost btn-sm pb-tab-m" type="button" id="pbShowM" aria-label="Show the pitch bar">${ic("presentation")}Pitch</button>`); drawIcons(); $("#pbShowM").onclick = () => setPb(true); }
  $("#soundBtn").onclick = () => { setSound(!S.sound); render(); };
  $("#themeBtn").onclick = () => { const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; };
}
function render() {
  /* Sub-routes: "#access/people" gives every Access tab its own URL (UX-032). */
  const [key, sub] = (location.hash.slice(1) || "overview").split("/");
  if (key === "access") S.accessTab = ACCESS_TABS.some(([k]) => k === sub) ? sub : "overview";
  /* "#initiative/activities": the same detail page, opened from Activities, goes back there (live: ?from=activities). */
  if (key === "initiative") S.iniFrom = sub === "activities" ? "activities" : "work";
  /* Older links to the first B and C designs land on their replacements. */
  if (key === "login" && (sub === "receipt" || sub === "flow")) { history.replaceState(null, "", "#login/" + (sub === "receipt" ? "night" : "split")); return render(); }
  if (key === "login") S.loginVar = ["night", "split"].includes(sub) ? sub : "";
  const badSub = sub && !(key === "access" && ACCESS_TABS.some(([k]) => k === sub)) && !(key === "initiative" && sub === "activities") && !(key === "login" && ["night", "split"].includes(sub));
  const known = badSub ? null : ROUTES[key];
  const [page, bind, section, title] = known || [notFound, () => {}, "demo", "Not found"];
  /* The pitch bar steps aside in the demo app so it reads like the product; a pull tab brings it back. */
  document.documentElement.classList.toggle("pb-off", section === "demo" && !S.pbar);
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
