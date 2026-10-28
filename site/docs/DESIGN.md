---
name: Konteks
description: Governed AI software delivery. A calm, dense work tool where who must act, and why, is always the first thing on screen.
colors:
  accent: "#4F7044"
  accent-hover: "#43603A"
  accent-strong: "#5F8D4E"
  accent-fill: "#8FBF6A"
  accent-soft: "#EEF3E6"
  accent-tint: "#E3EBD6"
  accent-ink: "#3F5C36"
  on-accent: "#FFFFFF"
  bg: "#FAF8EF"
  surface: "#FFFFFF"
  sidebar: "#F1F1E5"
  sunken: "#F5F4EB"
  line: "#E5E7D9"
  line-strong: "#D4D9C5"
  line-input: "#8C9680"
  ink: "#243025"
  ink-2: "#4D644F"
  ink-3: "#5E705E"
  warn: "#9A6212"
  warn-soft: "#FAF0DC"
  danger: "#B3261E"
  danger-soft: "#FBEAE7"
  info: "#2F6F8F"
  info-soft: "#E7F0F4"
  scrim: "rgba(15,21,16,.32)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.011em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  mono-sm:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  r4: "4px"
  r6: "6px"
  r10: "10px"
  full: "9999px"
  circle: "50%"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
components:
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "0 12px"
    height: "32px"
  button-default-hover:
    backgroundColor: "{colors.sunken}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.r6}"
    padding: "0 12px"
    height: "32px"
  button-sm:
    padding: "0 8px"
    height: "26px"
    typography: "{typography.label}"
  button-lg:
    padding: "0 16px"
    height: "38px"
    typography: "{typography.body}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.r6}"
    padding: "0 10px"
    height: "34px"
  input-readonly:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.r6}"
    padding: "0 10px"
    height: "34px"
  switch:
    backgroundColor: "{colors.line-strong}"
    rounded: "{rounded.full}"
    width: "32px"
    height: "18px"
  switch-on:
    backgroundColor: "{colors.accent}"
  tab:
    textColor: "{colors.ink-3}"
    typography: "{typography.body-sm}"
    padding: "10px 0 9px"
  tab-selected:
    textColor: "{colors.ink}"
  segmented:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.r6}"
    padding: "2px"
  segmented-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.r4}"
    padding: "0 10px"
    height: "26px"
  segmented-item-pressed:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  chip-filter:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.r6}"
    padding: "0 10px"
    height: "28px"
  chip-filter-on:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.r4}"
    padding: "0 7px"
    height: "22px"
  count:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-3}"
    typography: "{typography.micro}"
    rounded: "{rounded.r4}"
    padding: "0 5px"
    height: "16px"
  count-hot:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  kbd:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.micro}"
    rounded: "{rounded.r4}"
    padding: "1px 5px"
  avatar:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.micro}"
    rounded: "{rounded.circle}"
    size: "22px"
  reaction:
    backgroundColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.r6}"
    padding: "0 8px"
    height: "24px"
  reaction-pressed:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.r10}"
    padding: "16px"
  summary-strip-cell:
    backgroundColor: "{colors.surface}"
    padding: "12px 16px"
  decision-card-decision:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.r10}"
    padding: "10px 16px"
  decision-card-blocked:
    backgroundColor: "{colors.danger-soft}"
    rounded: "{rounded.r10}"
    padding: "10px 16px"
  decision-card-waiting:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.r10}"
    padding: "10px 16px"
  run-result-failed:
    backgroundColor: "{colors.danger-soft}"
    rounded: "{rounded.r10}"
    padding: "10px 14px"
  initiative-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0 24px"
    height: "52px"
  log-entry:
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "7px 8px"
  harness-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "0 12px"
    height: "34px"
  harness-option-pressed:
    backgroundColor: "{colors.accent-soft}"
  map-node:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.r10}"
    padding: "10px 12px"
    width: "180px"
  map-node-system:
    backgroundColor: "{colors.accent-soft}"
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "0 8px"
    height: "30px"
  nav-item-current:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    padding: "10px 8px"
    width: "240px"
  sidebar-rail:
    width: "56px"
  subnav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "0 10px"
    height: "30px"
    width: "200px"
  subnav-item-current:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  tab-bar-item:
    textColor: "{colors.ink-3}"
    typography: "{typography.micro}"
    padding: "8px 0 6px"
  tab-bar-item-current:
    textColor: "{colors.accent-ink}"
  menu:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.r10}"
    padding: "4px"
  menu-item:
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r4}"
    padding: "6px 8px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    typography: "{typography.micro}"
    rounded: "{rounded.r4}"
    padding: "4px 7px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r10}"
    padding: "10px 12px"
  callout:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "12px 14px"
  banner:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "8px 12px 8px 16px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.r10}"
    width: "440px"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.r10}"
    width: "560px"
  modal-wide:
    width: "760px"
  modal-header:
    typography: "{typography.title}"
    padding: "16px 20px 12px"
  modal-body:
    padding: "16px 20px 20px"
  modal-footer:
    backgroundColor: "{colors.sunken}"
    padding: "12px 20px"
  page-header:
    padding: "24px 24px 16px"
  page-title:
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
  lockrow:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    rounded: "{rounded.r6}"
    padding: "8px 10px"
  danger-zone:
    rounded: "{rounded.r6}"
    padding: "12px 14px"
  settings-section:
    padding: "24px 0"
  setting-row:
    padding: "14px 0"
  package-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r10}"
    padding: "14px"
  package-card-hover:
    backgroundColor: "{colors.accent-soft}"
  ticket:
    backgroundColor: "{colors.surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "10px 12px"
  step-node:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    typography: "{typography.micro}"
    rounded: "{rounded.circle}"
    size: "22px"
  runtime-nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r6}"
    padding: "0 8px"
    height: "28px"
  code-view:
    padding: "0 24px 24px"
  drawer:
    backgroundColor: "{colors.surface}"
    width: "560px"
  drop-zone:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.r10}"
    padding: "20px"
  drop-zone-over:
    backgroundColor: "{colors.accent-soft}"
  attachment:
    backgroundColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.r6}"
    padding: "0 6px 0 10px"
    height: "32px"
  code-block:
    backgroundColor: "{colors.sunken}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.r6}"
    padding: "10px 12px"
---

# Design System: Konteks

## Overview

**Creative North Star: "The Quiet Control Room"**

Konteks is a work tool for people who hand software work to agents and step in only at decision points. The system is convention played straight at Linear-grade craft: a dense list-and-detail shell, hairline structure, one green voice for the single action that matters, and state colours that appear only when something is actually in that state. Nothing is decorative; every coloured pixel answers "who acts, and why".

The ground is a warm matcha off-white with a slightly greener sidebar layer, deep green-black ink, and white working surfaces. Density is high (13–14px body, 28–52px rows) but calm, because hierarchy comes from weight and ink tone rather than size jumps or fills. Money, IDs and code are always in JetBrains Mono so figures read as figures. Light and dark themes are both first-class and share every token name. The redesign changes presentation only: every page, navigation name, field, step and action is the live app's, under the live app's names.

The system explicitly rejects the incumbent drift it replaces: nine type sizes, seven radii, pill-shaped everything, and two status labels that disagree about the same object.

**Key Characteristics:**
- Pinned matcha palette; accent reserved for the primary action and the selected item.
- Amber, red and blue are state, never decoration. Systems and people have no colour of their own.
- Six type sizes (12–28px; body stays 13–14px for density, by product decision), three radii (4/6/10), one 4px spacing scale, three shadows.
- Inter with tabular figures everywhere; JetBrains Mono for IDs, money, commands and diffs, on the same size scale. Both faces ship inside the page.
- Authored stage glyphs: a ring that fills as an initiative moves through the delivery stages.
- Every "needs a decision" surface names the cause and offers one action; every form is one modal pattern; every read-only section is one strip.

## Colors

A restrained warm-green ground, one committed green accent, and three state hues used only for meaning.

### Primary
- **Matcha Leaf** (accent): primary buttons, checked controls, switch on, completed cycle-stepper nodes, the "needs you" count in the sidebar and the mobile tab bar. One per area.
- **Moss Hover** (accent-hover): pressed/hover state of Matcha Leaf only.
- **Fresh Moss** (accent-strong): focus outline, selected-tab underline, ok and "needs a decision" status dots, the Ready runtime dot, active nav and Customize-nav icon, share-bar fill, selected-option check, drop-zone and package-card hover edge, pressed harness and reaction edge, the System node edge on the map, stage-glyph fill for decision and done.
- **Young Shoot** (accent-fill): diff additions (14% mix) and the toast check icon; it becomes the accent in dark theme. Never text on light ground.
- **Mist Green / Sprout Tint** (accent-soft, accent-tint): selected backgrounds (current pitch nav, current Customize-nav item, checked option card, pressed harness and reaction, drop zone on drag-over, package card on hover, System map node, decision-card header, user message bubble, your row in the access matrix) and the avatar fill.
- **Deep Moss Text** (accent-ink): link colour, "ok" status text, current tab-bar label, avatar initials, text on accent-soft.

### Secondary
- **Harbor Blue** (info / info-soft): running and delivering states, connector update-available lines, new-update counts, unread dots, page banners, diff hunk headers, info callouts.

### Tertiary
- **Turmeric** (warn / warn-soft): waiting-too-long, "Not accepting work", "Not in effect yet", provisional and partial-permission states, warn callouts.
- **Chili Red** (danger / danger-soft): blocked, failed, denied, destructive actions and the danger-zone edge (30% mix), form errors, failed run result cards, retry counts in the update log, error states, diff deletions (9% mix).

### Neutral
- **Rice Paper** (bg): page ground, sticky top bars, catalog demo stages, and the text colour on inverted Forest Ink surfaces (tooltips, toasts, skip link).
- **White Sheet** (surface): cards, tables, inputs, menus, popovers, drawers, dialogs, modals, package cards, ticket blocks, map nodes; the current sidebar item.
- **Tea Field** (sidebar): the app sidebar layer only.
- **Sunken Rice** (sunken): group headers, quote blocks, code blocks, traces, read-only fields and read-only strips, segmented track, popover footers, the map canvas, waiting decision header, dialog and modal footers.
- **Hairline / Hairline Strong** (line, line-strong): every divider and container edge; strong for button edges, package cards, step nodes, dashed filter chips, read-only fields and drop zones. Card edges stay quiet on purpose: a card is not a control.
- **Input Edge** (line-input): the edge of anything you type into or toggle (inputs, selects, textareas, the composer, the Markdown editor, option cards, multi-select, the off switch track), 3.09:1 on White Sheet so the field is findable without its shadow (WCAG 1.4.11).
- **Forest Ink** (ink): primary text; the fill of tooltips, toasts, the skip link and the agent tile (inverted).
- **Ink 2 / Ink 3** (ink-2, ink-3): secondary text, then metadata, placeholders, icons and timestamps.
- **Scrim** (scrim): the backdrop under drawers, dialogs and modals; one value in both themes.

Hover and press are translucent ink overlays (4.5% and 8%), not new colours. Dark theme remaps every token: ground #0F1510, surface #161E17, sidebar #121913, sunken #131A14, line #253325, line-strong #33453A, line-input #5E705F, ink #E8EDE8, ink-2 #C2CDC3, ink-3 #9AAA9B, accent #8FBF6A (hover #A3CC83, ink #C5D9A6, dark text on it), warn #E6B366 on #2A2214, danger #EF9A8F on #2E1817, info #7CC4E0 on #14262E, rest shadow rgba(0,0,0,.4); the prototype applies it under `prefers-color-scheme: dark` and `[data-theme="dark"]`, the developer package under `.dark` and `[data-theme="dark"]`.

### Named Rules
**The One Green Voice Rule.** Matcha Leaf fills at most one action per area plus the selected item. A second primary button in the same card is a bug.

**The State Is Meaning Rule.** Amber, red and blue appear only when the object is in that state. Never use them for categories, emphasis or decoration.

**The One Status Truth Rule.** An object shows one status, as dot plus text from one source. Never place two status labels on the same object.

**The Names Not Hues Rule.** A System is a tag with a box icon and its name; a person is one avatar style (Sprout Tint with Deep Moss initials). Neither ever gets a colour of its own, because colour is reserved for state.

## Typography

**Body Font:** Inter by default (with ui-sans-serif, system-ui fallback), weights 400/500/600 (700 only in the brand mark); see the face decision below. No stylistic sets or character variants, so Inter reads as standard Inter. Tabular figures (`font-variant-numeric: tabular-nums`) are applied only to numeric elements (counts, tables, summary figures, estimates, times); on `body` they would widen Inter's hyphen so "rf-01" reads as "rf - 01".
**Mono Font:** JetBrains Mono 400/500 (with ui-monospace, SFMono-Regular fallback), features off.

Both faces are embedded in the page as WOFF2 data URIs (latin subset, SIL OFL 1.1, `font-display: swap`) so the page never falls back to a system face.

**Decision pending: the UI face.** The live app sets its UI in DM Sans; the audit found it used at nine sizes, so the problem was the ramp, not the face. The ramp below is fixed; the face is one token (`--sans`, plus `--mono` for superfamilies) and the Tailwind preset repeats the stack. Candidates, all SIL OFL and embedded in the prototype for side-by-side comparison through the type switcher in the pitch bar:
- **IBM Plex Sans + IBM Plex Mono (recommended):** warm technical character (angled terminals, two-storey g) with its own mono, so IDs, money and commands share one voice with the text; complete tabular figures; slightly wider than Inter.
- **Inter + JetBrains Mono (current default):** the densest and most neutral at 12–13px, but generic, and the mono is a different design.
- **Figtree + JetBrains Mono (smallest change):** geometric and friendly, closest to DM Sans, clearer at small sizes.
- **Geist + Geist Mono:** sharp and Swiss with a matching mono; reads like the dominant developer-tool look and runs cold on the matcha palette.
- **DM Sans:** the live app's face, kept as the reference.

**Character:** One neutral grotesk doing all the work through weight (400/500/600) and ink tone, paired with a mono that marks anything a machine produced or a person pays for.

### Hierarchy
- **Display** (600, 28px, 1.2, -0.022em): document and pitch page titles only.
- **Headline** (600, 20px, 1.3, -0.015em): page-header titles, initiative and detail titles, auth heading, 404 heading, summary-strip figures, package-card figures.
- **Title** (600, 16px): decision-card titles, modal titles, section titles in Customize and Settings, Markdown preview headings, lede paragraphs at 400.
- **Body** (400–500, 13px, 1.5): default text, row titles (500), inputs (16px on phones so iOS does not zoom), chat, notes and comment text, list rows, previews.
- **Heading small** (600, 14px): sticky top-bar titles, card, drawer, empty-state and state headings, group headers; always one step above the 13px body.
- **UI** (400–500, 13px): buttons, tabs, nav, menu items, options, table cells, card body copy, modal and page-header subtitles, callouts, banners, log entries, numbered steps.
- **Label** (500, 12px): metadata, status text, hints, table headers, tags, small buttons, reactions, event lines, read-only strips.
- **Micro** (500–600, 12px; was 12px, removed in the audit pass so no page carries more than five sizes): counts, avatar initials, step numerals, keyboard hints, tooltips, tab-bar labels, runtime status words in the sidebar, "required" markers, sidebar, Customize-nav and catalog group headings.
- **Mono** (400–500): 13px for inline `code` and mono values (money, SP, secrets, key–value fields, Markdown source); 12px inside hints, meta, tags, tables, properties and IDs, and in commands, code blocks, traces and diffs; 12px also inside micro elements (button cost suffix, retry count, key hint); the package-card SP figure at 20px.

Prose blocks cap at 62–68ch.

### Named Rules
**The Six Sizes Rule.** Only 12, 13, 14, 16, 20 and 28px exist, and one app page uses at most five of them. A heading is always larger than the text under it: group headers 13/600 over 12px rows, section titles (h-sub) 16/600 over 13–14px body. A new size needs a system change, not a local style. One documented exception: the sign-in headline, a fluid display size (36–60px) on the one page that persuades rather than operates.

**The Figures Are Mono Rule.** IDs, amounts, SP, commands and file contents are set in JetBrains Mono; counts, durations and version numbers stay Inter with tabular figures.

**The Mono On Scale Rule.** Mono uses the same steps as Inter: 13px inline, 12px inside hints, meta, tags, tables, properties and IDs. It never gets an off-scale size to "look the same" as the sans beside it.

## Layout

A pitch top bar (48px, sticky) sits over either a document column or the app shell: a 240px sidebar (resizable 200–360px by its edge handle, collapsible to a 56px icon rail whose items carry tooltips; both remembered) and a fluid main column. On desktop, top-level pages have no top bar; inner pages get a sticky 52px top bar for the back link, breadcrumb and page-level controls. On mobile the top bar always carries the page name.

Every page is one of three types, and each type has one measure; nothing in a page is narrower or wider than its type allows, so nothing hangs.
- **List pages** (Work In Progress, Issues, Releases, Leaders): a page header block (24px 24px 16px, hairline below) with the title row, subtitle and the System filter, then full-bleed rows with 24px gutters and sticky group headers. Row cells sit in fixed columns so tags, stages, times and actions line up down the list.
- **Stream page** (Activities only): the same header block, then a 720px stream of cards on an avatar rail beside a 300px sticky rail (gap 40px). Below 1100px the rail splits around the stream: what is moving now sits above it, the rest follows it. Work In Progress deliberately does not share this look: it is a queue, Activities is a feed.
- **Detail pages** (initiative, agent session): one centred column, max 760px, 32px between blocks; the header, the attention card, the composer and the thread all share that width. There is no properties rail: the header row already carries System, stage, who acts, wait and driver.
- **Section pages** (Customize, Settings): Customize puts a 200px sticky section nav (labelled "Customize") beside the section, which is the page: its name is the 20px title, so there is one header, not two; content max 960px. Settings keeps its five tabs in the page header and lays each section out in two columns (260px label column, controls), body max 1080px.
Runtime pages split into a fluid main column and a 320px side column. The component catalog is an index (232px, searchable) beside one component at a time, with "Dipakai di aplikasi" listing where it is used and links to those screens; the coverage table is its own view.

Spacing is a 4px scale (4, 8, 12, 16, 24, 32, 48). Component interiors use 8–16px; page gutters 24px desktop, 16px mobile.

Breakpoints: at 1100px split and settings-section layouts stack. At 860px the sidebar becomes a 272px off-canvas drawer, a fixed bottom tab bar appears (main content gains 64px bottom padding and toasts lift above it), the rail and resize handle go away, the Customize nav becomes a native select (max 320px), list rows reflow into two lines (title, then meta), wide tables (runtimes, payments) become stacked card lists, and the catalog index becomes a horizontal strip. All edges respect safe-area insets.

### Dates and Times
One formatter (`fmtDate` / `ago()` in the prototype's ui.js). The visible text is absolute: "Today, 12.40" for today, otherwise "27 Oct 2026, 12.40" with the year always present; the 24-hour clock uses a period. Relative time ("7 hours ago") lives only in the `title` tooltip of the `<time>` element, whose `datetime` carries the ISO value. Durations ("waiting 18m", "1d 3h") are not dates and keep their short form.

### Icons
Lucide only, stroke 1.75, two sizes: 16px for navigation, card and drawer headers, callouts and toasts; 14px everywhere inline (buttons, menus, rows, tags, hints, tables). The mobile tab bar is the one exception at 20px. An icon carries one meaning across the app: `rotate-cw` retry or check again, `repeat` rotate a credential, `hand` request access, `key-round` a credential, `eye` view-only, `triangle-alert` act now or lose it, `sparkles` Skills, `bot` work Konteks did, `plug` connections, `circle-arrow-up` a new version, `activity` the Activities page. System tags carry no icon.

## Elevation & Depth

Hybrid, flat by default. Structure comes from hairlines and the bg / sidebar / surface / sunken tonal layers; shadows are small and green-tinted, and grow only with how far a layer floats.

### Shadow Vocabulary
- **Rest** (`0 1px 2px rgba(36,48,37,.06), 0 1px 1px rgba(36,48,37,.03)`): default buttons and package cards (which are buttons), current nav item, selected segment, decision cards, map nodes, switch thumb.
- **Float** (`0 8px 24px -6px rgba(36,48,37,.16), 0 2px 6px rgba(36,48,37,.06)`): menus, combobox and notifications popovers.
- **Overlay** (`0 24px 56px -12px rgba(36,48,37,.28), 0 4px 12px rgba(36,48,37,.08)`): drawers, dialogs, form modals, toasts, mobile sidebar.

Drawers, dialogs and modals sit over the Scrim. Focus is a 2px Fresh Moss outline at 2px offset, or a 3px Fresh Moss ring at 42% on fields, the composer and the Markdown editor. Overlays enter with `cubic-bezier(.16,1,.3,1)` in 180–280ms and collapse to near zero under reduced motion.

### Named Rules
**The Hairline First Rule.** Separate with a 1px line before reaching for a shadow; cards and tables carry no shadow at rest.

## Shapes

Three radii, by size of thing. **Micro corners (4px)** for anything smaller than a control or living inside one: counts, keyboard hints, tags, token swatches, menu and option items, segmented inner buttons, tooltips, skeleton bars, share bars, focus outlines. **Soft corners (6px)** for every control and control-sized row: buttons, inputs, read-only fields, option cards, chips, reactions, attachments, nav and subnav items, callouts, banners, read-only strips, danger zones, ticket blocks, quote and code blocks, diffs. **Gentle corners (10px)** for containers: cards, panels, tables, menus, popovers, dialogs, form modals, toasts, package cards, decision and run-result cards, map nodes, drop zones, summary strips, empty and error states, the agent tile.

Round shapes are reserved for people and status: avatars, status, runtime and unread dots, stepper, timeline and numbered-step nodes, and the spinner are circles (50%); the switch track (9999px) is the one capsule. The user message bubble keeps 10px corners with a 4px tail corner toward its sender. Borders are 1px hairlines; dashed borders mean "not yet applied or not editable here" (filter chips, offline harness tags, read-only fields, drop zones, empty states).

### Named Rules
**The No Pills Rule.** Tags, counts, chips, reactions and badges are soft rectangles, never capsules. Round shapes mean a person or a status, nothing else.

**The Corner By Size Rule.** Radius follows the object's scale: 4px inside controls, 6px for controls, 10px for containers. A new radius needs a system change.

## Components

### Buttons
Quiet and precise; the primary is rare.
- **Shape:** soft corners (6px), heights 26 / 32 / 38px; icon buttons are square at the same heights.
- **Default:** White Sheet, strong hairline, Rest shadow, 13px/500 text; hover goes Sunken Rice with an ink-3 edge.
- **Primary:** Matcha Leaf fill and border, white text; hover Moss Hover. A count inside it turns translucent white.
- **Ghost:** transparent, ink-2, hover overlay; used for secondary actions and icon buttons.
- **Danger:** default button with red text; hover Chili Red soft fill and red edge.
- **Cost suffix:** a mono 12px amount after a divider (e.g. "Approve · 2.15 SP"), so money is quoted on the button that spends it.
- **Disabled:** 50% opacity, no shadow. **Loading:** inline 14px spinner.

### Chips
- **Filter chip:** 28px, dashed strong hairline, ink-2 label; applied state goes solid on White Sheet. The System filter is one such chip opening a combobox, with Edit and "Show all systems" beside it once a System is chosen.
- **Tag:** 22px micro-corner rectangle, White Sheet, hairline, 12px/500. A System tag leads with a 12px box icon and carries only the System's name, never a colour.
- **Count:** 16px-tall micro-corner box, 12px tabular, Sunken Rice; accent-tinted in a selected tab, Matcha Leaf when it means "needs you".
- **Reaction:** 24px soft-corner chip with emoji and count; pressed goes Mist Green with a Fresh Moss edge.

### Cards / Containers
- **Corner Style:** gentle (10px). **Background:** White Sheet. **Border:** hairline. **Shadow:** none at rest.
- **Header:** 12px 16px with a hairline below, 14px/600 heading, 16px ink-3 icon. **Body:** 16px padding, 12px gap.
- **Summary strip:** one bordered container split into hairline-separated cells (12px 16px): 12px ink-3 label, 20px/600 tabular figure, 12px note. Sits above the table it summarises and is counted from it.
- **Properties:** 96px label column (12px ink-3) beside values; a wide variant (160–240px labels) for plan and access facts.
- **Resource list:** hairline-separated items (12px 16px) with a 32px icon tile, 13px/500 title with inline status, a 12px meta line and one trailing action. The same frame carries skills, tools, context files, credentials (with their action row) and version history (version · note · action).
- **Package card:** a gentle-corner White Sheet button with strong hairline and Rest shadow, 14px padding: 13px/600 name, the Story Points as a 20px mono figure, the Rupiah price in 13px ink-2 and a per-SP hint. Hover takes a Fresh Moss edge on Mist Green; choosing one starts checkout. Cards sit in an auto-fit grid (min 170px, 10px gap).
- **Ticket block:** a soft-corner White Sheet box (10px 12px) inside attention cards and drawers: a header line with the mono ID, the 13px/500 ticket title and its one status, then a 12px mono meta line (SP, repository).

### Inputs / Fields
- **Style:** 34px, White Sheet, input edge (line-input, #8C9680 light / #5E705F dark, at least 3:1 against the surface), soft corners, 14px text, ink-3 placeholder; label 13px/500 above, hint 12px ink-3 below, an 12px ink-3 "required" word after required labels. Textareas grow with their content.
- **Focus:** Fresh Moss border plus 3px focus ring. **Error:** red border, red ring, red hint with icon that says how to fix it. **Disabled:** Sunken Rice, ink-3. **Read-only:** Sunken Rice with a dashed edge and a lock icon.
- **Checkbox / radio:** native controls tinted Matcha Leaf, 16px. **Switch:** 36×20 capsule track in the input edge colour (ink-3 on hover), Deep Moss when on, a 16px knob that slides 16px and stretches to 20px while pressed, 2px focus ring. Disabled at 45% opacity. **Option card:** soft-corner bordered row; checked becomes Fresh Moss edge on Mist Green.
- **Effective-state row:** a switch with its 13px label and 12px help on the left and, on the right, the setting's effective state as one status (dot + word, e.g. "Not in effect yet"), so a toggle that is on but not yet working says so. Rows are hairline-separated with 14px vertical padding.
- **Combobox:** a default-button trigger opening a Float popover with a search row, grouped options (12px/600 group headings, ink-3 secondary text, Fresh Moss check on the selected one) and a Sunken Rice footer.
- **Multi-select:** an inline bordered list with a search row, a "n of m selected" bar with Select all / Clear, checkbox options and a micro-corner owner tag; other people's items are unchecked by default.
- **Secret field:** mono input masked as a password, with reveal and copy icon buttons beside it. Only secrets are masked; ordinary file content stays readable.
- **Key–value editor:** two mono inputs and a remove button per row under a 12px ink-3 header.
- **Markdown editor:** a Sunken Rice toolbar of labelled icon buttons with an Edit / Preview segmented control, a mono source area, and a footer with the character count; focus rings the whole editor.
- **Attachments:** a 1.5px dashed drop zone (gentle corners) that turns Mist Green with a Fresh Moss edge on drag-over, then 32px attachment chips with name, size and remove.
- **Command and code block:** single-line commands in a Sunken Rice 12px mono strip with a ghost Copy button; longer payloads in a code block with a 12px header and a Copy button.

### Navigation
- **Sidebar:** Tea Field layer. Top: workspace switcher (brand mark, workspace name; menu with Manage workspace and Create workspace) and a Notifications icon button with an unread dot. Main nav in the live order and names: Activities, Work In Progress, Issues, Releases, Leaders, Customize; 30px items (13px/500 ink-2, ink-3 icons); the current item lifts to White Sheet with Rest shadow and a Fresh Moss icon; Work In Progress carries the Matcha Leaf "needs you" count. Footer: Collapse and the account button (avatar, name, email).
- **Runtimes, compact:** under a 12px/600 ink-3 "Runtimes" heading with a "+" (Connect a runtime) icon button, one fleet row instead of a row per runtime: a server icon, then a 6px segmented bar (Fresh Moss ready, Turmeric not accepting work, strong hairline not connected; 2px gaps, 4px corners), "6 ready" in 13/600 and one legend line per other state with a matching 6px swatch. The row links to the Runtimes table. In the rail it becomes the icon over a 24px mini bar.
- **Your computer(s):** the user's own runtimes as 30px rows (laptop or monitor icon with the 7px status dot on its corner, the name, the status word right-aligned), then Work Locally (terminal icon, "MCP"). With no computer of their own the row reads "Connect this computer". Groups are 20px apart; rows inside a group 1px apart.
- **Sidebar foot:** the account button and, beside it, the collapse icon button; one row, not two. The account menu opens upward with a header (avatar, name, email, role), then Settings, Language as an EN | ID choice, a divider, Support and Sign out.
- **Account menu:** Settings, Work Locally, the language choice (English / Bahasa Indonesia), Support, Sign Out, in that order.
- **Collapsed rail:** 56px, icons and runtime dots only, labels, counts and headings hidden; every item has a tooltip that opens to its right.
- **Page header:** a 20px/600 title (-0.015em) with its page actions on the same row and a 13px ink-2 subtitle of one sentence; tabs, when the page has them, sit inside the header block 16px below. Inner pages lead with a back link named for where the page was opened from ("Back to Work In Progress", or "Back to Activities" for an initiative opened from Activities, with Activities kept current in the nav) and a 13px ink-3 breadcrumb in the sticky top bar.
- **Customize nav:** under its "Customize" label, the live subtitle ("Where agents run, who may do what, and what they work with.") in 12px ink-3; then a 200px sticky vertical nav of the ten live sections (Runtimes, Access, Models, Context, Skills, Tools, MCPs, Connectors, VCS Connectors, Operations), 30px items with icons; the current item is Mist Green with Deep Moss text and a Fresh Moss icon and always matches the URL. Below 860px it becomes a native select. Optional 12px/600 group headings are used in the component catalog.
- **Tabs:** underline tabs, 13px/500 ink-3; selected is ink with a 2px Fresh Moss underline and an accent-tinted count. One tab style everywhere.
- **Segmented control:** Sunken Rice track; pressed segment is White Sheet with Rest shadow.
- **Mobile:** a fixed bottom tab bar (Activities, Work, Releases, Customize, More; 20px icons over 12px labels, current item Deep Moss, "needs you" count as a Matcha Leaf badge). More slides in the full sidebar, with Issues, Leaders, runtimes and the account, as an off-canvas layer with Overlay shadow.

### Status
Dot plus text, 12px/500: ok (Deep Moss), warn, danger, info, muted (hollow ring). The dot is 7px and always paired with a word. A 6px Harbor Blue dot marks unread items. Avatars have one style: a 22px circle (32px large) in Sprout Tint with 12px/600 Deep Moss initials; groups overlap by 6px with a White Sheet ring. The agent is a 28px Forest Ink tile with a bot icon, never an avatar.

### Data Display
- **Table:** sortable 12px ink-3 headers, 13px cells, numbers right-aligned and tabular, hover overlay on rows; inside a gentle-corner wrapper whose scroll edges show a soft shadow. Below 860px a table is replaced by a card list: hairline-separated items with a mono key and status on top, 12px meta below.
- **Count line:** one 13px line of counts above a list (e.g. "10 registered · 6 ready · 1 not accepting work · 3 not connected · 5 with an update"), each state as dot + words, counted from the list itself. It replaces a multi-cell summary strip wherever the table below already holds the detail.
- **Runtime table:** Runtime (OS icon, 500 name, 12px ink-3 description), Owner (a name, or Organization), Status (one status with a 12px reason or sessions hint), Workloads ("All 7 workloads" / "n of 7"), Connector (mono version with a Harbor Blue "available" line). Rows are focusable and open the runtime. Below 860px the header hides and each row becomes a two-column card: name left, status right, the other cells full width in 12px ink-2.
- **Permission matrix:** a table of roles × permission groups with icon plus hidden text (Fresh Moss check, Turmeric partial, faint dash); your own role's row is Mist Green.
- **Share bar:** a 64×4px micro-corner Hairline track with a Fresh Moss fill and the percentage beside it, for each row's share of the Usage total.
- **Numbered steps:** an ordered list whose items are divided by hairlines (12px vertical padding, 36px indent); each leads with a 22px circle node (1.5px strong hairline, White Sheet, 12px/600 ink-3 numeral), then a 600 title, a 13px ink-2 line and, where the step needs one, its command with Copy. Used for runtime installation, channel setup and the developer package.
- **Cycle stepper:** 18px circle nodes joined by 28px lines, 12px/500 labels with an 12px note (e.g. "2.15 SP"); done is a Matcha Leaf node with a check, current a Fresh Moss edge with the focus ring, failed a red edge. Previous / newer cycle buttons sit beside it.

### Stage Glyph (signature)
A 15px authored SVG: a 1.5px ring whose inner pie fills with delivery progress (planning a quarter, executing two thirds), a solid disc with a check for done, and a ring with an × for blocked. Tone colours the glyph: Fresh Moss for decision and done, blue for running, ink-3 for waiting, red for blocked. It leads every initiative row and release row and always sits next to a text label.

### Decision Card (signature)
The one component that says who acts and why. Gentle-corner White Sheet with Rest shadow; a header strip carries status (dot + text) and wait time; body has a 16px/600 title, a ticket block, a 13px cause line (max 64ch), an optional mono quote block, a permission gate note, the actions and Details.
- **Decision:** header Mist Green, edge mixed toward Fresh Moss; one primary action.
- **Blocked:** header Chili Red soft, red-tinted edge; the recovery action is primary.
- **Waiting:** header Sunken Rice; names the person waited on and offers a nudge.

### Queue Row (Work In Progress)
Work In Progress is a work queue, not a feed: it answers "whose move, how long, how far along", where Activities answers "what happened". One white panel (10px corners, hairline rows) holds every initiative mixed in one list, most recent movement first (shortest wait on top), like a timeline. Whose move is a filter, not a grouping: a segmented control above the panel (All · Needs you · Needs someone else · Agents delivering, each with its count; "Most recent movement first" on the right), and a filter with nothing in it says so with a "Show everything" link. Each row is a grid of a 184px "whose move" column (the mover's avatar and "Your move" / "Sari's move" / "Maya's approval" when the viewer cannot approve an estimate / "Konteks", then "waiting X" whose time turns amber after a day and red after three), a main column (title 14px/600, System tag, blue "N new", the cause line toned by state, then the flow track) and the one action right-aligned (or "Approvers only" behind a lock). Your rows carry the accent on the move label and avatar only. The whole row opens the initiative. No avatar rail, no feed cards, no reactions, no side panel.

### Flow Track (signature)
Plan · Breakdown · Estimate · Delivery · Receipt in 12px: done steps are filled Fresh Moss dots joined by moss lines, the current step is an 11px ring in the row's tone (moss for a decision, red for blocked, ink-3 for waiting, blue and slowly pulsing for a delivery, followed by a small segmented ticket bar: one 12×5px segment per ticket, with the merged count as its tooltip; the cause line already states it in words, moss merged, blue delivering) and named in 600, upcoming steps are hollow. The five steps sit in fixed 140px slots so each step reads as a column down the queue; below 1280px only the current step keeps its name. The step is read from the stage and the cause the row already shows (Planning: Plan, or Breakdown when the breakdown waits; Executing: Estimate until approved, then Delivery).

### Update Log
Entries grouped under 12px/600 ink-3 day headings; each is a 16px icon (Fresh Moss for ok, red for failed), a 13px line and a tabular time with an unread dot. Repeated failures collapse into one disclosure row with a mono ×N count on Chili Red soft, the time span and the last cause; it expands into an indented list behind a hairline.

### Notes, Comments and Agent Chat
- **Composer:** a gentle-corner bordered box with an auto-growing textarea, attach and Post; focus rings the whole box.
- **Comment:** 28px avatar, 13px header (600 name, 12px time), 14px body, reactions and Reply; agent replies use the 28px Forest Ink tile with a bot icon and an "Agent" micro tag; replies indent 38px and long threads fold behind "Show n more replies".
- **Agent chat:** the user's message is a Mist Green bubble on the right; the agent's answer leads with a human summary card, folds its trace into a Sunken Rice disclosure, and marks events with 12px icon lines (Fresh Moss done, red failed).
- **Run result card:** a gentle-corner card with a Chili Red soft header naming what stopped, a 13px body with the cause and a tabular meta line, and its recovery actions.

### System Map
A Sunken Rice canvas with a 16px dot grid and a hairline frame; 180px gentle-corner White Sheet nodes with Rest shadow carry name, mono repo path, status and one action. The System node is Mist Green with a Fresh Moss edge. Hairline relation lines; zoom in / out / reset as small labelled icon buttons top right.

### Harness Selector
A row of 34px soft-corner toggle buttons, each naming the agent harness with a text status (Ready, Needs sign-in, Failed, Not available); the pressed one is Mist Green with a Fresh Moss edge. Availability is always a word, never icon or colour alone.

### Feedback and States
- **Callout:** inline, soft corners, tinted by state (info, warn, danger, or neutral Sunken Rice) with a 16px icon, bold lead, and an optional action.
- **Banner:** page-level, Harbor Wash with an info icon and a dismiss button; for events the person should know about but need not act on.
- **Read-only strip:** one Sunken Rice row above a section the viewer cannot change: soft corners, hairline, 8px 10px, a lock icon, the reason in 12px ink-3 ("Only workspace managers can change it.") and a small default "Request access" button on the right. The section's controls stay visible and disabled beneath it.
- **Locked and error states:** bordered White Sheet panels with a 36px icon tile, a 14px/600 heading that says what happened, a 13px line that says nothing was changed or assumed, and one action. Error states replace raw error codes.
- **Danger zone:** the last block of an edit form, a soft-corner row with an edge mixed 30% toward Chili Red (12px 14px): a 13px/600 name, a 12px ink-2 line saying what is removed and what stays, and a small danger button ending in an ellipsis that opens the typed-name confirmation.
- **404:** a bordered panel with a mono path, 20px/600 heading, where the thing moved, and one primary route out.
- **Empty and loading:** a dashed gentle-corner panel with a Mist Green icon tile that teaches how to fill it; loading uses micro-corner skeleton bars sized like the content.
- **Toast:** inverted Forest Ink, gentle corners, Overlay shadow, bottom right (bottom left while a drawer is open), a Young Shoot check or a red icon with the cause on failure. A toast carries only its message and leaves after about four seconds; it never holds an action.

### Overlays
One question picks the overlay: what is the person doing? Looking at or reviewing an object → **drawer**. Filling in a form or a step and submitting it → **form modal**. Confirming one consequence → **confirm dialog**. Picking or navigating → **menu / popover**. Changing one value of the thing already on screen (a display name, the quote on a decision card, a note) happens **inline**, with no overlay at all. An overlay never switches kind halfway through a task, and a task never jumps from one window to a second window of the same kind.

- **Drawer** (inspect, review): right side, 560px, or 760px wide for content that needs the room (Changes, System map, Work Locally). Header 52px min with title, optional 13px line and close; scroll body; Sunken Rice footer, items centred. Drawers stack (a session opened from a Breakdown opens over it); a stacked layer gets a transparent scrim so the page does not darken twice. Used for: PRD, Breakdown, Updates, Session history, Changes, Also needs you, Edit System, System map, Session files, Repository, Receipt, Usage detail, Revoked runtimes, Work Locally, External Agent Sessions, Support.
- **Form modal** (fill in, submit): the one pattern for every create and request form. 560px (760px wide variant), 6vh from the top, at most 88vh tall, gentle corners, Overlay shadow over the Scrim. Header (52px min, hairline below): a 16px/600 title that matches the button that opened it, an optional 13px ink-2 line, and a ghost close button. The body scrolls (16px 20px 20px, 16px between fields). The Sunken Rice footer holds Cancel and one primary on the right; the primary stays disabled until every required field is valid. **A multi-step form stays one modal:** the header line becomes "Step 1 of 2 · …", the body and footer are swapped in place, and Back replaces Cancel (Connect a runtime). A form needed while a drawer is open opens as a modal on top of it and returns to the drawer (Choose repository over Breakdown, Generate credential over Work Locally). A secret shown once is the last step of the action that made it, never a window of its own. Used for: New initiative, Create System, Connect a runtime, Add a channel (also two steps: provider, then the setup to paste), Add file and Edit file, Generate credential (two steps: access and expiry, then the token shown once), Request access, Check access, Add / Create skill, Create tool, Create MCP, Create text attachment, Create workspace, Choose repository.
- **Confirm dialog** (one consequence): 440px, a title, one sentence of consequence and a Sunken Rice footer with Cancel and the confirm (danger when destructive). Approving spend shows the quote in the dialog and puts the amount on the button ("Approve · 2.15 SP"). A permanent delete asks for the object's name typed back, shown as a micro-corner mono chip, and keeps the confirm disabled until it matches. Actions that are easy to undo do not confirm.
- **Menus and popovers** (pick, navigate): menus are White Sheet with Float shadow, 4px inner padding, micro-corner items and arrow-key navigation, and always sit above drawers and modals; the notifications popover is 360px with a header, unread-dotted items and a Sunken Rice footer; its unread items are exactly what the "Needs you" badge counts. A glance popover (320px) holds one question and one way to answer it ("+1 more" on a row). Tooltips are inverted Forest Ink micro labels on hover and focus.
- **Disclosure and pager:** disclosures and accordions use a rotating chevron; a pager shows "Showing n of m" beside a Show more button.

Escape and the close button close the top layer only. Focus is trapped in the top layer and goes back to the control that opened it.

All overlays enter with `cubic-bezier(.16,1,.3,1)` in 180–280ms and close on Escape, top layer first, returning focus to where it was.

### Code View (catalog)
Every component panel in the catalog has a small "Kode" button in its header. It opens a code view under the demo (hairline above, 0 24px 24px): underline tabs HTML and "CSS · n rules", then a code block (12px mono, no wrap, max 420px) with Copy. The CSS is read from the stylesheet that renders the page, so it cannot drift from what is shown.

### Named Rules
**The One Form Rule.** Every create and edit form is the form modal: title from the button that opened it, Cancel plus one primary, and the primary disabled until the required fields are valid.

**The One Read-Only Rule.** A section the viewer cannot change shows one read-only strip with the reason and Request access, and keeps its controls visible and disabled. Never hide the controls, and never show a raw permission error.

## Do's and Don'ts

### Do:
- **Do** keep Matcha Leaf (#4F7044) to one primary action per area plus the selected item.
- **Do** pair every status dot with a word, and show one status per object.
- **Do** show a System as a tag with the box icon and its name, and a person as the one avatar style.
- **Do** set IDs, money, Story Points and commands in JetBrains Mono at 13px, or 12px inside hints, meta, tags, tables, properties and IDs; keep tabular figures on everywhere else.
- **Do** name the cause and offer exactly one recovery or decision action on every decision card, row, run result and error state.
- **Do** build every create or edit form as the form modal, with the primary disabled until required fields are valid.
- **Do** put one read-only strip with Request access above any section the viewer cannot change.
- **Do** separate with 1px hairlines and tonal layers before adding shadow.
- **Do** define every new colour as a token with both light and dark values.
- **Do** pick the radius by the object's size: 4px inside controls, 6px for controls, 10px for containers.
- **Do** collapse repeated failures into one grouped entry with its count and last cause.

### Don't:
- **Don't** use type sizes outside 11 / 12 / 13 / 14 / 16 / 20 / 28px, in Inter or in mono.
- **Don't** use radii other than 4px (micro), 6px (controls) and 10px (containers); circles are for avatars, status dots and step nodes, and the switch track is the only capsule.
- **Don't** make tags, counts, chips or reactions into pills.
- **Don't** use amber, red or blue for anything that is not that state, and don't give Systems, people or categories a colour.
- **Don't** put two contradicting status labels on one object, or show an Approve action to a role that cannot approve.
- **Don't** put actions such as Undo in a toast; anything that needs a follow-up belongs on the page.
- **Don't** rename or add pages, navigation items, fields or steps; the names are the live app's (Activities, Work In Progress, Issues, Releases, Leaders, Customize; Settings, Work Locally, EN/ID, Support, Sign Out).
- **Don't** add an uppercase eyebrow or kicker above headings; sections are introduced by their heading and one plain sentence.
- **Don't** turn on Inter stylistic sets or character variants, and don't set tabular figures on `body`; apply them to numeric elements only.

## Sign in
The live Backstage page with the Google provider only, set in the product's own mark. The whole viewport is a field of stage glyphs on Rice Paper, one every 32px (28px on phones), drawn on one canvas from the tokens so dark mode follows: queued (a strong-hairline ring at 80%), in progress (the ring with a Young Shoot arc that grows), delivered (a Fresh Moss dot at 42%, popping as it lands), and needs a person (White Sheet glyph, Deep Moss ring, a pulsing focus-green halo). Work moves on its own; a few glyphs at a time wait for a person and are released again. The field fades out around the sign-in card, measured from the card itself, so the words read at any size.
In the clearing, centred: the 32px mark, "Your agents kept working." (clamp 36–60px, 650, −0.035em), one 16px line ("Plans, estimates and deliveries move on their own. The few that need a person are waiting for you."), a 52px primary "Sign in with Google" with the Float shadow, the help line, and a legend of the three states. A footer carries the trust line and the demo control.
Interaction: glyphs swell up to 1.45× near the pointer; a waiting glyph under the pointer shows what it waits for in an inverted tooltip; pressing Sign in releases every waiting glyph into motion and plays the ok tone. Reduced motion draws one still frame.

## Leaders
A ranked list in a gentle-corner White Sheet panel, not a spreadsheet: a sunken header row, then fixed columns (rank 28px, person, Started 72, Contributions 104, Reactions 80, Points 180) so every number lines up. Points show the figure in 13/600 beside a 6px bar scaled to the leader, so distance to the top reads at a glance. Your own row is Mist Green with a "You" tag. The points formula sits under the section title. On a phone the three counts fold into one line under the name and the bar shortens to 64px. Agents and models use the same panel: agent, value (or "Value not reported yet"), tokens.

## Pitch bar
The pitch pages (Pitch, Design system, Komponen, Kode) always show the 48px pitch bar. In the demo app it is hidden by default so the product reads as itself: a 20px pull tab hangs from the top-right corner (the banner and top bar keep 96px clear of it) ("Pitch", chevron) and, on a phone, a "Pitch" button sits in the app's top bar. Showing it adds a hide chevron to the bar; the choice is remembered. Every sticky offset reads `--pb` (48px or 0) so nothing jumps.

## Pitch overview
The Pitch page fills its 1080px column instead of a narrow text column. The headline credits what exists ("Alur yang sama, kini lebih jelas di setiap layar") and the lede names the strengths kept; two actions only: Buka demo (primary) and Baca hasil audit (secondary, opens the audit PDF). The hero stage shows the product itself: the real Work In Progress page in front at 72% of the column with a level-3 shadow, and the initiative detail and Runtimes pages behind it, softened (blur 2.5px, 55% opacity). Each layer renders its page at 1280px and scales to its own width; the stage fades out at the bottom, links to the demo, and is hidden below 861px, where the app would switch to its phone layout. What stays and the principles are definition grids (title 14/600, text 13, a hairline above each item, three columns at 1080px); the initiative and ticket cycles are drawn as step chips joined by chevrons. All demo screens form one sitemap panel whose columns are balanced by content (Masuk with Settings, Kerja, then Customize in two columns).

## Motion
Motion explains state; it never decorates. One authored moment: **Konteks at work** after you post a note or a message. The reply appears where it will live, with a live "Working" pulse, each step landing as it happens (a spinner that becomes a check), the answer streaming in with a caret, then folding the steps into a quiet "4 steps · 3.5s" line. Supporting motion: new messages rise 8px in 260ms; picked skills scale in from .92; overlays enter in 180–280ms and leave faster (120–150ms, ease-in) while dropping out of the layer stack at once; toasts slide out; the "needs you" badge bumps when its number changes; buttons press to .98; the switch knob slides 200ms and stretches while held. Easing `cubic-bezier(.16,1,.3,1)` for arrivals. Under `prefers-reduced-motion` movement collapses to near zero and the pulse and caret stop; state changes stay.

## Sound
Six short tones synthesised with Web Audio, no files, a −20 dB master, never looped: **send** (two rising notes, your note left), **tick** (a step or a pick), **done** (a rising fifth, the agent finished), **needs** (three triangle notes, the agent or a teammate needs you), **ok** (one high note, an action went through; played by success toasts) and **error** (two falling low notes; played by error toasts). One switch turns them off: Settings › General › Sounds (with previews) or the speaker in the pitch bar; the choice is remembered per browser.

## Composer
One composer for notes and the agent session. The textarea grows to 200px; a bar under it holds Attach, "Skill /", the "⌘↵ to send" hint and the primary (Post note or Send). Typing "/" at the start of a word opens a 360px listbox of Skills and Tools (from Customize) filtered as you type; ↑↓ move, Enter or Tab picks, Escape closes. A pick becomes a Mist Green chip above the text and is sent with the message; the agent's reply lists what it used as tags. In the initiative, the composer docks under the last note and stays sticky 12px above the viewport edge (76px on mobile, above the tab bar), so a long thread never pushes it out of reach. Notes are chronological with a day divider (Yesterday · 26 Oct 2026); replies from Konteks are indented under the note they answer.

**Session dock (compact).** In the agent session the dock is two short rows, about 100px in all. The first holds the cycle progress as one pill (current step with its figure, "Cycle 2 of 2", a chevron) and, to its right, the "Konteks can make mistakes" line. The pill opens a popover with the full vertical stepper (Estimate → Quote → Plan → Delivery → Receipt, each with its figure) and a link to the previous cycle; Escape closes it and returns focus to the pill. The second row is the composer in its compact form: text and tools on one line while the message fits one line; as soon as it needs a second line the tools move under the text (Send on the right) so the text gets the full width, and the row returns only when the field is empty again; "⌘↵ to send" moves to the Send button's tooltip and stays as the field's description for screen readers. Under 560px the tools drop under the text. Chosen over a progress strip under the top bar and a side rail (28 Oct 2026).

## Decisions (28 Oct 2026)
- Activities is a timeline, not a table: newest first on a rail of avatars; every entry is a person, because agents only answer when a person calls them. Konteks never appears as an actor in the list: its answer (the plan, the estimate, the delivery with its ticket bar, a failure) is a reply inside the card of the person who called it, under a hairline with the Konteks mark, the Agent chip, what it did and its own time. Each card says who did what to which initiative, shows the artifact (the request as written, the estimate, delivery progress), folds that initiative's earlier events of the same day, and carries React, Comment and only the action the viewer can take. A live delivery pulses on the rail and runs its ticket bar; that is the page's one motion. The rail shows Moving now (people who started, approved or asked for a quote in the last 3 hours), Waiting on you (the Work In Progress actions) and Start something (Systems with no initiative; Start opens New initiative with the System chosen), set apart by a 1px accent hairline on a white panel. No composer at the top. Every event kind is one the live app records (the feed's "started", the Updates log's state changes). Below 1100px the rail splits: Moving now and Waiting on you above the feed, Start something after it, and New initiative moves into the page head so starting is never below the feed.
- Agents on a runtime are square 44px tiles with a 28px mark: the vendor's official mark (white SVGs supplied by the team, inlined in `HARNESS_SVG` and drawn in currentColor so they follow light and dark; Claude Code, Codex, DeepSeek, OpenCode, Antigravity; each view box cropped to the mark and squared so all marks share one optical size) or a neutral two-letter mark for an agent without one, with a status badge whose icon carries the state (check, key, x, minus, clock). Name and status are in the accessible name and tooltip, and the selected agent is named in text under the row with its fix command (UX-038).
- Mobile tab bar: the active tab's icon sits in a pill (`--nav-on`, #E3EBD6 light, #2B4230 dark) and its label is accent ink, semibold; More is active on Issues, Leaders, a runtime page and Settings.
- React + Tailwind components ship in `code/react/` (Button, Field/Input/Textarea, Combobox, Menu, Drawer/Modal/Dialog, Composer). They use the preset's `app-*` colours and read the unnamed tokens as `var(--…)`; behaviour matches the prototype (top-layer Escape, focus trap and return, portalled lists that flip). The catalog shows, per component, the prototype's JS and the React source next to HTML and CSS.
- `.field` aligns its rows to the top, so fields side by side line up even when only one has a hint.
- Component catalog: group labels in the side list (Navigasi, Aksi & input, Data…) are uppercase, 12/600, tracked 0.06em, in accent ink, so groups read apart from the items. This is the only uppercase label in the product; eyebrows above headings stay banned.
- Body text is 13px (headings 14/600 and up); 11px removed; six sizes, at most five per page.
- The pitch prototype keeps its typeface switcher. Default Inter; IBM Plex Sans is the recommendation, pending a brand decision.
- Card edges stay quiet (1.25:1) because cards are not controls; control edges use line-input (3.09:1).
- Overlay grammar as in Components › Overlays; Support and Edit System are drawers by that grammar, not dialogs as in live.
- Create System has the live three ways to start (checked live, not submitted).
- Sidebar runtimes are one fleet bar plus Your computer(s) and Work Locally; the full runtime list lives on the Runtimes page. Work Locally's entry point moved from the account menu to the sidebar; the drawer and its flow are unchanged.

- Work In Progress is a queue, not a second feed (28 Oct 2026): after a first pass copied Activities, the user asked for the two pages to read as different purposes. WIP became one panel of queue rows with a "whose move" column and the flow track, no side panel; Activities keeps the avatar rail and feed cards. Later the same day the groups became a filter over one time-ordered list (user).
- One detail page, two origins: an initiative opened from Activities is "#initiative/activities" (live: "?from=activities"); its back link and nav highlight follow the origin.

## Implementation

The developer package lives in `konteks-redesign/code/` and is generated from `konteks-redesign/src/` by `tools/make_package.py` (run through `build.sh`); edit the sources, not the outputs.

- **`tokens.css`:** every token on `:root`, with the dark values under `.dark` and `:root[data-theme="dark"]`. There is no `prefers-color-scheme` query because the live app sets `.dark` itself from Settings › Appearance (System / Light / Dark).
- **`tokens.live-map.css`:** load after `tokens.css`. It fills the variables the live app already reads, in both themes, so existing components take the new palette and radius without a rewrite:
  - `--kx-canvas`, `--kx-raised`, `--kx-sidebar-bg` → bg, surface, sidebar; `--kx-primary`, `--kx-secondary`, `--kx-muted`, `--kx-muted-text-aa` → ink, ink-2, ink-3; `--kx-border` → line.
  - `--kx-accent-solid-aa`, `--kx-accent-solid-ink`, `--kx-accent-text-aa`, `--kx-accent-strong`, `--kx-pale`, `--kx-accent`, `--kx-accent-fill-ink` → accent, on-accent, accent-ink, accent-strong, accent-soft, accent-fill, ink.
  - `--kx-attention`, `--kx-danger`, `--kx-second`, `--kx-second-text-aa`, `--kx-second-solid-aa`, `--kx-second-pale`, `--kx-second-border` → warn, danger, info, info-soft, info mixed into line.
  - `--kx-bubble-bg`, `--kx-bubble-border`, `--kx-tech-code-bg`, `--kx-tech-code-border`, `--kx-radius-main`, `--kx-ink-rgb` → accent-tint, line-strong, sunken, line, 10px, the ink RGB triplet.
  - `--color-app-*` as RGB triplets for Tailwind's alpha syntax: `bg`, `card`, `text`, `text-secondary`, `text-tertiary`, `border`, `border-strong`, `accent-soft`, `accent` (accent-tint), `accent-fill`, `accent-strong`, `accent-solid` (accent), `accent-text`, `success`, `warning`, `danger`, `second`, `second-soft`, plus `--app-attention-surface` (warn-soft).
- **`tailwind.preset.js`:** keeps the live `app-*` colour names on those triplets, `darkMode: "class"`, the sans and mono stacks, and collapses font sizes onto the six steps (`text-2xs` lands on 12px), radii onto 4/6/10 (plus full) and shadows onto the three levels.
- **Colour lint:** raw colours (hex, rgb/hsl, color-mix) exist only in `tokens.css`; derived edges and tints are tokens too (`--edge-info/warn/danger`, `--line-danger`, `--line-accent`, `--diff-add/del`, `--on-accent-dim`, `--edge-current`, `--knob`, `--shadow-edge`). `tools/lint_colors.py` fails the prototype build on a raw colour, and `code/.stylelintrc.json` applies the same rule to the live codebase.
- **`components.css`** and **`inventory.csv`:** every catalog component, and every live element and audit finding mapped to its component and demo screen.
