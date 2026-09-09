# Paper-Boat Hero — Design Specification

- **Date:** 2025-03-08
- **Status:** Approved contract for implementation
- **Implementation surface:** `landingpage.html`

## Objective

Reframe the landing-page opening around the approved Figma composition and promise:

> People lead the vision. Agents do the rest.

The first viewport is calm and centered: the two-line H1 comes first, followed by the supplied paper-boat artwork, the supporting paragraph, and two CTAs. It contains no human/agent callouts or scroll-driven hero behavior. The existing `#workflow` section introduces the waterline ownership model and contains the page's only scroll-driven perspective sequence.

## Scope and preservation

### In scope

- Replace the current two-column harbor hero in `landingpage.html` with the centered, Figma-authored paper-boat hero defined here.
- Replace the contents and behavior of the existing `#workflow` section with the waterline scroll narrative defined here; retain the `id="workflow"` anchor.
- Update only hero/workflow markup, their page-local styles and scripts, and directly related landing-page asset references.
- Preserve the current light/dark theme support and the established cream, ink-sage, matcha, and accessible accent tokens.

### Preserved

- The sticky navigation, all destinations, theme control, language control, footer, and every landing-page section outside the hero and `#workflow` remain in their current order and retain their copy and behavior.
- Preserve the current hero supporting paragraph verbatim: `Your team writes down what should exist. The agents you already use plan it, price it, build it, check it, and keep watch. You say yes first and accept at the end. One set of rules for the whole company.`
- The primary and secondary hero CTA labels and destinations remain as specified below.
- `/landingpage` serving/build behavior remains unchanged.

### Out of scope

- Changes to `catalog.html`, `src/catalog/**`, application screens, routing, shared product styles, APIs, or backend behavior.
- Rewriting downstream landing-page content.
- Adding randomized animation, generated copy, autoplaying carousels, or new conversion flows.
- Using any paper-boat guideline view other than Perspectives 01–08 in the rotating sequence. Perspective 09 (`Top Down View`) is not a rotation state and is allowed only as the optional static overview defined below.

## Visual composition

### Hero

- The authoritative visual source for the first viewport is Figma file `c7xbPzX1acJ5jX2gK6ZljP`, section node `574:2549`, frame `571:3`, and hero frame `571:6`.
- Use one centered composition rather than a copy/art split. Its visual and DOM order is fixed: centered two-line H1 → paper-boat artwork → supporting paragraph → two centered CTAs.
- Render the approved H1 as two balanced lines, without inserting other headline copy:
  1. `People lead the vision.`
  2. `Agents do the rest.`
- Use the supplied transparent 703×703 paper-boat artwork at `public/landingpage-assets/figma-paper-boat-hero.png`. Preserve its transparency and aspect ratio; do not crop, redraw, or replace it with a guideline perspective.
- The local artwork is sourced from Figma image-fill node `571:642`. It is a checked-in local asset, not a remote runtime dependency.
- Place the preserved supporting paragraph directly below the artwork, then place `Start building ↗` and `See how it works ↓` together as the centered CTA group below the paragraph.
- Keep the first viewport calm and uncluttered. Do not place human or agent callouts, `HUMAN CONTROL` / `AGENT EXECUTION` labels, workflow phases, handwritten annotations, pointers, or the workflow waterline in the hero; those belong to `#workflow`.
- Continue using the existing display type for the H1 and DM Sans for interface text, with the established cream, ink-sage, matcha, and accessible accent tokens in both themes.

### Workflow required labels

The `#workflow` human surface contains exactly these four callouts, with this capitalization and order in the DOM:

1. `Lead the vision`
2. `Set the constraints`
3. `Judge the evidence`
4. `Hold the context`

The `#workflow` agent path below the waterline contains exactly this five-step sequence:

1. `Write`
2. `Plan`
3. `Build`
4. `Check`
5. `Watch`

Do not add `Say yes`, `People`, `Agents`, or alternate phase names to either required label set, and do not duplicate either label set in the first viewport. Give the composed workflow scene this accessible description: `A paper boat rests on a waterline. Human control stays above; agent execution moves through Write, Plan, Build, Check, and Watch below.`

### Perspective source and state model

- Use guideline Perspectives 01–08, in numeric order, as the complete rotating sequence. They are eight sequential visual perspective/part stages in one continuous horizontal rotation: start at the front, continue through the right side and right rear, pass the rear, then continue through the left rear and left side to the left three-quarter view shown by Perspective 08. Follow the guideline artwork for each numbered view rather than inventing, mirroring, reordering, or skipping a view.
- Perspective 09 (`Top Down View`) must not appear among the rotating parts or between Perspectives 01–08 because its camera angle breaks horizontal-rotation continuity. It may be omitted. If included, place it only after Scene 3 as a clearly separate, static final overview; it does not become a ninth state, a fourth scroll scene, or an animated transition target.
- The eight numbered states are visual perspective/part stages, not workflow phases and not eight long scroll sections. Present them in exactly three ordered scroll scenes: Scene 1 contains 01, 02, 03; Scene 2 contains 04, 05, 06; Scene 3 contains 07, 08. This `3 + 3 + 2` grouping is fixed at every viewport width.
- Keep the five agent phases as a separate semantic path. Their state-to-phase emphasis is deterministic: 01 emphasizes `Write`; 02–03 emphasize `Plan`; 04–05 emphasize `Build`; 06–07 emphasize `Check`; and 08 emphasizes `Watch`. The five labels themselves remain visible in the required Write → Plan → Build → Check → Watch order; repeated emphasis across adjacent states does not create duplicate phase labels.
- Every numbered state has authored contextual explanation. Above the waterline, connect that state to one or more of the four existing human-action annotations; all four remain visible and no additional human-action heading is introduced. Below the waterline, expose the state-specific agent-work explanation under its mapped phase; do not introduce alternate phase names.

### Deterministic, spontaneous workflow placement

Within `#workflow`, make callouts look pinned on by hand while keeping them stable across reloads. Do not use `Math.random()`, timestamps, viewport-dependent random seeds, or shuffled arrays.

At desktop widths, use these authored anchor points within the workflow illustration stage; percentages identify each callout's center relative to the stage:

| Callout | X | Y | Rotation |
|---|---:|---:|---:|
| Lead the vision | 14% | 22% | -4deg |
| Set the constraints | 77% | 18% | 3deg |
| Judge the evidence | 80% | 39% | -2deg |
| Hold the context | 12% | 42% | 2deg |

Keep the desktop workflow waterline at 55% of the stage height and all four callouts above it. Place the five agent labels below the line at these fixed `(X, Y)` centers: Write `(14%, 73%)`, Plan `(32%, 81%)`, Build `(50%, 73%)`, Check `(68%, 81%)`, and Watch `(86%, 73%)`. Breakpoint-specific workflow layouts reflow as defined below, use fixed authored positions, and preserve the same reading order.

## Interaction and narrative

### Hero behavior

- Keep the first viewport calm and still; do not add scroll-driven hero behavior, idle float, automatic cycling, or timer-driven reveals.
- Render exactly one hero artwork: `public/landingpage-assets/figma-paper-boat-hero.png`.
- Keep the H1, artwork, supporting paragraph, and CTA group in their required visual and DOM order. Human/agent context begins only in `#workflow`.

### CTA behavior

- `Start building ↗` is the primary CTA and navigates in the same tab to `https://app.konteks.io/`.
- `See how it works ↓` is the secondary CTA and moves to the retained `#workflow` anchor. Use smooth scrolling only when reduced motion is not requested; otherwise jump immediately.
- Both controls retain visible hover, active, and keyboard focus states. The CTA group remains after the H1, artwork, and supporting paragraph in DOM and tab order.

### Scroll narrative replacing `#workflow`

- Remove the current signal-pill, falling-dot, terminal, and ticket-grid workflow presentation from `#workflow`; the new narrative replaces that section rather than appearing beside or after it.
- Use one sticky waterline stage at widths of 900px and above and exactly three ordered scroll scenes. Scene 1 owns Perspectives 01–03, Scene 2 owns 04–06, and Scene 3 owns 07–08. Do not implement one full-height section or sentinel per perspective.
- Give each scene one scroll range and divide its local progress into its three, three, or two ordered state intervals. Scroll progress drives smooth authored movement/reveal between adjacent states; at each state boundary the corresponding guideline view and its contextual explanation are fully legible. Scrubbing upward reverses the same transitions and state order.
- Throughout all three scenes, keep the boat on the waterline and all four human annotations visible above it. A state may visibly emphasize the relevant existing annotation and reveal its contextual copy, but human controls remain visually steady. Below the line, reveal the state-specific agent-work explanation and emphasize the mapped Write, Plan, Build, Check, or Watch phase while leaving the five-phase path visible at lower emphasis.
- Every state exposes meaningful real text, uses simple line work to associate context with the relevant boat part, and remains understandable in a static capture. Do not bake explanations into images. The state changes viewpoint/part emphasis; it does not change the human/agent ownership boundary.
- Derive active scene, state, transition progress, and phase emphasis only from authored scene boundaries plus current scroll position, clamped to Perspectives 01 and 08. The same scroll position must always produce the same result. Do not use timers, runtime randomness, shuffled arrays, or automatic cycling to choose states, parts, copy, or placement.
- If the optional Perspective 09 overview is present, render it after the third scene in normal document flow, already visible and static. It must not participate in sticky progress or animate from Perspective 08.
- Keep `#workflow` in the existing document order so all current `#workflow` links continue to work. Sections after it resume normal document flow.

## Responsive and motion requirements

- **Desktop (`>= 900px`):** keep the first viewport centered in the required H1 → artwork → paragraph → CTAs order. In `#workflow`, use the authored annotation anchors, horizontal waterline, and one sticky stage controlled by exactly three scene ranges grouped `3 + 3 + 2`.
- **Tablet (`620–899px`):** keep the same centered first-viewport order and scale the single hero artwork down without cropping it. In `#workflow`, maintain a centered boat and horizontal waterline, move callouts into a fixed two-column grid above the line, and wrap agent phases into a fixed `3 + 2` layout below it. Disable workflow sticky pinning and render exactly three normal-flow scene groups containing states 01–03, 04–06, and 07–08. When reduced motion is not requested, each workflow state uses a lightweight scroll-linked movement/reveal as its scene traverses the viewport; its text remains in document flow and available if script or animation does not run.
- **Mobile (`< 620px`, verified at 390px):** stack the first viewport as H1, artwork, supporting paragraph, and CTAs, with no human/agent callouts or scroll-driven hero behavior. In `#workflow`, place the four human callouts in a two-column grid above the boat and render the five agent phases as a vertical ordered list below the waterline. Disable sticky pinning and render the same three workflow scene groups and `3 + 3 + 2` state order in normal flow. When reduced motion is not requested, use the same lightweight, non-sticky workflow state reveal as tablet.
- At every supported width, prevent text/boat/callout/explanation overlap, clipped focus rings, and horizontal page scrolling. Touch targets are at least 44×44px where elements are interactive.
- Under `prefers-reduced-motion: reduce`, disable smooth scrolling, sticky scroll choreography, and all workflow state/part movement, crossfades, and reveal transitions. Show all four workflow human annotations, all five agent phase labels, and the authored explanations for Perspectives 01–08 immediately as a static accessible sequence, grouped 01–03, 04–06, and 07–08. Do not collapse, paginate, or require interaction to reach a state. The optional Perspective 09 overview, if present, remains a separate static item after the sequence.

## Accessibility

- Use one semantic `<h1>` for the approved headline and a labelled `<section>` for both the hero and workflow.
- Keep required callout, phase, state identifier, and contextual explanation text in the DOM. Do not bake meaningful text into an image or expose duplicate SVG text to assistive technology.
- Give the hero artwork the concise text alternative `A paper boat floating on hand-drawn blue water.` Treat decorative workflow waves, pointers, bubbles, and line art as `aria-hidden="true"`; give the composed workflow illustration the specified text alternative describing the human-above/agent-below model.
- Reading order is H1 → paper-boat artwork → supporting copy → CTAs → `#workflow` four human callouts → five agent phases → Perspectives 01–08 with their explanations grouped `3 + 3 + 2`. Within each perspective, human context precedes agent context. Visual positioning and sticky state must not alter this DOM order.
- Do not communicate ownership, current phase, current perspective, or completion by color alone; pair color with position, text, numbering, and a visible active marker. Keep scroll-driven labels noninteractive and do not create keyboard stops for scroll-only state.
- In the animated desktop treatment, visually inactive explanations may be de-emphasized, but they must remain represented in the accessibility tree in numeric order. The reduced-motion and non-sticky layouts visibly expose every explanation in that same order.
- Preserve the existing visible `:focus-visible` treatment and WCAG 2.2 AA text contrast in light and dark themes.
- Scroll-driven changes are not announced through `aria-live`; all content remains available as ordinary document text.

## Validation

Run from the repository root:

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e
```

Then run the page locally and inspect `http://localhost:5173/landingpage`:

```bash
npm run dev
```

Manual checks must cover 1440×900, 900×800, and 390×844 in light and dark themes, plus keyboard-only and reduced-motion operation. At each size:

1. Compare the initial viewport with Figma file `c7xbPzX1acJ5jX2gK6ZljP`, section `574:2549`, frame `571:3` / hero frame `571:6`. Verify H1 → artwork → supporting paragraph → CTAs order; use of the single local artwork `public/landingpage-assets/figma-paper-boat-hero.png` without a remote image request; and the absence of human/agent callouts, workflow labels, and scroll-driven hero behavior.
2. Confirm there are exactly three workflow scene groups and that their state identifiers are 01–03, 04–06, and 07–08; verify this is the only scroll-driven perspective sequence, the eight perspectives have not been expanded into eight long scroll sections, and there is no fourth scroll scene.
3. Scrub desktop scrolling forward and backward through all eight workflow states. Confirm smooth adjacent movement/reveal, the exact horizontal-rotation order, the state-specific explanation, and deterministic phase emphasis: 01 Write, 02–03 Plan, 04–05 Build, 06–07 Check, 08 Watch.
4. Confirm all workflow human annotations/context stay above the waterline and all agent phase labels/work stay below it. Verify the four human labels and five agent labels against their exact approved copy and order.
5. Confirm Perspective 09 does not occur in the rotating sequence. If it is implemented, verify it appears only after Scene 3 as a static normal-flow overview and that it does not change the `3 + 3 + 2` count.
6. With reduced motion enabled, confirm Perspectives 01–08 and every explanation are simultaneously available in a visible, logical static sequence without sticky choreography or state animation.
7. Reload and revisit matching workflow scroll positions to confirm identical artwork, placement, active state, explanation, and phase emphasis.

Search the implementation for forbidden runtime randomness:

```bash
rg "Math\.random|crypto\.getRandomValues" landingpage.html
```

The randomness search must return no matches in hero/workflow behavior. Also inspect the workflow script to confirm perspective state selection is scroll-derived and contains no shuffled arrays, timer-driven state choice, or generated copy.

## Acceptance criteria

1. `landingpage.html` displays one centered initial viewport in this visual and DOM order: the exact two-line H1 `People lead the vision.` / `Agents do the rest.`; the paper-boat artwork; the preserved supporting paragraph verbatim; then the two centered CTAs.
2. The hero uses exactly one supplied transparent 703×703 artwork at `public/landingpage-assets/figma-paper-boat-hero.png`, sourced from Figma image-fill node `571:642`, with preserved transparency and aspect ratio and no remote runtime image request or scroll-driven hero behavior.
3. The first viewport displays no human/agent callouts or workflow labels. Above the `#workflow` waterline, the only human responsibility callouts are exactly `Lead the vision`, `Set the constraints`, `Judge the evidence`, and `Hold the context`, in that DOM order.
4. Below the `#workflow` waterline, the agent sequence is exactly `Write`, `Plan`, `Build`, `Check`, `Watch`, in that visual and DOM order.
5. The four desktop workflow callouts and five underwater labels use the fixed authored anchors in this specification; repeated reloads at the same viewport produce the same placement, and hero/workflow code contains no runtime randomness.
6. `Start building ↗` navigates in the same tab to `https://app.konteks.io/`; `See how it works ↓` targets the existing `#workflow` anchor.
7. `#workflow` no longer contains the signal-pill/falling-dot/terminal/ticket-grid presentation. It is the page's only scroll-driven perspective sequence and contains exactly the eight numbered states from guideline Perspectives 01–08 in numeric horizontal-rotation order, from front through right side/right rear and rear to left rear/left side/left three-quarter; no state is invented, mirrored, reordered, duplicated, or skipped.
8. The eight states are grouped into exactly three ordered scroll scenes: 01–03, 04–06, and 07–08. They are visual perspective/part stages within those scenes, not eight long scroll sections and not eight workflow phases.
9. When reduced motion is not requested, each of Perspectives 01–08 moves/reveals smoothly as its scene is scrolled and exposes an authored contextual explanation; desktop uses the sticky sequence, while tablet and mobile use non-sticky in-flow reveals. Human-action annotation/context remains above the waterline; agent-work explanation and phase emphasis remain below it.
10. Perspective 09 (`Top Down View`) is absent from the rotating sequence. If included, it appears only after Scene 3 as a separate static final overview and does not create a ninth state, a fourth scene, or an animated transition.
11. The five phase labels stay visible in Write → Plan → Build → Check → Watch order, with deterministic state emphasis of 01 Write, 02–03 Plan, 04–05 Build, 06–07 Check, and 08 Watch. No alternate or duplicate phase labels are introduced.
12. All workflow scenes label the regions `HUMAN CONTROL` and `AGENT EXECUTION`; the workflow boat remains on the waterline, all four human callouts remain visible above it, and current perspective and phase are identifiable without relying on color alone. These labels and callouts do not appear in the first viewport.
13. Scrolling backward reverses the perspective, reveal, explanation, and phase-emphasis progression; returning to the same scroll position restores the same result without timer-driven selection, automatic cycling, shuffled data, or runtime randomness.
14. At 390px, the page has no horizontal overflow or clipped content; the first viewport stacks H1 → artwork → supporting paragraph → CTAs, and in `#workflow` human callouts form a two-column group, agent phases form a vertical list, sticky pinning is disabled, and all eight states appear in exactly three normal-flow groups of `3 + 3 + 2`.
15. With reduced motion enabled, smooth scrolling, sticky choreography, and workflow state/part transitions are absent. All four workflow human annotations, all five phases, and Perspectives 01–08 with every contextual explanation are visibly available in a static accessible `3 + 3 + 2` sequence.
16. Keyboard users can reach both CTAs with visible focus, activate them, and read the hero and workflow in logical DOM order; meaningful images have concise text alternatives, workflow labels and explanations are not image-only, decorative art is hidden from assistive technology, and scroll-only state creates no keyboard stops or `aria-live` announcements.
17. Light and dark themes retain WCAG AA contrast, and the existing navigation, downstream sections, footer, theme behavior, `/landingpage` route, and content outside hero/`#workflow` do not regress.
18. `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:e2e` complete successfully.
