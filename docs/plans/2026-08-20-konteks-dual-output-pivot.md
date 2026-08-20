# Spec: Pivot Konteks ke Dual-Output — Mockup + Design System Reference

Tanggal: 2026-08-20
Status: Approved working spec (hasil Sol plan review 2026-08-20, lihat `.pi/orch/plans/sol-plan-review.md`)
Workflow: feature (sekunder: refactor, documentation)

## 1. Tujuan

Repo Konteks menghasilkan dua artefak dari satu codebase:

1. **Mockup clickable** (`index.html`) — tidak berubah secara visual maupun behavioral.
2. **Design system reference catalog** (`catalog.html`) — dokumentasi design system yang hidup: token, komponen, kontrak API, dan panduan adopsi, dioptimalkan untuk konsumsi oleh AI agent lain (source-first, bukan npm package).

Prinsip: katalog adalah **konsumer** komponen produksi (`src/components/`), bukan pemilik salinan. Single source of truth dijaga.

## 2. Keputusan Desain (resolusi blocker Sol review)

| # | Blocker Sol | Keputusan |
|---|---|---|
| A | Coverage katalog | Semua 29 file `.tsx` produksi di `src/components/` masuk manifest dengan klasifikasi (tabel §4). Detail page wajib untuk `adoptable` + `mockup-coupled` (28 komponen). `internal` (AppShell) dicatat dengan alasan. 3 helper `.ts` masuk manifest sebagai `utility` tanpa detail page. Pages (`src/pages/`) bukan entri katalog; ditampilkan sebagai contoh komposisi di halaman overview. |
| B | Source of truth props | **TypeScript authoritative.** Manifest hanya menyimpan metadata yang tidak ada di type system (deskripsi, contoh, token deps, coupling). `verify:manifest` memakai TS Compiler API (typescript sudah devDep — nol dependency baru) untuk memastikan: path ada, ekspor ada, nama prop terdokumentasi benar-benar ada di props interface. Tidak ada klaim anti-drift penuh. |
| C | Definisi "ter-ekspor" | Kontrak ekspor = **ekspor dari file sumber komponen** (konvensi existing: default export; `OverlayLifecycle` = named exports). Field manifest `exportName`. Tidak membuat barrel baru (mengubah grafik import mockup). |
| D | Paritas visual objektif | Protokol capture: sebelum/sesudah per domain, route `new-session` + `session-history` + `session-detail` + varian `?mock=loading`/`?mock=empty`, viewport 1440×900 dan 1200×720, tunggu `document.fonts.ready`, artefak ke `artifacts/css-migration/<domain>/`. Perbandingan: **review manual oleh validator dengan sign-off tertulis** — eksplisit BUKAN otomatis; risiko residual dicatat. |
| E | Validasi build | Kedua entry diuji lewat HTTP (`vite preview`), cek console error, bukan `file://`. |

Keputusan tambahan (dari temuan Sol non-blocker):

- **Hash router katalog**: kontrak route `#/` (overview), `#/tokens`, `#/components`, `#/components/<slug>`; hash tak dikenal → halaman not-found terdokumentasi; deep-link reload + back/forward wajib bekerja. Parser hash murni + unit test.
- **Dua lapis data katalog**: `src/catalog/components.json` (metadata machine-readable, untuk AI) + TS registry di `src/catalog/registry.tsx` (import komponen, fixture, preview). Validator memastikan ID keduanya 1:1.
- **Token page**: import `tokens.css`, nilai live via `getComputedStyle(document.documentElement)`; daftar nama token (typed) divalidasi `verify:manifest` terhadap definisi `--var` di `tokens.css`.
- **Fixture**: dibolehkan catalog-only (`*.fixture.tsx`, `MockupFixtureProvider`) — bukan salinan implementasi. Pola fixture: render komponen dengan `mockupReducer` asli + initial state yang diketik; komponen mockup-coupled di-preview dalam state terkontrol.
- **CSS ownership**: `.css` per komponen di folder domainnya; boleh `shared-domain.css` untuk style lintas komponen dalam satu domain; `global.css` hanya reset/typography root/focus/scrollbar; selector katalog hanya boleh di `src/catalog/`. Migrasi **satu domain per langkah** dengan visual capture tiap langkah.
- **Urutan eksekusi**: vertical slice dulu (entry + shell + manifest + 2 halaman komponen) → baru migrasi CSS massal → baru isi katalog penuh (rekomendasi F Sol).
- **Bundle isolation**: `build.manifest: true` di vite config; validasi akhir memastikan modul katalog hanya reachable dari entry katalog, dan himpunan modul entry mockup tidak bertambah.
- **Browser**: acceptance Chromium-only (konsisten `playwright.config.ts` existing).
- **Responsive katalog**: target ≥1200px; diuji 1440 & 1200; di bawah itu di luar scope (didokumentasikan).
- **Output dist untuk AI**: `components.json` + `docs/ai-adoption.md` ikut disalin ke `dist/` saat build (script kecil nol-dependency).
- **Dependency**: nol dependency runtime baru; devDependency baru dihindari (TS Compiler API + parser CSS sederhana untuk syntax `--var:` milik repo sendiri cukup).
- **Commit**: satu commit per milestone setelah review (Conventional Commits); tidak ada squash pre-push kecuali diminta pemilik.

## 3. Struktur Target

```
index.html                    # mockup (tidak berubah)
catalog.html                  # entry katalog (baru)
src/catalog/
  main.tsx                    # entry katalog
  router.ts                   # parser + hook hash router (murni, unit-testable)
  CatalogApp.tsx              # shell katalog (nav + route render)
  catalog.css                 # style katalog, namespace .kx-cat-*
  components.json             # manifest metadata (machine-readable)
  registry.tsx                # registry runtime (import + fixture + preview fn)
  pages/                      # OverviewPage, TokensPage, ComponentsIndexPage, ComponentDetailPage, NotFoundPage
  fixtures/                   # MockupFixtureProvider, *.fixture.tsx
scripts/verify-manifest.mjs   # validasi manifest (TS Compiler API)
```

Vite: `build.rollupOptions.input = { main: index.html, catalog: catalog.html }`, `build.manifest: true`.

## 4. Klasifikasi Komponen (dari inventaris 2026-08-20)

**Adoptable** (presentasional, state N — 5 komponen):
`customize/IntegrationsTab` (prop `variant: 'mcp'|'connectors'|'vcs'`), `customize/SkillsTab`, `customize/ToolsTab`, `shell/CollapseIcon` (prop `collapsed: boolean`), `shell/WorkspaceMenu`.

**Mockup-coupled** (state Y — 23 komponen, didokumentasikan dengan catatan coupling + preview via fixture):
- account: `AccountMenu`, `SettingsModal`
- composer: `ComponentMenu`, `Composer`, `ExecutionProfileMenu`, `SessionMode`
- context: `CreateSystemModal`, `ManualRepositoryModal`, `RepositorySelectorModal` (prop `suspended?: boolean`)
- customize: `AgentsTab`, `ContextTab`, `CustomizeModal`
- reviews: `LearnedDrawer`
- session: `SessionDetailComposer`, `SessionHeader`, `SessionQuoteCard`, `SessionStatusBadge`, `SessionTimeline`, `SessionTracker`
- shell: `Sidebar`, `SystemMenu`, `OverlayLifecycle` (coupling type-only; provider menerima `overlay` + `dispatch` via props)
- system: `SystemMapModal`

**Internal** (1, tanpa detail page, alasan dicatat): `shell/AppShell` — orkestrator route/page mockup, tidak bermakna di luar aplikasi.

**Utility** (3 helper `.ts`, entri manifest tanpa detail page): `customize/preservedContent.ts`, `session/formatTime.ts`, `shell/useFocusContainment.ts`.

Catatan penting untuk dokumentasi: mayoritas komponen TIDAK punya props — kontrak API mereka adalah **slice `MockupContext` + action yang mereka dispatch**. Detail page komponen mockup-coupled wajib mendokumentasikan kontrak konteks (state yang dibaca, action yang dikirim), bukan hanya props.

## 5. Acceptance Criteria

1. `npm run build` sukses dan menghasilkan `dist/index.html` + `dist/catalog.html` (+ `components.json` + `ai-adoption.md` di dist).
2. Kedua output diverifikasi via `vite preview` (HTTP): route utama mockup dan overview katalog render tanpa uncaught console error.
3. Kontrak hash router terpenuhi: overview/tokens/index/detail; deep-link reload + back/forward bekerja; hash tak dikenal → not-found; unit test parser lulus.
4. Setiap komponen in-scope (tabel §4) punya tepat satu entri manifest + satu entri registry; eksklusi tercatat dengan alasan.
5. Live preview mengimpor implementasi dari `src/components/`; tidak ada salinan implementasi di `src/catalog/`; fixture/provider dinamai jelas.
6. Setiap detail page menampilkan: live preview (state/varian penting), kontrak API (props atau kontrak konteks), contoh pemakaian, path source, file CSS terkait, dependensi token, klasifikasi coupling.
7. Halaman tokens menampilkan nilai live via computed custom properties; nama token tervalidasi `verify:manifest` terhadap `tokens.css`.
8. `npm run verify:manifest` memvalidasi: schema + versi, path ada, ekspor ada (TS Compiler API), nama prop terdokumentasi ada di deklarasi, manifest↔registry 1:1, tanpa ID duplikat; script punya automated tests.
9. Migrasi CSS selesai sesuai aturan ownership (§2); `components.css` hilang atau sisa global sejati; protokol visual capture per domain dijalankan dengan sign-off validator.
10. Seluruh unit + e2e test existing lulus (penyesuaian mekanis diizinkan, intent tidak berubah).
11. Halaman katalog lolos axe WCAG2AA (overview, tokens, index, detail default state; Chromium; 1440 & 1200); pelanggaran bawaan komponen didokumentasikan sebagai eksklusi bila ada.
12. `docs/ai-adoption.md` ada (kontrak token, aturan salin per komponen termasuk file CSS + dependensi, pola fixture/reducer, penggunaan manifest, langkah verifikasi); README menjelaskan dual-output.
13. Isolasi bundle terbukti via vite build manifest: modul `src/catalog/*` hanya reachable dari entry katalog; himpunan modul entry mockup tidak bertambah.
14. Commit per milestone, Conventional Commits.

## 6. Task Graph

| ID | Task | Dep | Validasi inti |
|---|---|---|---|
| T2 | Dual entry + shell katalog + hash router + not-found + unit & e2e test | T1 (spec ini) | AC1,2,3,10 |
| T3 | Manifest schema v1 + `components.json` penuh + registry + `verify-manifest.mjs` + test validator | T2 | AC4,8 |
| T4 | Vertical slice konten: Overview, Tokens (computed styles), detail page 1 adoptable (`WorkspaceMenu`) + 1 mockup-coupled (`SessionStatusBadge`) + fixture provider | T3 | AC5,6,7,11 |
| T5 | Migrasi CSS per domain (8 domain, incremental, capture per domain) | T4 | AC9,10 |
| T6 | Konten katalog penuh: semua detail page + index page + fixture per domain | T5 | AC4,5,6,11 |
| T7 | Docs adopsi AI + README + salin aset ke dist | T6 | AC1,12 |
| T8 | Validasi penuh: build, preview, semua test, axe, manifest, isolasi bundle | T7 | AC1–13 |
| T9 | Review final + commit per milestone | T8 | AC14 |

T1 = spec ini (selesai). Setiap task melalui worker → validator sebelum dianggap selesai.

## 7. Risiko Residual (diterima)

- Perbandingan visual manual (bukan pixel-diff otomatis) — mitigasi: protokol capture ketat + sign-off tertulis.
- Nama token di typed list bisa drift dari `tokens.css` — mitigasi: `verify:manifest` mengecek keberadaan nama; penambahan token baru tanpa update list akan terdeteksi hanya jika list lama divalidasi ulang (addition tidak auto-terdeteksi — dicatat).
- Axe pada live preview komponen yang di-render di luar konteks aplikasi aslinya bisa memunculkan violation yang tidak muncul di mockup — didokumentasikan sebagai eksklusi bila terjadi.
