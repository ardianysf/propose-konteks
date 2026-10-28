/* ---------- Customize: the same ten sections as live, one layout ---------- */
const CZ = [
  ["runtimes", "server", "Runtimes"], ["access", "shield", "Access"], ["models", "cpu", "Models"], ["context", "book-open", "Context"],
  ["skills", "sparkles", "Skills"], ["tools", "wrench", "Tools"], ["mcps", "package", "MCPs"], ["connectors", "cable", "Connectors"],
  ["vcs", "git-branch", "VCS Connectors"], ["operations", "radio-tower", "Operations"],
];
function czShell(cur, title, sub, actions, inner) {
  /* The section is the page: its name is the title, "Customize" labels the section nav. One header, not two. */
  const nav = `<nav class="vnav" aria-label="Customize"><span class="grp">Customize</span><span class="vnav-sub">Where agents run, who may do what, and what they work with.</span>${CZ.map(([k, i, l]) => `<a href="#${k}" ${cur === k ? 'aria-current="page"' : ""}>${ic(i)}${l}</a>`).join("")}</nav>`;
  const mnav = `<label class="cz-mnav"><select class="select" id="czSel" aria-label="Customize section">${CZ.map(([k, , l]) => `<option value="${k}" ${cur === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const body = `<div class="cz">${nav}<div class="cz-main">${mnav}<div class="phead"><div class="phead-row"><h1 class="ph-t">${title}</h1>${actions ? `<div class="ph-a">${actions}</div>` : ""}</div>${sub ? `<p>${sub}</p>` : ""}</div>${inner}</div></div>`;
  return shell("customize", "", body, { flush: true });
}
function bindCz() { $("#czSel")?.addEventListener("change", e => location.hash = e.target.value); bindCopy(); }

/* Read-only pattern (UX-028): one strip above the section, controls visibly disabled, one way to ask. */
const lockStrip = (text, role) => `<div class="lockrow">${ic("lock")}<span class="grow">${text}</span><button class="btn btn-sm" type="button" data-reqrole="${role}">Request access</button></div>`;
function bindLock() { $$("[data-reqrole]").forEach(b => b.onclick = () => requestAccess(b.dataset.reqrole)); }

/* ---------- Runtimes ---------- */
function pageRuntimes() {
  const n = k => RUNTIMES.filter(r => r.status === k).length, upd = RUNTIMES.filter(r => r.update).length;
  const row = r => `<tr data-rt="${r.id}" tabindex="0" aria-label="Open ${esc(r.name)}"><td><div class="cellname">${ic(r.os === "macOS" ? "laptop" : r.os === "Windows" ? "monitor" : "server", "os")}<div style="display:grid"><b>${esc(r.name)}</b>${r.desc ? `<small>${esc(r.desc)}</small>` : ""}</div></div></td>
    <td>${esc(r.owner)}${r.mine ? ' <span class="hint">(you)</span>' : ""}</td>
    <td>${rtStatus(r)}${r.status === "ready" ? `<div class="hint">${esc(r.sessions)}</div>` : `<div class="hint">${esc(r.reasons)}</div>`}</td>
    <td>${r.wl.length ? `<span title="${esc(r.wl.join(", "))}">${r.wl.length === 7 ? "All 7 workloads" : r.wl.length + " of 7 workloads"}</span>` : `<span class="hint">No workload can be served yet</span>`}</td>
    <td><span class="num">${r.version}</span>${r.update ? `<div class="upd">${ic("arrow-up-circle")}0.19.26 available</div>` : ""}</td></tr>`;
  /* One counted line instead of a five-cell strip: the table below is the detail (UX-031: counts come from the list). */
  const inner = `<p class="countline"><b>${RUNTIMES.length}</b> registered<span>·</span>${st("ok", n("ready") + " ready")}<span>·</span>${st("warn", n("paused") + " not accepting work")}<span>·</span>${st("muted", n("offline") + " not connected")}<span>·</span><span class="upd" style="margin:0">${ic("arrow-up-circle")}${upd} with an update</span></p>
    <div class="tablewrap"><table class="dtable rt-table"><thead><tr><th>Runtime</th><th>Owner</th><th>Status</th><th>Workloads</th><th>Connector</th></tr></thead><tbody>${RUNTIMES.map(row).join("")}</tbody></table></div>
    <div class="rt-foot"><button class="btn btn-sm" id="revoked">${ic("archive")}Revoked runtimes<span class="count">3</span></button></div>
    <section class="card"><div class="card-h"><h3>Workspace runtime policy</h3></div><div class="card-b">
      <p class="hint">Where work goes when a session does not choose.</p>${lockStrip("Only a Workspace Administrator can change it.", "Workspace Administrator")}
      <fieldset class="fs" disabled><legend class="sr">Workspace runtime policy</legend>
        <label class="optcard"><input type="radio" name="pol" checked><span><b>Automatic</b><small>The least busy runtime that can do the work.</small></span></label>
        <label class="optcard"><input type="radio" name="pol"><span><b>A specific runtime</b><small>Work waits if that runtime cannot take it. Nothing moves elsewhere.</small></span></label>
        <div class="field" style="padding-left:30px"><label for="polRt">Runtime</label><select id="polRt" class="select">${RUNTIMES.map(r => `<option>${esc(r.name)}</option>`).join("")}</select></div></fieldset></div></section>`;
  return czShell("runtimes", "Connected runtimes", "Your computers run the agents. Konteks never holds a provider key or account.", `<button class="btn btn-primary" id="connectRt">${ic("plus")}Connect a runtime</button>`, inner);
}
function bindRuntimes() {
  bindCz(); bindLock();
  $$("[data-rt]").forEach(tr => { const go = () => { S.rt = tr.dataset.rt; S.harness = null; location.hash = "runtime"; }; tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter") go(); }; });
  $("#connectRt")?.addEventListener("click", connectRuntime);
  $("#revoked")?.addEventListener("click", revokedRuntimes);
}
function connectRuntime() {
  /* One modal, two steps: the form, then the installation it leads to. */
  const d = modal("Connect a runtime", `
    <div class="field"><label for="rtName">Name</label><input id="rtName" class="input" placeholder="e.g. ardian's Mac"><span class="hint">Teammates see this name in the sidebar.</span></div>
    <fieldset class="fs"><legend class="flabel">Workloads this computer may take</legend><div class="wl-grid">
      ${WORKLOADS.map(([t, dsc], n) => `<label class="optcard"><input type="checkbox" ${n !== 5 ? "checked" : ""}><span><b>${t}</b><small>${dsc}</small></span></label>`).join("")}</div></fieldset>
    <p class="hint">${ic("shield-check")}Your computers run the agents. Konteks never holds a provider key or account.</p>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="rtNext" disabled>Continue to installation</button>`, { wide: true, sub: "Step 1 of 2 · Name it and choose what it may do" });
  d.querySelector("#rtName").oninput = e => d.querySelector("#rtNext").disabled = !e.target.value.trim();
  d.querySelector("#rtNext").onclick = () => {
    const name = esc(d.querySelector("#rtName").value);
    modalStep(d, { sub: `Step 2 of 2 · Install on ${name}`, body: `<ol class="steps">
      <li><b>Install the connector</b><p>Run this in a terminal on ${name}. It installs the connector and registers it with this workspace.</p>${cmd("curl -fsSL https://install.konteks.example | sh -s -- --code KX-7Q4M-29")}<span class="hint">The code works once and expires in 30 minutes.</span></li>
      <li><b>Sign in your agents</b><p>Use your own accounts. Konteks never sees the keys.</p>${cmd("konteks-remote auth login codex")}</li>
      <li><b>Confirm the connection</b><p>When the computer is connected, Konteks lists the agents it found.</p></li></ol>`,
      foot: `<button class="btn btn-ghost" id="rtBack" style="margin-right:auto">${ic("arrow-left")}Back</button><button class="btn" data-close>Close</button><button class="btn btn-primary" id="rtCheck">Check again</button>` });
    bindCopy(d);
    d.querySelector("#rtBack").onclick = () => { closeOverlay(); connectRuntime(); };
    d.querySelector("#rtCheck").onclick = e => { const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spin"></span>Checking`; setTimeout(() => { b.disabled = false; b.textContent = "Check again"; toast("Not connected yet. Run the install command, then check again", "err"); }, 900); };
  };
}
function revokedRuntimes() {
  drawer("Revoked runtimes", `<p class="hint">Kept for the record. A revoked runtime can never take work again.</p>
    <div class="card res">${[["yoga-fedora (old)", "e0138cce", "30 Sep 2026", "5 Oct 2026"], ["hana-laptop", "aeb39004", "30 Sep 2026", "4 Oct 2026"], ["rizky-windows", "d498d982", "30 Sep 2026", "7 Oct 2026"]].map(([n, id, r, s]) => `<div class="res-item">${ic("server-off", "os")}<div><div class="ttl" title="Runtime id ${id}">${n} ${st("muted", "Revoked")}</div><div class="meta"><span>Registered ${r}</span><span>Last seen ${s}</span></div></div></div>`).join("")}</div>`);
}

/* ---------- Runtime detail: harness tiles, sessions, commands, On this computer. Updating = the connector
   updates itself within 6 hours, or the owner runs `konteks-remote update` (no in-app update button, as live). ---------- */
const RT_CMDS = [
  ["Shows whether this computer is connected to Konteks and ready for work.", "konteks-remote status"],
  ["Lists the agents on this computer and whether each one is ready.", "konteks-remote agents"],
  ["Checks the connector and every agent on this computer, and says what to fix.", "konteks-remote doctor"],
  ["Installs the newest connector release and restarts the connector. Running work finishes first.", "konteks-remote update"],
  ["Says whether a newer connector release is available, without installing it.", "konteks-remote update --check"],
  ["Shows which agents are signed in on this computer.", "konteks-remote auth status"],
  ["Signs an agent in on this computer: claude-code, codex, dsh, opencode or antigravity.", "konteks-remote auth login <agent>"],
  ["Signs an agent out on this computer.", "konteks-remote auth logout <agent>"],
  ["Adds an agent to this computer's connector.", "konteks-remote agent add <agent>"],
  ["Lists this computer's session previews and why any of them stopped.", "konteks-remote preview status"],
  ["Starts the connector's background service.", "konteks-remote start"],
  ["Stops the connector's background service. This computer and its work are kept.", "konteks-remote stop"],
  ["Creates this computer's key for Konteks-managed repositories and registers it.", "konteks-remote git key add"],
  ["Lists the keys registered for this computer.", "konteks-remote git key list"],
  ["Collects a support bundle to share with Konteks support.", "konteks-remote support"],
  ["Prints the connector release this computer runs.", "konteks-remote --version"],
  ["Removes Konteks from this computer. Your repositories and your agents' own sign-ins stay.", "konteks-remote uninstall"],
];
function pageRuntime() {
  const r = rtById[S.rt] || RUNTIMES[0];
  const h = r.harness.find(x => x[0] === S.harness) || r.harness.find(x => x[1] === "ready") || r.harness[0];
  const online = r.status === "ready", hst = k => online ? HARNESS_STATUS[k] : ["muted", k === "ready" ? "Ready when online" : HARNESS_STATUS[k][1]];
  const own = r.mine || r.owner === "Organization";
  const top = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#runtimes">Runtimes</a>${ic("chevron-right")}<b>${esc(r.name)}</b></nav><div class="top-r">${rtStatus(r)}</div>`;
  const hFix = h ? { signin: ["Sign it in on " + r.name, `konteks-remote auth login ${HARNESS_KEY[h[0]]}`], failed: ["Find out what is wrong", "konteks-remote doctor"], na: ["Add it to this computer", `konteks-remote agent add ${HARNESS_KEY[h[0]]}`] }[h[1]] : null;
  const upd = r.update ? `<div class="callout info upd-callout">${ic("arrow-up-circle")}<div class="grow" style="display:grid;gap:8px"><span><b>Connector 0.19.26 is available.</b> ${esc(r.name)} runs ${r.version}. It updates by itself within 6 hours; running work finishes first.</span>
      ${own ? `<span>To update now, run this on ${esc(r.name)}:</span>${cmd("konteks-remote update")}` : `<span>${esc(r.owner)} owns this computer, so the update happens there.</span>`}</div></div>` : "";
  const body = `<div class="pagehead"><div class="phead"><div class="phead-row"><h1 class="ph-t">${esc(r.name)}</h1></div><p>${esc(r.desc || (r.owner === "Organization" ? "Organization runtime" : "Personal runtime · " + r.owner))} · ${r.os} · connector ${r.version}${r.attested ? " · attested as organization-owned" : ""}</p></div></div>
    ${upd}
    <div class="split"><div class="col">
      <section class="card"><div class="card-h"><h3>Agents</h3><span class="hint">Cost stays with your subscription</span></div><div class="card-b">
        ${r.harness.length ? `<div class="harnsel tiles" role="group" aria-label="Agents on ${esc(r.name)}">${r.harness.map(([n, k]) => harnTile(n, k, hst(k), !!(h && h[0] === n))).join("")}</div>
        <p class="hsel"><b>${h[0]}</b> ${st(...hst(h[1]))}</p>
        ${!online ? `<p class="hint">${esc(r.name)} is not connected, so no agent can take work until it is back online.</p>` : hFix ? `<div class="fix"><b>${h[0]}: ${HARNESS_STATUS[h[1]][1]}.</b> ${hFix[0]}:</div>${cmd(hFix[1])}` : `<p class="hint">${h[0]} is ready. New sessions on ${esc(r.name)} can use it.</p>`}`
        : `<div class="empty" style="max-width:none"><div class="ic">${ic("bot")}</div><h3>No agent on this computer yet</h3><p>Add one, then sign it in with your own account. No workload can be served until then.</p>${cmd("konteks-remote agent add codex")}</div>`}
      </div></section>
      <section class="card"><div class="card-h"><h3>${own ? "Your sessions" : "Sessions on this runtime"}</h3>${r.status === "ready" ? `<button class="btn btn-sm" id="newSess">${ic("plus")}New session</button>` : ""}</div><div class="card-b">
        ${r.status === "ready" ? `<div class="res">${r.id === "rf-01" ? `<div class="res-item">${ic("message-square", "os")}<div><div class="ttl">TKT-1 · Validate and refresh the support-api README</div><div class="meta"><span>Refresh the Support API README</span><span>Updated ${ago(120)}</span></div></div><a class="btn btn-sm" href="#session">Open</a></div>` : `<p class="hint">No sessions here yet.</p>`}</div><p class="hint">+4 by teammates</p>` : `<p class="hint">Sessions on this runtime cannot be listed while it is not connected.</p>`}
      </div></section>
      <section class="card"><div class="card-h"><h3>Commands</h3><span class="hint">Learned 27 Oct 2026, 19.14</span></div><div class="card-b">
        <details class="inline-disc"><summary>${ic("chevron-right")}Show 11 commands</summary><div class="cmdlist">${[["/plan", "Turn plan mode on."], ["/mcp", "List configured MCP tools."], ["/skills", "List available skills."], ["/status", "Display session configuration and token usage."], ["/review", "Review uncommitted changes, or review with custom instructions."], ["/review-branch", "Review changes relative to a base branch."], ["/review-commit", "Review a specific commit."], ["/compact", "Summarize the conversation to avoid hitting the context limit."], ["/goal", "Set a goal to keep pursuing."], ["/rename", "Rename the current session."], ["/logout", "Sign out of the agent."]].map(([c, d]) => `<div><code>${c}</code><span class="hint">${d}</span></div>`).join("")}</div></details>
      </div></section>
    </div>
    <aside class="col"><section class="card"><div class="card-h"><h3>Details</h3></div><div class="card-b props">
      ${[["Status", rtStatus(r)], ["Owner", esc(r.owner)], ["Workloads", r.wl.length ? r.wl.map(esc).join(", ") : "None yet"], ["Connector", `<span class="num">${r.version}</span>`], ["Last seen", r.seen]].map(([a, b]) => `<div class="prop"><span>${a}</span><div style="flex-wrap:wrap">${b}</div></div>`).join("")}</div></section>
      <section class="card"><div class="card-h"><h3>On this computer</h3></div><div class="card-b"><p class="hint">Run these in a terminal on ${esc(r.name)} (${r.os}).</p>
        <div class="cmds">${RT_CMDS.slice(0, 5).map(([d, c]) => `<div class="cmdrow"><span class="hint">${d}</span>${cmd(c)}</div>`).join("")}
        <details class="inline-disc"><summary>${ic("chevron-right")}${RT_CMDS.length - 5} more commands</summary><div class="cmds" style="margin-top:10px">${RT_CMDS.slice(5).map(([d, c]) => `<div class="cmdrow"><span class="hint">${d}</span>${cmd(c)}</div>`).join("")}</div></details></div></div></section></aside></div>`;
  return shell("runtime", top, `<div class="content">${body}</div>`, { flush: true });
}
function bindRuntime() {
  bindCopy();
  $$("[data-harn]").forEach(b => b.onclick = () => { S.harness = b.dataset.harn; render(); });
  $("#newSess")?.addEventListener("click", () => location.hash = "session");
}

/* ---------- Access: the seven live tabs ---------- */
const ACCESS_TABS = [["overview", "Overview"], ["people", "People & groups"], ["roles", "Roles"], ["resource", "Resource access"], ["service", "Service accounts"], ["requests", "Requests & approvals"], ["audit", "Audit"]];
function pageAccess() {
  const t = S.accessTab;
  const tabs = `<div class="tabs wrap" role="tablist" aria-label="Access">${ACCESS_TABS.map(([k, l]) => `<a class="tab" role="tab" href="#access/${k}" data-at="${k}" aria-selected="${t === k}">${l}</a>`).join("")}</div>`;
  const emptyBlock = (h, p) => `<div class="empty"><h3>${h}</h3><p>${p}</p></div>`;
  let pane = "";
  if (t === "overview") pane = `<div class="meta-row"><span class="hint">What your role lets you do in this workspace.</span><button class="btn btn-sm" id="checkAcc" style="margin-left:auto">${ic("scan-search")}Check access</button></div>
    <section class="card"><div class="card-h"><h3>My effective access</h3></div><div class="card-b">
      <div class="grant"><div style="display:grid;gap:2px"><b>Engineering Contributor</b><span class="hint">Workspace · migrated grant · permanent · protected</span></div><button class="btn btn-ghost btn-sm" type="button" data-role="Engineering Contributor">${ROLE_PERMS["Engineering Contributor"].length} permissions${ic("chevron-right")}</button></div>
      <div class="grid2"><div class="cando"><span class="label">You can</span>${["Start initiatives and add notes", "Request estimates and cancel runs", "Register your own runtimes", "Read usage and billing"].map(x => `<span>${ic("check")}${x}</span>`).join("")}</div>
      <div class="cando no"><span class="label">Needs another role</span>${[["Approve deliveries", "Delivery Approver"], ["Change model defaults", "Workspace Owner"], ["See budgets", "Billing Administrator"]].map(([x, r]) => `<span>${ic("lock")}${x}<small>${r}</small></span>`).join("")}</div></div></div></section>`;
  if (t === "people") pane = `<section class="sec"><h3 class="h-sub">Access groups</h3><p class="hint">Assign roles to groups so access stays easy to review as teams change.</p>${emptyBlock("No access groups yet", "An IAM Administrator creates groups and assigns roles to them.")}</section>
    <section class="sec"><h3 class="h-sub">People</h3><p class="hint">People currently known to this workspace.</p><div class="state locked"><div class="ic">${ic("eye-off")}</div><h3>You can't see the people list</h3><p>Seeing members needs Binding Read. This is not the same as the workspace having no people.</p><button class="btn btn-sm" data-reqrole="IAM Administrator">Request access</button></div></section>`;
  if (t === "roles") pane = `<div class="filters"><div class="with-icon" style="width:min(320px,100%)">${ic("search")}<input class="input" id="roleQ" placeholder="Find a role or permission" aria-label="Find a role or permission"></div><span class="hint">16 built-in templates · all active</span></div>
    <div class="tablewrap"><table class="dtable"><thead><tr><th>Role</th><th>What it is for</th><th class="num">Permissions</th></tr></thead><tbody id="roleBody">
      ${ROLES.map(([n, d, , mine]) => `<tr class="${mine ? "me-row" : ""}" data-role="${n}" tabindex="0"><td><b style="font-weight:500">${n}</b>${mine ? ' <span class="hint">· yours</span>' : ""}</td><td style="color:var(--ink-2)">${d}</td><td class="num">${ROLE_PERMS[n] ? ROLE_PERMS[n].length : `<span class="hint">open</span>`}</td></tr>`).join("")}
    </tbody></table></div><p class="hint">Open a role to see every permission it grants. Each permission is listed once.</p>`;
  if (t === "resource") pane = `<div class="field" style="max-width:360px"><label for="resSel">Resource</label><select id="resSel" class="select"><option>Entire workspace</option>${SYSTEMS.map(s => `<option>${s.name} · System</option>`).join("")}</select><span class="hint">See direct, group, resource-set and inherited access.</span></div>
    <div class="state error"><div class="ic">${ic("cloud-off")}</div><h3>Resource access is temporarily unavailable</h3><p>The access service didn't answer. No access has been assumed and nothing changed.</p><button class="btn btn-sm" id="resRetry">${ic("rotate-cw")}Try again</button></div>
    <section class="sec"><h3 class="h-sub">Guardrails</h3><p class="hint">Deny sensitive operations for selected principals and scopes.</p>${emptyBlock("No guardrails yet", "Guardrails block an operation even when a role would allow it.")}</section>
    <section class="sec"><h3 class="h-sub">Delegation boundaries</h3><p class="hint">Limit where selected people may act and what delegated administrators may grant.</p><div class="grid2">${emptyBlock("No access limits yet", "Access limits keep a person inside chosen Systems.")}${emptyBlock("No grant limits yet", "Grant limits cap what a delegated administrator can hand out.")}</div></section>`;
  if (t === "service") pane = `<section class="sec"><h3 class="h-sub">Service accounts</h3><p class="hint">Managed identities for automation. Access granted to the identity is separate from permission to operate it.</p>${emptyBlock("No service accounts yet", "Service accounts run approved workload actions without a person signed in.")}</section>
    <section class="sec"><h3 class="h-sub">Workload identities</h3><p class="hint">Runtime identities registered by Konteks services, shown apart from managed service accounts.</p>${emptyBlock("No workload identities to show", "They appear when a Konteks service registers a runtime identity.")}</section>`;
  if (t === "requests") pane = emptyBlock("No requests yet", "Access you ask for waits here for an authorized approver, with its outcome. Requests from others that you may approve appear here too.") + `<div><button class="btn btn-sm" data-req>${ic("hand")}Request access</button></div>`;
  if (t === "audit") pane = `<p class="hint">Policy revision 1569 · membership revision 1529</p>` + emptyBlock("No audit records to show", "Grants, revocations and policy changes are recorded here with who made them and when.");
  return czShell("access", "Access", "Understand and manage who can do what across this workspace.", `<button class="btn" data-req>${ic("hand")}Request access</button>`, tabs + `<div class="tabpane">${pane}</div>`);
}
function bindAccess() {
  bindCz(); bindLock();
  $$("[data-req]").forEach(b => b.onclick = () => requestAccess());
  $("#checkAcc")?.addEventListener("click", checkAccess);
  $("#resRetry")?.addEventListener("click", () => toast("Still unavailable. Try again in a moment", "err"));
  $("#roleQ")?.addEventListener("input", e => { const q = e.target.value.toLowerCase(); $$("#roleBody tr").forEach(tr => tr.hidden = !(tr.textContent.toLowerCase().includes(q) || (ROLE_PERMS[tr.dataset.role] || []).some(p => p.toLowerCase().includes(q)))); });
  $$("[data-role]").forEach(r => { const go = () => roleDrawer(r.dataset.role); r.onclick = go; r.onkeydown = e => { if (e.key === "Enter") go(); }; });
}
function roleDrawer(name) {
  const r = ROLES.find(x => x[0] === name), perms = ROLE_PERMS[name];
  if (!perms) return drawer(name, `<p class="hint">${r[1]} Built-in template · active.</p><div class="empty"><h3>Permissions not included in this demo</h3><p>In the app this lists the template's permissions, grouped and searchable, each once.</p></div>`);
  const groups = {}; perms.forEach(p => { const g = p.split(" ")[0]; (groups[g] = groups[g] || []).push(p); });
  const d = drawer(name, `<p class="hint">${r[1]} Built-in template · active.</p>
    <div class="with-icon">${ic("search")}<input class="input" id="permQ" placeholder="Filter ${perms.length} permissions" aria-label="Filter permissions"></div>
    <div class="perm-list">${Object.entries(groups).map(([g, ps]) => `<div class="perm-g"><span class="label">${g}</span>${ps.map(p => `<span class="perm">${esc(p)}</span>`).join("")}</div>`).join("")}</div>`);
  d.querySelector("#permQ").oninput = e => { const q = e.target.value.toLowerCase(); $$(".perm", d).forEach(p => p.hidden = !p.textContent.toLowerCase().includes(q)); $$(".perm-g", d).forEach(g => g.hidden = !$$(".perm", g).some(p => !p.hidden)); };
}
function requestAccess(pre) {
  const d = modal("Request access", `
    <div class="field"><label for="raRole">Requested role</label><select id="raRole" class="select">${ROLES.filter(r => r[0] !== "Workspace Owner").map(([n]) => `<option ${pre === n ? "selected" : ""}>${n}</option>`).join("")}</select><span class="hint" id="raDesc"></span></div>
    <div class="field"><label for="raScope">Requested scope</label><select id="raScope" class="select"><option>Entire workspace</option>${SYSTEMS.map(s => `<option>${s.name} · System</option>`).join("")}</select></div>
    <div class="field"><span class="flabel" id="raDurL">Requested duration</span><div class="seg" role="group" aria-labelledby="raDurL"><button type="button" aria-pressed="true" data-dur>30 days</button><button type="button" aria-pressed="false" data-dur>90 days</button></div></div>
    <div class="field"><label for="raWhy">Why do you need this access?</label><textarea id="raWhy" class="textarea" placeholder="e.g. To save the plan for Role editor for SensePortal"></textarea><span class="hint">The approver sees this with your request.</span></div>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="raSend" disabled>Submit request</button>`,
    { sub: "Choose the role, scope and duration you need. An authorized approver reviews it." });
  const desc = () => d.querySelector("#raDesc").textContent = ROLES.find(r => r[0] === d.querySelector("#raRole").value)[1];
  desc(); d.querySelector("#raRole").onchange = desc;
  $$("[data-dur]", d).forEach(b => b.onclick = () => $$("[data-dur]", d).forEach(x => x.setAttribute("aria-pressed", x === b)));
  d.querySelector("#raWhy").oninput = e => d.querySelector("#raSend").disabled = !e.target.value.trim();
  d.querySelector("#raSend").onclick = () => { closeOverlay(); toast("Request submitted. An approver will review it"); };
}
function checkAccess() {
  const ops = ["Delivery Proposal Approve · App / Delivery Proposal", "Plan Execute · App / Plan", "Budget Read · Platform / Budget", "Runtime Manage Personal · Remote Instance / Runtime", "System Configure · App / System"];
  const d = modal("Check access", `
    <div class="field"><label for="ckOp">Operation</label><select id="ckOp" class="select">${ops.map(o => `<option>${o}</option>`).join("")}</select></div>
    <div class="field"><label for="ckRes">Resource</label><select id="ckRes" class="select"><option>Entire workspace</option></select></div>
    <div class="field"><label for="ckRole">Role to preview <span class="hint">· optional</span></label><select id="ckRole" class="select"><option>Explain current access only</option><option>IAM Administrator</option><option>Workspace Owner</option></select><span class="hint">A no-change simulation for your own access. It never creates a grant.</span></div>
    <div id="ckOut" aria-live="polite"></div>`,
    `<button class="btn" data-close>Close</button><button class="btn btn-primary" id="ckRun">Explain</button>`,
    { sub: "Ask why you can or cannot perform an operation, and safely preview one role without changing policy." });
  d.querySelector("#ckRun").onclick = () => {
    const op = d.querySelector("#ckOp").value, role = d.querySelector("#ckRole").value, ok = /Plan Execute|Runtime ManagePersonal|System Configure/.test(op) || role === "Workspace Owner";
    d.querySelector("#ckOut").innerHTML = `<div class="callout ${ok ? "info" : "danger"}">${ic(ok ? "circle-check" : "lock")}<span class="grow"><b>${ok ? "Allowed" : "Not allowed"}.</b> ${ok ? (role === "Workspace Owner" ? "Workspace Owner would allow it. This is a preview; nothing was granted." : "Engineering Contributor grants it in the entire workspace.") : `None of your roles grants ${esc(op.split(" · ")[0])}. ${/Approve/.test(op) ? "Delivery Approver" : "Billing Administrator"} does.`}</span></div>`; drawIcons();
  };
}

/* ---------- Models ---------- */
function pageModels() {
  const inner = lockStrip("Only a Workspace Owner can change these.", "Workspace Owner") + `<div class="cards-col">${MODEL_MODES.map(([m, d, h, v], i) => `<section class="card"><div class="card-b mode">
      <div style="display:grid;gap:4px"><h3 class="h-sub">${m}</h3><p class="hint">${d}</p></div>
      <div class="field"><span class="flabel sr" id="mm${i}">${m} model</span><div class="combo" id="mc${i}"><button class="btn combo-trigger" type="button" disabled aria-labelledby="mm${i}"><span>${h} · ${v}</span>${ic("lock")}</button></div></div>
      ${m === "Review" ? `<p class="hint">Cost stays with your subscription. Auto takes over only when this cannot run.</p>` : m === "Testing (QA)" ? `<p class="hint">Testing uses your selected model. It is not replaced automatically.</p>` : ""}</div></section>`).join("")}</div>
    <details class="inline-disc"><summary>${ic("chevron-right")}See every model and its price</summary><div class="disc-in"><div class="tablewrap"><table class="dtable"><thead><tr><th>Agent</th><th>Model</th><th>Price per 1M tokens (in / out)</th></tr></thead><tbody>${MODEL_GROUPS.flatMap(([g, ms]) => ms.map(([n, p], k) => `<tr><td>${k ? "" : esc(g)}</td><td>${esc(n)}</td><td class="mono">${esc(p)}</td></tr>`)).join("")}</tbody></table></div></div></details>`;
  return czShell("models", "Models", "Planning, Engineering and Review use Auto unless you pick a model. Testing uses an explicit choice from the agents on your computers.", "", inner);
}

/* ---------- Context: Files, Skills, Repositories ---------- */
function pageContext() {
  const t = S.ctxTab;
  const tabs = `<div class="tabs" role="tablist" aria-label="Context">${[["files", "Files"], ["skills", "Skills"], ["repos", "Repositories"]].map(([k, l]) => `<button class="tab" role="tab" data-ct="${k}" aria-selected="${t === k}">${l}</button>`).join("")}</div>`;
  const scope = `<div class="field" style="max-width:300px"><label for="ctxScope">Scope</label><select id="ctxScope" class="select"><option>Workspace · all agents</option>${SYSTEMS.slice(0, 4).map(s => `<option>${s.name} · System</option>`).join("")}</select></div>`;
  let pane = "";
  if (t === "files") pane = scope + `<div class="card res">${CONTEXT_FILES.map(([n, k, e], i) => `<div class="res-item clickable" data-file="${i}" tabindex="0">${ic("file-text", "os")}<div><div class="ttl"><span class="mono">${esc(n)}</span></div><div class="meta"><span>Workspace · all agents</span><span>Edited ${e}</span></div></div><span class="row-tools"><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Edit ${esc(n)}" data-tip="Edit" data-edit="${i}">${ic("pen-line")}</button><button class="btn btn-ghost btn-icon btn-sm btn-danger" type="button" aria-label="Delete ${esc(n)}" data-tip="Delete" data-del="${i}">${ic("trash-2")}</button></span></div>`).join("")}</div>
    <div><button class="btn" id="addFile">${ic("plus")}Add file</button></div>`;
  if (t === "skills") pane = scope + `<div class="empty"><div class="ic">${ic("sparkles")}</div><h3>No skills attached to this scope</h3><p>Skills here are added to every agent working in this scope. Create or import skills in Customize › Skills first.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" id="ctxAddSkill">${ic("plus")}Add skill</button><a class="btn btn-ghost btn-sm" href="#skills">Go to Skills</a></div></div>`;
  if (t === "repos") pane = `<div class="field" style="max-width:420px"><span class="flabel" id="crRL">Repository</span><div class="combo" id="ctxRepo" style="width:100%"><button class="btn combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="crRL"><span class="ph">Choose a repository</span>${ic("chevrons-up-down")}</button></div><span class="hint">From your VCS connections. You can also type an owner/repository name.</span></div>
    <div><button class="btn" id="loadRepo" disabled>Load repository</button></div><div id="repoOut"><p class="hint">Choose a repository to view its context.</p></div>`;
  return czShell("context", "Context", "Files, skills and repository notes that agents read before they work.", "", tabs + `<div class="tabpane">${pane}</div>`);
}
function bindContext() {
  bindCz();
  $$("[data-ct]").forEach(b => b.onclick = () => { S.ctxTab = b.dataset.ct; render(); });
  const edit = (i, add) => { const f = add ? ["", "", "", ""] : CONTEXT_FILES[i];
    const d = modal(add ? "Add file" : "Edit file", `<div class="field"><label for="fName">File name</label><input id="fName" class="input mono-in" value="${esc(f[0])}" placeholder="e.g. AGENT-PROFILE.yaml"></div>
      <div class="field"><label for="fBody">Content</label><textarea id="fBody" class="textarea mono-area" rows="12" spellcheck="false">${esc(f[3])}</textarea><span class="hint">Shown as written. Only values stored as secrets stay hidden (UX-034).</span></div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="fSave" ${add ? "disabled" : ""}>Save</button>`, { wide: true });
    const chk = () => d.querySelector("#fSave").disabled = !(d.querySelector("#fName").value.trim() && d.querySelector("#fBody").value.trim());
    d.querySelector("#fName").oninput = chk; d.querySelector("#fBody").oninput = chk;
    d.querySelector("#fSave").onclick = () => { closeOverlay(); toast((add ? "Added " : "Saved ") + d.querySelector("#fName").value); }; };
  $$("[data-edit]").forEach(b => b.onclick = e => { e.stopPropagation(); edit(+b.dataset.edit); });
  $$("[data-del]").forEach(b => b.onclick = e => { e.stopPropagation(); const n = CONTEXT_FILES[+b.dataset.del][0]; dialog(`Delete ${n}?`, "Agents in this scope stop reading it from their next session. This can't be undone.", "Delete file", () => toast(n + " deleted"), true); });
  $$("[data-file]").forEach(r => { const go = () => { const f = CONTEXT_FILES[+r.dataset.file]; drawer(f[0], `<p class="hint">Workspace · all agents · edited ${f[2]}</p><div class="code"><div class="code-h"><span>${f[1].toUpperCase()}</span><button class="btn btn-ghost btn-sm" type="button" data-copy="${esc(f[3])}">${ic("copy")}Copy</button></div><pre>${esc(f[3])}</pre></div>`, `<button class="btn" data-close>Close</button><button class="btn btn-primary" id="dEdit">Edit file</button>`); bindCopy($(".drawer")); $("#dEdit").onclick = () => edit(+r.dataset.file); }; r.onclick = go; r.onkeydown = e => { if (e.key === "Enter" && e.target === r) go(); }; });
  $("#addFile")?.addEventListener("click", () => edit(0, true));
  $("#ctxAddSkill")?.addEventListener("click", () => { const d = modal("Add skill", `<div class="field"><label for="asSel">Skill</label><select id="asSel" class="select">${SKILLS.map(s => `<option>${s.name} · ${s.ver}</option>`).join("")}</select></div>`, `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="asOk">Add skill</button>`); d.querySelector("#asOk").onclick = () => { closeOverlay(); toast("Skill added to this scope"); }; });
  comboBind("ctxRepo", [["Your connections", [["rentify/support-api", "Rentify org"], ["rentify/web-app", "Rentify org"], ["hris/frontend-mpp", "HRIS Azure"]]]], () => $("#loadRepo").disabled = false);
  $("#loadRepo")?.addEventListener("click", () => { $("#repoOut").innerHTML = `<div class="card res"><div class="res-item">${ic("file-text", "os")}<div><div class="ttl"><span class="mono">AGENTS.md</span></div><div class="meta"><span>rentify/support-api · default branch</span></div></div></div><div class="res-item">${ic("file-text", "os")}<div><div class="ttl"><span class="mono">.konteks/context.yaml</span></div><div class="meta"><span>rentify/support-api · default branch</span></div></div></div></div>`; drawIcons(); });
}

/* ---------- Skills: Installed / Import skills, Create Skill ---------- */
function pageSkills() {
  const t = S.skillTab;
  const tabs = `<div class="tabs" role="tablist" aria-label="Skills">${[["installed", "Installed"], ["import", "Import skills"]].map(([k, l]) => `<button class="tab" role="tab" data-st="${k}" aria-selected="${t === k}">${l}</button>`).join("")}</div>`;
  const pane = t === "installed" ? `<div class="card res">${SKILLS.map(s => `<div class="res-item clickable" data-skill="${s.name}" tabindex="0"><span class="tool-ic">${ic("sparkles")}</span><div><div class="ttl">${s.name} <span class="num hint">${s.ver}</span>${s.builtin ? `<span class="tag">Built-in</span>` : ""}</div><div class="meta"><span>${esc(s.desc)}</span></div></div>${ic("chevron-right", "os")}</div>`).join("")}</div>`
    : `<p class="hint">Choose a public repository or a connected Git repository. Konteks always uses the repository's default branch. Imported skills are active and available to matching agents by default.</p>
      <div class="seg" role="group" aria-label="Source"><button type="button" aria-pressed="true" data-src="public">Public Git</button><button type="button" aria-pressed="false" data-src="conn">Connected Git</button></div>
      <div id="impSrc"><div class="field" style="max-width:520px"><label for="impUrl">Repository URL</label><input id="impUrl" class="input" placeholder="https://github.com/owner/skills"><span class="hint">Public repositories are read through the configured Git broker.</span></div></div>
      <div><button class="btn btn-primary" id="findSkills" disabled>Find skills</button></div><div id="impOut"></div>`;
  return czShell("skills", "Skills", "Reusable instructions agents load when a task matches.", `<button class="btn btn-primary" id="createSkill">${ic("plus")}Create skill</button>`, tabs + `<div class="tabpane">${pane}</div>`);
}
function bindSkills() {
  bindCz();
  $$("[data-st]").forEach(b => b.onclick = () => { S.skillTab = b.dataset.st; render(); });
  $$("[data-skill]").forEach(r => { const go = () => { const s = SKILLS.find(x => x.name === r.dataset.skill); drawer(s.name, `<div class="callout">${ic("lock")}<span class="grow"><b>Built-in skill.</b> Available to everyone. Built-in skills are managed by Konteks and can't be changed or deleted.</span></div>
      <div class="props">${[["Status", st("ok", "Active")], ["Version", `<span class="num">${s.ver}</span>`], ["Organization", "Global"], ["Created", s.created]].map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b}</div></div>`).join("")}</div>
      <div style="display:grid;gap:6px"><h3 class="h-sub">Description</h3><p>${esc(s.desc)}</p></div>
      <div style="display:grid;gap:6px"><h3 class="h-sub">Metadata</h3><div class="kvread"><span class="mono">builtin</span><span class="mono">true</span><span class="mono">builtinKey</span><span class="mono">${s.name}</span></div></div>
      <div style="display:grid;gap:6px"><h3 class="h-sub">Versions</h3><div class="card ver"><div class="ver-row"><span class="num">${s.ver}</span><span class="hint">4 Sep 2026 · current</span><button class="btn btn-sm" type="button" id="evalBtn">Evaluate ${s.ver}</button></div></div></div>`); $("#evalBtn").onclick = () => toast("Evaluation started for " + s.name + " " + s.ver); }; r.onclick = go; r.onkeydown = e => { if (e.key === "Enter") go(); }; });
  $$("[data-src]").forEach(b => b.onclick = () => { $$("[data-src]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#impSrc").innerHTML = b.dataset.src === "public" ? `<div class="field" style="max-width:520px"><label for="impUrl">Repository URL</label><input id="impUrl" class="input" placeholder="https://github.com/owner/skills"><span class="hint">Public repositories are read through the configured Git broker.</span></div>` : `<div class="field" style="max-width:520px"><label for="impUrl">Connected repository</label><select id="impUrl" class="select"><option value="">Choose a repository</option><option>rentify/agent-skills · Rentify org</option><option>hris/skills · HRIS Azure</option></select></div>`; wireImp(); });
  const wireImp = () => { const u = $("#impUrl"); if (!u) return; const chk = () => $("#findSkills").disabled = !u.value.trim(); u.oninput = chk; u.onchange = chk; };
  wireImp();
  $("#findSkills")?.addEventListener("click", e => { const b = e.currentTarget; b.innerHTML = `<span class="spin"></span>Finding skills`; b.disabled = true; setTimeout(() => { b.textContent = "Find skills"; b.disabled = false; $("#impOut").innerHTML = `<div class="card res">${[["readme-writer", "Write and validate service READMEs from current source."], ["release-notes", "Draft release notes from merged pull requests."]].map(([n, d]) => `<label class="res-item"><input type="checkbox" checked><div><div class="ttl">${n}</div><div class="meta"><span>${d}</span></div></div><span></span></label>`).join("")}</div><div style="margin-top:12px"><button class="btn btn-primary" onclick="toast('2 skills imported and active')">Import 2 skills</button></div>`; }, 900); });
  $("#createSkill")?.addEventListener("click", createSkill);
}
function createSkill() {
  const sect = (t, body) => `<section class="form-sec"><h3 class="h-sub">${t}</h3>${body}</section>`;
  const kv = (id, a, b) => `<div class="kv" id="${id}"><div class="kv-h"><span>${a}</span><span>${b}</span><span></span></div><button class="btn btn-ghost btn-sm" type="button" data-kvadd="${id}" style="justify-self:start">${ic("plus")}Add entry</button></div>`;
  const d = modal("Create skill", sect("Basic information", `<div class="field"><label for="skName">Name <span class="req-m" aria-hidden="true">required</span></label><input id="skName" class="input" required placeholder="e.g. readme-writer"></div>
      <div class="field"><label for="skDesc">Description <span class="req-m" aria-hidden="true">required</span></label><textarea id="skDesc" class="textarea" rows="2" required placeholder="When agents should use this skill"></textarea></div>
      <div class="field"><span class="flabel" id="skMdL">Skill instructions (Markdown) <span class="req-m" aria-hidden="true">required</span></span>${mdEditor("skMd")}</div>`)
    + sect("Optional", `<div class="grid2"><div class="field"><label for="skVer">Version</label><input id="skVer" class="input" placeholder="1.0.0"></div><div class="field"><label for="skLic">License</label><input id="skLic" class="input" placeholder="MIT, Apache-2.0, …"></div><div class="field"><label for="skComp">Compatibility</label><input id="skComp" class="input" placeholder="e.g. claude-code>=1.0"></div><div class="field"><label for="skTools">Allowed tools</label><input id="skTools" class="input" placeholder="read, write, bash, grep"></div></div>`)
    + sect("Metadata", kv("kvMeta", "Key", "Value")) + sect("Scripts", kv("kvScr", "Path", "Content")) + sect("References", kv("kvRef", "Path", "Content")) + sect("Assets", kv("kvAst", "Path", "Content")),
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="skOk" disabled>Create skill</button>`, { wide: true });
  bindMd(d, "skMd"); bindKv(d);
  const chk = () => d.querySelector("#skOk").disabled = !(d.querySelector("#skName").value.trim() && d.querySelector("#skDesc").value.trim() && d.querySelector("#skMd textarea").value.trim());
  ["#skName", "#skDesc", "#skMd textarea"].forEach(s => d.querySelector(s).addEventListener("input", chk));
  d.querySelector("#skOk").onclick = () => { closeOverlay(); toast("Skill created"); };
}
function mdEditor(id) {
  return `<div class="md" id="${id}"><div class="md-bar" role="toolbar" aria-label="Formatting">${[["heading-1", "Add H1 heading", "# "], ["heading-2", "Add H2 heading", "## "], ["heading-3", "Add H3 heading", "### "], ["bold", "Add bold", "**"], ["italic", "Add italic", "_"], ["list", "Add list item", "- "], ["list-ordered", "Add numbered list item", "1. "], ["minus", "Add horizontal line", "\n---\n"], ["link", "Add link", "[]()"], ["code", "Add inline code", "`"], ["square-code", "Add preformatted block", "```\n"]].map(([i, l, t]) => `<button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="${l}" data-tip="${l.replace("Add ", "")}" data-md="${esc(t)}">${ic(i)}</button>`).join("")}
    <div class="seg" role="group" aria-label="Mode"><button type="button" aria-pressed="true" data-mdmode="edit">Edit</button><button type="button" aria-pressed="false" data-mdmode="prev">Preview</button></div></div>
    <textarea aria-label="Skill instructions in Markdown" placeholder="## When to use&#10;Describe when the agent should load this skill, then the steps it follows."></textarea><div class="md-prev" hidden></div>
    <div class="md-foot"><span>Markdown</span><span data-mdc>0 / 50,000</span></div></div>`;
}
function bindMd(root, id) {
  const box = root.querySelector("#" + id), t = box.querySelector("textarea"), cnt = () => box.querySelector("[data-mdc]").textContent = `${t.value.length.toLocaleString("en-US")} / 50,000`;
  t.addEventListener("input", cnt); cnt();
  $$("[data-md]", box).forEach(b => b.onclick = () => { const k = b.dataset.md, s = t.selectionStart, e = t.selectionEnd, sel = t.value.slice(s, e) || "text"; const ins = k === "**" || k === "_" || k === "`" ? k + sel + k : k === "[]()" ? `[${sel}](https://)` : k.startsWith("```") ? "\n```\n" + sel + "\n```\n" : k.startsWith("\n") ? k : "\n" + k + sel; t.setRangeText(ins, s, e, "end"); t.focus(); t.dispatchEvent(new Event("input")); });
  $$("[data-mdmode]", box).forEach(b => b.onclick = () => { const prev = b.dataset.mdmode === "prev"; $$("[data-mdmode]", box).forEach(x => x.setAttribute("aria-pressed", x === b)); t.hidden = prev; box.querySelector(".md-prev").hidden = !prev; if (prev) box.querySelector(".md-prev").innerHTML = renderMd(t.value) || `<p class="hint">Nothing to preview yet.</p>`; });
}
function bindKv(root) {
  const wire = () => $$("[data-kvdel]", root).forEach(b => b.onclick = () => b.closest(".kv-row").remove());
  $$("[data-kvadd]", root).forEach(b => b.onclick = () => { const kv = root.querySelector("#" + b.dataset.kvadd), [a, c] = [...kv.querySelectorAll(".kv-h span")].map(x => x.textContent), n = kv.querySelectorAll(".kv-row").length + 1;
    b.insertAdjacentHTML("beforebegin", `<div class="kv-row"><input class="input" aria-label="${a} ${n}" placeholder="${a}"><input class="input" aria-label="${c} ${n}" placeholder="${c}"><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove entry ${n}" data-kvdel>${ic("x")}</button></div>`); drawIcons(); wire(); kv.querySelectorAll(".kv-row")[n - 1].querySelector("input").focus(); });
}

/* ---------- Tools ---------- */
function pageTools() {
  const inner = `<p class="hint">${TOOLS.length} tools</p><div class="card res">${TOOLS.map(t => `<div class="res-item clickable" data-tool="${t.name}" tabindex="0"><span class="tool-ic">${ic("wrench")}</span><div><div class="ttl">${t.name} <span class="num hint">${t.ver}</span></div><div class="meta"><span>${esc(t.desc)}</span></div></div>${ic("chevron-right", "os")}</div>`).join("")}</div>`;
  return czShell("tools", "Tools", "Manage reusable tools that agents can use in sessions.", `<button class="btn btn-primary" id="createTool">${ic("plus")}Create tool</button>`, inner);
}
function bindTools() {
  bindCz();
  $$("[data-tool]").forEach(r => { const go = () => { const t = TOOLS.find(x => x.name === r.dataset.tool); drawer(t.name, `<div class="props">${[["Status", st("ok", "Active")], ["Version", `<span class="num">${t.ver}</span>`], ["Tenant", "default"], ["Created", t.created]].map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b}</div></div>`).join("")}</div>
      <div style="display:grid;gap:6px"><h3 class="h-sub">Description</h3><p>${esc(t.desc)}</p></div>
      <div style="display:grid;gap:6px"><h3 class="h-sub">Versions</h3><div class="card ver">${t.versions.map(([v, d], i) => `<div class="ver-row"><span class="num">${v}</span><span class="hint">${d}${i ? "" : " · current"}</span><span></span></div>`).join("")}</div></div>`); }; r.onclick = go; r.onkeydown = e => { if (e.key === "Enter") go(); }; });
  $("#createTool")?.addEventListener("click", () => {
    const d = modal("Create tool", `<div class="grid2"><div class="field"><label for="tlName">Name <span class="req-m">required</span></label><input id="tlName" class="input mono-in" placeholder="my-tool"></div><div class="field"><label for="tlVer">Version</label><input id="tlVer" class="input" placeholder="1.0.0"></div></div>
      <div class="field"><label for="tlDesc">Description</label><textarea id="tlDesc" class="textarea" rows="3" placeholder="What this tool does"></textarea></div>
      <div class="field"><label class="check" style="align-items:center"><input type="checkbox" class="switch" id="tlParams"><span>Input parameters<small>Leave this off for a tool that accepts no input. You can add parameters later with a new version.</small></span></label></div>
      <div id="tlKv" hidden><div class="kv" id="kvTl"><div class="kv-h"><span>Parameter</span><span>Type and description</span><span></span></div><button class="btn btn-ghost btn-sm" type="button" data-kvadd="kvTl" style="justify-self:start">${ic("plus")}Add parameter</button></div></div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="tlOk" disabled>Create tool</button>`);
    bindKv(d); d.querySelector("#tlParams").onchange = e => d.querySelector("#tlKv").hidden = !e.target.checked;
    d.querySelector("#tlName").oninput = e => d.querySelector("#tlOk").disabled = !e.target.value.trim();
    d.querySelector("#tlOk").onclick = () => { closeOverlay(); toast("Tool created"); };
  });
}

/* ---------- MCPs ---------- */
function pageMcps() {
  const inner = `<div class="empty"><div class="ic">${ic("package")}</div><h3>No MCPs yet</h3><p>An MCP package tells agents how to start an MCP server on their computer: the command, its arguments and environment variables. Versions keep older sessions stable.</p><button class="btn btn-sm" id="createMcp2">${ic("plus")}Create MCP</button></div>`;
  return czShell("mcps", "MCPs", "Manage versioned MCP packages that agents can install locally.", `<button class="btn btn-primary" id="createMcp">${ic("plus")}Create MCP</button>`, inner);
}
function bindMcps() {
  bindCz();
  const open = () => {
    const d = modal("Create MCP", `<div class="grid2"><div class="field"><label for="mcName">Name <span class="req-m">required</span></label><input id="mcName" class="input mono-in" placeholder="my-mcp-server"></div><div class="field"><label for="mcVer">Version</label><input id="mcVer" class="input" placeholder="1.0.0"></div></div>
      <div class="field"><label for="mcDesc">Description</label><textarea id="mcDesc" class="textarea" rows="2" placeholder="What this MCP server does"></textarea></div>
      <div class="field"><label for="mcCmd">Command <span class="req-m">required</span></label><input id="mcCmd" class="input mono-in" placeholder="npx -y @scope/mcp-server"><span class="hint">The program agents run to start the server.</span></div>
      <div class="field"><label for="mcArgs">Arguments <span class="hint">· one per line</span></label><textarea id="mcArgs" class="textarea mono-area" rows="3" placeholder="--port 8080&#10;--verbose"></textarea></div>
      <div class="field"><span class="flabel">Environment variables</span><div class="kv" id="kvMc"><div class="kv-h"><span>Name</span><span>Value</span><span></span></div><button class="btn btn-ghost btn-sm" type="button" data-kvadd="kvMc" style="justify-self:start">${ic("plus")}Add entry</button></div></div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="mcOk" disabled>Create MCP</button>`, { wide: true });
    bindKv(d); const chk = () => d.querySelector("#mcOk").disabled = !(d.querySelector("#mcName").value.trim() && d.querySelector("#mcCmd").value.trim());
    d.querySelector("#mcName").oninput = chk; d.querySelector("#mcCmd").oninput = chk;
    d.querySelector("#mcOk").onclick = () => { closeOverlay(); toast("MCP created"); };
  };
  $("#createMcp")?.addEventListener("click", open); $("#createMcp2")?.addEventListener("click", open);
}

/* ---------- Connectors: three toggles, with the effective state next to each (UX-037) ---------- */
function pageConnectors() {
  const sw = (id, label, help, on, eff) => `<div class="setrow"><label class="check" for="${id}"><input type="checkbox" class="switch" id="${id}" ${on ? "checked" : ""}><span>${label}<small>${help}</small></span></label><span class="eff">${eff}</span></div>`;
  const inner = `<div class="card"><div class="card-b" style="gap:0">
      ${sw("cn1", "Use my connections in Konteks", "Agents on your computers read Jira, Slack, Teams and Asana links with your own sign-in.", true, st("warn", "Not in effect yet"))}
      ${sw("cn2", "Allow connections in this workspace", "Lets everyone's agents use their own connections here.", true, st("ok", "On"))}
      ${sw("cn3", "Read links with the fastest model", "Short reads use a quicker model. Planning and delivery are not affected.", true, st("ok", "On"))}</div></div>
    <div class="callout warn">${ic("info")}<span class="grow"><b>No computer of yours can use connections yet.</b> Connect a computer with Codex or Claude Code in <a href="#runtimes">Connected runtimes</a>.</span></div>`;
  return czShell("connectors", "Connections through your agents", "Jira, Slack, Teams and Asana, read with the connection your own agent already has. Konteks never holds a provider password or token.", "", inner);
}
function bindConnectors() { bindCz(); $$(".setrow .switch").forEach(s => s.onchange = () => toast(s.closest("label").querySelector("span").firstChild.textContent.trim() + (s.checked ? " is on" : " is off"))); }

/* ---------- VCS Connectors ---------- */
function pageVcs() {
  const inner = `<div class="lockrow">${ic("eye")}<span class="grow">You can see these connectors. Adding, testing or changing one needs a Workspace Owner.</span><button class="btn btn-ghost btn-sm" type="button" id="vcsCheck">${ic("rotate-cw")}Check again</button><button class="btn btn-sm" type="button" data-reqrole="Workspace Owner">Review or request access</button></div>
    <p class="hint">${VCS.length} connectors</p>
    <div class="tablewrap"><table class="dtable"><thead><tr><th>Connector</th><th>Provider</th><th>Owner</th><th>URL</th><th>Token</th><th>Status</th></tr></thead><tbody>
      ${VCS.map(([n, p, u, t, o], i) => `<tr class="clickable" data-vcs="${i}" tabindex="0"><td><b style="font-weight:500">${esc(n)}</b></td><td>${p}</td><td>${o === "Ardian Yusuf" ? "You" : esc(o)}</td><td class="mono">${esc(u.replace("https://", ""))}</td><td class="mono">${t}••••</td><td>${st("ok", "Connected")}</td></tr>`).join("")}
    </tbody></table></div>`;
  return czShell("vcs", "VCS Connectors", "Connections Konteks uses to read repositories and open pull requests.", "", inner);
}
function bindVcs() {
  bindCz(); bindLock(); $("#vcsCheck")?.addEventListener("click", () => toast("Still view-only for your role"));
  /* Row → drawer with what the connector is and who it belongs to (UX-030). View-only, like the page. */
  $$("[data-vcs]").forEach(r => { const go = () => { const [n, p, u, tk, o, sys] = VCS[+r.dataset.vcs];
    drawer(n, `<div class="props">${[["Provider", p], ["URL", `<span class="mono">${esc(u.replace("https://", ""))}</span>`], ["Token", `<span class="mono">${tk}••••</span>`], ["Owner", o === "Ardian Yusuf" ? "You" : esc(o)], ["Used by", sys.map(s => esc(s)).join(", ")], ["Status", st("ok", "Connected")]].map(([k, v]) => `<div class="prop"><span>${k}</span><div>${v}</div></div>`).join("")}</div>
      <p class="hint">${o === "Organization" ? "An organization connection: Konteks reads with the organization's credentials." : "A personal connection: Konteks reads with " + (o === "Ardian Yusuf" ? "your" : esc(o.split(" ")[0]) + "'s") + " credentials, so pick it on purpose."}</p>
      <div class="lockrow">${ic("eye")}<span class="grow">Testing or changing this connector needs a Workspace Owner.</span></div>`); };
    r.onclick = go; r.onkeydown = e => { if (e.key === "Enter") go(); }; });
}

/* ---------- Operations: Channels + Ops Profiles. Order of the channel form is provider → create → copy (UX-036). ---------- */
const OPS_PROVIDERS = {
  Datadog: ["Integrations → Webhooks → your webhook → Payload", "Datadog retries a 5xx five times, so a repeat is expected and is folded rather than counted twice.", `{\n  "alert_id": "$ALERT_ID",\n  "alert_title": "$ALERT_TITLE",\n  "alert_transition": "$ALERT_TRANSITION",\n  "alert_status": "$ALERT_STATUS",\n  "priority": "$PRIORITY",\n  "hostname": "$HOSTNAME",\n  "tags": "$TAGS",\n  "date": "$DATE_POSIX",\n  "link": "$LINK"\n}`],
  PostHog: ["Data pipelines → Destinations → Webhook", "PostHog sends one request per event; Konteks groups events from the same alert.", `{\n  "event": "{event.event}",\n  "distinct_id": "{event.distinct_id}",\n  "timestamp": "{event.timestamp}"\n}`],
  "Loki via Alertmanager": ["alertmanager.yml → receivers → webhook_configs", "Alertmanager groups alerts itself; Konteks keeps its grouping.", `receivers:\n  - name: konteks\n    webhook_configs:\n      - url: <channel URL>\n        http_config:\n          authorization:\n            credentials: <secret>`],
  "Loki via Grafana alerting": ["Alerting → Contact points → Webhook", "Grafana resends while an alert fires; repeats are folded.", `{\n  "receiver": "konteks",\n  "status": "{{ .Status }}",\n  "alerts": "{{ .Alerts }}"\n}`],
  "Anything else": ["Your provider's outgoing webhook settings", "Send JSON with at least a title and a status.", `{\n  "title": "Checkout errors above 2%",\n  "status": "firing",\n  "severity": "high"\n}`],
};
function pageOperations() {
  const inner = `<section class="sec"><div class="sec-title"><div><h3 class="h-sub">Channels</h3><p class="hint">Where telemetry alerts arrive and become Issues.</p></div><button class="btn btn-primary btn-sm" id="opAdd">${ic("plus")}Add a channel</button></div>
      ${`<div class="empty"><div class="ic">${ic("radio-tower")}</div><h3>No telemetry sends here yet</h3><p>Add a channel, then paste its setup into your provider.</p></div>`}</section>
    <section class="sec"><div class="sec-title"><div><h3 class="h-sub">Ops Profiles</h3><p class="hint">A profile can open incidents and wake the agent on your behalf. It can never approve a change.</p></div></div>
      <div class="empty"><div class="ic">${ic("user-cog")}</div><h3>No Ops Profiles yet</h3><p>A profile is set up on the System it watches, from that System's own screen.</p></div></section>`;
  return czShell("operations", "Operations", "Telemetry channels and the profiles that act on alerts.", "", inner);
}
function opsSetup(p) {
  const [path, note, body] = OPS_PROVIDERS[p];
  return `<div class="callout info">${ic("circle-check")}<span class="grow"><b>Channel created.</b> Copy the secret now; it is shown only once.</span></div>
    <ol class="steps"><li><b>Open ${esc(p)}</b><p>${esc(path)}</p></li>
      <li><b>Set the URL and header</b>${cmd("https://hooks.konteks.example/ch/7f3a9c21", "Copy URL")}<p>Add a custom header <code>Authorization: Bearer</code> followed by this secret:</p>${cmd("kxops_5d2b81e0c47a9f36", "Copy secret")}<p class="hint">${esc(note)}</p></li>
      <li><b>Paste the body</b><div class="code"><div class="code-h"><span>The body to paste</span><button class="btn btn-ghost btn-sm" type="button" data-copy="${esc(body)}">${ic("copy")}Copy</button></div><pre>${esc(body)}</pre></div></li></ol>
`;
}
function bindOperations() {
  bindCz();
  $("#opAdd")?.addEventListener("click", addChannel);
}
/* Same shape as Connect a runtime: one modal, step 1 is the form, step 2 is the setup it produces. */
function addChannel() {
  const prov = S.opsProv || "Datadog";
  const d = modal("Add a channel", `<div class="field"><label for="opProv">Where the alerts come from</label><select id="opProv" class="select">${Object.keys(OPS_PROVIDERS).map(k => `<option ${prov === k ? "selected" : ""}>${k}</option>`).join("")}</select>
      <span class="hint" id="opHint">After you create the channel, Konteks shows its URL, a secret for the Authorization header, and the body to paste into ${esc(prov)}.</span></div>
    <div class="field"><label for="opName">Channel name <span class="req-m">optional</span></label><input id="opName" class="input" placeholder="e.g. Rentify production alerts"></div>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opCreate">Create the channel</button>`, { wide: true, sub: "Step 1 of 2 · Choose the provider" });
  d.querySelector("#opProv").onchange = e => { S.opsProv = e.target.value; d.querySelector("#opHint").textContent = `After you create the channel, Konteks shows its URL, a secret for the Authorization header, and the body to paste into ${e.target.value}.`; };
  d.querySelector("#opCreate").onclick = e => {
    const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spin"></span>Creating`;
    setTimeout(() => {
      const p = S.opsProv || "Datadog";
      modalStep(d, { sub: `Step 2 of 2 · Paste the setup into ${esc(p)}`, body: opsSetup(p), foot: `<button class="btn btn-primary" id="opDone">Done</button>` });
      bindCopy(d);
      d.querySelector("#opDone").onclick = () => { closeOverlay(); toast("Channel ready. Alerts will appear in Issues"); };
    }, 700);
  };
}
