# Konteks: UI redesign proposal

Live: https://propose-konteks.vercel.app

| Path | What it is |
|---|---|
| `/` | The landing page, with `/pricing`, `/security`, `/docs`, `/journal`, `/about`, `/contact`, `/privacy`, `/terms`. |
| `/design-system` | Pitch, foundations, component catalog and code package (`#foundations`, `#components`, `#code`). |
| `/login` | The sign-in page and its variants (`#night`, `#split`). |
| `/app` | The full demo app with sample data (`#session`, `#releases`, `#runtimes`, …). |

Every page carries the same "View" tab (`site/kx-views.js`) to move between the four, with Alt+1…4 as shortcuts; on a phone the demo app lists them in its More drawer. Old links (`/#components`, `/#work`, `/landingpage`) forward to the new addresses. Moves between views use cross-document view transitions, and the theme carries across.

The redesign keeps every process and flow of app.konteks.io and changes only how it looks and behaves on screen. All data in the demo is synthetic.

## Repository

| Path | Purpose |
|---|---|
| `site/` | What Vercel serves (static, no build step). `index.html` is the landing page (built by `landing-src/build.sh`), `prototype.html` the built prototype served at `/design-system`, `/login` and `/app`; `code/` holds the developer package the Kode page downloads; `docs/` the reference documents; `downloads/konteks-ui-lengkap.zip` the full package (code, documents, prototype). |
| `prototype/` | Source of the prototype: `src/` (tokens, components, pages as plain JS/CSS), `tools/` (package generator, colour lint), `build.sh`, `publish.sh`. |
| `DESIGN.md` | The design system: tokens, type, components, overlay grammar, motion, sound, decisions. |
| `PRODUCT.md` | Product truth used for design decisions. |
| `AGENTS.md` | Rules for coding agents applying the redesign to the live codebase. |
| `AUDIT-STATUS.md` | Status of every finding from the UI/UX audit, with evidence. |
| `docs/` | The UI/UX audit of the live app (`konteks-audit-ui-ux.pdf`, Markdown source `audit-ui-ux.md`, rebuilt with `python3 docs/tools/build_audit_pdf.py`), the live-app parity spec, and the overlay decisions. Names of Systems, people, devices and credentials are anonymised. |

## Update the site

```sh
sh prototype/publish.sh      # rebuilds the prototype into site/prototype.html
(cd landing-src && sh build.sh)   # rebuilds the landing page and its pages into site/
git add -A && git commit -m "Update prototype" && git push
```

`build.sh` fails if a raw colour appears outside `tokens.css` (`tools/lint_colors.py`). The prototype needs no dependencies; Python 3 runs the package generator.

## Deploy

`vercel.json` sets the project to a static site: no install, no build, output `site/`, clean URLs, rewrites of `/design-system`, `/login` and `/app` to `prototype.html`, and a redirect from `/landingpage` to `/`. It overrides the framework settings of the old Vite project, so no dashboard change is needed.
