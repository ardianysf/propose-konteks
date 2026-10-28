/* ---------- Kode: what developers take from this pitch ---------- */
const CODE_LIST = [
  ["tokens.css", "Token warna, tipe, jarak, radius, bayangan, gerak. Terang dan gelap (kelas .dark).", "css"],
  ["tokens.live-map.css", "Jembatan ke aplikasi sekarang: mengisi --kx-* dan --color-app-* dari token baru, jadi kelas Tailwind app-* langsung ikut.", "css"],
  ["tailwind.preset.js", "Preset Tailwind: nama warna app-* tetap, skala tipe 6 langkah, radius 3 langkah, bayangan.", "js"],
  ["components.scoped.css", "Semua komponen di katalog, dibatasi di bawah kelas .kx. Aman dimuat di samping Backstage.", "css"],
  ["README.md", "Cara memakai paket ini di aplikasi Backstage + Tailwind yang ada, langkah demi langkah.", "md"],
  ["inventory.csv", "Setiap elemen aplikasi dan temuan audit, masing-masing dengan komponen dan layar demonya.", "csv"],
  ["AGENTS.md", "Aturan untuk coding agent yang menerapkan redesign di repo live: sumber acuan, urutan kerja, aturan, definisi selesai per PR.", "md"],
];
/* Inside a Claude artifact, files go through the downloads capability; on an ordinary website (e.g. Vercel)
   the browser saves them directly from a blob link. */
const plainSave = (blob, filename) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
const saver = async () => window.claude?.use ? await window.claude.use("downloads") : { save: async ({ filename, data }) => plainSave(data, filename) };
const ZIP_FILES = ["tokens.css", "tokens.live-map.css", "tailwind.preset.js", "components.scoped.css", "components.css", "README.md", "inventory.csv", "AGENTS.md", ".stylelintrc.json"];
async function saveZip(btn) {
  const dl = await saver().catch(() => null);
  if (!dl) return toast("Unduhan tidak tersedia di tampilan ini. Salin isinya dari panel di bawah", "err");
  btn.disabled = true; const label = btn.innerHTML; btn.innerHTML = `<span class="spin"></span>Menyiapkan zip`;
  try {
    if (!window.JSZip) await new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; sc.onload = ok; sc.onerror = no; document.head.append(sc); });
    const zip = new JSZip(), dir = zip.folder("konteks-ui");
    for (const f of ZIP_FILES) dir.file(f, CODE_FILES[f] || await (await fetch("code/" + f)).text());
    await dl.save({ filename: "konteks-ui.zip", data: await zip.generateAsync({ type: "blob" }) });
  } catch (e) { if (e?.code !== "declined") toast(e?.code === "rate_limited" ? "Satu unduhan masih menunggu konfirmasi" : "Zip tidak bisa disiapkan", "err"); }
  btn.disabled = false; btn.innerHTML = label;
}
async function saveFile(path, filename) {
  try {
    const dl = await saver().catch(() => null);
    if (!dl) return toast("Unduhan tidak tersedia di tampilan ini. Salin isinya dari panel di bawah", "err");
    const blob = await (await fetch(path)).blob();
    await dl.save({ filename, data: blob });
  } catch (e) { if (e?.code !== "declined") toast(e?.code === "rate_limited" ? "Satu unduhan masih menunggu konfirmasi" : "Berkas tidak bisa disiapkan", "err"); }
}
function pageCode() {
  const t = S.codeTab || "tokens.css";
  return `<div class="doc"><div class="doc-in">
    <header><h1>Kode untuk tim pengembang</h1><p class="lede">Semua yang terlihat di pitch ini bisa dibaca sebagai kode. Aplikasi sekarang dibangun di atas Backstage dengan kelas Tailwind <code>app-*</code>, jadi paket ini dirancang untuk masuk tanpa menulis ulang komponen: ganti token dulu, lalu rapikan komponen satu per satu.</p></header>
    <section class="sec"><div class="sec-head"><h2>Isi paket</h2><p>Zip berisi semua berkas di bawah. Sumber prototipe dan spesifikasi paritas ada di paket lengkap yang dikirim di percakapan. Inventaris berisi ${INVENTORY.length} baris.</p></div>
      <div><button class="btn btn-primary" type="button" id="dlZip">${ic("download")}Unduh paket (.zip)</button></div>
      <div class="card res">${CODE_LIST.map(([n, d, k]) => `<div class="res-item">${ic(k === "js" ? "file-code-2" : k === "csv" ? "sheet" : k === "md" ? "file-text" : "file-code", "os")}<div><div class="ttl"><span class="mono">${n}</span></div><div class="meta"><span>${d}</span></div></div>${k === "md" || k === "csv" ? `<button class="btn btn-sm" type="button" data-dl="code/${n}" data-fn="${n}">${ic("download")}Unduh</button>` : `<button class="btn btn-sm" type="button" data-view="${n}">${ic("eye")}Lihat</button>`}</div>`).join("")}</div></section>
    <section class="sec"><div class="sec-head"><h2>Langkah adopsi</h2></div>
      <ol class="steps">
        <li><b>Muat token dan jembatannya</b><p>Tambahkan <code>tokens.css</code> lalu <code>tokens.live-map.css</code> setelah stylesheet aplikasi. Warna, garis, dan radius di semua halaman langsung berganti tanpa mengubah markup.</p>${cmd('@import "./konteks-ui/tokens.css";\n@import "./konteks-ui/tokens.live-map.css";', "Copy import")}</li>
        <li><b>Pasang preset Tailwind</b><p>Skala tipe dan radius lama otomatis jatuh ke 7 ukuran dan 3 radius. Nilai arbitrer dalam kurung siku (misalnya teks 10 px) adalah satu-satunya yang perlu diganti tangan.</p>${cmd('presets: [require("./konteks-ui/tailwind.preset.js")]', "Copy preset line")}</li>
        <li><b>Ganti font ke Inter</b><p>Inter 400/500/600/700 dan JetBrains Mono 400/500, tanpa stylistic set. Angka tabular hanya di elemen angka, bukan di <code>body</code>.</p></li>
        <li><b>Rapikan komponen per halaman</b><p>Muat <code>components.scoped.css</code> dan pasang <code>class="kx"</code> di akar halaman yang dimigrasi serta di host portal. Pakai Katalog sebagai acuan: tombol <b>Kode</b> di setiap komponen menampilkan markup dan aturan CSS-nya. Urutan yang disarankan ada di README.</p></li>
      </ol></section>
    <section class="sec"><div class="sec-head"><h2>Token baru dan padanannya di aplikasi</h2><p>Kolom terakhir adalah nilai yang dipakai aplikasi sekarang. Sebagian besar sama; yang berbeda adalah sidebar, garis, dan teks tersier.</p></div>
      <div class="panel scroll-x"><table class="tbl" style="min-width:860px"><thead><tr><th>Token</th><th>Terang</th><th>Gelap</th><th>Variabel aplikasi yang diisi</th><th>Nilai sekarang</th></tr></thead><tbody>
        ${TOKEN_ROWS.map(([n, l, d, live, now]) => `<tr><td class="mono">--${n}</td><td><span class="swt" style="background:${l}"></span><span class="mono">${l}</span></td><td><span class="swt" style="background:${d}"></span><span class="mono">${d}</span></td><td class="mono" style="color:var(--ink-2)">${live}</td><td class="mono" style="color:${now.toUpperCase() === l.toUpperCase() ? "var(--ink-3)" : "var(--ink)"}">${now}${now !== "—" && now.toUpperCase() !== l.toUpperCase() ? " · berubah" : ""}</td></tr>`).join("")}
      </tbody></table></div></section>
    <section class="sec" id="cfSec"><div class="sec-head"><h2>Baca berkasnya</h2></div>
      <div class="tabs" role="tablist" aria-label="Berkas">${Object.keys(CODE_FILES).map(k => `<button class="tab" role="tab" data-cf="${k}" aria-selected="${t === k}">${k}</button>`).join("")}</div>
      <div class="code"><div class="code-h"><span class="mono">${t}</span><button class="btn btn-ghost btn-sm" type="button" id="cfCopy">${ic("copy")}Copy</button></div><pre id="cfPre" style="max-height:520px">${esc(CODE_FILES[t])}</pre></div></section>
  </div></div>`;
}
function bindCode() {
  bindCopy();
  $$("[data-cf]").forEach(b => b.onclick = () => { S.codeTab = b.dataset.cf; render(); });
  $$("[data-view]").forEach(b => b.onclick = () => { S.codeTab = b.dataset.view; render(); requestAnimationFrame(() => document.getElementById("cfSec")?.scrollIntoView({ block: "start" })); });
  $$("[data-dl]").forEach(b => b.onclick = () => saveFile(b.dataset.dl, b.dataset.fn));
  $("#dlZip")?.addEventListener("click", e => saveZip(e.currentTarget));
  $("#cfCopy")?.addEventListener("click", () => copyText($("#cfPre").textContent, $("#cfPre")));
}
