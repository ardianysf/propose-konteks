# Composer Layout Correction — Design Specification

- **Date:** 2026-08-16
- **Artifact type:** Design correction spec (documentation only — no production code changes)
- **Status:** Approved correction — source of truth for the New Session page composer layout
- **Amends:** `2026-08-16-konteks-visual-revamp-design.md`

---

## 1. Purpose

Correct the New Session page composer hierarchy and placement from the approved visual revamp. The corrected design introduces a page intro above the composer, consolidates the Engineering/Planning mode control, the Engineering-only setup selectors, the prompt input, the input toolbar, the Execution Profile, and the Reviews waiting affordance into a single unified composer container, and relocates the disclaimer to page level in place of the previous `Illustrative data` marker.

This document is documentation only. It defines the target contract for a later implementation phase and does **not** modify production code, tests, styles, or assets.

## 2. Authority and override scope

This correction is approved and **overrides conflicting composer hierarchy/placement details** in `2026-08-16-konteks-visual-revamp-design.md`. Specifically, it supersedes:

- **§7.1 "Mode hierarchy"** — the Engineering/Planning control is no longer a standalone dominant switch rendered above the setup row and composer. It moves into the composer container's top row, right-aligned.
- **§7.2 "Composer"** toolbar/footer placement — the Execution Profile control no longer sits "bottom-left of the composer toolbar, after the text/document control"; the disclaimer no longer sits inside the composer footer; the toolbar no longer mixes tool icons with the profile/send controls in a single row.
- **AC15** (dominant mode control above everything) and **AC21** (Execution Profile after text/document in the toolbar) are replaced by the acceptance criteria in §10 below.
- **AC18/AC20** are refined: the composer is still a soft-matcha outer container, but the white input becomes a nested text-input box that also hosts the input toolbar; the disclaimer moves outside the container; "Reviews waiting" moves to the composer's bottom row.
- **The New Session page-level `Illustrative data` marker** is replaced by the exact disclaimer text (§6).

Everything else in the earlier spec remains in force. This correction does **not** change business behavior, mode semantics, setup selector behavior, the Execution Profile menu contents, the reviews drawer, overlay lifecycle, or any page other than the New Session page. Where this document is silent, `2026-08-16-konteks-visual-revamp-design.md` still governs.

## 3. Scope

- The New Session page intro (image, heading, subtitle).
- The single unified composer container and its internal regions: top row (selectors + mode), nested text-input box (textarea + input toolbar), and bottom row (Execution Profile + Reviews waiting).
- The page-level disclaimer and its relationship to the `Illustrative data` marker.
- Behavioral preservation guarantees for the items listed in §9.

## 4. Non-goals

- No change to Engineering/Planning mode semantics, default mode, or arrow-key switching.
- No change to the Engineering-only setup selectors' behavior (repository modal, anchored component menu).
- No change to the Execution Profile anchored menu (contents, sidecar, workspace settings, Manage/Customize entry).
- No change to the Konteks Learned drawer, Session History, Customize, Account, or Settings surfaces.
- No change to the send-disabled-on-empty contract or the overlay focus/Escape lifecycle.
- No removal of global AC46 illustrative-data coverage — the sidebar marker stays.
- No mobile/tablet layouts; desktop-only responsive behavior as before.
- No production code, test, or style changes in this task.

## 5. Architecture and DOM order

The New Session page region keeps its landmark name (`aria-label="New session"`). Its single visible page title is now `Start Session`. Top-to-bottom DOM order inside the region:

1. **Intro** (new, above the composer)
   - Decorative illustration: `/assets/konteks/empty-sessions.png` (rendered with empty alt text `alt=""`, decorative — the heading carries the accessible name).
   - Visible heading `Start Session` — the page's single `h1` (replaces the previous visually-hidden page heading).
   - Subtitle: `Start governed work with the right mode and context.`

2. **Unified composer container** (exactly one composer container; no separate mode/setup regions outside it)
   - **Top row**
     - Left cluster: System/repository trigger and Component trigger (Engineering only).
     - Right cluster: Session Mode radio group (Engineering / Planning segmented control), right-aligned on the same row.
     - In Planning mode, the System/repository and Component triggers are removed from the DOM; the Session Mode radio group remains, right-aligned.
   - **Nested text-input box** (white surface, visually inside the container)
     - `textarea` prompt input.
     - Input toolbar at the bottom of the text-input box:
       - Left: `Attach file` and `Add text document`.
       - Right: `Voice input` and `Send` (Engineering) / `Start planning` (Planning).
       - All four controls are visually inside the text-input box.
   - **Bottom row**
     - Left: Execution Profile control (its anchored menu still opens from this control).
     - Right: `Reviews waiting` label with its round count badge (still opens the Konteks Learned drawer on the Pending tab).

3. **Disclaimer** (page level, outside the composer container)
   - Exact copy: `Konteks can make mistakes. Review outputs before adopting them.`
   - Rendered where the previous page-level `Illustrative data` note sat, at the foot of the New Session page. The page no longer renders `Illustrative data`.
   - The sidebar keeps its own `Illustrative data` marker, preserving global AC46 coverage.

## 6. Styling intent

- Use only the Warm Enterprise palette tokens (`--kx-canvas`, `--kx-raised`, `--kx-pale`, `--kx-border`, `--kx-accent`, `--kx-accent-strong`, `--kx-primary`, `--kx-secondary`, `--kx-muted-*`, `--kx-accent-text-aa`, `--kx-accent-solid-aa`) and the DM Sans scale (`24/20/18/16/13/12/11/10`). No new colors or type sizes.
- **Intro:** centered; the illustration is compact (constrained height so the whole page fits 1200×720 — maximum image height ≈ 140px, width auto, no stretching); heading uses 24px (3XL) primary; subtitle uses 13px (MD) secondary/muted-AA.
- **Composer container:** retains the soft-matcha outer treatment (pale wash `--kx-pale` + hairline `--kx-border` + rounded corners) so it still reads as one unified surface; internal regions separated by small consistent gaps (≈ 10–12px).
- **Top row:** flex with `justify-content: space-between`; the left cluster of setup triggers and the right Session Mode group sit on the same baseline. In Planning the remaining Session Mode group stays flush right.
- **Text-input box:** white `--kx-raised` surface with hairline border and rounded corners (≈ 14px), clearly contrasting with the pale container; the textarea is inside it and the input toolbar hugs the bottom of this white box (not the container).
- **Input toolbar:** flex with left group (Attach file, Add text document) and right group (Voice input, Send/Start planning) separated by `justify-content: space-between`. Tool icons remain unboxed with the shared hover affordance; the send element remains the soft-accent element.
- **Bottom row:** flex with `justify-content: space-between`; Execution Profile control left, `Reviews waiting` + round badge right.
- **Disclaimer:** page-level small muted text (`--kx-text-xs`, muted-AA) matching the previous illustrative-note treatment, but with the exact disclaimer copy. It must not be inside the composer container.

## 7. Responsive behavior

- Ideal viewport **1440×900**: single centered column with the composer container at its existing max width (≈ 780px); intro, top row, input box, and bottom row all on their intended rows.
- **1200×720**: no horizontal page scroll and no clipped controls. The ≤1280px sidebar rail behavior from the earlier spec is unchanged. The composer top row may wrap gracefully (flex-wrap allowed as a safety valve: setup cluster and mode group may stack) but must never overflow or clip; the input toolbar keeps all four controls visible; the bottom row and disclaimer remain inside the viewport.
- The page-level vertical scroll region remains `.kx-main` (document-level scroll stays locked).

## 8. Accessibility semantics

- The page has exactly one `h1`: the visible `Start Session` heading.
- **Session Mode** keeps `role="radiogroup"` with `aria-label="Session mode"`, roving `tabindex`, `aria-checked`, and arrow-key switching (ArrowRight/Down → Planning, ArrowLeft/Up → Engineering). Its semantics are unchanged by the move into the container.
- **System/repository** and **Component** triggers keep their button semantics, accessible names, `aria-haspopup` (`dialog` / `menu`), and `aria-expanded`. In Planning they are removed from the accessibility tree (removed from the DOM), not merely visually hidden.
- **Textarea** keeps its visible-label association (`Engineering prompt` / `Planning prompt`) and placeholder copy.
- **Toolbar buttons** keep accessible names (`Attach file`, `Add text document`, `Voice input`, `Send` / `Start planning`).
- **Execution Profile** keeps `aria-haspopup="menu"` and `aria-expanded`; its anchored menu, sidecar, workspace settings section, and Manage/Customize entry are unchanged.
- **Reviews waiting** is a button whose accessible name conveys the pending count; it still opens the Learned drawer.
- **Disclaimer** is a plain paragraph (no landmark/role needed).
- Focus order follows visual/DOM order: intro (non-interactive, skipped) → selectors (Engineering) → Session Mode → textarea → input toolbar → Execution Profile → Reviews waiting → disclaimer (non-interactive).
- Overlay focus-return and single-Escape dismissal (OverlayLifecycle) are unchanged.
- All text meets WCAG AA contrast against `--kx-raised` and `--kx-pale`; every control keeps a visible focus indicator.

## 9. Behavior preservation (must not regress)

1. **Mode semantics / arrow behavior:** Engineering is the default; `SET_MODE` reducer; radio-group semantics; arrow-key switching; Planning placeholder `Describe the product outcome you want to plan…`; `Start planning` CTA.
2. **Engineering-only setup selectors:** System/repository opens the repository modal; Component opens the anchored component menu; Planning removes both selectors from the DOM.
3. **Execution Profile menu anchoring:** anchored (no modal/backdrop), flat profile list, hover/focus sidecar (Planner model, Executor model, authorization, readiness), workspace-level Assistant/Search under a separated section, Manage/Customize Profile entry.
4. **Send disabled on empty:** Send and Start planning are disabled while the input is empty or whitespace-only and enabled once non-whitespace text exists.
5. **Reviews waiting → drawer:** opens the Konteks Learned 450px right drawer on the Pending tab.
6. **Overlay focus/Escape lifecycle:** exactly one overlay at a time; Escape closes and returns focus to the originating trigger via the shared lifecycle.
7. **Viewport safety:** 1440×900 and 1200×720 render without horizontal scroll or clipped controls; ≤1280px rail behavior unchanged.

## 10. Acceptance criteria

1. The New Session page renders an intro above the composer containing `/assets/konteks/empty-sessions.png` (decorative, `alt=""`), a visible `Start Session` heading, and the subtitle `Start governed work with the right mode and context.`.
2. `Start Session` is the page's single `h1`.
3. There is exactly one composer container on the page — no separate mode or setup region outside it.
4. In Engineering mode, the System/repository and Component selectors are left-aligned and the Session Mode radio group is right-aligned on the same top row inside the container.
5. In Planning mode, the System/repository and Component selectors are absent from the DOM and the Session Mode radio group remains right-aligned in the top row.
6. The prompt `textarea` renders inside a nested white text-input box that is visually inside the composer container.
7. The input toolbar renders at the bottom of the text-input box: Attach file and Add text document left-aligned; Voice input and Send (Engineering) / Start planning (Planning) right-aligned; all four controls visually inside the text-input box.
8. The composer bottom row shows Execution Profile left-aligned and Reviews waiting (label + round count badge) right-aligned.
9. The exact disclaimer `Konteks can make mistakes. Review outputs before adopting them.` renders at page level outside the composer container.
10. The New Session page no longer renders an `Illustrative data` marker; the sidebar retains its `Illustrative data` marker, preserving global AC46 coverage.
11. Mode semantics and arrow-key switching are preserved (Engineering default, radio-group semantics, Planning placeholder and `Start planning` copy).
12. The Engineering-only setup selectors preserve their existing overlay behavior (repository modal and anchored component menu).
13. The Execution Profile control preserves anchored-menu behavior (no backdrop, flat list, sidecar, workspace settings section, Manage/Customize entry).
14. Send / Start planning remain disabled on empty or whitespace-only input and enabled once non-whitespace text exists.
15. Reviews waiting still opens the Konteks Learned 450px drawer on the Pending tab.
16. Overlay focus-return and single-Escape dismissal behavior are unchanged.
17. At 1440×900 and 1200×720 there is no horizontal page scroll and no clipped controls; the intro, top row, input toolbar, and bottom row are fully visible.
18. Keyboard focus order follows visual/DOM order; every control has an accessible name and a visible focus indicator; axe wcag2aa reports zero violations on the New Session page.

## 11. Test strategy

Implementation-phase test plan (this task is documentation only and introduces no code):

- **Unit/component (Vitest + Testing Library):** assert DOM order intro → composer (top row → input box → bottom row) → disclaimer; assert left/right grouping within the top row and input toolbar via `compareDocumentPosition`; assert Planning removes the selectors but keeps the mode group; assert the disclaimer is outside the composer container; assert the page-level `Illustrative data` marker is gone while the sidebar marker remains; keep existing regressions for mode/arrow switching, send-disabled-on-empty, profile-menu dispatch, and reviews-drawer dispatch.
- **E2E (Playwright):** geometry assertions — intro bounding box above the composer; selector cluster left of the mode group on the same row; the four toolbar controls contained within the white input box's bounding box; Execution Profile left of Reviews waiting; disclaimer below the container. Assert no horizontal overflow at both 1440×900 and 1200×720, and capture screenshots of the New Session page at both viewports.
- **Responsive:** extend the source-string CSS assertions for the new container/top-row/input-toolbar/bottom-row rules (flex, `space-between`, wrap safety), plus the 1200×720 viewport checks.
- **Accessibility:** axe wcag2aa zero violations; keyboard-only traversal (Tab order, Escape, arrow keys on the radiogroup); visible focus indicators.
- **Test updates required:** existing tests that assert the old contract (Session Mode above the setup row and composer; Execution Profile inside the toolbar after Add text document; disclaimer inside the composer footer; page-level illustrative note on New Session page) must be updated to the corrected contract when implemented. These updates are a consequence of this correction, not a business-behavior change.

## 12. Self-review

- **Placeholders:** none. Asset path, heading, subtitle, and disclaimer copy are exact and match the approved design.
- **Contradictions:** none. §2 explicitly lists the earlier-spec clauses this correction overrides; all other earlier-spec clauses remain in force.
- **Ambiguity:** the disclaimer copy is character-exact (including the trailing period); the top-row left/right alignment, nested input-box toolbar grouping, bottom-row grouping, and page-level disclaimer placement are each stated as a numbered acceptance criterion with a matching test strategy.

---

*End of specification.*
