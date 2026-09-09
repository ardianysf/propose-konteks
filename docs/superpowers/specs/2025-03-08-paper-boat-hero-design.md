# Paper-Boat Hero — Design Specification

- **Date:** 2025-03-08
- **Status:** Approved contract for implementation
- **Implementation surface:** `landingpage.html`

## Objective

Reframe the landing-page opening around one clear metaphor: people steer above the waterline while agents carry out the work below it. The first view centers a paper boat, uses flat color fields and handwritten annotations, and states the approved promise exactly:

> People lead the vision. Agents do the rest.

The hero must make the human/agent boundary understandable before the visitor scrolls. The existing `#workflow` section then becomes a scroll-led continuation of the same scene.

## Scope and preservation

### In scope

- Replace the current two-column harbor hero in `landingpage.html` with the centered paper-boat hero defined here.
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

- Use a single centered composition rather than a copy/art split. The H1, paper boat, and CTA group share the page centerline.
- Render the approved H1 as two balanced lines, without inserting other headline copy:
  1. `People lead the vision.`
  2. `Agents do the rest.`
- Place one large paper boat at the visual center, sitting on a horizontal waterline. The boat is the dominant illustration; supporting marks must not compete with the H1. Its initial/idle view uses guideline Perspective 01 so the hero leads directly into the workflow's horizontal-rotation sequence.
- Use flat fills and line work only: no gradients, photorealism, glass/blur, or texture overlays. Continue using the existing cream, ink-sage, matcha, and accessible accent colors in both themes.
- Use the existing display type for the H1 and DM Sans for interface text. Handwriting is reserved for the four human annotations and small directional marks; it must remain readable, not decorative scribble.
- The waterline divides responsibility, not merely color. Label the region above it `HUMAN CONTROL` and the region below it `AGENT EXECUTION`; position and labels must communicate ownership without relying on color alone.

### Required labels

The human surface contains exactly these four callouts, with this capitalization and order in the DOM:

1. `Lead the vision`
2. `Set the constraints`
3. `Judge the evidence`
4. `Hold the context`

The agent path below the waterline contains exactly this five-step sequence:

1. `Write`
2. `Plan`
3. `Build`
4. `Check`
5. `Watch`

Do not add `Say yes`, `People`, `Agents`, or alternate phase names to either required label set. Give the composed scene this accessible description: `A paper boat rests on a waterline. Human control stays above; agent execution moves through Write, Plan, Build, Check, and Watch below.`

### Perspective source and state model

- Use guideline Perspectives 01–08, in numeric order, as the complete rotating sequence. They are eight sequential visual perspective/part stages in one continuous horizontal rotation: start at the front, continue through the right side and right rear, pass the rear, then continue through the left rear and left side to the left three-quarter view shown by Perspective 08. Follow the guideline artwork for each numbered view rather than inventing, mirroring, reordering, or skipping a view.
- Perspective 09 (`Top Down View`) must not appear among the rotating parts or between Perspectives 01–08 because its camera angle breaks horizontal-rotation continuity. It may be omitted. If included, place it only after Scene 3 as a clearly separate, static final overview; it does not become a ninth state, a fourth scroll scene, or an animated transition target.
- The eight numbered states are visual perspective/part stages, not workflow phases and not eight long scroll sections. Present them in exactly three ordered scroll scenes: Scene 1 contains 01, 02, 03; Scene 2 contains 04, 05, 06; Scene 3 contains 07, 08. This `3 + 3 + 2` grouping is fixed at every viewport width.
- Keep the five agent phases as a separate semantic path. Their state-to-phase emphasis is deterministic: 01 emphasizes `Write`; 02–03 emphasize `Plan`; 04–05 emphasize `Build`; 06–07 emphasize `Check`; and 08 emphasizes `Watch`. The five labels themselves remain visible in the required Write → Plan → Build → Check → Watch order; repeated emphasis across adjacent states does not create duplicate phase labels.
- Every numbered state has authored contextual explanation. Above the waterline, connect that state to one or more of the four existing human-action annotations; all four remain visible and no additional human-action heading is introduced. Below the waterline, expose the state-specific agent-work explanation under its mapped phase; do not introduce alternate phase names.

### Deterministic, spontaneous placement

Make callouts look pinned on by hand while keeping them stable across reloads. Do not use `Math.random()`, timestamps, viewport-dependent random seeds, or shuffled arrays.

At desktop widths, use these authored anchor points within the hero illustration stage; percentages identify each callout's center relative to the stage:

| Callout | X | Y | Rotation |
|---|---:|---:|---:|
| Lead the vision | 14% | 22% | -4deg |
| Set the constraints | 77% | 18% | 3deg |
| Judge the evidence | 80% | 39% | -2deg |
| Hold the context | 12% | 42% | 2deg |

Keep the desktop waterline at 55% of the stage height and all four callouts above it. Place the five agent labels below the line at these fixed `(X, Y)` centers: Write `(14%, 73%)`, Plan `(32%, 81%)`, Build `(50%, 73%)`, Check `(68%, 81%)`, and Watch `(86%, 73%)`. Breakpoint-specific layouts reflow as defined below, use fixed authored positions, and preserve the same reading order.

## Interaction and narrative

### Hero motion

- When reduced motion is not requested, the boat floats vertically through a 6px range on a four-second ease-in-out loop. When 25% of the hero first enters the viewport, annotation pointers reveal once over 160ms with an 80ms stagger. Motion must not move the H1 or CTA group.
- Use one deterministic reveal order: Lead the vision → Set the constraints → Judge the evidence → Hold the context. Once revealed, callouts stay visible.
- No pointer parallax, random callout movement, automatic phase cycling, or interaction required to understand the hero.

### CTA behavior

- `Start building ↗` is the primary CTA and navigates in the same tab to `https://app.konteks.io/`.
- `See how it works ↓` is the secondary CTA and moves to the retained `#workflow` anchor. Use smooth scrolling only when reduced motion is not requested; otherwise jump immediately.
- Both controls retain visible hover, active, and keyboard focus states. The CTA group remains after the H1 and hero description in DOM and tab order.

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

- **Desktop (`>= 900px`):** centered hero stage; authored annotation anchors; horizontal waterline; one sticky workflow stage controlled by exactly three scene ranges grouped `3 + 3 + 2`.
- **Tablet (`620–899px`):** maintain a centered boat and horizontal waterline, reduce illustration scale, move callouts into a fixed two-column grid above the line, and wrap agent phases into a fixed `3 + 2` layout below it. Disable sticky pinning and render exactly three normal-flow scene groups containing states 01–03, 04–06, and 07–08. When reduced motion is not requested, each state uses a lightweight scroll-linked movement/reveal as its scene traverses the viewport; its text remains in document flow and available if script or animation does not run.
- **Mobile (`< 620px`, verified at 390px):** stack H1, description, illustration, and CTAs; place the four human callouts in a two-column grid above the boat; render the five agent phases as a vertical ordered list below the waterline. Disable sticky pinning and render the same three scene groups and `3 + 3 + 2` state order in normal flow. When reduced motion is not requested, use the same lightweight, non-sticky scroll-linked state reveal as tablet.
- At every supported width, prevent text/boat/callout/explanation overlap, clipped focus rings, and horizontal page scrolling. Touch targets are at least 44×44px where elements are interactive.
- Under `prefers-reduced-motion: reduce`, disable smooth scrolling, boat float, annotation reveals, sticky scroll choreography, and all state/part movement, crossfades, and reveal transitions. Show all four human annotations, all five agent phase labels, and the authored explanations for Perspectives 01–08 immediately as a static accessible sequence, grouped 01–03, 04–06, and 07–08. Do not collapse, paginate, or require interaction to reach a state. The optional Perspective 09 overview, if present, remains a separate static item after the sequence.
- Pause nonessential hero motion whenever the document is hidden or the hero is outside the viewport.

## Accessibility

- Use one semantic `<h1>` for the approved headline and a labelled `<section>` for both the hero and workflow.
- Keep required callout, phase, state identifier, and contextual explanation text in the DOM. Do not bake meaningful text into an image or expose duplicate SVG text to assistive technology.
- Treat decorative waves, pointers, bubbles, and line art as `aria-hidden="true"`; give the composed illustration a concise text alternative describing the human-above/agent-below model.
- Reading order is H1 → supporting copy → CTAs → four human callouts → five agent phases → Perspectives 01–08 with their explanations grouped `3 + 3 + 2`. Within each perspective, human context precedes agent context. Visual absolute positioning and sticky state must not alter this DOM order.
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

1. Confirm there are exactly three workflow scene groups and that their state identifiers are 01–03, 04–06, and 07–08; verify the eight perspectives have not been expanded into eight long scroll sections and that there is no fourth scroll scene.
2. Scrub desktop scrolling forward and backward through all eight states. Confirm smooth adjacent movement/reveal, the exact horizontal-rotation order, the state-specific explanation, and deterministic phase emphasis: 01 Write, 02–03 Plan, 04–05 Build, 06–07 Check, 08 Watch.
3. Confirm all human annotations/context stay above the waterline and all agent phase labels/work stay below it. Verify the four human labels and five agent labels against their exact approved copy and order.
4. Confirm Perspective 09 does not occur in the rotating sequence. If it is implemented, verify it appears only after Scene 3 as a static normal-flow overview and that it does not change the `3 + 3 + 2` count.
5. With reduced motion enabled, confirm there is no sticky choreography or state animation and that Perspectives 01–08 and every explanation are simultaneously available in a visible, logical static sequence.
6. Reload and revisit matching scroll positions to confirm identical artwork, placement, active state, explanation, and phase emphasis.

Search the implementation for forbidden runtime randomness:

```bash
rg "Math\.random|crypto\.getRandomValues" landingpage.html
```

The randomness search must return no matches in hero/workflow behavior. Also inspect the hero/workflow script to confirm state selection is scroll-derived and contains no shuffled arrays, timer-driven state choice, or generated copy.

## Acceptance criteria

1. `landingpage.html` displays one centered hero whose H1 reads exactly `People lead the vision. Agents do the rest.` and presents the sentence as two balanced lines; its existing supporting paragraph remains verbatim.
2. The hero's dominant illustration is one centered paper boat on a horizontal waterline, built with flat colors and line work and no gradients, photorealism, glass/blur, or texture overlay; its initial/idle view matches guideline Perspective 01.
3. Above the waterline, the only human responsibility callouts are exactly `Lead the vision`, `Set the constraints`, `Judge the evidence`, and `Hold the context`, in that DOM order.
4. Below the waterline, the agent sequence is exactly `Write`, `Plan`, `Build`, `Check`, `Watch`, in that visual and DOM order.
5. The four desktop callouts and five underwater labels use the fixed authored anchors in this specification; repeated reloads at the same viewport produce the same placement, and hero/workflow code contains no runtime randomness.
6. `Start building ↗` navigates in the same tab to `https://app.konteks.io/`; `See how it works ↓` targets the existing `#workflow` anchor.
7. `#workflow` no longer contains the signal-pill/falling-dot/terminal/ticket-grid presentation. Its rotating sequence contains exactly the eight numbered states from guideline Perspectives 01–08 in numeric horizontal-rotation order, from front through right side/right rear and rear to left rear/left side/left three-quarter; no state is invented, mirrored, reordered, duplicated, or skipped.
8. The eight states are grouped into exactly three ordered scroll scenes: 01–03, 04–06, and 07–08. They are visual perspective/part stages within those scenes, not eight long scroll sections and not eight workflow phases.
9. When reduced motion is not requested, each of Perspectives 01–08 moves/reveals smoothly as its scene is scrolled and exposes an authored contextual explanation; desktop uses the sticky sequence, while tablet and mobile use non-sticky in-flow reveals. Human-action annotation/context remains above the waterline; agent-work explanation and phase emphasis remain below it.
10. Perspective 09 (`Top Down View`) is absent from the rotating sequence. If included, it appears only after Scene 3 as a separate static final overview and does not create a ninth state, a fourth scene, or an animated transition.
11. The five phase labels stay visible in Write → Plan → Build → Check → Watch order, with deterministic state emphasis of 01 Write, 02–03 Plan, 04–05 Build, 06–07 Check, and 08 Watch. No alternate or duplicate phase labels are introduced.
12. The hero and all workflow scenes label the regions `HUMAN CONTROL` and `AGENT EXECUTION`; the boat remains on the waterline, all four human callouts remain visible above it, and current perspective and phase are identifiable without relying on color alone.
13. Scrolling backward reverses the perspective, reveal, explanation, and phase-emphasis progression; returning to the same scroll position restores the same result without timer-driven selection, automatic cycling, shuffled data, or runtime randomness.
14. At 390px, the page has no horizontal overflow or clipped content; hero content stacks, human callouts form a two-column group, agent phases form a vertical list, sticky pinning is disabled, and all eight states appear in exactly three normal-flow groups of `3 + 3 + 2`.
15. With reduced motion enabled, smooth scrolling, floating/reveal motion, sticky choreography, and state/part transitions are absent. All four human annotations, all five phases, and Perspectives 01–08 with every contextual explanation are visibly available in a static accessible `3 + 3 + 2` sequence.
16. Keyboard users can reach both CTAs with visible focus, activate them, and read the hero/workflow in logical DOM order; meaningful labels and explanations are not image-only, decorative art is hidden from assistive technology, and scroll-only state creates no keyboard stops or `aria-live` announcements.
17. Light and dark themes retain WCAG AA contrast, and the existing navigation, downstream sections, footer, theme behavior, `/landingpage` route, and content outside hero/`#workflow` do not regress.
18. `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:e2e` complete successfully.
