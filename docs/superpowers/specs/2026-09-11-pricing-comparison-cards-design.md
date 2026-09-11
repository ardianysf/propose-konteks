# Pricing Comparison Cards — Aligned Bands and External Team Ribbon

## Status

Approved design direction, written spec ready for implementation review. Spec only — no application files were modified for this document. Not committed.

## Objective

Restyle the five-plan block in `pricing.html` (`.plans-chapter` / `.plan-ledger`) into horizontal five-plan comparison cards with fixed, aligned horizontal bands, and move the Team highlight badge out of the card into a small dark-green ribbon attached seamlessly above the Team card. The page must read as one ledger: five cards, same top edge, same band seams, CTAs bottom-aligned, Team alone highlighted.

## Source of truth (user-approved direction)

- Horizontal five-plan comparison cards in `pricing.html`.
- Fixed aligned bands, top to bottom: **identity** (plan name + peruntukan/audience line), **price**, **included Story Points**, **features**, **CTA**.
- All five card bodies begin at the same y-coordinate; every band boundary aligns across the desktop cards; CTAs bottom-align.
- Team is the only highlighted card. A small dark-green ribbon reading “Most teams start here” sits **outside/above** the Team card body. All other cards begin normally — no rail, badge, or reserved rail space inside them.
- The ribbon must join the Team card seamlessly: no gap, clipping, white sliver, detached edge, or double border at the join. Visible overflow and a continuous border/background treatment must be preserved.

Reference note: screenshots were supplied as intent/reference, but they were not visually inspectable by the model that wrote this spec. The criteria below are derived from the approved written description; a vision-capable reviewer should cross-check the screenshots during implementation review.

## Scope

- `pricing.html` page-specific CSS (the block after `/* ---- Pricing page content ---- */`) and, only if needed for band semantics, the plan-card markup inside `.plan-ledger__rows`.
- The five `.plan-row` cards, their internal band structure, the Team highlight, and the external ribbon.
- Responsive behavior of the plan block at the existing breakpoints (≤1050px, ≤720px).

## Non-goals

- No changes to plan data, prices, copy, feature lists, CTA destinations, or the overage line.
- No changes to the page head, fonts, theme stamp, nav, footer, page-head, billing chapter, or notes chapter.
- No JavaScript additions; the ribbon and band alignment are pure CSS.
- No restyling of other pages, the product application, or `catalog.html`.
- No hand edits to `dist/` (generated output).
- No commit as part of this spec.

## Acceptance criteria

Numbered for validation. “Band boundary” means the y-coordinate where one named band ends and the next begins inside a card.

### Desktop (≥1051px)

1. The plan grid keeps five equal-width columns in one row (current `repeat(5, 1fr)`, 14px gap).
2. All five card bodies begin at the same y-coordinate: the five top borders sit on one horizontal line.
3. Each card contains the five bands in fixed order: identity (name + peruntukan), price (amount + qualifier + seat/user minimum line), included Story Points (SP label + allowance line), features, CTA.
4. Every band boundary — identity→price, price→SP, SP→features, features→CTA — aligns across all five cards. Extra height needed by the tallest card in a band is absorbed inside that band (content top-aligned within it), never by shifting a band seam in some cards.
5. Cards are equal height (grid stretch). CTA buttons top-align across cards and bottom-align at the card bottoms; button heights are identical.
6. The Team card is the only visually highlighted card (green-pale fill, green-dark border, solid CTA). The other four cards keep the default surface, border, and ghost CTA.
7. The “Most teams start here” ribbon is a compact dark-green (`var(--green-dark)`) pill/label positioned fully outside the card body, above the Team card, joined to the card’s top edge. Its text remains real, readable text.
8. No reserved ribbon space exists inside any card: the four non-Team cards’ identity bands start at the same interior y as Team’s, and Team’s identity band is not padded down to make room for the ribbon. The old in-card `.plan-stamp` placement (and the `min-height: 108px` identity-band reserve it required) is removed.
9. Ribbon seam, inspected at 1× and 2× (zoom 200%): zero gap, zero canvas/white sliver, no detached edge, and no double border where ribbon meets card. The ribbon’s background and the card’s 1px `--green-dark` top border read as one continuous shape; the ribbon’s top corners use the card’s corner radius treatment so the join looks intentional.
10. Nothing above the plan block (section heading, spacing) is overlapped or clipped by the ribbon: headroom is provided at the container level (e.g. top padding/margin on `.plan-ledger`), not inside cards.

### Tablet (≤1050px)

11. Cards wrap to the existing 3-column layout (3 + 2). Within each grid row, cards stretch to equal height and CTA buttons bottom-align.
12. Band boundaries align across cards that share a grid row (subgrid per-row or equivalent). If the implementation uses fixed per-band min-heights instead, boundaries may align across all cards; either outcome passes, misalignment within a row fails.
13. The Team ribbon remains attached above the Team card with the same seam criteria as desktop, regardless of which row Team occupies.

### Mobile (≤720px)

14. Cards stack in one column in plan order (Free, Builder, Team, Scale, Enterprise); cross-card band alignment is not required.
15. Each card keeps the five-band order in natural flow; the CTA remains full-width at the bottom of its card.
16. The Team ribbon remains outside/above the Team card, seamlessly joined, and does not cause horizontal overflow or scrolling.
17. No fixed min-heights from desktop leak into mobile causing large empty gaps; bands size to content.

### Both themes and motion

18. Ribbon, highlight, and band layout hold in light and dark themes using existing tokens (ribbon background `var(--green-dark)`, high-contrast text such as `var(--canvas)`), with no token hardcoding that breaks theme switching.
19. `prefers-reduced-motion` behavior is unchanged; no new transitions or animations are introduced by this work.

## Implementation constraints

- Modify only the pricing-page CSS (and plan-card markup if band splitting requires it) inside `pricing.html`; the shared shell stays verbatim.
- Do not add `overflow: hidden` (or `clip`) to `.plan-row`, `.plan-ledger__rows`, `.plan-ledger`, or any ancestor between the ribbon and the viewport — the ribbon depends on visible overflow.
- Preferred band mechanism: make each card a grid that participates in one shared row template — `grid-template-rows: subgrid` on `.plan-row` spanning five parent rows, with `@supports (grid-template-rows: subgrid)` fallback to per-band `min-height` values tuned so seams align in the fallback too.
- Preferred ribbon mechanism: `position: relative` on the Team card, ribbon absolutely positioned at a negative top offset, drawn in `var(--green-dark)`, with its bottom edge overlapping the card’s top border by exactly the border width (no gap, no second border line), and container-level headroom so the offset never clips.
- Keep `body { overflow-x: hidden }` as-is; it does not affect the ribbon, which overflows vertically inside the section.
- The Team CTA stays the only solid button; all other CTAs stay ghost buttons.
- No new runtime dependency, no images for the ribbon (text + CSS only).

## Validation checklist

- [ ] Desktop ≥1051px (check 1440, 1240, 1051): criteria 1–5 hold; screenshot all five cards and overlay guides on the five top edges and each band seam.
- [ ] Zoom the Team ribbon join to 200% (or 2× DPR screenshot) in light and dark themes: no gap, sliver, clip, or double border (criteria 7–9).
- [ ] Confirm the four non-Team cards have no badge, rail, or reserved top space (criterion 8).
- [ ] Tablet ~900–1050px (check 1000, 900): 3+2 wrap, per-row height/CTA alignment, ribbon intact (criteria 11–13).
- [ ] Mobile 390px (and 320px if supported): stacked order, full-width CTAs, ribbon attached, zero horizontal scroll (criteria 14–16; `document.documentElement.scrollWidth <= innerWidth`).
- [ ] Toggle light/dark and `prefers-reduced-motion`: ribbon and bands hold (criteria 18–19).
- [ ] Keyboard pass: tab reaches all five CTAs in order with visible focus rings; text-only zoom 200% causes no overlap at the ribbon join.
- [ ] Billing chapter, notes chapter, nav, footer, and all copy byte-identical to before the change.
- [ ] Vision-capable reviewer compares the result against the supplied intent/reference screenshots before sign-off.

## Handoff

Spec complete. Implementation may proceed against the numbered criteria above; the ribbon seam (criteria 7–10) and desktop band alignment (criteria 2–5) are the highest-risk checks.
