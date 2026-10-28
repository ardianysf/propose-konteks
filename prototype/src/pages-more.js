/* ---------- Agent session (/?conversation=…): same header, transcript, cycle stepper and composer as live ---------- */
function pageSession() {
  const can = S.viewAs === "approver";
  const top = `<a class="back" href="#initiative">${ic("arrow-left")}Back to Refresh the Support API README</a>
    <div class="top-r">
      <button class="tag tagbtn" type="button" id="rtChip" aria-label="Runtime rf-01, Ready">${ic("server")}rf-01 ${st("ok", "Ready")}</button>
      <button class="tag tagbtn" type="button" id="vcsChip" aria-label="Repository rentify/support-api on Gitea" data-tip="Gitea · Rentify org">${ic("git-branch")}<span class="mono">rentify/support-api</span></button>
      <button class="btn btn-ghost btn-sm" id="sysMap">${ic("map")}System map</button>
      <button class="btn btn-ghost btn-sm" id="files">${ic("folder")}Session files</button>
      ${viewAsToggle()}
    </div>`;
  const body = `<div class="sess">
    <div class="sess-scroll"><div class="sess-col">
      <div class="sess-ticket"><span class="idc">TKT-1</span><h1 class="h-page">Validate and refresh the support-api README</h1>${sysTag("rentify")}</div>
      <details class="inline-disc"><summary>${ic("chevron-right")}Ticket and acceptance criteria</summary><div class="disc-in prose"><p>Update only the existing README from current source and configuration, validate the documented workflows on rf-01, and leave one independently reviewed README-only pull request unmerged.</p><ol><li>Only the existing README changes.</li><li>Purpose, boundaries, flows and workflows are explained from current source.</li><li>Environment variable names only; no secret values.</li><li>Documented commands are executed on rf-01; outcomes are recorded as passed, failed or unavailable.</li></ol></div></details>
      <div class="evgroup">
      <div class="evline ok">${ic("receipt")}<b>Analysis quote ready: 2.15 SP</b><span>· valid until 27 Oct 2026, 14.34</span></div>
      <div class="evline ok">${ic("receipt")}<b>Execution quote ready: 2.15 SP</b><span>· valid until 27 Oct 2026, 16.20</span></div>
      <div class="evline ok">${ic("circle-check")}<b>Maya Lestari approved this delivery</b><span>· 15.22</span></div>
      <div class="evline">${ic("play")}<span>Task 1 of 1 started: Refresh and validate the support-api README · 15.22</span></div>
      <div class="evline">${ic("flag")}<span>The run has ended. Story Points settled · 17.19</span></div>
      </div>
      <div class="run"><div class="run-h">${ic("circle-stop")}<b style="font-weight:600">Not finished · your changes are kept on the pull request</b><span class="hint" style="margin-left:auto">0.47 SP</span></div>
        <div class="run-b"><p>Stopped by Maya Lestari. Work resumes only when someone chooses Continue.</p><div class="run-acts"><span class="tag">${ic("git-pull-request")}PR #41 · open</span><button class="btn btn-sm" id="viewChanges">${ic("file-diff")}View changes</button><button class="btn btn-sm" id="viewReceipt">${ic("receipt")}View receipt</button></div></div></div>
      <div class="msg-user">Before we retry: run the documented checks again on rf-01 and tell me which ones fail, and why.</div>
      <div class="msg-agent"><span class="agent-av">${ic("bot")}</span><div class="msg-b">
        <span class="who"><b>Konteks</b>Codex · GPT-6-Luna · 17.26</span>
        ${fmtMsg("Ran the six documented commands on rf-01:\n\n- `npm ci`: passed\n- `npm run seed:support`: passed\n- `npm run lint`: passed\n- `npm test`: passed, 212 tests\n- `npm run verify`: passed, but it prints an Asana error\n- `curl localhost:8080/health/ready`: passed\n\nThe Asana error comes from a test that checks rejection logging. It is expected, and it is what the last run misread as a failure. Nothing actually fails.")}
        <details class="trace"><summary title="41.2s · 1,840 tokens in, 310 out">${ic("chevron-right")}Agent trace</summary><pre>run    npm ci                     ok   18.4s
run    npm run seed:support       ok    3.1s
run    npm run lint               ok    6.0s
run    npm test                   ok   11.9s  212 passed
run    npm run verify             ok    1.2s  stderr: Asana 401 (expected)
run    curl /health/ready         ok    0.1s  200</pre></details>
      </div></div>
      <div class="msg-user">That makes sense. Note it so the next run doesn't stop on it again.</div>
      <div class="msg-agent"><span class="agent-av">${ic("bot")}</span><div class="msg-b">
        <span class="who"><b>Konteks</b>Codex · GPT-6-Luna · 17.29</span>
        <p>Noted under “Konteks learned” for this System. The next delivery treats the Asana message from <code>npm run verify</code> as expected output.</p>
      </div></div>
      <div class="msg-user">Please deliver this ticket again, fixing what stopped it last time.</div>
      <div class="msg-agent"><span class="agent-av">${ic("bot")}</span><div class="msg-b">
        <span class="who"><b>Konteks</b>Codex · GPT-6-Luna · 17.32</span>
        <p>I'll ask for a fresh estimate using the original ticket and your instruction. The new proposal accounts for the earlier misread check, and it needs approval before anything runs.</p>
        <div class="summary"><dl><dt>Last run</dt><dd>Stopped by Maya Lestari · 0.47 SP settled</dd><dt>Kept</dt><dd>PR #41 with the README changes, unmerged</dd><dt>Next</dt><dd>A new quote appears here for approval</dd></dl></div>
        <details class="trace"><summary title="30.5s · 990 tokens in, 22 out">${ic("chevron-right")}Agent trace</summary><pre>read   delivery receipt TKT-1 (stopped by user)
read   last proposal request: cancelled before a result
decide new proposal; no second delivery or charge started
submit proposal (ticket verbatim + retry instruction)</pre></details>
      </div></div>
      <div class="dc ${S.approved ? "waiting" : "decision"}"><div class="dc-top">${S.approved ? st("info", "Delivering") : st("ok", "Needs a decision")}<span>${S.approved ? "Started just now" : "Waiting 18m"}</span></div>
        <div class="dc-body"><div class="dc-title">${S.approved ? "TKT-1's delivery started" : "TKT-1's estimate is ready"}</div>
          ${S.approved ? `<p class="dc-why">Approved up to 2.15 SP. You'll be asked to review when the pull request is ready.</p>` : `<div class="quote"><div class="qrow"><span>Story Points, at most</span><b>2.15 SP</b></div><div class="qrow"><span>Model cost on your subscription</span><b>$0.57 – $2.02</b></div></div>
          <div class="dc-acts">${can ? `<button class="btn btn-primary btn-sm" id="sApprove">${ic("check")}Approve<span class="cost">2.15 SP</span></button>` : `<span class="gate">${ic("lock")}Waiting for a Delivery Approver (Maya Lestari)</span>`}<a class="btn btn-sm" href="#initiative">Change in the initiative${ic("arrow-right")}</a></div>`}</div></div>
      <details class="inline-disc"><summary>${ic("chevron-right")}Konteks learned · 1 note</summary><div class="disc-in hint">The verify script prints an expected Asana error from a rejection-logging test. It is not the cause of a failed check.</div></details>
      <div class="sess-live" id="sessLive"></div>
    </div></div>
    <div class="sess-foot"><div class="sess-col">
      <div class="cycle"><div class="stepper" aria-label="Cycle 2 steps">${[["Estimate", 1], ["Quote", S.approved ? 1 : 2, "2.15 SP · $0.57–$2.02"], ["Plan", S.approved ? 2 : 0, "0/1"], ["Delivery", 0], ["Receipt", 0]].map(([l, s, sub], n) => `${n ? '<span class="step-line"></span>' : ""}<span class="step ${s === 1 ? "done" : s === 2 ? "now" : ""}" ${s === 2 ? 'aria-current="step"' : ""}><span class="n">${s === 1 ? ic("check") : n + 1}</span>${l}${sub ? `<small>${sub}</small>` : ""}</span>`).join("")}</div>
        <span class="cyc-nav"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Previous cycle" data-tip="Previous cycle" id="cycPrev">${ic("chevron-left")}</button><span class="hint">Cycle 2 of 2 · current</span><button class="btn btn-ghost btn-icon btn-sm" aria-label="Newer cycle" disabled>${ic("chevron-right")}</button></span></div>
      <div class="atts" id="sessAtts"></div>${composerHtml({ id: "sessCx", placeholder: "Describe the outcome you need. Type / for a skill", cta: "Send", attachId: "sessAtts", lead: `<button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Create text attachment" data-tip="Create text attachment" id="txtAtt">${ic("file-plus-2")}</button><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Record voice message" data-tip="Record voice message" id="voiceBtn" aria-pressed="false">${ic("mic")}</button>` })}
      <p class="hint" style="text-align:center">Konteks can make mistakes. Verify important information.</p>
    </div></div>
  </div>`;
  return shell("work", top, body, { flush: true });
}
function bindSession() {
  bindViewAs(render);
  $("#sApprove")?.addEventListener("click", () => approveDialog(() => { S.approved = true; render(); toast("Approved up to 2.15 SP. TKT-1's delivery started"); }));
  $("#sysMap")?.addEventListener("click", () => systemMap("Rentify"));
  $("#files")?.addEventListener("click", () => drawer("Session files", `<div class="empty"><div class="ic">${ic("folder-open")}</div><h3>No files in this session</h3><p>Attach screenshots, specs or logs with the paperclip in the message box. The agent reads them for this ticket only.</p></div>`));
  $("#viewChanges")?.addEventListener("click", changesDrawer);
  $("#viewReceipt")?.addEventListener("click", () => drawer("Receipt · TKT-1", `<div class="quote"><div class="qrow"><span>Result</span><b style="font-family:var(--sans)">Not finished, work kept</b></div><div class="qrow"><span>Settled</span><b>0.47 SP</b></div><div class="qrow"><span>Approved limit</span><b>2.15 SP</b></div><div class="qrow"><span>Model cost on your subscription</span><b>$0.41</b></div><div class="qrow"><span>Pull request</span><b>#41 · open</b></div></div>
    <div class="props">${[["Runtime", "rf-01"], ["Started", "27 Oct 2026, 15.22"], ["Ended", "27 Oct 2026, 17.19"], ["Stopped by", "Maya Lestari"]].map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b}</div></div>`).join("")}</div>`));
  $("#rtChip")?.addEventListener("click", () => { S.rt = "rf-01"; location.hash = "runtime"; });
  $("#vcsChip")?.addEventListener("click", () => drawer("Repository", `<div class="props">${[["Connection", "Rentify org · Gitea"], ["URL", `<span class="mono">https://gitea.example.id/rentify/support-api</span>`], ["Branch", `<span class="mono">konteks/tkt-1-readme</span>`], ["Pull request", "#41 · open"]].map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b}</div></div>`).join("")}</div>`));
  $("#cycPrev")?.addEventListener("click", () => toast("Cycle 1: estimate, quote, plan and a delivery that stopped"));
  $("#txtAtt")?.addEventListener("click", () => { const m = modal("Create text attachment", `<div class="field"><label for="taName">Name</label><input id="taName" class="input" placeholder="e.g. error-log.txt"></div><div class="field"><label for="taBody">Text</label><textarea id="taBody" class="textarea mono-area" rows="8" placeholder="Paste a log, a spec or notes"></textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="taOk" disabled>Attach</button>`); const chk = () => m.querySelector("#taOk").disabled = !(m.querySelector("#taName").value.trim() && m.querySelector("#taBody").value.trim()); m.querySelector("#taName").oninput = chk; m.querySelector("#taBody").oninput = chk; m.querySelector("#taOk").onclick = () => { closeOverlay(); toast("Text attached to the message"); }; });
  bindNoteTools();
  $("#voiceBtn")?.addEventListener("click", e => { const b = e.currentTarget, on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); b.classList.toggle("rec", on); b.setAttribute("aria-label", on ? "Stop recording" : "Record voice message"); toast(on ? "Recording. Select the microphone again to stop" : "Recording added to your message"); });
  const live = $("#sessLive"), scroller = $(".sess-scroll");
  bindComposer($("#sessCx"), { onSend: ({ text, picks }) => {
    const box = $("#sessAtts"), names = [...box.querySelectorAll(".att b")].map(b => b.textContent); box.innerHTML = "";
    live.insertAdjacentHTML("beforeend", `<div class="msg-user msg-in">${text ? esc(text) : ""}${names.length ? `<span class="hint" style="display:block">${names.map(esc).join(", ")}</span>` : ""}${picks.length ? `<span class="msg-uses">${picks.map(p => `${p.kind === "skill" ? "Skill" : "Tool"} · ${esc(p.name)}`).join(", ")}</span>` : ""}</div>`);
    sfx("send"); agentRun(live, { text, picks, mode: "session", scroller });
  } });
}
function systemMap(name = "Rentify") {
  const d = drawer("System map · " + name, `<p class="hint">Components and the repositories they are built from. Relationships come from the catalog reading; a reviewer confirms them.</p>
    <div class="canvas" id="mapD"><div class="zoom"><button class="btn btn-icon btn-sm" type="button" aria-label="Zoom in" data-tip="Zoom in" data-zoom="in">${ic("plus")}</button><button class="btn btn-icon btn-sm" type="button" aria-label="Zoom out" data-tip="Zoom out" data-zoom="out">${ic("minus")}</button><button class="btn btn-icon btn-sm" type="button" aria-label="Reset zoom" data-tip="Reset zoom" data-zoom="fit">${ic("rotate-ccw")}</button></div>
      <div class="canvas-in" id="mapDIn"><svg class="links" aria-hidden="true"></svg>
        <div class="mnode sys" style="left:calc(50% - 90px);top:20px"><span class="label">System</span><b>${esc(name)}</b></div>
        ${[["support-api", "4%", "Confirmed", "ok"], ["web-app", "calc(50% - 90px)", "Confirmed", "ok"], ["gmail-handler", "calc(96% - 180px)", "Not classified yet", "warn"]].map(([n, l, s, k]) => `<div class="mnode" style="left:${l};top:150px"><b>${n}</b><span class="mono hint">rentify/${n}</span>${st(k, s)}<button class="btn btn-sm" type="button" data-startsess>Start a session</button></div>`).join("")}
      </div></div>
    <div class="callout warn">${ic("info")}<span class="grow"><b>gmail-handler is not classified yet.</b> Its owner and runtime are unknown until someone confirms them.</span></div>`, "", "", { wide: true });
  /* Loading state (DS-10): the drawer opens at once with a skeleton shaped like the map, then the map fills in. */
  const cv = d.querySelector("#mapD"); cv.hidden = true;
  cv.insertAdjacentHTML("beforebegin", `<div class="canvas map-sk" aria-busy="true" aria-label="Loading the System map">${["180px", "140px", "200px"].map(w => `<span class="sk" style="width:${w};height:40px;border-radius:var(--r10)"></span>`).join("")}</div>`);
  setTimeout(() => { d.querySelector(".map-sk")?.remove(); cv.hidden = false; draw(); }, 500);
  let z = 1; $$("[data-zoom]", d).forEach(b => b.onclick = () => { z = b.dataset.zoom === "in" ? Math.min(1.6, z + .2) : b.dataset.zoom === "out" ? Math.max(.6, z - .2) : 1; d.querySelector("#mapDIn").style.transform = `scale(${z})`; });
  const map = d.querySelector("#mapD"), svg = map.querySelector("svg.links"); const draw = () => { const w = map.clientWidth; svg.innerHTML = [w * .04 + 90, w / 2, w * .96 - 90].map(x => `<path d="M${w / 2} 64 V110 H${x} V150" fill="none" stroke="var(--line-strong)" stroke-width="1.25"/>`).join(""); }; requestAnimationFrame(draw); new ResizeObserver(draw).observe(map);
  $$("[data-startsess]", d).forEach(b => b.onclick = () => { closeOverlay(); location.hash = "session"; });
}

/* ---------- Activities / Issues / Releases / Leaders ---------- */
function pageActivities() {
  const days = [
    ["Today", "27 Oct 2026", [["sw", "INI-137", "Planning", 2, 120, "17.31", "2 hours ago"], ["bh", "INI-128", "Executing", 5, 140, "17.19", "2 hours ago", "stopped TKT-1 in"], ["kx", "INI-139", "Executing", 1, 360, "13.34", "6 hours ago", "TKT-1's estimate is ready in"], ["ay", "INI-139", "Executing", 1, 420, "12.53", "7 hours ago"], ["bh", "INI-128", "Executing", 5, 30, "11.55", "8 hours ago"]]],
    ["Yesterday", "26 Oct 2026", [["kx", "INI-142", "Planning", 1, 1460, "19.40", "yesterday", "The plan is ready in"], ["ay", "INI-142", "Planning", 1, 1460, "19.23", "yesterday"], ["ay", "INI-131", "Planning", 1, 1500, "18.37", "yesterday"], ["np", "INI-125", "Planning", 0, 0, "16.50", "yesterday"], ["ds", "INI-144", "Executing", 10, 13, "10.12", "yesterday"]]],
    ...(S.actMore ? [["23 Oct 2026", "Friday", [["kx", "INI-131", "Planning", 1, 5897, "17.23", "4 days ago", "The plan could not be saved in"], ["ay", "INI-131", "Planning", 1, 5897, "09.05", "4 days ago"]]]] : []),
  ];
  /* One list primitive with Work In Progress: full-bleed rows, aligned columns, a sticky day header. */
  const row = (d, date, [p, id, stg, n, last, at, rel, verb]) => { const i = iniById[id];
    return `<article class="arow"><span class="arow-av">${p === "kx" ? '<span class="av av-kx" title="Konteks">K</span>' : av(p)}</span>
      <p class="arow-t">${p === "kx" ? "" : `<b>${PEOPLE[p].name}</b> `}${verb || "started"} <a href="#initiative" data-ini="${id}">${esc(i.title)}</a></p>
      <span class="arow-m"><span class="arow-c c-sys">${sysTag(i.sys)}</span>
      <span class="arow-c c-stage">${st(stg === "Closed" ? "muted" : "ok", stg)}</span>
      <span class="arow-c c-upd">${n ? `${n} ${n === 1 ? "update" : "updates"}<small>${ago(last)}</small>` : `<span class="hint">No updates</span>`}</span>
      <time class="arow-c c-time" datetime="${date}" title="${rel} · ${date}, ${at}">${at}</time></span>
      <button class="btn btn-ghost btn-icon btn-sm" type="button" data-cmt aria-label="Comment on ${esc(i.title)}" data-tip="Comment">${ic("message-square")}</button></article>`; };
  const groups = days.map(([d, date, evs]) => { const list = evs.filter(([, id]) => !S.sys || iniById[id].sys === S.sys);
    return `<section aria-label="${d}"><div class="group-h">${d}<span class="gh-note">${date}</span></div>${list.length ? list.map(e => row(d, date, e)).join("") : `<p class="hint row-empty">Nothing happened in this System ${d === "Today" ? "today" : d === "Yesterday" ? "yesterday" : "that day"}.</p>`}</section>`; }).join("");
  const body = `<div class="pagehead">${phead("Activities", "What happened across your Systems.")}${sysFilter()}</div>
    <div class="alist" role="feed" aria-label="Activities"><div class="alist-h" aria-hidden="true"><span></span><span>Initiative</span><span class="c-sys">System</span><span class="c-stage">Stage</span><span class="c-upd">Updates</span><span class="c-time">Time</span><span></span></div>${groups}</div>
    <div class="pager list-pager"><button class="btn btn-sm" id="moreAct">Load more</button><span>Showing ${S.actMore ? 12 : 10} of 44</span></div>`;
  return shell("activities", "", body, { flush: true });
}
function bindActivities() {
  bindSysFilter();
  $$("[data-ini]").forEach(a => a.onclick = () => { S.cur = a.dataset.ini; });
  $$("[data-cmt]").forEach(b => b.onclick = () => { const art = b.closest(".arow"); if (art.nextElementSibling?.classList.contains("arow-cmt")) return art.nextElementSibling.querySelector("textarea").focus();
    art.insertAdjacentHTML("afterend", `<div class="arow-cmt"><div class="compose"><textarea rows="1" placeholder="Write a comment" aria-label="Comment"></textarea><button class="btn btn-ghost btn-sm" type="button" data-cx>Cancel</button><button class="btn btn-primary btn-sm" type="button" data-cp>Comment</button></div></div>`);
    const box = art.nextElementSibling; box.querySelector("textarea").focus(); box.querySelector("[data-cx]").onclick = () => box.remove(); box.querySelector("[data-cp]").onclick = () => { box.remove(); toast("Comment posted"); }; });
  $("#moreAct")?.addEventListener("click", () => { S.actMore = true; render(); });
}

function pageIssues() {
  const body = `<div class="pagehead">${phead("Issues", "What is wrong, by severity.")}${sysFilter()}</div>
    <div class="empty page"><div class="ic">${ic("shield-check")}</div><h3>Nothing is open</h3><p>When something breaks, whether a person reports it or a telemetry channel sends an alert, it appears here, highest severity first.</p><a class="btn btn-sm" href="#operations">${ic("radio-tower")}Set up a telemetry channel</a></div>`;
  return shell("issues", "", body, { flush: true });
}

function pageReleases() {
  const body = `<div class="pagehead">${phead("Releases", "Ready to ship first, then what shipped.")}${sysFilter()}</div>
    <div class="content"><div class="empty page"><div class="ic">${ic("rocket")}</div><h3>Nothing here yet</h3><p>Accepted initiatives gather into a release candidate for their System. When one is ready, it shows here first with a Ship action for people allowed to ship.</p><a class="btn btn-sm" href="#work">${ic("square-kanban")}See initiatives in progress</a></div>
    <section class="sec illus"><div class="sec-title"><div><h2 class="h-sec">How a release candidate will look</h2><p id="illusNote">Illustration with sample data, so Ship is off. The release fields come from the app as they are; nothing here adds a step.</p></div></div>
    <div class="card"><div class="card-h">${ic("rocket")}<h3>Ledgerline · release candidate</h3>${st("ok", "Ready to ship")}</div>
      <div class="rc">${[["Invoice export for Ledgerline"], ["Tax line rounding fix"], ["CSV import validation"]].map(([t]) => `<div class="rc-item">${sg("Done", "done")}<span>${esc(t)}</span><span class="hint">Accepted</span></div>`).join("")}</div>
      <div class="card-f"><span class="hint">3 accepted initiatives</span><button class="btn btn-primary btn-sm" type="button" disabled aria-describedby="illusNote">Ship</button></div></div></section></div>`;
  return shell("releases", "", body, { flush: true });
}
function bindReleases() {
  bindSysFilter();
}

/* Leaders: a ranked list, not a spreadsheet. Fixed columns so numbers line up; the points bar shows distance
   to the top at a glance; your own row is marked, and on a phone the counts fold under the name. */
function pageLeaders() {
  const max = Math.max(...LEADERS.map(l => l.pts)) || 1;
  const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const row = (l, n) => `<li class="lb-row ${l.p === "ay" ? "lb-me" : ""}">
      <span class="lb-rank num">${n + 1}</span>
      <span class="lb-who">${av(l.p)}<span class="lb-name"><b>${PEOPLE[l.p].name}</b>${l.p === "ay" ? '<span class="lb-you">You</span>' : ""}<small class="lb-sub">${pl(l.s, "started", "started")} · ${pl(l.c, "contribution", "contributions")} · ${pl(l.r, "reaction", "reactions")}</small></span></span>
      <span class="lb-n num">${l.s}</span><span class="lb-n num">${l.c}</span><span class="lb-n num">${l.r}</span>
      <span class="lb-pts"><b class="num">${l.pts}</b><span class="lb-bar" aria-hidden="true"><i style="width:${Math.max(2, Math.round(l.pts / max * 100))}%"></i></span></span></li>`;
  const body = `<div class="pagehead">${phead("Leaders", "People by involvement. Agents and models by value.")}</div><div class="content">
    <section class="sec lb"><div class="sec-title"><div><h2 class="h-sec">People</h2><p class="hint">Points = 5 for each initiative started, 2 for each contribution, 1 for each reaction.</p></div></div>
      <div class="lb-list" role="table" aria-label="People by points">
        <div class="lb-row lb-head" role="row" aria-hidden="true"><span>#</span><span>Person</span><span class="num">Started</span><span class="num">Contributions</span><span class="num">Reactions</span><span class="lb-pts"><span class="num">Points</span><span></span></span></div>
        <ol class="lb-ol">${LEADERS.map(row).join("")}</ol>
      </div></section>
    <section class="sec lb"><div class="sec-title"><div><h2 class="h-sec">Agents and models</h2><p class="hint">Value appears once delivered work reports it.</p></div></div>
      <div class="lb-list"><div class="lb-row lb-head lb-ag" aria-hidden="true"><span>Agent</span><span>Value</span><span class="num">Tokens</span></div>
        <ul class="lb-ol"><li class="lb-row lb-ag"><span class="lb-who"><span class="agent-av">${ic("bot")}</span><span class="lb-name"><b>Codex</b><small class="lb-sub">GPT-6-Luna</small></span></span><span class="hint">Value not reported yet</span><span class="num">32M</span></li></ul></div></section></div>`;
  return shell("leaders", "", body, { flush: true });
}

/* ---------- Sign in: Backstage sign-in page with the Google provider, as live ---------- */
/* Sign in: the live Backstage page with the Google provider only. The page is a field of stage glyphs, the product's
   own mark: work queued, moving, delivered, and the few waiting for a person. The sign-in sits in a clearing at the
   centre. Hover a waiting glyph to see what it waits for; pressing Sign in sets the waiting ones moving again. */
function pageLogin() {
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
    <footer class="auth-base"><span>${ic("shield-check")}Runs on your team's computers. Konteks never holds a provider key.</span><span class="auth-demo"><span class="label">Demo</span><button class="btn btn-ghost btn-sm" type="button" id="gErr">Show the error state</button></span></footer>
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
  $("#gBtn")?.addEventListener("click", () => { f?.release(); sfx("ok"); S.loginStep = "busy"; const b = $("#gBtn"); b.disabled = true; b.setAttribute("aria-busy", "true"); b.innerHTML = `<span class="spin"></span>Waiting for Google…`; setTimeout(() => { S.loginStep = "idle"; location.hash = "work"; }, 1400); });
  $("#gErr")?.addEventListener("click", () => { S.loginStep = "error"; render(); });
}
