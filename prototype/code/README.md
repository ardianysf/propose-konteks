# Konteks UI: paket rilis tampilan

Paket ini berisi design system dan komponen hasil redesign Konteks, dalam bentuk yang bisa langsung dipakai di aplikasi yang sekarang berjalan (Backstage dengan kelas Tailwind `app-*`).

Prosesnya tidak berubah. Halaman, menu, form, langkah, dan aksinya sama dengan app.konteks.io per 27 Oktober 2026; yang berubah hanya tampilannya. Daftar paritasnya ada di `parity/LIVE_PARITY.md`.

## Isi

Paket lengkap `konteks-ui-lengkap.zip` (tombol utama di halaman Kode) berisi semua berkas di tabel ini. Tombol "Kode saja" memberi berkas kode di folder utama tanpa dokumen dan prototipe.

| Berkas | Untuk apa |
|---|---|
| `tokens.css` | Token warna (terang dan `.dark`), 6 ukuran tipe (12–28 px), jarak 4 px, radius 4/6/10, 3 bayangan, easing. |
| `tokens.live-map.css` | Jembatan ke aplikasi sekarang. Mengisi `--kx-*` dan `--color-app-*` (format triplet RGB) dari token baru. |
| `tailwind.preset.js` | Preset Tailwind: nama warna `app-*` tetap; skala tipe dan radius lama jatuh ke langkah baru. |
| `components.scoped.css` | Semua komponen di katalog, dibatasi di bawah kelas `.kx`. Ini versi yang dipakai di aplikasi: tidak menyentuh apa pun di luar `.kx`. |
| `components.css` | Stylesheet yang sama tanpa batasan, seperti yang dipakai prototipe. Hanya untuk dibaca; jangan dimuat di Backstage. |
| `inventory.csv` | Setiap elemen aplikasi dan temuan audit, dengan komponen dan layar demonya. |
| `AGENTS.md` | Aturan untuk coding agent (Claude Code, Codex, Cursor) yang menerapkan redesign ini di repo live: sumber acuan, urutan kerja, aturan yang mudah dilanggar, dan definisi selesai per PR. |
| `.stylelintrc.json` | Lint warna: hex, rgb/hsl, dan color-mix hanya boleh ada di `tokens.css`. |
| `DESIGN.md` | Spesifikasi design system: token, tipe, komponen, pola overlay, gerak, suara, dan keputusan, beserta alasannya. |
| `PRODUCT.md` | Pengguna, tujuan produk, dan prinsip yang dipakai untuk keputusan desain. |
| `AUDIT-STATUS.md` | Status setiap temuan audit beserta bukti dan kriteria penerimaannya. |
| `parity/LIVE_PARITY.md` | Spesifikasi alur aplikasi live yang dipakai sebagai acuan, termasuk token yang dibaca dari stylesheet live. |
| `docs/konteks-audit-ui-ux.pdf` | Audit UI/UX app.konteks.io (27 Oktober 2026). Versi Markdown: `docs/audit-ui-ux.md`. |
| `docs/overlays.md` | Keputusan modal, drawer, dialog, dan popover. |
| `prototype/` | Prototipe dalam satu berkas (`index.html`) dan sumbernya: `src/*.js`, `src/*.css`, `tools/`, `build.sh`. |

## Langkah adopsi

Urutannya disusun supaya setiap langkah bisa dirilis sendiri. Langkah 1 sampai 3 hanya mengganti nilai visual; langkah 4 menyentuh markup halaman demi halaman, tanpa mengubah alur atau API.

### 1. Token (satu PR, dampak ke semua halaman)

```css
@import "./konteks-ui/tokens.css";
@import "./konteks-ui/tokens.live-map.css";
```

Muat setelah stylesheet aplikasi. Karena komponen sekarang membaca `--kx-*` dan `rgb(var(--color-app-*))`, palet, garis, dan radius berganti tanpa menyentuh komponen. Nama variabel dan nilai "sebelum" di bawah dibaca langsung dari stylesheet app.konteks.io pada 27 Oktober 2026 (daftarnya ada di `parity/LIVE_PARITY.md`, bagian Live tokens). `--color-app-accent` di aplikasi memang hijau pucat (229 236 218), jadi dipetakan ke `accent-tint`.

Perubahan nilai yang terlihat:
- `sidebar`: dari putih menjadi `#F1F1E5`.
- `line`: dari `#E2E9D5` menjadi `#E5E7D9`.
- `ink-3`: dari `#607260` menjadi `#5E705E`.
- `accent-soft`: dari `#F4F8EE` menjadi `#EEF3E6`.
- `accent-ink`: dari `#4F7044` menjadi `#3F5C36`.
- `--kx-radius-main`: dari 19,5 px menjadi 10 px.

Warna dasar lainnya tetap.

Tema gelap mengikuti kelas `.dark` yang sudah dipasang aplikasi. `tokens.css` sengaja tidak memakai media query `prefers-color-scheme`, karena pilihan System, Light, atau Dark di Settings sudah memasang kelas itu.

### 2. Preset Tailwind

```js
// tailwind.config.js
module.exports = { presets: [require("./konteks-ui/tailwind.preset.js")], content: [/* … */] };
```

Pemetaan ukuran:

| Kelas Tailwind | Ukuran |
|---|---|
| `text-2xs` | 11 |
| `text-xs` | 12 |
| `text-sm` | 13 |
| `text-base` | 14 |
| `text-lg` | 16 |
| `text-xl` | 20 |
| `text-3xl` | 28 |

- `rounded-xl/2xl/3xl` menjadi 10 px.
- `rounded` menjadi 6 px.
- `rounded-sm` menjadi 4 px.

Cari dan ganti nilai arbitrer dalam kurung siku (ukuran teks 10 dan 15 px, radius 19,5 px), dan warna bawaan Tailwind seperti `green-700` di badge Built-in (DS-03). Itu satu-satunya bagian yang perlu diubah tangan.

### 3. Font

Inter 400/500/600/700 dan JetBrains Mono 400/500, tanpa stylistic set. Mono hanya untuk ID, uang dan SP, perintah, kode, diff, dan isi berkas yang diedit sebagai sumber (editor Markdown skill, YAML context); versi dan teks biasa tetap Inter. Angka tabular (`font-variant-numeric: tabular-nums`) hanya di elemen angka: hitungan, tabel, ringkasan, estimasi. Jangan pasang di `body`, karena membuat tanda hubung Inter selebar angka ("rf-01" terbaca "rf - 01"). Inter menggantikan DM Sans. Mono hanya untuk ID, angka uang dan SP, perintah, kode, dan diff (DS-11).

### 4. Komponen, per halaman

Muat `components.scoped.css`, lalu pasang `class="kx"` di elemen akar halaman yang sedang dimigrasi dan di elemen host portal (drawer, dialog, menu, toast). Halaman yang belum dimigrasi tidak terpengaruh. Nama keyframe juga diberi awalan `kx-` supaya tidak bentrok.

Pakai katalog di prototipe sebagai acuan. Tombol **Kode** di setiap komponen menampilkan markup dan semua aturan CSS yang dipakainya, dibaca langsung dari stylesheet. Urutan yang disarankan mengikuti roadmap audit:

1. Kepercayaan
   - Kartu perhatian satu komponen dengan tiga varian (`.dc.decision`, `.dc.blocked`, `.dc.waiting`). Approve hanya untuk yang berwenang, dan aksi berbiaya selalu menampilkan angkanya (UX-001 s.d. UX-006).
   - Satu status per objek, dan ringkasan dihitung dari daftar (UX-013, UX-031).
   - Tidak ada kode error mentah (`.state.locked`, UX-039).
2. Konsistensi
   - Satu modal untuk semua form create (`.dialog.modal`, footer Cancel lalu tombol primer).
   - Satu gaya tab (`.tabs`/`.tab`).
   - Satu pola read-only (`.lockrow` dengan Request access).
   - Kontrol bertema (`accent-color`).
3. Bahasa
   - Ringkasan manusia di transkrip, sedangkan jejak agen dilipat (`.summary`, `.trace`).
   - Nama tampilan, bukan handle mesin.
   - Satu format tanggal (`27 Oct 2026, 12.53`), uang (`Rp 960.000`), dan SP (dua desimal).
4. Navigasi dan aksesibilitas
   - Item navigasi berupa `<a href>` dengan `aria-current`.
   - Skip link, judul dokumen per halaman, dan 404 untuk rute tak dikenal.
   - Filter System sebagai combobox.
   - Tooltip di semua ikon rail.

## Nama kelas utama

| Kelompok | Kelas |
|---|---|
| Shell | `.app`, `.app.railed`, `.side`, `.side-top`, `.nav`, `.rt-nav`, `.rt-dot`, `.side-foot`, `.me`, `.tabbar`, `.skip` |
| Header | `.pagehead`, `.phead`, `.ph-t`, `.ph-a`, `.back`, `.crumbs`, `.top` |
| Aksi | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-lg`, `.btn-icon`, `.btn .cost` |
| Form | `.field`, `.flabel`, `.hint`, `.err`, `.input`, `.select`, `.textarea`, `.check`, `.switch`, `.optcard`, `.fs`, `.seg`, `.combo`, `.pop`, `.opt`, `.msel`, `.kv`, `.md`, `.secret`, `.ro`, `.req-m` |
| Data | `.st` (`-ok`, `-warn`, `-danger`, `-info`, `-muted`), `.tag`, `.count`, `.av`, `.dtable`, `.tablewrap`, `.summary-strip`, `.ss`, `.props`, `.prop`, `.matrix`, `.clist`, `.citem`, `.res`, `.res-item` |
| Khas Konteks | `.row`, `.row-why`, `.sg`, `.dc`, `.quote`, `.qrow`, `.gate`, `.stepper`, `.step`, `.cycle`, `.log`, `.log-e`, `.thread`, `.cmt`, `.compose`, `.msg-user`, `.msg-agent`, `.summary`, `.trace`, `.evline`, `.run`, `.canvas`, `.mnode`, `.harnsel`, `.diff`, `.tkt` |
| Lapisan | `.scrim`, `.drawer`, `.dialog`, `.dialog.modal`, `.menu`, `.floatpop`, `.toast`, `.callout`, `.banner`, `.state`, `.lockrow`, `.empty`, `.sk`, `.notfound`, `.disc`, `.inline-disc` |

## Membangun ulang prototipe

```sh
cd prototype && sh build.sh   # menjalankan tools/make_package.py, lalu menyusun index.html
```

`tools/make_package.py` membuat ulang `tokens.css`, `tokens.live-map.css`, `tailwind.preset.js`, `components.css`, `components.scoped.css`, dan `inventory.csv` dari `src/`. README ini ditulis tangan. Jangan sunting berkas hasilnya secara langsung.

## Yang perlu diputuskan tim

- **Font.** Inter menggantikan DM Sans. Kalau DM Sans dipertahankan, cukup ganti `--sans` di `tokens.css`; skala ukurannya tetap.
- **Pengelompokan Work In Progress.** Daftar yang sama dikelompokkan menjadi "Needs you" dan "Needs the driver". Ini perlu data driver yang sudah ada di kartu, tanpa endpoint baru.
- **"Manage workspace".** Di menu workspace, tujuannya diarahkan ke Settings › General, bukan ke Access (UX-032).
