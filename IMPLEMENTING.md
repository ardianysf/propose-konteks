# Implementing the existing app from this repo

For an agent (or a person) who has to rebuild what is here in another codebase: the landing page, the design system, the login page and the demo app. Everything that exists is listed below with the file that draws it, so nothing has to be rediscovered by clicking around.

Read in this order: `PRODUCT.md` (who it is for), `DESIGN.md` (every token and rule, with reasons), then this file. `docs/LIVE_PARITY.md` lists the live app's flows that the demo keeps exactly.

## How the code is shaped

- **No framework.** Plain JS and CSS, concatenated by `tools/build_prototype.sh` into one HTML file. Every top-level `function` and `const` is global; the build order in that script is the dependency order.
- **A screen is two functions.** `pageX()` returns the screen's HTML as a string; `bindX()` attaches its handlers after it is in the DOM. The router (`app/shell/app.js`, `ROUTES`) maps a route key to `[page, bind, section, title]`.
- **State** lives in one object, `S` (`app/shell/app-shell.js`). A handler changes `S` and calls `render()`.
- **App chrome** comes from `shell(section, title, body, opts)` in `app/shell/app-shell.js`: sidebar, top bar, phone tab bar.
- **Overlays and feedback** come from `components/js/ui.js`: `drawer()`, `modal()`, `modalStep()`, `dialog()`, `menu()`, `popover()`, `toast()`, plus `ic()` for Lucide icons, `fmtDate()`/`relTime()`, `av()` avatars, `sysTag()`, `rtStatus()`.
- **Styling** is only `components/css/components.css` over `components/tokens/tokens.css`. No colour outside the tokens.
- **Data** is synthetic and lives in `app/data/data.js` (people, systems, initiatives, runtimes, roles, threads, activity, releases, payments, skills, tools…).

## Views and addresses

One build serves three views; the path picks the view, the hash picks the screen (`VIEW`, `viewOf`, `viewUrl` in `app/shell/app.js`).

| View | Address | Home route |
|---|---|---|
| Design system | `/design-system#<route>` | `overview` |
| Login | `/login`, `/login#night`, `/login#split` | `login` |
| Demo app | `/app#<route>[/<sub>]` | `work` |

## Every screen

### Login (`app/login/login.js`)

| Route | Functions | Notes |
|---|---|---|
| `login` | `pageLogin`, `bindLogin` | Backstage sign-in with the Google provider; variants `pageLoginNight` (`#night`) and `pageLoginSplit` (`#split`); waiting, busy and error steps (`S.loginStep`). |

### Demo app (`app/pages/`)

| Route | File | Functions |
|---|---|---|
| `work` | `pages-work.js` | `pageWork`, `bindWork` (Work In Progress queue, filters, flow track, approve dialog, new initiative, create/edit system) |
| `initiative` | `pages-work.js` | `pageInitiative`, `bindInitiative` (note, threads, comments, PRD / breakdown / updates / changes drawers) |
| `session` | `pages-more.js` | `pageSession`, `bindSession` |
| `activities` | `pages-more.js` | `pageActivities`, `bindActivities` |
| `issues` | `pages-more.js` | `pageIssues` (+ `bindSysFilter`) |
| `releases`, `release` | `pages-more.js` | `pageReleases`, `bindReleases`, `pageRelease`, `bindRelease` |
| `leaders` | `pages-more.js` | `pageLeaders` |
| `runtimes`, `runtime` | `pages-customize.js` | `pageRuntimes`, `bindRuntimes`, `pageRuntime`, `bindRuntime`, `connectRuntime` |
| `access` | `pages-customize.js` | `pageAccess`, `bindAccess`, `roleDrawer`, `requestAccess` (tabs in `ACCESS_TABS`) |
| `models`, `context`, `skills`, `tools`, `mcps`, `connectors`, `vcs`, `operations` | `pages-customize.js` | `pageModels` … `pageOperations` with their `bind*` |
| `general`, `plan`, `usage`, `budgets`, `payments` | `pages-settings.js` | `pageGeneral` … `pagePayments` with their `bind*` |

The composer (chat input with slash commands and agent replies) is shared: `components/js/composer.js` (`composerHtml`, `bindComposer`).

### Design system (`design-system/pages/`)

| Route | File | Functions |
|---|---|---|
| `overview` | `pages-docs.js` | `pageOverview`, `bindOverview` (the pitch) |
| `foundations` | `pages-docs.js` | `pageFoundations`, `bindDocs` (colour, type, space, icons, motion with playable specimens) |
| `components` | `pages-catalog.js` | `pageComponents`, `bindCatalog` (every component with its states, code in HTML/CSS/JS/React) |
| `code` | `pages-code.js` | `pageCode`, `bindCode` (downloads of the developer package) |

`design-system/inventory.js` maps every live element to its component, audit finding and demo screen; `tools/make_package.py` turns it into `components/package/inventory.csv`.

### Landing and marketing pages (`landing/`)

| Address | Source |
|---|---|
| `/` (Home) | `landing.html` blocks marked `<!--@@PAGE:home-->`: the hero with the room tour: one isometric house of four connected rooms (1843, 1936, 1969, Today; `art/house.svg`, built by `art/house.build.mjs`) and a camera that walks along it, the work week, Programming is theory building, How it works (links to Features), the blog section |
| `/features` | `landing.html` blocks marked `<!--@@PAGE:features-->`: the note-to-receipt demo hero, one record, authority/money/evidence, four kinds of session, five agents, enablement |
| (both) | `landing.js` (every scene guarded by its section), `reveal.js` (reveal on scroll); `build.sh` writes both pages from the one template |
| `/pricing`, `/security` | `pages_build.py` |
| `/docs`, `/about`, `/contact`, `/privacy`, `/terms` | `site_pages.py` |
| `/blog`, `/blog/<slug>` (was `/journal`) | `journal_build.py` + `journal_data.py` (entries), `journal-assets/` (covers) |

## Order to rebuild in

1. **Tokens and fonts** (`components/tokens/`). Copy the values; do not invent new ones.
2. **Base and components CSS** (`components/css/`), or the React versions in `components/react/` (Button, Field/Input, Combobox, Menu, Overlay, Composer, Activity, Queue, FlowTrack, Avatar, Reactions).
3. **Primitives**: overlays, toasts, menus, icons, dates (`components/js/ui.js`), the composer (`components/js/composer.js`).
4. **App shell and router** (`app/shell/`), with the sample data model (`app/data/data.js`).
5. **Login** (`app/login/`), then the **app modules** in this order: Work In Progress → initiative → activities/session/issues/releases → Customize → Settings.
6. **Design system view** (`design-system/`), which documents everything above.
7. **Landing** (`landing/`), which reuses the tokens and the agent marks in `app/data/data.js` (`HARNESS_SVG`).

## Checking your copy

- Open the reference at `/app#<route>` (or `.build/prototype.html` after `sh tools/build_prototype.sh`) next to yours, at 1440 and 375 px, light and dark.
- Every row of `components/package/inventory.csv` for a screen is satisfied; finding IDs (UX-0xx, DS-0x) point to acceptance criteria in `AUDIT-STATUS.md`.
- Keyboard: Tab reaches every control, Escape closes one layer at a time, focus returns to the trigger.
- Motion follows `docs/MOTION.md`; overlays follow `docs/overlays.md`.
