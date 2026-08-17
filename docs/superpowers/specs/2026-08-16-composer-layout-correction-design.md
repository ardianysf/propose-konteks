# Composer Layout Correction — Design Specification

- **Date:** 2026-08-16
- **Artifact type:** Design correction spec (documentation only — no production code changes)
- **Status:** Approved correction — source of truth for the New Session page composer layout
- **Amends:** `2026-08-16-konteks-visual-revamp-design.md`

---

## 1. Purpose

Correct the New Session page composer hierarchy and placement from the approved visual revamp. The corrected design introduces a page header (a visible `New session` title with subtitle and a right-aligned `Human approval required for proposals` indicator) above a centered intro (the `empty-sessions.png` illustration and a mode-specific heading/body — `What would you like to build?` in Engineering and `Start planning` in Planning), and consolidates the Engineering/Planning mode control, the mode-specific setup pills, the prompt input, the input toolbar, the Execution Profile, and the prompt CTA into a single unified composer container. The disclaimer moves to a page-level footer outside the composer (left), with `Reviews waiting` rendered as a pill (right) in the same footer, replacing the previous page-level `Illustrative data` marker.

This document is documentation only. It defines the target contract for a later implementation phase and does **not** modify production code, tests, styles, or assets.

## 2. Authority and override scope

This correction is approved and **overrides conflicting composer hierarchy/placement details** in `2026-08-16-konteks-visual-revamp-design.md`. Specifically, it supersedes:

- **§7.1 "Mode hierarchy"** — the Engineering/Planning control is no longer a standalone dominant switch rendered above the setup row and composer. It moves into the composer container's top row, right-aligned, with the mode-specific setup pills left-aligned on the same row.
- **§7.2 "Composer"** toolbar/footer placement — the Execution Profile control no longer sits "bottom-left of the composer toolbar, after the text/document control"; it moves to the bottom-left of the nested input box, inside the input toolbar, after `Add text document`, and the entire toolbar is now inside the white input box. The disclaimer no longer sits inside the composer footer; it moves to a page-level footer outside the container. `Reviews waiting` no longer sits in the composer footer; it is rendered as a pill in the page-level footer, right-aligned.
- **AC15** (dominant mode control above everything) and **AC21** (Execution Profile after text/document in the toolbar) are replaced by the acceptance criteria in §10 below.
- **AC18/AC20** are refined: the composer is still a soft-matcha outer container, but the white input becomes a nested text-input box that also hosts the input toolbar (including the Execution Profile control); the disclaimer moves outside the container; `Reviews waiting` becomes a right-aligned pill in the page-level footer.
- **The New Session page-level `Illustrative data` marker** is replaced by the exact disclaimer text (§6).
- **Header and intro copy** — the page's visible title is `New session` (with the subtitle `Start governed work with the right mode and context.`). The centered intro is mode-specific: Engineering shows the heading `What would you like to build?` with the body `Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.`; Planning shows the heading `Start planning` with the body `Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.`. The previous `Start Session` heading and its intro subtitle are removed.
- **Setup trigger copy** — Engineering shows two icon pills whose initial placeholders are `Choose system / repositories` and `Choose component`; after selection they show the selected system name and the selected component name/count respectively. Planning shows a single icon pill `Choose system` (no Component pill); it opens the same system+repositories modal and after selection shows the selected system name.

Everything else in the earlier spec remains in force. This correction does **not** change business behavior, mode semantics, setup selector behavior, the Execution Profile menu contents, the reviews drawer, overlay lifecycle, or any page other than the New Session page. Where this document is silent, `2026-08-16-konteks-visual-revamp-design.md` still governs.

## 3. Scope

- The New Session page header (title, subtitle, right-aligned approval indicator).
- The New Session page intro (image and mode-specific heading/body).
- The single unified composer container and its internal regions: top row (setup pills + mode) and the nested text-input box (textarea + input toolbar including the Execution Profile control).
- The page-level footer (disclaimer left; `Reviews waiting` pill right) and its relationship to the `Illustrative data` marker.
- Behavioral preservation guarantees for the items listed in §9.

## 4. Non-goals

- No change to Engineering/Planning mode semantics, default mode, or arrow-key switching.
- No change to the setup selectors' underlying behavior (the system+repositories modal and the anchored component menu); Planning's `Choose system` pill reuses the same system+repositories modal.
- No change to the Execution Profile anchored menu (contents, sidecar, workspace settings, Manage/Customize entry).
- No change to the Konteks Learned drawer, Session History, Customize, Account, or Settings surfaces.
- No change to the send-disabled-on-empty contract or the overlay focus/Escape lifecycle.
- No removal of AC46 illustrative-data coverage on Session History and Settings — their visible notices stay. **User override (post-approval):** the sidebar no longer renders an `Illustrative data` marker; AC46 coverage is carried by the Session History page-level notice and the Settings section notices (spec review explicitly skipped by the user — no approval gate).
- No mobile/tablet layouts; desktop-only responsive behavior as before.
- No production code, test, or style changes in this task.

## 5. Architecture and DOM order

The New Session page region keeps its landmark name (`aria-label="New session"`). Its single visible page title is now `New session`. Top-to-bottom DOM order inside the region:

1. **Header** (new, above the center content)
   - Left: visible page title `New session` — the page's single `h1` — with the subtitle `Start governed work with the right mode and context.`.
   - Right: visible `Human approval required for proposals` indicator (informational status; non-interactive).

2. **Intro** (new, above the composer)
   - Decorative illustration: `/assets/konteks/empty-sessions.png` (rendered with empty alt text `alt=""`, decorative — the heading carries the accessible name).
   - Copy is mode-specific:
     - Engineering — visible heading `What would you like to build?` (subordinate `h2` to the page's `h1`); body `Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.`.
     - Planning — visible heading `Start planning` (subordinate `h2` to the page's `h1`); body `Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.`.

3. **Unified composer container** (exactly one composer container; no separate mode/setup regions outside it)
   - **Top row**
     - Left cluster: mode-specific setup pills. Engineering shows two icon pills — the `Choose system / repositories` pill and the `Choose component` pill — whose initial placeholders are the literal strings above; after selection the system pill shows the selected system name and the component pill shows the selected component name/count. Planning shows a single icon pill `Choose system` (no Component pill); it opens the same system+repositories modal (not a system-only modal) and, after selection, shows the selected system name. The initial placeholders are specific to a fresh New Session and do not reflect the sidebar active-system context until a selection is made.
     - Right cluster: Session Mode radio group (Engineering / Planning segmented control) with its `Session mode` accessible label, right-aligned on the same row in both modes.
     - In Planning mode, only the `Choose component` pill is removed from the DOM; the `Choose system` pill and the Session Mode radio group remain.
   - **Nested text-input box** (white surface, visually inside the container)
     - `textarea` prompt input.
     - Input toolbar at the bottom of the text-input box:
       - Left: `Attach file`, `Add text document`, and the Execution Profile control (its anchored menu still opens from this control).
       - Right: `Voice input` and `Send` (Engineering) / `Start planning` (Planning).
       - All five controls are visually inside the text-input box.

4. **Footer** (page level, outside the composer container)
   - Left: exact disclaimer `Konteks can make mistakes. Verify important information.`
   - Right: `Reviews waiting` rendered as a pill with its round count badge (still opens the Konteks Learned drawer on the Pending tab).

5. **Illustrative data marker**
   - The New Session page-level `Illustrative data` marker is removed; its position is replaced by the disclaimer in the page-level footer.
   - **User override (post-approval):** the sidebar no longer renders its `Illustrative data` marker either. Visible AC46 coverage is carried by the Session History page-level notice and the Settings section notices.

## 6. Styling intent

- Use only the Warm Enterprise palette tokens (`--kx-canvas`, `--kx-raised`, `--kx-pale`, `--kx-border`, `--kx-accent`, `--kx-accent-strong`, `--kx-primary`, `--kx-secondary`, `--kx-muted-*`, `--kx-accent-text-aa`, `--kx-accent-solid-aa`) and the DM Sans scale (`24/20/18/16/13/12/11/10`). No new colors or type sizes.
- **Header:** the `New session` title uses 24px (3XL) primary; its subtitle uses 13px (MD) secondary/muted-AA. The right-aligned `Human approval required for proposals` indicator uses a small muted/status treatment (12px/11px) and does not compete with the title.
- **Intro:** centered; the illustration is compact (constrained height so the whole page fits 1200×720 — maximum image height ≈ 140px, width auto, no stretching); the mode-specific heading (`What would you like to build?` in Engineering, `Start planning` in Planning) uses 20px (2XL) primary as the subordinate heading; the body uses 13px (MD) secondary/muted-AA.
- **Composer container:** retains the soft-matcha outer treatment (pale wash `--kx-pale` + hairline `--kx-border` + rounded corners) so it still reads as one unified surface; internal regions separated by small consistent gaps (≈ 10–12px).
- **Top row:** flex with `justify-content: space-between`; the left cluster of setup pills and the right Session Mode group sit on the same baseline. Engineering's left cluster holds two pills; Planning's holds a single `Choose system` pill, with the Session Mode group staying right-aligned. Setup triggers use a pill treatment (rounded, bordered/raised) consistent with the palette; the trigger icons remain unboxed glyphs inside the pill.
- **Text-input box:** white `--kx-raised` surface with hairline border and rounded corners (≈ 14px), clearly contrasting with the pale container; the textarea is inside it and the input toolbar hugs the bottom of this white box (not the container).
- **Input toolbar:** flex with left group (`Attach file`, `Add text document`, Execution Profile) and right group (`Voice input`, `Send`/`Start planning`) separated by `justify-content: space-between`. Tool icons remain unboxed with the shared hover affordance; the send element remains the soft-accent element; the Execution Profile control keeps its existing compact button treatment within the left group.
- **Footer:** page-level flex with `justify-content: space-between`; disclaimer left, `Reviews waiting` pill right. The `Reviews waiting` pill uses a bordered/raised pill treatment with a round count badge.
- **Disclaimer:** page-level small muted text (`--kx-text-xs`, muted-AA) matching the previous illustrative-note treatment, but with the exact disclaimer copy. It must not be inside the composer container.

## 7. Responsive behavior

- Ideal viewport **1440×900**: single centered column with the composer container at its existing max width (≈ 780px); header, intro, top row, input box, and footer all on their intended rows.
- **1200×720**: no horizontal page scroll and no clipped controls. The ≤1280px sidebar rail behavior from the earlier spec is unchanged. The composer top row may wrap gracefully (flex-wrap allowed as a safety valve: setup cluster and mode group may stack) but must never overflow or clip; the input toolbar keeps all five controls visible (the left and right groups may wrap within the input box but must not clip); the footer and disclaimer remain inside the viewport.
- The page-level vertical scroll region remains `.kx-main` (document-level scroll stays locked).

## 8. Accessibility semantics

- The page has exactly one `h1`: the visible `New session` title in the header.
- The intro heading is a subordinate heading (`h2`) so the single-`h1` invariant holds: `What would you like to build?` in Engineering mode and `Start planning` in Planning mode.
- **Session Mode** keeps `role="radiogroup"` with `aria-label="Session mode"`, roving `tabindex`, `aria-checked`, and arrow-key switching (ArrowRight/Down → Planning, ArrowLeft/Up → Engineering). Its semantics are unchanged by the move into the container.
- **System/repository** and **Component** pills keep their button semantics, accessible names, `aria-haspopup` (`dialog` / `menu`), and `aria-expanded`. In Engineering mode their initial accessible names are the placeholders `Choose system / repositories` and `Choose component` (reflecting the fresh-New-Session state, not the sidebar active system). In Planning mode a single `Choose system` pill remains with the accessible name `Choose system`; it opens the same system+repositories modal and shows the selected system name after selection. The `Choose component` pill is removed from the accessibility tree (removed from the DOM) in Planning mode, not merely visually hidden.
- **Textarea** keeps its visible-label association (`Engineering prompt` / `Planning prompt`) and placeholder copy.
- **Toolbar controls** keep accessible names (`Attach file`, `Add text document`, `Execution Profile`, `Voice input`, `Send` / `Start planning`).
- **Execution Profile** keeps `aria-haspopup="menu"` and `aria-expanded`; its anchored menu, sidecar, workspace settings section, and Manage/Customize entry are unchanged.
- **Reviews waiting** is a button (pill) whose accessible name conveys the pending count; it still opens the Learned drawer.
- **Disclaimer** is a plain paragraph (no landmark/role needed). The `Human approval required for proposals` indicator is informational (readable status text, not a control).
- Focus order follows visual/DOM order: header (non-interactive, skipped) → intro (non-interactive, skipped) → setup pills (Engineering: `Choose system / repositories`, `Choose component`; Planning: `Choose system`) → Session Mode → textarea → input toolbar (`Attach file` → `Add text document` → Execution Profile → `Voice input` → `Send`/`Start planning`) → footer (`Reviews waiting`; disclaimer non-interactive).
- Overlay focus-return and single-Escape dismissal (OverlayLifecycle) are unchanged.
- All text meets WCAG AA contrast against `--kx-raised` and `--kx-pale`; every control keeps a visible focus indicator.

## 9. Behavior preservation (must not regress)

1. **Mode semantics / arrow behavior:** Engineering is the default; `SET_MODE` reducer; radio-group semantics; arrow-key switching; Planning placeholder `Describe the product outcome you want to plan…`; `Start planning` CTA.
2. **Mode-specific setup selectors:** `Choose system / repositories` (Engineering) and `Choose system` (Planning) both open the existing system+repositories modal — Planning does not use a system-only modal; `Choose component` (Engineering only) opens the anchored component menu. In Planning mode the Component pill is removed from the DOM while the `Choose system` pill remains. Initial placeholders are shown on a fresh New Session regardless of the sidebar active-system context; after selection the pills show the selected system name (both modes) and the selected component name/count (Engineering).
3. **Execution Profile menu anchoring:** anchored (no modal/backdrop), flat profile list, hover/focus sidecar (Planner model, Executor model, authorization, readiness), workspace-level Assistant/Search under a separated section, Manage/Customize Profile entry.
4. **Send disabled on empty:** Send and Start planning are disabled while the input is empty or whitespace-only and enabled once non-whitespace text exists.
5. **Reviews waiting → drawer:** opens the Konteks Learned 450px right drawer on the Pending tab.
6. **Overlay focus/Escape lifecycle:** exactly one overlay at a time; Escape closes and returns focus to the originating trigger via the shared lifecycle.
7. **Viewport safety:** 1440×900 and 1200×720 render without horizontal scroll or clipped controls; ≤1280px rail behavior unchanged.

## 10. Acceptance criteria

1. The New Session page renders a header with the visible title `New session`, the subtitle `Start governed work with the right mode and context.`, and a right-aligned `Human approval required for proposals` indicator.
2. `New session` is the page's single `h1`.
3. The page renders an intro above the composer containing `/assets/konteks/empty-sessions.png` (decorative, `alt=""`) and mode-specific copy: in Engineering mode the visible heading `What would you like to build?` with the body `Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.`; in Planning mode the visible heading `Start planning` with the body `Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.`.
4. There is exactly one composer container on the page — no separate mode or setup region outside it.
5. In Engineering mode, the `Choose system / repositories` and `Choose component` pills are left-aligned and the Session Mode radio group is right-aligned on the same top row inside the container; the pills show their initial placeholders on a fresh New Session.
6. After selection, the system pill shows the selected system name (Engineering and Planning) and the component pill shows the selected component name/count (Engineering).
7. In Planning mode, a single `Choose system` pill is present (no Component pill) and left-aligned; it opens the existing system+repositories modal (not a system-only modal), shows the selected system name after selection, and the Session Mode radio group remains right-aligned in the top row.
8. The prompt `textarea` renders inside a nested white text-input box that is visually inside the composer container.
9. The input toolbar renders at the bottom of the text-input box: `Attach file`, `Add text document`, and the Execution Profile control left-aligned; `Voice input` and `Send` (Engineering) / `Start planning` (Planning) right-aligned; all five controls visually inside the text-input box.
10. The exact disclaimer `Konteks can make mistakes. Verify important information.` renders at page level outside the composer container, left-aligned in the footer.
11. `Reviews waiting` renders as a pill with a round count badge, right-aligned in the page-level footer, and still opens the Konteks Learned 450px drawer on the Pending tab.
12. The New Session page no longer renders an `Illustrative data` marker, and per the user override the sidebar renders none either; visible AC46 coverage is carried by the Session History page-level notice and the Settings section notices.
13. Mode semantics and arrow-key switching are preserved (Engineering default, radio-group semantics, Planning placeholder and `Start planning` copy).
14. The setup selectors preserve their existing overlay behavior (`Choose system / repositories` in Engineering and `Choose system` in Planning open the same system+repositories modal; `Choose component` in Engineering opens the anchored component menu).
15. The Execution Profile control preserves anchored-menu behavior (no backdrop, flat list, sidecar, workspace settings section, Manage/Customize entry).
16. Send / Start planning remain disabled on empty or whitespace-only input and enabled once non-whitespace text exists.
17. Overlay focus-return and single-Escape dismissal behavior are unchanged.
18. At 1440×900 and 1200×720 there is no horizontal page scroll and no clipped controls; the header, intro, top row, input toolbar, and footer are fully visible.
19. Keyboard focus order follows visual/DOM order; every control has an accessible name and a visible focus indicator; axe wcag2aa reports zero violations on the New Session page.

## 11. Test strategy

Implementation-phase test plan (this task is documentation only and introduces no code):

- **Unit/component (Vitest + Testing Library):** assert DOM order header → intro → composer (top row → input box) → footer; assert the header title/subtitle and the right-aligned approval indicator; assert the mode-specific intro heading/body (Engineering: `What would you like to build?` + its body; Planning: `Start planning` + its body) and the decorative image `alt`; assert the setup pills' initial placeholder strings (`Choose system / repositories`, `Choose component`) on a fresh New Session and their post-selection labels (selected system name / component name/count); assert left/right grouping within the top row and input toolbar via `compareDocumentPosition`; assert Planning removes only the Component pill, keeps a single `Choose system` pill (which opens the same system+repositories modal), and keeps the mode group; assert Execution Profile is inside the input box's left group and follows `Add text document`; assert `Reviews waiting` is a pill in the page-level footer and the disclaimer is outside the composer container; assert the page-level `Illustrative data` marker is gone on New Session and the sidebar renders none either (Session History and Settings carry the remaining AC46 notices); keep existing regressions for mode/arrow switching, send-disabled-on-empty, profile-menu dispatch, and reviews-drawer dispatch.
- **E2E (Playwright):** geometry assertions — header above the intro; intro bounding box above the composer; setup pill cluster left of the mode group on the same row; the five toolbar controls contained within the white input box's bounding box; disclaimer left of `Reviews waiting` in the footer below the container. Assert no horizontal overflow at both 1440×900 and 1200×720, and capture screenshots of the New Session page at both viewports.
- **Responsive:** extend the source-string CSS assertions for the new header/intro/top-row/input-toolbar/footer rules (flex, `space-between`, wrap safety), plus the 1200×720 viewport checks.
- **Accessibility:** axe wcag2aa zero violations; keyboard-only traversal (Tab order, Escape, arrow keys on the radiogroup); visible focus indicators.
- **Test updates required:** existing tests that assert the old contract (`Start Session` heading; Session Mode above the setup row and composer; Execution Profile inside the toolbar after `Add text document`; disclaimer inside the composer footer; `Reviews waiting` inside the composer footer; page-level illustrative note on New Session page; Planning hiding all setup pills) must be updated to the corrected contract when implemented. These updates are a consequence of this correction, not a business-behavior change.

## 12. Self-review

- **Placeholders:** none. Asset path, header title/subtitle, approval indicator, mode-specific intro heading/body, setup-pill placeholders, and disclaimer copy are exact and match the approved reference layout.
- **Contradictions:** none. §2 explicitly lists the earlier-spec clauses this correction overrides; all other earlier-spec clauses remain in force. The earlier claim that Planning hides all setup pills is corrected: Planning keeps a single `Choose system` pill and removes only the Component pill.
- **Ambiguity:** the disclaimer copy is character-exact (including the trailing period); the header left/right split, the mode-specific intro heading/body, the setup-pill initial placeholders and post-selection labels (including Planning's single `Choose system` pill), the nested input-box toolbar grouping (including Execution Profile), and the page-level footer grouping are each stated as a numbered acceptance criterion with a matching test strategy. The heading hierarchy is fixed (`New session` is the single `h1`; `What would you like to build?` and `Start planning` are the subordinate `h2`s).

---

*End of specification.*
