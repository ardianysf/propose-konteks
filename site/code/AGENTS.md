# AGENTS.md: applying the Konteks UI redesign to the live app

Instructions for a coding agent (Claude Code, Codex, Cursor) working in the live Konteks codebase. Copy this file to the repo root, or reference it from the repo's CLAUDE.md, next to `konteks-ui/` (this package).

## The one rule

**Change how it looks, never what it does.** Pages, menus, form fields, steps, actions, API calls and permissions stay exactly as they are. `parity/LIVE_PARITY.md` is the list of what exists; `PRODUCT.md` says who the product is for and which principles decide trade-offs. If a change would add, remove or reorder a step, field or action, stop and ask.

## Sources of truth, in order

1. `DESIGN.md`: every token, size, component and rule, with the reason behind each.
2. `tokens.css` + `tokens.live-map.css`: the values. The live-map fills the variables the app already reads (`--kx-*`, `--color-app-*`), so most screens change without touching components.
3. `tailwind.preset.js`: keeps the `app-*` class names. Old font sizes and radii fall onto the new steps.
4. `components.scoped.css`: the components, scoped under `.kx`. Put `class="kx"` on a migrated page root **and** on the portal host (drawers, dialogs, menus, toasts).
5. `inventory.csv`: every live element → component → audit finding → demo screen in the prototype. Use it to find what to change on a screen and what "done" looks like.
   The findings themselves are in `docs/konteks-audit-ui-ux.pdf` (or `docs/audit-ui-ux.md`); their status and acceptance criteria are in `AUDIT-STATUS.md`.
6. `prototype/`: the reference rendering. Open `prototype/index.html#<route>` to see the target for any screen.

## Work order (each step ships on its own)

1. Tokens: import `tokens.css` and `tokens.live-map.css` after the app styles. Visual only.
2. Tailwind preset: add it to `presets`. Visual only.
3. Fonts: Inter + JetBrains Mono (or the face the team picks; see DESIGN.md › Typography). Tabular numbers only on numeric elements.
4. Screens, one PR per module, in this order: shell and sidebar → Work In Progress list and detail → overlays → Customize → Settings → the rest. For each screen, filter `inventory.csv` by its `where` column and work through the rows.

## Rules that are easy to break

- **Colour:** no hex, rgb/hsl or color-mix outside `tokens.css`. Run stylelint with `.stylelintrc.json` from this package; it fails on raw colours.
- **Type:** only 12, 13, 14, 16, 20 and 28px, and at most five sizes on one page. Body text is 13–14px; that is a product decision, do not raise it. A heading is larger or heavier than what it heads.
- **Radius:** 4 (inside controls), 6 (controls), 10 (containers). Pills only for avatars and the switch.
- **Icons:** Lucide, stroke 1.75, 16px for navigation and headers, 14px inline. One icon, one meaning (see DESIGN.md › Icons). No icon on System tags.
- **Overlays:** a drawer to look at or review, a modal to fill in and submit (multi-step stays in one modal), a dialog to confirm one consequence, a popover to pick or glance, inline to change one value. Escape closes the top layer only, and focus returns to the trigger.
- **Dates:** absolute text ("Today, 12.40" or "27 Oct 2026, 12.40"); relative time only in the `title`. One formatter.
- **Copy:** sentence case. A modal's title is the label of the button that opened it. Never show raw error codes, snake_case or machine IDs; say who can grant access and offer Request access.
- **Permissions:** a control the user cannot use is shown read-only in the one locked style, with a lock strip naming the role (as in the Roles list) and a Request access button.
- **Targets:** nothing pressable is under 24px.

## Definition of done for a PR

- `npx stylelint "**/*.css"` passes.
- The screen matches `prototype/index.html#<route>` at 1440 and 375px, in light and dark.
- Every `inventory.csv` row for that screen is satisfied. The audit finding IDs (UX-0xx, DS-0x) in the `components` and `note` columns point to the acceptance criteria in `AUDIT-STATUS.md`.
- No change to routes, requests or payloads. Diff the network calls of the screen before and after.
- Keyboard: Tab reaches every control, Escape closes one layer at a time, focus is always visible.
