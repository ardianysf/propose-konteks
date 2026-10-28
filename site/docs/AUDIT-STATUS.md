# Status perbaikan audit UI/UX Konteks

28 Oktober 2026 · Prototipe "Konteks UI Release" (versi 5) diperiksa terhadap laporan audit app.konteks.io

## Ringkasan

Dari 56 temuan audit:

| Status | Sistem desain (DS) | UX | Total |
|---|---|---|---|
| Selesai | 9 | 40 | 49 |
| Sebagian | 1 | 2 | 3 |
| Di luar lingkup UI (butuh backend) | 0 | 3 | 3 |
| Dikecualikan atas keputusan produk | 1 | 0 | 1 |
| Belum | 0 | 0 | 0 |

Cara memeriksanya:

1. Pemeriksa terpisah, yang tidak ikut membangun prototipe, menguji setiap temuan dalam dua putaran. Ia memakai kriteria penerimaan dari laporan audit, dan merender prototipe dengan Playwright di 1440 dan 375 px, termasuk mode gelap.
2. Putaran kedua menghasilkan 43 selesai, 9 sebagian, 3 di luar lingkup, dan 1 dikecualikan. Tidak ada temuan yang mundur dari putaran pertama.
3. Enam sisa sesudahnya (DS-06, DS-11, UX-018, UX-020, UX-027, UX-028) saya selesaikan dan uji sendiri, tidak lewat pemeriksa terpisah.
4. Sapuan regresi di 23 halaman tidak menemukan error JS, scroll horizontal, tombol tanpa nama, target di bawah 24 px, halaman dengan lebih dari 5 ukuran huruf, atau warna di luar token.

### Keputusan produk yang dipakai

- **Ukuran teks isi tetap 13 px.** Ukuran 11 px dihapus, jadi skalanya tinggal 12, 13, 14, 16, 20, dan 28 px, dan setiap halaman memakai paling banyak lima ukuran.
- **Pengalih huruf di prototipe tetap ada.** Default Inter, dan rekomendasi saya tetap IBM Plex Sans.
- **Garis tepi kartu tetap tipis (DS-04), terukur 1,25:1.** Garis tepi kontrol (input, select, switch, composer) sudah 3,09:1.

### Create System sudah dicek di aplikasi live

Dicek 28 Oktober, form dibuka tanpa dikirim. Ada tiga opsi:

1. **Discover what we already have.** Berisi daftar koneksi, baris kedalaman baca dengan tombol Change, dan baris "Your Planning model inspects the repositories" dengan Change. Tombolnya Start.
2. **Start from nothing.** Tanpa field. Tombolnya Start.
3. **Create an empty System.** Field Name dan Description (opsional). Tombolnya berganti menjadi Save.

Prototipe sekarang sama persis, dan catatan paritasnya sudah diperbarui. Langkah sesudah Start pada opsi kedua tidak saya jalankan karena memicu sesi agen.

### Model komentar sudah dicek di aplikasi live

Dicek 28 Oktober dengan mengirim data uji, atas izin pemilik akun. Yang dikirim:

- satu initiative uji di System Technical Support Test;
- satu komentar ber-@konteks di note-nya;
- tiga komentar dari Activities: di initiative uji, di "guidance" (Closed), dan di "hris-frontend update README" milik rekan.

Hasilnya:

1. **Note.** Teks yang diketik saat membuat initiative menjadi note pertama. Note dan komentar sama-sama dibaca saat agen menyusun plan ("Reactions and comments feed the plan too").
2. **Komentar di note hanya satu tingkat.** Komentar dari orang maupun dari Konteks berada di bawah note dan hanya bisa diberi reaksi. Tidak ada tombol balas, jadi tidak ada sub-komentar. Hitungan "N comments" melipatnya.
3. **@konteks menyerahkan pekerjaan ke agen.** Begitu @konteks diketik, muncul "This comment hands the work to Konteks. Usual usage charges apply." Setelah dikirim, sesi planning langsung berjalan.
4. **Komentar di Activities milik entri itu sendiri.** Komentarnya tidak muncul di halaman initiative, baik yang aktif maupun yang Closed. @konteks di sana tidak memunculkan catatan dan tidak memicu agen.
5. **Temuan sampingan.** Role akun penguji tidak bisa menyimpan plan. Setelah agen bekerja, muncul "You can't save this plan: your role doesn't include planning".

Yang diubah di prototipe:

- tombol Comment pada balasan dihapus;
- hitungan "N comments" yang melipat komentar;
- catatan @konteks dan tombol "Hand to Konteks", lalu jawaban Konteks masuk sebagai komentar di note yang sama;
- kartu Activities punya thread komentar sendiri di dasar kartu, dengan keterangan bahwa komentar itu tetap di kartu dan tautan ke note initiative untuk menyerahkan pekerjaan ke Konteks.

Ini juga tercatat di DESIGN.md (bagian "The comment model"), LIVE_PARITY.md, inventory, komponen `c-thread`, dan paket React (`ActivityCard` dengan `comments`/`onAddComment`, `CommentCount`, `HandoffNotice`).

Data uji masih ada di aplikasi live. Untuk membersihkannya, tutup initiative "UI review test by Ardian…" dan hapus tiga komentar uji di Activities.

## Konsistensi modal, drawer, dan dialog

### Masalahnya

Rasa "patah" muncul karena jenis jendela dipilih per fitur, bukan berdasarkan apa yang sedang dikerjakan pengguna. Di aplikasi live ada empat pola create yang berbeda (UX-035), panel Work Locally melayang tanpa backdrop dan tanpa Escape (UX-042), satu Escape menutup dua drawer sekaligus (UX-012), dan tombol "Details" malah pindah halaman (UX-018). Di prototipe versi sebelumnya masih tersisa beberapa hal serupa:

- Connect a runtime menutup modal lalu membuka jendela kedua untuk instalasi, jadi satu tugas terasa seperti dua.
- Add a channel di Operations masih berupa form inline di halaman, sementara form create lain sudah memakai modal.
- Support, Edit System, dan System map memakai jenis jendela yang tidak cocok dengan isinya. Isinya hanya untuk dilihat atau dibuka, tetapi bentuknya seperti form.
- Approve dari daftar tidak memakai bentuk konfirmasi yang sama dengan Approve dari detail.
- Drawer yang ditumpuk menggelapkan halaman dua kali.

### Aturan yang sekarang dipakai

Jenis jendela ditentukan oleh satu pertanyaan: apa yang sedang dilakukan pengguna?

| Yang dilakukan | Pola | Lebar | Contoh di prototipe |
|---|---|---|---|
| Melihat atau meninjau sebuah objek tanpa meninggalkan halaman | Drawer kanan | 560 px; 760 px untuk isi yang butuh ruang | PRD, Breakdown, Updates, Session history, Also needs you, Edit System, Session files, Repository, Receipt, Usage detail, Revoked runtimes, Support, External Agent Sessions; versi lebar: Changes, System map, Work Locally |
| Mengisi form atau satu langkah lalu mengirimnya | Modal tengah | 560 px; 760 px versi lebar | New initiative, Generate credential, Create System, Connect a runtime, Add a channel, Request access, Check access, Add/Create skill, Create tool, Create MCP, Add file, Edit file, Create text attachment, Create workspace, Choose repository |
| Mengonfirmasi satu konsekuensi | Dialog | 440 px | Approve (dengan quote dan jumlah SP di tombol), Decline, Rotate, Revoke, Ship release, Delete (ketik nama untuk konfirmasi) |
| Memilih, berpindah, atau melirik sekilas | Menu atau popover | sesuai isi | Menu akun, workspace, More, combobox, notifikasi, "+1 more" |
| Mengubah satu nilai pada objek yang sedang tampil | Inline, tanpa jendela | — | Display name, Change pada quote, catatan dan komentar |

Aturan perilakunya sebagai berikut:

1. **Satu tugas, satu jendela.** Form bertahap tetap berada di modal yang sama. Subjudul berganti menjadi "Step 1 of 2 · …" lalu "Step 2 of 2 · …", isi dan footer diganti di tempat, dan Back menggantikan Cancel. Pola ini dipakai Connect a runtime dan Add a channel.
2. **Form yang dibutuhkan saat drawer terbuka muncul sebagai modal di atas drawer**, lalu kembali ke drawer itu. Contohnya Choose repository di atas Breakdown, dan Generate credential di atas Work Locally. Secret yang hanya tampil sekali menjadi langkah terakhir dari aksi yang membuatnya, bukan jendela tersendiri.
3. **Tumpukan tidak menggelapkan dua kali.** Lapisan kedua memakai scrim transparan.
4. **Escape dan tombol tutup hanya menutup lapisan teratas.** Fokus terkunci di lapisan teratas, lalu kembali ke tombol yang membukanya. Menu selalu tampil di atas drawer dan modal, dan Escape di dalam combobox hanya menutup combobox.
5. **Kerangka yang sama untuk semua jenis.** Header minimal 52 px (judul, satu baris keterangan, tombol tutup), body yang bisa di-scroll, dan footer berlatar sunken. Tombol primer di kanan dan nonaktif sampai field wajib valid. Judul selalu sama dengan label tombol yang membukanya.
6. **Konfirmasi hanya untuk aksi yang mahal atau tidak bisa dibatalkan.** Contohnya Approve (memakai biaya), Revoke, Rotate, dan Delete. Aksi lain langsung dijalankan dan memberi toast.

### Perubahan pada putaran ini

| Bagian | Sekarang | Alasan |
|---|---|---|
| Connect a runtime | Satu modal dua langkah (form → instalasi) | Instalasi adalah kelanjutan dari form yang sama |
| Add a channel (Operations) | Satu modal dua langkah (pilih provider → salin URL, secret, dan body) | Menyamakan dengan semua form create (UX-035). Secret ditampilkan setelah channel dibuat (UX-036) |
| Approve dari daftar | Dialog konfirmasi dengan quote dan "Approve · 2.15 SP" | Bentuknya sama dengan Approve dari detail |
| Edit System | Drawer | Isinya properti System, tautan ke map, dan danger zone. Tidak ada form yang perlu dikirim |
| System map, Changes | Drawer lebar 760 px | Isinya untuk ditinjau dan butuh ruang |
| Work Locally, External Agent Sessions | Drawer (lebar untuk Work Locally) berisi daftar kredensial saja | Form Generate dipindah keluar dari drawer menjadi modal dua langkah (akses dan kedaluwarsa → token yang hanya tampil sekali). Rotate dikonfirmasi dengan dialog, dan Revoke dipindah ke menu ⋯ supaya tidak menempel di samping Rotate |
| "+1 more" di baris Work | Popover kecil yang menempel di tombolnya | Isinya hanya satu pertanyaan dan satu tautan, jadi drawer penuh terlalu berat |
| Notifications | Popover dengan item belum dibaca yang sama persis dengan hitungan "Needs you" | Sebelumnya badge dan isi kotak masuk tidak sama |
| Support | Drawer | Isinya informasi kontak, tidak ada yang dikirim |
| Scrim bertumpuk | Transparan untuk lapisan kedua | Halaman tidak menggelap dua kali |

Aturan ini juga tercatat di DESIGN.md bagian Overlays dan di deskripsi komponen Overlay pada halaman Komponen.

## Status per temuan

### Sistem desain

| ID | Temuan | Status | Bukti di prototipe | Sisa pekerjaan |
|---|---|---|---|---|
| DS-01 | Skala tipografi | Sebagian | Skala tinggal 12/13/14/16/20/28 dan semua 23 halaman memakai 3–5 ukuran. Isi tetap 13 px sesuai keputusan. Header grup kini 14/600 dan judul hari di log 13/600 di atas entri 12 px. Judul seksi (h-sub) 16/600. | Header grup sama besar dengan judul baris (14 px); bedanya hanya ketebalan. Kalau perlu lebih tegas, header grup naik ke 16 px. |
| DS-02 | Radius | Selesai | Radius terukur 4/6/10 px, 50% (avatar/titik), dan 9999 hanya pada `.switch`. Nilai 4 px kini tercatat sebagai aturan di DESIGN.md ("Corner By Size Rule: 4px inside controls, 6px controls, 10px containers"). | – |
| DS-03 | Warna di luar token | Selesai | #skills `.tag` Built-in: teks rgb(77,100,79), latar putih, border `--line` (semuanya token). Segmen Public Git terpilih: ink di atas putih (13,8:1). Checkbox dan radio memakai `accent-color: rgb(79,112,68)` (token `--accent`) berukuran 16 px; `select` memakai `appearance:none`. | Lihat checklist "tidak ada warna di luar token" untuk turunan `color-mix`. |
| DS-04 | Kontras non-teks border kartu | Dikecualikan (PO) | Nilai terukur: `.tablewrap` border rgb(229,231,217) di atas putih **1,25:1**, di atas bg 1,18:1, `box-shadow: none`. Tidak berubah. | Keputusan PO. |
| DS-05 | "Pill soup" | Selesai | Di #work tidak ada elemen yang radiusnya ≥ setengah tingginya selain avatar dan titik. `.st` berbentuk titik + teks, `.tag` radius 4 px. Izin peran ditampilkan sebagai daftar berkelompok yang bisa difilter (`.perm`: radius 0, tanpa latar). | – |
| DS-06 | Ikonografi | Selesai | Lucide stroke 1,75, dua ukuran (16 dan 14 px; tab bar mobile 20 px sebagai satu pengecualian yang dicatat). Tag System tanpa ikon. Satu ikon satu makna: `repeat` hanya untuk Rotate, entri log berulang memakai `layers`, Leaders memakai `list-ordered`. | – |
| DS-07 | Kapitalisasi | Selesai | Pemindaian semua tombol, heading, tab, dan label di 23 route: Title Case hanya tersisa pada istilah tetap (Work In Progress, Story Points, New System, Ops Profiles, Claude Code). Tidak ada `text-transform: uppercase` di CSS. Judul modal memakai sentence case ("Create workspace", "Create skill"). | – |
| DS-08 | Gaya tab | Selesai | Satu gaya tab bergaris bawah (`.tab`, aria-selected) di Access, Context, Skills, dan Settings. `.seg` hanya dipakai untuk pilihan nilai (sumber Git, durasi, tema), bukan navigasi. Customize mobile memakai `select`. | – |
| DS-09 | Format tanggal | Selesai | `fmtDate()` dan `ago()` ada di ui.js. Tidak ada waktu relatif yang tampil di 23 route maupun di PRD, Updates, Session history, Notifications, dan Work Locally (regex "… ago / in N days / just now": 0). Waktu relatif pindah ke `title` (Activities: "17.31", title "2 hours ago · 27 Oct 2026, 17.31"). Hari ini ditulis "Today, 11.40". Work Locally memakai "Expires soon" + "Expires 18 Nov 2026". | Catatan: tanggal di `data.js` masih string literal dengan format yang sama; di produksi lewatkan semuanya ke formatter. |
| DS-10 | Pola loading | Selesai | Detail inisiatif menampilkan skeleton (13 `.sk`, `aria-busy`) selama 550 ms; System map juga punya skeleton sebelum 4 node muncul. Tidak ada teks "Loading…". | Lihat regresi R1 (judul dan lang saat skeleton). |
| DS-11 | Monospace | Selesai | Versi di Skills dan Tools memakai Inter. Aturan mono kini tertulis eksplisit di README, halaman Design system, dan DESIGN.md: ID, uang dan SP, perintah, kode, diff, dan isi berkas yang diedit sebagai sumber (editor Markdown skill, YAML context). | – |

### UX

| ID | Temuan | Status | Bukti di prototipe | Sisa pekerjaan |
|---|---|---|---|---|
| UX-001 | "Needs you" untuk semua orang | Selesai | Badge = 2 (INI-142, INI-131). Notifications memuat keduanya, ditambah "Sari started…". Kedua tautan membuka inisiatif yang benar ("Role editor for SensePortal"). INI-139, yang tidak bisa disetujui Contributor, pindah ke grup "Needs someone else". Badge tetap 2 saat filter HRIS aktif. | – |
| UX-002 | Approve untuk peran tanpa izin | Selesai | Sebagai Contributor, Approve tidak ada di keempat lokasi: daftar ("Maya Lestari approves"), detail (`.gate` "Approving needs the Delivery Approver role. Maya Lestari can approve."), sesi ("Waiting for a Delivery Approver (Maya Lestari)"), dan drawer Breakdown (tidak ada tombol Approve). Sebagai Approver, tombol muncul dengan biaya. | Penegakan izin nyata di luar lingkup; toggle "As Contributor/As Approver" hanya untuk demo. |
| UX-003 | Aksi berdampak sebagai tautan kecil | Selesai | `.row-title` 24 px, "+1 more" 46×24, aksi 26 px. Tidak ada target <24 px di #work selain separator `#sideResize`. Approve dari daftar tetap lewat dialog berisi biaya. | – |
| UX-004 | Aksi detail ≠ daftar | Selesai | Kartu detail INI-120 sekarang memuat "Konteks asked a question about the plan" di samping Try again. Semua aksi daftar ada di detail untuk 8 inisiatif. | – |
| UX-005 | Penyebab macet tersembunyi | Selesai | `.row-why` wrap 2 baris (`-webkit-line-clamp: 2`, tidak terpotong di 1280) dan diberi `title` berisi teks lengkap. Kartu detail INI-131 menyediakan "Request access" sebagai aksi pemulihan. | – |
| UX-006 | 3 gaya kartu perhatian | Sebagian | Struktur dan varian tidak berubah. Kartu dengan 0 tombol primer: INI-137, -128, -120, -125, dan INI-139 sebagai Contributor. Kartu running INI-144 tidak punya waktu tunggu ("TKT-2 · on rf-01 · 12m"). | Satu primer per kartu (atau ubah kriteria secara resmi); beri label waktu di kartu running. |
| UX-007 | Judul terpotong/kembar | Sebagian | Judul kini wrap (`white-space: normal`, tinggi 44 px di 375 px, tidak terpotong) dan koma di akhir dipangkas. Tetapi saat diuji dengan dua judul yang hanya berbeda koma, keduanya tampil identik ("Update UI untuk SensePortal dashboard dan halaman laporan"); pembedanya hanya baris penyebab dan aksi. | Pembeda pada judul itu sendiri (judul otomatis dari PRD, ID, atau sufiks). |
| UX-008 | Log gagal/coba lagi | Selesai | Drawer Updates INI-120: satu entri "Planning ended without a plan ×12 · 02.12–04.39 · last cause: …" (`<details>`). Legenda titik: "New since you last opened Updates". | – |
| UX-009 | Badge ikut filter | Selesai | Badge sidebar tetap 3 sebelum dan sesudah filter HRIS Nusantara aktif. | – |
| UX-010 | Default System dan validasi | Selesai | Dengan All systems: combobox "Choose a System", Start disabled. Setelah deskripsi diisi pun tetap disabled; baru aktif setelah System dipilih. Combobox bisa dicari ("kur" → Kurir Hub). Dengan filter HRIS, default = HRIS Nusantara. | – |
| UX-011 | Banner koneksi lama | Selesai | `#connBanner` punya tombol Dismiss (aria-label). | Status tutup tidak disimpan (muncul lagi setelah reload). |
| UX-012 | Escape menutup dua drawer | Selesai | Breakdown → More → View changes → Escape: tersisa `drawer:Breakdown`, fokus ke tombol "More". Escape kedua menutup Breakdown, fokus ke `#bBrk`. | – |
| UX-013 | Status Breakdown bertentangan | Selesai | INI-137: rencana "Needs review", tiket "Repository needed" (warn), callout `.callout.warn` "TKT-1 needs one repository". Tidak ada tiket "Ready" yang sekaligus punya blokir di 4 breakdown yang diuji. | – |
| UX-014 | Picker repo tidak per System | Selesai | Choose repository (INI-137): grup "Connected to HRIS Nusantara" di atas (Gitea Sari, HRIS Azure), lalu "Other connections" dengan nama pemilik. | – |
| UX-015 | Form Change | Selesai | Setelah Change dibuka, `#approve` disembunyikan ("Approve comes back when you close this") dan Post note menjadi `btn btn-sm`. Di viewport hanya ada satu primer: "Create revised proposal". | – |
| UX-016 | Delete System bersebelahan | Selesai | Drawer Edit System: `.danger-zone` 50 px di bawah "Open System map", di baris terpisah. Konfirmasi ketik-nama menyebut "0 open initiatives are affected" dan tombolnya disabled sampai nama cocok. | – |
| UX-017 | Semua koneksi tercentang | Selesai | Create System: hanya "Rentify org" (Organization) dan "Gitea Ardian" (You) yang tercentang; koneksi 5 rekan tidak. Ada filter, Select all/Clear, dan kontrol bertema. | Lihat "Masalah baru" #5 (hanya 1 dari 3 opsi). |
| UX-018 | "Details" pindah halaman | Selesai | Label "Session history" membuka drawer di halaman yang sama. Semua tombol yang berpindah halaman ("Open session", "Change in the initiative") memakai ikon panah. | – |
| UX-019 | Transkrip bocor istilah internal | Selesai | #session: tidak ada istilah dari daftar audit di teks yang terlihat. Penyetuju tampil sebagai "Maya Lestari". Ada ringkasan `dl` (Last run/Kept/Next); jejak agen tertutup di `<details class="trace">`. | Durasi dan token masih tampil di label ringkasan jejak ("30.5s · 990 tokens in, 22 out"), bukan tooltip. |
| UX-020 | Makna ikon header | Selesai | Header sesi jelas, chip 24 px, dan tidak ada lagi ikon dengan dua makna: `repeat` hanya Rotate, `rotate-cw` hanya coba lagi atau periksa lagi, `layers` untuk entri ×N. | – |
| UX-021 | System map | Selesai | Tidak ada chip "unknown"; 3 `path` relasi System–Component tergambar; gmail-handler "Not classified yet" sekali, ditambah callout. | Skeleton loading dan waktu muat: lihat DS-10 (di luar lingkup untuk waktu). |
| UX-022 | Diff viewer | Selesai | Drawer Changes: 30 sel nomor baris, toggle Wrap lines (setelah wrap scrollWidth 725 = clientWidth 725), dan tombol Rendered untuk README.md. | – |
| UX-023 | Tooltip rail | Selesai | Mode rail: 0 item sidebar tanpa `data-tip` (wsBtn dan meBtn sudah punya). | – |
| UX-024 | Story Points seperti mata uang | Selesai | Dua desimal konsisten: Estimate 2.15 SP, Breakdown "Settled 0.47 SP", Usage 3.40, Plan "10,000.00 SP", Payments "500.00 SP" + "Rp 1.920 per SP". | Nama tetap "Story Points" (istilah live), bukan "kredit". |
| UX-025 | Empty state tanpa aksi | Selesai | #issues: ikon `shield-check` + "Set up a telemetry channel" (→ #operations). #releases: ikon `rocket` + "See initiatives in progress". | – |
| UX-026 | Leaders sulit ditafsirkan | Di luar lingkup | Rumus poin terlihat, "1 point", dan "Value not reported yet". Filter periode/System tetap tidak ada. LIVE_PARITY mencatat "No period filter", jadi menambahkannya berarti menambah proses dan butuh backend. | Backend/produk. |
| UX-027 | Feed hanya "started" | Selesai | Feed memuat peristiwa perubahan state (estimate ready, stopped, plan ready). Setelah Load more, blokir izin INI-131 ("The plan could not be saved in Role editor for SensePortal") muncul di grup 23 Oct 2026. Tombol Comment selalu terlihat. Komentar di kartu kini menjadi thread milik kartu itu, sama seperti live (dicek 28 Okt). | – |
| UX-028 | Read-only tidak konsisten | Selesai | Satu pola read-only di Models, Runtimes, dan Settings › General: kontrol sunken bergaris putus-putus, lalu lock strip yang menyebut nama peran ("Only the Workspace Owner can rename it.") dengan Request access. | – |
| UX-029 | Daftar model | Selesai | Pilihan aktif menyebut harness ("Auto · Default (recommended) · $5 / $25…", "Codex · GPT-6-Luna…"). Daftar lengkap ada dalam tabel per harness. | Isi 123 opsi dan harga ganda adalah data (di luar lingkup); pencarian tidak bisa diuji karena kontrolnya read-only. |
| UX-030 | VCS banner dan kartu | Selesai | Tabel VCS kini punya kolom Owner. Baris bisa diklik dan membuka drawer "Rentify org" berisi Provider, URL, Token, Owner, Used by, dan Status, dengan catatan izin. | – |
| UX-031 | Status runtime bertentangan | Selesai | Countline "10 registered · 6 ready · 1 not accepting work · 3 not connected" sama persis dengan status di tabel. Satu status per baris. ardian's Mac: Codex "Ready when online". Ajakan update hanya untuk pemilik; rizky-mac: "Rizky Aditya owns this computer". | – |
| UX-032 | Routing dan item aktif | Selesai | Tab Access berupa `<a href="#access/<tab>">`. Klik People → `#access/people`; `#access/roles` langsung memilih Roles. | Lihat regresi R2 (`#access/bogus`). |
| UX-033 | Access | Selesai | Angka revisi kebijakan sudah dihapus; Overview menulis "42 permissions", sama dengan tabel Roles (42 unik). Ketujuh tab terlihat di 768 px. | – |
| UX-034 | Context | Selesai | Ada judul dan deskripsi bagian. Baris berkas bisa diklik dan membuka drawer viewer read-only. `.row-tools` selalu terlihat (opacity 1) dengan aria-label "Edit/Delete AGENT-PROFILE.yaml". Hanya `GITEA_TOKEN` yang disamarkan. Repositories memakai combobox. | Tab "Skills" di Context tetap bernama sama, tetapi kini dijelaskan dan ditautkan ke Customize › Skills. |
| UX-035 | Empat pola create | Selesai | Tombol "New System" kini membuka modal "New System". Ke-11 form create/edit: modal role=dialog aria-modal; primer disabled sampai valid, kecuali yang punya default valid. | – |
| UX-036 | Operations merujuk data belum ada | Selesai | Ops Profiles kini empty state ("No Ops Profiles yet…"). Add a channel: langkah 1 pilih penyedia → Create → langkah 2 berisi URL, secret ("shown only once"), dan body. | Empty state Ops Profiles belum punya tautan ke System. |
| UX-037 | Connectors toggle | Selesai | Setiap toggle punya status efektif ("Not in effect yet" / "On"); "Connected runtimes" adalah tautan ke #runtimes. | – |
| UX-038 | Detail runtime dan Connect | Selesai | Tombol harness berupa teks dengan status teks ("Claude Code Needs sign-in", "OpenCode Failed"), breadcrumb "Runtimes › rf-01", "Sessions on this runtime" untuk milik orang lain, dan satu istilah "workload(s)". Deskripsi workload terlihat di modal; checkbox bertema. | – |
| UX-039 | Error mentah access_denied | Selesai | #budgets: state terkunci "Only Billing Administrators can see budgets" dengan Request access dan Go to Usage; tidak ada snake_case di halaman. | – |
| UX-040 | Payments | Di luar lingkup | Yang sudah beres di UI: satu locale untuk Rp dan SP (en-US: "Rp 12,640,000", "2,500.00 SP"), kartu di 375 px (hscroll 0, nominal dan status di baris pertama), landmark `<main id="main">` ada, Pending ditulis "Pending · not paid". Kedaluwarsa otomatis atau "Lanjutkan pembayaran" butuh backend dan tidak ada di LIVE_PARITY. | Backend. |
| UX-041 | Usage | Di luar lingkup | Rincian "Not reported" kini tampil langsung di baris tabel (tanpa `<details>` "Why?"), dan semua SP dua desimal. "Spent, last 30 days" dan "This period" tetap dua jendela; ini jendela data dari backend dan teksnya menjelaskan perbedaannya. | Backend. |
| UX-042 | Work Locally | Selesai | Satu format kedaluwarsa ("Expires soon" + "Expires 18 Nov 2026", tanpa "in N days"). Revoke pindah ke menu ⋯ ("Revoke credential…", gaya danger) dan tetap memakai alertdialog. Generate credential kini modal dengan Access level dan Expiry. Escape dan pengembalian fokus tetap benar. | – |
| UX-043 | Create Your Workspace | Selesai | Modal standar "Create workspace", sentence case, 0 ikon di label, footer Cancel/Create workspace di kanan, primer disabled sampai nama diisi. | Field "Workspace id" dan "Description" belum terkonfirmasi di LIVE_PARITY (lihat Masalah baru). |
| UX-044 | 24 chip System | Selesai | `#sysCombo` combobox berpencarian. Filter aktif "System: HRIS Nusantara" terlihat di 375 px (x 16–217) dan desktop, dengan "Show all systems" dan pensil Edit. "New System" dipisah ke kanan. | – |
| UX-045 | Fondasi a11y navigasi | Selesai | Nav berupa `a[href]` dengan `aria-current`. Skip link adalah fokus pertama di aplikasi (setelah 9 fokus milik bingkai pitch); Enter memindahkan fokus ke `#main`. `document.title` per halaman ("Work In Progress · Konteks"). `lang` menjadi "id" setelah EN/ID diganti lalu pindah halaman. Menu memakai role=menu; Close di detail skill berlabel. | `lang` baru berubah setelah render berikutnya, bukan saat itu juga. |
## Kriteria selesai dan aksesibilitas

| Kriteria | Status | Keterangan |
|---|---|---|
| Satu halaman memuat paling banyak 5 ukuran font | Selesai | 23 dari 23 halaman memakai 3–5 ukuran, di 1440 dan 375 px |
| Tidak ada warna di luar token | Selesai | Turunan `color-mix`, knob switch, dan bayangan tabel kini menjadi token, termasuk nilai gelapnya. Build prototipe gagal jika ada warna mentah (`tools/lint_colors.py`). Paket kode membawa `.stylelintrc.json` dengan aturan yang sama untuk repo live |
| Tidak ada kontrol bawaan browser tanpa tema | Selesai | |
| Tidak ada kode error atau ID mesin yang tampil | Selesai | Yang tersisa hanya Order ID pembayaran dan awalan token yang disamarkan. Keduanya memang rujukan untuk pengguna |
| Semua tanggal memakai formatter yang sama | Selesai | `fmtDate()` dan `ago()`: teks yang tampil absolut, waktu relatif hanya di tooltip |
| Setiap ikon punya satu makna | Selesai | Daftar maknanya ada di DESIGN.md › Icons |
| Setiap status punya padanan teks | Selesai | Header Runtimes di sidebar menulis "6 ready". Titik belum dibaca punya teks "Unread" untuk pembaca layar |
| Target minimal 24 px | Selesai | Pengecualiannya hanya pegangan resize sidebar (bisa dipakai lewat keyboard) dan checkbox di dalam label yang bisa diklik |
| Landmark, skip link, judul halaman, fokus, Escape | Selesai | |
| Dark mode | Selesai | |
| Kontras garis tepi kartu | Dikecualikan | Keputusan produk, terukur 1,25:1 |
| Uji screen reader nyata | Belum diuji | Perlu NVDA atau VoiceOver di perangkat asli |

## Yang masih terbuka

1. **DS-01.** Header grup (14/600) sama besar dengan judul baris (14/500). Bedanya hanya ketebalan. Kalau ingin lebih tegas, header grup bisa dinaikkan ke 16 px.
2. **UX-006.** Kartu perhatian hanya punya tombol primer kalau Anda pelakunya. Kartu milik orang lain menyebut siapa yang harus bertindak dan memakai tombol sekunder. Ini aturan desain yang disengaja. Kalau audit tetap meminta satu tombol primer per kartu, kriterianya perlu disepakati ulang.
3. **UX-007.** Judul yang hampir kembar, misalnya hanya beda koma, baru bisa dibedakan dari baris penyebab dan tag System. Pencegahan judul kembar saat inisiatif dibuat butuh backend.
4. **Di luar lingkup UI:**
   - UX-026: filter periode di Leaders tidak ada di live.
   - UX-040: Pending yang kedaluwarsa atau dilanjutkan butuh backend. Penjelasan untuk pengguna sudah ditambahkan.
   - UX-041: dua jendela waktu di Usage berasal dari data.
5. **Paritas yang belum bisa dicek** karena komputermu tidak terhubung saat pengecekan terakhir:
   - Field "Workspace id" dan "Description" di Create workspace. Audit mencatat tiga label berikon di dialog live, jadi kemungkinan sesuai.
   - Tombol Dismiss di banner versi baru. Ini tambahan tampilan, bukan proses.
6. **Pilihan overlay yang berbeda dari live, dengan sengaja:**
   - Support: di live berupa dialog, di prototipe drawer, karena isinya untuk dibaca dan tidak ada yang dikirim.
   - Edit System: berupa drawer berisi properti dan danger zone. Delete di dalamnya tetap meminta nama System diketik ulang.

## Menerapkan ke kode live dengan coding agent

Paket kode sekarang memuat **`AGENTS.md`**, berkas aturan untuk Claude Code, Codex, atau Cursor yang bekerja di repo live. Isinya:

- Satu aturan utama: ubah tampilan, jangan ubah proses.
- Urutan sumber acuan.
- Urutan kerja per PR.
- Aturan yang paling mudah dilanggar: warna, ukuran huruf, radius, ikon, overlay, tanggal, copy, dan izin.
- Definisi selesai untuk setiap PR.

Agent membacanya bersama `DESIGN.md`, `inventory.csv` (elemen live → komponen → temuan → layar demo), dan prototipe sebagai gambar target.

Tiga hal membuat agent bisa bekerja tanpa menebak:

1. **Perubahan yang bisa diterapkan tanpa menyentuh komponen.** `tokens.css` dan `tokens.live-map.css` mengisi variabel yang sudah dibaca aplikasi (`--kx-*`, `--color-app-*`). `tailwind.preset.js` mempertahankan nama kelas `app-*`. Langkah 1–3 di README cukup diimpor dan dirilis.
2. **Aturan yang dicek mesin, bukan diingat.** `.stylelintrc.json` menolak warna mentah. Sebaiknya ditambah tiga pemeriksaan di CI:
   - jumlah ukuran huruf per halaman;
   - tidak ada ikon di luar daftar maknanya;
   - target minimal 24 px.

   Skrip Playwright yang dipakai pemeriksa bisa diarahkan ke staging.
3. **Kriteria selesai per temuan.** Setiap baris di dokumen ini punya ID dan kriteria yang bisa diuji. Satu PR cukup menyebut ID-nya, misalnya "UX-035, UX-043", lalu agent atau reviewer mengecek kriteria itu.

Yang masih kurang adalah peta dari komponen ke **file di repo live**. Kolom `where` di `inventory.csv` menyebut layar, belum menyebut path file. Kalau repo aplikasi disambungkan ke sesi ini, aku bisa menambahkan kolom path dan membuat daftar tugas per PR yang langsung bisa dikerjakan agent.
