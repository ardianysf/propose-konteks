# Konteks: UI redesign proposal

Live: https://propose-konteks.vercel.app

The repo holds four parts that each have their own folder, plus the shared components they are built from. Every part ships to its own address.

| Part | Folder | Address | What it is |
|---|---|---|---|
| Landing page | [`landing/`](landing/README.md) | `/` (Home), `/how-it-works`, `/pricing`, `/docs`, `/blog`, plus `/security`, `/about`, `/contact`, `/privacy`, `/terms` | The marketing site. Navbar: Home, Features, Pricing, Docs, Blog. |
| Design system | [`design-system/`](design-system/README.md) | `/design-system` (`#foundations`, `#components`, `#code`) | Pitch, foundations, component catalog, code package. |
| Login & demo app | [`app/`](app/README.md) | `/login` (`#night`, `#split`), `/app` (`#session`, `#releases`, `#runtimes`, …) | The sign-in page and the full demo app with sample data. |
| Components | [`components/`](components/README.md) | (used by all of the above) | Tokens, fonts, component CSS, UI primitives, the View tab, React components, the developer package. |

Supporting folders: [`tools/`](tools/README.md) (build, lint, generators), `docs/` (audit, parity spec, motion, overlays), `site/` (the built output Vercel serves; never edit by hand).

**Building the existing app somewhere else?** Start with [`IMPLEMENTING.md`](IMPLEMENTING.md): it maps every screen to its source file, the data it reads and the components it uses.

## Repository map

```
landing/                 Landing page + marketing pages (Python builders, one HTML template, one JS file)
design-system/           Design-system view: pages/ (overview, foundations, catalog, code), inventory.js, pitch.css, generated/
app/                     Login + demo app: shell/ (router, app chrome), data/ (sample data), login/, pages/ (one file per module)
components/              Shared: tokens/, css/, js/ (ui primitives, composer, View tab), react/, package/ (developer handoff)
tools/                   build_prototype.sh, publish.sh, colour lint, package and zip generators, icon collectors
docs/                    Audit (PDF + Markdown), LIVE_PARITY.md, MOTION.md, overlays.md
site/                    Build output served by Vercel
DESIGN.md                The design system: tokens, type, components, overlay grammar, motion, sound, decisions
PRODUCT.md               Product truth used for design decisions
AUDIT-STATUS.md          Status of every audit finding, with evidence and acceptance criteria
AGENTS.md                Rules for agents applying the redesign to the live codebase (copied from components/package/)
build.sh                 Builds everything into site/
```

## Build

```sh
sh build.sh                 # everything: prototype (design system, login, app) + landing pages, into site/
sh tools/publish.sh         # only the prototype → site/prototype.html, site/code/, site/docs/, site/downloads/
sh landing/build.sh         # only the landing page and marketing pages → site/
```

The design system, login and demo app are one single-file build (`tools/build_prototype.sh` stitches the parts in a fixed order into `.build/prototype.html`); the address decides which view it shows. No dependencies beyond Python 3. The build fails if a raw colour appears outside `components/tokens/tokens.css` (`tools/lint_colors.py`).

## Deploy

`vercel.json` serves `site/` as a static site: no install, no build, clean URLs, rewrites of `/design-system`, `/login` and `/app` to `prototype.html`, and redirects from `/landingpage` and `/index` to `/`, and from `/journal` to `/blog`. Commit the built `site/` with the source change.

## Moving between the four

Every page carries the same "View" tab (`components/js/kx-views.js`) to move between them, with Alt+1…4 as shortcuts; on a phone the demo app lists them in its More drawer. Moves use cross-document view transitions, and the theme carries across.

The redesign keeps every process and flow of app.konteks.io and changes only how it looks and behaves on screen. All data in the demo is synthetic.
