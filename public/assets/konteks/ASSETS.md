# Konteks Assets — provenance & checksums

First-party production assets fetched from `app.konteks.io` (verified HTTP 200, `image/png`).
No third-party placeholder marks (spec §5.2). Integrity is enforced by `scripts/verify-assets.mjs`
(`npm run verify:assets`), which checks existence, size > 1 KiB, PNG magic bytes, and the
SHA-256 digests below.

| File | Source URL | SHA-256 | Size (bytes) |
|---|---|---|---|
| `logo-text-main.png` | https://app.konteks.io/logo-text-main.png | `8b9184c695974b42d7644bd7f57e265851068487bbafe669a714ac4fe9621de1` | 1,010,079 |
| `web-topbar-icon-128.png` | https://app.konteks.io/icons/web-topbar-icon-128.png | `01ba84fb7bab229b4a78f5e37cbf135cf25d0aa67ba21156e6afcc74920ccc21` | 18,734 |
| `favicon.png` | https://app.konteks.io/icons/app-icon-180.png (renamed) | `d135066c55ef3a87a1e7cb20797690967332f982fd325d1c0b59fed78fb27061` | 30,489 |
| `empty-sessions.png` | https://app.konteks.io/utility/empty-1.png (Figma final node central empty illustration) | `bbd1e531256e7cee4488c773486349c41018acd706410c14d795c50d152abec6` | 806,071 |
| `empty-results.png` | https://app.konteks.io/utility/empty-4.png (current app Sessions empty page) | `489fa9ae079b8fac19b0ff25a1506d0e6c5e393ae239379e81429499f7b73845` | 482,716 |

Downloaded with `curl -fL --retry 2` on 2026-08-16.
