# Replan Eksekusi: Dual Output Konteks

Tanggal: 2026-08-20
Basis: `docs/plans/2026-08-20-konteks-dual-output-pivot.md`, hasil progres nyata T2–T6.

## Alasan Replan

Task besar T5/T6 repeatedly melewati batas runtime worker sebelum handoff. Root cause bukan kegagalan desain, melainkan unit kerja terlalu besar dan mencampur implementasi, metadata, test, capture, serta review dalam satu pass.

Temuan T6 saat ini:
- 28 komponen visual (`adoptable` + `mockup-coupled`) sudah memiliki registry preview nyata.
- `ComponentsIndexPage` sudah menautkan seluruh 28 detail page.
- Yang belum selesai adalah metadata adopsi (`variants`, `fixtureRef`, `tokenDeps`, `cssFiles`), test seluruh registry/detail, dan docs.

Prinsip replan: **tidak mengulang preview/index yang sudah ada**. Semua task maksimal satu domain/batch kecil, satu tujuan, satu bukti validasi, satu review, satu commit.

## Status Terkini

| Milestone | Status |
|---|---|
| T2 shell katalog + hash router | completed, committed |
| T3 manifest + registry + validator | completed, committed |
| T4 vertical slice | completed, committed |
| T5 CSS account/composer/context/customize/reviews/history/session/new-session/system | completed, committed |
| T5 shell CSS | implemented, approved; commit `561def2` |
| T6 registry preview + index | implemented partial, belum diuji/metadata lengkap |

## Revised Task Graph

### R1 — Stabilize and validate existing T6 preview registry
**Scope:** Tidak mengubah preview kecuali bug yang dibuktikan test.

- Tambah unit test parametrik yang memastikan setiap manifest `adoptable`/`mockup-coupled` punya satu registry preview dan render tanpa uncaught error dalam fixture yang sesuai.
- Tambah E2E smoke parametrik untuk membuka seluruh 28 hash detail; axe scan representative per domain (bukan 28×2 scan yang lambat).
- Acceptance: registry↔manifest tetap 1:1; semua 28 detail dapat dibuka; test hijau.
- Review gate: validator.

### R2 — Metadata adopsi: Account, Composer, Context
**Scope:** `components.json` saja (dan test bila dibutuhkan).

- Isi `variants`, `fixtureRef`, `cssFiles` aktual pasca-T5, `tokenDeps` faktual untuk 9 komponen domain ini.
- Context contract tidak boleh diubah tanpa evidence dari source.
- Acceptance: `verify:manifest` hijau; metadata tiap entry tidak kosong bila konsep itu berlaku; source path CSS benar.
- Review gate: validator.

### R3 — Metadata adopsi: Customize dan Reviews
Sama seperti R2 untuk 7 komponen visual (plus utility preserved-content sebagai metadata utility).

### R4 — Metadata adopsi: Session
Sama seperti R2 untuk 6 komponen visual + `formatTime`; variants harus merepresentasikan status/timeline/quote state yang benar-benar dipreview.

### R5 — Metadata adopsi: Shell dan System
Sama seperti R2 untuk Shell (termasuk catatan provider OverlayLifecycle) dan System Map; internal AppShell tetap exclusion beralasan.

### R6 — Docs AI adoption + README + dist artifacts
- `docs/ai-adoption.md`: cara menemukan komponen, aturan copy layout, CSS/dependensi/provider contract, manifest, verifikasi.
- README: dua entry (`index.html`, `catalog.html`), perintah build/preview.
- Salin `components.json` + ai-adoption doc ke `dist` secara repeatable.
- Review gate: validator audience/actionability.

### R7 — Full validation and close
- `verify:manifest`, typecheck, full unit, full e2e.
- HTTP preview kedua entry tanpa console error.
- Axe catalog: overview/tokens/index + representative detail setiap domain.
- Vite manifest: kode `src/catalog/*` tidak reachable dari entry mockup.
- CSS capture final: baseline-v2 vs final; gunakan ImageMagick AE threshold <=100 pixel sebagai render-noise exception, setiap diff di atas threshold = rework.
- Final validator review, commit milestones yang belum tercommit, git hygiene.

## Execution Rules

1. Satu worker hanya menerima satu R-task.
2. Worker menyimpan artefak sebelum validasi mahal.
3. Validator review dilakukan setelah setiap R-task; task tidak completed tanpa APPROVED.
4. Handoff timeout: baca disk, lalu dispatch follow-up hanya untuk sisa eksplisit—jangan restart.
5. Commit hanya setelah validator APPROVED.
