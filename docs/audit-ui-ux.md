# Audit UI/UX Konteks (app.konteks.io)
2026-10-27 · @Ardian Yusuf
## Ringkasan eksekutif
Konteks punya fondasi yang rapi: palet hijau yang tenang, satu font (DM Sans), microcopy keamanan yang konsisten, dan beberapa pola yang sangat baik, seperti kartu estimasi biaya dengan kalimat "Nothing runs until you approve". Yang membuatnya terasa  bukan satu masalah besar, melainkan banyak ketidakkonsistenan kecil yang menumpuk. Ada 9 ukuran font, 7 nilai radius, 3 gaya tab, 7 format tanggal, dan 4 pola form "create". Ada warna bawaan Tailwind dan kontrol biru bawaan browser di tengah UI hijau. Ada pesan error mentah ("access_denied"). Transkrip agen membocorkan istilah internal. Dan status di banyak tempat saling bertentangan.
Audit v2 ini mencakup  dan : 45 temuan UX/fungsi-tampilan (UX-001 sampai UX-045) dan 11 temuan sistem desain (DS-01 sampai DS-11).
| Severity | UX | DS | Total |
| Critical | 0 | 0 | 0 |
| High | 3 | 0 | 3 |
| Medium | 29 | 5 | 34 |
| Low | 13 | 6 | 19 |

 "Needs you" muncul pada semua inisiatif untuk semua orang.
 tombol Approve yang memicu biaya tampil untuk peran yang tidak memiliki izin .
 penyebab sebenarnya sebuah inisiatif macet disembunyikan, misalnya "+1 more" yang tidak bisa diklik atau izin yang ditolak tetapi hanya tercatat di log.

UX-002 lama ("aksi tidak ada di detail") ternyata hanya berlaku untuk 2 dari 6 jenis state, sehingga turun ke Medium (sekarang UX-004).
Panel Updates ternyata sudah mengelompokkan pesan yang identik ("×6"), tetapi belum mengelompokkan pasangan gagal/coba-lagi (sekarang UX-008).
Ada dua modul yang belum ditemukan di v1:  (/?conversation=…) dan  (Plan, Usage, Budgets, Payments).
### Cakupan dan cara kerja
| Aspek | Keterangan |
| Akun | Ardian Yusuf, peran Engineering Contributor (91 izin, bukan workspace owner) |
| Aturan aksi | Sesuai keputusan Anda: setiap form, modal, drawer, dan menu dibuka sampai titik terakhir sebelum disimpan, lalu dibatalkan. Tidak ada data yang diubah. |
| Teks uji | Satu kali di New initiative; sudah dihapus dan dibatalkan |
| Efek samping yang terlihat | Membuka panel Updates menghapus badge "new updates" (ditandai sudah dibaca) |
| Viewport | Desktop (sekitar 1024 px, sidebar terbuka dan tertutup), tablet 768×1024, mobile 375×812 |
| Pengukuran | Token CSS dibaca dari stylesheet; ukuran font, radius, warna, dan ukuran target diukur dari computed style; kontras dihitung dengan rumus WCAG 2.x |
| Waktu | 27 Oktober 2026, 13.20–14.15 WIB |
Screenshot hanya terlihat di sesi audit dan tidak disimpan sebagai berkas, jadi bukti ditulis sebagai deskripsi, URL, dan nilai terukur. Tidak ada referensi SS-xxx fiktif.
  = diamati atau diukur langsung.  = ada bukti awal.  = bergantung pada aturan bisnis atau aksi yang tidak dijalankan.
## Audit anti-slop: sistem desain
Tokennya sebenarnya sudah ada dan cukup baik: 18 warna semantik (app-bg, app-card, app-text sampai text-tertiary, accent sampai accent-solid, success, warning, danger, second) dengan padanan dark mode, dua bayangan (raised, overlay), dan satu font, DM Sans. Masalahnya, komponen tidak disiplin memakai token itu. Kesan "slop" muncul dari variasi kecil yang tidak disengaja, bukan dari estetika dasarnya.
### Apa yang sudah baik dan layak dipertahankan
Kontras teks lolos AA di semua kombinasi utama: text-secondary di atas bg 6,07:1, text-tertiary di atas bg 4,85:1, teks putih di atas tombol primer (accent-solid) 5,62:1, warning di atas attention-surface 4,61:1.
Satu keluarga font, dan angka biaya/poin memakai monospace rata kanan dengan garis titik penghubung, seperti di kartu estimasi dan Usage. Ini detail yang terasa dibuat dengan sengaja.
Ring fokus terlihat jelas (2 px, accent-strong) pada elemen yang memakai kelas standar.
Microcopy keamanan konsisten dan konkret ("Konteks never holds a provider key or account", "Nothing runs until you approve").
### Temuan sistem desain
| ID | Area | Observasi terukur | Severity | Status |
| DS-01 | Tipografi | 9 ukuran dipakai: 10, 11, 12, 13, 14, 15, 16, 18, 20 px. Teks isi didominasi 12 px (di /work 110 dari 129 node teks; di /activities 231 dari 293). Ada teks 10 px (8 node di /work, 14 di /leaderboard). H2 di Activities ("Today", nama hari) dan "Needs your attention" berukuran 12 px, sama dengan isi. Judul bagian Customize: Access 18 px, Operations 15 px, lainnya 14 px, sedangkan Models, Context, dan VCS tidak punya heading. | Medium | Terverifikasi |
| DS-02 | Radius | 6, 8, 12, 14, 16, 19,5 px ditambah 9999 px. Token --kx-radius-main bernilai 19,5 px (pecahan). Kartu Leaders 16 px, kartu Customize 12 px, kartu daftar /work 12 dan 14 px. | Low | Terverifikasi |
| DS-03 | Warna di luar token | (a) Badge "Built-in" di Skills memakai hijau bawaan Tailwind (teks rgb 21,128,61; latar 220,252,231; border 134,239,172). (b) Segmen terpilih "Public Git" memakai rgb 122,176,85 dengan teks putih, kontras 2,6:1 (gagal AA). (c) Checkbox dan radio bawaan browser (accent-color: auto, jadi biru) di Create System, Connect a runtime, Who merges, dan Workspace runtime policy; ukuran 13 px. | Medium | Terverifikasi |
| DS-04 | Kontras non-teks | Border kartu (app-border di atas putih) hanya 1,25:1 dan border-strong di atas bg 1,29:1. Batas kartu bergantung pada bayangan tipis. | Low | Terverifikasi (rasio); dampak Indikasi |
| DS-05 | "Pill soup" | 71–85 elemen per halaman memakai radius 9999 px: chip System, status, avatar, izin, filter, tag, tombol sekunder. Di Roles, 16 kartu berisi awan pill izin (Engineering Contributor saja 91 izin). Semuanya tampil dengan bobot visual yang sama, sehingga tidak ada hierarki. | Medium | Terverifikasi |
| DS-06 | Ikonografi | Lucide 2 px dicampur ikon OS kustom 1 px. Ikon sidebar berukuran 16, 17 (bell), dan 18 (sliders) px. Metafora generik: "waves" untuk Activities, trophy untuk Leaders. Ikon "boxes" diulang di setiap chip System (8× di layar). Ikon dekoratif di setiap label form Create Your Workspace. Glyph "◆" dipakai sebagai bullet event. Ada juga makna ikon yang bertabrakan (lihat UX-020). | Medium | Terverifikasi |
| DS-07 | Kapitalisasi | Title Case ("Edit File", "File Name", "Create Your Workspace", "Workspace Display Name", "Rotate Token", "Load Repository") bercampur dengan sentence case ("New initiative", "Connect a runtime", "Add a channel"). Eyebrow uppercase berukuran 11 px (Leaders) dan 12 px (Runtimes). | Low | Terverifikasi |
| DS-08 | Tab | Tiga gaya tab: pill berlatar (Access), garis bawah (Context, Skills), segmen terisi (Import skills), ditambah tab-chip di Customize versi mobile. | Low | Terverifikasi |
| DS-09 | Tanggal dan waktu | Ada 7 format: "9/30/2026"; "Oct 27, 2026, 12:53 PM"; "04:39 PM"; "9/4/2026, 12:32:47 AM"; "08/27/2026, 2:55:12 PM"; "Sep 16, 11:41 AM" (tanpa tahun); "Expires in 22 days" di samping "Dec 24, 2026" pada daftar yang sama. | Medium | Terverifikasi |
| DS-10 | Loading | Teks polos ("Loading models", "Loading the System map…", "Loading") di satu tempat, skeleton di detail inisiatif. Waktu muat yang teramati: detail inisiatif 5–7 detik, System map 5–8 detik. | Low | Terverifikasi |
| DS-11 | Monospace | Mono dipakai untuk angka (baik), tetapi juga untuk teks biasa seperti "Organization: Global" dan versi abu-abu "1.0.0". Placeholder textarea di Create Skill memakai mono, sedangkan placeholder lain memakai DM Sans. | Low | Terverifikasi |
### Arahan visual yang disarankan
 12 (meta), 14 (isi), 16 (judul kartu atau bagian), 20 (judul halaman), 24 (angka besar). Hapus 10, 11, 13, 15, dan 18. Teks isi minimal 14 px, dan heading tidak boleh sama ukurannya dengan isi.
 6 (input, chip persegi), 10 (kartu), 9999 (hanya avatar dan badge status). Ganti 19,5 px menjadi bilangan bulat.
 Chip System dan tag cukup memakai teks dengan ikon kecil. Daftar izin ditampilkan sebagai tabel atau daftar yang bisa dicari, bukan awan pill.
 lewat lint (misalnya stylelint atau aturan Tailwind yang hanya mengizinkan kelas app-*). Tambahkan  secara global untuk checkbox dan radio.
 "27 Okt 2026, 12.53" (atau padanan EN), tahun selalu ada kecuali hari ini, dan waktu relatif hanya sebagai tooltip.
 satu set (Lucide), satu stroke (1,75 atau 2), dua ukuran (16 untuk navigasi, 14 untuk inline). Ikon hanya dipakai jika menambah makna, bukan sebagai dekorasi.
## Temuan per modul
Setiap temuan memuat lokasi dan langkah, observasi, dampak, severity, status, rekomendasi, dan kriteria penerimaan yang bisa diuji.
### M02 Work In Progress (/work, /work/init_…)
Yang diperiksa: daftar 8 inisiatif, filter System, kedelapan halaman detail, panel PRD, Breakdown, Updates, dan Changes (diff), kartu estimasi (Approve, Change, Details, Models for this delivery), form Change, picker repositori, opsi Who merges, modal New initiative, Create System, dan Edit System. Semua aksi simpan tidak dijalankan.
 kartu estimasi menampilkan batas atas Story Points dan rentang biaya model sebelum persetujuan; form Change menyebut akibatnya ("creates a new proposal version and invalidates the current quote"); draf New initiative tidak hilang; filter tersimpan di URL; panel menutup dengan Escape dan mengembalikan fokus; Create System memakai kartu radio dengan deskripsi yang jelas.
| ID | Masalah | Severity | Status |
| UX-001 | "Needs you" untuk semua orang, Notifications kosong | High | Indikasi |
| UX-002 | Approve (memicu biaya) tampil untuk peran tanpa izin approve | High | Perlu validasi |
| UX-003 | Aksi berdampak tampil sebagai tautan teks 18 px | Medium | Terverifikasi |
| UX-004 | Aksi di detail tidak setara dengan daftar (2 dari 6 state) | Medium | Terverifikasi |
| UX-005 | Penyebab macet disembunyikan | High | Terverifikasi |
| UX-006 | Kartu "Needs your attention" punya 3 gaya visual | Medium | Terverifikasi |
| UX-007 | Judul terpotong atau hampir kembar | Medium | Terverifikasi |
| UX-008 | Log Updates belum meringkas pola gagal dan coba lagi | Medium | Terverifikasi |
| UX-009 | Badge sidebar ikut filter | Low | Terverifikasi |
| UX-010 | Default System dan Start aktif saat kosong | Medium | Perlu validasi |
| UX-011 | Banner koneksi lama | Low | Terverifikasi |
| UX-012 | Satu Escape menutup dua drawer bertumpuk | Low | Terverifikasi |
| UX-013 | Status Breakdown saling bertentangan | Medium | Terverifikasi |
| UX-014 | Picker repositori tidak difilter per System | Medium | Terverifikasi |
| UX-015 | Form Change: tanpa batal, textarea sempit, dua tombol primer | Medium | Terverifikasi |
| UX-016 | "Delete System" bersebelahan dengan tautan biasa | Medium | Perlu validasi |
| UX-017 | Create System memilih 19 koneksi rekan secara default | Medium | Terverifikasi |
#### UX-001 "Needs you" tidak berarti "Anda"
 Buka /work. Badge sidebar berbunyi "8 need your attention". Buka Notifications.
 Kedelapan kartu berlabel "Needs you", padahal semuanya digerakkan orang lain dan akun ini tercatat 0 started di Leaders. Notifications berisi "Nothing yet".
 Anggota tim tidak tahu mana yang benar-benar tugasnya; semua kartu terasa mendesak.
 Pisahkan "Needs you" (driver, assignee, atau approver yang berwenang) dari "Needs the driver". Tambahkan filter Mine/All, dan biarkan badge hanya menghitung milik pengguna.
 Pengguna yang bukan driver dan tidak berwenang tidak melihat "Needs you". Setiap item di badge juga muncul di Notifications.
#### UX-002 Tombol Approve tampil untuk peran yang tidak punya izin approve
 /work (kartu RecRe support-be: "Approve"), detail inisiatif, sesi agen, dan drawer Breakdown. Lalu bandingkan dengan Customize > Access > Roles > Engineering Contributor.
 Approve muncul di 4 tempat. Daftar izin Engineering Contributor tidak memuat "Delivery Proposal Approve", izin yang dimiliki peran terpisah "Delivery Approver". Peran ini hanya memiliki "Delivery Proposal Execute/Manage/Request Quote".
 Ada dua kemungkinan. Tombol gagal setelah diklik (kepercayaan turun), atau orang yang tidak dimaksud bisa menyetujui biaya model.
 Perlu validasi; tombol tidak diklik.
 Render Approve hanya jika izin efektif mengizinkan. Jika tidak, tampilkan "Menunggu persetujuan dari Delivery Approver" beserta nama orangnya.
 Untuk akun tanpa izin approve, tombol Approve tidak muncul di keempat lokasi, dan alasannya terlihat.
#### UX-003 Aksi berdampak tampil sebagai tautan teks kecil
 Kartu di /work.
 "Approve", "Create tickets", "Try again", dan "Continue" memakai gaya yang sama dengan "See what happened" dan "Review": teks hijau setinggi 18 px (target di bawah 24 px). Approve di daftar menyetujui biaya hanya dengan satu klik dari kartu ringkas.
 Aksi yang memicu biaya atau pekerjaan agen dibuat sebagai tombol berlabel kata kerja (tinggi minimal 32 px). Untuk Approve dari daftar, tampilkan ringkasan biaya sebelum konfirmasi.
 Semua target interaktif di kartu minimal 24×24 px, dan aksi berbiaya tidak bisa terpicu tanpa melihat angka biayanya.
#### UX-004 Aksi di detail tidak setara dengan daftar
 Halaman detail sudah punya aksi untuk 4 jenis state (See what happened, Continue, Review breakdown, Approve/Change). Untuk 2 state, aksinya tidak ada: "Planning ended without a plan" (Try again tidak ada) dan "The plan is ready. Break it into tickets" (Create tickets tidak ada; kartunya berupa article dengan tabindex -1).
 Samakan komponen kartu di daftar dan di detail, dari satu sumber data aksi.
 Setiap aksi di kartu /work juga ada di /work/init_{id}.
#### UX-005 Penyebab macet tidak terlihat
 (1) Kartu Brightapp menampilkan "+1 more" sebagai teks statis; kalimat "Konteks asked you something about the plan" hanya ada sebagai teks screen reader dan tidak muncul di detail. (2) Inisiatif "Update UI… sensemaker," berlabel "Nothing is moving", padahal log Updates mencatat "you do not have permission to save a plan in this workspace" dan "skipped the revision (it already revised the plan as often as it may this hour)". (3) Pada hris-frontend-mpp, kartu berbunyi "waiting for your review", padahal blokir sebenarnya adalah repositori yang belum dipilih, yang baru terlihat di dalam drawer Breakdown.
 Pengguna menunggu atau mencoba ulang tanpa tahu apa yang harus diperbaiki.
 Kartu Needs your attention selalu menyebut penyebab terakhir dan satu aksi pemulihan (misalnya "Izin menyimpan rencana ditolak → Minta akses"). "+1 more" dijadikan tombol yang membuka daftar lengkap.
 Untuk setiap state macet, penyebab terakhir dari log tampil di kartu tanpa harus membuka Updates.
#### UX-006 Kartu "Needs your attention" punya tiga gaya visual
 Ada yang memakai border merah dan titik merah (plan gagal maupun plan siap), ada yang border putih (Estimate, Breakdown). CTA-nya kadang tombol solid (Review breakdown, Approve), kadang tautan (See what happened), kadang tidak ada. Waktu tunggu kadang tampil, kadang tidak (hris). Eyebrow-nya juga berbeda: "This initiative · 20h", "From TKT-1 · …", "Breakdown", dan "NEEDS YOU" di sesi agen.
 Buat satu komponen dengan varian semantik: Blocked (danger), Decision (accent), Waiting (netral). Strukturnya tetap: eyebrow, judul, penyebab, satu aksi primer, dan waktu.
 "Plan ready" tidak berwarna danger, dan semua kartu punya waktu tunggu serta tepat satu aksi primer.
#### UX-007 Judul terpotong atau hampir kembar
 "Rental Feature Documentation Objective Create comprehensive…". Dua judul Kitchenly hanya berbeda koma di akhir, dan di 375 px keduanya identik. Modal New initiative tidak punya field judul.
 Judul pendek opsional, atau judul otomatis dari PRD (yang sudah lebih baik, misalnya "Dokumentasi Fitur Pertama Rental"), dengan tanda baca di akhir dipangkas.
 Dua judul mirip tetap bisa dibedakan di 375 px.
#### UX-008 Log Updates belum meringkas pola gagal dan coba lagi
 Pesan identik yang berurutan sudah dikelompokkan ("×6"). Namun di Brightapp, pasangan "could not revise the plan" dan "…is trying again" yang berselang-seling tetap tampil sebagai belasan baris terpisah. Titik hijau di kanan setiap baris tidak dijelaskan.
 Kelompokkan berdasarkan siklus ("Gagal 12× antara 02.12–04.39 · penyebab terakhir: …") dan beri legenda untuk titik.
 Siklus gagal/coba-lagi tampil sebagai satu entri berisi jumlah, rentang waktu, dan penyebab.
#### UX-009 Badge sidebar ikut filter
 Badge berubah dari 7 menjadi 3 saat filter Kitchenly aktif.
 Badge selalu menampilkan total global.
#### UX-010 Default System dan validasi New initiative
 Field System otomatis terisi RecRe (urutan pertama) saat filter All systems. Start aktif walau deskripsi kosong (tidak ada required). Daftar 24 System tidak bisa dicari.
 Default diambil dari filter aktif; jika All systems, biarkan kosong. Start dinonaktifkan sampai deskripsi dan System terisi, dan pilihan System dibuat bisa dicari.
 Dengan All systems, Start nonaktif sampai System dipilih eksplisit.
#### UX-011 Banner koneksi lama
 "RecRe was connected from sari@debian on 9/30/2026" masih tampil 27 hari kemudian, tanpa tombol tutup.
 Banner bisa ditutup atau kedaluwarsa setelah 7 hari.
#### UX-012 Satu Escape menutup dua drawer bertumpuk
 Breakdown → More → View changes → Escape.
 Kedua drawer tertutup sekaligus (jumlah dialog menjadi 0).
 Escape menutup lapisan teratas saja, dan fokus kembali ke drawer Breakdown.
#### UX-013 Status Breakdown saling bertentangan
 Pada RecRe, tampil "✓ Accepted" sekaligus "Quoted, not approved" dan "0 of 1 merged · 1 needs you". Pada hris, TKT-1 berstatus "○ Ready to start" sekaligus "Repository needs to be confirmed". Peringatan "Some tasks do not have one repository…" ditampilkan di kotak hijau netral, bukan warning.
 Satu status utama per tingkat (rencana, tiket) dari mesin status yang sama. Peringatan memakai warna warning dan menyebut tiket mana yang bermasalah.
 Tidak ada tiket yang sekaligus "Ready" dan memiliki blokir.
#### UX-014 Picker repositori tidak difilter per System
 hris (System NUSA - HRIS) → Review breakdown → Choose repository.
 Dropdown VCS connection berisi 19 koneksi pribadi yang dinamai orang ("Gitea Maya", "Gitea Rendra", …). Koneksi yang relevan, "NUSA - Azure HRIS", berada di urutan ke-17.
 Tampilkan dulu koneksi yang terhubung dengan System tersebut, kelompokkan sisanya di bawah "Koneksi lain", dan tandai koneksi milik orang lain.
 Untuk System yang punya koneksi terdaftar, koneksi itu menjadi opsi pertama.
#### UX-015 Form Change pada estimasi
 Form muncul inline tanpa tombol Batal (hanya bisa ditutup dengan klik "Change" lagi, tanpa aria-expanded). Textarea hanya 3 baris (72 px) untuk 1.479 karakter. "Create revised proposal" dan "Approve" sama-sama tombol primer hijau dan terlihat bersamaan. "Decline" berupa tautan merah tanpa penjelasan akibatnya.
 Tambahkan tombol Batal. Saat form terbuka, nonaktifkan Approve. Textarea dibuat bisa membesar otomatis (minimal 8 baris). Decline diberi konfirmasi yang menjelaskan akibatnya.
 Saat form Change terbuka, hanya ada satu tombol primer di layar.
#### UX-016 "Delete System" bersebelahan dengan tautan biasa
 Chip System → ikon pensil → Edit System.
 "Delete System" (merah, 12 px) berada tepat di samping "Open System map", tanpa pemisah.
 Perlu validasi apakah ada konfirmasi (tidak diklik).
 Pindahkan ke zona bahaya terpisah di bagian bawah, dengan konfirmasi ketik-nama dan jumlah inisiatif yang terdampak.
 Delete tidak berada dalam satu baris dengan aksi non-destruktif.
#### UX-017 Create System memilih semua koneksi secara default
 Pada opsi "Discover what we already have", 19 dari 19 koneksi langsung tercentang, termasuk kredensial pribadi rekan. Checkbox dan radio memakai biru bawaan browser (13 px).
 Default hanya koneksi milik pengguna, tambahkan Pilih semua/kosongkan, dan pakai kontrol bertema.
 Koneksi milik orang lain tidak tercentang secara default.
### M03 Sesi agen (/?conversation=…)
Modul ini tidak ditemukan di v1. Pintu masuknya adalah tombol "Details" di kartu estimasi, "Open Engineering session" di menu tiket, dan "Start a session with this Component" di System map. Isinya: transkrip agen, kartu keputusan, stepper siklus (Estimate → Quote → Plan → Delivery → Receipt), composer (lampiran, teks, suara), serta tombol header untuk VCS, System map, dan Session files.
 stepper siklus yang memberi label status pada setiap tahap ("Plan: not started"); disclaimer "Konteks can make mistakes"; sidebar bisa diciutkan menjadi rail dan statusnya diingat.
| ID | Masalah | Severity | Status |
| UX-018 | "Details" memindahkan pengguna ke halaman lain | Medium | Terverifikasi |
| UX-019 | Transkrip membocorkan istilah internal | Medium | Terverifikasi |
| UX-020 | Makna ikon header bertabrakan | Medium | Terverifikasi |
| UX-021 | System map: placeholder "unknown", tanpa garis relasi, muat lambat | Medium | Terverifikasi |
| UX-022 | Diff viewer tanpa nomor baris dan wrap | Low | Terverifikasi |
| UX-023 | Tooltip rail tidak lengkap | Low | Terverifikasi |
| UX-024 | Story Points dipakai seperti mata uang berdesimal | Low | Terverifikasi |
#### UX-018 "Details" memindahkan pengguna ke halaman lain
 Detail RecRe support-be → kartu Estimate → Details.
 URL berpindah ke /?conversation=…&from=work&parent=…, berupa halaman chat penuh dengan header baru ("TKT-1 · Validate and refresh…"), bukan panel rincian estimasi.
 Ubah label menjadi "Buka sesi TKT-1" dengan ikon panah keluar, atau tampilkan rincian estimasi di drawer.
 Label tombol menggambarkan tujuannya; navigasi ke halaman lain ditandai secara visual.
#### UX-019 Transkrip membocorkan istilah internal
 Kalimat agen memuat istilah seperti "staged organization skill", "tool-registration mismatch", "durable transcript", "canonical costed proposal", "delivery authority", dan "Harness status and lifecycle workflows". Setiap pesan menampilkan "30.5s · 990 tokens in · 22 tokens out". Penyetuju ditulis sebagai handle mesin ("sari-20260811-53ad94 approved this delivery"), bukan nama orang. Ada spasi yang hilang ("…clean task state.Because the prior…").
 Terbaca seperti log teknis, sulit dipahami, dan menurunkan kesan produk yang matang.
 Pisahkan dua lapisan: ringkasan untuk manusia (apa yang terjadi, apa keputusannya, apa langkah berikutnya) dan detail teknis di bawah "Lihat jejak agen". Petakan handle ke nama tampilan. Pindahkan token dan durasi ke tooltip.
 Tampilan default transkrip tidak memuat istilah dari daftar kata internal, dan nama penyetuju adalah nama tampilan.
#### UX-020 Makna ikon header bertabrakan
 Ikon gembok berarti koneksi VCS ("gitea · Gitea Sari · …"), bukan privasi. Ikon jaringan yang mirip ikon "share" berarti System map. Paperclip dipakai untuk Session files di header sekaligus Attach file di composer. Target ikon gembok hanya 25×28 px.
 VCS memakai ikon git-branch beserta nama repo dalam bentuk teks; System map memakai ikon "map" atau "network" berlabel; Session files memakai ikon folder.
 Setiap ikon hanya punya satu makna di seluruh aplikasi, dan ikon tanpa teks punya tooltip.
#### UX-021 System map
 Muat 5–8 detik dengan teks "Loading the System map…". Setiap kartu Component menampilkan chip "unknown · unknown". Tidak ada garis penghubung antara node System dan ketiga Component. Repositori yang sedang dikerjakan (recre/support-be) tidak muncul di peta. Kalimat "Reading the catalog is free." terdengar janggal.
 Sembunyikan atribut yang tidak diketahui, atau tampilkan "Belum diklasifikasi" sekali saja. Gambar garis relasi, beri skeleton saat memuat, dan tampilkan juga komponen yang belum dipetakan.
 Tidak ada chip "unknown", dan relasi System–Component tergambar.
#### UX-022 Diff viewer
 Drawer Changes menampilkan diff tanpa nomor baris dan tanpa wrap, sehingga baris panjang terpotong di kanan. Tidak ada pilihan split/unified atau pratinjau Markdown untuk README.
 Tambahkan nomor baris dan toggle wrap. Untuk berkas .md, sediakan tab "Rendered".
 Baris yang lebih lebar dari drawer bisa dibaca utuh tanpa scroll horizontal.
#### UX-023 Tooltip rail tidak lengkap
 Saat sidebar diciutkan, Activities, Work In Progress, Issues, Releases, dan Leaders punya atribut title. Notifications, Customize, Connect a runtime, dan semua runtime tidak punya.
 Semua ikon rail punya tooltip yang muncul saat hover dan fokus.
#### UX-024 Story Points dipakai seperti mata uang berdesimal
 "Up to 2.15 Story Points", "0.52 SP settled on an earlier run", "Settling Story Points", dan saldo "1,009,902.16 SP". Story points lazimnya dipahami tim sebagai ukuran usaha, bukan saldo.
 Jika SP adalah kredit, beri nama yang jelas ("kredit") dan satu presisi desimal yang konsisten. Tampilkan juga padanan rupiah atau dolar saat dibutuhkan.
 Satuan dan presisi sama di Estimate, Breakdown, Usage, dan Payments.
### M01 Activities, M04 Issues, M05 Releases, M06 Leaders
Yang diperiksa: feed dengan Load more (20 entri per halaman, 2 halaman dibuka), aksi Comment yang tersembunyi, filter System, empty state Issues dan Releases, serta peringkat orang dan agen di Leaders, di desktop dan mobile.
 setiap halaman punya subjudul satu kalimat; Activities menampilkan waktu relatif dan absolut; Load more bekerja; Leaders di mobile tetap rapi.
| ID | Masalah | Severity | Status |
| UX-025 | Empty state tanpa langkah lanjut, ilustrasi seragam | Low | Terverifikasi |
| UX-026 | Leaders sulit ditafsirkan | Low | Terverifikasi |
| UX-027 | Feed hanya "started"; Comment tidak terlihat di layar sentuh | Low | Terverifikasi / Indikasi |
#### UX-025 Empty state Issues dan Releases
 Issues ("Nothing is open") dan Releases ("Nothing here yet") memakai ilustrasi bermotif sama (dokumen dan gelombang) tanpa tombol aksi. Subjudul Issues menyebut "by severity", tetapi tidak ada kontrol severity.
 Issues: "Laporkan issue" dan "Hubungkan telemetri" (menuju Customize > Operations). Releases: "Lihat inisiatif yang hampir selesai". Ganti ilustrasi generik dengan ikon kecil yang sesuai konteks.
 Setiap empty state punya minimal satu aksi pengisian data.
#### UX-026 Leaders sulit ditafsirkan
 Tidak ada filter waktu atau System. Subjudul menyebut "Agents and models by value", tetapi Codex bernilai "Not reported" dan hanya menampilkan "31M tokens". Rumus poin hanya ada sebagai teks tersembunyi. Ada tulisan "1 points". Menu bernama "Leaders", URL-nya /leaderboard. Eyebrow PEOPLE berukuran 11 px.
 Tambahkan rentang waktu, legenda rumus poin yang terlihat, metrik yang benar-benar tersedia, dan bentuk tunggal "1 point".
 Rumus poin terbaca tanpa hover, dan peringkat bisa difilter per periode.
 Apakah bobot tertinggi untuk "started" memang disengaja?
#### UX-027 Feed Activities
 Semua entri berbentuk "X started Y"; peristiwa seperti plan ready, ticket stopped, atau estimate siap tidak muncul sebagai entri. Tombol Comment memakai opacity 0 dan baru terlihat saat hover atau fokus.
 Bentuk feed Terverifikasi. Tidak terlihatnya Comment di perangkat sentuh masih Indikasi, karena belum diuji dengan sentuhan nyata.
 Tampilkan peristiwa perubahan state dengan ikon tersendiri, dan biarkan Comment selalu terlihat (minimal sebagai ikon).
 Setiap state yang memunculkan "Needs you" juga muncul di feed.
### M07 Customize (/customize/…)
Yang diperiksa: kesepuluh subbagian; ketujuh tab Access (Overview, People & groups, Roles dengan 16 peran, Resource access, Service accounts, Requests & approvals, Audit); tiga tab Context; detail berkas (Edit File); detail skill dan tool; tab Import skills; form Create Skill, Create Tool, Create MCP, Add File, Add a channel, Request access, Check access, dan Connect a runtime; serta Revoked runtimes dan Workspace runtime policy. Semua form dibatalkan.
 Request access menonaktifkan Submit sampai form terisi; Create Skill menandai field wajib dengan asterisk dan punya pratinjau Markdown; Add a channel memberi payload siap salin per penyedia; skill bawaan menjelaskan "cannot be changed or deleted"; secret disamarkan.
| ID | Masalah | Severity | Status |
| UX-028 | Penanganan read-only tidak konsisten | Medium | Terverifikasi |
| UX-029 | Daftar model 123 opsi, harga ganda | Low | Indikasi |
| UX-030 | VCS: banner izin bertentangan, kartu tanpa detail | Medium | Terverifikasi |
| UX-032 | Routing dan item aktif salah | Medium | Terverifikasi |
| UX-033 | Access: tab terpotong, data kosong yang menyesatkan, pill izin | Medium | Terverifikasi |
| UX-034 | Context: berkas tidak bisa dibuka, ikon tanpa label, konten disamarkan | Medium | Terverifikasi |
| UX-035 | Empat pola "create" yang berbeda | Medium | Terverifikasi |
| UX-036 | Operations: rujukan yang belum ada | Low | Terverifikasi |
| UX-037 | Connectors: status toggle membingungkan | Low | Terverifikasi |
#### UX-028 Penanganan read-only tidak konsisten
 Di Models, keempat select disabled tetapi terlihat aktif, dan pesan "Only a workspace owner can change these." ada di paling bawah, di luar viewport. Di Runtimes, radio Workspace runtime policy tidak disabled, padahal teksnya berbunyi "Only workspace managers can change it." Istilahnya juga berbeda: "owner" vs "managers". Settings > General memakai pola lain lagi ("Only the workspace owner can rename it").
 Satu pola read-only: kontrol disabled dengan gaya terlihat (latar abu dan ikon gembok), pesan izin di atas bagian, serta tautan "Minta akses".
 Semua kontrol yang tidak boleh diubah berstatus disabled dan terlihat berbeda, dan pesan izin terlihat tanpa scroll.
#### UX-029 Daftar model
 123 opsi dalam 6 grup harness. "Opus 5.5 · $5/$25" dan "Claude Opus 5.5 · $4/$20" muncul di grup berbeda, dan nama grup tidak terlihat saat select tertutup.
 Tampilkan harness di label terpilih, sembunyikan model yang tidak cocok, dan tambahkan pencarian.
 Pilihan yang aktif selalu menyebut harness-nya.
#### UX-030 VCS Connectors
 Banner error "You do not have permission for this VCS connector operation" tampil di atas daftar 19 konektor yang semuanya "Connected". Kartu konektor tidak bisa diklik dan tidak punya aksi (detail, uji koneksi, pemilik).
 Sebut aksi yang dibatasi, ubah banner menjadi info read-only, dan sediakan halaman detail konektor (pemilik, System yang memakai, terakhir dipakai).
 Banner tidak tampil sebagai error saat pengguna hanya melihat.
#### UX-032 Routing dan item aktif salah
 (1) Workspace menu → Manage workspace membuka /customize/access?from=work, tetapi subnav menyorot "Runtimes" sementara isinya Access. (2) Pengaturan workspace sebenarnya ada di Settings > General, bukan di tujuan "Manage workspace". (3) URL tak dikenal (/customize/vcs-connectors) menampilkan isi Runtimes tanpa 404. (4) Tab Access tidak mengubah URL, sehingga tidak bisa ditautkan, padahal subbagian Customize bisa. (5) Di mobile, Customize dan Settings menampilkan "Back to Work In Progress" walau pengguna datang langsung dari URL.
 Manage workspace diarahkan ke Settings > General. Item aktif diturunkan dari URL, rute tak dikenal menampilkan 404, setiap tab punya URL, dan tombol kembali hanya muncul jika ada riwayat dari dalam aplikasi.
 Item subnav yang aktif selalu cocok dengan isi halaman.
#### UX-033 Access
 Di lebar 768 px, serta 1024 px dengan sidebar terbuka, tab terpotong ("Re…", "Requ…") dan Audit tersembunyi. Overview menampilkan "Policy revision: 1565 · Membership revision: 1529". People & groups berbunyi "No people to show", padahal Leaders memuat 14 orang aktif. Resource access menampilkan "temporarily unavailable". Roles berisi 16 kartu dengan awan pill izin tanpa pencarian; di Engineering Contributor ada izin yang tercantum ganda (Runtime Execute, Run Read, Agent Profile Read).
 Tab dibungkus ke baris berikutnya atau diberi menu More. Empty state dibedakan dari "tidak punya izin melihat". Roles ditampilkan sebagai matriks peran × kelompok izin yang bisa dicari, dan duplikasi dihapus.
 Delapan tab terlihat di 768 px, dan tidak ada izin yang tercantum dua kali.
#### UX-034 Context
 Tidak ada judul atau deskripsi bagian (berbeda dengan Access dan Models). Baris berkas tidak bisa diklik untuk dilihat. Ikon edit dan hapus baru muncul saat hover dan tidak punya label aksesibilitas. Edit File menyamarkan seluruh isi YAML sebagai titik-titik password, sehingga pengguna harus membuka mata untuk membaca. Tab Repositories meminta nama repo dalam teks bebas tanpa saran, padahal koneksi sudah diketahui. Tab "Skills" di Context berbeda dengan menu Skills di Customize.
 Tambahkan judul bagian, viewer read-only saat baris diklik, label pada tombol ikon, dan masking hanya untuk nilai secret. Nama repo dipilih lewat autocomplete, dan konsep Skills disatukan atau diganti namanya.
 Setiap tombol ikon punya nama yang bisa diakses, dan isi berkas non-secret bisa dibaca tanpa membuka masking.
#### UX-035 Empat pola "create"
 Create Skill memakai modal panjang dengan label bagian uppercase dan asterisk. Create Tool dan Create MCP memakai modal dengan tombol primer aktif walau field wajib kosong. Request access menonaktifkan Submit. Add a channel memakai form inline di halaman. Add File berupa modal tanpa role=dialog. Create MCP punya tombol "?" tanpa label. Tombol "Check access" membuka modal berjudul "Explain and test access". Create Your Workspace memakai gaya yang sama sekali berbeda (lihat UX-043).
 Satu pola form: modal untuk entitas kecil, halaman untuk entitas besar; footer Batal/Primer di kanan; primer nonaktif sampai field wajib valid; judul modal sama dengan label tombol.
 Semua form create memakai komponen modal yang sama dengan role=dialog, aria-modal, dan aturan validasi yang sama.
#### UX-036 Operations
 "This profile can open incidents…" tampil tanpa ada profil. Form channel meminta header "Authorization: Bearer <the secret below>", padahal secret baru dibuat setelah "Create the channel".
 Tampilkan empty state Ops Profiles beserta tautan ke System, dan susun alur channel dalam urutan pilih penyedia → buat → salin secret dan payload.
 Tidak ada instruksi yang merujuk data yang belum ada.
#### UX-037 Connectors
 Tiga toggle menyala, sementara di bawahnya tertulis "No computer of yours can use connections yet". Teks "Connected runtimes" bukan tautan.
 Tampilkan status efektif di samping toggle dan jadikan teks itu tautan.
 Pengguna bisa sampai ke Runtimes dalam satu klik dari empty state.
### M08 Settings (/settings/…), Work Locally, Support, dan workspace
Modul ini tidak ditemukan di v1. Yang diperiksa: General (nama workspace, display name, tema, bahasa), Plan, Usage (termasuk "Why?"), Budgets, Payments (paket dan riwayat pembayaran), panel Work Locally (7 kredensial MCP), dialog Support (dua jalur WhatsApp), Create Your Workspace, dan Manage workspace. Tidak ada yang disimpan; tema dan bahasa tidak diubah.
 Usage menjelaskan selisih saldo dan periode secara jujur; angka di Usage dan Plan memakai monospace rata kanan; Support langsung ke jalur manusia.
| ID | Masalah | Severity | Status |
| UX-039 | Budgets menampilkan kode error mentah "access_denied" | Medium | Terverifikasi |
| UX-040 | Payments: format angka dan mata uang campur aduk, status basi, tabel terpotong di mobile | Medium | Terverifikasi |
| UX-041 | Usage: 46% pemakaian "Not reported", dua jendela waktu, presisi tidak rata | Medium | Terverifikasi |
| UX-042 | Work Locally: bukan dialog, nama token mesin, aksi revoke berdempetan | Medium | Terverifikasi |
| UX-043 | Create Your Workspace memakai bahasa desain berbeda | Low | Terverifikasi |
#### UX-039 Budgets menampilkan error mentah
 Settings → Budgets.
 Satu kartu berisi ikon peringatan dan teks merah "access_denied" di bawah judul "Budget controls".
 Kode internal tampil ke pengguna. Ini salah satu sinyal "slop" paling kuat.
 "Hanya Billing Administrator yang bisa melihat anggaran. Minta akses →". Atau sembunyikan tab Budgets bagi peran tanpa Budget Read.
 Tidak ada string snake_case atau kode error yang tampil di UI.
#### UX-040 Payments
 Harga paket ditulis "Rp 960.000,00" (format Indonesia), sedangkan riwayat untuk nominal yang sama ditulis "IDR 960000.00" (tanpa pemisah ribuan). Judul paket "Team — 2,500 SP" (koma) disertai subjudul "2500 story points" (tanpa pemisah). Tanggal tanpa tahun ("Sep 16, 11:41 AM"). Empat pembayaran berstatus Pending sejak Agustus–September. Di 375 px, kolom Amount dan Status tersembunyi di luar layar tabel (lebar tabel 564 px dalam wadah 341 px). Konten Payments dirender di luar landmark main, sehingga pembaca halaman hanya mendapat teks "Loading".
 Satu formatter mata uang (Intl.NumberFormat id-ID atau en-US, konsisten), tanggal lengkap, kedaluwarsa otomatis atau tombol "Lanjutkan pembayaran" untuk Pending, serta tabel versi mobile berbentuk daftar kartu dengan nominal dan status di baris pertama.
 Nominal yang sama ditulis sama di seluruh halaman, dan status serta nominal terlihat di 375 px tanpa scroll horizontal.
#### UX-041 Usage
 "Not reported" bernilai 8,28 dari total 17,83 SP (46%). "This period Oct 10 to Nov 10" berdampingan dengan "Spent, last 30 days", yaitu dua jendela waktu yang berbeda. Presisi desimal tidak rata (3.38, 2.4, 0.4).
 Samakan jendela dengan periode tagihan (atau beri toggle), selalu 2 desimal, dan tampilkan rincian "Not reported" langsung, bukan di balik "Why?".
 Semua angka SP memakai presisi yang sama, dan total serta periode merujuk jendela waktu yang sama.
#### UX-042 Work Locally
 Panel melayang tanpa role=dialog dan tidak menutup dengan Escape. Nama kredensial berbentuk mesin ("konteks-1790323461602-2v8dv5"). Kedaluwarsa ditulis "Dec 24, 2026" pada kartu atas dan "Expires in 22 days" pada kartu bawah. "Revoke Token" (merah) menempel di samping "Rotate Token". Panel menutupi halaman Settings tanpa backdrop.
 Jadikan dialog atau halaman Settings > Credentials. Beri nama yang dipilih pengguna (default: perangkat dan tanggal), satu format kedaluwarsa, dan konfirmasi untuk Revoke yang dipisah dari Rotate.
 Escape menutup panel, dan setiap kredensial punya nama yang bisa dikenali manusia.
#### UX-043 Create Your Workspace
 Judul Title Case, ikon dekoratif di setiap label (gedung, globe, dokumen), tombol CTA lebar penuh dengan panah, tile ikon di header, dan tanpa tombol Batal. Semua modal lain memakai sentence case dengan footer Batal/Primer di kanan.
 Samakan dengan komponen modal standar.
 Modal ini tidak bisa dibedakan secara gaya dari modal create lain.
### M09 Runtimes dan M10 shell global
Yang diperiksa: daftar runtime di sidebar (expanded dan rail); detail lima runtime dengan status berbeda (bagus-arc Ready, ardian's Mac Not connected, rizky-mac Not accepting work, rf-01 organisasi dengan sesi rekan, yoga-bazzite tanpa harness); daftar perintah "On this computer"; modal Connect a runtime; pengalih workspace; Notifications; menu akun; navigasi keyboard.
 setiap perintah terminal punya deskripsi satu kalimat dan tombol Copy; langkah pemasangan harness bernomor; label aksesibilitas runtime memuat status ("rf-01: Ready. 1 running"); menu akun memakai role=menu.
| ID | Masalah | Severity | Status |
| UX-031 | Status runtime saling bertentangan dan berulang | Medium | Terverifikasi |
| UX-038 | Detail runtime dan Connect a runtime: ikon, warna, jargon | Medium | Terverifikasi |
| UX-044 | Deretan 24 chip System tidak skalabel | Medium | Terverifikasi |
| UX-045 | Fondasi aksesibilitas navigasi | Medium | Terverifikasi |
#### UX-031 Status runtime saling bertentangan
 Customize > Runtimes menulis "19 connected", padahal 8 runtime di daftar berstatus Not connected. Status diulang dalam satu kartu (rizky-mac: "Not accepting work · No live connection · Not accepting work"). Halaman ardian's Mac berstatus "Not connected", tetapi harness Codex di dalamnya "Ready". Pada yoga-bazzite, langkah 2 berjudul "Check again" dan tombolnya juga "Check again". "Open it to update now" tampil di runtime milik orang lain.
 Ganti menjadi "19 terdaftar · 11 siap · 8 offline". Satu status utama per kartu. Status harness diturunkan dari status mesin ("Codex: siap saat komputer online"). Ajakan update hanya ke pemilik.
 Angka ringkasan sama dengan hitungan status di daftar, dan tidak ada label status ganda.
#### UX-038 Detail runtime dan Connect a runtime
 Lima tombol harness hanya berupa ikon 40 px tanpa title, dan statusnya dibedakan lewat warna titik saja (Ready, Unsupported, Not available). Judul "Your sessions" dipakai di runtime milik orang lain. Tidak ada breadcrumb. Ada chevron ">" tanpa label di samping status. Modal Connect a runtime memakai istilah "Workloads", sedangkan kartu runtime memakai "role" ("No role can be served yet"). Deskripsi setiap workload ("cloud-owned Harness planning", "adversarial review") tersembunyi dan penuh jargon. Checkbox memakai biru bawaan browser.
 Label teks di bawah ikon harness, status dalam bentuk teks, "Sesi di runtime ini", breadcrumb Runtimes › nama. Satu istilah (Workloads), deskripsi ditulis untuk manusia dan terlihat, serta kontrol bertema.
 Nama dan status harness terbaca tanpa warna dan tanpa hover.
#### UX-044 Deretan 24 chip System
 Di Activities, Work In Progress, Issues, dan Releases, 24 chip ditambah aksi "New System" ditaruh dalam satu baris yang terpotong ("RecRe…" di 800 px, "my…" di 375 px), tanpa pencarian. Filter tersimpan antarmodul, sehingga chip yang aktif bisa berada di luar layar. Ikon pensil "Edit RecRe" baru muncul di chip yang aktif.
 Combobox berpencarian ("System: Semua ▾") dengan chip aktif berisi tombol hapus. "New System" dipindahkan ke luar grup filter.
 Filter yang aktif selalu terlihat di 375 px dan 1024 px.
#### UX-045 Fondasi aksesibilitas navigasi
 Item navigasi berupa button tanpa href, sehingga tidak bisa dibuka di tab baru. Tidak ada skip link, padahal ada 81 elemen fokus dan sekitar 20 runtime di sidebar sebelum konten. Judul dokumen selalu "Konteks · Governed AI Software Delivery" di semua halaman. Atribut lang selalu "en" walau tersedia bahasa Indonesia. Menu "More" pada tiket tidak memakai role=menu. Tombol tutup di detail skill tidak berlabel. Modal Add File dan Edit File tidak memakai role=dialog.
 Pakai elemen a dengan href dan aria-current. Tambahkan skip link "Lewati ke konten". Judul dokumen dibuat per halaman ("Work In Progress · Konteks"). Atribut lang mengikuti bahasa yang dipilih, dan role ARIA dipakai di semua menu serta dialog.
 Ctrl/Cmd-klik membuka tab baru, Tab pertama memunculkan skip link, dan judul tab browser berubah per halaman.
## Responsif dan aksesibilitas terukur
Tidak ada scroll horizontal di level halaman pada 375, 768, maupun sekitar 1024 px. Masalahnya ada di komponen yang bergulir di dalam wadahnya: tab, chip, dan tabel. Layar tablet adalah yang paling lemah, karena tiga kolom (sidebar, subnav, konten) menghimpit konten menjadi sekitar 280 px.
| Halaman | 375 px | 768 px | Desktop | Catatan |
| Work In Progress | Baik; judul mirip menjadi identik | Baik | Baik | UX-007, UX-044 |
| Detail inisiatif | Baik; nominal estimasi pindah baris | Baik | Baik | Skeleton 5–7 detik |
| Leaders | Baik | Baik | Baik |  |
| Customize > Runtimes | Subnav menjadi deretan tab yang terpotong | Tiga kolom sempit | Baik | UX-032 (tombol kembali palsu) |
| Customize > Access | Tab terpotong | Konten sekitar 280 px, tab "Re…" | Terpotong saat sidebar terbuka | UX-033 |
| Settings > Payments | Kolom Amount dan Status tersembunyi | Baik | Baik | UX-040 |
| Sesi agen | Tidak diuji di 375 px | Tidak diuji | Baik; stepper bergulir horizontal |  |
### Hasil pengukuran aksesibilitas
| Pemeriksaan | Hasil | Status |
| Kontras teks utama | Semua lolos AA (4,61–12,95:1) | Terverifikasi |
| Kontras segmen "Public Git" | 2,6:1, gagal AA | Terverifikasi |
| Kontras border kartu | 1,25:1 | Terverifikasi |
| Target sentuh di bawah 24 px | 9 di /work (aksi kartu setinggi 18 px), checkbox 13 px, ikon VCS 25×28 px | Terverifikasi |
| Skip link | Tidak ada; 81 elemen fokus | Terverifikasi |
| Ring fokus | Terlihat (2 px) pada komponen standar | Terverifikasi |
| Escape dan pengembalian fokus | Baik di drawer; gagal di Work Locally; menutup dua lapis sekaligus di drawer bertumpuk | Terverifikasi |
| Tombol ikon tanpa nama | Edit/hapus di Context, tutup di detail skill, "?" di Create MCP | Terverifikasi |
| Role dialog/menu | Tidak ada di Add File, Edit File, Work Locally, dan menu More tiket | Terverifikasi |
| Judul dokumen per halaman | Tidak ada; selalu sama | Terverifikasi |
| Status bergantung pada warna | Titik status runtime, harness, dan kartu perhatian | Terverifikasi |
| Dark mode | Ada token .dark, tetapi tidak diuji karena perlu mengubah pengaturan tema | Belum diuji |
| Screen reader nyata | Tidak diuji; penilaian berdasarkan pohon aksesibilitas | Belum diuji |
## Roadmap perbaikan menuju tampilan well-produced
Urutannya disusun berdasarkan dampak terhadap kepercayaan pengguna, lalu kesan visual. Estimasi effort tidak dicantumkan karena konteks implementasinya belum diketahui.
 (paling berdampak pada kepercayaan)
UX-001, UX-002, UX-005: siapa yang harus bertindak, apakah ia berwenang, dan mengapa pekerjaan macet
UX-013, UX-031, UX-030, UX-037: satu sumber status, tanpa label yang saling bertentangan
UX-039: tidak ada kode error mentah di UI
 (paling berdampak pada kesan anti-slop)
DS-01 skala tipe 5 langkah dengan isi minimal 14 px; DS-02 radius 3 langkah; DS-03 larangan warna di luar token dan accent-color global; DS-09 satu formatter tanggal; DS-07 sentence case di semua tempat
DS-05 pill hanya untuk status; DS-06 satu set ikon dengan satu stroke dan dua ukuran

Kartu "Needs your attention" dengan tiga varian (UX-006, UX-004, UX-003)
Modal dan form create (UX-035, UX-043, UX-015, UX-016)
Read-only dan izin (UX-028)
Tab (DS-08), loading (DS-10), empty state (UX-025, UX-036)

Lapisan ringkasan manusia di transkrip agen (UX-019); satuan kredit (UX-024); format uang dan angka (UX-040, UX-041); istilah tunggal (Workloads, owner/manager)

UX-045 (link, skip link, judul halaman), UX-032 (routing dan item aktif), UX-044 (filter System), UX-033 (tab Access), UX-038 dan UX-020 (ikon), target minimal 24 px

Sisa temuan Low

Satu halaman acak tidak memuat lebih dari 5 ukuran font.
Tidak ada warna di luar token (diperiksa dengan lint).
Tidak ada kontrol bawaan browser yang belum diberi tema.
Tidak ada kode error atau ID mesin yang tampil.
Setiap tanggal memakai formatter yang sama.
Setiap ikon punya satu makna.
Setiap status punya padanan teks.
## Inventaris fitur final
Ada 46 fitur di 10 modul (dihitung per baris tabel). Dalam lingkup yang Anda tetapkan (buka sampai sebelum simpan): 37 sudah dieksplorasi dalam lingkup, 9 sebagian, dan 0 terblokir. "Sebagian" berarti ada interaksi yang masih bisa dibuka dengan aman tetapi belum saya buka, dan semuanya tercantum di kolom terakhir. Aksi yang memang sengaja tidak dijalankan sesuai aturan (simpan, kirim, approve, beli) tidak dihitung sebagai kekurangan.
| ID | Modul | Fitur | Interaksi yang diperiksa | Status | Belum dibuka / sengaja tidak dijalankan |
| M01-F01 | Activities | Feed aktivitas | Normal, filter, Load more ×1, mobile | Dalam lingkup |  |
| M01-F02 | Activities | Comment dan React pada entri | Visibilitas tombol | Sebagian | Form komentar belum dibuka |
| M02-F01 | Work In Progress | Daftar inisiatif | 8 kartu, mobile, tablet | Dalam lingkup | Aksi cepat tidak diklik |
| M02-F02 | Work In Progress | Filter System dan edit System | Pilih, reset, persisten antarmodul, Edit System | Dalam lingkup | Save dan Delete tidak diklik |
| M02-F03 | Work In Progress | Detail inisiatif | 8 detail | Dalam lingkup |  |
| M02-F04 | Work In Progress | Panel PRD | 2 PRD | Dalam lingkup |  |
| M02-F05 | Work In Progress | Breakdown | 2 breakdown, menu More, Who merges, Choose repository | Dalam lingkup | Accept, Confirm, dan radio tidak diklik |
| M02-F06 | Work In Progress | Updates | 3 log | Dalam lingkup |  |
| M02-F07 | Work In Progress | Changes (diff) | Buka, expand berkas | Dalam lingkup |  |
| M02-F08 | Work In Progress | Kartu estimasi | Change (buka/tutup), Models for this delivery, Details | Dalam lingkup | Approve, Decline, Prepare delivery quote |
| M02-F09 | Work In Progress | Catatan (Draft your thinking, Attach, Post note) | Visibilitas tombol | Sebagian | Composer catatan belum difokuskan secara khusus |
| M02-F10 | Work In Progress | New initiative | Buka, ketik, Escape, draf, Cancel | Dalam lingkup | Start, Attach transcript |
| M02-F11 | Work In Progress | Create System | 3 opsi, daftar koneksi | Dalam lingkup | Start; "Change" kedalaman baca |
| M03-F01 | Sesi agen | Transkrip dan stepper | Baca penuh, stepper | Dalam lingkup |  |
| M03-F02 | Sesi agen | System map | Muat, zoom kontrol terlihat | Dalam lingkup | Start a session |
| M03-F03 | Sesi agen | Session files | Popover kosong | Dalam lingkup |  |
| M03-F04 | Sesi agen | Info VCS dan runtime di header | Label | Sebagian | Klik ikon gembok dan chip rf-01 belum dibuka |
| M03-F05 | Sesi agen | Composer | Tombol dan label | Sebagian | "Create text attachment" belum dibuka; kirim pesan sengaja tidak |
| M03-F06 | Sesi agen | View receipt dan Konteks learned | Tombol ada | Sebagian | Belum dibuka |
| M04-F01 | Issues | Daftar issue | Empty state, filter | Dalam lingkup | State berisi data tidak tersedia |
| M05-F01 | Releases | Daftar rilis | Empty state, filter | Dalam lingkup | State berisi data tidak tersedia |
| M06-F01 | Leaders | Peringkat orang | Desktop, mobile | Dalam lingkup |  |
| M06-F02 | Leaders | Peringkat agen |  | Dalam lingkup |  |
| M07-F01 | Customize | Runtimes | Daftar, Revoked (20), policy, Connect a runtime | Dalam lingkup | Continue to installation, ubah policy |
| M07-F02 | Customize | Access | 7 tab, Request access, Check access | Dalam lingkup | Submit dan jalankan Check |
| M07-F03 | Customize | Models | 4 select (read-only), daftar opsi | Dalam lingkup |  |
| M07-F04 | Customize | Context | 3 tab, Edit File, Add File | Dalam lingkup | Save, Delete, Load Repository |
| M07-F05 | Customize | Skills | Daftar, detail, Import skills, Create Skill | Dalam lingkup | Create, Find skills, Evaluate |
| M07-F06 | Customize | Tools | Daftar, detail, Create Tool | Dalam lingkup | Create |
| M07-F07 | Customize | MCPs | Empty, Create MCP | Dalam lingkup | Create |
| M07-F08 | Customize | Connectors | Toggle (dibaca) | Dalam lingkup | Toggle tidak diubah |
| M07-F09 | Customize | VCS Connectors | Daftar, banner | Dalam lingkup |  |
| M07-F10 | Customize | Operations | Add a channel (Datadog) | Dalam lingkup | Create the channel; penyedia lain di dropdown belum dibandingkan |
| M08-F01 | Settings | General | Baca | Dalam lingkup | Save, tema, bahasa |
| M08-F02 | Settings | Plan | Baca | Sebagian | "Compare plans" belum dibuka |
| M08-F03 | Settings | Usage | Baca | Sebagian | "Why?" dan "More detail" belum diexpand |
| M08-F04 | Settings | Budgets | Error state | Dalam lingkup |  |
| M08-F05 | Settings | Payments | Paket, riwayat, mobile | Dalam lingkup | Pilih paket (memulai checkout) |
| M08-F06 | Settings | Work Locally | 7 kredensial, form Generate | Sebagian | "View connections" belum dibuka; Rotate, Revoke, Generate sengaja tidak |
| M08-F07 | Settings | Support | Dialog | Dalam lingkup | Tautan WhatsApp tidak dibuka |
| M09-F01 | Runtimes | Daftar sidebar dan rail | Expanded, collapsed, tooltip | Dalam lingkup | Resize sidebar belum diuji |
| M09-F02 | Runtimes | Detail runtime | 5 runtime, On this computer | Sebagian | "Show 11 commands" belum diexpand; New session sengaja tidak |
| M10-F01 | Shell | Pengalih workspace | Menu, Create Your Workspace, Manage workspace | Dalam lingkup | Create Workspace |
| M10-F02 | Shell | Notifications | Popover | Dalam lingkup |  |
| M10-F03 | Shell | Menu akun | Semua item | Dalam lingkup | Sign Out, ganti bahasa |
| M10-F04 | Shell | Navigasi mobile dan keyboard | Bar bawah, hamburger, Tab order, fokus | Dalam lingkup | Screen reader nyata |
### Untuk putaran berikutnya
Sembilan fitur berstatus "Sebagian" bisa saya tuntaskan secara read-only dalam satu sesi lagi.
Untuk menilai hasil setelah submit (pesan sukses atau error, konfirmasi, dan apakah Approve benar-benar ditolak untuk peran ini), diperlukan workspace uji atau izin per aksi.
Untuk menilai tampilan peran lain, diperlukan login sebagai workspace owner dan Delivery Approver.
Dark mode bisa diuji jika Anda mengizinkan saya mengganti tema di Settings, lalu mengembalikannya.