# Landingpage redesign — Paper Harbor (approved direction)

Approved by owner 2026-09-09. Source page: `docs/New Konteks/Konteks_ People lead the vision. Agents do the rest..html` (saved konteks.io, dark). Content inventory (source of truth, verbatim): `.pi/orch/plans/landingpage-content-inventory.txt`. Original HTML may be consulted for hrefs, the K-mark logo SVG, and the two figure aria-labels.

## Deliverable
New standalone static page `landingpage.html` at repo root, served at `/landingpage`:
- `vite.config.ts`: add `landingpage` to `rollupOptions.input`; extend the existing rewrite middleware so exactly `/landingpage` (not subpaths) serves `/landingpage.html` in dev AND preview servers.
- `vercel.json`: add rewrites `/landingpage` → `/landingpage.html`.
- Do NOT touch the app, catalog, or `src/styles/tokens.css`. All styles are scoped inside the page with `lp-` class prefix. No build-time imports; fonts via Google Fonts `<link>`.

## Direction contract (embed as HTML comment, first child of <body>)
THESIS: Konteks is a harbor: people hold the light, agents crew the boats. Refuses the generic dev-tool hero (gradient + screenshot).
OWN-WORLD: Warm Enterprise tokens only (cream `#faf8ef`, ink sage `#243025`, accent `#8fbf6a`/`#4f7044`, amber `#9a6212`, plum/teal only inside illustration cameos); hand-drawn line-art paper boats, lighthouse, waterline; Baloo 2 display; pill CTAs; rotated proof cards.
STORY: visitor understands people-led/agent-run in one viewport, believes via rules+receipts, acts via Start building.
FIRST VIEWPORT: deep-sage harbor scene full-bleed; cream line-art lighthouse left, paper-boat note sailing a dashed route through five station pills (Write→Plan→Build→Check→Watch, PEOPLE then AGENTS labels); H1 in Baloo 2 cream, two-line; pill CTAs; three pillar chips (Authority/Money/Evidence) overlapping the waterline edge.
FORM: playful marketing one-pager, Persuade mode, light+dark.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Palette (embed BOTH theme blocks; copy exact values from `src/styles/tokens.css`)
`:root` light + `[data-theme='dark']`. Use: --kx-canvas, -raised, -primary, -secondary, -muted, -muted-text-aa, -accent-text-aa, -accent-solid-aa, -accent-segment-aa, -border, -pale, -accent, -accent-strong, -accent-solid-ink, -accent-fill-ink, -attention, -danger, plum `--kx-system-map-container` (#7c5cbf/#b9a0e8), teal `--kx-system-map-component` (#2f6f8f/#7cc4e0) — plum/teal ONLY inside SVG illustration accents (Franklin-style collage shapes), never text/backgrounds. AA pairs (both themes, from tokens comments): cream `--kx-primary`(dark) on `#243025`; ink `#243025` on `#8fbf6a`; white on `#4f7044`; `--kx-accent-text-aa` on canvas/pale; `--kx-attention` light `#9a6212`/dark `#e6b366` on canvas.

## Type (Google Fonts link: Baloo+2:wght@500;700;800 | DM+Sans:wght@400;500;700 | Caveat:wght@500;600 | JetBrains+Mono:wght@400;500)
- Display: Baloo 2 700/800. H1 clamp(44px…76px)/1.04; H2 clamp(30px…48px)/1.08; card H3 20–24px.
- Body/UI: DM Sans 400/500/700. Body 16px/1.65 (max 65–75ch), lede 18–20px.
- Handwritten: Caveat — ONLY human marks (Naur attribution, journal signature, small margin notes on proof cards) per Franklin.
- Mono: JetBrains Mono — terminal receipt, endpoint/transport values, ONLY data (never costume).
- Uppercase only small nav/labels 11–12px +0.08–0.14em. Tabular nums on numerals.

## Theme
Light default. Pre-paint inline script in <head>: read localStorage `konteks-theme` → `system` fallback → set `documentElement.dataset.theme` (same as catalog). Nav toggle button (sun/moon SVG), persists to same key. No flash.

## Section plan (ALL copy verbatim from inventory; nothing omitted, nothing invented)
1. **Nav** (sticky): K-mark logo SVG (lift from original), "Konteks" + "Beta" chip, links: Product, How it works, Four kinds of session, Enablement, Pricing, Docs, Journal; right: "ID" ghost button, "Start building ↗" pill. Theme toggle.
2. **Hero — The Harbor** (deep-sage `#243025` full-bleed, light AND dark): eyebrow "The AI control plane for software engineering" (small cream caps); H1 two lines; lede paragraph; CTAs "Start building ↗" (accent pill `#8fbf6a` ink text) + "See how it works ↓" (outlined cream pill); three pillar chips row (Authority/Money/Evidence + their one-liners) as cream-outline cards overlapping hero bottom; SVG scene: lighthouse (person = the light), paper-boat note on dashed sailing route through 5 interactive station pills (role=button tabindex=0, aria-label from original fig 1: "A note becomes a boat. Write, Plan, Build, Check, Watch."), PEOPLE under Write, AGENTS under rest; oversized cropped collage shapes in pale/plum/teal at low prominence; sparkle pulse animation (motion-safe). Copy: hero paragraph verbatim.
3. **2026 — Before/Now ledger**: sticker badge "2026" (slight rotation); H2 "The year the paradigm changed."; two-column ledger, 11 rows verbatim. "Before" muted + amber attention strike feel; "Now" ink + accent; hand-drawn arrow motif between columns.
4. **Theory — the paper note**: eyebrow "What is left for people"; H2 "Programming is theory building."; Naur quote as a rotated (-2°) paper-note card on raised surface, Caveat attribution "Peter Naur · Programming as Theory Building, 1985"; then People column (5 numbered chips 1–5, Playful numbered circles) vs Agents column (4 items) — two-column split with waterline divider motif; "The one rule" callout as a stamp/seal card (accent border pill, verbatim copy).
5. **How it works — the waterline**: eyebrow "How it works"; H2 "Initiatives, issues, releases. A person can steer at every step."; redrawn fig2 as playful SVG: above waterline 6 interactive pills (Note/Comment/Reaction/Reply/Yes/Accept, accent outline), waterline waves label, below: deep-sage terminal card with the 6 mono lines verbatim ("> accepted · receipt written" etc.), aria-label from original ("Where the signals go. Above the waterline: people, together: Note, Comment, Reaction, Reply, Yes, Accept. Below the waterline: the agent's session."); caption paragraph + "You can step in here" verbatim; then 4 columns (Initiative 6 steps / Issue 4 / Release 3 / Leaderboard 3) as ticket cards with mono step numbers; closing two lines verbatim.
6. **One record** (sage-pale band): eyebrow "The whole company"; H2 "Many notes. Many agents. One record."; lede; 4 question cards (What is moving?/wrong?/shipped?/who carried it? + sublabels WIP/Issues/Releases/Leaderboard + copy); "Activities" paragraph with ink emphasis; Software System catalog card (eyebrow "The catalog", H3 + copy).
7. **Rules — the engine room** (deep-sage interruption, Spade forest move): eyebrow "One set of rules"; H2 "Authority, money, evidence. The same for every person and every agent."; "Enforced on the server, never by a prompt." as mono sub-line; 3 columns (Authority/Money/Evidence) with 5/4/4 checklist items verbatim (custom check SVG, cream text, accent checks); then "Four kinds of session" 4 cards (PM/Engineering/QA/Ops + copy) as boat-ticket cards with mono stubs.
8. **Keep your agent — the dock**: eyebrow "Keep your agent"; H2 "Keep the agent you already have."; ACP diagram SVG: 5 agent chips (Claude/Codex/Pi/Cursor/Hermes) ⟵ ACP ⟶ Konteks dock; copy verbatim; sub-cards: sign-in line, provider-bills line, "Your own machine" card; MCP dl card (Agents/VCS/Endpoint/Transport/Auth values verbatim, mono for endpoint/transport); "Secrets never reach a prompt, a screenshot, or a log." as seal line; links Security →/Docs →/Pricing →.
9. **Enablement — the classroom**: eyebrow "Learning the new discipline"; H2 "If the work changed, how we learn it changed."; 3 persona cards (Juniors/Leads/Product people, Caveat margin notes); Refactory line; 4 training cards (Readiness mapping/Role-based training/Guided onboarding/Coaching); CTA "Talk to us about training →" + "With Konteks, or on its own." chip.
10. **Final CTA — sailing out** (deep-sage): eyebrow "Last page"; H2 "Unlearn the old way. Learn to work with agents."; paper boats sailing SVG; "Start building ↗" pill; enterprise line verbatim; journal postcard (rotated +3°): "From the journal · Day 1 · August 17, 2026" + quote + "Read →", Caveat signature.
11. **Footer**: K-mark, tagline, hello@konteks.io, link groups Product/Resources/Company verbatim, "Made by Refactory ↗", "© 2026 Konteks · konteks.io".

## Assets (generated, raster PNG @ public/landingpage-assets/ — reference as /landingpage-assets/<file>)
lighthouse.png 640×840 (deep-sage hero), paper-boat.png 520×400 (deep-sage hero), waves-strip.png 1600×260 (cream waves, dark grounds), collage-shapes.png 1200×800 (low-prominence hero background), waterline-split.png 1600×620 (how-it-works diagram backdrop), boats-sailing.png 1500×760 (final CTA), arrow-doodle.png 220×140 (ink, cream grounds, Before/Now), postcard-stamp.png 260×300 (ink+accent, journal postcard). Compose with `<img>` + object-fit at described positions; interactive parts (station pills, terminal card, agent chips, icons: nav, checks, sun/moon toggle) remain DOM/inline-SVG code. Hero and final CTA stay deep-sage `#243025` in BOTH themes so cream raster art reads on them.

## Craft floor (absolute bans)
No gradient text; no glass/blur decoration; no colored border-left/right callouts >1px; no hard offset shadows; no emoji/unicode-glyph icons (draw SVG icons, one stroke family); no monospace as costume; no sparkline/progress-ring junk; no hero-metric template; shadows must offset+blur or none; rotation only on proof/quote/postcard/sticker (±2–6°), never reading columns; every control hover/active/focus-visible; body ≥4.5:1 everywhere (use documented AA pairs only).

## Motion (Franklin grammar)
Sparkle pulse 2.5s scale .5→.8→.5 (motion-safe); station pills hover lift ≤2px + tilt 1°; card hover rise 2px; boat gentle bob on route (4s ease-in-out, motion-safe); `prefers-reduced-motion: reduce` kills ALL transforms/transitions. No entrances, no scroll-jacking, no parallax.

## Responsive
Fluid 1280–1600 (1440 bit-stable); ≤899 stacks: hero scene below text, ledger rows become paired lines, 4-col grids → 1, diagrams scale full-width, nav collapses to hamburger drawer with the same links + toggle. Test 390px.

## Validation
`npm run build` (dist/landingpage.html exists), `npm run typecheck`, `node /Users/ardian/.agents/skills/impeccable/scripts/detect.mjs --json landingpage.html`, content-completeness grep: every heading line and quoted phrase from the inventory present in the built page (spot-check ≥40 key strings incl. all 42 headings, all 11 Before/Now pairs, checklist items, MCP values, journal quote).
