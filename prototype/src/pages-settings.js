/* ---------- Settings: General, Plan, Usage, Budgets, Payments (the live tabs) ---------- */
const SET = [["general", "General"], ["plan", "Plan"], ["usage", "Usage"], ["budgets", "Budgets"], ["payments", "Payments"]];
function setShell(cur, inner) {
  const body = `<div class="pagehead">${phead("Settings", "You, your workspace and how it looks; your plan, usage and payments.")}
    <div class="tabs" role="tablist" aria-label="Settings">${SET.map(([k, l]) => `<a class="tab" role="tab" href="#${k}" aria-selected="${cur === k}">${l}</a>`).join("")}</div></div>
    <div class="set-body">${inner}</div>`;
  return shell("settings", "", body, { flush: true });
}
const sec = (t, sub, body) => `<section class="set-sec"><div class="set-l"><h2 class="h-sec">${t}</h2>${sub ? `<p>${sub}</p>` : ""}</div><div class="set-r">${body}</div></section>`;

function pageGeneral() {
  const theme = document.documentElement.dataset.theme || "system";
  return setShell("general",
    sec("Workspace", "The name everyone in this workspace sees. Its id, refactory, stays the same.", `<div class="field"><span class="flabel">Workspace name</span><div class="ro">${ic("lock")}Refactory</div></div>${lockStrip("Only the Workspace Owner can rename it.", "Workspace Owner")}`)
    + sec("Profile", "How your name appears to your team.", `<div class="field"><label for="pfName">Display name</label><input id="pfName" class="input" value="Ardian Yusuf"></div><div><button class="btn btn-primary btn-sm" id="pfSave" disabled>Save</button></div>`)
    + sec("Appearance", "Choose your preferred theme.", `<div class="seg" role="group" aria-label="Theme">${["System", "Light", "Dark"].map(x => `<button type="button" data-themeset="${x.toLowerCase()}" aria-pressed="${theme === x.toLowerCase()}">${x}</button>`).join("")}</div>`)
    + sec("Sounds", "Short, quiet tones for moments that matter: an agent finished, an agent or a teammate needs you, an action went through, or something failed.", `<div class="setrow"><label class="check" for="sndOn"><input type="checkbox" class="switch" id="sndOn" ${S.sound ? "checked" : ""}><span>Play sounds<small>Remembered on this browser. Never plays in a loop.</small></span></label><span style="display:flex;gap:6px;flex-wrap:wrap">${[["done", "Agent finished"], ["needs", "Needs you"], ["ok", "Done"], ["error", "Error"]].map(([k, l]) => `<button class="btn btn-ghost btn-sm" type="button" data-sfx="${k}">${ic("play")}${l}</button>`).join("")}</span></div>`)
    + sec("Language", "Choose your preferred language. Dates and numbers follow it.", `<div class="seg" role="group" aria-label="Language">${[["auto", "Auto detect"], ["en", "English"], ["id", "Indonesian"]].map(([k, l]) => `<button type="button" data-lang="${k}" aria-pressed="${(S.langPref || "auto") === k}">${l}</button>`).join("")}</div>`));
}
function bindGeneral() {
  bindLock();
  $("#sndOn")?.addEventListener("change", e => { setSound(e.target.checked); $("#soundBtn") && render(); });
  $$("[data-sfx]").forEach(b => b.onclick = () => { if (!S.sound) return toast("Sounds are off. Turn them on to hear a preview", "err"); sfx(b.dataset.sfx); });
  $("#pfName")?.addEventListener("input", e => $("#pfSave").disabled = !e.target.value.trim() || e.target.value === "Ardian Yusuf");
  $("#pfSave")?.addEventListener("click", e => { e.currentTarget.disabled = true; toast("Display name saved"); });
  $$("[data-themeset]").forEach(b => b.onclick = () => { const v = b.dataset.themeset; if (v === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v; $$("[data-themeset]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $$("[data-lang]").forEach(b => b.onclick = () => { S.langPref = b.dataset.lang; $$("[data-lang]").forEach(x => x.setAttribute("aria-pressed", x === b)); toast("Language preference saved"); });
}

function pagePlan() {
  const ent = [["Seats", "Unlimited"], ["Systems", "Unlimited"], ["Repositories", "Unlimited"], ["MCP access", "Enabled"], ["Validation checks", "Enabled"], ["Your own runtimes", "Enabled"], ["Presence", "Enabled"]];
  return setShell("plan",
    sec("Subscription", "", `<div class="card"><div class="card-h"><h3>Enterprise</h3>${st("ok", "Active")}<span class="hint">Renews on 10 Nov 2026</span></div><div class="card-b props wide">
      ${[["Included monthly Story Points", "10,000.00 SP"], ["Story Points available", "1,009,901.67 SP"], ["Purchased balance", "0.00 SP"], ["Overage", "Disabled"]].map(([a, b]) => `<div class="prop"><span>${a}</span><div class="${/SP/.test(b) ? "mono" : ""}">${b}</div></div>`).join("")}</div></div>`)
    + sec("Plan entitlements", "", `<div class="card"><div class="card-b props wide">${ent.map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b === "Enabled" ? st("ok", "Enabled") : b}</div></div>`).join("")}</div></div><div><button class="btn" id="cmpPlans">Compare plans${ic("arrow-up-right")}</button></div>`));
}
function bindPlan() {
  $("#cmpPlans")?.addEventListener("click", () => toast("Compare plans opens the plan comparison. Not part of this demo"));
}

function pageUsage() {
  const rows = [["Chat with agents", "Repository-aware chat", 680, 3.40], ["Model tokens", "Direct model calls", 225, 3.39], ["Ideas and planning", "Ideation and planning runs", 24, 2.40], ["Agent work", "Ticket execution", 3, 0.40], ["Not reported", "Runs that ended before they reported their work", 21, 8.74]];
  const total = rows.reduce((a, r) => a + r[3], 0);
  return setShell("usage",
    `<div class="summary-strip"><div class="ss"><span>Spent, last 30 days</span><b class="mono">${total.toFixed(2)} SP</b><small>28 Sep – 27 Oct 2026</small></div><div class="ss"><span>Left</span><b class="mono">1,009,901.67 SP</b><small>Includes points granted outside the plan</small></div><div class="ss"><span>This period</span><b>10 Oct – 10 Nov 2026</b><small>Renews on 10 Nov 2026</small></div></div>
    <p class="hint" style="max-width:72ch">Enterprise includes 10,000.00 SP each period. Left is higher because the balance also keeps points granted outside the plan. Spent covers the last 30 days, the window usage is reported for, so it does not follow the plan period.</p>
    <section class="card"><div class="card-h"><h3>What drove it</h3><span class="hint">Last 30 days</span></div><div class="tablewrap flat"><table class="dtable"><thead><tr><th>Work</th><th class="num">Uses</th><th class="num">Story Points</th><th class="num">Share</th></tr></thead><tbody>
      ${rows.map(([a, b, u, p]) => `<tr><td><div style="display:grid"><b style="font-weight:500">${a}</b><span class="hint">${b}</span></div>${a === "Not reported" ? `<span class="hint why-line">${ic("info")}Mostly the 12 planning retries on Kurir Hub user manual that ended before reporting: charged, but with no work label.</span>` : ""}</td><td class="num">${u}</td><td class="num mono">${p.toFixed(2)}</td><td class="num"><div class="share"><span class="prog"><i style="width:${p / total * 100}%"></i></span>${Math.round(p / total * 100)}%</div></td></tr>`).join("")}
      <tr class="total"><td><b>Total</b></td><td class="num">953</td><td class="num mono"><b>${total.toFixed(2)}</b></td><td></td></tr></tbody></table></div>
      <div class="card-f"><button class="btn btn-sm" id="moreDetail">More detail</button></div></section>`);
}
function bindUsage() {
  $("#moreDetail")?.addEventListener("click", () => drawer("Usage detail", `<div class="tablewrap"><table class="dtable"><thead><tr><th>Initiative</th><th class="num">Story Points</th></tr></thead><tbody>${[["Kurir Hub user manual", 9.12], ["Refresh the Support API README", 3.08], ["SensePortal performance pass", 2.71], ["Invoice export for Ledgerline", 1.96], ["Chat without an initiative", 1.46]].map(([a, b]) => `<tr><td>${a}</td><td class="num mono">${b.toFixed(2)}</td></tr>`).join("")}</tbody></table></div>`));
}

/* Budgets for a role without Budget Read: a permission state, never the raw "access_denied" (UX-039). */
function pageBudgets() {
  return setShell("budgets", sec("Budget controls", "Monthly limits per System and what happens when one is reached.", `<div class="state locked"><div class="ic">${ic("lock")}</div><h3>Only Billing Administrators can see budgets</h3><p>You can still see what was spent in Usage. Ask for Billing Administrator if you need to set or read limits.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" data-reqrole="Billing Administrator">Request access</button><a class="btn btn-ghost btn-sm" href="#usage">Go to Usage</a></div></div>`));
}

function pagePayments() {
  const stOf = s => ({ pending: st("warn", "Pending · not paid"), failed: st("danger", "Failed"), paid: st("ok", "Paid") }[s]);
  return setShell("payments",
    sec("Add Story Points", "Select a package to continue to checkout.", `<div class="pkgs">${PACKAGES.map(([n, sp, p]) => `<button class="pkg" type="button" data-pkg="${n}"><span class="pkg-n">${n}</span><span class="pkg-sp mono">${sp.toLocaleString("en-US")}.00 SP</span><span class="pkg-p">${rupiah(p)}</span><span class="hint">${rupiah(Math.round(p / sp))} per SP</span></button>`).join("")}</div>`)
    + sec("Payment history", "", `<div class="tablewrap pay-table"><table class="dtable"><thead><tr><th>Date</th><th>Order ID</th><th>Method</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>
      ${PAYMENTS.map(p => `<tr><td>${p.date}</td><td class="mono">${p.id}</td><td>${p.method}</td><td class="num mono">${rupiah(p.amount)}</td><td>${stOf(p.status)}</td></tr>`).join("")}</tbody></table></div>
      <p class="hint">A pending checkout was started but never paid. It stays in the history; choose a package above to start a new one.</p>
      <div class="clist pay-cards">${PAYMENTS.map(p => `<div class="citem"><div class="citem-top"><b>${rupiah(p.amount)}</b>${stOf(p.status)}</div><small>${p.date} · ${p.method === "—" ? "No method yet" : p.method} · <span class="mono">${p.id}</span></small></div>`).join("")}</div>`));
}
function bindPayments() {
  $$("[data-pkg]").forEach(b => b.onclick = () => { b.classList.add("busy"); toast("Opening checkout for " + b.dataset.pkg); setTimeout(() => b.classList.remove("busy"), 900); });
}

/* ---------- Work Locally (account menu). Drawer = review your credentials; Generate is a two-step modal on top
   (choose access and expiry, then copy the token once); Rotate and Revoke confirm in a dialog. ---------- */
const revealBody = () => `<div class="callout warn">${ic("triangle-alert")}<span class="grow"><b>Copy this token now.</b> You won't see it again.</span></div>
      <div class="field"><label for="newTok">Token</label><div class="secret"><input id="newTok" class="input" readonly value="kxmcp_9b41e7c0aa2f58d3e6c1"><button class="btn btn-icon" type="button" aria-label="Copy token" id="copyTok">${ic("copy")}</button></div></div>
      <div class="code"><div class="code-h"><span>Add to Claude Code</span><button class="btn btn-ghost btn-sm" type="button" data-copy='claude mcp add konteks https://mcp.konteks.example --header "Authorization: Bearer kxmcp_9b41e7c0aa2f58d3e6c1"'>${ic("copy")}Copy</button></div><pre>claude mcp add konteks https://mcp.konteks.example \\
  --header "Authorization: Bearer kxmcp_9b41…"</pre></div>`;
function bindReveal(m) { bindCopy(m); m.querySelector("#copyTok").onclick = () => copyText(m.querySelector("#newTok").value, m.querySelector("#newTok")); }
function generateCredential() {
  const m = modal("Generate credential", `<div class="field"><label for="wlAcc">Access level</label><select id="wlAcc" class="select"><option>Platform MCP Access (default)</option></select><span class="hint">Includes Konteks, Harness, Search and future platform MCP capabilities.</span></div>
      <div class="field"><label for="wlExp">Expiry</label><select id="wlExp" class="select"><option>Platform default</option><option>30 days</option><option>90 days</option><option>365 days</option></select></div>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="wlGo">Generate credential</button>`, { sub: "Step 1 of 2 · Choose access and expiry" });
  m.querySelector("#wlGo").onclick = () => { modalStep(m, { sub: "Step 2 of 2 · Copy the token", body: revealBody(), foot: `<button class="btn btn-primary" data-close>Done</button>` }); bindReveal(m); };
}
function workLocally() {
  const d = drawer("Work Locally", `
    <div class="wl-top"><span class="hint">Connect your local AI agent to Konteks over MCP.</span><button class="btn btn-sm" type="button" id="viewConn">${ic("plug")}View connections</button><button class="btn btn-primary btn-sm" type="button" id="wlGen">${ic("plus")}Generate credential</button></div>
    <section style="display:grid;gap:8px"><h3 class="h-sub">Your credentials</h3><div class="card res">${CREDENTIALS.map(c => `<div class="res-item cred-row">${ic("key-round", "os")}<div><div class="ttl">Credential from ${c.created.split(",")[0]} ${c.days <= 22 ? st("warn", "Expires soon") : st("ok", "Active")}</div><div class="meta"><span class="mono">${c.key}</span><span>Platform MCP Access</span><span>Expires ${c.exp}</span></div></div>
      <span class="cred-acts"><button class="btn btn-sm" type="button" data-rotate="${c.id}">${ic("repeat")}Rotate</button><button class="btn btn-ghost btn-icon btn-sm" type="button" data-cmore="${c.id}" data-when="${c.created.split(",")[0]}" aria-label="More for the credential from ${c.created.split(",")[0]}" aria-haspopup="menu">${ic("ellipsis")}</button></span></div>`).join("")}</div>
      <p class="hint">Rotate gives a new token and the setup instructions; the old token stops working.</p></section>`,
    "", "", { wide: true });
  d.querySelector("#wlGen").onclick = generateCredential;
  $$("[data-rotate]", d).forEach(b => b.onclick = () => dialog("Rotate this credential?", "A new token replaces it. Agents using the old token lose access until you paste the new one.", "Rotate", () => { const m = modal("Credential rotated", revealBody(), `<button class="btn btn-primary" data-close>Done</button>`, { sub: "Copy the new token" }); bindReveal(m); }));
  $$("[data-cmore]", d).forEach(b => b.onclick = () => menu(b, [{ label: "Revoke credential…", icon: "trash-2", danger: true, run: () => dialog(`Revoke the credential from ${b.dataset.when}?`, "Agents using it lose access to Konteks immediately. You can generate a new credential any time.", "Revoke", () => { b.closest(".res-item").remove(); toast("Credential revoked"); }, true) }]));
  d.querySelector("#viewConn").onclick = () => { const m = drawer("External Agent Sessions", `<div class="state locked" style="border:0;padding:8px 0"><div class="ic">${ic("lock")}</div><h3>You can't manage MCP credentials here</h3><p>Seeing external agent sessions needs a role that manages MCP credentials. Ask a Workspace Administrator, or request it.</p><button class="btn btn-sm" id="ecReq">Request access</button></div>`, `<button class="btn" data-close>Not now</button><button class="btn btn-primary" id="ecTry">${ic("rotate-cw")}Try again</button>`);
    m.querySelector("#ecTry").onclick = e => { const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spin"></span>Trying again`; setTimeout(() => { b.disabled = false; b.innerHTML = "Try again"; toast("Still no permission to manage MCP credentials", "err"); }, 800); };
    m.querySelector("#ecReq").onclick = () => requestAccess("Workspace Administrator"); };
}

function supportDialog() {
  drawer("Support", `<p class="hint">Talk to a person on WhatsApp.</p>
    <div class="card res">${[["Customer Support 1", "+62 811-0000-0001"], ["Customer Support 2", "+62 811-0000-0002"]].map(([n, p]) => `<div class="res-item">${ic("message-circle", "os")}<div><div class="ttl">${n}</div><div class="meta"><span class="mono">${p}</span></div></div><a class="btn btn-sm" href="https://wa.me/${p.replace(/\D/g, "")}" target="_blank" rel="noopener">Open WhatsApp${ic("arrow-up-right")}</a></div>`).join("")}</div>
    <p class="hint">Include the initiative name or link so we can find it quickly.</p>`);
}
function createWorkspace() {
  const d = modal("Create workspace", `<div class="field"><label for="wsName">Workspace name</label><input id="wsName" class="input" placeholder="e.g. Acme Engineering"><span class="hint">Everyone in the workspace sees this name.</span></div>
    <div class="field"><label for="wsId">Workspace id</label><input id="wsId" class="input mono-in" placeholder="acme-engineering"><span class="hint">Used in links. Lowercase letters, numbers and dashes. It can't change later.</span></div>
    <div class="field"><label for="wsDesc">Description <span class="hint">· optional</span></label><textarea id="wsDesc" class="textarea" rows="3" placeholder="What does your team work on?"></textarea></div>`,
    `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="wsGo" disabled>Create workspace</button>`);
  d.querySelector("#wsName").oninput = e => { d.querySelector("#wsId").value = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); d.querySelector("#wsGo").disabled = !e.target.value.trim(); };
  d.querySelector("#wsGo").onclick = () => { closeOverlay(); toast("Workspace created"); };
}
