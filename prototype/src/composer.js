/* ---------- Composer + simulated agent (demo) ----------
   One composer for notes and the agent session: text that grows, attachments, "/" to use a skill or tool,
   ⌘/Ctrl + Enter to send. After a send, Konteks works in the open: each step appears as it happens, the reply
   streams in, and a sound marks the end (done) or a question back to you (needs you).
   Everything here is simulated with sample data; no request leaves the page. */
const SLASH = () => [
  ...SKILLS.map(s => ({ kind: "skill", name: s.name, desc: s.desc, icon: "sparkles" })),
  ...TOOLS.map(t => ({ kind: "tool", name: t.name, desc: t.desc, icon: "wrench" })),
];

function composerHtml({ id, placeholder, cta = "Post note", attachId, lead = "", compact = false }) {
  return `<div class="cx${compact ? " cx-compact" : ""}" id="${id}">
    <div class="cx-picks" hidden></div>
    <textarea rows="1" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" aria-describedby="${id}-hint" aria-autocomplete="list"></textarea>
    <div class="cx-bar">
      ${lead}<button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Attach file" data-tip="Attach file" data-attach="${attachId}">${ic("paperclip")}</button>
      <button class="btn btn-ghost btn-sm cx-slash" type="button" aria-haspopup="listbox" data-tip="Use a skill or tool">${ic("sparkles")}Skill<span class="kbd">/</span></button>
      <span class="cx-hint" id="${id}-hint">⌘↵ to send</span>
      <button class="btn btn-primary btn-sm cx-send" type="button" disabled data-tip="⌘↵ to send">${esc(cta)}</button>
    </div></div>`;
}

function bindComposer(root, { onSend }) {
  const ta = root.querySelector("textarea"), send = root.querySelector(".cx-send"), picksEl = root.querySelector(".cx-picks");
  const picks = [];
  /* Compact composer: once the message needs a second line, the tools move under the text so the text gets the full width;
     it returns to one row only when the field is empty again (no flip-flopping while typing). */
  const compact = root.classList.contains("cx-compact");
  const grow = () => {
    ta.style.height = "auto";
    if (compact) {
      if (!ta.value) root.classList.remove("cx-multi");
      else if (!root.classList.contains("cx-multi") && (ta.scrollHeight > 40 || ta.value.includes("\n"))) { root.classList.add("cx-multi"); ta.style.height = "auto"; }
    }
    ta.style.height = Math.min(200, ta.scrollHeight) + "px";
  };
  const sync = () => { send.disabled = !ta.value.trim() && !picks.length; };
  const drawPicks = () => {
    picksEl.hidden = !picks.length;
    picksEl.innerHTML = picks.map((p, n) => `<span class="cx-pick">${ic(p.icon)}<span>${p.kind === "skill" ? "Skill" : "Tool"} · <b>${esc(p.name)}</b></span><button type="button" aria-label="Remove ${esc(p.name)}" data-unpick="${n}">${ic("x")}</button></span>`).join("");
    drawIcons(); sync();
    $$("[data-unpick]", picksEl).forEach(b => b.onclick = () => { picks.splice(+b.dataset.unpick, 1); drawPicks(); ta.focus(); });
  };
  const add = item => { if (!picks.some(p => p.name === item.name)) picks.push(item); drawPicks(); };
  /* "/" at the start of a word opens the picker; typing filters it; ↑↓ move, Enter picks, Escape closes. */
  let pop = null, sel = 0, slashAt = -1;
  const closePop = () => { pop?.remove(); pop = null; slashAt = -1; ta.setAttribute("aria-expanded", "false"); };
  const openPop = (q = "") => {
    const items = SLASH().filter(i => (i.name + " " + i.desc).toLowerCase().includes(q.toLowerCase()));
    if (!pop) { pop = document.createElement("div"); pop.className = "floatpop cx-pop"; pop.setAttribute("role", "listbox"); pop.setAttribute("aria-label", "Skills and tools"); document.body.append(pop); }
    sel = Math.min(sel, Math.max(0, items.length - 1));
    const groups = [["skill", "Skills"], ["tool", "Tools"]];
    pop.innerHTML = items.length ? groups.map(([k, l]) => { const g = items.filter(i => i.kind === k); return g.length ? `<div class="og">${l}</div>` + g.map(i => `<button type="button" role="option" class="cx-opt" aria-selected="${items.indexOf(i) === sel}" data-i="${items.indexOf(i)}">${ic(i.icon)}<span><b>${esc(i.name)}</b><small>${esc(i.desc)}</small></span></button>`).join("") : ""; }).join("")
      + `<div class="cx-pop-f"><span class="kbd">↑</span><span class="kbd">↓</span> move · <span class="kbd">↵</span> use · <span class="kbd">esc</span> close</div>`
      : `<p class="hint" style="padding:10px">No skill or tool matches “${esc(q)}”.</p>`;
    drawIcons();
    const r = root.getBoundingClientRect(), h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + "px";
    pop.style.top = (r.top - h - 6 > 8 ? r.top - h - 6 : r.bottom + 6) + "px";
    $$(".cx-opt", pop).forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => choose(items[+b.dataset.i]); });
    pop._items = items; ta.setAttribute("aria-expanded", "true");
  };
  const choose = item => {
    if (!item) return;
    if (slashAt >= 0) { const end = ta.selectionStart; ta.value = ta.value.slice(0, slashAt) + ta.value.slice(end); }
    closePop(); add(item); sfx("tick"); ta.focus(); grow();
  };
  ta.addEventListener("input", () => {
    grow(); sync();
    const pos = ta.selectionStart, before = ta.value.slice(0, pos), m = before.match(/(^|\s)\/([\w-]*)$/);
    if (m) { slashAt = pos - m[2].length - 1; openPop(m[2]); } else if (pop) closePop();
  });
  ta.addEventListener("keydown", e => {
    if (pop && pop._items?.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + pop._items.length) % pop._items.length; openPop(ta.value.slice(slashAt + 1, ta.selectionStart)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); choose(pop._items[sel]); return; }
    }
    if (pop && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePop(); return; }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); }
  });
  ta.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== ta) closePop(); }, 120));
  /* The whole box is the input: a press anywhere that is not a control puts the caret in the text. */
  root.addEventListener("mousedown", e => { if (e.target === ta || e.target.closest("button,a,input,label,.cx-pick")) return; e.preventDefault(); ta.focus(); const n = ta.value.length; ta.setSelectionRange(n, n); });
  root.querySelector(".cx-slash").onclick = () => {
    const p = ta.selectionStart, pre = ta.value.slice(0, p), needSpace = pre && !/\s$/.test(pre);
    ta.value = pre + (needSpace ? " /" : "/") + ta.value.slice(p); ta.focus(); ta.selectionStart = ta.selectionEnd = p + (needSpace ? 2 : 1);
    ta.dispatchEvent(new Event("input"));
  };
  const go = () => {
    const text = ta.value.trim(); if (!text && !picks.length) return;
    const used = picks.splice(0);
    ta.value = ""; grow(); drawPicks(); closePop();
    onSend({ text, picks: used });
  };
  send.onclick = go;
  sync();
}

/* Light formatting for sample messages: blank line = paragraph, "- " = list item, `code`, **bold**. */
function fmtMsg(t) {
  const inline = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  return t.split(/\n{2,}/).map(block => {
    /* A block can mix a lead line with a list under it: group consecutive lines by kind. */
    const runs = [];
    block.split("\n").forEach(l => { const k = /^- /.test(l) ? "ul" : /^\d+\. /.test(l) ? "ol" : "p"; const last = runs[runs.length - 1]; if (last && last.k === k) last.lines.push(l); else runs.push({ k, lines: [l] }); });
    return runs.map(r => r.k === "p" ? `<p>${r.lines.map(inline).join("<br>")}</p>` : `<${r.k}>${r.lines.map(l => `<li>${inline(l.replace(/^(- |\d+\. )/, ""))}</li>`).join("")}</${r.k}>`).join("");
  }).join("");
}

/* What the simulated agent does with a note. Deterministic, grounded in this initiative's sample data. */
function agentPlan(text, picks, mode) {
  const asks = /\?\s*$|^(what|why|how|can|could|will|should|does|do|is|are|kapan|apa|bagaimana|kenapa|bisa)\b/i.test(text);
  const skill = picks.find(p => p.kind === "skill"), tool = picks.find(p => p.kind === "tool");
  const steps = [mode === "session" ? "Read your message and the ticket" : "Read your note and PRD revision 2"];
  if (tool) steps.push(`Used tool · ${tool.name}`);
  if (skill) steps.push(`Used skill · ${skill.name}`);
  steps.push(asks ? "Checked rentify/support-api on rf-01" : "Compared it with the plan");
  steps.push(asks ? "Drafted an answer" : "Drafted the change to the plan");
  const quote = text ? `“${text.length > 90 ? text.slice(0, 88).trim() + "…" : text}”` : "";
  let reply;
  if (skill && skill.name === "skill-creator") reply = `I can turn this into a reusable skill.\n\nDraft: **readme-refresh**\n- Read the README and the source it describes\n- Run every documented command on the chosen runtime and record the outcome\n- Open one README-only pull request, unmerged\n\nSave it from Customize › Skills when it looks right. Nothing is registered until you do.`;
  else if (tool && tool.name === "document") reply = `Read it with the **document** tool. ${text ? `On ${quote}: ` : ""}the architecture notes match the current routes, except that \`/status\` is now deprecated in favour of \`/health/ready\`. I added that to the README outline.`;
  else if (tool && tool.name === "archive") reply = `Opened the archive with the **archive** tool: 14 files, 2 of them logs from the last run on rf-01. Neither changes the plan; I kept them with this note for reference.`;
  else if (asks) reply = `From PRD revision 2 and how the run is set up:\n\n- The checks run only on rf-01, against the seeded fixtures in \`test/fixtures\`\n- No production credentials are available to the run, so customer data is never touched\n- The quote stays at up to 2.15 SP unless the scope changes\n\nIf your question changes the scope, I'll ask for a new quote before anything runs.`;
  else reply = `Noted. This goes into the next plan revision:\n\n${quote}\n\nNothing is re-estimated yet; the current quote of up to 2.15 SP still stands. Do you want me to request a fresh quote with this included?`;
  const needsYou = /\?\s*$/.test(reply.trim());
  return { steps, reply, needsYou, uses: picks };
}

/* Renders the working state into `host`, streams the reply, and returns { stop }. */
function agentRun(host, { text, picks, mode = "note", scroller }) {
  const plan = agentPlan(text, picks, mode);
  const el = document.createElement("div");
  el.className = (mode === "session" ? "msg-agent" : "cmt reply") + " msg-in agent-run";
  el.setAttribute("aria-live", "polite");
  const avatar = `<span class="agent-av">${ic("bot")}</span>`;
  el.innerHTML = `${avatar}<div class="${mode === "session" ? "msg-b" : "cmt-b"}">
    <div class="${mode === "session" ? "who" : "cmt-h"}"><b>Konteks</b>${mode === "session" ? "Codex · GPT-6-Luna" : '<span class="agent-chip">Agent</span>'}<span class="ar-state"><span class="ar-pulse" aria-hidden="true"></span>Working</span></div>
    <ol class="ar-steps" aria-label="What Konteks is doing"></ol>
    <div class="ar-reply" hidden></div>
    <div class="ar-acts"><button class="btn btn-ghost btn-sm" type="button" data-stop>${ic("square")}Stop</button></div></div>`;
  host.append(el); drawIcons();
  const steps = el.querySelector(".ar-steps"), out = el.querySelector(".ar-reply"), state = el.querySelector(".ar-state");
  const follow = () => { if (scroller) scroller.scrollTop = scroller.scrollHeight; else el.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  follow();
  let stopped = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!stopped) fn(); }, ms));
  const t0 = performance.now();
  let at = 380;
  plan.steps.forEach((s, n) => {
    later(() => {
      const prev = steps.lastElementChild; if (prev) { prev.classList.add("done"); prev.querySelector(".ar-i").innerHTML = ic("check"); }
      steps.insertAdjacentHTML("beforeend", `<li class="ar-step"><span class="ar-i"><span class="spin"></span></span><span>${esc(s)}</span></li>`);
      drawIcons(); sfx("tick"); follow();
    }, at);
    at += 520 + (s.startsWith("Used") ? 380 : 0);
  });
  later(() => {
    const prev = steps.lastElementChild; prev.classList.add("done"); prev.querySelector(".ar-i").innerHTML = ic("check"); drawIcons();
    out.hidden = false; out.classList.add("streaming");
    const words = plan.reply.split(/(\s+)/); let i = 0, acc = "";
    const tick = () => {
      if (stopped) return;
      acc += words.slice(i, i + 3).join(""); i += 3;
      out.innerHTML = fmtMsg(acc) ; follow();
      if (i < words.length) timers.push(setTimeout(tick, 28));
      else finish();
    };
    tick();
  }, at);
  const finish = () => {
    out.classList.remove("streaming");
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    state.outerHTML = `<span class="ar-time">${fmtDate(demoNow())}</span>`;
    el.querySelector(".ar-acts").remove();
    const uses = plan.uses.length ? `<div class="ar-uses">${plan.uses.map(p => `<span class="tag">${ic(p.icon)}${p.kind === "skill" ? "Skill" : "Tool"} · ${esc(p.name)}</span>`).join("")}</div>` : "";
    steps.outerHTML = `<details class="trace ar-trace"><summary>${ic("chevron-right")}${plan.steps.length} steps · ${secs}s</summary><ol>${plan.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></details>`;
    out.insertAdjacentHTML("afterend", uses);
    el.classList.remove("agent-run"); drawIcons();
    sfx(plan.needsYou ? "needs" : "done");
    if (plan.needsYou) toast("Konteks asked you a question", "ask");
  };
  el.querySelector("[data-stop]").onclick = () => {
    stopped = true; timers.forEach(clearTimeout);
    state.outerHTML = `<span class="ar-time">Stopped</span>`;
    el.querySelector(".ar-acts").innerHTML = `<span class="hint">Stopped before it finished. Nothing was changed.</span>`;
    steps.querySelectorAll(".spin").forEach(s => s.outerHTML = ic("minus")); drawIcons(); sfx("tick");
  };
  return { el };
}
