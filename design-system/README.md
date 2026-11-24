# Design system

The `/design-system` view: pitch, foundations, component catalog and code package. Part of the single prototype build (`tools/build_prototype.sh`).

| File | What it does |
|---|---|
| `pages/pages-docs.js` | `overview` (the pitch) and `foundations` (colour, type, space, icons, motion with playable specimens). |
| `pages/pages-catalog.js` | `components`: every component with its states and code (HTML, CSS, JS, React). |
| `pages/pages-code.js` | `code`: the developer package and documents to download. |
| `inventory.js` | Every live element mapped to its component, audit finding and demo screen (→ `components/package/inventory.csv`). |
| `pitch.css` | Styles used only by the design-system view. |
| `generated/` | Written by `tools/`: `code-files.js` (package files embedded for the Code page), `icons-used.js` (icon inventory). Do not edit. |

It documents the components in `../components/` and shows screens from `../app/`.
