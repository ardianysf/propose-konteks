# Konteks Landing Page Redesign — Editorial Process

## Status

Approved design, awaiting implementation.

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
- Do **not** show a fallback image, poster, or static boat illustration.
- The video appears only when ready and fades into the paper field without exposing a rectangular edge.

Composition:

- Eyebrow above the title.
- Hero title layered above the video.
- Video materially larger than the current version and allowed to overlap behind the title and the lower hero content.
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

Each pair slides in from its respective side, remains secondary to the title and boat, and exits before the next pair arrives.

### 3. The year the paradigm changed

Retain the dark pinned chapter:

- Dominant statement pinned on the left.
- Circular comparison ledger on the right.
- One focused row per reading interval.
- The section releases only after every row has been readable.
- On mobile and reduced motion, show the rows once in normal order.

This is the only long sticky chapter after the hero.

### 4. People hold the theory

Use a quiet reading section with the Naur quotation and two structured responsibility lists. Remove the generated person-and-boat plate. A small compass/context icon may sit within the heading rule, but the copy remains the visual focus.

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

### 6. Many notes. Many agents. One record.

Remove the large boat image. Use a compact editorial split:

- Smaller heading and short framing copy on the left.
- A ruled question-and-answer ledger on the right for moving work, issues, releases, and contribution.
- Content itself provides the visual structure.

### 7. Authority, money, evidence

Remove the generated checkpoint plate. Use a compact dark chapter with three typographic columns. Each column gets one detailed integrated line icon and concise factual copy. Avoid card containers and oversized headings.

### 8. Four session types

Use a compact two-by-two editorial grid on the pale green field. Keep Project Management, Engineering, QA, and Ops readable without turning each into a card or hero row.

### 9. Keep your existing agent

Use an asymmetric two-column section. Product copy sits on one side; a small monospace ACP connection diagram sits on the other. No large decorative illustration.

### 10. Enablement and close

Condense enablement into a short practical section with one integrated learning/navigation mark and a single CTA. The final close remains decisive but uses a smaller headline than the hero.

## Section Rhythm

- Hero: extended sticky runway.
- Paradigm: extended pinned ledger.
- Workflow: one bounded continuous-process runway.
- All other chapters: normal document flow, generally below one viewport on desktop.
- Alternate asymmetric split, ruled ledger, compact three-column, and two-by-two grid layouts.
- Use background change, a strong rule, or density shift at each boundary; do not use excessive empty height.
- Never place a large image simply to balance a text column.

## Motion

- Hero video, paired annotations, paradigm ledger, and workflow process are the only scroll-driven motion systems.
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

## Asset Changes

Delete the rejected generated illustration assets once they are no longer referenced:

- `public/landingpage-assets/people-hold-theory.png`
- `public/landingpage-assets/governance-gates.png`
- `public/landingpage-assets/hero-boat-plate-generated.png`
- Generated source duplicates used only for those plates.

Keep the supplied stop-motion video. Reuse a small existing paper-boat mark only where it functions as brand/navigation detail, never as the hero fallback.

## Verification

Implementation is complete when:

1. Production build succeeds and `git diff --check` is clean.
2. Initial hero load shows no fallback image or poster flash.
3. The larger video overlaps the title composition and has no visible rectangular edge in desktop and mobile captures.
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

## Scope

- Change the standalone landing page and its landing-specific assets only.
- Do not restyle the product application or catalog.
- Do not fabricate product claims or integrations.
- Do not add a runtime dependency unless browser APIs are insufficient.

## Approved Hero Choreography Refinement

The supplied `Video Baru2.mp4` replaces the previous stop-motion source. Preserve the complete 16:9 frame: the bottom of the boat and water reflection may not be cropped. The hero media wrapper may grow and overlap behind the title, but the video uses contained sizing plus a four-sided feather mask and a background sampled from the footage so no rectangular boundary appears.

The three human/agent pairs use **Staggered Waterline** choreography rather than one repeated position:

1. Vision / Planning: human signal enters from the upper left; agent response enters in the lower right below the waterline.
2. Constraints / Build: human signal enters from the upper right; agent response enters in the lower left below the waterline.
3. Evidence / Check: human signal enters from left-of-center above the boat; agent response enters right-of-center below the waterline.

Every human signal carries the slug `ABOVE THE WATERLINE`; every agent response carries `UNDER THE WATERLINE`. Incoming items combine fade with a directional slide. During a state change, the old signal/response slide out while the next pair enters from its own origin; old and new content are separate transient nodes so their movement overlaps rather than changing text inside one stationary element.

The ownership explanation beginning “Your team writes down what should exist…” remains inside the hero section but does not appear alongside the three active pairs. It receives a separate final reading interval after the third pair exits, lower in the hero runway.
