/* ---------- Work In Progress ---------- */
const WHO = i => i.driver === "ay" ? (i.kind === "estimate" && S.viewAs !== "approver" && !S.approved ? "Needs approval" : "Needs you") : "Needs " + PEOPLE[i.driver].name.split(" ")[0];
const toneIc = { decision: "corner-down-right", blocked: "octagon-alert", waiting: "clock", running: "loader" };
const toneCls = { decision: "ok", blocked: "danger", waiting: "", running: "" };

/* The action a person may take from the list. Approve is shown only to someone allowed to approve (UX-002);
   everyone else sees who can, as text, not as a button. */
function rowAction(i) {
  if (i.tone === "running") return "";
  if (i.kind === "estimate" && S.viewAs !== "approver") return `<span class="gate">${ic("lock")}Maya Lestari approves</span>`;
  const primary = i.tone === "decision" || i.tone === "blocked";
  return `<button class="btn btn-sm ${primary && i.driver === "ay" ? "btn-primary" : ""}" type="button" data-act="${i.id}">${esc(i.action)}${i.kind === "estimate" && i.quote ? `<span class="cost">${i.quote[0]}</span>` : ""}</button>`;
}
/* The live list row, kept for the catalog's comparison; the page itself uses wipCard. */
function rowHtml(i) {
  return `<div class="row" data-go="${i.id}">
    ${sg(i.stage, i.tone)}
    <span class="row-main"><a class="row-title" href="#initiative" data-ini="${i.id}" title="${esc(i.title)}">${esc(i.title.replace(/[\s,.;:]+$/, ""))}</a>
      <span class="row-why ${toneCls[i.tone]}" title="${esc(i.cause)}">${ic(toneIc[i.tone])}<span>${esc(i.cause)}${i.more ? ` · <button class="linkbtn" type="button" data-more="${i.id}">+1 more</button>` : ""}</span></span></span>
    <span class="row-meta"><span class="c-new">${i.fresh ? `<span class="newup" title="${i.fresh} new updates since you last looked"><span class="unread"></span>${i.fresh} new</span>` : ""}</span>
      <span class="c-sys">${sysTag(i.sys)}</span><span class="c-stage hide-sm">${i.stage}</span><span class="wait" title="Waiting ${i.wait}">${i.wait}</span>${av(i.driver)}
      <span class="row-act">${rowAction(i)}</span></span>
  </div>`;
}

/* Work In Progress as a stream, the sibling of Activities: one card per initiative that waits on a person.
   Each card names the next move, shows what is being decided (the estimate, the delivery bar, the agent's
   summary) and carries the one action the viewer may take. Same fields as the live list, nothing invented. */
const deliveryOf = i => ACTIVITY.find(e => e.ini === i.id && e.kind === "delivering");
function wipBody(i, mine) {
  if (i.kind === "estimate" && i.quote) return `<div class="tl-quote"><div><span>Story Points, at most</span><b>${i.quote[0]}</b></div><div><span>Model cost on your subscription</span><b>${i.quote[1]}</b></div></div>`;
  const e = i.tone === "running" && deliveryOf(i);
  if (e) return `<div class="tl-prog" role="img" aria-label="${e.done} of ${e.of} tickets merged, ${e.ticket} delivering">${Array.from({ length: e.of }, (_, n) => `<span class="${n < e.done ? "done" : n === e.done ? "now" : ""}"></span>`).join("")}</div>`;
  /* Only your own cards carry the agent's summary; follow-along cards stay to the cause line. */
  return mine ? `<p class="tl-text wip-detail">${esc(i.detail)}</p>` : "";
}
function wipCard(i, mine) {
  /* The node is the driver, as live; an estimate the viewer cannot approve says it needs approval and the gate names who. */
  const who = i.driver === "ay" ? (i.kind === "estimate" && !mine ? "Needs approval" : "Your move") : `${PEOPLE[i.driver].name.split(" ")[0]}'s move`;
  return `<li class="tl-item wip-item ${mine ? "mine" : ""}" data-go="${i.id}"><span class="tl-node">${av(i.driver)}</span><article class="tl-card" aria-label="${esc(i.title)}: ${esc(i.cause)}">
    <header class="tl-h"><p class="tl-t wip-t"><a href="#initiative" data-ini="${i.id}">${esc(i.title.replace(/[\s,.;:]+$/, ""))}</a>${i.fresh ? `<span class="newup" title="${i.fresh} new updates since you last looked"><span class="unread"></span>${i.fresh} new</span>` : ""}</p><span class="wip-wait" title="Waiting ${i.wait}">${ic("clock")}waiting ${i.wait}</span></header>
    <p class="wip-why ${toneCls[i.tone]}">${ic(toneIc[i.tone])}<span>${esc(i.cause)}${i.more ? ` · <button class="linkbtn" type="button" data-more="${i.id}">+1 more</button>` : ""}</span></p>
    ${wipBody(i, mine)}
    <footer class="tl-f"><div class="tl-meta"><span class="wip-who ${mine ? "you" : ""}">${esc(who)}</span>${sysTag(i.sys)}${st("muted", i.stage)}<a href="#initiative" data-ini="${i.id}" class="tl-upd">${i.updates} updates</a></div>${rowAction(i)}</footer>
  </article></li>`;
}

function pageWork() {
  const list = INITIATIVES.filter(i => !S.sys || i.sys === S.sys);
  const mine = list.filter(actsNow);
  const others = list.filter(i => !actsNow(i) && i.tone !== "running");
  const moving = list.filter(i => i.tone === "running");
  const group = (title, note, items, isMine) => items.length ? `<li class="tl-day wip-gh"><h2>${title}<span class="count">${items.length}</span><span>${note}</span></h2></li>${items.map(i => wipCard(i, isMine)).join("")}` : "";
  const banner = S.bannerGone ? "" : `<div class="banner" id="connBanner">${ic("plug-zap")}<span class="grow"><b style="color:var(--ink);font-weight:500">Rentify was connected</b> from sari@debian on 30 Sep 2026.</span><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Dismiss" id="connX">${ic("x")}</button></div>`;
  const head = `<div class="pagehead">${phead("Work In Progress", "What people are driving. Agents do the rest.", `<button class="btn btn-primary" id="newInit">${ic("plus")}New initiative</button>`)}${sysFilter()}${banner}</div>`;
  const recent = ACTIVITY.filter(e => !S.sys || iniById[e.ini].sys === S.sys).sort((a, b) => a.m - b.m).slice(0, 4);
  const rail = `<aside class="act-rail wip-rail" aria-label="Around your work">
    <section class="rail-now"><h3><span class="dot"></span>Agents are working<span class="count">${moving.length}</span></h3>
      ${moving.length ? `<ul class="now-list">${moving.map(i => { const e = deliveryOf(i); return `<li class="live"><a href="#initiative" data-ini="${i.id}"><span class="av av-kx" title="Konteks">${ic("bot")}</span><span><b>${esc(i.title)}</b><small>${esc(i.cause).replace(/(rf-\d+)/g, '<span class="nw">$1</span>')}</small>${e ? `<span class="tl-prog" role="img" aria-label="${e.done} of ${e.of} tickets merged">${Array.from({ length: e.of }, (_, n) => `<span class="${n < e.done ? "done" : n === e.done ? "now" : ""}"></span>`).join("")}</span>` : ""}</span><time>${i.wait}</time></a></li>`; }).join("")}</ul>` : `<p class="hint">No agent is delivering right now.</p>`}</section>
    <section class="rail-recent"><h3>Moved recently</h3>
      ${recent.length ? `<ul class="now-list">${recent.map(e => { const i = iniById[e.ini]; return `<li><a href="#initiative" data-ini="${i.id}">${actAv(e.p)}<span><b>${actWho(e.p)}</b> ${ACT_VERB[e.kind](e).replace(/ (in|for)$/, "")}<small>${esc(i.title)}</small></span>${tlTime(e.m)}</a></li>`; }).join("")}</ul>` : `<p class="hint">Nothing moved yet.</p>`}
      <a class="rail-more" href="#activities">All activity${ic("arrow-right")}</a></section>
  </aside>`;
  const feed = (mine.length + others.length) ? `<ol class="tl wip-tl" aria-label="Work In Progress">${group("Needs you", "You drive these", mine, true)}${group("Needs someone else", "Follow along; the named person acts", others, false)}</ol>`
    : moving.length ? `<div class="tl-empty"><h3>Nothing waits on a person</h3><p>Agents are delivering; you'll be asked when something needs a decision.</p></div>`
    : `<div class="tl-empty"><h3>Nothing in progress in ${esc(sysById[S.sys].name)}</h3><p>Start an initiative and a planning session opens behind it, ready to read your notes.</p><button class="btn btn-sm" id="newInit2">${ic("plus")}New initiative</button></div>`;
  return shell("work", "", head + `<div class="act wip"><div class="act-feed">${feed}</div>${rail}</div>`, { flush: true });
}
function bindWork() {
  bindSysFilter();
  $("#newInit")?.addEventListener("click", () => newInitiative()); $("#newInit2")?.addEventListener("click", () => newInitiative());
  $("#connX")?.addEventListener("click", () => { S.bannerGone = true; try { localStorage.setItem("kx-conn-banner", "gone"); } catch (e) {} $("#connBanner").remove(); });
  $$("[data-ini]").forEach(a => a.onclick = () => { S.cur = a.dataset.ini; });
  /* The whole card opens the initiative; its own links and buttons keep their job. */
  $$("[data-go]").forEach(r => r.onclick = e => { if (e.target.closest("button,a,summary")) return; S.cur = r.dataset.go; location.hash = "initiative"; });
  bindMore();
  $$("[data-act]").forEach(b => b.onclick = () => runAction(iniById[b.dataset.act], b));
}

/* Actions from a card run as they do live. Only Approve from the list first shows the cost (UX-003),
   because the list row doesn't show the numbers; on the detail page the numbers are on the card. */
function runAction(i, btn) {
  if (i.kind === "estimate") return approveDialog(() => { S.approved = true; S.cur = i.id; toast("Approved up to 2.15 SP. TKT-1's delivery started on rf-01"); location.hash = "initiative"; });
  const busy = msg => { if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${esc(i.action)}`; } setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = i.action; } toast(msg); }, 700); };
  if (i.kind === "plan-ready") return busy("Creating tickets. The breakdown will be ready for review");
  if (i.kind === "no-plan") return busy("Planning started again");
  if (i.kind === "stopped") return busy("TKT-1 continues on rf-01");
  S.cur = i.id; location.hash = "initiative";
  if (i.kind === "breakdown") setTimeout(() => breakdownDrawer(i), 50);
  if (i.kind === "stalled") setTimeout(() => updatesDrawer(i), 50);
}
function approveDialog(onOk) {
  dialog("Approve TKT-1's delivery?", `Refresh the Support API README runs on rf-01. Nothing runs until you approve; only what is used is settled, up to the limit.</p>
    <div class="quote"><div class="qrow"><span>Story Points, at most</span><b>2.15 SP</b></div><div class="qrow"><span>Model cost on your subscription</span><b>$0.57 – $2.02</b></div></div><p>`,
    "Approve", onOk, false, { confirmHtml: `${ic("check")}Approve<span class="cost">2.15 SP</span>` });
}
function newInitiative(pre = S.sys) {
  const d = modal("New initiative", `
    <div class="field"><label for="niBody">What is this initiative about?</label><textarea id="niBody" class="textarea" data-autosize rows="5" placeholder="The outcome you want, what is in scope, and how you'll know it's done"></textarea><span class="hint">Konteks names the initiative from the plan it writes.</span></div>
    <div class="field"><span class="flabel" id="niSysL">Software System</span><div class="combo" id="niSys" style="width:100%"><button class="btn combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="niSysL" ${pre ? `data-val="${esc(sysById[pre].name)}"` : ""}><span class="${pre ? "" : "ph"}">${pre ? esc(sysById[pre].name) : "Choose a System"}</span>${ic("chevrons-up-down")}</button></div></div>
    <div><button class="btn btn-ghost btn-sm" type="button" id="niAttach">${ic("paperclip")}Attach meeting transcript</button><div class="atts" id="niAtts" style="margin-top:6px"></div><input type="file" id="niFile" accept=".txt,.md,.vtt,.pdf" hidden></div>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="niStart" disabled>Start</button>`,
    { sub: "A planning session opens behind it, ready to read your notes." });
  let sys = pre ? sysById[pre].name : "";
  const check = () => { d.querySelector("#niStart").disabled = !(d.querySelector("#niBody").value.trim() && sys); };
  comboBind("niSys", [["", SYSTEMS.map(s => [s.name, ""])]], n => { sys = n; check(); });
  autosize(d); d.querySelector("#niBody").addEventListener("input", check);
  d.querySelector("#niAttach").onclick = () => d.querySelector("#niFile").click();
  d.querySelector("#niFile").onchange = e => { [...e.target.files].forEach(f => d.querySelector("#niAtts").insertAdjacentHTML("beforeend", `<span class="att">${ic("file-text")}<b>${esc(f.name)}</b><span>${Math.max(1, Math.round(f.size / 1024))} KB</span><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove ${esc(f.name)}" onclick="this.closest('.att').remove()">${ic("x")}</button></span>`)); drawIcons(); };
  d.querySelector("#niStart").onclick = () => { closeOverlay(); toast("Planning started in " + sys); };
  d.querySelector("#niBody").focus();
}
function autosize(root) { $$("[data-autosize]", root).forEach(t => { const fit = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; }; t.addEventListener("input", fit); fit(); }); }

/* Create System: the live three ways to start. Only "Discover" reads connections; "Create an empty System" is a
   name and an optional description, and its button says Save, as live. */
const CS_HOW = [
  ["discover", "Discover what we already have", "Read your connections. The agent proposes Systems and you accept each one."],
  ["scratch", "Start from nothing", "No code yet. The agent proposes a System and its repositories. You approve before anything is created."],
  ["empty", "Create an empty System", "Just a name. Add Components later."]];
function createSystem() {
  const d = modal("New System", `
    <fieldset class="fs"><legend class="flabel">How do you want to start?</legend>
      ${CS_HOW.map(([k, t, s], n) => `<label class="optcard"><input type="radio" name="csHow" value="${k}" ${n ? "" : "checked"}><span><b>${t}</b><small>${s}</small></span></label>`).join("")}</fieldset>
    <div id="csMore"></div>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="csGo">Start</button>`, { sub: "One product your team owns, like Checkout or Payments. It holds the product's parts and repositories." });
  const more = d.querySelector("#csMore"), go = d.querySelector("#csGo");
  const how = () => d.querySelector("input[name=csHow]:checked").value;
  const sync = () => { const k = how(); go.disabled = k === "discover" ? !$$(".msel input:checked", d).length : k === "empty" ? !d.querySelector("#csName").value.trim() : false; };
  const show = () => {
    const k = how();
    more.innerHTML = k === "discover" ? `<div class="field"><span class="flabel">Connections to read</span>${connPicker()}<span class="hint">Only your own and organization connections are selected. A teammate's connection uses their credentials, so pick it on purpose.</span></div>
      <div class="setrow"><span class="hint grow">Read a few files per repository: at most 32 files each, plus up to 40 package manifests, through your connection. It never clones.</span><button class="btn btn-ghost btn-sm" type="button" id="csDepth">Change</button></div>
      <div class="setrow"><span class="hint grow">Your Planning model inspects the repositories.</span><a class="btn btn-ghost btn-sm" href="#models">Change</a></div>`
      : k === "empty" ? `<div class="field"><label for="csName">Name</label><input id="csName" class="input" placeholder="e.g. My Project"></div>
      <div class="field"><label for="csDesc">Description <span class="req-m">optional</span></label><input id="csDesc" class="input" placeholder="What this System is"></div>` : "";
    go.textContent = k === "empty" ? "Save" : "Start";
    if (k === "discover") { bindConnPicker(d); $$(".msel input", d).forEach(b => b.addEventListener("change", sync)); $$("[data-msall],[data-msnone]", d).forEach(b => b.addEventListener("click", sync));
      d.querySelector("#csDepth").onclick = e => menu(e.currentTarget, [{ label: "Read a few files per repository", icon: "check" }, { label: "Read more files", icon: "" }]); }
    if (k === "empty") d.querySelector("#csName").oninput = sync;
    drawIcons(); sync();
  };
  $$("input[name=csHow]", d).forEach(r => r.onchange = show); show();
  go.onclick = () => { const k = how(); closeOverlay(); toast(k === "discover" ? "Konteks is reading the selected connections" : k === "scratch" ? "Konteks is proposing a System. You approve before anything is created" : "System saved"); };
}
function connPicker() {
  return `<div class="msel"><div class="pop-search">${ic("search")}<input placeholder="Filter connections" aria-label="Filter connections" data-msq></div>
    <div class="pop-foot" style="border-top:0;border-bottom:1px solid var(--line)"><span data-mscount></span><span style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm" type="button" data-msall>Select all</button><button class="btn btn-ghost btn-sm" type="button" data-msnone>Clear</button></span></div>
    <div class="opts">${VCS.map(([n, p, u, , o], i) => `<label class="opt"><input type="checkbox" ${o === "Ardian Yusuf" || o === "Organization" ? "checked" : ""}><span><b style="font-weight:500">${esc(n)}</b><small>${p} · ${esc(u.replace("https://", ""))}</small></span><span class="owner">${o === "Ardian Yusuf" ? "You" : esc(o)}</span></label>`).join("")}</div></div>`;
}
function bindConnPicker(root) {
  const boxes = () => $$(".msel input[type=checkbox]", root), cnt = () => { const b = boxes(); root.querySelector("[data-mscount]").textContent = `${b.filter(x => x.checked).length} of ${b.length} selected`; };
  boxes().forEach(b => b.onchange = cnt); cnt();
  root.querySelector("[data-msall]").onclick = () => { boxes().filter(b => !b.closest("label").hidden).forEach(b => b.checked = true); cnt(); };
  root.querySelector("[data-msnone]").onclick = () => { boxes().forEach(b => b.checked = false); cnt(); };
  root.querySelector("[data-msq]").oninput = e => { const v = e.target.value.toLowerCase(); $$(".msel label.opt", root).forEach(l => l.hidden = !l.textContent.toLowerCase().includes(v)); };
}
function editSystem(name) {
  const d = drawer("Edit System", `<div class="props"><div class="prop"><span>System</span><div>${ic("box")}${esc(name)}</div></div></div>
    <div><button class="btn btn-sm" type="button" id="esMap">${ic("map")}Open System map</button></div>
    <div class="danger-zone"><div><b>Delete System</b><p>Removes the System and its map. Closed initiatives stay in the audit log.</p></div><button class="btn btn-danger btn-sm" type="button" id="esDel">Delete System…</button></div>`);
  d.querySelector("#esDel").onclick = () => typeConfirm(name, () => { while (layers().length) closeOverlay(); S.sys = null; toast("System deleted"); render(); });
  d.querySelector("#esMap").onclick = () => systemMap(name);
}

/* ---------- Initiative detail: same layout as live (header, PRD / Breakdown / Updates, attention card, notes) ---------- */
function attentionCard(i) {
  const can = S.viewAs === "approver";
  if (i.kind === "running" || (i.kind === "estimate" && S.approved)) return `<div class="dc waiting"><div class="dc-top">${st("info", "Delivering")}<span>${i.kind === "running" ? "TKT-2 · on rf-01 · running 12m" : "TKT-1 · started just now on rf-01"}</span></div>
    <div class="dc-body"><div class="dc-title">${i.kind === "running" ? esc(i.head) : "TKT-1's delivery started"}</div><p class="dc-why">${i.kind === "running" ? esc(i.detail) + " You'll be asked when a pull request needs review." : "Approved up to 2.15 SP. The agent works on rf-01 and asks for review when the pull request is ready."}</p>
    <div class="dc-acts"><button class="btn btn-ghost btn-sm" type="button" data-hist>${ic("history")}Session history</button></div></div></div>`;
  const variant = i.tone === "blocked" ? ["blocked", st("danger", "Blocked")] : i.tone === "waiting" ? ["waiting", st("muted", "Waiting")] : ["decision", st("ok", "Needs a decision")];
  const ticket = i.ticket || (i.kind === "stopped" ? "TKT-1 · Profile and fix slow dashboard queries" : i.kind === "breakdown" ? "Breakdown" : "This initiative");
  let acts = "", extra = "";
  if (i.kind === "estimate") {
    extra = `<div class="quote" role="table" aria-label="Estimate"><div class="qrow" role="row"><span role="cell">Story Points, at most</span><b role="cell">2.15 SP</b></div><div class="qrow" role="row"><span role="cell">Model cost on your subscription</span><b role="cell">$0.57 – $2.02</b></div><div class="qrow" role="row"><span role="cell">Valid until</span><b role="cell" class="date">27 Oct 2026, 14.34</b></div></div>
      <details class="inline-disc"><summary>${ic("chevron-right")}Models for this delivery</summary><div class="disc-in"><div class="props">${[["Planning", "Auto · Default"], ["Engineering", "Codex · GPT-6-Luna"], ["Review", "Auto · Default"]].map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b}</div></div>`).join("")}</div><p class="hint">Change them for this delivery only and you get a fresh quote before approving.</p></div></details>`;
    acts = (can ? `<button class="btn btn-primary" id="approve">${ic("check")}Approve<span class="cost">2.15 SP</span></button>` : `<span class="gate">${ic("lock")}Approving needs the Delivery Approver role. Maya Lestari can approve.</span>`)
      + `<button class="btn" id="changeQ" aria-expanded="false" aria-controls="changeBox">Change</button>`;
  } else acts = `<button class="btn ${i.driver === "ay" ? "btn-primary" : ""}" type="button" data-act="${i.id}">${esc(i.action)}</button>`
    + (i.kind === "stalled" && i.tone === "blocked" && i.driver === "ay" ? `<button class="btn" type="button" data-reqrole="System Owner">${ic("hand")}Request access</button>` : "")
    + (i.more ? `<button class="btn btn-ghost" type="button" data-more="${i.id}">${ic("help-circle")}${esc(i.more)}</button>` : "");
  acts += `<button class="btn btn-ghost" type="button" data-hist>${ic("history")}Session history</button>`;
  return `<div class="dc ${variant[0]}"><div class="dc-top">${variant[1]}<span>${esc(ticket)} · waiting ${i.wait}</span></div>
    <div class="dc-body"><div class="dc-title">${esc(i.head)}</div>
      <p class="dc-why">${esc(i.detail)}${i.driver !== "ay" ? ` <b>Needs ${PEOPLE[i.driver].name}.</b>` : ""}</p>
      ${extra}<div class="dc-acts">${acts}</div><div id="changeBox" hidden></div></div></div>`;
}

/* Notes thread: chronological, a divider per day, the composer docked under the last note. */
function noteHtml(n) {
  const agent = n.who === "kx", name = agent ? "Konteks" : PEOPLE[n.who].name;
  const atts = n.atts ? `<div class="atts">${n.atts.map(([f, s]) => `<span class="att">${ic(/\.png|\.jpe?g/.test(f) ? "image" : "file-text")}<b>${esc(f)}</b><span>${s}</span></span>`).join("")}</div>` : "";
  const uses = n.uses ? `<div class="ar-uses">${n.uses.map(([k, u]) => `<span class="tag">${ic(k === "skill" ? "sparkles" : "wrench")}${k === "skill" ? "Skill" : "Tool"} · ${esc(u)}</span>`).join("")}</div>` : "";
  const trace = n.steps ? `<details class="trace ar-trace"><summary>${ic("chevron-right")}${n.steps.length} steps</summary><ol>${n.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></details>` : "";
  const reacts = agent ? "" : `<div class="reacts">${(n.re || []).map(([e, c]) => `<button class="react" type="button" aria-pressed="false" data-react>${e} <span>${c}</span></button>`).join("")}<button class="react react-add" type="button" aria-label="React">${ic("smile-plus")}</button><button class="btn btn-ghost btn-sm" type="button" data-comment>Comment</button></div>`;
  return `<article class="cmt ${n.r ? "reply" : ""}">${agent ? `<span class="agent-av">${ic("bot")}</span>` : av(n.who, 1)}<div class="cmt-b"><div class="cmt-h"><b>${name}</b>${agent ? '<span class="agent-chip">Agent</span>' : ""}${ago(n.m)}</div>${fmtMsg(n.text)}${atts}${uses}${trace}${reacts}</div></article>`;
}
function threadHtml(i) {
  let day = "";
  return threadFor(i).map(n => {
    const d = new Date(NOW - n.m * 60000), k = d.toDateString();
    const sep = k !== day ? `<div class="day-sep" role="separator"><span>${k === NOW.toDateString() ? "Today" : k === new Date(NOW - 86400000).toDateString() ? "Yesterday" : ""}${k === NOW.toDateString() || k === new Date(NOW - 86400000).toDateString() ? " · " : ""}${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}</span></div>` : "";
    day = k; return sep + noteHtml(n);
  }).join("");
}
/* The detail page is shared; where it was opened from decides the back link and the highlighted nav item. */
const iniBack = () => S.iniFrom === "activities" ? ["activities", `<a class="back" href="#activities">${ic("arrow-left")}Back to Activities</a>`] : ["work", `<a class="back" href="#work">${ic("arrow-left")}Back to Work In Progress</a>`];
function pageInitiative() {
  const i = iniById[S.cur] || INITIATIVES[0];
  const top = `${iniBack()[1]}<div class="top-r">${i.kind === "estimate" ? viewAsToggle() : ""}</div>`;
  /* One centred column (the live layout, without a duplicate properties rail): header, attention card, notes. */
  const body = `<div class="page-col">
      <header class="det-head"><div class="meta-row">${sysTag(i.sys)}<span class="st st-muted">${sg(i.stage, i.tone)}${i.stage}</span><span class="hint">${WHO(i)} · waiting ${i.wait}</span><span class="who">${av(i.driver)}<span class="hint">${PEOPLE[i.driver].name}</span></span></div>
        <h1 class="h-page">${esc(i.title)}</h1>
        <div class="det-btns"><button class="btn btn-sm" id="bPrd">${ic("file-text")}PRD</button><button class="btn btn-sm" id="bBrk">${ic("list-checks")}Breakdown</button><button class="btn btn-sm" id="bUpd">${ic("history")}Updates${i.fresh ? `<span class="count">${i.fresh}</span>` : ""}</button></div></header>
      <section class="det-sec" aria-labelledby="attH"><h2 class="h-sub" id="attH">Needs your attention</h2>${attentionCard(i)}</section>
      <section class="det-sec thread" aria-labelledby="notesH">
        <div class="thread-h"><h2 class="h-sub" id="notesH">Notes</h2><span class="hint">${threadFor(i).length} · notes feed the plan</span></div>
        <div class="thread-list" id="threadList">${threadHtml(i)}</div>
        <div class="cx-dock"><div class="atts" id="noteAtts"></div>${composerHtml({ id: "noteCx", placeholder: "Draft your thinking… notes feed the plan. Type / for a skill", cta: "Post note", attachId: "noteAtts" })}</div>
      </section>
    </div>`;
  return shell(iniBack()[0], top, body, { flush: true });
}

function bindMore() {
  $$("[data-more]").forEach(b => b.onclick = e => { e.stopPropagation(); const i = iniById[b.dataset.more];
    const pp = popover(b, "Also needs you", `<div class="qpop-h"><b>${esc(i.more)}</b><span class="hint">1d 3h</span></div><p>“Should the manual cover the courier mobile app, or only the dispatcher web app?”</p><a class="btn btn-sm" href="#initiative">Answer in the initiative${ic("arrow-right")}</a>`);
    drawIcons(); pp.el.querySelector("a").addEventListener("click", () => { S.cur = i.id; pp.close(false); }); });
}
function bindInitiative() {
  bindMore(); bindLock();
  const i = iniById[S.cur] || INITIATIVES[0];
  bindViewAs(render);
  $("#bPrd").onclick = () => prdDrawer(i); $("#bBrk").onclick = () => breakdownDrawer(i); $("#bUpd").onclick = () => updatesDrawer(i);
  $$("[data-hist]").forEach(b => b.onclick = () => sessionHistory(i));
  $$("[data-act]").forEach(b => b.onclick = () => runAction(i, b));
  bindNoteTools();
  $("#approve")?.addEventListener("click", e => { const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spin"></span>Approving`; setTimeout(() => { S.approved = true; render(); toast("Approved up to 2.15 SP. TKT-1's delivery started on rf-01"); }, 700); });
  $("#changeQ")?.addEventListener("click", e => {
    const box = $("#changeBox"), open = box.hidden; box.hidden = !open; e.currentTarget.setAttribute("aria-expanded", open);
    $("#approve") && ($("#approve").hidden = open);
    box.innerHTML = open ? `<div class="field"><label for="crit">What should change?</label><textarea id="crit" class="textarea" data-autosize rows="8">Only README.md changes; application behaviour, security, IAM, billing and tests stay unchanged.
The README explains purpose, module boundaries, request flow, integrations and readiness endpoints from current source.
Every documented command runs on rf-01; outcomes are recorded as passed, failed or unavailable.</textarea><span class="hint">Creating a revised proposal makes a new proposal version and invalidates the current quote. Approve comes back when you close this.</span></div>
      <div class="dc-acts"><button class="btn btn-primary btn-sm" id="revise">Create revised proposal</button><button class="btn btn-sm" id="cancelRev">Cancel</button><button class="btn btn-ghost btn-danger btn-sm" id="decline" style="margin-left:auto">Decline</button></div>` : "";
    drawIcons(); autosize(box);
    $("#cancelRev")?.addEventListener("click", () => $("#changeQ").click());
    $("#revise")?.addEventListener("click", () => { $("#changeQ").click(); toast("Revised proposal created. A new quote follows"); });
    $("#decline")?.addEventListener("click", () => dialog("Decline this proposal?", "The quote is discarded and nothing is charged. TKT-1 stays in the breakdown; you can request a new quote later.", "Decline", () => toast("Proposal declined"), true));
  });
  /* Posting: your note lands at once, then Konteks works on it in the open (simulated). */
  const list = $("#threadList");
  if ($("#noteCx")) bindComposer($("#noteCx"), { onSend: ({ text, picks }) => {
    const box = $("#noteAtts"), atts = [...box.querySelectorAll(".att b")].map(b => [b.textContent, b.nextElementSibling?.textContent || ""]); box.innerHTML = "";
    list.insertAdjacentHTML("beforeend", noteHtml({ who: "ay", m: 0, text: text || "(no text)", atts: atts.length ? atts : null }).replace('class="cmt ', 'class="cmt msg-in mine '));
    const mine = list.lastElementChild; mine.querySelector("time").outerHTML = `<time>${fmtDate(demoNow())}</time>`;
    bindNoteTools(mine); drawIcons(); sfx("send");
    agentRun(list, { text, picks, mode: "note" });
    const n = $("#notesH + .hint"); if (n) n.textContent = `${list.querySelectorAll(".cmt").length + 1} · notes feed the plan`;
  } });
  $$("[data-react]").forEach(b => b.onclick = () => { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); const c = b.querySelector("span"); c.textContent = +c.textContent + (on ? 1 : -1); });
  /* Comment toggles its reply box: a second press (or Escape, or Cancel) closes it and returns focus to the button. */
  $$("[data-comment]").forEach(b => { b.setAttribute("aria-expanded", "false"); b.onclick = () => {
    const host = b.closest(".cmt-b"), open = host.querySelector(".compose");
    const shut = () => { host.querySelector(".compose")?.remove(); b.setAttribute("aria-expanded", "false"); b.focus(); };
    if (open) return shut();
    host.insertAdjacentHTML("beforeend", `<div class="compose"><textarea rows="1" placeholder="Reply to this note" aria-label="Comment"></textarea><button class="btn btn-ghost btn-sm" type="button" data-cx>Cancel</button><button class="btn btn-primary btn-sm" type="button" data-cp>Comment</button></div>`);
    const box = host.querySelector(".compose"), ta = box.querySelector("textarea");
    b.setAttribute("aria-expanded", "true"); ta.focus();
    box.querySelector("[data-cx]").onclick = shut;
    box.querySelector("[data-cp]").onclick = () => { shut(); toast("Comment posted"); };
    ta.onkeydown = e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); shut(); } };
  }; });
}

/* Attach opens the file picker and shows chips; React offers a small set of reactions. */
function bindNoteTools(root = document) {
  $$("[data-attach]", root).forEach(b => b.onclick = () => { const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.onchange = () => { const box = document.getElementById(b.dataset.attach); [...inp.files].forEach(f => box.insertAdjacentHTML("beforeend", `<span class="att">${ic("file-text")}<b>${esc(f.name)}</b><span>${Math.max(1, Math.round(f.size / 1024))} KB</span><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove ${esc(f.name)}" onclick="this.closest('.att').remove()">${ic("x")}</button></span>`)); drawIcons(); }; inp.click(); });
  $$(".react-add", root).forEach(b => b.onclick = () => menu(b, ["👍", "🎉", "👀", "✅"].map(e => ({ label: e, run: () => { b.insertAdjacentHTML("beforebegin", `<button class="react" type="button" aria-pressed="true" data-react>${e} <span>1</span></button>`); const nb = b.previousElementSibling; nb.onclick = () => { const on = nb.getAttribute("aria-pressed") !== "true"; nb.setAttribute("aria-pressed", on); const c = nb.querySelector("span"); c.textContent = +c.textContent + (on ? 1 : -1); }; } }))));
}

function prdDrawer(i) {
  if (i.kind === "no-plan") return drawer("PRD", `<div class="empty"><div class="ic">${ic("file-x")}</div><h3>No PRD yet</h3><p>Planning ended without a plan, so there is nothing to show. Try again from the attention card; your notes are kept.</p></div>`);
  const draft = i.kind === "stalled" && i.tone === "blocked", readme = ["estimate", "stopped"].includes(i.kind) && i.sys === "rentify";
  drawer("PRD", `<div class="prd">
    <div style="display:grid;gap:4px"><h3 style="font-size:var(--t16)">${esc(i.title)}</h3><span class="hint">${draft ? st("warn", "Draft, not saved") : st("ok", "Ready")} · Revision ${draft ? 7 : 2} · updated ${ago(draft ? 5760 : 420)}</span></div>
    ${draft ? `<div class="callout warn">${ic("lock")}<span class="grow"><b>This revision could not be saved.</b> Saving needs Plan Save in SensePortal.</span><button class="btn btn-sm act" type="button" data-reqrole="System Owner">Request access</button></div>` : ""}
    <p style="color:var(--ink-2)">${readme ? "Refresh the existing README of <code>rentify/support-api</code> from current source, validate the documented workflows on rf-01, and leave one independently reviewed README-only pull request unmerged." : esc(i.detail.split(". ")[0]) + "."}</p>
    <div><h3>Goals</h3><ul>${(readme ? ["Make the README an accurate guide to purpose, boundaries, flows and integrations.", "Run each documented command on rf-01 and record the outcomes.", "Ship one reviewed, README-only pull request."] : ["Describe the outcome in the words of the people who asked for it.", "Keep scope to the System named on the initiative.", "Leave every change reviewable as one pull request per repository."]).map(g => `<li>${g}</li>`).join("")}</ul></div>
    <div><h3>Requirements</h3>${(readme ? [["R1", "README-only change", "Application behaviour, security, IAM, billing and tests stay as they are."], ["R2", "Source-grounded", "Explained from current repository source, keeping still-valid content."], ["R3", "No secrets", "Environment variable names only."]] : [["R1", "Scoped to " + sysById[i.sys].name, "Nothing outside this System changes."], ["R2", "Verified", "Every documented step is executed, not assumed."]]).map(([n, t, d]) => `<div class="req"><span class="idc">${n}</span><div><b style="font-weight:500">${t}</b><p>${d}</p></div></div>`).join("")}</div></div>`);
  bindLock();
}
function breakdownDrawer(i) {
  if (["no-plan", "plan-ready"].includes(i.kind) || (i.kind === "stalled")) return drawer("Breakdown", `<div class="empty"><div class="ic">${ic("list-checks")}</div><h3>No breakdown yet</h3><p>${i.kind === "plan-ready" ? "The plan is ready. Create tickets and Konteks proposes the breakdown for review." : "A breakdown follows once the plan is saved."}</p>${i.kind === "plan-ready" && i.driver === "ay" ? `<button class="btn btn-sm btn-primary" type="button" data-act="${i.id}">Create tickets</button>` : ""}</div>`), $$("[data-act]", layers().pop()).forEach(b => b.onclick = () => runAction(i, b));
  const needsRepo = i.kind === "breakdown", stopped = i.kind === "stopped", running = i.kind === "running", approved = i.kind === "estimate" && S.approved;
  const who = i.driver === "ay" ? "you" : PEOPLE[i.driver].name.split(" ")[0];
  const tickets = running ? [["TKT-1", "Export invoices as CSV", st("ok", "Merged"), "Settled 1.12 SP", false], ["TKT-2", "Add PDF export", st("info", "Delivering"), "Up to 1.80 SP", false], ["TKT-3", "Document the export API", st("muted", "Waiting for TKT-2"), "Not estimated", false]]
    : [["TKT-1", i.kind === "stopped" ? "Profile and fix slow dashboard queries" : "Validate and refresh the README", needsRepo ? st("warn", "Repository needed") : stopped ? st("danger", "Stopped") : approved ? st("info", "Delivering") : st("ok", "Estimate ready"), needsRepo ? "Not estimated" : stopped ? "Settled 0.47 SP" : "Up to 2.15 SP", true]];
  const status = needsRepo ? [st("warn", "Needs review"), "Not estimated yet · 0 of 1 merged · 1 needs " + who] : running ? [st("ok", "Accepted"), "1 of 3 merged · agents are working"] : stopped ? [st("ok", "Accepted"), "Approved up to 2.15 SP · 0 of 1 merged · 1 needs " + who] : approved ? [st("ok", "Accepted"), "Approved up to 2.15 SP · 0 of 1 merged"] : [st("ok", "Accepted"), "Estimate ready, waiting for approval · 0 of 1 merged · 1 needs " + who];
  const d = drawer("Breakdown", `
    <div style="display:grid;gap:6px"><h3 style="font-size:var(--t16);font-weight:600">${esc(i.title)}</h3><div class="meta-row">${status[0]}<span class="hint">${status[1]}</span></div></div>
    ${needsRepo ? `<div class="callout warn">${ic("triangle-alert")}<span class="grow"><b>TKT-1 needs one repository.</b> Choose it below before the breakdown can be accepted.</span></div>` : ""}
    <div class="seg" role="group" aria-label="Show tickets"><button type="button" aria-pressed="true" data-bf="all">All<span class="count">${tickets.length}</span></button><button type="button" aria-pressed="false" data-bf="you">Needs ${who}<span class="count">${tickets.filter(t => t[4]).length}</span></button></div>
    <div class="disc"><details open><summary>${ic("chevron-right")}<span style="flex:1;font-weight:500">${running ? "Invoices can be exported" : "README validated and ready for review"}</span><span class="hint">Milestone · ${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}</span></summary>
      <div class="dbody"><p class="hint" style="font-size:var(--t13)">${running ? "Finance can export invoices as CSV and PDF, with the API documented." : "Deliver one current-source README-only pull request with validation and independent review evidence."}</p>
        <div class="wi"><span class="label">Work item</span><b>${running ? "Invoice export" : "README refresh and validation"}</b><span class="hint">${running ? "Build and document both export formats." : "Update, validate and independently review the existing README as one work item."}</span></div>
        ${tickets.map(([id, t, stt, sp, mine], n) => `<div class="tkt" data-mine="${mine}"><div class="tkt-h"><span class="idc">${id}</span><b>${t}</b>${stt}</div><div class="tkt-m">${sp}</div>
          <div class="dc-acts">${mine && needsRepo ? `<button class="btn btn-sm btn-primary" id="chooseRepo">Choose repository</button>` : mine && stopped ? `<button class="btn btn-sm btn-primary" data-act="${i.id}">Continue</button>` : ""}<button class="btn btn-ghost btn-sm" type="button" data-tktmore="${id}" aria-haspopup="menu">${ic("more-horizontal")}More</button></div></div>`).join("")}</div></details></div>
    <fieldset class="fs"><legend class="flabel">Who merges</legend>
      <label class="check"><input type="radio" name="wm" checked><span>A person<small>Konteks opens the pull request; someone on the team merges it.</small></span></label>
      <label class="check"><input type="radio" name="wm"><span>Konteks, when review and checks pass<small>Merges on its own after independent review accepts the change.</small></span></label></fieldset>`,
    needsRepo ? `<button class="btn" data-close>Close</button><button class="btn btn-primary" disabled id="accBrk">Accept breakdown</button>` : "");
  $$("[data-tktmore]", d).forEach(b => b.onclick = e => menu(e.currentTarget, [{ label: "View changes", icon: "file-diff", run: changesDrawer }, { label: "Open Engineering session", icon: "message-square", run: () => { while (layers().length) closeOverlay(); location.hash = "session"; } }]));
  $$("[data-bf]", d).forEach(b => b.onclick = () => { $$("[data-bf]", d).forEach(x => x.setAttribute("aria-pressed", x === b)); $$(".tkt", d).forEach(t => t.hidden = b.dataset.bf === "you" && t.dataset.mine !== "true"); });
  d.querySelector("[data-act]")?.addEventListener("click", e => runAction(i, e.currentTarget));
  d.querySelector("#chooseRepo")?.addEventListener("click", () => {
    const m = modal("Choose repository for TKT-1", `<div class="field"><span class="flabel" id="crL">VCS connection</span><div class="combo" id="crCombo" style="width:100%"><button class="btn combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="crL"><span class="ph">Choose a connection</span>${ic("chevrons-up-down")}</button></div><span class="hint">Connections registered for ${esc(sysById[i.sys].name)} come first.</span></div>
      <div class="field"><label for="crRepo">Repository</label><input id="crRepo" class="input" placeholder="owner/repository" disabled></div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="crOk" disabled>Confirm repository</button>`);
    comboBind("crCombo", [["Connected to " + sysById[i.sys].name, VCS.filter(v => v[5].includes(sysById[i.sys].name)).map(v => [v[0], v[1]])], ["Other connections", VCS.filter(v => !v[5].includes(sysById[i.sys].name)).map(v => [v[0], v[4] === "Ardian Yusuf" ? "yours" : v[4]])]], () => { const r = m.querySelector("#crRepo"); r.disabled = false; r.value = "hris/frontend-mpp"; m.querySelector("#crOk").disabled = false; });
    m.querySelector("#crOk").onclick = () => { closeOverlay(); d.querySelector("#accBrk").disabled = false; toast("Repository confirmed for TKT-1"); };
  });
  d.querySelector("#accBrk")?.addEventListener("click", () => { closeOverlay(); toast("Breakdown accepted. Estimates follow"); });
}
function updatesDrawer(i) {
  const who = PEOPLE[i.driver].name;
  const e = (t, icn, text, time, unread, sess) => `<div class="log-e ${t}">${ic(icn)}<span>${text}</span><time>${unread ? '<span class="unread" title="Unread"></span>' : ""}${time}${sess ? ' <a class="btn btn-ghost btn-sm" href="#session">Open session' + ic("arrow-right") + '</a>' : ""}</time></div>`;
  const fold = (text, n, range, cause, time) => `<div class="log-e bad">${ic("layers")}<details><summary>${text} <span class="x">×${n}</span> <span class="hint">${range} · last cause: ${cause}</span></summary><div class="log-sub"><span>${time} Could not finish</span><span>… ${n - 1} more, same cause</span></div></details><time>${time}</time></div>`;
  const tail = [e("", "bot", 'Konteks worked on the plan <span class="x n">×6</span>', "12.55"), e("", "message-square-text", esc(who) + " added a note", "12.53")];
  const rows = {
    estimate: [e("", "file-check-2", "TKT-1's estimate is ready", "13.34", true, true), fold("TKT-1 stopped and was retried", 3, "12.56–13.28", "ended without delivering anything", "13.28"), e("ok", "circle-check", "TKT-1 was approved by Maya Lestari", "12.59", false, true), e("ok", "list-checks", "The breakdown was accepted", "12.56"), ...tail],
    stopped: [e("bad", "circle-stop", "Bagus Hartono stopped TKT-1. Its work so far is kept", "17.19", true, true), e("ok", "play", "TKT-1's delivery started", "15.22", true, true), e("ok", "circle-check", "TKT-1 was approved by Maya Lestari", "15.22", false, true), e("ok", "list-checks", "The breakdown was accepted", "12.56"), ...tail],
    "plan-ready": [e("ok", "file-check-2", "The plan is ready. Break it into tickets", "12.40", true), e("", "file-text", "Konteks drafted the requirement", "12.38"), ...tail],
    "no-plan": [fold("Planning ended without a plan", 12, "02.12–04.39", "the agent ended without a plan or a question", "04.39"), e("", "help-circle", "Konteks asked a question about the plan", "02.10", true), ...tail],
    stalled: i.tone === "blocked" ? [e("bad", "lock", `<b style="font-weight:500">The plan could not be saved.</b> You don't have Plan Save in SensePortal. <a href="#access">Request access</a>`, "17.23", true), e("", "pause-circle", "Konteks skipped a revision: it already revised the plan as often as it may this hour", "17.20"), ...tail] : [e("", "help-circle", "Konteks asked for the reproduction steps", "26 Oct 2026, 14.02"), ...tail],
    breakdown: [e("ok", "list-checks", "The breakdown is ready for review", "12.55", true), e("", "file-text", "Konteks drafted the requirement", "12.55"), ...tail],
    running: [e("ok", "play", "TKT-2's delivery started", "13.48", false, true), e("ok", "git-merge", "TKT-1 was merged", "13.40"), e("ok", "circle-check", "TKT-2 was approved by Maya Lestari", "13.30", false, true), ...tail],
  }[i.kind];
  drawer("Updates", `<div class="log"><div class="log-day"><h4>Today</h4>${rows.join("")}</div><p class="hint legend"><span class="unread"></span>New since you last opened Updates</p></div>`);
}
function changesDrawer() {
  const d = drawer("Changes", `<div class="clist-files"><button class="btn btn-sm" aria-pressed="true">${ic("file")}README.md<span class="hint">+64 −154</span></button></div>` + PANES.changes(), "", "", { wide: true });
  bindDiffRendered(); d.querySelector("#wrapT").onclick = e => { const on = d.querySelector(".diff").classList.toggle("wrap"); e.currentTarget.setAttribute("aria-pressed", on); e.currentTarget.textContent = on ? "No wrap" : "Wrap lines"; };
}
function sessionHistory(i) {
  const d = drawer("Session history", `<div class="log"><div class="log-day"><h4>TKT-1 · cycle 2</h4>
      <div class="log-e">${ic("loader")}<span>Preparing the estimate <span class="x n">×4</span><small class="hint" style="display:block">Your agent started.</small></span>${ago(360)}</div>
      <div class="log-e">${ic("calculator")}<span>Working out the estimate<small class="hint" style="display:block">The quote follows.</small></span>${ago(360)}</div>
      <div class="log-e bad">${ic("triangle-alert")}<span>A problem was recorded while saving progress<small class="hint" style="display:block">Observed 27 Oct 2026, 17.49 · received 17.49</small></span>${ago(120)}</div>
      <div class="log-e bad">${ic("layers")}<span>A tool reported a failure <span class="x">×24</span><small class="hint" style="display:block">27 Oct 2026, 15.24 to 17.02</small></span>${ago(180)}</div>
    </div></div>`, `<button class="btn btn-ghost btn-sm" id="shPrev">${ic("chevron-left")}Previous</button><button class="btn btn-ghost btn-sm" disabled>Next${ic("chevron-right")}</button><span style="flex:1"></span><a class="btn btn-primary btn-sm" href="#session" data-close>Open session${ic("arrow-right")}</a>`,
    `<button class="btn btn-ghost btn-sm" id="shRef">${ic("rotate-cw")}Refresh</button>`);
  d.querySelector("#shRef").onclick = () => toast("Session history is up to date");
  d.querySelector("#shPrev").onclick = () => toast("Cycle 1 has 9 events");
}

const PANES = {
  changes: () => `<div class="diff" id="diff"><div class="diff-h">${ic("file")}<b>README.md</b><span style="color:var(--accent-ink)">+64</span><span style="color:var(--danger)">−154</span><span style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-sm" id="wrapT" aria-pressed="false">Wrap lines</button><button class="btn btn-sm" type="button" data-rendered aria-pressed="false">Rendered</button></span></div><table>
    ${[["hunk", "", "", "@@ -1,12 +1,14 @@"], ["", 1, 1, "# support-api"], ["", 2, 2, ""], ["del", 3, "", "-Rentify **Support Backend**: customer support ticketing and management API."], ["add", "", 3, "+Rentify Support API is the HTTP API and background worker for customer support operations: tickets, assignments and SLA timers."], ["", 4, 4, ""], ["del", 5, "", "-## Quick Start"], ["add", "", 5, "+## Architecture and request flow"], ["add", "", 6, "+A request enters Fastify, passes route-level validation and authentication, then reaches a use case in core/controller."], ["add", "", 7, "+"], ["add", "", 8, "+```mermaid"], ["add", "", 9, "+flowchart LR"], ["add", "", 10, "+  Client --> API[core/api: routes and validation]"], ["add", "", 11, "+  API --> UC[core/controller: use cases]"], ["del", 6, "", "-npm run dev   # start dev server (http://localhost:4000)"]].map(([c, a, b, t]) => `<tr class="${c}"><td class="ln">${a}</td><td class="ln">${b}</td><td>${esc(t)}</td></tr>`).join("")}
  </table></div>`,
  breakdown: () => `<div class="tkt"><div class="tkt-h"><span class="idc">TKT-1</span><b>Validate and refresh the README</b>${st("ok", "Estimate ready")}</div><div class="tkt-m">Up to 2.15 SP · rentify/support-api</div></div>`,
};
