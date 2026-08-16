# Konteks Visual Revamp — Design Specification

- **Date:** 2026-08-16
- **Artifact type:** Static clickable HTML mockup (design contract for a later implementation phase)
- **Status:** Approved requirement contract — self-contained source of truth
- **Related prototypes:** see [Approved prototype index](#approved-prototype-index)

---

## 1. Purpose

Define the complete visual and interaction design for the Konteks application revamp as a single static clickable HTML mockup. The revamp adopts the "Warm Enterprise" direction: a calm, premium, enterprise-credible look built on the Figma node 406:18749 foundation (DM Sans, real Konteks assets, white expanded sidebar, matcha canvas and glow) while restructuring the main workspace around a dominant Engineering/Planning mode hierarchy, system-scoped repository selection, a floating component selector, a consolidated Customize shell, a Konteks Learned drawer, a dedicated Session History page, and a preserved Account/Settings area.

This document is the single self-contained contract that the mockup must satisfy and that any future implementation phase must follow.

## 2. Source-of-truth priority

This specification is the **highest authority** — there is no circularity:

1. **This specification** (the approved requirement contract embedded in this document, including the Warm Enterprise palette and typography scale in §5). Its **explicit palette and type tokens override any conflicting values** shown in Figma or in the approved prototypes.
2. **Figma node 406:18749** governs only what this document does **not** explicitly override: geometry, spacing, real Konteks assets (logos/icons), the visual foundation (DM Sans typography, white 240px expanded sidebar, `#FAF8EF` main canvas, 19.5px curved main corners top-left/bottom-left, radial matcha glow, sidebar minimize/collapse, fill/stretch layout).
3. **Approved prototype index** (`.superpowers/brainstorm/<run-id>/content/` HTML files, listed by basename at the end of this document) — the authoritative reference for each area's layout and interaction patterns, subordinate to items 1–2.
4. **Konteks2.mp4** — reference for existing Account menu and Settings structure/function to be preserved.

All illustrative timestamps, counts, session names, system names, repository names, and model names shown in the mockup are **placeholder data, not production facts**. The prototype displays a **visible "Illustrative data" note** (or equivalent visible marker) covering these placeholder timestamps/counts/names, so the illustrative nature — and AC46 — is observable in the artifact itself.

## 3. Scope

- One static clickable HTML mockup (no backend, no persistence, no authentication, no network calls).
- Desktop responsive: ideal target **1440×900**; must remain fully usable down to approximately **1200×720**.
- Clickable coverage: sidebar (workspace box, system controls, recent sessions, View all, minimize/collapse), Engineering and Planning main modes, composer, Execution Profile anchored menu, system/repository modal, manual repository form, component floating menu, Create System, Customize modal (all seven tabs), Konteks Learned drawer, Session History page, Account menu, and Settings (visual refresh only).
- Explicit loading, empty, disabled, hover, focus, and scroll states for all interactive elements.
- Keyboard and focus accessibility throughout.

## 4. Non-goals

- No backend, API, database, or data persistence of any kind.
- No real authentication, authorization, billing, or team-management logic.
- No production asset pipeline; mockup may inline or reference the existing Konteks assets.
- No mobile or tablet layouts (desktop-only responsive behavior).
- No code changes, no Git commits, no repository tooling — this phase produces documentation and mockup only.
- No information-architecture or business-rule changes to Account menu or Settings — visual refresh only.

## 5. Visual foundation

### 5.1 Palette — Warm Enterprise

| Token | Hex | Usage |
|---|---|---|
| Canvas | `#FAF8EF` | Main content background (matcha paper) |
| Raised | `#FFF` | Cards, inputs, modals, popover surfaces |
| Primary | `#243025` | Primary text, headings, dark surfaces |
| Secondary | `#58735A` | Secondary text, subdued labels |
| Muted | `#778C78` | Tertiary/muted text, placeholders |
| Border | `#E2E9D5` | Dividers, input borders, hairlines |
| Pale | `#F4F8EE` | Hover fills, selected states, subtle washes |
| Accent | `#8FBF6A` | Primary action accent, highlights |
| Strong accent | `#5F8D4E` | Emphasized actions, active indicators |

- Sidebar (expanded) is **white**; main canvas is `#FAF8EF` with **19.5px curved corners** on the **top-left and bottom-left** (the edges meeting the sidebar).
- **1200px is the main width at the ideal 1440px viewport**; outside that ideal, the main region **grows/shrinks via fill/stretch** (content regions expand or contract to fill available space rather than centering at a fixed content width) while preserving the 240px sidebar and the responsive constraints of §16.
- A **radial matcha glow** is present on the main canvas as an ambient background treatment (subtle, non-interfering with content contrast).
- Layout uses **fill/stretch** behavior as defined above.

### 5.2 Typography — DM Sans

| Size | px | Notes |
|---|---|---|
| 3XL | 24 | Page titles |
| 2XL | 20 | Section titles, modal headers |
| XL | 18 | Subsection titles |
| L | 16 | Body emphasis, buttons |
| MD | 13 | **Normal weight** — default body/UI text |
| SM | 12 | Captions, meta text |
| XS | 11 | Micro labels |
| 2XS | 10 | Badges, fine print |

All type uses DM Sans (per Figma 406:18749). Real Konteks assets (logo, icons) are used — no placeholder third-party marks.

## 6. Layout / Sidebar

### 6.1 Structure

- **240px expanded white sidebar** (Figma foundation) with **minimize/collapse** retained; collapsed state reduces to icon rail.
- **Workspace box is the only persistent box** in the sidebar — a distinct raised container identifying the current workspace.
- **Workspace control and system control** both open their menus with a **chevron-right** affordance (menu opens to the right of the control).
- **No avatars** in the system menu — system rows are icon/name/counter only.
- **Customize** is reached via a **sliders icon at the right of the user row**, with a **tooltip** on hover.
- **Recent sessions** list is **chronological** (most recent first), each row showing **system + time**.
- **"View all"** link navigates to Session History and **leaves the sidebar visually unchanged** (no expansion, no re-render artifacts).

### 6.2 System sidebar floating menu (replaces the All Systems page)

- Opened from the system control; a **floating menu** (not a page navigation) — the All Systems page no longer exists.
- **Pinned "All systems"** row at the top of the menu.
- **Search** field to filter systems.
- **Scrollable system list** with per-system **repository counts**.
- **Sticky "Create new system"** action pinned at the bottom of the menu, remaining visible while the list scrolls.

## 7. Main modes / Composer

### 7.1 Mode hierarchy

- The **Engineering / Planning segmented control is the dominant hierarchy** of the main area — visually the primary switch above everything else in the composer region.
- **Planning mode:**
  - System-only scope (no repository/component setup).
  - Call-to-action copy: **"Start planning"**.
  - Composer placeholder: **"Describe the product outcome you want to plan…"**.
- **Engineering mode:**
  - Full setup: **system/repository selection and component selection**, plus the composer.

### 7.2 Composer

- **Soft-matcha outer container** (subtle canvas-tinted rounded container) contrasting with the **white input** inside it.
- Toolbar icons are **unboxed** (no per-icon borders/chips) except:
  - **Hover** reveals a soft affordance.
  - The **send button** is a soft (accent-tinted) element by design.
- Icons present: **attachment**, **text/document**, **mic**, **send**.
- **Disclaimer** text sits on the **left** below the input.
- **"Reviews waiting"** label with a **round count badge** sits on the **right**; **clicking "Reviews waiting" opens the Konteks Learned drawer (450px, §12) directly on its Pending tab**.
- The **Execution Profile** selector sits at the **bottom-left of the composer toolbar, after the text/document control**.

### 7.3 Execution Profile anchored menu

- **Anchored menu** (no modal/backdrop) opening from the Execution Profile control.
- **No header** inside the menu; a **flat list of profiles**.
- Includes a **"Manage / Customize Profile"** entry that opens Customize on the relevant tab.
- **Hover sidecar:** hovering a profile reveals a side panel showing **Planner model, Executor model, authorization, and readiness** for that profile.
- The menu separates **Planner and Executor as profile-scoped** settings (they belong to the selected profile).
- **Assistant and Search are workspace-level** (not profile-scoped) and are labeled under a **visually separated "Workspace settings" section** within the menu (divider plus section label, or an equivalent visual separation).

## 8. System / Repository flow (Engineering)

### 8.1 System/repository selector modal

- Selection is grouped by **one active system**: repositories are selectable **only within the currently active system**.
- **Switching the active system clears the repository selection**.
- **Search** operates across **systems and repositories**.
- **"Add new system"** action sits at the **top** of the system list.
- **"Add repository manually"** is available **only inside the expanded active system** group.
- Footer is a **simple one-line footer** (single row of actions/status).

### 8.2 Manual repository form

- **VCS Connector** selector.
- **Searchable Repository** picker with **pagination and result count**.
- **"Enter URL manually"** escape hatch when the repository is not found.
- **Selected repositories appear as chips with removal** controls.
- **"Add another repository"** action to queue additional selections.
- **Execution** selection.
- **"Require private network"** toggle.
- **Cancel / Connect** actions.

## 9. Component flow

- The **component selector is an anchored floating menu** — **no modal, no backdrop** — aligned with the **Component button** that opens it.
- **Flat list** of components: **component name with its repository underneath** on the same row.
- **No redundant type label** (the row is not tagged with a component-type chip).
- **Search across component and repository** names.
- **Multi-select** supported.
- Selection summary shows a **count** and a **Clear** action.

## 10. Create System

- **Name is required**; **Description is optional**.
- A **concise helper text** explains that a system groups repositories/components.
- On creation, the **new system becomes the active system** (and appears immediately in the system menu list).

## 11. Customize

- Modal is **fixed 790×580 on every tab** — dimensions never change when switching tabs.
- Opened in **one click from the sliders icon at the right of the user row** (per §6.1) — the sliders icon is the Customize trigger, distinct from the user icon/avatar itself.
- **Fixed header and navigation; scrolling content area only** — the modal frame, header, and tab nav stay static while content scrolls.

### Tabs (seven, all retained)

1. **Agents** — hierarchy: **Create profile** action, **Active Profiles table**, and a **compact "Review setup" sticker**. Uses **progressive disclosure** while **preserving all existing AI role / provider / profile / archived / permission content**.
2. **Context** — Files / Skills / Repositories.
3. **MCP** — compact empty states / tables.
4. **Connectors** — compact empty states / tables.
5. **VCS** — compact empty states / tables.
6. **Skills** (top-level) — **preserves current functionality and content**, adopts the new shell.
7. **Tools** (top-level) — **preserves current functionality and content**, adopts the new shell.

## 12. Learned / Reviews

- **Konteks Learned** is a **450px right drawer**.
- Two tabs: **Pending** (the default/primary tab) and **Audit History**.
- **Pending** presents waiting reviews for action.
- **Audit History** is a **flat timeline** of past review events.

## 13. Session History

- A **dedicated page** (not a drawer/modal) with the **sidebar unchanged**.
- **Simple chronological list** of sessions.
- Each row: **title first**, then **Mode / System / Component metadata**, with **time in the next column**.
- **Three-dot menu appears on hover only** (hidden otherwise).
- **Search and filters** available at the top of the page.

## 14. Account / Settings preservation

From **Konteks2.mp4**, the existing structure and function are **fully preserved** — visual refresh only, no IA or business-rule changes:

- **Account menu:** all existing account actions.
- **Settings → General.**
- **Settings → Billing:** Usage, Plans, Providers, Budgets, Top Up, Transactions.
- **Settings → Team.**

The refresh applies the Warm Enterprise palette, DM Sans, spacing, and component styling to these screens without renaming, reordering, removing, or adding entries.

## 15. Interaction / States

Every interactive element in the mockup must express these states explicitly:

- **Loading:** skeleton or spinner treatments for lists (sessions, systems, repositories, components) and drawers.
- **Empty:** designed empty states (not blank areas) for recent sessions, system list, repository search results, component search results, Pending reviews, Audit History, and Customize compact tables (MCP/Connectors/VCS).
- **Disabled:** visibly disabled (reduced contrast, not-allowed cursor) for e.g. send with empty input, Connect with invalid/missing manual repository fields, Create System without a name, session filters that yield nothing.
- **Hover:** for all icons (soft affordance), rows, chips, three-dot menus, chevron controls, sidecar-triggering profile rows.
- **Focus:** visible focus rings for keyboard navigation on every control.
- **Scroll:** custom scrollbars matching the palette; sticky regions (Create new system in the floating menu; modal header/nav) remain fixed during scroll.

## 16. Responsive / Accessibility

- **Ideal viewport 1440×900**; must remain **usable near 1200×720** — no horizontal page scroll, no clipped controls, composer and modal fit within the viewport at both sizes.
- Sidebar minimize/collapse helps reclaim width at smaller sizes.
- Full **keyboard operability**: tab order follows visual order; menus (system floating menu, execution profile menu, component floating menu, account menu) are reachable and dismissible via keyboard; Escape closes floating menus/drawers/modals.
- **Visible focus indicators** on all interactive elements.
- Text contrast meets WCAG AA against both `#FAF8EF` canvas and `#FFF` raised surfaces (muted `#778C78` reserved for large/decorative text where contrast permits; body text uses primary/secondary).
- Tooltips (e.g., Customize sliders icon) are discoverable via keyboard focus, not hover-only.
- Semantic headings, landmarks, and `aria-*` roles for menus, tabs, dialogs, and drawers in the mockup markup.

## 17. Acceptance Criteria

All criteria are observable in the static mockup.

1. Opening the mockup at 1440×900 renders the shell with a white 240px expanded sidebar, `#FAF8EF` main canvas, and DM Sans typography throughout.
2. The main canvas shows 19.5px curved corners on the top-left and bottom-left edges where it meets the sidebar.
3. A radial matcha glow is visible as an ambient treatment on the main canvas and does not obscure or reduce legibility of any content.
4. Only workspace colors from the Warm Enterprise palette appear (canvas `#FAF8EF`, raised `#FFF`, primary `#243025`, secondary `#58735A`, muted `#778C78`, border `#E2E9D5`, pale `#F4F8EE`, accent `#8FBF6A`, strong accent `#5F8D4E`) — no off-palette hues.
5. Typography uses only the defined scale (24/20/18/16/13/12/11/10) with MD 13 as the normal body weight/size.
6. The workspace box is the only persistent boxed container in the sidebar.
7. Both the workspace control and the system control display a chevron-right affordance and open their menus to the right.
8. The system floating menu contains no avatar imagery — system rows show icon, name, and repository count only.
9. The user row shows a sliders icon at its right; hovering or focusing it reveals a "Customize" tooltip, and clicking it opens the Customize modal in one click.
10. Recent sessions in the sidebar are ordered chronologically with each row showing system and time.
11. Clicking "View all" navigates to the Session History page while the sidebar remains visually unchanged.
12. The sidebar minimize/collapse control works, collapsing to an icon rail and expanding back to 240px.
13. The system control opens a floating menu (not a page) with a pinned "All systems" row at top, a search field, a scrollable system list with repository counts, and a sticky "Create new system" action that remains visible while scrolling.
14. No "All Systems" page exists anywhere in the mockup navigation.
15. The Engineering/Planning segmented control is the visually dominant hierarchy element of the main area, above the composer and setup controls.
16. Planning mode shows no repository or component setup, uses the copy "Start planning", and the placeholder "Describe the product outcome you want to plan…".
17. Engineering mode exposes system/repository selection and component selection alongside the composer.
18. The composer renders a soft-matcha outer container with a white input inside it, and the contrast between the two is clearly visible.
19. Composer toolbar icons (attachment, text/document, mic) are unboxed; hover reveals a soft affordance; the send button is a soft accent element.
20. The disclaimer text sits at the left below the composer input, and the "Reviews waiting" label with a round count badge sits at the right.
21. The Execution Profile selector sits at the bottom-left of the composer toolbar, positioned after the text/document control.
22. Clicking Execution Profile opens an anchored menu (no backdrop) with no header, a flat profile list, and a "Manage / Customize Profile" entry that opens Customize.
23. Hovering a profile in the Execution Profile menu reveals a sidecar listing Planner model, Executor model, authorization, and readiness.
24. The Execution Profile menu presents Assistant and Search as workspace-level (non-profile-scoped) entries.
25. The system/repository modal groups repositories under exactly one active system; repository checkboxes are selectable only within that active system.
26. Switching the active system in the modal clears the repository selection.
27. The modal's search filters both systems and repositories; "Add new system" appears at the top of the system list.
28. "Add repository manually" appears only inside the expanded active system group, and the modal footer is a single simple line.
29. The manual repository form includes VCS Connector, a searchable repository picker with pagination and result count, an "Enter URL manually" option, removable chips for selected repositories, "Add another repository", an Execution control, a "Require private network" toggle, and Cancel/Connect actions.
30. The Component button opens an anchored floating menu aligned to the button — no modal and no backdrop.
31. The component list is flat, shows component name with repository underneath on the same row, and carries no component-type label.
32. The component menu supports searching by component or repository, multi-select, and displays a selection count with a Clear action.
33. Create System requires a Name (create is disabled without it), marks Description optional, shows the concise system-groups-repositories/components helper text, and on completion the new system becomes the active system.
34. The Customize modal measures exactly 790×580 on every one of its seven tabs — the frame does not resize when switching tabs.
35. The Customize modal has a fixed header and tab navigation with only the content area scrolling.
36. The Agents tab shows the hierarchy: Create profile action, Active Profiles table, and a compact "Review setup" sticker, with progressive disclosure that still exposes the existing AI role, provider, profile, archived, and permission content.
37. The Context tab presents Files / Skills / Repositories; MCP, Connectors, and VCS tabs use compact empty states/tables.
38. The top-level Skills and Tools tabs preserve the current functionality and content while adopting the Customize shell styling.
39. Konteks Learned opens as a 450px right drawer with Pending (primary) and Audit History tabs, and Audit History renders as a flat timeline.
40. Session History is a dedicated page with an unchanged sidebar, a chronological list where each row shows title first, then Mode/System/Component metadata, with time in the next column, and a three-dot menu visible only on row hover.
41. Session History provides search and filters.
42. Account menu and Settings preserve the existing structure and function (account actions; General; Billing with Usage/Plans/Providers/Budgets/Top Up/Transactions; Team) — refreshed visually only.
43. Loading, empty, disabled, hover, focus, and scroll states are explicitly designed and reachable in the mockup for primary flows (at minimum: sessions, systems, repositories, components, pending reviews).
44. At 1200×720 the mockup remains fully usable: no horizontal page scroll, no clipped controls, composer and 790×580 modal fit the viewport.
45. Every interactive control has a visible keyboard focus indicator; Escape closes floating menus, drawers, and modals; tooltips appear on focus as well as hover.
46. All timestamps, counts, and names in the mockup are clearly illustrative placeholder data, not production facts.

## 18. Risks / Dependencies

- **No codebase and no Git repository currently exist** in `/Users/ardian/AllJobs/Konteks`. Implementation of this design **requires the application source location** — this spec and the mockup are the only artifacts available.
- **Exact current top-level Customize Skills/Tools content** cannot be transcribed without the source or current UI; those tabs are specified as "preserve current functionality/content, adopt shell" and must be reconciled against the real product before implementation.
- Figma node 406:18749 access is required for final asset extraction (logos, icons) and exact glow/spacing values; mockup approximations must be replaced during implementation.
- Preserving Account/Settings structure depends on Konteks2.mp4 fidelity; any drift between the video and the real product must be resolved in favor of the real product.
- The fixed 790×580 Customize modal must be re-validated against long content (large profile tables, long context file lists) — scrolling behavior is the mitigation.
- Multi-select-repos-within-one-system is a deliberate constraint; backend implementation must enforce the same clearing-on-system-switch rule to stay consistent with the design.

## 19. Approved prototype index

Authoritative `.superpowers` prototype files by basename (latest approved version per area). All prototype files live under **`.superpowers/brainstorm/<run-id>/content/`**, where `<run-id>` identifies the brainstorm run that produced them; the basenames below are relative to that directory:

| Area | Approved file (basename) |
|---|---|
| Main engineering mode + composer | `design-engineering-composer-v4.html` |
| Planning main mode | `planning-main-page.html` |
| Main engineering page w/ Execution Profile placement | `engineering-main-page-execution-profile-v2.html` |
| Execution Profile anchored menu | `engineering-execution-profile-menu-v3.html` |
| System sidebar floating menu (replaces All Systems page) | `system-sidebar-floating-menu-v4.html` |
| Grouped repository selector (system-scoped multi-select) | `system-grouped-repository-selector-v5.html` |
| Component floating menu | `component-floating-menu-v2.html` |
| Create System modal | `create-system-modal.html` |
| Agents tab (typography/profiles) | `agents-typography-profiles-v5.html` |
| Customize unified shell (fixed 790×580) | `customize-unified-fixed.html` |
| Context tab (fixed modal design) | `context-fixed-modal-design.html` |
| Customize integration tabs (MCP/Connectors/VCS compact) | `customize-integration-tabs-fixed.html` |
| Konteks Learned drawer | `konteks-learned-drawer.html` |
| Session History page | `session-history-page-v2.html` |
| Warm Enterprise palette direction | `design-main-page-sidebar-v12-warm-enterprise.html` |

Superseded iterations in `.superpowers/` (v1–v4 drafts, modal-based component selector, All Systems directory page, etc.) are retained for history only and are **not** part of the approved contract.

---

*End of specification.*
