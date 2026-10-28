/* ---------- Pitch overview (Bahasa Indonesia, for the internal team) ---------- */
const DEMO_PAGES = [
  ["Masuk", [["login", "Sign in with Google"]]],
  ["Kerja", [["work", "Work In Progress"], ["initiative", "Detail inisiatif (estimasi)"], ["session", "Sesi agen TKT-1"], ["activities", "Activities"], ["issues", "Issues"], ["releases", "Releases"], ["leaders", "Leaders"]]],
  ["Customize", [["runtimes", "Runtimes"], ["runtime", "Halaman runtime + update konektor"], ["access", "Access (7 tab)"], ["models", "Models"], ["context", "Context"], ["skills", "Skills"], ["tools", "Tools"], ["mcps", "MCPs"], ["connectors", "Connectors"], ["vcs", "VCS Connectors"], ["operations", "Operations"]]],
  ["Settings & akun", [["general", "General"], ["plan", "Plan"], ["usage", "Usage"], ["budgets", "Budgets"], ["payments", "Payments"]]],
];
function pageOverview() {
  const rows = [
    ["Siapa yang harus bertindak", "Semua kartu berlabel “Needs you”, termasuk milik orang lain.", "Daftar Work In Progress yang sama, dikelompokkan: “Needs you” untuk yang Anda pegang, “Needs someone else” beserta nama orangnya.", "UX-001"],
    ["Persetujuan biaya", "Tombol Approve tampil untuk peran yang tidak punya izin approve.", "Approve hanya untuk yang berwenang, selalu dengan angka biayanya. Peran lain melihat siapa yang bisa menyetujui.", "UX-002, UX-003"],
    ["Mengapa macet", "“Nothing is moving” padahal penyebabnya izin ditolak, tersembunyi di log.", "Kartu menyebut penyebab terakhir dan aksi yang sudah ada di aplikasi.", "UX-005"],
    ["Satu status, satu arti", "“19 connected” padahal 8 tidak terhubung.", "Ringkasan runtime dihitung dari daftar yang sama.", "UX-013, UX-031"],
    ["Bahasa agen", "Istilah internal, handle mesin, token di setiap pesan.", "Ringkasan untuk manusia lebih dulu, nama orang, jejak agen dilipat.", "UX-019"],
    ["Sistem visual", "9 ukuran font, 7 radius, 7 format tanggal, checkbox biru bawaan browser.", "6 ukuran, 3 radius, satu format tanggal, semua kontrol bertema.", "DS-01 s.d. DS-09"],
  ];
  const keep = [
    ["Menu dan urutannya", `<p>Activities, Work In Progress, Issues, Releases, Leaders, Customize, runtime, dan menu akun (Settings, EN/ID, Support, Sign Out).</p><p class="k-note">Runtime di sidebar diringkas jadi satu bar status, lalu komputer Anda dan Work Locally.</p>`],
    ["Alur inisiatif", flowList(["New initiative", "Planning", "PRD", "Breakdown", "Estimasi", "Approve", "Delivery", "Receipt"]) + `<p class="k-note">Tombol PRD, Breakdown, Updates, dan Details tetap di tempatnya.</p>`],
    ["Siklus tiket", flowList(["Estimate", "Quote", "Plan", "Delivery", "Receipt"]) + `<p class="k-note">Termasuk siklus sebelumnya.</p>`],
    ["Customize dan Settings", `<p>Sepuluh bagian Customize, tujuh tab Access, lima tab Settings, dan semua field di setiap form create.</p>`],
    ["Update konektor", `<p>Otomatis dalam 6 jam, atau pemilik menjalankan <code>konteks-remote update</code> di komputernya.</p><p class="k-note">Tidak ada tombol update baru.</p>`],
    ["Masuk", `<p>Dengan Google.</p>`],
  ];
  const grp = g => { const [name, ps] = DEMO_PAGES.find(d => d[0] === g); return `<div class="sm-g"><span class="label">${name}</span><ul>${ps.map(([h, l]) => `<li><a href="#${h}">${l}${ic("arrow-right")}</a></li>`).join("")}</ul></div>`; };
  return `<div class="doc ov"><div class="doc-in">
    <header class="ov-hero">
      <h1>Alur yang sama,<br>kini lebih jelas di setiap layar.</h1>
      <p class="lede">Usulan redesign Konteks untuk tim internal. Fondasinya sudah kuat: palet yang tenang, alur yang dijaga persetujuan, dan bahasa keamanan yang konsisten. Usulan ini mempertahankan setiap halaman, menu, form, langkah, dan aksi, lalu merapikan cara layar menampilkannya.</p>
      <div class="cta-row"><a class="btn btn-primary btn-lg" href="#work">${ic("play")}Buka demo</a><a class="btn btn-lg" href="${AUDIT_PDF}" target="_blank" rel="noopener">${ic("file-text")}Baca hasil audit<span class="cta-meta">PDF</span></a></div>
      ${heroStage()}
    </header>
    <section class="sec">
      <div class="sec-head"><h2>Yang tidak berubah</h2><p>Dicocokkan langsung dengan app.konteks.io secara read-only pada 27 Oktober 2026.</p></div>
      <dl class="keep">${keep.map(([t, b]) => `<div class="k-i"><dt>${t}</dt><dd>${b}</dd></div>`).join("")}</dl>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Yang berubah di tampilan</h2><p>Setiap perubahan menjawab temuan di audit UI/UX 27 Oktober 2026.</p></div>
      <div class="panel scroll-x"><table class="tbl ov-tbl"><colgroup><col style="width:19%"><col style="width:28%"><col><col style="width:15%"></colgroup><thead><tr><th>Area</th><th>Sekarang</th><th>Usulan</th><th>Temuan</th></tr></thead>
      <tbody>${rows.map(r => `<tr><th scope="row">${r[0]}</th><td class="was">${r[1]}</td><td>${r[2]}</td><td class="mono ref">${r[3]}</td></tr>`).join("")}</tbody></table></div>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Semua layar demo</h2><p>Data contoh, alur nyata. Form bisa diisi dan dikirim; tidak ada yang tersimpan. Di detail inisiatif dan sesi agen, tombol <b>As Contributor / As Approver</b> menunjukkan bagaimana izin mengubah apa yang boleh dilakukan; tombol itu hanya untuk demo.</p></div>
      <nav class="panel smap" aria-label="Semua layar demo">
        <div class="sm-c">${grp("Masuk")}${grp("Settings & akun")}</div>
        <div class="sm-c">${grp("Kerja")}</div>
        <div class="sm-c sm-wide">${grp("Customize")}</div>
      </nav>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Prinsip</h2></div>
      <dl class="keep princ">${[["Siapa bertindak, dan mengapa, tampil paling dulu.", "Setiap kartu menyebut penyebab terakhir dan satu aksi."], ["Uang dan kerja agen tidak jalan tanpa keputusan yang terlihat.", "Estimasi selalu menampilkan batas Story Points dan rentang biaya model sebelum Approve."], ["Satu status per objek.", "Tidak ada dua label yang saling bertentangan pada satu kartu, baris, atau ringkasan."], ["Ringkasan manusia lebih dulu, jejak agen bila perlu.", "Transkrip dan log tetap ada, tetapi dilipat."], ["Izin terlihat di tempat keputusan.", "Kontrol yang tidak boleh diubah terlihat terkunci, dengan alasan dan Request access."]].map(([a, b]) => `<div class="k-i"><dt>${a}</dt><dd><p>${b}</p></dd></div>`).join("")}</dl>
    </section>
  </div></div>`;
}

/* Static copy of a demo page for the hero: ids removed so nothing collides with the live page, <main> demoted. */
const shotOf = html => html.replace(/ id="[^"]*"/g, "").replace(/<(\/?)main\b/g, "<$1div");
function heroStage() {
  const layer = (cls, html) => `<div class="ov-shot ${cls}"><div class="ov-shot-in" inert aria-hidden="true">${shotOf(html)}</div></div>`;
  return `<div class="ov-stage">${layer("ov-back ov-b1", pageInitiative())}${layer("ov-back ov-b2", pageRuntimes())}${layer("ov-front", pageWork())}<a class="ov-shot-link" href="#work" tabindex="-1" aria-label="Buka demo: Work In Progress"></a></div>`;
}
function flowList(steps) { return `<ol class="flow">${steps.map((x, i) => `<li><b>${x}</b>${i < steps.length - 1 ? ic("chevron-right") : ""}</li>`).join("")}</ol>`; }
/* The hero preview is the real Work In Progress page, rendered at 1280px and scaled to the column. */
function bindOverview() {
  bindDocs();
  $$(".ov-shot").forEach(box => { const fit = () => box.style.setProperty("--k", box.clientWidth / 1280); fit(); new ResizeObserver(fit).observe(box); });
}

/* ---------- Foundations ---------- */
const TYPE_CANDIDATES = [
  ["plex", "'IBM Plex Sans'", "'IBM Plex Mono'", "Rekomendasi", ["Karakter teknis yang hangat: ujung huruf t, l, dan g dua tingkat memberi suara sendiri tanpa jadi dekoratif.", "Satu keluarga dengan IBM Plex Mono, jadi ID, uang, dan perintah terasa satu suara dengan teks.", "Angka tabular dan glyph bahasa Indonesia lengkap. Sedikit lebih lebar dari Inter, jadi judul baris lebih cepat terpotong di layar sempit."]],
  ["inter", "Inter", "'JetBrains Mono'", "Usulan sebelumnya", ["Paling padat dan netral di 12–13 px, x-height tinggi.", "Aman, tetapi sangat umum di aplikasi kerja; Konteks tidak punya suara sendiri.", "Butuh mono terpisah (JetBrains Mono) yang karakternya berbeda."]],
  ["figtree", "Figtree", "'JetBrains Mono'", "Perubahan terkecil", ["Geometris dan ramah, paling dekat dengan karakter DM Sans, jadi pengguna lama hampir tidak merasa berpindah.", "Lebih jelas dari DM Sans di ukuran kecil berkat x-height yang lebih tinggi.", "Kurang terasa teknis; butuh mono terpisah."]],
  ["geist", "Geist", "'Geist Mono'", "", ["Tajam dan Swiss, dengan mono sekeluarga.", "Sangat mirip alat developer populer saat ini, sehingga Konteks terlihat seperti produk lain.", "Terasa dingin di atas palet matcha yang hangat."]],
  ["dmsans", "'DM Sans'", "'JetBrains Mono'", "Aplikasi sekarang", ["Referensi. Huruf yang dipakai app.konteks.io hari ini.", "Geometris rendah kontras; di 12 px huruf a, e, dan s mulai menyatu.", "Audit menemukan sembilan ukuran dipakai; masalahnya ada di skala, bukan hurufnya."]],
];
function pageFoundations() {
  const colors = [
    ["Ground", "--bg", "#FAF8EF", "Latar halaman"], ["Surface", "--surface", "#FFFFFF", "Panel, kartu, tabel"], ["Sidebar", "--sidebar", "#F1F1E5", "Lapisan navigasi"],
    ["Ink", "--ink", "#243025", "Teks utama"], ["Ink 2", "--ink-2", "#4D644F", "Teks pendukung · 6,1:1"], ["Ink 3", "--ink-3", "#5E705E", "Meta, label · 5,0:1"],
    ["Line", "--line", "#E5E7D9", "Garis pemisah"], ["Accent", "--accent", "#4F7044", "Aksi utama, seleksi"], ["Accent strong", "--accent-strong", "#5F8D4E", "Fokus, progres"],
    ["Accent fill", "--accent-fill", "#8FBF6A", "Data, grafik"], ["Accent soft", "--accent-soft", "#EEF3E6", "Latar terpilih"], ["Warning", "--warn", "#9A6212", "Tertahan, perlu perhatian"],
    ["Danger", "--danger", "#B3261E", "Gagal, diblokir, hapus"], ["Info", "--info", "#2F6F8F", "Berjalan, pembaruan"],
  ];
  return `<div class="doc"><div class="doc-in">
    <header><h1>Design system Konteks</h1><p class="lede">Warna dasar tetap hijau matcha yang sudah dikenal. Yang baru adalah disiplinnya: setiap warna, ukuran, dan jarak punya satu peran, dan tidak ada nilai di luar token.</p>
    <nav class="toc" aria-label="Isi" style="margin-top:20px">${[["f0", "Warna"], ["f1", "Tipografi"], ["ftype", "Pilihan huruf"], ["f2", "Jarak & radius"], ["f3", "Kedalaman"], ["f4", "Ikon & status"], ["f5", "Gerak"], ["f6", "Bahasa"], ["f7", "Format"]].map(([id, l]) => `<a href="#foundations" data-jump="${id}">${l}</a>`).join("")}</nav></header>

    <section class="sec" id="f0"><div class="sec-head"><h2>Warna</h2><p>Strategi restrained: latar netral hangat, satu aksen hijau untuk aksi dan seleksi, serta warna status hanya bila ada artinya. Setiap token punya padanan mode gelap.</p></div>
      <div class="swatches">${colors.map(([n, t, h, u]) => `<div class="sw"><div class="sw-chip" style="background:var(${t})"></div><div class="sw-body"><b>${n}</b><span class="mono">${t} · ${h}</span><span>${u}</span></div></div>`).join("")}</div>
      <div class="dodont"><div class="panel dd do"><span class="label">${ic("check")}Lakukan</span><p>Pakai Accent hanya untuk satu aksi utama per area dan untuk item terpilih.</p></div><div class="panel dd dont"><span class="label">${ic("x")}Hindari</span><p>Merah untuk status yang sebenarnya normal, misalnya “plan siap”. Merah berarti gagal atau diblokir.</p></div><div class="panel dd dont"><span class="label">${ic("x")}Hindari</span><p>Memberi warna pada System atau orang. Warna dipakai hanya untuk state; System ditulis dengan ikon dan nama.</p></div></div>
    </section>

    <section class="sec" id="f1"><div class="sec-head"><h2>Tipografi</h2><p>Inter untuk seluruh UI dengan angka tabular (menggantikan DM Sans di aplikasi sekarang), JetBrains Mono hanya untuk ID, uang, kode, perintah, dan isi berkas yang diedit sebagai sumber (Markdown skill, YAML context). Versi dan teks biasa tetap Inter. Enam ukuran (12, 13, 14, 16, 20, 28), tidak lebih, dan satu halaman aplikasi memakai paling banyak lima. Isi tetap 13–14 px demi kepadatan.</p></div>
      <div class="panel specimen">
        ${[["28 · Semibold", "font-size:28px;font-weight:600;letter-spacing:-.022em", "Judul pitch dan dokumen"], ["20 · Semibold", "font-size:20px;font-weight:600;letter-spacing:-.015em", "Judul halaman detail"], ["16 · Semibold", "font-size:16px;font-weight:600", "Judul kartu keputusan"], ["14 · Regular", "font-size:14px", "Teks isi dan judul baris"], ["13 · Medium", "font-size:13px;font-weight:500", "Kontrol, tab, tabel"], ["12 · Regular", "font-size:12px;color:var(--ink-3)", "Meta, petunjuk, waktu"], ["Mono 13 / 12", "font-family:var(--mono);font-size:13px", "TKT-1 · 2.15 SP · $0.57"]].map(([l, s, t]) => `<div class="typeline"><span class="label">${l}</span><span style="${s}">${t}</span></div>`).join("")}
      </div>
    </section>

    <section class="sec" id="ftype"><div class="sec-head"><h2>Pilihan huruf</h2><p>Lima kandidat, ditulis dengan potongan UI yang sama. Pakai tombol huruf di bilah atas untuk mengganti huruf di seluruh prototipe dan membandingkannya di layar sungguhan. Skala enam ukuran tidak berubah; yang berganti hanya token <code>--sans</code> (dan <code>--mono</code> untuk keluarga yang punya mono sendiri).</p></div>
      <div class="fspec">${TYPE_CANDIDATES.map(([k, fam, mono, verdict, notes]) => `<article class="panel fs-c ${S.font === k ? "on" : ""}" style="--fs:${fam};--fm:${mono}">
        <div class="fs-h"><b>${FONTS.find(f => f[0] === k)[1]}</b>${verdict ? `<span class="tag">${verdict}</span>` : ""}<button class="btn btn-sm" type="button" data-font="${k}" ${S.font === k ? "disabled" : ""}>${S.font === k ? "Dipakai" : "Coba"}</button></div>
        <div class="fs-s">
          <p class="fs-t">Refresh the Support API README</p>
          <p class="fs-b">TKT-1's estimate is ready: up to <span class="fs-m">2.15 SP</span>. Nothing runs until it is approved.</p>
          <p class="fs-l">rf-01 · Not accepting work · 27 Oct 2026, 14.34 · Rp 960.000</p>
          <p class="fs-n">Agen memperbarui README di rentify/support-api.</p>
        </div>
        <ul class="fs-notes">${notes.map(n => `<li>${n}</li>`).join("")}</ul></article>`).join("")}</div>
    </section>

    <section class="sec" id="f2"><div class="sec-head"><h2>Jarak & radius</h2><p>Skala 4 px. Radius tiga, mengikuti ukuran benda: 4 px untuk yang kecil (tag, hitungan, kbd), 6 px untuk kontrol, 10 px untuk panel. Bulat penuh hanya untuk avatar, titik status, dan track switch.</p></div>
      <div class="panel specimen"><div class="scale">${[4, 8, 12, 16, 24, 32, 48].map(v => `<div style="width:${v}px;height:${v}px" title="${v}px"></div>`).join("")}</div>
      <div class="specimen-row"><span class="label">4 · 8 · 12 · 16 · 24 · 32 · 48</span></div>
      <div class="specimen-row"><div style="width:48px;height:24px;border:1px solid var(--line-strong);border-radius:var(--r4);display:grid;place-items:center" class="label">4 px</div><div style="width:72px;height:40px;border:1px solid var(--line-strong);border-radius:var(--r6);display:grid;place-items:center" class="label">6 px</div><div style="width:120px;height:64px;border:1px solid var(--line-strong);border-radius:var(--r10);display:grid;place-items:center" class="label">10 px</div><span class="av">AY</span><span class="st st-ok"><span class="dot"></span>bulat penuh</span></div></div>
    </section>

    <section class="sec" id="f3"><div class="sec-head"><h2>Kedalaman</h2><p>Tiga tingkat bayangan. Garis 1 px memisahkan; bayangan hanya untuk benda yang melayang.</p></div>
      <div class="specimen-row">${[["Shadow 1", "Tombol, item terpilih", "--shadow-1"], ["Shadow 2", "Menu, popover", "--shadow-2"], ["Shadow 3", "Drawer, dialog, toast", "--shadow-3"]].map(([a, b, c]) => `<div style="flex:1 1 200px;padding:16px;background:var(--surface);border-radius:10px;box-shadow:var(${c});display:grid;gap:4px"><b style="font-weight:500;font-size:13px">${a}</b><span class="hint">${b}</span></div>`).join("")}</div>
    </section>

    <section class="sec" id="f4"><div class="sec-head"><h2>Ikon & status</h2><p>Satu set ikon (Lucide, garis 1,75) di 16 px untuk navigasi dan 14 px di dalam teks. Glyph tahap digambar khusus: lingkaran yang terisi seiring proses. Warnanya mengikuti siapa yang ditunggu, dan selalu didampingi teks.</p></div>
      <div class="panel specimen"><div class="specimen-row" style="gap:20px">${[["Planning", "waiting", "Planning · menunggu"], ["Planning", "decision", "Planning · perlu keputusan"], ["Executing", "decision", "Executing · perlu keputusan"], ["Executing", "running", "Executing · agen bekerja"], ["Planning", "blocked", "Diblokir"], ["Done", "done", "Selesai"]].map(([s, t, l]) => `<span style="display:inline-flex;gap:8px;align-items:center;font-size:13px">${sg(s, t)}${l}</span>`).join("")}</div>
      <div class="specimen-row">${st("ok", "Ready")}${st("warn", "Not accepting work")}${st("danger", "Failed")}${st("info", "Delivering")}${st("muted", "Not connected")}</div></div>
    </section>

    <section class="sec" id="f5"><div class="sec-head"><h2>Gerak</h2><p>150–250 ms dengan ease-out eksponensial. Gerak hanya menyampaikan perubahan state: drawer masuk dari kanan, toast naik, tombol berubah menjadi “Approving”. Tidak ada animasi saat halaman dimuat. Mode reduced-motion dihormati.</p></div></section>

    <section class="sec" id="f6"><div class="sec-head"><h2>Bahasa</h2><p>Tulis dari sisi pengguna. Tombol menyebut aksinya; pesan error menyebut masalah dan cara memperbaikinya.</p></div>
      <div class="dodont">
        ${[["Approve · 2.15 SP", "Proceed"], ["Plan could not be saved: you don't have Plan Save in SensePortal", "access_denied"], ["Maya Lestari approved this delivery", "mlestari-20260811-53ad94 approved this delivery"], ["10 registered · 6 ready · 3 not connected", "19 connected"]].map(([g, b]) => `<div class="panel dd do"><span class="label">${ic("check")}Tulis</span><p>${esc(g)}</p></div><div class="panel dd dont"><span class="label">${ic("x")}Bukan</span><p class="mono" style="font-size:12px">${esc(b)}</p></div>`).join("")}
      </div>
    </section>

    <section class="sec" id="f7"><div class="sec-head"><h2>Format</h2><p>Satu formatter untuk setiap jenis nilai, dipakai di semua halaman.</p></div>
      <div class="panel scroll-x"><table class="tbl"><thead><tr><th>Nilai</th><th>Format</th><th>Contoh</th></tr></thead><tbody>
        ${[["Tanggal & waktu", "Tanggal bulan tahun, jam 24", "27 Oct 2026, 12.53"], ["Hari ini", "Jam saja; tanggal di tooltip", "13.28"], ["Lama menunggu", "Satuan terbesar dua tingkat", "3d 20h · 18m"], ["Story Points", "Dua desimal, satuan SP", "2.15 SP · 1,009,902.16 SP"], ["Rupiah", "Format id-ID, tanpa desimal, di mana pun", "Rp 960.000"], ["Biaya model", "Dolar, rentang", "$0.57 – $2.02"], ["ID", "Mono, huruf besar", "TKT-1"]].map(r => `<tr>${r.map((c, i) => `<td ${i === 2 ? 'class="mono" style="font-size:12px"' : ""}>${c}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>
    </section>
  </div></div>`;
}

/* ---------- Component catalog ---------- */
function demoBlock(id, title, desc, inner) {
  return `<section class="panel" id="${id}"><div class="demo-head"><div style="display:grid;gap:4px"><h3>${title}</h3><p>${desc}</p></div><button class="btn btn-sm" type="button" data-code="${id}" aria-expanded="false" aria-controls="code-${id}">${ic("code")}Kode</button></div><div class="demo">${inner}</div><div class="codeview" id="code-${id}" hidden></div></section>`;
}
/* Code view: the specimen's markup as written (icons as <i data-lucide>), plus every CSS rule that styles its classes,
   read from the live stylesheet so it can never drift from what renders. */
function prettyHtml(src) {
  const out = []; let depth = 0;
  src.replace(/>\s+</g, "><").split(/(?=<)|(?<=>)/).forEach(tok => {
    if (!tok.trim()) return;
    if (/^<\//.test(tok)) depth = Math.max(0, depth - 1);
    out.push("  ".repeat(depth) + tok.trim());
    if (/^<[a-z][^>]*[^/]>$/i.test(tok) && !/^<(i|input|br|hr|img|meta|link)\b/i.test(tok) && !/<\/.+>$/.test(tok)) depth++;
  });
  return out.join("\n").replace(/\n\s*(<\/(i|b|span|small|code|label|button|a|option|time|h[1-6]|p|li|td|th)>)/g, "$1").replace(/(<(b|span|small|code|button|a|option|time|h[1-6]|p|li|td|th)[^>]*>)\n\s*([^<\n]+)/g, "$1$3");
}
function cssFor(html) {
  const cls = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean));
  const rules = [];
  for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
    const hit = sel => sel && [...cls].some(c => new RegExp("\\." + c.replace(/[-]/g, "\\-") + "(?![\\w-])").test(sel));
    for (const r of rs) {
      if (hit(r.selectorText)) rules.push(r.cssText);
      else if (r.media && r.cssRules) { const inner = [...r.cssRules].filter(x => hit(x.selectorText)).map(x => "  " + x.cssText); if (inner.length) rules.push("@media " + r.media.mediaText + " {\n" + inner.join("\n") + "\n}"); }
    } }
  return rules.join("\n").replace(/; /g, ";\n  ").replace(/\{ /g, "{\n  ").replace(/ \}/g, "\n}");
}
function bindCodeViews() {
  $$("[data-code]").forEach(b => b.onclick = () => {
    const id = b.dataset.code, box = document.getElementById("code-" + id), open = box.hidden;
    box.hidden = !open; b.setAttribute("aria-expanded", open);
    if (open && !box.dataset.ready) {
      const html = prettyHtml(SPEC_SRC[id] || ""), css = cssFor(SPEC_SRC[id] || "");
      box.innerHTML = `<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true" data-cv="html">HTML</button><button class="tab" role="tab" aria-selected="false" data-cv="css">CSS · ${css.split("\n}").length - 1} rules</button></div>
        <div class="code"><div class="code-h"><span data-cvl>Markup · icons are Lucide <code>&lt;i data-lucide&gt;</code></span><button class="btn btn-ghost btn-sm" type="button" data-cvcopy>${ic("copy")}Copy</button></div><pre data-cvpre>${esc(html)}</pre></div>`;
      box.dataset.ready = 1; drawIcons();
      const pre = box.querySelector("[data-cvpre]");
      $$("[data-cv]", box).forEach(t => t.onclick = () => { $$("[data-cv]", box).forEach(x => x.setAttribute("aria-selected", x === t)); const isCss = t.dataset.cv === "css"; pre.textContent = isCss ? css : html; box.querySelector("[data-cvl]").innerHTML = isCss ? "Rules from components.css that style these classes, including responsive ones" : "Markup · icons are Lucide <code>&lt;i data-lucide&gt;</code>"; });
      box.querySelector("[data-cvcopy]").onclick = () => copyText(pre.textContent, pre);
    }
  });
}
function bindDocs() {
  $$("[data-font]").forEach(b => b.onclick = () => setFont(b.dataset.font));
  bindCodeViews();
  $$("[data-jump]").forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#wrapT")?.addEventListener("click", e => { const on = $("#diff").classList.toggle("wrap"); e.currentTarget.textContent = on ? "No wrap" : "Wrap lines"; });
}
