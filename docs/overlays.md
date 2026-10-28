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
