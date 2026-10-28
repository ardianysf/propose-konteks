# Konteks: UI redesign proposal

Live: https://propose-konteks.vercel.app

| Path | What it is |
|---|---|
| `/` | The UI release prototype: pitch, design system, component catalog, code package, and the full demo app with sample data. |
| `/landingpage` | The marketing landing page from the earlier proposal. |

The redesign keeps every process and flow of app.konteks.io and changes only how it looks and behaves on screen. All data in the demo is synthetic.

## Repository

| Path | Purpose |
|---|---|
| `site/` | What Vercel serves (static, no build step). `index.html` is the built prototype; `code/` holds the developer package the Kode page downloads; `docs/` the reference documents; `downloads/konteks-ui-lengkap.zip` the full package (code, documents, prototype); `landingpage.html` with its assets. |
| `prototype/` | Source of the prototype: `src/` (tokens, components, pages as plain JS/CSS), `tools/` (package generator, colour lint), `build.sh`, `publish.sh`. |
| `DESIGN.md` | The design system: tokens, type, components, overlay grammar, motion, sound, decisions. |
| `PRODUCT.md` | Product truth used for design decisions. |
| `AGENTS.md` | Rules for coding agents applying the redesign to the live codebase. |
| `AUDIT-STATUS.md` | Status of every finding from the UI/UX audit, with evidence. |
| `docs/` | The UI/UX audit of the live app (`konteks-audit-ui-ux.pdf`, Markdown source `audit-ui-ux.md`, rebuilt with `python3 docs/tools/build_audit_pdf.py`), the live-app parity spec, and the overlay decisions. Names of Systems, people, devices and credentials are anonymised. |

## Update the site

```sh
sh prototype/publish.sh   # rebuilds prototype/index.html and copies it to site/
git add -A && git commit -m "Update prototype" && git push
```

`build.sh` fails if a raw colour appears outside `tokens.css` (`tools/lint_colors.py`). The prototype needs no dependencies; Python 3 runs the package generator.

## Deploy

`vercel.json` sets the project to a static site: no install, no build, output `site/`, clean URLs, and `/landingpage` → `landingpage.html`. It overrides the framework settings of the old Vite project, so no dashboard change is needed.
