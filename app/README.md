# Login & demo app

The `/login` and `/app` views. Part of the single prototype build (`tools/build_prototype.sh`); the path decides the view, the hash the screen.

| Folder | What it does |
|---|---|
| `shell/app.js` | Router (`ROUTES`), views and addresses (`VIEW`, `viewUrl`), `render()`, the design-system top bar, font switcher. |
| `shell/app-shell.js` | App state `S`, navigation (`NAV`), `shell()` chrome (sidebar, top bar, phone tab bar), account and workspace menus. |
| `shell/head.html` | The document head of the build. |
| `data/data.js` | All sample data: people, systems, initiatives, runtimes, roles, threads, activity, releases, payments, skills, tools, agent marks. |
| `login/login.js` | The sign-in page and its variants (`#night`, `#split`). |
| `pages/pages-work.js` | Work In Progress and the initiative detail. |
| `pages/pages-more.js` | Session, activities, issues, releases, leaders. |
| `pages/pages-customize.js` | Customize: runtimes, access, models, context, skills, tools, MCPs, connectors, VCS, operations. |
| `pages/pages-settings.js` | Settings: general, plan, usage, budgets, payments. |

Screens are `pageX()` (HTML string) + `bindX()` (handlers). They draw with the primitives in `../components/js/` and the styles in `../components/css/`. The full route-to-file table is in `../IMPLEMENTING.md`.
