# Landing page

The marketing site. Built into `../site/` by `sh landing/build.sh` (or `sh build.sh` at the root). Navbar: Home, Features, Pricing, Docs, Blog.

- **Home (`/`)** tells the main idea: how telling a machine what to do changed (the hero diorama, four rooms from 1843 to today), the same work done differently, and Programming is theory building; then one How it works section that hands off to Features, and the blog.
- **Features (`/features`)** covers everything else: the note-to-receipt demo, one record, the rules, four kinds of session, the agents, enablement.

Both come from `landing.html`: blocks between `<!--@@PAGE:home-->` / `<!--@@PAGE:features-->` and `<!--@@/PAGE-->` go to that page only.

| File | What it does |
|---|---|
| `landing.html` | The landing page: markup and all its CSS. Placeholders (`/*@@TOKENS@@*/`, `@@HARN:…@@`, `<!--@@JOURNAL@@-->`) are filled by `build.sh`. |
| `landing.js` | The diorama tour (Home hero), the note demo (Features hero), the work week, theory (Naur), the loop, the record, the rules, the sessions, the close. Each block runs only when its section is on the page. |
| `reveal.js` | Reveal on scroll for headings, paragraphs and groups, shared with the other marketing pages. |
| `pages_build.py` | `/pricing` and `/security`. |
| `site_pages.py` | `/docs`, `/about`, `/contact`, `/privacy`, `/terms`. |
| `journal_build.py`, `journal_data.py` | `/blog` and each post (formerly `/journal`); the blog section on Home. |
| `art/` | Isometric era illustrations (`babbage.svg`, `turing.svg`, `pdp.svg`, `chip.svg`) and the scripts that draw them. |
| `assets/`, `fonts/`, `journal-assets/` | Images, the display face (Bricolage), journal covers. |

Shared inputs, from the other parts: `components/tokens/` (fonts, tokens), `app/data/data.js` (agent marks `HARNESS_SVG`), `components/js/kx-views.js` (the View tab).
