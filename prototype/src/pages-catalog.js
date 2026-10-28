/* ---------- Component catalog v2: grouped, with the coverage map against the live app and the audit ---------- */
const CAT_GROUPS = [
  ["Navigasi", [
    ["c-shell", "Shell & sidebar", "Urutan menu sama dengan aplikasi: Activities, Work In Progress, Issues, Releases, Leaders, Customize, lalu daftar runtime. Rail ikon dengan tooltip di semua ikon; skip link di Tab pertama (UX-023, UX-045)."],
    ["c-mobile", "Navigasi mobile", "Bar tab bawah dengan badge. More membuka sidebar penuh untuk Issues, Leaders, runtime, dan akun."],
    ["c-header", "Header halaman", "Judul, subjudul satu kalimat, aksi halaman. Tautan kembali dan breadcrumb untuk halaman dalam."],
    ["c-subnav", "Subnavigasi", "Sepuluh bagian Customize. Item aktif selalu cocok dengan URL (UX-032); di layar sempit menjadi select."],
    ["c-nav", "Tab, segmented & filter", "Satu gaya tab (garis bawah) untuk semua halaman (DS-08); segmented untuk pilihan di tempat; filter System sebagai combobox (UX-044)."],
    ["c-combo", "Combobox", "Pilihan panjang yang bisa dicari: System, koneksi VCS, model berkelompok dengan harga (UX-010, UX-014, UX-029)."],
  ]],
  ["Aksi & input", [
    ["c-btn", "Tombol", "Satu tombol primer per area. Aksi yang memicu biaya menampilkan jumlahnya di dalam tombol dan minta konfirmasi (UX-003)."],
    ["c-input", "Input & form", "Label di atas, petunjuk di bawah, error menyebut cara memperbaiki. Textarea membesar mengikuti isi (UX-015)."],
    ["c-choice", "Pilihan", "Checkbox, radio, switch, dan kartu opsi bertema hijau, bukan biru bawaan browser (DS-03). Deskripsi workload terlihat."],
    ["c-msel", "Multi-select", "Daftar panjang dengan pencarian, Pilih semua/Kosongkan, dan penanda pemilik. Default hanya milik sendiri (UX-017)."],
    ["c-secret", "Field rahasia & token", "Hanya nilai rahasia yang disamarkan; isi berkas biasa tetap terbaca (UX-034)."],
    ["c-kv", "Editor key–value", "Untuk metadata, scripts, references, assets, parameter tool, dan env vars MCP."],
    ["c-md", "Editor Markdown", "Toolbar berlabel, Edit/Preview, penghitung 50.000 karakter."],
    ["c-attach", "Lampiran", "Drop zone dan chip lampiran dengan ukuran dan tombol hapus."],
    ["c-copy", "Perintah & blok kode", "Perintah satu baris dan payload panjang, masing-masing dengan Copy."],
  ]],
  ["Data", [
    ["c-status", "Status, tag & avatar", "Status selalu titik warna plus teks. System ditulis dengan ikon, tanpa warna, karena warna hanya untuk state."],
    ["c-stats", "Ringkasan angka & properti", "Strip ringkasan dihitung dari daftar yang sama (UX-031); daftar properti label–nilai."],
    ["c-table", "Tabel & daftar kartu", "Angka rata kanan dalam mono. Di layar sempit tabel menjadi daftar kartu (UX-040)."],
    ["c-matrix", "Daftar peran & izin", "16 peran dengan tujuan dan jumlah izin; drawer berisi daftar izin yang bisa dicari, tiap izin sekali, bukan awan pill (DS-05, UX-033)."],
    ["c-progress", "Langkah bernomor", "Langkah instal dan setup dengan perintah di tiap langkah."],
    ["c-cards", "Daftar sumber daya", "Runtime, skill, tool, berkas konteks, kredensial, dan versi."],
  ]],
  ["Khas Konteks", [
    ["c-decision", "Kartu perhatian", "Tiga varian dengan struktur sama: status, tiket, penyebab, satu aksi utama, Details, waktu tunggu (UX-004, UX-005, UX-006)."],
    ["c-row", "Kartu inisiatif", "Satu inisiatif di Work In Progress: judul, update baru, waktu tunggu, penyebab, isi yang diputuskan, giliran siapa, System, tahap, dan aksi sesuai izin (UX-002)."],
    ["c-quote", "Estimasi & stepper siklus", "Angka uang dalam mono. Stepper siklus Estimate → Quote → Plan → Delivery → Receipt dengan siklus sebelumnya."],
    ["c-log", "Log pembaruan", "Per hari, belum dibaca ditandai dengan legenda, siklus gagal/coba-lagi dikelompokkan dengan jumlah dan penyebab (UX-008)."],
    ["c-thread", "Catatan & komentar", "“Draft your thinking”, Attach, Post note, komentar, React, balasan Konteks."],
    ["c-chat", "Pesan sesi agen", "Ringkasan manusia lebih dulu, jejak agen dilipat, nama orang bukan handle mesin (UX-019)."],
    ["c-map", "System map", "Node System dan Component dengan garis relasi, kontrol zoom berlabel, tanpa chip “unknown” (UX-021)."],
    ["c-harness", "Agen di runtime", "Satu ubin per agen: logo resmi (atau tanda dua huruf sampai logonya dipasang) dengan lencana status berbentuk ikon. Nama dan status ada di nama aksesibel dan tooltip; agen terpilih disebut dalam teks di bawahnya, beserta perintah perbaikannya (UX-038)."],
    ["c-diff", "Diff", "Nomor baris, wrap, dan tampilan rendered untuk Markdown (UX-022)."],
  ]],
  ["Umpan balik & lapisan", [
    ["c-callout", "Callout & banner", "Callout di dalam konten; banner di atas halaman yang bisa ditutup (UX-011)."],
    ["c-states", "State: terkunci, error, 404", "Satu pola read-only dan pengganti kode error mentah (UX-028, UX-039, UX-032)."],
    ["c-empty", "Empty & loading", "Empty state menyebut cara mengisi (UX-025). Loading memakai skeleton seukuran konten (DS-10)."],
    ["c-toast", "Toast", "Konfirmasi singkat setelah aksi; versi error dengan sebab."],
    ["c-overlay", "Menu, modal, drawer, dialog", "Satu aturan: drawer untuk melihat atau meninjau objek tanpa meninggalkan halaman, modal untuk mengisi form lalu mengirim, dialog untuk mengonfirmasi satu akibat, menu untuk memilih. Escape menutup lapisan teratas saja (UX-012); hapus permanen meminta nama diketik (UX-016)."],
    ["c-disclosure", "Disclosure", "Untuk detail sekunder: tiket, opsi lanjutan, “Why?”, model per delivery."],
    ["c-pager", "Timeline aktivitas", "Kartu di atas garis waktu, terbaru di atas, kejadian lain di inisiatif yang sama pada hari itu dilipat ke dalam kartunya. Setiap kartu punya reaksi, komentar, dan aksi yang memang tersedia untuk penonton; yang sedang berjalan ditandai Live. Load more dengan jumlah yang terlihat."],
  ]],
];

function catSection(id) {
  const fx = {
    "c-shell": () => `<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))">
      <div class="mini"><aside class="side" aria-label="Contoh sidebar">
        <div class="side-top"><button class="ws" type="button"><span class="brand-mark">R</span><b>Refactory</b>${ic("chevrons-up-down")}</button><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Notifications">${ic("bell")}</button></div>
        <nav class="nav">${NAV.slice(0, 4).map(([k, , i, l]) => `<a href="#components" ${k === "work" ? 'aria-current="page"' : ""}>${ic(i)}${l}${k === "work" ? '<span class="count hot">3</span>' : ""}</a>`).join("")}</nav>
        <section class="side-sec"><div class="side-h"><span>Runtimes</span><button type="button" aria-label="Connect a runtime">${ic("plus")}</button></div>
          <a class="fleet" href="#components"><span class="fleet-ic">${ic("server")}</span><span class="fleet-b"><span class="hbar" aria-hidden="true"><i class="ok" style="flex:6"></i><i class="warn" style="flex:1"></i><i class="off" style="flex:3"></i></span><span class="fleet-t"><b>6 ready</b><span><i class="lg warn"></i>1 not accepting work</span><span><i class="lg off"></i>3 not connected</span></span></span></a></section>
        <section class="side-sec"><div class="side-h"><span>Your computer</span></div><nav class="nav mine-nav"><a href="#components"><span class="ic-dot">${ic("laptop")}<span class="rt-dot muted"></span></span><span class="lbl">ardian's Mac</span><span class="rt-st">Not connected</span></a><a href="#components">${ic("terminal-square")}<span class="lbl">Work Locally</span><span class="rt-st">MCP</span></a></nav></section>
      </aside><div class="mini-main"><span class="label">Sidebar penuh · 240 px</span><span class="sk" style="width:60%"></span><span class="sk" style="width:80%"></span></div></div>
      <div class="mini rail"><aside class="side" aria-label="Contoh rail">
        <span class="brand-mark" style="margin:4px auto 8px">R</span>
        <nav class="nav">${NAV.map(([k, , i, l]) => `<a href="#components" data-tip="${l}" aria-label="${l}" ${k === "work" ? 'aria-current="page"' : ""}>${ic(i)}</a>`).join("")}</nav>
      </aside><div class="mini-main"><span class="label">Rail · 56 px · hover atau fokus ikon untuk tooltip</span><span class="sk" style="width:70%"></span></div></div></div>
      <div class="specimen-row"><a class="skip skip-demo" href="#components">Skip to content</a><span class="hint">Tersembunyi sampai Tab pertama, lalu melompat ke konten utama.</span></div>`,
    "c-mobile": () => `<nav class="tabbar-demo" aria-label="Contoh bar tab">${[["activity", "Activities"], ["square-kanban", "Work", 7, 1], ["rocket", "Releases"], ["sliders-horizontal", "Customize"], ["menu", "More"]].map(([i, l, c, cur]) => `<a href="#components" ${cur ? 'aria-current="page"' : ""}>${ic(i)}${l}${c ? `<span class="count">${c}</span>` : ""}</a>`).join("")}</nav>
      <p class="hint">More membuka sidebar penuh: Issues, Leaders, daftar runtime, dan menu akun.</p>`,
    "c-header": () => `<div class="panel" style="padding:20px;display:grid;gap:20px">
      ${phead("Customize", "Where agents run, who may do what, and what they work with.")}
      <hr style="border:0;border-top:1px solid var(--line);margin:0">
      ${phead("Work In Progress", "What people are driving. Agents do the rest.", `<button class="btn btn-primary">${ic("plus")}New initiative</button>`)}
      <hr style="border:0;border-top:1px solid var(--line);margin:0">
      <div class="specimen-row"><a class="back" href="#components">${ic("arrow-left")}Back to Work In Progress</a><nav class="crumbs" aria-label="Breadcrumb"><a href="#components">Runtimes</a>${ic("chevron-right")}<b>rf-01</b></nav></div>
      <div class="specimen-row"><span class="tag">${ic("server")}rf-01 ${st("ok", "Ready")}</span><span class="tag">${ic("git-branch")}<span class="mono">rentify/support-api</span></span><button class="btn btn-ghost btn-sm">${ic("map")}System map</button><button class="btn btn-ghost btn-sm">${ic("folder")}Session files</button></div>
    </div>`,
    "c-subnav": () => `<div style="display:flex;gap:24px;flex-wrap:wrap"><nav class="vnav" aria-label="Contoh subnav">${CZ.map(([k, i, l]) => `<a href="#components" ${k === "runtimes" ? 'aria-current="page"' : ""}>${ic(i)}${l}</a>`).join("")}</nav>
      <div style="display:grid;gap:8px;align-content:start"><span class="label">Di bawah 860 px</span><select class="select" style="width:220px" aria-label="Section">${CZ.map(([, , l]) => `<option>${l}</option>`).join("")}</select></div></div>`,
    "c-nav": () => `<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true">Overview</button><button class="tab" role="tab" aria-selected="false">People & groups</button><button class="tab" role="tab" aria-selected="false">Roles</button><button class="tab" role="tab" aria-selected="false">Resource access</button></div>
      <div class="specimen-row"><div class="seg" role="group" aria-label="Source"><button type="button" aria-pressed="true">Public Git</button><button type="button" aria-pressed="false">Connected Git</button></div>
      <div class="seg" role="group" aria-label="Theme"><button type="button" aria-pressed="true">System</button><button type="button" aria-pressed="false">Light</button><button type="button" aria-pressed="false">Dark</button></div>
      <div class="seg" role="group" aria-label="Duration"><button type="button" aria-pressed="true">30 days</button><button type="button" aria-pressed="false">90 days</button></div></div>
      <div class="specimen-row"><button class="chipbtn">${ic("box")}All systems${ic("chevron-down")}</button><button class="chipbtn on">${ic("box")}System: <b>Rentify</b>${ic("chevron-down")}</button><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Edit Rentify" data-tip="Edit Rentify">${ic("pencil")}</button><button class="btn btn-ghost btn-sm">Show all systems</button></div>`,
    "c-combo": () => `<div class="grid2">
      <div class="field"><span class="flabel" id="cbL">Software System</span><div class="combo" id="cb1"><button class="btn combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="cbL"><span class="ph">Choose a System</span>${ic("chevrons-up-down")}</button></div><span class="hint">Ketik untuk mencari 24 System.</span></div>
      <div class="field"><span class="flabel" id="cbR">Repository for TKT-1</span><div class="combo" id="cb2"><button class="btn combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="cbR"><span class="ph">Choose a repository</span>${ic("chevrons-up-down")}</button></div><span class="hint">Koneksi milik System ini tampil paling atas.</span></div>
      <div class="field"><span class="flabel" id="cbML">Planning model</span><div class="combo" id="cb3"><button class="btn combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="cbML" data-val="GPT-5.6 Sol"><span>Codex · GPT-5.6 Sol</span>${ic("chevrons-up-down")}</button></div><span class="hint">Berkelompok per harness, dengan harga per 1M token. Model yang tidak cocok untuk mode ini disembunyikan.</span></div>
      <div class="field"><span class="flabel" id="cbMR">Testing model</span><div class="combo"><button class="btn combo-trigger" type="button" disabled aria-labelledby="cbMR" style="opacity:1;background:var(--sunken);color:var(--ink-2)"><span>Codex · GPT-6 Luna</span>${ic("lock")}</button></div><span class="hint">Read-only: only Workspace Owners can change models. <a href="#components">Request access</a></span></div>
    </div>`,
    "c-btn": () => `<div class="specimen-row"><button class="btn btn-primary">Create tickets</button><button class="btn">Change</button><button class="btn btn-ghost">Cancel</button><button class="btn btn-danger">Decline</button><button class="btn btn-icon" aria-label="More actions" data-tip="More actions">${ic("more-horizontal")}</button></div>
      <div class="specimen-row"><button class="btn btn-primary">${ic("check")}Approve<span class="cost">2.15 SP</span></button><button class="btn btn-primary" disabled>${ic("check")}Approve</button><button class="btn btn-primary"><span class="spin"></span>Approving</button></div>
      <div class="specimen-row"><button class="btn btn-sm">${ic("file-text")}PRD</button><button class="btn btn-sm">${ic("list-checks")}Breakdown</button><button class="btn btn-sm">${ic("history")}Updates<span class="count">16</span></button></div>
      <div class="specimen-row"><button class="btn btn-sm">Small</button><button class="btn">Default</button><button class="btn btn-lg">Large</button></div>`,
    "c-input": () => `<div class="grid2">
        <div class="field"><label for="ci1">Display name</label><input id="ci1" class="input" value="Ardian Yusuf"><span class="hint">How your name appears to your team.</span></div>
        <div class="field"><label for="ci2">Repository URL</label><input id="ci2" class="input" value="github.com/owner" aria-invalid="true"><span class="err">${ic("circle-alert")}Enter a full URL, like https://github.com/owner/skills</span></div>
        <div class="field"><label for="ci4">Name <span class="req-m">required</span></label><input id="ci4" class="input mono-in" placeholder="my-tool"></div>
        <div class="field"><span class="flabel">Workspace name</span><div class="ro">${ic("lock")}Refactory</div><span class="hint">Only the Workspace Owner can rename it.</span></div>
      </div>
      <div class="field"><label for="ci5">What is this initiative about?</label><textarea id="ci5" class="textarea" data-autosize rows="3">Refresh the Support API README from current source; change nothing else.</textarea><span class="hint">Tumbuh mengikuti isi. Coba tambah baris.</span></div>
      <div class="dc-acts"><button class="btn btn-primary btn-sm">Create revised proposal</button><button class="btn btn-sm">Cancel</button><button class="btn btn-ghost btn-sm btn-danger">Decline</button></div>`,
    "c-choice": () => `<div class="grid2"><div style="display:grid;gap:10px">
        <span class="flabel">Who merges</span>
        <label class="check"><input type="radio" name="cr" checked id="cc3"><span>A person<small>Konteks opens the pull request; someone on the team merges it.</small></span></label>
        <label class="check"><input type="radio" name="cr" id="cc4"><span>Konteks, when review and checks pass</span></label>
        <label class="check" style="align-items:center"><input type="checkbox" class="switch" checked id="cc5"><span>Use my connections in Konteks</span></label>
        <label class="check" style="align-items:center"><input type="checkbox" class="switch" id="cc6" disabled><span style="color:var(--ink-3)">Allow connections in this workspace <small>Only Workspace Owners can change this</small></span></label>
      </div><div style="display:grid;gap:8px">
        <label class="optcard"><input type="radio" name="co" checked id="co1"><span><b>Automatic</b><small>The least busy runtime that can do the work.</small></span></label>
        <label class="optcard"><input type="radio" name="co" id="co2"><span><b>A specific runtime</b><small>Work waits if that runtime cannot take it. Nothing moves elsewhere.</small></span></label>
      </div></div>
      <fieldset class="fs"><legend class="flabel">Workloads this computer may take</legend><div class="wl-grid">${WORKLOADS.slice(0, 4).map(([t, d], n) => `<label class="optcard"><input type="checkbox" id="wlc${n}" ${n < 3 ? "checked" : ""}><span><b>${t}</b><small>${d}</small></span></label>`).join("")}</div></fieldset>`,
    "c-msel": () => `<div class="field"><span class="flabel">Connections to read</span><div class="msel" id="ms1">
      <div class="pop-search">${ic("search")}<input placeholder="Filter connections" aria-label="Filter connections" id="msq"></div>
      <div class="pop-foot" style="border-top:0;border-bottom:1px solid var(--line)"><span id="msCount">2 of 8 selected</span><span style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm" type="button" id="msAll">Select all</button><button class="btn btn-ghost btn-sm" type="button" id="msNone">Clear</button></span></div>
      <div class="opts">${[["Ardian · Gitea", "gitea.example.id", "You", 1], ["Rentify org · Gitea", "gitea.example.id", "Organization", 1], ["Sari · Gitea", "gitea.example.id", "Sari W."], ["Bagus · Gitea", "gitea.example.id", "Bagus H."], ["Ledgerline · GitHub", "github.com", "Dimas P."], ["HRIS · Azure DevOps", "dev.azure.com", "Sari W."], ["Kurir Hub · Gitea", "git.kitchenly.example", "Bagus H."], ["rizky-test · GitHub", "github.com", "Rizky A."]].map(([n, h, o, c], i) => `<label class="opt"><input type="checkbox" id="msc${i}" ${c ? "checked" : ""}><span><b style="font-weight:500">${n}</b><small>${h}</small></span><span class="owner">${o}</span></label>`).join("")}</div>
    </div><span class="hint">Koneksi milik orang lain tidak tercentang secara default.</span></div>`,
    "c-secret": () => `<div class="grid2">
      <div class="field"><label for="sec1">MCP token</label><div class="secret"><input id="sec1" class="input" type="password" value="kxmcp_f70e8a2c91d4b3e61de1" readonly><button class="btn btn-icon" type="button" aria-label="Show token" data-reveal="sec1">${ic("eye")}</button><button class="btn btn-icon" type="button" aria-label="Copy token" data-copyfrom="sec1">${ic("copy")}</button></div><span class="hint">Shown once. Rotate it if it leaks.</span></div>
      <div class="field"><span class="flabel">VCS connector</span><div class="res-item" style="padding:8px 10px;border:1px solid var(--line);border-radius:var(--r6);background:var(--surface)">${ic("git-branch")}<div><div class="ttl">Rentify org · Gitea ${st("ok", "Connected")}</div><div class="meta"><span>gitea.example.id</span><span class="mono">29cf••••</span></div></div><button class="btn btn-ghost btn-sm">Test</button></div></div>
    </div>
    <div class="field"><label for="sec3">AGENT-PROFILE.yaml</label><textarea id="sec3" class="textarea" style="font-family:var(--mono);font-size:var(--t13)" rows="5">name: refactory-default
planning:
  model: gpt-5.6-sol
env:
  GITEA_TOKEN: ••••••••  # secret values stay masked</textarea><span class="hint">Isi berkas terbaca; hanya nilai yang ditandai rahasia yang disamarkan.</span></div>`,
    "c-kv": () => `<div class="field"><span class="flabel">Environment variables</span><div class="kv" id="kv1"><div class="kv-h"><span>Name</span><span>Value</span><span></span></div>
      ${[["GITEA_URL", "https://gitea.example.id"], ["GITEA_TOKEN", "••••••••"]].map(([k, v], i) => `<div class="kv-row"><input class="input" aria-label="Name ${i + 1}" value="${k}"><input class="input" aria-label="Value ${i + 1}" value="${v}"><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove variable" data-kvdel>${ic("x")}</button></div>`).join("")}
      <button class="btn btn-ghost btn-sm" type="button" id="kvAdd" style="justify-self:start">${ic("plus")}Add variable</button></div></div>`,
    "c-md": () => `<div class="field"><span class="flabel">Skill instructions</span><div class="md" id="md1">
      <div class="md-bar" role="toolbar" aria-label="Formatting">${[["heading-2", "Heading", "## "], ["bold", "Bold", "**"], ["italic", "Italic", "_"], ["list", "Bulleted list", "- "], ["list-ordered", "Numbered list", "1. "], ["link", "Link", "[]()"], ["code", "Inline code", "`"]].map(([i, l, t]) => `<button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="${l}" data-tip="${l}" data-md="${esc(t)}">${ic(i)}</button>`).join("")}
        <div class="seg" role="group" aria-label="Mode"><button type="button" aria-pressed="true" data-mdmode="edit">Edit</button><button type="button" aria-pressed="false" data-mdmode="prev">Preview</button></div></div>
      <textarea id="mdT" aria-label="Skill instructions in Markdown">## When to use
Use this skill to document a feature from current source.

- Read the code before writing
- Mark anything unverified as Needs Verification</textarea>
      <div class="md-prev" id="mdP" hidden></div>
      <div class="md-foot"><span>Markdown</span><span id="mdC">0 / 50,000</span></div></div></div>`,
    "c-attach": () => `<label class="drop" id="drop1">${ic("upload")}<span><b style="font-weight:500;color:var(--ink)">Drop a meeting transcript</b> or click to choose</span><span class="hint">.txt, .md, .vtt or .pdf up to 10 MB</span><input type="file" id="file1" accept=".txt,.md,.vtt,.pdf" multiple></label>
      <div class="atts" id="atts"><span class="att">${ic("file-text")}<b>standup-27-oct.vtt</b><span>42 KB</span><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove standup-27-oct.vtt" data-attdel>${ic("x")}</button></span></div>`,
    "c-copy": () => `<div style="display:grid;gap:4px;max-width:460px"><span class="hint">Checks the connector and every agent on this computer</span><div class="cmd"><code>konteks-remote doctor</code><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Copy command" data-copy="konteks-remote doctor">${ic("copy")}</button></div></div>
      <div class="field" style="max-width:320px"><label for="cProv">Where the alerts come from</label><select id="cProv" class="select"><option>Datadog</option><option>Grafana</option><option>Sentry</option><option>PagerDuty</option></select></div>
      <div class="code"><div class="code-h"><span>Datadog webhook payload</span><button class="btn btn-ghost btn-sm" type="button" data-copy='{"alert_id":"$ALERT_ID","alert_title":"$ALERT_TITLE","priority":"$PRIORITY"}'>${ic("copy")}Copy</button></div><pre>{
  "alert_id": "$ALERT_ID",
  "alert_title": "$ALERT_TITLE",
  "priority": "$PRIORITY"
}</pre></div>`,
    "c-status": () => `<div class="specimen-row">${st("ok", "Ready")}${st("warn", "Not accepting work")}${st("danger", "Failed")}${st("info", "Delivering")}${st("muted", "Not connected")}</div>
      <div class="specimen-row">${SYSTEMS.slice(0, 4).map(s => sysTag(s.id)).join("")}<span class="tag">Built-in</span><span class="idc">TKT-1</span><span class="kbd">Esc</span></div>
      <div class="specimen-row">${Object.keys(PEOPLE).slice(0, 5).map(k => av(k)).join("")}${av("ay", 1)}<span class="avg">${["sw", "bh", "np"].map(k => av(k)).join("")}</span><span class="hint">Avatar memakai inisial dengan satu warna; nama ada di tooltip</span></div>
      <div class="specimen-row"><span class="count">16</span><span class="count hot">7</span><span class="newup"><span class="unread"></span>3 new</span></div>`,
    "c-stats": () => `<div class="summary-strip"><div class="ss"><span>Registered</span><b>10</b><small>2 organization · 8 personal</small></div><div class="ss"><span>Ready</span><b>6</b><small>Accepting work now</small></div><div class="ss"><span>Not connected</span><b>3</b><small>No live connection</small></div></div>
      <div class="card" style="max-width:340px"><div class="card-b props">${[["Stage", `${sg("Executing", "decision")}Executing`], ["Driver", `${av("ay")}Ardian Yusuf`], ["System", sysTag("rentify")], ["Runtime", st("ok", "rf-01")], ["Who merges", "A person"]].map(([a, b]) => `<div class="prop"><span>${a}</span><div>${b}</div></div>`).join("")}</div></div>`,
    "c-table": () => `<div class="tablewrap"><table class="dtable fixed"><colgroup><col style="width:34%"><col style="width:22%"><col style="width:24%"><col style="width:20%"></colgroup>
        <thead><tr><th>Runtime</th><th>Owner</th><th>Status</th><th class="num">Connector</th></tr></thead><tbody>
        ${RUNTIMES.slice(0, 4).map(r => `<tr><td><div class="cellname">${ic("server", "os")}<b>${r.name}</b></div></td><td style="color:var(--ink-2)">${esc(r.owner)}</td><td>${rtStatus(r)}</td><td class="num mono">${r.version}</td></tr>`).join("")}
      </tbody></table></div>
      <span class="label">Versi layar sempit: baris yang sama sebagai kartu</span>
      <div class="clist" style="max-width:360px">${RUNTIMES.slice(0, 3).map(r => `<div class="citem"><div class="citem-top"><b>${esc(r.name)}</b>${rtStatus(r)}</div><small>${esc(r.owner)} · connector <span class="mono">${r.version}</span></small></div>`).join("")}</div>`,
    "c-matrix": () => `<div class="tablewrap"><table class="dtable fixed"><colgroup><col style="width:32%"><col><col style="width:120px"></colgroup><thead><tr><th>Role</th><th>What it is for</th><th class="num">Permissions</th></tr></thead><tbody>
      ${ROLES.slice(2, 6).map(([n, d, , mine]) => `<tr class="${mine ? "me-row" : ""}"><td><b style="font-weight:500">${n}</b>${mine ? ' <span class="hint">· yours</span>' : ""}</td><td style="color:var(--ink-2)">${d}</td><td class="num">${ROLE_PERMS[n] ? ROLE_PERMS[n].length : "—"}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="specimen-row"><button class="btn btn-sm" id="cRole">Open a role</button><button class="btn btn-sm" id="cReqAcc">${ic("hand")}Request access</button><button class="btn btn-sm" id="cCheck">${ic("scan-search")}Check access</button></div>`,
    "c-progress": () => `<div class="card" style="max-width:620px"><div class="card-b"><ol class="steps">
      <li><b>Install the connector</b><p>Run this in a terminal on the computer.</p>${cmd("curl -fsSL https://install.konteks.example | sh -s -- --code KX-7Q4M-29")}</li>
      <li><b>Sign in your agents</b><p>Use your own accounts. Konteks never sees the keys.</p>${cmd("konteks-remote auth login codex")}</li>
      <li><b>Confirm the connection</b><p>When the computer is connected, Konteks lists the agents it found.</p></li></ol></div></div>`,
    "c-cards": () => `<div class="card res">
        <div class="res-item">${ic("server", "os")}<div><div class="ttl">rf-01 <span class="hint" style="font-weight:400">Refactory Server 01</span> ${st("ok", "Ready")}</div><div class="meta"><span>Organization</span><span>All 7 workloads</span><span>Open sessions 3 · Running 1</span></div></div><button class="btn btn-sm">Open</button></div>
        <div class="res-item ghost">${ic("hourglass", "os")}<div><div class="ttl">rizky-pc ${st("muted", "Code expired")}</div><div class="meta"><span>Waiting to connect · the code was never used</span></div></div><button class="btn btn-sm">New code</button></div>
        <div class="res-item"><span class="tool-ic">${ic("sparkles")}</span><div><div class="ttl">skill-creator <span class="mono hint" style="font-weight:400">1.0.0</span><span class="tag">Built-in</span></div><div class="meta"><span>Create and register reusable skills from a chat session.</span></div></div>${ic("chevron-right", "os")}</div>
        <div class="res-item">${ic("file-text", "os")}<div><div class="ttl"><span class="mono">AGENT-PROFILE.yaml</span></div><div class="meta"><span>Workspace · all agents · edited 21 Oct 2026</span></div></div><span class="row-tools"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Edit AGENT-PROFILE.yaml" data-tip="Edit">${ic("pen-line")}</button><button class="btn btn-ghost btn-icon btn-sm btn-danger" aria-label="Delete AGENT-PROFILE.yaml" data-tip="Delete">${ic("trash-2")}</button></span></div>
        <div class="res-item">${ic("key-round", "os")}<div><div class="ttl">Credential from 25 Sep 2026 ${st("ok", "Active")}</div><div class="meta"><span class="mono">kxmcp_f70e…1de1</span><span>Platform MCP Access</span><span>Expires 24 Dec 2026</span></div></div><span class="cred-acts"><button class="btn btn-sm">${ic("repeat")}Rotate</button><button class="btn btn-ghost btn-sm btn-danger" id="cRevoke">Revoke</button></span></div>
      </div>
      <div class="card ver" style="max-width:520px"><div class="ver-row"><span class="mono">3.3.0</span><span class="hint">4 Sep 2026 · current</span><button class="btn btn-sm">Evaluate 3.3.0</button></div><div class="ver-row"><span class="mono">2.1.0</span><span class="hint">28 Aug 2026</span><span></span></div></div>`,
    "c-decision": () => `<div class="dc decision"><div class="dc-top">${st("ok", "Needs a decision")}<span>This initiative · waiting 7h 11m</span></div><div class="dc-body"><div class="dc-title">The plan is ready. Break it into tickets</div><p class="dc-why">Revision 2 covers validation, configuration, RBAC and state transitions for the first rental feature.</p><div class="dc-acts"><button class="btn btn-primary btn-sm">Create tickets</button><button class="btn btn-ghost btn-sm">${ic("history")}Details</button></div></div></div>
      <div class="dc blocked"><div class="dc-top">${st("danger", "Blocked")}<span>This initiative · waiting 4d 2h</span></div><div class="dc-body"><div class="dc-title">Nothing is moving</div><p class="dc-why">The plan could not be saved because you don't have Plan Save in SensePortal. Konteks already revised the plan as often as it may this hour.</p><div class="dc-acts"><button class="btn btn-primary btn-sm">See what happened</button><button class="btn btn-sm">Request access</button></div></div></div>
      <div class="dc waiting"><div class="dc-top">${st("muted", "Waiting")}<span>TKT-1 · waiting 7h 31m</span></div><div class="dc-body"><div class="dc-title">The breakdown is ready for review</div><p class="dc-why">TKT-1 still needs a repository. <b>Needs Sari Wulandari.</b></p><div class="dc-acts"><button class="btn btn-sm">Review</button><button class="btn btn-ghost btn-sm">${ic("history")}Details</button></div></div></div>`,
    "c-row": () => `<div class="act wip" style="display:block;padding:0"><ol class="tl wip-tl">${[INITIATIVES[1], INITIATIVES[0], INITIATIVES[3]].map((i, n) => wipCard(i, n === 0)).join("")}</ol></div>`,
    "c-quote": () => `<div class="quote" style="max-width:420px"><div class="qrow"><span>Story Points, at most</span><b>2.15 SP</b></div><div class="qrow"><span>Model cost on your subscription</span><b>$0.57 – $2.02</b></div><div class="qrow"><span>Valid until</span><b>27 Oct 2026, 14.34</b></div></div>
      <div class="dc-acts"><button class="btn btn-primary btn-sm">${ic("check")}Approve<span class="cost">2.15 SP</span></button><button class="btn btn-sm">Change</button><button class="btn btn-ghost btn-sm">${ic("history")}Details</button><span class="gate">${ic("lock")}Approving needs the Delivery Approver role</span></div>
      <div class="cycle" style="max-width:760px"><div class="stepper">${[["Estimate", 1], ["Quote", 2, "2.15 SP"], ["Plan", 0, "0/1"], ["Delivery", 0], ["Receipt", 0]].map(([l, s, sub], n) => `${n ? '<span class="step-line"></span>' : ""}<span class="step ${s === 1 ? "done" : s === 2 ? "now" : ""}"><span class="n">${s === 1 ? ic("check") : n + 1}</span>${l}${sub ? `<small>${sub}</small>` : ""}</span>`).join("")}</div><span class="cyc-nav"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Previous cycle">${ic("chevron-left")}</button><span class="hint">Cycle 2 of 2 · current</span><button class="btn btn-ghost btn-icon btn-sm" aria-label="Newer cycle" disabled>${ic("chevron-right")}</button></span></div>`,
    "c-log": () => `<div class="log" style="max-width:620px">
      <div class="log-day"><h4>Today</h4>
        <div class="log-e ok">${ic("file-check-2")}<span>Estimate ready for TKT-1 · up to 2.15 SP</span><time><span class="unread" title="Unread"></span>13.33</time></div>
        <div class="log-e bad">${ic("circle-x")}<span>TKT-1 delivery stopped after 3 repair rounds</span><time><span class="unread" title="Unread"></span>13.28</time></div></div>
      <div class="log-day"><h4>Yesterday</h4>
        <div class="log-e bad">${ic("layers")}<details><summary>Planning failed and retried <span class="x">×12</span> <span class="hint">02.12–04.39 · last cause: ended without a plan or a question</span></summary><div class="log-sub"><span>04.39 Could not revise the plan</span><span>04.37 Retrying</span><span>04.07 Could not revise the plan</span><span>… 9 more</span></div></details><time>04.39</time></div>
        <div class="log-e">${ic("message-square-text")}<span>Rizky added a note</span><time>16.17</time></div></div></div>`,
    "c-thread": () => `<div class="thread">
      <div class="compose"><textarea rows="1" placeholder="Draft your thinking… notes feed the plan" aria-label="Add a note"></textarea><button class="btn btn-ghost btn-icon btn-sm" aria-label="Attach file" data-tip="Attach">${ic("paperclip")}</button><button class="btn btn-primary btn-sm">Post note</button></div>
      <div class="cmt">${av("ra", 1)}<div class="cmt-b"><div class="cmt-h"><b>Rizky Aditya</b><time>yesterday, 16.17</time></div><p>Analyse all three Kurir Hub repositories first, then propose the manual's outline before writing.</p><div class="reacts"><button class="react" type="button" aria-pressed="true" data-react>👍 <span>2</span></button><button class="react react-add" type="button" aria-label="React">${ic("smile-plus")}</button><button class="btn btn-ghost btn-sm">Comment</button></div></div></div>
      <div class="cmt reply"><span class="agent-av">${ic("bot")}</span><div class="cmt-b"><div class="cmt-h"><b>Konteks</b><span class="agent-chip">Agent</span><time>16.20</time></div><p>Proposed one ticket per repository, then a combined manual. The outline is in the PRD.</p></div></div>
      <button class="more-replies" type="button">Show 1 more</button></div>`,
    "c-chat": () => `<div class="sess-col" style="margin:0;max-width:680px">
      <div class="msg-user">Please deliver this ticket again, fixing what stopped it last time.</div>
      <div class="msg-agent"><span class="agent-av">${ic("bot")}</span><div class="msg-b"><span class="who"><b>Engineering agent</b>Codex · GPT-6 Luna · 13.32</span><p>I checked why the last delivery stopped and sent a corrected retry for estimation. Nothing runs until it's approved.</p>
        <details class="trace"><summary>${ic("chevron-right")}Agent trace · 4 steps · 71s</summary><pre>read   delivery receipt TKT-1 (failed)
decide resume not available → new proposal</pre></details>
        <span class="meta-line">71s · 922 tokens in · 116 out</span></div></div>
      <div class="evline ok">${ic("circle-check")}<b>Maya Lestari approved this delivery</b><span>· 13.00</span></div>
      <div class="evline">${ic("play")}<span>Task 1 of 1 started on rf-01 · 13.00</span></div>
      <div class="run"><div class="run-h">${ic("circle-x")}<b style="font-weight:600">Delivery stopped</b><span class="hint" style="margin-left:auto">13.28 · 0.52 SP settled</span></div><div class="run-b"><p>The mandatory check exited with code 1. Your changes are kept on the pull request.</p><div class="run-acts"><span class="tag">${ic("git-pull-request")}PR #41 · open</span><button class="btn btn-sm">${ic("file-diff")}View changes</button><button class="btn btn-sm">${ic("receipt")}View receipt</button></div></div></div>
      <div class="compose"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Attach file">${ic("paperclip")}</button><button class="btn btn-ghost btn-icon btn-sm" aria-label="Add text attachment">${ic("file-plus-2")}</button><textarea rows="1" placeholder="Describe the outcome you need" aria-label="Message the agent"></textarea><button class="btn btn-ghost btn-icon btn-sm" aria-label="Record voice message">${ic("mic")}</button><button class="btn btn-primary btn-icon btn-sm" aria-label="Send message">${ic("arrow-up")}</button></div><div class="sess-live" id="cLive"></div><p class="hint">Coba: tulis pesan, ketik / untuk memilih skill atau tool, lalu ⌘↵. Agennya disimulasikan.</p>${composerHtml({ id: "cCx", placeholder: "Describe the outcome you need. Type / for a skill", cta: "Send", attachId: "cAtts" })}<div class="atts" id="cAtts"></div></div>`,
    "c-map": () => `<div class="canvas" id="map1"><div class="zoom"><button class="btn btn-icon btn-sm" type="button" aria-label="Zoom in" data-zoom="in">${ic("plus")}</button><button class="btn btn-icon btn-sm" type="button" aria-label="Zoom out" data-zoom="out">${ic("minus")}</button><button class="btn btn-icon btn-sm" type="button" aria-label="Reset zoom" data-tip="Reset zoom" data-zoom="fit">${ic("rotate-ccw")}</button></div>
      <div class="canvas-in" id="mapIn"><svg class="links" aria-hidden="true"></svg>
        <div class="mnode sys" style="left:calc(50% - 90px);top:20px"><span class="label">System</span><b>Rentify</b></div>
        ${[["support-api", "8%", "Confirmed", "ok"], ["web-app", "calc(50% - 90px)", "Confirmed", "ok"], ["gmail-handler", "calc(92% - 180px)", "Provisional", "warn"]].map(([n, l, s, k]) => `<div class="mnode" style="left:${l};top:150px"><b>${n}</b><span class="mono hint">rentify/${n}</span>${st(k, s)}<button class="btn btn-sm">Start session</button></div>`).join("")}
      </div></div>`,
    "c-harness": () => `<div class="harnsel tiles" role="group" aria-label="Agent">${[["Claude Code", "signin", 1], ["Codex", "ready"], ["DeepSeek Harness", "ready"], ["OpenCode", "failed"], ["Google Antigravity", "na"]].map(([n, k, p]) => harnTile(n, k, HARNESS_STATUS[k], !!p)).join("")}</div><p class="hsel"><b>Claude Code</b> ${st(...HARNESS_STATUS.signin)}</p>
      <div class="fix"><b>Claude Code: Needs sign-in.</b> Sign it in on rf-01:</div>${cmd("konteks-remote auth login claude-code")}`,
    "c-diff": () => PANES.changes(),
    "c-callout": () => `<div class="banner" id="ban1">${ic("plug-zap")}<span class="grow"><b style="color:var(--ink);font-weight:500">Rentify was connected</b> from sari@debian on 30 Sep 2026.</span><button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Dismiss" id="banX">${ic("x")}</button></div>
      <div class="callout info">${ic("arrow-up-circle")}<span class="grow"><b>Connector 0.19.26 is available.</b> It updates by itself within 6 hours; running work finishes first.</span></div>
      <div class="callout warn">${ic("triangle-alert")}<span class="grow"><b>TKT-1 needs one repository.</b> Choose it before the breakdown can be accepted.</span></div>
      <div class="callout danger">${ic("circle-x")}<span class="grow"><b>The Google sign-in window closed before it finished.</b> Allow pop-ups and try again.</span></div>`,
    "c-states": () => `<div class="lockrow">${ic("lock")}<span class="grow">Only a Workspace Owner can change these.</span><button class="btn btn-sm">Request access</button></div>
      <div class="grid2"><div class="state locked"><div class="ic">${ic("lock")}</div><h3>Only Billing Administrators can see budgets</h3><p>You can still see what was spent in Usage.</p><button class="btn btn-sm">Request access</button></div>
      <div class="state error"><div class="ic">${ic("cloud-off")}</div><h3>Resource access is temporarily unavailable</h3><p>The access service didn't answer. No access has been assumed and nothing changed.</p><button class="btn btn-sm">${ic("rotate-cw")}Try again</button></div></div>
      <div class="notfound"><h3>This page doesn't exist</h3><p>Nothing lives at <code>/customize/vcs-connectors</code>. VCS connectors are at Customize › VCS Connectors.</p><div style="display:flex;gap:8px"><a class="btn btn-primary btn-sm" href="#vcs">Go to VCS Connectors</a><a class="btn btn-ghost btn-sm" href="#work">Work In Progress</a></div></div>`,
    "c-empty": () => `<div class="grid2"><div class="empty"><div class="ic">${ic("shield-check")}</div><h3>Nothing is open</h3><p>When something breaks, whether a person reports it or a telemetry channel sends an alert, it appears here.</p><button class="btn btn-sm">${ic("radio-tower")}Set up a telemetry channel</button></div>
      <div class="panel" style="padding:16px;display:grid;gap:12px" aria-busy="true" aria-label="Loading">${[1, 2, 3].map(() => `<div style="display:grid;grid-template-columns:16px 1fr 60px;gap:12px;align-items:center"><span class="sk" style="width:16px;height:16px;border-radius:50%"></span><div style="display:grid;gap:6px"><span class="sk" style="width:70%"></span><span class="sk" style="width:45%;height:10px"></span></div><span class="sk"></span></div>`).join("")}</div></div>`,
    "c-toast": () => `<div class="toast toast-demo">${ic("check-circle-2")}<span>Approved up to 2.15 SP. TKT-1's delivery started on rf-01</span></div>
      <div class="toast toast-demo err">${ic("circle-alert")}<span>Not connected yet. Run the install command, then check again</span></div>
      <div><button class="btn" id="cToast">Show toast</button></div>`,
    "c-overlay": () => `<div class="specimen-row"><button class="btn" id="cMenu">${ic("more-horizontal")}Menu</button><button class="btn" id="cNotif">${ic("bell")}Notifications</button><button class="btn" id="cModal">Form modal</button><button class="btn" id="cDrawer">Drawer</button><button class="btn" id="cStack">Stacked drawers</button><button class="btn" id="cDialog">Confirm dialog</button><button class="btn btn-danger" id="cType">Delete with typed name</button></div>
      <div class="specimen-row"><button class="btn" id="cWs">${ic("chevrons-up-down")}Workspace switcher</button><button class="btn" id="cAcct">${ic("user")}Account menu</button><button class="btn" id="cNewInit">${ic("plus")}New initiative</button><button class="btn" id="cEditSys2">${ic("pencil")}Edit System</button><button class="btn" id="cRevoked">Revoked runtimes</button><button class="btn" id="cWl">${ic("terminal-square")}Work Locally</button><button class="btn" id="cSupport">${ic("life-buoy")}Support</button><button class="btn" id="cNewWs">Create workspace</button><span class="btn" data-tip="Tooltip on hover and focus" tabindex="0">Tooltip</span></div>`,
    "c-disclosure": () => `<div class="disc">${[["TKT-1 · Validate and refresh the README", "Up to 2.15 SP · estimate ready", "Update only README.md, run every documented command on rf-01, open one reviewed pull request."], ["Models for this delivery", "Engineering: Codex · GPT-6-Luna", "Change models for this delivery only. You get a fresh quote before approving; workspace defaults stay the same."], ["Why? · Not reported", "8.74 SP · 48%", "Runs that ended before reporting their work. Mostly the 12 planning retries on Kurir Hub user manual."]].map(([t, m, b], i) => `<details ${i === 0 ? "open" : ""}><summary>${ic("chevron-right")}<span style="flex:1;font-weight:500">${t}</span><span class="hint">${m}</span></summary><div class="dbody">${b}${i === 0 ? `<div><button class="btn btn-sm" type="button" id="cTktMore">${ic("more-horizontal")}More</button></div>` : ""}</div></details>`).join("")}</div>
      <div class="specimen-row"><details class="inline-disc"><summary>${ic("chevron-right")}More options</summary><div class="disc-in hint">Channel name and other settings.</div></details>
      <details class="inline-disc"><summary>${ic("chevron-right")}Konteks learned · 1 note</summary><div class="disc-in hint">The verify script prints an expected error from a logging test.</div></details>
      <details class="inline-disc"><summary>${ic("chevron-right")}Show 11 commands</summary><div class="disc-in hint">/plan, /mcp, /skills, /status…</div></details></div>`,
    "c-pager": () => `<ol class="tl" role="feed" aria-label="Activities"><li class="tl-day"><h2>Today<span>27 Oct 2026</span></h2></li>${actCard({ e: ACTIVITY[0], earlier: [] })}${actCard({ e: ACTIVITY[2], earlier: [ACTIVITY[5]] })}</ol><div class="pager list-pager"><button class="btn btn-sm" type="button">Load more</button><span>Showing 11 of 44</span></div>`,
  };
  return fx[id] ? fx[id]() : "";
}

const SPEC_SRC = {};
const DEMO_NAME = { login: "Sign in", work: "Work In Progress", initiative: "Initiative", session: "Session", activities: "Activities", issues: "Issues", releases: "Releases", leaders: "Leaders", runtimes: "Runtimes", runtime: "Runtime page", access: "Access", models: "Models", context: "Context", skills: "Skills", tools: "Tools", mcps: "MCPs", connectors: "Connectors", vcs: "VCS Connectors", operations: "Operations", general: "Settings › General", plan: "Settings › Plan", usage: "Settings › Usage", budgets: "Settings › Budgets", payments: "Settings › Payments" };
function pageComponents() {
  const all = CAT_GROUPS.flatMap(([, s]) => s);
  const ids = new Set(all.map(s => s[0]));
  const idsOf = r => [].concat(r[2]);
  const kind = r => r[3] === "app" ? "app" : r[3] === "baru" ? "new" : "rep";
  const status = r => r[4] || (idsOf(r).every(i => ids.has(i)) ? "covered" : "gap");
  if (INVENTORY.some(r => status(r) === "gap")) console.warn("Inventory rows without a component", INVENTORY.filter(r => status(r) === "gap"));
  const fromApp = INVENTORY.filter(r => kind(r) === "app").length, fromRep = INVENTORY.filter(r => kind(r) === "rep").length, fromNew = INVENTORY.filter(r => kind(r) === "new").length;
  const cnt = k => INVENTORY.filter(r => status(r) === k).length;
  const t = S.invFilter || "all";
  const rows = INVENTORY.filter(r => t === "all" || kind(r) === t);
  const ST = { covered: ["ok", "Tertutup"], partial: ["warn", "Sebagian"], replaced: ["info", "Diganti"], gap: ["danger", "Belum"] };
  const titleOf = Object.fromEntries(all.map(([id, ti]) => [id, ti]));
  const cur = S.comp || all[0][0], q = (S.compQ || "").toLowerCase();
  /* One component at a time: a searchable index on the left, the selected component and where it is used on the right. */
  const nav = `<nav class="catx-nav" aria-label="Komponen">
      <div class="with-icon">${ic("search")}<input class="input" id="compQ" placeholder="Cari komponen" aria-label="Cari komponen" value="${esc(S.compQ || "")}"></div>
      <a href="#components" data-comp="coverage" ${cur === "coverage" ? 'aria-current="page"' : ""}>${ic("list-checks")}Pemetaan<span class="count">${INVENTORY.length}</span></a>
      ${CAT_GROUPS.map(([g, list]) => { const f = list.filter(([, ti, d]) => !q || (ti + " " + d).toLowerCase().includes(q)); return f.length ? `<span class="grp">${g}</span>${f.map(([id, ti]) => `<a href="#components" data-comp="${id}" ${cur === id ? 'aria-current="page"' : ""}>${esc(ti)}</a>`).join("")}` : ""; }).join("") || `<p class="hint" style="padding:8px 10px">Tidak ada yang cocok.</p>`}
    </nav>`;
  let main;
  if (cur === "coverage") {
    main = `<div class="catx-head"><h2 class="h-page">Pemetaan</h2><p>${fromApp} elemen dari aplikasi live, ${fromRep} pola dari laporan audit, dan ${fromNew} tambahan tampilan tanpa perilaku baru. Setiap baris menunjuk komponennya dan layar demo tempat elemen itu bisa dicoba.</p>
      <div class="specimen-row">${st("ok", cnt("covered") + " tertutup")}${st("info", cnt("replaced") + " diganti dengan pola lain")}${cnt("gap") ? st("danger", cnt("gap") + " belum") : ""}</div></div>
      <div class="seg" role="group" aria-label="Sumber"><button type="button" data-inv="all" aria-pressed="${t === "all"}">Semua · ${INVENTORY.length}</button><button type="button" data-inv="app" aria-pressed="${t === "app"}">Dari aplikasi · ${fromApp}</button><button type="button" data-inv="rep" aria-pressed="${t === "rep"}">Dari laporan · ${fromRep}</button><button type="button" data-inv="new" aria-pressed="${t === "new"}">Baru · ${fromNew}</button></div>
      <div class="inv-tools"><div class="with-icon">${ic("search")}<input class="input" id="invQ" placeholder="Cari elemen, layar, atau komponen" aria-label="Cari di pemetaan" value="${esc(S.invQ || "")}"></div><span class="hint" id="invN">${rows.length} baris</span></div>
      <div class="tablewrap inv-wrap"><table class="dtable inv"><colgroup><col style="width:38%"><col style="width:15%"><col style="width:20%"><col style="width:16%"><col style="width:11%"></colgroup>
        <thead><tr><th>Elemen atau pola</th><th>Di mana</th><th>Komponen</th><th>Demo</th><th>Status</th></tr></thead><tbody>
        ${rows.map(r => { const [el, where, , src, , note, demo] = r; const k = kind(r); const q = (el + " " + where + " " + idsOf(r).map(id => titleOf[id] || id).join(" ") + " " + src).toLowerCase(); return `<tr data-q="${esc(q)}"><td><div class="inv-el">${esc(el)}${k === "rep" ? `<span class="src rep">${esc(src)}</span>` : k === "new" ? '<span class="src">Baru</span>' : ""}</div>${note ? `<div class="hint">${esc(note)}</div>` : ""}</td><td class="inv-where">${esc(where)}</td><td><div class="cell-links">${idsOf(r).map(id => `<a href="#components" data-comp="${id}">${esc(titleOf[id] || id)}</a>`).join("")}</div></td><td>${demo && demo !== "components" ? `<a href="#${demo}">${esc(DEMO_NAME[demo] || demo)}</a>` : '<span class="hint">Di katalog</span>'}</td><td>${st(...ST[status(r)])}</td></tr>`; }).join("")}
      </tbody></table><p class="hint inv-none" hidden>Tidak ada baris yang cocok.</p></div>`;
  } else {
    const [, ti, d] = all.find(x => x[0] === cur), html = catSection(cur); SPEC_SRC[cur] = html;
    const used = INVENTORY.filter(r => idsOf(r).includes(cur));
    const pos = all.findIndex(x => x[0] === cur), prev = all[pos - 1], next = all[pos + 1];
    main = demoBlock(cur, ti, d, html) + `<section class="used"><h3 class="h-sub">Dipakai di aplikasi <span class="count">${used.length}</span></h3>
      <div class="panel scroll-x"><table class="tbl used-t"><colgroup><col><col style="width:200px"><col style="width:176px"></colgroup><thead><tr><th>Elemen</th><th>Tempat</th><th class="end">Lihat di demo</th></tr></thead>
      <tbody>${used.map(r => `<tr><td>${esc(r[0])}</td><td class="where">${esc(r[1])}</td><td class="end">${r[6] && r[6] !== "components" ? `<a href="#${r[6]}">${esc(DEMO_NAME[r[6]] || r[6])}${ic("arrow-up-right")}</a>` : `<span class="hint">Hanya di katalog</span>`}</td></tr>`).join("")}</tbody></table></div></section>
      <div class="catx-pn">${prev ? `<button class="btn btn-ghost btn-sm" type="button" data-comp="${prev[0]}">${ic("arrow-left")}${esc(prev[1])}</button>` : "<span></span>"}${next ? `<button class="btn btn-ghost btn-sm" type="button" data-comp="${next[0]}">${esc(next[1])}${ic("arrow-right")}</button>` : ""}</div>`;
  }
  return `<div class="catx-wrap"><header class="catx-top"><h1>Katalog komponen</h1><p>${all.length} komponen dalam ${CAT_GROUPS.length} kelompok. Pilih satu untuk melihat state-nya, kodenya, dan di mana ia dipakai.</p></header>
    <div class="catx">${nav}<div class="catx-main" id="catMain">${main}</div></div></div>`;
}

/* ---------- interactions ---------- */
function comboBind(rootId, groups, onPick) {
  const root = document.getElementById(rootId); if (!root) return;
  const trig = root.querySelector(".combo-trigger");
  /* The list is portalled to <body> with fixed coordinates, so a modal's scrolling body or a drawer can never clip it;
     it opens below the trigger, or above it when there is not enough room below. */
  let pop = null;
  const place = () => {
    if (!pop) return;
    const r = trig.getBoundingClientRect(), gap = 4, below = innerHeight - r.bottom - gap - 8, above = r.top - gap - 8;
    const want = Math.min(pop.scrollHeight, 320), up = below < Math.min(want, 220) && above > below;
    const room = Math.max(160, Math.min(320, up ? above : below));
    /* At least as wide as the trigger and wide enough for the longest option (up to 320px), so names never clip. */
    pop.style.minWidth = Math.max(r.width, 220) + "px"; pop.style.maxWidth = Math.min(320, innerWidth - 16) + "px";
    pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + "px";
    pop.style.maxHeight = room + "px";
    pop.style.top = up ? "" : r.bottom + gap + "px"; pop.style.bottom = up ? innerHeight - r.top + gap + "px" : "";
    pop.classList.toggle("up", up);
  };
  const close = () => { pop?.remove(); pop = null; trig.setAttribute("aria-expanded", "false"); document.removeEventListener("mousedown", outside); removeEventListener("resize", place); document.removeEventListener("scroll", place, true); };
  const outside = e => { if (!root.contains(e.target) && !pop?.contains(e.target)) close(); };
  trig.onclick = () => {
    if (pop) return close();
    pop = document.createElement("div"); pop.className = "pop pop-fixed";
    pop.innerHTML = `<div class="pop-search">${ic("search")}<input aria-label="Search" placeholder="Search"></div><div class="opts" role="listbox"></div>`;
    document.body.append(pop); trig.setAttribute("aria-expanded", "true");
    const q = pop.querySelector("input"), list = pop.querySelector(".opts");
    const draw = () => { const v = q.value.toLowerCase();
      list.innerHTML = groups.map(([g, items]) => { const f = items.filter(i => i[0].toLowerCase().includes(v)); return f.length ? (g ? `<div class="og">${g}</div>` : "") + f.map(i => `<button class="opt" role="option" type="button" data-val="${esc(i[0])}" aria-selected="${trig.dataset.val === i[0]}">${ic("check", "ck")}${esc(i[0])}${i[1] ? `<small>${esc(i[1])}</small>` : ""}</button>`).join("") : ""; }).join("") || `<p class="hint" style="padding:10px">No match for “${esc(q.value)}”.</p>`;
      drawIcons();
      list.querySelectorAll(".opt").forEach(o => o.onclick = () => { const name = o.dataset.val; trig.dataset.val = name; trig.querySelector("span").textContent = name; trig.querySelector("span").classList.remove("ph"); close(); onPick?.(name); trig.focus(); });
    };
    draw(); drawIcons(); place(); q.focus({ preventScroll: true }); q.oninput = () => { draw(); place(); };
    addEventListener("resize", place); document.addEventListener("scroll", place, true);
    q.onkeydown = e => { const os = [...list.querySelectorAll(".opt")]; if (e.key === "ArrowDown") { e.preventDefault(); os[0]?.focus(); } if (e.key === "Escape") { e.stopPropagation(); close(); trig.focus(); } if (e.key === "Enter") { e.preventDefault(); os[0]?.click(); } };
    list.onkeydown = e => { const os = [...list.querySelectorAll(".opt")], i = os.indexOf(document.activeElement); if (e.key === "ArrowDown") { e.preventDefault(); os[Math.min(i + 1, os.length - 1)]?.focus(); } if (e.key === "ArrowUp") { e.preventDefault(); i <= 0 ? q.focus() : os[i - 1].focus(); } if (e.key === "Escape") { e.stopPropagation(); close(); trig.focus(); } };
    setTimeout(() => document.addEventListener("mousedown", outside));
  };
}

/* Unread = exactly the items counted in "Needs you", so the badge and the inbox never disagree. */
function notifItems() {
  const mine = INITIATIVES.filter(actsNow).map(i => [1, "kx", i.head, `${esc(i.title)} · waiting ${i.wait}`, "#initiative", i.id]);
  return mine.concat([[0, "sw", "Sari started an initiative", `HRIS frontend developer README · ${ago(480)}`, "#activities", ""]]);
}
function notifPopover(anchor) {
  $$(".floatpop").forEach(p => p.remove());
  const p = document.createElement("div"); p.className = "floatpop npop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Notifications");
  p.innerHTML = `<div class="npop-h"><b>Notifications</b></div>
    ${notifItems().map(([u, w, t, s, h, id]) => `<a class="ni" href="${h}" data-ni="${id}">${u ? '<span class="unread"></span>' : '<span class="read"></span>'}${w === "kx" ? '<span class="av av-kx" title="Konteks">K</span>' : av(w)}<span>${esc(t)}<small>${s}</small></span>${u ? '<span class="sr">Unread</span>' : ''}</a>`).join("")}
    <div class="npop-f"><a href="#activities">See all activity</a></div>`;
  const r = anchor.getBoundingClientRect();
  p.style.top = Math.min(r.bottom + 6, innerHeight - 320) + "px"; p.style.left = Math.max(8, Math.min(r.left, innerWidth - 376)) + "px";
  document.body.append(p);
  const close = () => { p.remove(); document.removeEventListener("mousedown", out); document.removeEventListener("keydown", key); anchor.focus(); };
  const out = e => { if (!p.contains(e.target) && e.target !== anchor) close(); };
  const key = e => { if (e.key === "Escape") { e.stopImmediatePropagation(); close(); } };
  p.querySelector(".ni").focus();
  p.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { if (a.dataset.ni) S.cur = a.dataset.ni; p.remove(); if (location.hash === a.getAttribute("href")) render(); }));
  setTimeout(() => { document.addEventListener("mousedown", out); document.addEventListener("keydown", key); });
}

function typeConfirm(name, onOk) {
  const d = document.createElement("div");
  d.className = "dialog"; d.setAttribute("role", "alertdialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Delete System");
  d.innerHTML = `<div class="dialog-b"><h2>Delete System “${esc(name)}”?</h2><p>This removes the System and its map. 0 open initiatives are affected; closed initiatives stay in the audit log. This can't be undone.</p>
    <div class="field"><label for="tcIn">Type <span class="confirm-name">${esc(name)}</span> to confirm</label><input id="tcIn" class="input" autocomplete="off"></div></div>
    <div class="dialog-f"><button class="btn" data-close>Cancel</button><button class="btn btn-danger" id="tcOk" disabled>Delete System</button></div>`;
  openLayer(d);
  const inp = d.querySelector("#tcIn"); inp.focus();
  inp.oninput = () => d.querySelector("#tcOk").disabled = inp.value !== name;
  d.querySelector("#tcOk").onclick = () => { closeOverlay(); onOk?.(); };
}

function renderMd(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/_(.+?)_/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");
  let out = "", list = false;
  src.split("\n").forEach(l => {
    if (/^- /.test(l)) { if (!list) { out += "<ul>"; list = true; } out += `<li>${inline(l.slice(2))}</li>`; return; }
    if (list) { out += "</ul>"; list = false; }
    if (/^##? /.test(l)) out += `<h3>${inline(l.replace(/^##? /, ""))}</h3>`; else if (l.trim()) out += `<p>${inline(l)}</p>`;
  });
  return out + (list ? "</ul>" : "");
}

function bindCatalog() {
  if ($("#cCx")) bindComposer($("#cCx"), { onSend: ({ text, picks }) => { $("#cLive").insertAdjacentHTML("beforeend", `<div class="msg-user msg-in">${esc(text)}${picks.length ? `<span class="msg-uses">${picks.map(p => (p.kind === "skill" ? "Skill" : "Tool") + " · " + esc(p.name)).join(", ")}</span>` : ""}</div>`); sfx("send"); agentRun($("#cLive"), { text, picks, mode: "session" }); } });
  bindDocs();
  $$("[data-inv]").forEach(b => b.onclick = () => { S.invFilter = b.dataset.inv; render(); });
  const iq = $("#invQ"); if (iq) { const f = () => { S.invQ = iq.value; const v = iq.value.trim().toLowerCase(); let n = 0; $$(".inv tbody tr").forEach(tr => { const on = !v || tr.dataset.q.includes(v); tr.hidden = !on; n += on; }); $("#invN").textContent = n + " baris"; $(".inv-none").hidden = n > 0; }; iq.oninput = f; f(); }
  $$("[data-comp]").forEach(a => a.onclick = e => { e.preventDefault(); S.comp = a.dataset.comp; render(); scrollTo(0, 0); });
  const cq = $("#compQ"); if (cq) { cq.oninput = () => { S.compQ = cq.value; render(); const n = $("#compQ"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }; }
  comboBind("cb1", [["", SYSTEMS.map(s => [s.name, s.open ? s.open + " open" : ""])]]);
  comboBind("cb2", [["Connected to HRIS Nusantara", [["HRIS Azure", "Azure DevOps"]]], ["Other connections", [["Gitea Sari", "gitea.example.id"], ["Gitea Bagus", "gitea.example.id"], ["GitHub Ledgerline", "github.com"], ["rizky-test", "github.com"]]]]);
  $$("[data-autosize]").forEach(t => { const fit = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; }; t.addEventListener("input", fit); fit(); });
  /* multi-select */
  const msBoxes = () => $$("#ms1 input[type=checkbox]");
  const msCount = () => { const b = msBoxes(); $("#msCount").textContent = `${b.filter(x => x.checked).length} of ${b.length} selected`; };
  msBoxes().forEach(b => b.onchange = msCount);
  $("#msAll")?.addEventListener("click", () => { msBoxes().filter(b => !b.closest("label").hidden).forEach(b => b.checked = true); msCount(); });
  $("#msNone")?.addEventListener("click", () => { msBoxes().forEach(b => b.checked = false); msCount(); });
  $("#msq")?.addEventListener("input", e => { const v = e.target.value.toLowerCase(); $$("#ms1 label.opt").forEach(l => l.hidden = !l.textContent.toLowerCase().includes(v)); });
  /* secret */
  $$("[data-reveal]").forEach(b => b.onclick = () => { const i = document.getElementById(b.dataset.reveal); const show = i.type === "password"; i.type = show ? "text" : "password"; b.setAttribute("aria-label", show ? "Hide token" : "Show token"); b.innerHTML = ic(show ? "eye-off" : "eye"); drawIcons(); });
  const copyText = async (text, el) => { try { await navigator.clipboard.writeText(text); toast("Copied"); } catch (e) { if (el) { el.select?.(); } toast("Selected. Press ⌘C to copy"); } };
  $$("[data-copyfrom]").forEach(b => b.onclick = () => { const i = document.getElementById(b.dataset.copyfrom); copyText(i.value, i); });
  $$("[data-copy]").forEach(b => b.onclick = () => copyText(b.dataset.copy));
  /* key-value */
  const kvWire = () => $$("[data-kvdel]").forEach(b => b.onclick = () => b.closest(".kv-row").remove());
  kvWire();
  $("#kvAdd")?.addEventListener("click", e => { const n = $$("#kv1 .kv-row").length + 1; e.currentTarget.insertAdjacentHTML("beforebegin", `<div class="kv-row"><input class="input" aria-label="Name ${n}" placeholder="NAME"><input class="input" aria-label="Value ${n}" placeholder="value"><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove variable" data-kvdel>${ic("x")}</button></div>`); drawIcons(); kvWire(); $$("#kv1 .kv-row").pop().querySelector("input").focus(); });
  /* markdown */
  const mdT = $("#mdT");
  if (mdT) {
    const cnt = () => $("#mdC").textContent = `${mdT.value.length.toLocaleString("en-US")} / 50,000`; cnt(); mdT.oninput = cnt;
    $$("[data-md]").forEach(b => b.onclick = () => { const t = b.dataset.md, s = mdT.selectionStart, e = mdT.selectionEnd, sel = mdT.value.slice(s, e) || "text";
      const ins = t === "**" || t === "_" || t === "`" ? t + sel + t : t === "[]()" ? `[${sel}](https://)` : "\n" + t + sel;
      mdT.setRangeText(ins, s, e, "end"); mdT.focus(); cnt(); });
    $$("[data-mdmode]").forEach(b => b.onclick = () => { const prev = b.dataset.mdmode === "prev"; $$("[data-mdmode]").forEach(x => x.setAttribute("aria-pressed", x === b)); mdT.hidden = prev; $("#mdP").hidden = !prev; if (prev) $("#mdP").innerHTML = renderMd(mdT.value); });
  }
  /* attachments */
  const drop = $("#drop1"), fileIn = $("#file1");
  const addFiles = files => { [...files].forEach(f => { $("#atts").insertAdjacentHTML("beforeend", `<span class="att">${ic("file-text")}<b>${esc(f.name)}</b><span>${Math.max(1, Math.round(f.size / 1024))} KB</span><button class="btn btn-ghost btn-icon" type="button" aria-label="Remove ${esc(f.name)}" data-attdel>${ic("x")}</button></span>`); }); drawIcons(); wireAtt(); };
  const wireAtt = () => $$("[data-attdel]").forEach(b => b.onclick = () => b.closest(".att").remove());
  wireAtt();
  fileIn?.addEventListener("change", () => addFiles(fileIn.files));
  if (drop) { drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); }; drop.ondragleave = () => drop.classList.remove("over"); drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); addFiles(e.dataTransfer.files); }; }
  /* reactions, harness, map, banner, pager */
  $$("[data-react]").forEach(b => b.onclick = () => { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); const c = b.querySelector("span"); c.textContent = +c.textContent + (on ? 1 : -1); });
  $$("[data-harn]").forEach(b => b.onclick = () => { $$("[data-harn]").forEach(x => x.setAttribute("aria-pressed", x === b)); const [n, l] = b.getAttribute("aria-label").split(": "), sel = b.closest(".demo")?.querySelector(".hsel"); if (sel) { sel.innerHTML = `<b>${esc(n)}</b> ${st(b.querySelector(".hbadge").classList[1], l)}`; } });
  let z = 1; $$("[data-zoom]").forEach(b => b.onclick = () => { z = b.dataset.zoom === "in" ? Math.min(1.6, z + .2) : b.dataset.zoom === "out" ? Math.max(.6, z - .2) : 1; $("#mapIn").style.transform = `scale(${z})`; });
  const map = $("#map1");
  if (map) { const svg = map.querySelector("svg.links"); const draw = () => { const w = map.clientWidth; const pts = [[w * .08 + 90], [w / 2], [w * .92 - 90]]; svg.innerHTML = pts.map(([x]) => `<path d="M${w / 2} 64 V110 H${x} V150" fill="none" stroke="var(--line-strong)" stroke-width="1.25"/>`).join(""); }; draw(); new ResizeObserver(draw).observe(map); }
  $("#banX")?.addEventListener("click", () => { $("#ban1").remove(); toast("Banner dismissed. It won't show again"); });
  let shown = 20; $("#cMore")?.addEventListener("click", e => { shown = Math.min(186, shown + 20); $("#cMoreC").textContent = `Showing ${shown} of 186`; if (shown >= 186) e.currentTarget.disabled = true; });
  $("#cRevoke")?.addEventListener("click", () => dialog("Revoke the credential from 25 Sep 2026?", "Agents using this token lose access to Konteks immediately. You can generate a new credential any time.", "Revoke token", () => toast("Token revoked"), true));
  /* overlays */
  $("#cMenu")?.addEventListener("click", e => menu(e.currentTarget, [{ label: "View changes", icon: "file-diff" }, { label: "Open Engineering session", icon: "message-square" }]));
  $("#cModal")?.addEventListener("click", () => { const d = modal("Create tool", `<div class="field"><label for="cmN">Name <span class="req-m">required</span></label><input id="cmN" class="input mono-in" placeholder="my-tool"></div><div class="field"><label for="cmD">Description</label><textarea id="cmD" class="textarea" rows="3"></textarea></div>`, `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="cmOk" disabled>Create tool</button>`); d.querySelector("#cmN").oninput = e => d.querySelector("#cmOk").disabled = !e.target.value.trim(); d.querySelector("#cmOk").onclick = () => { closeOverlay(); toast("Tool created"); }; });
  $("#cWl")?.addEventListener("click", workLocally);
  $("#cRole")?.addEventListener("click", () => roleDrawer("Engineering Contributor"));
  $("#cCheck")?.addEventListener("click", checkAccess);
  $("#cNotif")?.addEventListener("click", e => notifPopover(e.currentTarget));
  $("#cDrawer")?.addEventListener("click", () => prdDrawer(INITIATIVES[0]));
  $("#cStack")?.addEventListener("click", () => breakdownDrawer(INITIATIVES[0]));
  $("#cDialog")?.addEventListener("click", () => dialog("Decline this proposal?", "The quote is discarded and nothing is charged. TKT-1 stays in the breakdown; you can request a new quote later.", "Decline", () => toast("Proposal declined"), true));
  $("#cType")?.addEventListener("click", () => typeConfirm("Portal Vendor", () => toast("System deleted")));
  $("#cToast")?.addEventListener("click", () => toast("Approved up to 2.15 SP. TKT-1's delivery started on rf-01"));
  comboBind("cb3", MODEL_GROUPS);
  $("#cWs")?.addEventListener("click", e => menu(e.currentTarget, workspaceMenuItems()));
  $("#cAcct")?.addEventListener("click", e => menu(e.currentTarget, accountMenuItems()));
  $("#cNewInit")?.addEventListener("click", () => newInitiative());
  $("#cEditSys2")?.addEventListener("click", () => editSystem("Portal Vendor"));
  $("#cRevoked")?.addEventListener("click", revokedRuntimes);
  $("#cSupport")?.addEventListener("click", supportDialog);
  $("#cNewWs")?.addEventListener("click", createWorkspace);
  $("#cTktMore")?.addEventListener("click", e => menu(e.currentTarget, [{ label: "View changes", icon: "file-diff", run: changesDrawer }, { label: "Open Engineering session", icon: "message-square" }]));
  $("#cReqAcc")?.addEventListener("click", () => requestAccess());
  bindDiffRendered();
}

function bindDiffRendered() {
  $$("[data-rendered]").forEach(b => b.onclick = () => {
    const box = b.closest(".diff"), tbl = box.querySelector("table"), rend = box.querySelector(".diff-rendered");
    const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); b.textContent = on ? "Diff" : "Rendered";
    tbl.hidden = on;
    if (on && !rend) box.insertAdjacentHTML("beforeend", `<div class="diff-rendered md-prev" style="font-family:var(--sans)">${renderMd("# support-api\nRentify Support API is the HTTP API and background worker for customer support operations: tickets, assignments and SLA timers.\n## Architecture and request flow\nA request enters Fastify, passes route-level validation and authentication, then reaches a use case in `core/controller`.\n- `core/api`: routes and validation\n- `core/controller`: use cases")}</div>`);
    else if (rend) rend.hidden = !on;
  });
}
