# Landing page

The marketing site at `/` and its pages. Built into `../site/` by `sh landing/build.sh` (or `sh build.sh` at the root).

| File | What it does |
|---|---|
| `landing.html` | The landing page: markup and all its CSS. Placeholders (`/*@@TOKENS@@*/`, `@@HARN:…@@`, `<!--@@JOURNAL@@-->`) are filled by `build.sh`. |
| `landing.js` | Scroll scenes: hero, the eras (Four ways, one job), the work week, theory (Naur), the record, the close. |
| `reveal.js` | Reveal on scroll for headings, paragraphs and groups, shared with the other marketing pages. |
| `pages_build.py` | `/pricing` and `/security`. |
| `site_pages.py` | `/docs`, `/about`, `/contact`, `/privacy`, `/terms`. |
| `journal_build.py`, `journal_data.py` | `/journal` and each entry; the landing page's journal section. |
| `art/` | Isometric era illustrations (`babbage.svg`, `turing.svg`, `pdp.svg`, `chip.svg`) and the scripts that draw them. |
| `assets/`, `fonts/`, `journal-assets/` | Images, the display face (Bricolage), journal covers. |

Shared inputs, from the other parts: `components/tokens/` (fonts, tokens), `app/data/data.js` (agent marks `HARNESS_SVG`), `components/js/kx-views.js` (the View tab).
