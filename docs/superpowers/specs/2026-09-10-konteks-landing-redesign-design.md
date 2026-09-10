# Konteks Landing Page Redesign — Editorial Process

## Status

Approved expanded design, awaiting written-spec review before implementation.

Approved visual choices:

- Overall direction: **A — Editorial Runway**.
- Workflow direction: **A1 v3 — one continuous process**.
- Remaining page: **quieter content rhythm** with small integrated illustrations.

## Objective

Redesign `landingpage.html` into a clean, varied product story inspired primarily by Spade's section pacing, with Fly.io's playful technical detail and Frankli's content hierarchy. Preserve the Konteks palette, DM Sans as the primary face, selective Fraunces display type, factual copy, destinations, and theme behavior.

The page must stop treating every section as a hero. Only the opening and the paradigm chapter may use monumental typography or extended sticky pacing. Later chapters use smaller headings, denser editorial grids, rules, terminal detail, and restrained icon illustration.

## Visual System

### Color

- Warm paper background matched to the supplied video field.
- Deep forest ink for primary text and dark chapters.
- Leaf green for human intent, selection, and approval.
- Pencil blue for agent process, connectors, and terminal states.
- No decorative gradients, glass, or unrelated accent colors.

### Typography

- **DM Sans:** navigation, labels, body, controls, input text, and most headings.
- **Fraunces:** hero, paradigm statement, and occasional editorial emphasis only.
- **System monospace:** terminal output, process timestamps, status lines, and machine-readable metadata.
- Section headings after the workflow must be materially smaller than the hero and paradigm headings.

### Integrated illustration details

Remove the generated full-width illustration plates. Replace them with a coherent family of small, icon-sized line illustrations placed inside the content structure rather than above or beside it as separate artwork.

Icon subjects include:

- Cursor and typed signal.
- Permission key or scoped gate.
- Budget ceiling or coin.
- Receipt and evidence check.
- Context connector.
- Agent/session mark.
- Small paper-boat or waterline motif where navigation needs continuity.

Icons use forest outlines with limited green and pencil-blue accents, subtle graphite irregularity, and enough internal detail to prevent the page from feeling flat. They remain under icon scale, contain no text, and never become independent image cards.

## Page Architecture

### 1. Navigation

Keep existing destinations, theme switch, locale control, and primary CTA. Reduce visual weight and preserve the responsive disclosure menu.

### 2. Hero — one continuous opening chapter

The hero remains a long scroll runway, but its intro copy is part of the same section rather than a separate outro section.

Initial load:

- Show the eyebrow and hero title immediately.
- Prime the replacement video to its third source frame (`2 / 24s`) and show that frame with the title as soon as the seek completes.
- Do **not** show a fallback image, poster, or separate static boat illustration.
- Keep callouts hidden until the visitor scrolls.

Composition:

- Eyebrow above the title.
- Hero title layered above the video.
- Video is large and visually dominant but sits low enough that the boat silhouette never collides with the hero title.
- Human signal remains small on the left; agent response remains small on the right.
- No hero progress indicator.
- “Your team writes down what should exist…” remains inside this hero section and appears near the end of the runway, below the first viewport, followed by the CTA.

Video treatment:

- Scrub the supplied MP4 with scroll progress on desktop.
- Match the hero canvas to the video's background color.
- Use oversized media bounds and a feathered edge mask so compression/color differences cannot produce a visible rectangle or horizontal seam.
- No static poster flashes before metadata loads.
- If video cannot load, preserve the layout and copy on a clean background; do not substitute the rejected generated image.

The three paired states remain:

1. Lead the vision → Planning.
2. Set the constraints → Build.
3. Judge the evidence → Check.

Each pair moves relative to the boat rather than the viewport edge:

- A left callout enters from the boat toward its resting position on the left, then exits back toward the boat.
- A right callout enters from the boat toward its resting position on the right, then exits back toward the boat.
- The first, second, and third pair all use the same visible entrance/exit treatment; none may simply swap text in place.
- Keep the hero title visible through the final ownership explanation; only the callouts leave before that copy appears.

### 3. The year the paradigm changed

Retain the dark pinned chapter:

- Add the eyebrow `2026` above the statement.
- Dominant statement pinned on the left.
- Circular comparison ledger on the right.
- Pin a small column header row reading `BEFORE` and `NOW` above the moving ledger items.
- One focused row per reading interval.
- The section releases only after every row has been readable.
- On mobile and reduced motion, show the rows once in normal order.

This is the only long sticky chapter after the hero.

### 4. People hold the theory

Split this chapter into two scroll moments:

1. A sticky quote stage stops on the Naur quotation and source. A paper boat with no water or reflection enters from outside the viewport into the intentionally empty side, settles, and remains still before the section releases.
2. The responsibility boundary follows in normal flow after the quote pause.

The boundary uses two semantic colors: `People` in leaf green and `Agents` in pencil blue. Both columns use the same authored symbol bullet; do not number one side while symbol-marking the other.

People contains five responsibilities: Lead the vision, Set the constraints, Say yes, Judge the evidence, and Hold the context. Agents contains Write, Plan, Build, Check, and Watch, with Check and Watch as separate rows.

### 5. How it works — one continuous scroll process

Replace the current workflow entirely. It is one normal-height sticky stage with a finite five-scene process, not six stacked action panels and not a tap-driven selector.

Process:

1. **Type:** a human composer types one believable instruction character by character.
2. **Send:** the composer submits and contracts into a compact signal.
3. **Read:** the signal crosses the Konteks connector; the agent terminal wakes and reads context and constraints.
4. **Respond:** the terminal types a moderately verbose multi-step process line by line.
5. **Return:** the terminal returns scope, ceiling, required evidence, and an approval state to the human side.

Human composer:

- Looks like a real typed input, not a feature card.
- Uses DM Sans and a blinking insertion cursor only during the type scene.
- Text reveal uses a deterministic character count derived from scroll progress; it does not run on a timer after scrolling stops.
- Example instruction: preserve the billing path, add approval before deploy, cap work at 25 minutes, and return browser evidence.

Agent terminal:

- Uses system monospace on a forest terminal field.
- Feels operational and slightly verbose, not like marketing copy.
- Reveals multiple genuine-looking steps: signal received, context read, boundaries applied, plan built, quote prepared, evidence requirements listed, approval requested.
- Each line types or resolves in sequence according to scroll progress.
- The terminal never claims the agent has authority before the human approval step.

Interaction:

- Scroll is the primary and expected controller.
- The five scenes share one stage; only the current process moment is dominant.
- Previous activity collapses into a subtle trace instead of remaining as a stack.
- Reverse scroll reverses the process deterministically.
- Reduced motion shows the complete process in semantic document order with no typing animation.
- Static HTML contains all important text so the explanation survives script failure.

Below the five-scene stage, but inside the same How it works chapter, add **You can step in here**. It explains the actual intervention surfaces from the current Konteks product narrative:

- Initiative — write and discuss a note, read the plan and ceiling, approve, inspect the build and browser evidence, then accept.
- Issue — inspect severity and containment, approve the proposed fix, then read the retained timeline.
- Release — inspect accepted work, decide when it ships, and react to the release narrative.
- Leaderboard — read who and which models carried work; this surface counts rather than asks for intervention.

Use an editorial four-lane progression with concrete action verbs, not a second oversized hero or four generic cards.

### 6. Many notes. Many agents. One record.

Remove the large boat image. Use a compact editorial product index based on the current [Konteks landing page](https://konteks.io/):

- Smaller heading and short framing copy on the left.
- A ruled question-and-answer ledger on the right containing the original labels and meanings:
  - What is moving? → **Work In Progress** — initiatives, leaders, and phase.
  - What is wrong? → **Issues** — severity, owner, and timeline.
  - What shipped? → **Releases** — accepted work released by a person.
  - Who carried it? → **Leaderboard** — people by participation and models by return versus cost.
- Add **Activities** as the shared turning-point timeline.
- Add a distinct but attached **Catalog** row: each product lives in a Software System with its repositories and components, so every session starts with software context.
- Content itself provides the visual structure.

### 7. Authority, money, evidence

Remove the generated checkpoint plate. Use a compact dark chapter with three typographic columns. Each column gets one detailed integrated line icon and concise factual copy. Avoid card containers and oversized headings.

### 8. Four session types

Use a compact two-by-two editorial grid on the pale green field. Replace numeric prefixes with four consistent line icons: milestone/plan for Project Management, branch/pull request for Engineering, browser/check for QA, and alert/log pulse for Ops. Keep Project Management, Engineering, QA, and Ops readable without turning each into a card or hero row.

### 9. Keep your existing agent

Use an asymmetric section with a real connection architecture instead of the current abstract chip rail:

- Supported agent identities: Claude, Codex, Pi, Cursor, and Hermes, using small recognizable logo marks where suitable and accessible text labels in every case.
- Show ACP as the agent connection into Konteks.
- Show the local/cloud execution statement and subscription-or-key choice.
- Add a compact MCP connection specification for VCS (`GitHub`, `Gitea`), Endpoint (`https://api.konteks.io/mcp`), Transport (`Streamable HTTP`), and Auth (`scoped Bearer credential, rotatable and revocable`).
- State that provider billing is direct and secrets never reach prompts, screenshots, or logs.
- End with visible routes to Docs, Security, and Journal.

The section should read as one smooth connection map plus specification rail, not a field of isolated cards.

### 10. Enablement and close

Rebuild enablement as a legible `audience need → Konteks enablement` matrix:

- Juniors need to judge evidence they did not produce.
- Leads need to write constraints.
- Product people need to write the note.
- Reviewers and teams need to practice approval and evidence habits in real workflows.

Map those needs to Readiness Mapping, Role-based Training, Guided Onboarding, and Coaching. Keep the statement that Refactory is the team behind Konteks and that training can be delivered with Konteks or independently. End with one training CTA.

The final close remains decisive, uses a smaller headline than the hero, and centers the heading, supporting copy, and CTA as one aligned group.

## Section Rhythm

- Hero: extended sticky runway.
- Paradigm: extended pinned ledger.
- Workflow: one bounded continuous-process runway.
- All other chapters: normal document flow, generally below one viewport on desktop.
- Alternate asymmetric split, ruled ledger, compact three-column, and two-by-two grid layouts.
- Use background change, a strong rule, or density shift at each boundary; do not use excessive empty height.
- Never place a large image simply to balance a text column.

## Motion

- Hero video and paired annotations, paradigm ledger, quote-stage boat entrance, and workflow process are the only scroll-driven motion systems.
- Use one requestAnimationFrame-bounded scroll update per page.
- Typewriter effects are calculated from scroll progress, deterministic, reversible, and do not continue autonomously.
- Animate transforms and opacity; avoid layout thrashing.
- No autoplay loops, cursor-following decoration, or perpetual blinking outside an active typing state.
- `prefers-reduced-motion` removes sticky choreography and exposes complete static content.

## Responsive Behavior

- Desktop target: 1280–1600px; primary QA at 1440×900.
- Mobile target: 390px.
- Mobile hero remains spacious but does not reserve empty runway height when sticky behavior is disabled.
- Video may crop beyond the viewport but never create horizontal document overflow.
- Workflow becomes a normal-flow sequence on mobile while preserving the same type → send → read → respond → return order.
- Terminal lines wrap safely; no fixed-height clipping.
- Interactive targets remain at least 44px where controls exist.

## Accessibility and Resilience

- Preserve semantic headings, lists, controls, links, focus indicators, and WCAG AA contrast in both themes.
- Do not rely on color alone to distinguish human and agent states.
- Video is decorative, muted, inline, and absent from the accessibility tree.
- The workflow exposes a concise live status without announcing every typed character.
- Without JavaScript, all factual content and process stages remain readable.
- Reduced motion shows final text rather than simulated typing.

## Asset Production Plan

All new assets must be produced and bundled locally during implementation. The landing page may not depend on third-party image URLs at runtime.

### Quote-stage paper boat

- Source the boat from the supplied `Video Baru2.mp4` so its folds, graphite texture, proportions, and lighting match the hero exactly.
- Review representative source frames and choose the cleanest settled boat pose for the quote composition; do not assume the hero's initial third frame is automatically the best extraction frame.
- Extract the selected full-resolution frame, then remove the footage background, water rings, reflection, and loose water fragments.
- Prefer a deterministic alpha matte when the source separates cleanly. If the water cannot be removed without damaging the paper edges, use an image-editing pass constrained to removal and edge reconstruction only—do not redesign the boat or invent a second illustration style.
- Deliver a transparent asset at a working size of at least 1400px on its longest edge as `public/landingpage-assets/theory-paper-boat.webp`. Retain a lossless working PNG outside the runtime bundle only if needed for later revision.
- Preserve natural paper grain and slightly imperfect graphite edges. Reject halos, clipped tips, opaque corner pixels, remaining water, fake drop shadows, and newly invented folds.
- The browser supplies positioning and entrance motion; the raster asset itself contains no baked background, motion trail, or empty layout padding.

### Session icons

- Author four inline SVG icons specifically for Project Management, Engineering, QA, and Ops.
- Use the existing 1–1.5px forest stroke, restrained green/blue semantic accents, `currentColor`, and a shared viewBox.
- Keep them geometric interface symbols rather than sketch illustrations: milestone/plan, branch/pull request, browser/check, and alert/log pulse.
- No icon contains text or a numeric substitute. Each decorative icon is hidden from assistive technology because its adjacent heading supplies the meaning.

### Integration marks

- Collect official, current marks for Claude, Codex/OpenAI, Pi, Cursor, Hermes, GitHub, and Gitea from their owners' brand resources or repositories when available.
- Store approved vector marks locally under `public/landingpage-assets/integrations/`; normalize only the artboard, rendered size, and monochrome treatment required by the Konteks visual system. Do not redraw or geometrically alter trademark shapes.
- Every mark appears with a visible text label, so recognition and accessibility do not depend on the logo alone.
- If an official reusable mark cannot be obtained or its usage is unclear, ship the integration as a typographic name with the shared connection glyph instead of fabricating a logo.
- ACP, MCP Endpoint, Transport, and Auth are protocol/specification nodes, not brands; represent them with type and authored connection geometry rather than logos.

### Optimization and provenance

- Record each external mark's source URL and retrieval date in `public/landingpage-assets/integrations/SOURCES.md`.
- Remove unnecessary SVG metadata and scripts; keep `viewBox` intact and do not inline remote references.
- Set explicit rendered dimensions for every image and logo to avoid layout shift.
- Verify light and dark treatments, transparent edges, keyboard/assistive labels, missing-asset fallback, and 390px/1200px/1440px compositions.
- Run an orphan and broken-reference scan after implementation. Delete superseded generated assets only after the new page has no references to them.

## Asset Changes

Delete the rejected generated illustration assets once they are no longer referenced:

- `public/landingpage-assets/people-hold-theory.png`
- `public/landingpage-assets/governance-gates.png`
- `public/landingpage-assets/hero-boat-plate-generated.png`
- Generated source duplicates used only for those plates.

Keep the supplied stop-motion video. Produce the transparent quote-stage boat and integration marks according to the plan above. Reuse a small existing paper-boat mark only where it functions as brand/navigation detail, never as the hero fallback.

## Verification

Implementation is complete when:

1. Production build succeeds and `git diff --check` is clean.
2. Initial hero load shows no fallback image or poster flash.
3. The larger video sits below the title, preserves its reflection, and has no visible rectangular edge in desktop and mobile captures.
4. Hero supporting copy remains within the hero section but below the first viewport.
5. All three hero pairs slide correctly in both scroll directions.
6. Paradigm ledger reaches every item and releases cleanly.
7. Workflow advances through type, send, read, respond, and return by scroll alone.
8. Human input and terminal output reveal deterministically with reverse scroll.
9. Workflow content never clips at 1440×900, 1200×720, or 390px.
10. Rejected generated plates are gone and no broken references remain.
11. Later sections use smaller headings and varied compact layouts.
12. Both themes and reduced-motion mode remain readable.
13. Desktop and mobile screenshots receive a fresh Impeccable finish review.
14. The quote boat has a clean transparent edge with no water or reflection at 1× and 2× inspection.
15. All integration marks are local, labeled, source-documented, and free of remote runtime dependencies.
16. Session icons share one stroke and viewBox system and contain no numbers.

## Scope

- Change the standalone landing page and its landing-specific assets only.
- Do not restyle the product application or catalog.
- Do not fabricate product claims or integrations.
- Use the current public Konteks landing page as the factual source of truth for product labels, integration specifications, enablement offerings, and destination links.
- Do not add a runtime dependency unless browser APIs are insufficient.

## Approved Hero Choreography Refinement

The supplied `Video Baru2.mp4` replaces the previous stop-motion source. Preserve the complete 16:9 frame: the bottom of the boat and water reflection may not be cropped. The hero media wrapper may grow, but the boat remains below the title. The video uses contained sizing, a horizontal edge feather, and a background sampled from the footage so no rectangular boundary appears.

The three human/agent pairs use **Staggered Waterline** choreography rather than one repeated position:

1. Vision / Planning: human signal rests in the upper left; agent response rests in the lower right below the waterline.
2. Constraints / Build: human signal rests in the upper right; agent response rests in the lower left below the waterline.
3. Evidence / Check: human signal rests left-of-center above the boat; agent response rests right-of-center below the waterline.

Every human signal carries the slug `ABOVE WATERLINE`; every agent response carries `UNDER WATERLINE`. Incoming items combine fade with a directional slide from the boat toward their resting side. During a state change, the old signal/response slide back toward the boat while the next pair enters; old and new content are separate transient nodes so their movement overlaps rather than changing text inside one stationary element.

The ownership explanation beginning “Your team writes down what should exist…” remains inside the hero section but does not appear alongside the three active pairs. It receives a separate final reading interval after the third pair exits, lower in the hero runway.

## Approved Expansion — Product Narrative and Section Motion

This expansion supersedes any earlier motion wording that said callouts enter from the viewport edge. Every callout originates visually at the boat and travels outward to its resting side; its exit reverses that path back toward the boat. The hero video is visible from its primed third frame on initial load, while callouts wait for scroll. The title persists during the final hero conclusion.

The paradigm ledger adds `2026` plus a persistent `BEFORE` / `NOW` header. The theory chapter becomes a bounded sticky quotation pause with a transparent paper-boat still entering the empty side before normal-flow People/Agents responsibilities. How it works gains the missing **You can step in here** product-action narrative. Record, Catalog, Integrations, Enablement, and Sessions regain the full factual content and naming present on the current public Konteks landing page without restoring oversized illustration plates or monotonous card grids.
