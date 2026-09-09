# Paper-Boat Hero — Three-State Scroll Design

- **Date:** 2025-03-08
- **Status:** Approved implementation contract, corrected to the clarified Figma sequence
- **Implementation surface:** `landingpage.html`
- **Figma source:** file `c7xbPzX1acJ5jX2gK6ZljP`, frame `571:3`, container `571:6`

## Objective

Open with the approved Figma promise and make the People/Agent ownership split visible immediately:

> People lead the vision. Agents do the rest.

The hero is one bounded, deterministic, three-state scroll narrative. Every state combines one local paper-boat image with two accessible HTML responsibility blocks. The supporting paragraph and CTA row are outside the crossfading panels and remain stationary throughout the sequence.

## Scope and preservation

### In scope

- Hero markup, page-local hero styles, and the hero scroll controller in `landingpage.html`.
- Three checked-in image fills under `public/landingpage-assets/`.
- Decorative leader/construction lines connecting both text blocks to the artwork.

### Preserved

- Navigation, destinations, theme controls, footer, downstream content, and section order.
- The supporting paragraph and exact CTA labels/destinations.
- The independent `#workflow` interaction: Perspectives 01–08 in three scenes grouped `01–03`, `04–06`, and `07–08` (`3 + 3 + 2`).
- The workflow's four human labels (`Lead the vision`, `Set the constraints`, `Judge the evidence`, `Hold the context`) and five agent labels (`Write`, `Plan`, `Build`, `Check`, `Watch`).
- `/landingpage` serving and build behavior.

### Out of scope

- `catalog.html`, `src/catalog/**`, shared application styles, application screens, routing, APIs, backend behavior, and `docs/New Konteks/`.
- Any change to the workflow state model.
- Timers, autoplay, randomness, shuffled state arrays, or remote runtime image dependencies.

## Fixed hero content

The eyebrow remains above the H1 as subtle green uppercase DM Sans 700 at 13px with `.14em` letter spacing:

`THE AI CONTROL PLANE FOR SOFTWARE ENGINEERING`

The H1 is exactly:

```text
People lead the vision.
Agents do the rest.
```

Each state replaces both responsibility blocks together:

| State | People block | Agent block |
|---|---|---|
| 1 | `PEOPLE` / `Lead the vision` / `Decide what should exist, and what we will not build.` | `AGENT` / `Planning` / `Read the note and the code. Write what gets built, what done means, and a ceiling.` |
| 2 | `PEOPLE` / `Set the constraints` / `The budget ceiling, who may touch what, and what done means.` | `AGENTS` / `Build` / `On its own branch, across every repo the change touches, with a second agent reviewing.` |
| 3 | `PEOPLE` / `Judge the evidence` / `Read the plan, the checks, and the receipt. Know when it is thin.` | `AGENTS` / `Check` / `Click through the work in a real browser. Keep the screenshots. Say what could not be verified.` |

State 1's blocks correspond to Figma text groups `574:3168` and `574:3169`. Every label, title, and description is semantic DOM text, never flattened into an image.

## Asset mapping

| Hero state | Figma image-fill node | Local asset |
|---|---|---|
| 1 | `571:642` | `public/landingpage-assets/figma-paper-boat-hero.png` |
| 2 | `572:713` | `public/landingpage-assets/figma-paper-boat-hero-people.png` |
| 3 | `574:1945` | `public/landingpage-assets/figma-paper-boat-hero-agent.png` |

The images are local 703×703 transparent PNGs. Preserve transparency and aspect ratio; do not crop or redraw them.

## Composition

- Desktop background is `#FAF8EF`.
- The sticky stage defines `--hs: min(1, calc((100svh - 68px) / 942px))`; every vertical geometry value from the 908px Figma container plus its 34px eyebrow allowance scales by this unitless factor so the complete composition fits short laptop viewports.
- At scale 1, the H1 starts at 58px, is centered at 88/86px with `-3.08px` tracking, and the 703×703 artwork starts at 128px.
- State 1 positions PEOPLE at left 90px/top 373px and AGENT at right 90px/top 475px. State 2 moves PEOPLE 44px down and AGENT 36px up; state 3 moves PEOPLE 40px up and AGENT 44px down. All offsets scale with `--hs`.
- Every information block is 218px wide and left-aligned. Labels are DM Sans 700 15px in `#5F8D4E`; titles are DM Sans 700 20px/31px in `#243025`; descriptions are DM Sans 400 14px/21px in `#52644F`. Information titles do not use Fraunces.
- Leaders are plain 1px `#243025` dashes in an approximate 4/4 pattern with no endpoint dot. The PEOPLE leader sits above its block and slopes toward the boat's upper center; the AGENT leader extends left near the lower/underwater artwork.
- The centered supporting paragraph starts at 676px and uses DM Sans 20/31px. CTA controls start at 782px, are 46px high with a 12px gap, and use DM Sans 700 16px. These values scale with `--hs`.
- Both responsibility blocks are visible in state 1. One sits on each side of the artwork.
- The eyebrow, H1, supporting paragraph, and CTA row do not crossfade, swap, or move between states.

## Scroll model

- The hero owns one bounded sticky stage and exactly three authored state panels.
- Current state and adjacent-state opacity derive only from the hero's clamped scroll progress.
- Scrolling down produces state `1 → 2 → 3`; scrolling up reverses `3 → 2 → 1` at the same positions.
- Images crossfade with their state panels. Under `html.lp-hero-scroll-enhanced`, an active state's PEOPLE block slides 28px in from the left and its AGENT block slides 28px in from the right over 450ms using `cubic-bezier(.16, 1, .3, 1)`; leaders reveal by `clip-path` beginning 120ms later. Inactive states reverse through the same CSS transitions.
- The same scroll position always produces the same image, copy, and blend.
- No timer, automatic cycle, random value, observer ordering, or shuffle chooses a state.
- `#workflow` remains an independent subsequent scroll interaction.

## Responsive and reduced motion

- **Desktop:** use the bounded sticky hero stage and Figma geometry above.
- **Tablet/mobile:** preserve the initial visual order H1 → artwork → supporting paragraph → CTAs. The two active information blocks compact around the artwork with 15px labels, DM Sans 700 18–20px titles, 14px descriptions, and simplified dashed leaders. Artwork scales without cropping and the hero creates no horizontal overflow.
- **Reduced motion:** remove hero sticky choreography and crossfades. Show all three image states and both HTML information blocks per state in normal-flow static order. Keep the eyebrow, H1, supporting paragraph, CTAs, and decorative leaders present. Preserve the workflow's static `3 + 3 + 2` fallback.

## Accessibility

- Use one semantic `<h1>` for the promise.
- Keep all responsibility content as text and each meaningful image supplied with concise alternative text.
- Mark leader lines `aria-hidden="true"`.
- Scroll-only state changes add no keyboard stops and use no `aria-live` announcements.
- Preserve visible CTA focus states, exact CTA hrefs, and logical DOM/tab order.
- Maintain WCAG AA contrast and avoid horizontal overflow at 390px.

## Acceptance criteria

1. At the top of the hero, the eyebrow and both state-1 PEOPLE/AGENT blocks are visibly rendered with image node `571:642`.
2. The hero contains exactly three authored state panels in state 1 → state 2 → state 3 DOM order, each with one mapped local image and both exact HTML information blocks.
3. Scrolling forward crossfades image and both blocks through all three states; scrolling backward restores them at the same positions.
4. The supporting paragraph and two CTAs remain visible and stationary at every hero state, with exact hrefs `https://app.konteks.io/` and `#workflow`.
5. Visible 1px 4/4-style dashed leader lines point from both blocks toward the artwork, have no endpoint dots, and are decorative/`aria-hidden`.
6. Hero state selection is scroll-only and contains no timer, randomness, autoplay, or shuffled order.
7. At 1440×900 and 390×844 the page has no horizontal overflow and the hero content remains readable.
8. With `prefers-reduced-motion: reduce`, all three images and all six information blocks are simultaneously visible in static normal flow; the lede/actions remain present.
9. Existing `#workflow` Perspectives 01–08, scene grouping `3 + 3 + 2`, labels, and reverse-scroll behavior remain intact.
10. At 1440×768 and 1280×720, the scaled CTA row ends inside the sticky stage and both buttons are visible in the initial viewport.
11. Information-block computed typography is DM Sans at 15px/20px/14px for label/title/description on desktop; both blocks are left-aligned.
12. State 2 and state 3 use distinct vertical positions for both information blocks, and active blocks plus leaders use the specified slide/reveal transitions.
13. `npm run typecheck`, `npm run build`, focused Playwright checks, and `git diff --check` pass.
