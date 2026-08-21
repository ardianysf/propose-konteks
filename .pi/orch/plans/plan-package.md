# Interactive System Map — Implementation Plan Package

**Plan Status:** Approved (Ready for Implementation)
**Specification Source:** `docs/superpowers/specs/2026-08-21-interactive-system-map-design.md`
**Plan Date:** 2026-08-21
**Target Release:** Post-T13 overlay lifecycle refactor

---

## Executive Summary

Replace the static SVG SystemMapModal with a lazy-loaded `@xyflow/react` interactive graph visualization displaying Repository → Component → System hierarchy (left-to-right layout). The feature includes node selection, dependency highlighting, inspector panel, zoom/pan controls, production focus containment, catalog preview compatibility, and full theme token support.

**Key Goals:**
- Transform static illustrative diagram into real data-driven visualization
- Enable interactive exploration of system architecture relationships
- Provide workflow integration via CTA button to start sessions with specific components
- Maintain all existing accessibility and catalog preview contracts
- Preserve bundle efficiency through lazy loading (50–70 KB gzipped target for total first-open feature JS+CSS)
- Test-first vertical implementation with comprehensive coverage

---

## 1. Original Request and Business Goal

### Business Context
The Konteks platform helps engineers understand and navigate complex software system architectures. The current System Map displays a static, illustrative SVG diagram that is not connected to actual data. Users cannot interact with the map or use it as a workflow entry point.

### Primary Business Goals
1. **Data-Driven Visualization**: Replace hardcoded SVG with real System → Repository → Component relationships from the data model
2. **Interactive Exploration**: Enable users to select nodes, highlight dependencies, and zoom/pan through architecture graphs
3. **Workflow Integration**: Provide direct CTA from Component nodes to start AI-assisted sessions with specific components
4. **Error State Resilience**: Gracefully handle missing data, invalid repositories, and empty systems with appropriate UI states
5. **Performance**: Maintain fast initial page load through lazy loading; target 50–70 KB gzipped chunk size for total first-open feature JS+CSS

### Success Metrics
- Bundle size within 50–70 KB gzipped for SystemMapModal chunk (spike gate if exceeded)
- All graph states render correctly with appropriate banners/messages
- Focus containment works identically in production and catalog preview modes
- Zero token violations (all CSS uses theme tokens)
- CTA button correctly triggers session context sequence
- Performance measured as median/p95 over 10 runs in production preview Chrome with cache disabled (evidence reported, no unsupported hard 300ms claim)

---

## 2. In Scope and Out of Scope

### In Scope

| Category | Items |
|----------|-------|
| **Core Visualization** | Replace static SVG with `@xyflow/react` graph |
| **Graph Layout** | Left-to-right: Repository (left) → Component (middle) → System (right) (deterministic manual coordinates, no layout engine) |
| **Component Structure** | ReactFlowProvider wraps inner lazy SystemMapGraph, eager dialog shell with Suspense |
| **Node Types** | System, Repository, Component with token-based styling |
| **Edge Behavior** | Repository → Component and Component → System edges, left-to-right flow, no arrowheads |
| **Selection** | Node selection with visual highlight, dependency highlighting, dimming. Clicking already-selected node keeps selection; clicking empty canvas clears selection. |
| **Inspector Panel** | Right-side 280px panel at desktop min 1200x720, showing node details, CTA for Component nodes |
| **Zoom/Pan Controls** | Bottom-right controls: zoom in, zoom out, fit view, reset selection (only control that modifies selection). Canvas supports pan (drag) and scroll (wheel). |
| **Initial View** | fitView() called on graph load to center and fit all nodes |
| **Lazy Loading** | `React.lazy()` boundary in AppShell, Suspense with skeleton fallback |
| **Bundle Size** | Target 50–70 KB gzipped (total first-open feature JS+CSS), verified via bundle analyzer with spike gate |
| **Accessibility** | `useFocusContainment(dialogRef)` in production, bypass in catalog preview |
| **Node Focus** | `tabIndex={0}`, `aria-pressed={selected}`, Enter/Space selection |
| **Escape Handling** | Modal-wide noncomposing Escape: selection clears + preventDefault, otherwise lifecycle closes; IME Escape ignored |
| **Theme Support** | All CSS uses theme tokens (`--kx-*`), light/dark themes render correctly, no hardcoded colors/fallback tokens |
| **Graph States** | Fallback (invalid ID), Invalid Repository, Truly Empty, Repos-No-Components, Normal |
| **CTA Dispatch** | `CLEAR_COMPONENTS` → `TOGGLE_COMPONENT` → `CONFIRM_SESSION_CONTEXT` → `dismissOverlay` (exact flat reducer shapes) |
| **Data Scope** | Only in-scope components (repoId in system.repoIds), component scope only system repoIds, out-of-scope excluded |
| **State Priorities** | Mutually exclusive states evaluated in order: Fallback → Invalid → Truly Empty → Repos-No-Components → Normal |
| **Error Boundaries** | Outer error boundary renders distinct feature-load-error; graph model excludes build exceptions |
| **Graph Maximum** | Current fixture data (~37 nodes) + 50 node smoke envelope = ~87 nodes maximum |
| **Label Handling** | Fixed row spacing, long label truncate with ellipsis, full name in inspector |
| **Controls** | Accessible names: "Zoom in", "Zoom out", "Fit to view", "Reset selection" |

### Out of Scope

| Category | Items |
|----------|-------|
| **Real-time Updates** | No backend streaming or live graph updates |
| **Drag-and-Drop** | No manual node repositioning (graph uses deterministic coordinates) |
| **Edge Editing** | No edge creation, deletion, or modification |
| **Graph Persistence** | No save/export of graph layouts or state |
| **Multi-Selection** | Single node selection only |
| **Mini-Map** | No overview or mini-map panel |
| **Search/Filter** | No graph search or filtering UI |
| **Custom Layouts** | Uses deterministic manual coordinates (no automatic layout) |
| **Redux DevTools** | Not used for verification (use manual logging or custom middleware) |
| **State Transitions** | No animated transitions between graph states |
| **Retry Logic** | No retry for failed data fetches (fallback state only) |
| **Orphan Containers** | No special handling for disconnected nodes |
| **Hard 300ms Claim** | No unsupported performance guarantee; report median/p95 evidence instead |
| **Beyond 87 Nodes** | Graph support limited to ~87 nodes (fixture + smoke envelope) |

---

## 3. Factual Codebase Paths and APIs

### Current Implementation Files

| File | Purpose | Key Details |
|------|---------|-------------|
| `src/components/system/SystemMapModal.tsx` | Current static SVG modal | Uses `buildMap()` for deterministic 8-node/9-edge illustration |
| `src/components/system/SystemMapModal.css` | Current modal styles | Token-based SVG node/edge styling |
| `src/components/shell/AppShell.tsx` | Main app shell, overlay union | Line 33: `import SystemMapModal from '../system/SystemMapModal'` — **TARGET FOR LAZY LOADING** |
| `src/state/MockupContext.tsx` | State context bridge | Exposes `state` and `dispatch` |
| `src/state/mockupReducer.ts` | Reducer with action types | Overlay type: `{ kind: 'system-map'; systemId: string }` |
| `src/data/mockData.ts` | Mock data and type definitions | `System`, `Repository`, `ComponentEntry` interfaces (~37 total nodes: 9 systems, 15 repositories, 13 components) |
| `src/components/shell/useFocusContainment.ts` | Focus containment hook | Auto-bypasses catalog preview via `useIsCatalogPreview()` |
| `src/components/shell/OverlayLifecycle.tsx` | Overlay lifecycle owner | Document Escape listener, `dismissOverlay()` dispatches `CLOSE_OVERLAY` |
| `src/catalog/CatalogPreviewContext.tsx` | Catalog preview signal | `useIsCatalogPreview()` returns true only in catalog frames |
| `src/styles/tokens.css` | Theme tokens | All `--kx-*` color, typography, dimension tokens |
| `src/utils/overlays.ts` | Overlay DOM utilities | `isTabbable()`, `getTabbableElements()`, `isRestorable()` |

### Key Type Definitions

```typescript
// From src/data/mockData.ts
export interface System {
  id: string
  name: string
  description?: string
  repoIds: string[]  // Array of repository IDs that belong to this system
}

export interface Repository {
  id: string
  name: string
  systemId: string
  vcs: string
  updatedAt: string
}

export interface ComponentEntry {
  id: string
  name: string
  repoId: string  // Links component to owning repository
}

// From src/state/mockupReducer.ts
export type MockupOverlay =
  | { kind: 'none' }
  | { kind: 'system-map'; systemId: string }
  // ... other overlay kinds

export type MockupAction =
  // ... other actions
  | { type: 'CLEAR_COMPONENTS' }
  | { type: 'TOGGLE_COMPONENT'; componentId: string }
  | { type: 'CONFIRM_SESSION_CONTEXT'; systemId: string; repoIds?: string[] }
  | { type: 'CLOSE_OVERLAY' }
  // ... other actions
```

### Current Focus Containment Pattern

```typescript
// From src/components/system/SystemMapModal.tsx (current)
import { useFocusContainment } from '../shell/useFocusContainment'

export default function SystemMapModal() {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusContainment(dialogRef)  // No options = active: true, auto-bypasses catalog preview
  // ... rest of component
}
```

### Current Overlay Lifecycle Pattern

```typescript
// From src/components/shell/OverlayLifecycle.tsx
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (event.defaultPrevented) return
  if (event.isComposing) return  // IME composition ignored
  dismissOverlay()  // Dispatches { type: 'CLOSE_OVERLAY' }
}
```

### Current AppShell Overlay Slot

```typescript
// From src/components/shell/AppShell.tsx (lines 50-51)
import SystemMapModal from '../system/SystemMapModal'

// ... in JSX (line 77)
{state.overlay.kind === 'system-map' && <SystemMapModal />}
```

**LAZY LOADING TARGET**: Replace line 50 and modify line 77 as follows:

```typescript
// Line 50 becomes:
const SystemMapModal = lazy(() => import('../system/SystemMapModal'))

// Line 77 becomes:
{state.overlay.kind === 'system-map' && (
  <Suspense fallback={<SystemMapSkeleton />}>
    <SystemMapModal />
  </Suspense>
)}
```

**INNER COMPONENT STRUCTURE:**

```typescript
// SystemMapModal.tsx (eager dialog shell)
import { ReactFlowProvider } from '@xyflow/react'
import { ErrorBoundary } from 'react-error-boundary'

export default function SystemMapModal() {
  return (
    <Dialog className="kx-modal kx-system-map">
      <ReactFlowProvider>
        <ErrorBoundary fallback={<SystemMapFallbackView />}>
          <Suspense fallback={<GraphSkeleton />}>
            <SystemMapGraph />
          </Suspense>
        </ErrorBoundary>
      </ReactFlowProvider>
    </Dialog>
  )
}

// SystemMapGraph.tsx (lazy inner graph component)
import { useReactFlow } from '@xyflow/react'
// useReactFlow() used only here, within ReactFlowProvider
```

### Current System Data Access

```typescript
// From src/components/system/SystemMapModal.tsx (current)
const { state } = useMockup()
const { dismissOverlay } = useOverlayLifecycle()
const systemId = state.overlay.kind === 'system-map' ? state.overlay.systemId : null
const system =
  state.systems.find((entry) => entry.id === systemId) ??
  state.systems.find((entry) => entry.id === state.activeSystemId) ??
  state.systems[0]
```

### Theme Token Reference (from src/styles/tokens.css)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--kx-canvas` | #faf8ef | #0f1510 | Main background |
| `--kx-raised` | #fff | #1a231b | Component/Modal surface, System nodes |
| `--kx-pale` | #f4f8ee | #152618 | Repository nodes |
| `--kx-primary` | #243025 | #e8ede8 | Text, headings |
| `--kx-secondary` | #58735a | #c5cfc6 | Secondary text |
| `--kx-border` | #e2e9d5 | #35502c | Edges, borders |
| `--kx-accent-strong` | #5f8d4e | #5f8d4e | Selected borders, highlights |
| `--kx-accent-text-aa` | #4f7044 | #c5d9a6 | Badge text |
| `--kx-ink-rgb` | `36 48 37` | `53 80 44` | RGB triplet for shadows (used as `rgb(var(--kx-ink-rgb) / 0.14)`) |

---

## 4. Numbered Acceptance Criteria Reference

From specification `docs/superpowers/specs/2026-08-21-interactive-system-map-design.md`:

### Core Functionality (AC1–AC11)

| AC | Description | Verification |
|----|-------------|--------------|
| AC1 | Opening system map displays interactive `@xyflow/react` graph with Repository → Component → System layout (left to right) | Visual inspection of graph |
| AC2 | Edges connect Repository → Component and Component → System flowing left to right with no arrowheads | Verify edge directionality and lack of arrowheads |
| AC3 | Node selection highlights node with 2.5px `--kx-accent-strong` stroke and `rgb(var(--kx-ink-rgb) / 0.14)` ring | Inspect computed styles |
| AC4 | Selected node's direct dependencies highlight with `--kx-accent-strong`, non-connected elements dim to opacity 0.3 | Interactive test: select node, verify highlighting |
| AC5 | Inspector panel (280px right, desktop min 1200x720) shows selected node details; Component nodes include CTA button | Select each node type, verify inspector content |
| AC6 | Clicking CTA dispatches `CLEAR_COMPONENTS` → `TOGGLE_COMPONENT {componentId}` → `CONFIRM_SESSION_CONTEXT {systemId, repoIds:[component.repoId]}` → `dismissOverlay` | Manual logging of action sequence |
| AC7 | Zoom/pan controls (in, out, fit, reset selection only) are functional and positioned bottom-right with accessible names | Interactive test + accessibility audit |
| AC8 | Initial view calls `fitView()` to center and fit all nodes in viewport on graph load | Code inspection + visual test |
| AC9 | System nodes use `--kx-raised` background, `--kx-accent-strong` stroke, `--kx-primary` text, `--kx-accent-text-aa` badge | Inspect computed styles |
| AC10 | Repository nodes use `--kx-pale` background, `--kx-border` stroke, `--kx-primary` text | Inspect computed styles |
| AC11 | Component nodes use `--kx-raised` background, `--kx-border` stroke, `--kx-primary` text | Inspect computed styles |

### Bundle and Lazy Loading (AC12–AC17)

| AC | Description | Verification |
|----|-------------|--------------|
| AC12 | `@xyflow/react` is lazy-loaded at `src/components/shell/AppShell.tsx` overlay slot with eager dialog shell | Verify `React.lazy()` in AppShell, eager shell structure |
| AC13 | React Flow stays out of initial bundle (verified via Network tab) | DevTools Network tab during initial page load |
| AC14 | Outer error boundary renders distinct feature-load-error (SystemMapFallbackView) | Code inspection + error injection test |
| AC15 | SystemMapModal chunk is 50–70 KB gzipped (total first-open feature JS+CSS, verified via bundle analyzer) | Build + bundle analyzer screenshot |
| AC16 | Bundle metric includes spike gate: if bundle exceeds 70 KB gzipped, spike investigation required | Bundle size check protocol |
| AC17 | Performance measured in production preview Chrome, cache disabled, localhost, 10 runs median/p95 (evidence reported, no unsupported hard 300ms claim) | Performance testing protocol |

### Graph Layout and Limits (AC18–AC20)

| AC | Description | Verification |
|----|-------------|--------------|
| AC18 | Graph uses deterministic manual coordinates with stable normalized-name+id ordering (no layout engine) | Code inspection + visual stability test |
| AC19 | Graph supports maximum of ~87 nodes (current fixture data ~37 + 50 node smoke envelope) | Load test with 87 nodes |
| AC20 | Fixed row spacing between node layers with long label truncate (ellipsis after max width, full name in inspector) | Visual test of spacing and truncation |

### Accessibility (AC21–AC28)

| AC | Description | Verification |
|----|-------------|--------------|
| AC21 | Production uses `useFocusContainment(dialogRef)` with no custom option | Verify hook call in SystemMapModal.tsx |
| AC22 | Catalog preview bypasses focus containment automatically (no conditional code) | Verify `useIsCatalogPreview()` behavior in useFocusContainment.ts |
| AC23 | Nodes have `tabIndex={0}` and `aria-pressed={selected}` (not `aria-selected`) | Inspect DOM attributes |
| AC24 | Selected node + Escape (non-composing) clears selection and prevents default; modal-wide noncomposing Escape handling | Keyboard test with selection active |
| AC25 | Escape without selection delegates to OverlayLifecycle to close modal (identical production/preview) | Keyboard test without selection |
| AC26 | IME Escape (isComposing=true) ignored by both selection logic and OverlayLifecycle | Keyboard test during IME composition |
| AC27 | Initial focus goes to dialog root in production; no initial focus trap in preview | Focus inspector on modal open |
| AC28 | All interactions (selection, zoom/pan, inspector, CTA) remain live in catalog preview | Catalog preview frame test |

### Graph States (AC29–AC38)

| AC | Description | Verification |
|----|-------------|--------------|
| AC29 | Fallback state (invalid systemId) renders exactly 8 nodes / 9 edges deterministic illustrative graph with warning banner | Test with invalid systemId, count nodes/edges, verify banner |
| AC30 | Invalid repository state (missing repo record) renders dashed placeholder repository node with normal edges | Test with missing repo ID in system.repoIds |
| AC31 | Truly empty state (empty `repoIds`) shows empty message with no graph | Test with system.repoIds = [] |
| AC32 | Repos-no-components state (all repos resolve, zero components) renders repositories + system with info banner | Test with valid repos, zero matching components |
| AC33 | Normal state renders full graph with no banner | Test with valid system with components |
| AC34 | Graph states are mutually exclusive and evaluated in priority order: Fallback → Invalid → Truly Empty → Repos-No-Components → Normal | Unit test state priority logic |
| AC35 | Out-of-scope components (repoId not in system.repoIds) never render | Test component with repoId outside system |
| AC36 | Component scope only includes system repoIds (no cross-system components) | Test cross-system component exclusion |
| AC37 | No orphan container or retry logic exists | Code review for absence of retry loops |
| AC38 | Graph model excludes build exceptions (handled by distinct outer error boundary) | Code inspection of error boundary placement |

### Theme and Styling (AC39–AC43)

| AC | Description | Verification |
|----|-------------|--------------|
| AC39 | All runtime CSS uses tokens exclusively; no raw hex colors or nonexistent tokens | `grep` for hex literals and invalid tokens |
| AC40 | Selected state ring uses exactly `rgb(var(--kx-ink-rgb) / 0.14)` | Inspect computed styles |
| AC41 | CTA button reuses `.kx-btn--primary` with no internal color restatement | Verify class usage, no inline styles |
| AC42 | System node badge uses `--kx-accent-text-aa` | Inspect computed styles |
| AC43 | Light and dark themes render correctly using token values (no hardcoded colors/fallback tokens) | Visual test in both themes |

### User Interaction and Components (AC44–AC50)

| AC | Description | Verification |
|----|-------------|--------------|
| AC44 | Clicking an already-selected node keeps selection (does not deselect) | Manual test |
| AC45 | Clicking empty canvas area clears selection | Manual test |
| AC46 | Canvas supports pan (drag) and scroll (wheel) interactions | Manual test |
| AC47 | ReactFlowProvider wraps the inner lazy SystemMapGraph component; useReactFlow() is used only below the provider | Code inspection |
| AC48 | SystemMapModal dialog shell renders eagerly with Suspense lazy-loading SystemMapGraph inside | Code inspection |
| AC49 | Inspector fields include type badge, name, description, metadata, and placeholder properties for incomplete data | Visual test with various node states |
| AC50 | Controls have accessible names: "Zoom in", "Zoom out", "Fit to view", "Reset selection" (reset selection is the only control that modifies selection) | Accessibility audit + manual test |

---

## 5. Test-First Vertical Task Graph

### Task Graph Overview

This is a truly vertical test-first task graph. Tests are written BEFORE implementation (Red phase), implementation follows (Green phase), and verification confirms (Refactor/Verify phase). Each task has a unique ID and valid dependencies.

**Critical Path (Linear):**
T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21 → T22 → T23 → T24 → T25 → T26 → T27 → T28 → T29 → T30 → T31 → T32 → T33 → T34 → T35 → T36 → T37 → T38 → T39 → T40 → T41 → T42 → T43 → T44 → T45 → T46 → T47 → T48 → T49 → T50 → T51 → T52 → T53 → T54 → T55 → T56 → T57 → T58

**Estimated Duration:** 10–14 hours (assuming familiarity with React Flow and test-first approach)

### Phase 1: Infrastructure and Setup (Blocking)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T01 | Install @xyflow/react dependency | SETUP | None | package.json updated |
| T02 | Install and configure bundle analyzer | SETUP | T01 | vite.config.ts with bundle analyzer |
| T03 | Create SystemMapSkeleton component | SETUP | None | src/components/system/SystemMapSkeleton.tsx |
| T04 | Create GraphSkeleton component | SETUP | T03 | src/components/system/GraphSkeleton.tsx |
| T05 | Create SystemMapFallbackView component | SETUP | None | src/components/system/SystemMapFallbackView.tsx |

### Phase 2: Test-First Core Graph (Vertical)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T06 | Write graph state priority tests (5 states) | TEST | T04 | SystemMapGraph.test.tsx (failing) |
| T07 | Write selection behavior tests (keep selection, clear on canvas) | TEST | T06 | SystemMapGraph.test.tsx (failing) |
| T08 | Write dependency highlighting tests (one-hop neighbors, direction ignored) | TEST | T07 | SystemMapGraph.test.tsx (failing) |
| T09 | Write Escape key tests (two-phase, IME, preventDefault) | TEST | T08 | SystemMapGraph.test.tsx (failing) |
| T10 | Write CTA dispatch tests (exact reducer shapes) | TEST | T09 | SystemMapGraph.test.tsx (failing) |
| T11 | Write lazy loading and error boundary tests | TEST | T10 | SystemMapGraph.test.tsx (failing) |
| T12 | Implement lazy loading in AppShell overlay slot | IMPL | T01, T03 | AppShell.tsx with React.lazy() |
| T13 | Implement eager dialog shell with ReactFlowProvider + ErrorBoundary + Suspense | IMPL | T12, T05 | SystemMapModal.tsx (shell) |
| T14 | Implement lazy SystemMapGraph with useReactFlow | IMPL | T13 | SystemMapGraph.tsx (inner) |
| T15 | Implement graph data builder with manual coordinates (no layout engine) | IMPL | T14 | buildGraphData() function |
| T16 | Implement graph state machine (5 states, priority order) | IMPL | T15 | determineGraphState() function |
| T17 | Implement node selection and click behaviors | IMPL | T14 | Selection state and handlers |
| T18 | Implement dependency highlighting (one-hop neighbors) | IMPL | T17 | Highlighted node calculation |
| T19 | Implement two-phase Escape key handling | IMPL | T17 | onKeyDown handler |
| T20 | Implement CTA dispatch with exact reducer shapes | IMPL | T14 | CTA click handler |
| T21 | Implement initial fitView on graph load | IMPL | T14 | useEffect with fitView() |
| T22 | Run all tests and verify green | VERF | T16, T18, T19, T20, T21 | All tests passing |

### Phase 3: UI Components and Styling (Vertical)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T23 | Write inspector panel tests (280px, fields, placeholder properties) | TEST | T22 | SystemMapGraph.test.tsx (failing) |
| T24 | Write zoom/pan controls tests (accessible names, reset selection only) | TEST | T23 | SystemMapGraph.test.tsx (failing) |
| T25 | Write label truncate and fixed row spacing tests | TEST | T24 | SystemMapGraph.test.tsx (failing) |
| T26 | Implement inspector panel (280px right, desktop min 1200x720) | IMPL | T22 | Inspector component |
| T27 | Implement inspector fields (type badge, name, description, metadata, CTA) | IMPL | T26 | Inspector content rendering |
| T28 | Implement inspector placeholder properties for incomplete data | IMPL | T27 | Placeholder handling |
| T29 | Implement zoom/pan controls with accessible names | IMPL | T14 | Controls component |
| T30 | Implement reset selection control (only control that modifies selection) | IMPL | T29 | Reset selection handler |
| T31 | Implement fixed row spacing and long label truncate | IMPL | T15 | Layout CSS |
| T32 | Run all tests and verify green | VERF | T28, T30, T31 | All tests passing |

### Phase 4: Theming and Token Compliance (Vertical)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T33 | Write token-only CSS tests (no hex, no fallback tokens) | TEST | T32 | CSS compliance tests |
| T34 | Write theme rendering tests (light/dark, no hardcoded colors) | TEST | T33 | Theme rendering tests |
| T35 | Implement node styles with tokens (System, Repository, Component) | IMPL | T32 | Node CSS classes |
| T36 | Implement edge styles with tokens (no arrowheads) | IMPL | T35 | Edge CSS classes |
| T37 | Implement selected state ring with exact token value | IMPL | T35 | Selection CSS |
| T38 | Implement banner styles (warning, info) | IMPL | T32 | Banner CSS |
| T39 | Remove all hex literals and fallback tokens | IMPL | T35, T36, T37, T38 | Token-only CSS |
| T40 | Verify grep for hex literals returns nothing | VERF | T39 | Token compliance confirmed |

### Phase 5: Accessibility and Focus (Vertical)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T41 | Write focus containment tests (production, preview bypass) | TEST | T32 | Focus behavior tests |
| T42 | Write node keyboard accessibility tests (tabIndex, aria-pressed, Enter/Space) | TEST | T41 | A11y tests |
| T43 | Write control accessibility tests (accessible names) | TEST | T42 | A11y tests |
| T44 | Verify useFocusContainment in production shell | IMPL | T13 | Focus containment active |
| T45 | Implement tabIndex={0} and aria-pressed on nodes | IMPL | T17 | Node accessibility attributes |
| T46 | Implement Enter/Space keyboard selection | IMPL | T45 | Keyboard handlers |
| T47 | Add accessible names to controls (Zoom in/out, Fit to view, Reset selection) | IMPL | T29 | Control ARIA labels |
| T48 | Run a11y audit (axe-core) | VERF | T47 | A11y compliance confirmed |

### Phase 6: Bundle and Performance Verification (Vertical)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T49 | Build production bundle and measure size | VERF | T48 | Bundle size measurement |
| T50 | Verify 50–70 KB gzipped (spike gate if exceeded) | VERF | T49 | Bundle size confirmed |
| T51 | Verify lazy loading (Network tab, no chunk on initial load) | VERF | T12 | Lazy loading confirmed |
| T52 | Performance test: 10 runs median/p95 in production preview Chrome | VERF | T49 | Performance metrics report |
| T53 | Document performance evidence (no unsupported hard 300ms claim) | VERF | T52 | Performance documentation |

### Phase 7: Manual Validation and AC Sign-off (Vertical)

| ID | Task | Type | Dependencies | Output |
|----|------|------|--------------|--------|
| T54 | Manual AC1–AC50 verification checklist | VERF | T53 | AC checklist complete |
| T55 | Visual regression test (light/dark themes) | VERF | T54 | Screenshots confirmed |
| T56 | Catalog preview frame test | VERF | T54 | Preview interactions verified |
| T57 | Graph smoke test with 87 nodes (fixture + 50 node envelope) | VERF | T54 | Max node load confirmed |
| T58 | Final integration test (end-to-end user flow) | VERF | T57 | E2E flow verified |

### Task Dependency Summary

**Critical Path (Sequential):**
All tasks (T01–T58) form a single critical path with test-first Red→Green→Verify flow between phases.

**Parallel Opportunities (After Prerequisites Met):**
- T06, T41, T33 can begin in parallel after T04/T05 (different test phases)
- After T22: T23, T33, T41 test phases can run in parallel

---

## 6. Resolved Assumptions and Tradeoffs

### Assumptions

| ID | Assumption | Rationale | Impact if False |
|----|------------|-----------|-----------------|
| A1 | `@xyflow/react` is the chosen library for graph visualization | Spec explicitly names it as the implementation target | Would require alternate library selection and revised implementation |
| A2 | System, Repository, and Component data is available in `mockData.ts` at render time | Current implementation uses synchronous mock data | Would require async loading states and error boundaries |
| A3 | `repoId` on `ComponentEntry` correctly links each component to its owning repository | Data model design assumption | Would produce incorrect graph connections |
| A4 | `system.repoIds` contains all repository IDs that belong to a system | Data model design assumption | Would cause missing repository nodes or invalid state |
| A5 | Focus containment hook (`useFocusContainment`) auto-bypasses catalog preview | Current implementation behavior | Would break catalog preview navigation |
| A6 | Bundle analyzer tool available for verification | Standard React build tooling | Would require alternative size verification method |
| A7 | Token values in `tokens.css` are final and accurate | Source of truth for styling | Would require theme fixes after implementation |
| A8 | Graph maximum ~87 nodes is sufficient for current and near-term needs | Based on fixture data + 50 node smoke envelope | Would require performance optimization for larger graphs |
| A9 | Fixed row spacing and label truncation acceptable for all expected node names | UX design decision | May need adjustments if node names are very long |

### Tradeoffs

| Decision | Chosen Approach | Alternative Rejected | Rationale |
|----------|-----------------|---------------------|-----------|
| **Lazy Loading Boundary** | `React.lazy()` in AppShell overlay slot | Dynamic import within SystemMapModal | Centralized boundary ensures chunk isolation and clear load timing |
| **Graph Layout Algorithm** | Deterministic manual coordinates with stable normalized-name+id ordering | Automatic layout (Dagre, React Flow default) | Manual coordinates ensure deterministic rendering across builds; no external layout engine dependency |
| **State Priority Order** | Explicit if-else chain (5 states) | State machine or pattern matching | Clear, readable, testable; no runtime overhead |
| **Selection Ring Implementation** | CSS `box-shadow` with RGB variable | Pseudo-element overlay | Simpler, lighter weight, works with dynamic theme values |
| **Escape Handling** | `event.preventDefault()` on selection clear | Custom Escape listener on modal root | Leverages existing OverlayLifecycle pattern, consistent with other modals |
| **Inspector Panel Width** | Fixed 280px at desktop min 1200x720 | Responsive or configurable | Fixed width matches other panels, simplifies layout |
| **Fallback Graph** | Reuse existing `buildMap()` 8-node/9-edge | New illustrative graph | Leverages tested code, matches existing visual reference |
| **Dashed Placeholder Node** | Stroke style change only | Different color or icon | Maintains token consistency, clear visual distinction |
| **Node Keyboard Interaction** | `tabIndex={0}` + Enter/Space | Arrow key navigation | Standard button-like pattern; simpler implementation |
| **Dependency Highlighting** | Dimming non-connected nodes to 0.3 opacity | Grayscale or blur | Opacity is clearer, performs better |
| **Bundle Metric** | Total first-open feature JS+CSS gzip (50–70 KB target) | JS-only or separate JS/CSS metrics | Captures complete feature cost, includes spike gate |
| **Performance Reporting** | Median/p95 over 10 runs, evidence only (no hard claim) | Hard 300ms guarantee | Realistic reporting based on actual measurements |
| **Graph Maximum** | ~87 nodes (fixture + 50 node envelope) | Higher or lower limits | Balances current needs with reasonable headroom |
| **Label Truncation** | Ellipsis with full name in inspector | Tooltip, resize, or wrap | Simple, consistent, full info available in inspector |
| **Controls** | Reset selection is only control that modifies selection | Each control clears selection | Clear separation of concerns, predictable behavior |

### Open Questions Resolved

| Question | Resolution | Source |
|----------|------------|--------|
| How to handle missing repositories in `system.repoIds`? | Render dashed placeholder node with warning banner (Invalid state) | Spec AC30 |
| Should edges have arrowheads? | No (edges are plain lines) | Spec AC2 |
| What happens when user clicks CTA without a component selected? | CTA only appears on Component nodes, so precondition satisfied | Spec AC5 |
| Should the graph persist state between modal open/close? | No, state resets on each open (out of scope) | Spec Out of Scope |
| What happens when clicking an already-selected node? | Selection is kept (not toggled off) | Spec AC44 |
| What happens when clicking empty canvas? | Selection is cleared | Spec AC45 |
| How are graph coordinates determined? | Manual x/y positioning based on stable normalized-name+id ordering | Spec AC18 |
| Should ReactFlowProvider wrap the entire modal or inner graph? | Wraps inner lazy SystemMapGraph; dialog shell renders eagerly | Spec AC47 |
| Where can useReactFlow() be used? | Only below ReactFlowProvider (in SystemMapGraph component) | Spec AC47 |
| How are dependency highlights determined? | Selected node + one-hop incident edge neighbors (direction ignored) | Spec AC4 |
| How should Escape key be handled? | Modal-wide: preventDefault when selection exists (do not call stopPropagation), otherwise lifecycle closes; IME ignored | Spec AC24, AC25, AC26 |
| What is the initial focus target in catalog preview? | None (focus trap bypassed) | Spec AC27, useFocusContainment behavior |
| What is the bundle metric and target? | Total first-open feature JS+CSS gzip, 50–70 KB target with spike gate | Spec AC15, AC16 |
| How should performance be reported? | Median/p95 over 10 runs in production preview Chrome, cache disabled; report evidence, no unsupported hard 300ms claim | Spec AC17 |
| What is the graph maximum support? | ~87 nodes (current fixture ~37 + 50 node smoke envelope) | Spec AC19 |
| How should long labels be handled? | Fixed row spacing, truncate with ellipsis, full name in inspector | Spec AC20 |
| What accessible names should controls have? | "Zoom in", "Zoom out", "Fit to view", "Reset selection" | Spec AC7, AC50 |
| Which control modifies selection? | Only "Reset selection" control clears selection | Spec AC7, AC50 |

---

## 7. Compatibility, Theme, Accessibility, Testing, and Rollout Constraints

### Compatibility Constraints

| Area | Constraint | Details |
|------|------------|---------|
| **React Version** | React 18.3.1 | `@xyflow/react` must be compatible with React 18 |
| **TypeScript** | TypeScript 5.6.2 | Flow types must be properly typed, no `any` |
| **Vite** | Vite 6.0.0 | Bundle splitting must work with Vite's chunk strategy |
| **Browser Support** | Modern browsers (ES2022+) | React Flow requires modern browser APIs |
| **Catalyst/Preview** | CatalogPreviewContext | Must integrate with existing preview infrastructure |
| **Desktop Minimum** | 1200x720 viewport for full inspector visibility | Inspector is 280px fixed width |

### Theme Constraints

| Requirement | Constraint | Verification |
|-------------|------------|--------------|
| **Token-Only CSS** | No hex literals, all `--kx-*` tokens, no fallback tokens | `grep -r '#[0-9A-Fa-f]\{6\}' SystemMapModal*` should return nothing (except comments) |
| **Light Theme** | All tokens resolve correctly from `:root` | Visual inspection in light mode |
| **Dark Theme** | All tokens resolve correctly from `[data-theme='dark']` | Visual inspection in dark mode |
| **Selected Ring** | Exact value: `rgb(var(--kx-ink-rgb) / 0.14)` | Computed style inspection |
| **System Badge** | Must use `--kx-accent-text-aa` | Computed style inspection |
| **CTA Button** | Must reuse `.kx-btn--primary` class, no inline styles | Class usage verification |
| **No Hardcoded Colors** | All runtime colors via tokens, no fallback hex values | CSS grep verification |

### Accessibility Constraints

| AC ID | Requirement | Implementation Constraint | Test Method |
|-------|-------------|-------------------------|-------------|
| AC21 | Production focus containment | Call `useFocusContainment(dialogRef)` with no options | Visual test + axe-core |
| AC22 | Catalog preview bypass | No conditional code; `useFocusContainment` auto-bypasses | Preview frame test |
| AC23 | Node keyboard accessibility | `tabIndex={0}`, `aria-pressed={selected}` (NOT `aria-selected`) | DOM inspection |
| AC24 | Escape with selection | `event.preventDefault()`, clear selection (no stopPropagation) | Keyboard test |
| AC25 | Escape without selection | No preventDefault, delegate to OverlayLifecycle | Keyboard test |
| AC26 | IME Escape handling | Both selection logic and OverlayLifecycle check `event.isComposing` | Keyboard test during composition |
| AC27 | Initial focus | Dialog root in production, none in preview | Focus inspector |
| AC28 | Preview interactions | All features work in preview (selection, zoom, inspector, CTA) | Preview frame test |
| AC43 | Control accessible names | "Zoom in", "Zoom out", "Fit to view", "Reset selection" | Accessibility audit |
| AC50 | Reset selection behavior | Only reset control modifies selection | Manual test |

### Testing Constraints

| Test Type | Requirements | Coverage Target |
|-----------|--------------|-----------------|
| **Test-First** | Tests written BEFORE implementation (Red → Green → Refactor) | All features follow TDD |
| **Unit Tests** | All graph states, selection logic, dispatch sequences, state machine | 90%+ coverage for SystemMapModal.tsx |
| **Integration Tests** | Lazy loading, overlay lifecycle, CTA session flow | Critical paths covered |
| **A11y Tests** | axe-core scan, keyboard navigation, screen reader | Zero high/critical violations |
| **Visual Regression** | Light/dark theme screenshots, graph states | Baseline established |
| **Bundle Tests** | Size verification (50–70 KB gzipped), lazy load timing, spike gate | Automated check |
| **Performance Tests** | 10 runs median/p95 in production preview Chrome, cache disabled | Evidence reported |

### Rollout Constraints

| Constraint | Details |
|------------|---------|
| **No Breaking Changes** | Overlay lifecycle must remain unchanged for other modals |
| **Backward Compatible** | Existing SystemMapModal behavior should degrade gracefully if React Flow fails |
| **Feature Flag** | Consider feature flag for gradual rollout (optional) |
| **Monitoring** | Track bundle size, load time, error rates post-deployment |
| **Rollback Plan** | Revert to static SVG if critical issues arise |
| **Documentation** | Update component docs, A11y docs, and any internal wikis |
| **Commit Only** | Commit docs only, do not push (per task instructions) |

---

## 8. Risks and Mitigation Strategies

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Bundle size exceeds 70 KB** | Medium | Medium | Spike gate triggered, tree-shaking review, code splitting analysis |
| **React Flow performance issues** | Low | High | Test with 87-node smoke envelope, manual coordinates avoid layout overhead |
| **Focus containment conflicts** | Low | High | Thoroughly test in both production and catalog preview contexts |
| **Token conflicts with React Flow defaults** | Medium | Low | Explicitly override all React Flow default styles with tokens |
| **Lazy loading race conditions** | Low | Medium | Use Suspense boundary with stable skeleton, test on slow networks |
| **Escape key handling conflicts** | Low | High | Unit test all Escape scenarios, verify IME composition handling |
| **Graph state logic bugs** | Medium | High | Comprehensive unit tests for all 5 states and priority order (test-first) |
| **Theme switch flicker** | Low | Low | Ensure token values are reactive, test theme toggle during modal open |
| **87-node load issues** | Low | Medium | Smoke test with maximum node count, verify rendering performance |
| **Long label overflow** | Medium | Low | Fixed row spacing + truncation + inspector full name mitigates risk |

### Process Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Incomplete AC coverage** | Medium | High | AC checklist verification before sign-off, evidence collection |
| **Test-first violation** | Medium | Medium | Task graph enforces test-before-impl order |
| **Accessibility regression** | Low | High | A11y audit by specialist, axe-core integration in CI |
| **Catalog preview breakage** | Low | High | Manual testing in catalog preview frame, verify focus bypass |
| **Deployed with fallback state active** | Low | Medium | Test with real data sets, verify normal state renders correctly |
| **Missing edge cases** | Medium | Medium | Exploratory testing, negative case unit tests |
| **Documentation gaps** | Medium | Low | Update README, inline comments, A11y docs |
| **Bundle spike gate ignored** | Low | Medium | Clear documentation of spike process, team agreement |

### Dependency Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **@xyflow/react breaking changes** | Low | High | Pin to specific version, monitor release notes, document upgrade path |
| **React version conflict** | Very Low | High | Verify compatibility matrix before install |
| **Bundle analyzer tool changes** | Low | Low | Use stable version, document verification process |
| **Token value changes** | Low | Medium | Coordinate with design team, test with current token values |

### User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Graph layout confusion** | Medium | Medium | Clear labels, intuitive left-to-right flow, inspector guidance |
| **Selection state unclear** | Low | Low | High-contrast selection ring, clear dependency highlighting |
| **Zoom/pan controls hard to discover** | Low | Low | Accessible names, keyboard shortcuts documentation |
| **CTA button unclear purpose** | Low | Medium | Clear label "Start session with {component-name}", confirm dialog optional |
| **Empty states confusing** | Medium | Low | Clear messages explaining state (e.g., "No repositories or components found for {systemName}") |
| **Long labels truncated** | Medium | Low | Full name available in inspector, hover tooltip optional |

### Mitigation Summary

**High-Priority Mitigations:**
1. Test-first task graph enforces TDD (T06–T11, T23–T25, T33–T34, T41–T43)
2. A11y audit with axe-core (T48)
3. Manual AC checklist verification (T54)
4. Escape key handling thorough testing (T09, T19)
5. Catalog preview verification (T56)
6. Bundle spike gate enforcement (T50)
7. 87-node smoke test (T57)

**Monitoring Post-Rollout:**
- Bundle size metrics (spike trigger if > 70 KB)
- Modal load time (median/p95 from 10-run protocol)
- Error rates for SystemMapModal
- A11y violation reports
- User feedback on graph usability

---

## 9. Concrete Validation Commands

### Bundle Size Verification (Realistic Conditions)

```bash
# Step 1: Build the application with production-like settings
# Minification enabled, no source maps, realistic conditions
NODE_ENV=production npm run build

# Step 2: Open bundle analyzer report
# Report is typically at dist/stats.html or similar
open dist/stats.html

# Step 3: Locate SystemMapModal chunk and verify gzipped size is 50–70 KB
# Measure total first-open feature JS+CSS gzip
# Take screenshot of bundle analyzer for evidence

# Step 4: If > 70 KB gzipped, trigger spike gate investigation
# Investigate tree-shaking, code splitting, dependency review
```

### Lazy Loading Verification

```bash
# Step 1: Start dev server
npm run dev

# Step 2: Open browser DevTools (Network tab)
# Filter by "JS" or "All"

# Step 3: Load application home page
# Verify SystemMapModal chunk is NOT in network requests

# Step 4: Open system map modal via UI
# Verify SystemMapModal chunk loads at this moment

# Step 5: Take screenshot of Network tab showing:
# - Initial page load (no SystemMapModal chunk)
# - Modal open (SystemMapModal chunk present)
```

### Performance Verification (10-Run Protocol)

```bash
# Step 1: Build production preview
npm run build
npm run preview

# Step 2: Open Chrome with cache disabled
# Chrome DevTools > Network tab > Disable cache checkbox
# Or: chrome --disk-cache-dir=/dev/null

# Step 3: Navigate to localhost:4173

# Step 4: Open DevTools Performance tab

# Step 5: For i in {1..10}; do
#   - Refresh page
#   - Open system map modal
#   - Stop recording
#   - Note time from modal open trigger to interactive graph
#   - Save recording

# Step 6: Calculate median and p95 from 10 measurements

# Step 7: Document evidence (no unsupported hard 300ms claim)
```

### Token-Only CSS Verification

```bash
# Search for hex color literals in SystemMapModal files
grep -r '#[0-9A-Fa-f]\{6\}' src/components/system/SystemMapModal*
# Expected: Nothing (except possibly comments)

# Search for fallback tokens or hardcoded colors
grep -r 'kx-text-on-accent\|kx-selection-ring\|#[0-9A-Fa-f]' src/components/system/SystemMapModal*
# Expected: Nothing (except comments)

# Verify all --kx-* tokens exist in tokens.css
grep -oP '--kx-[a-z0-9-]+' src/components/system/SystemMapModal.tsx src/components/system/SystemMapModal.css | sort -u
# Expected: All tokens should be defined in src/styles/tokens.css
```

### Graph States Verification

```bash
# Run unit tests for graph state logic
npm test -- SystemMapModal

# Manual verification checklist:
# 1. Invalid systemId → Fallback state (8 nodes/9 edges, warning banner)
# 2. Build exception → Fallback via error boundary (SystemMapFallbackView)
# 3. Missing repo record → Invalid state (dashed placeholder, warning banner)
# 4. Empty repoIds → Truly Empty state (empty message, no graph)
# 5. All repos resolve, 0 components → Repos-No-Components (repos + system, info banner)
# 6. Valid data with components → Normal state (full graph, no banner)
# 7. Component with out-of-scope repoId → Component not rendered
```

### Focus Behavior Verification

```bash
# Production context tests:
# 1. Open modal → Verify focus at dialog root (use DevTools Elements panel)
# 2. Tab through nodes → Verify focus cycles within modal
# 3. Press Escape with selection → Verify selection cleared, modal stays open
# 4. Press Escape without selection → Verify modal closes
# 5. Verify focus returns to trigger element after close

# Catalog preview context tests:
# 1. Open modal in catalog preview frame
# 2. Verify no focus trap (Tab can exit modal)
# 3. Tab through nodes → Verify focus moves, can exit
# 4. Press Escape with selection → Verify selection cleared, modal stays open
# 5. Press Escape without selection → Verify modal closes

# IME composition test:
# 1. Open modal, select a node
# 2. Start IME composition (e.g., input method for CJK)
# 3. Press Escape while composing
# 4. Verify selection is NOT cleared, modal stays open
```

### CTA Dispatch Verification

```bash
# 1. Add custom middleware or console logging to capture dispatched actions
# 2. Open SystemMapModal
# 3. Select a Component node
# 4. Click CTA button "Start session with {component-name}"
# 5. Verify actions are dispatched in exact sequence (exact flat reducer shapes):
#    - { type: 'CLEAR_COMPONENTS' }
#    - { type: 'TOGGLE_COMPONENT', componentId: '...' }
#    - { type: 'CONFIRM_SESSION_CONTEXT', systemId: '...', repoIds: ['...'] }
#    - { type: 'CLOSE_OVERLAY' } (via dismissOverlay)
# 6. Verify modal closes and session flow initiates

# NOTE: Do NOT use Redux DevTools for verification — not part of supported tooling
```

### Accessibility Verification

```bash
# Install axe-core DevTools extension or use @axe-core/react

# Automated scan:
npm run test:e2e  # If Playwright axe-core is configured

# Manual keyboard navigation:
# 1. Open modal
# 2. Tab to first node
# 3. Verify focus indicator visible
# 4. Press Enter/Space → Verify node selected
# 5. Tab to next node → Verify focus moves
# 6. Press Escape → Verify selection cleared
# 7. Press Escape again → Verify modal closes
# 8. Verify all interactive elements reachable via keyboard

# Verify control accessible names:
# 1. Inspect zoom in button → aria-label="Zoom in"
# 2. Inspect zoom out button → aria-label="Zoom out"
# 3. Inspect fit view button → aria-label="Fit to view"
# 4. Inspect reset selection button → aria-label="Reset selection"

# Screen reader test (optional but recommended):
# 1. Open modal with NVDA/VoiceOver
# 2. Verify node announcements include name and type
# 3. Verify selection state announced (aria-pressed)
# 4. Verify inspector panel updates announced
```

### Theme Verification

```bash
# Light theme (default):
npm run dev
# Open SystemMapModal in light mode
# Verify all tokens render correctly
# Verify no hardcoded colors visible
# Take screenshot for baseline

# Dark theme:
# 1. Open browser DevTools
# 2. Set document.documentElement.setAttribute('data-theme', 'dark')
# 3. Verify all tokens render correctly
# 4. Compare visual quality with light theme
# Take screenshot for baseline

# Verify theme toggle during modal open:
# 1. Open modal in light theme
# 2. Toggle to dark theme
# 3. Verify no flicker, immediate token update

# Verify no fallback tokens:
grep -r 'fallback\|#[0-9A-Fa-f]' src/components/system/SystemMapModal.css
# Should return nothing (except comments)
```

### Graph Maximum Verification

```bash
# Create test data with 87 nodes (~37 fixture + 50 envelope)
# 9 systems, 38 repositories, 40 components = 87 total

# Load system with maximum nodes
npm run dev

# Open DevTools Performance tab
# Record while opening system map
# Verify:
# - Render completes within reasonable time
# - No layout thrashing
# - Smooth interactions (zoom, pan, selection)

# Take screenshot for evidence of 87-node load
```

---

## 10. Implementation Notes and Guidance

### Code Structure for SystemMapModal.tsx

```typescript
// SystemMapModal.tsx (eager dialog shell)
import { lazy, Suspense } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { ErrorBoundary } from 'react-error-boundary'
import { useFocusContainment } from '../shell/useFocusContainment'
import { SystemMapSkeleton } from './SystemMapSkeleton'
import { GraphSkeleton } from './GraphSkeleton'
import { SystemMapFallbackView } from './SystemMapFallbackView'

const SystemMapGraph = lazy(() => import('./SystemMapGraph'))

export default function SystemMapModal() {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusContainment(dialogRef)  // No options, auto-bypasses catalog preview

  return (
    <Dialog className="kx-modal kx-system-map" ref={dialogRef}>
      <ReactFlowProvider>
        <ErrorBoundary fallback={<SystemMapFallbackView />}>
          <Suspense fallback={<GraphSkeleton />}>
            <SystemMapGraph />
          </Suspense>
        </ErrorBoundary>
      </ReactFlowProvider>
    </Dialog>
  )
}
```

### Code Structure for SystemMapGraph.tsx

```typescript
// SystemMapGraph.tsx (lazy inner graph component)
import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'

// Type definitions
interface FlowNodeData {
  type: 'system' | 'repository' | 'component'
  label: string
  description?: string
  metadata?: Record<string, string>
  repoId?: string  // For Component nodes
}

type FlowNode = Node<FlowNodeData>
type FlowEdge = Edge

// Node components
function SystemNode({ data }: { data: FlowNodeData }) { /* ... */ }
function RepositoryNode({ data }: { data: FlowNodeData }) { /* ... */ }
function ComponentNode({ data }: { data: FlowNodeData }) { /* ... */ }

const nodeTypes: NodeTypes = {
  system: SystemNode,
  repository: RepositoryNode,
  component: ComponentNode,
}

// Graph data builder with deterministic manual coordinates
function buildGraphData(system: System, repositories: Repository[], components: ComponentEntry[]): {
  nodes: FlowNode[]
  edges: FlowEdge[]
  state: GraphState
} {
  // State priority: Fallback (invalid systemId, unresolved, error) → Invalid → Truly Empty → Repos-No-Components → Normal
  // Manual x/y coordinates based on stable normalized-name+id ordering
  // No layout engine
  // ... implementation
}

export default function SystemMapGraph() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const { fitView, zoomIn, zoomOut } = useReactFlow()  // Used only here, below ReactFlowProvider
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)

  // Resolve system
  const systemId = state.overlay.kind === 'system-map' ? state.overlay.systemId : null
  const system = state.systems.find(s => s.id === systemId) ?? /* fallback logic */

  // Build graph with manual coordinates
  const { nodes, edges, graphState } = useMemo(
    () => buildGraphData(system, state.repositories, state.components),
    [system, state.repositories, state.components]
  )

  // Initial fitView on graph load
  useEffect(() => {
    fitView({ duration: 0 })
  }, [fitView, nodes])

  // Event handlers
  const handleNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    // Clicking already-selected node keeps selection
    if (selectedNode?.id !== node.id) {
      setSelectedNode(node)
    }
  }, [selectedNode])

  const handlePaneClick = useCallback(() => {
    // Clicking empty canvas clears selection
    setSelectedNode(null)
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && selectedNode && !event.isComposing) {
      setSelectedNode(null)
      event.preventDefault()  // Two-phase: prevent default, don't call stopPropagation
    }
  }, [selectedNode])

  const handleCTAClick = useCallback(() => {
    if (!selectedNode || selectedNode.data.type !== 'component') return

    // Use exact reducer shapes from mockupReducer.ts (flat, no payload wrapper)
    dispatch({ type: 'CLEAR_COMPONENTS' })
    dispatch({ type: 'TOGGLE_COMPONENT', componentId: selectedNode.id })
    dispatch({
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: system.id,
      repoIds: [selectedNode.data.repoId!]
    })
    dismissOverlay()
  }, [selectedNode, system.id, dispatch, dismissOverlay])

  // Dependency highlighting: selected node + one-hop incident edge neighbors (direction ignored)
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const highlighted = new Set<string>([selectedNode.id])
    // Find all nodes connected via any incident edge (direction ignored)
    edges.forEach(edge => {
      if (edge.source === selectedNode.id) highlighted.add(edge.target)
      if (edge.target === selectedNode.id) highlighted.add(edge.source)
    })
    return highlighted
  }, [selectedNode, edges])

  // Render based on graph state
  // ...
}
```

### CSS Guidelines for SystemMapModal.css

```css
/* Token-based styling only - no hex literals, no fallback tokens */

/* Graph container */
.kx-system-map__graph {
  height: 480px;
  min-height: 480px;
  background: var(--kx-raised);
  border-radius: var(--kx-radius-main);
  position: relative;
}

/* Node base styles */
.react-flow__node {
  /* All colors via tokens */
}

/* System node */
.system-node {
  background: var(--kx-raised);
  border: 2px solid var(--kx-accent-strong);
  color: var(--kx-primary);
}

/* System node selected */
.system-node.selected {
  border: 2.5px solid var(--kx-accent-strong);
  box-shadow: 0 0 0 4px rgb(var(--kx-ink-rgb) / 0.14);
}

/* Repository node */
.repository-node {
  background: var(--kx-pale);
  border: 1.5px solid var(--kx-border);
  color: var(--kx-primary);
}

/* Component node */
.component-node {
  background: var(--kx-raised);
  border: 1.5px solid var(--kx-border);
  color: var(--kx-primary);
}

/* Edge styles - NO arrowheads */
.react-flow__edge-path {
  stroke: var(--kx-border);
  stroke-width: 1.5px;
  /* No marker-end for arrowheads */
}

.react-flow__edge-path.highlighted {
  stroke: var(--kx-accent-strong);
  stroke-width: 2px;
}

.react-flow__edge-path.dimmed {
  stroke: var(--kx-border);
  stroke-width: 1px;
  opacity: 0.3;
}

/* Placeholder node (dashed) */
.repository-node.placeholder {
  border-style: dashed;
  border-width: 1px;
}

/* Inspector panel - 280px fixed at desktop min 1200x720 */
.kx-system-map__inspector {
  width: 280px;
  background: var(--kx-raised);
  border-left: 1px solid var(--kx-border);
}

/* Zoom controls */
.kx-system-map__controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
}

/* Banner messages */
.kx-system-map__banner--warning {
  background: var(--kx-pale);
  border-left: 3px solid var(--kx-accent-strong);
  color: var(--kx-primary);
}

.kx-system-map__banner--info {
  background: var(--kx-pale);
  border-left: 3px solid var(--kx-border);
  color: var(--kx-primary);
}

/* Label truncate */
.kx-system-map__node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* Fixed width for truncation */
}
```

---

## 11. Sign-Off Checklist

### Before Implementation Begins

- [ ] Specification reviewed and understood
- [ ] All assumptions documented and resolved
- [ ] Dependencies identified and available
- [ ] Risk mitigation strategies in place
- [ ] Testing environment configured
- [ ] Bundle analyzer tool ready

### During Implementation (Test-First)

- [ ] T01: @xyflow/react installed
- [ ] T02: Bundle analyzer configured
- [ ] T03: SystemMapSkeleton created
- [ ] T04: GraphSkeleton created
- [ ] T05: SystemMapFallbackView created
- [ ] T06–T11: All tests written (Red phase) BEFORE implementation
- [ ] T12: Lazy loading implemented in AppShell
- [ ] T13: Eager dialog shell with ReactFlowProvider + ErrorBoundary + Suspense implemented
- [ ] T14: Lazy SystemMapGraph with useReactFlow implemented
- [ ] T15: Graph data builder with manual coordinates implemented
- [ ] T16: Graph state machine (5 states) implemented
- [ ] T17: Node selection implemented
- [ ] T18: Dependency highlighting implemented
- [ ] T19: Two-phase Escape handling implemented
- [ ] T20: CTA dispatch with exact reducer shapes implemented
- [ ] T21: Initial fitView implemented
- [ ] T22: All tests passing (Green phase)
- [ ] T23–T25: UI tests written (Red phase)
- [ ] T26: Inspector panel (280px) implemented
- [ ] T27: Inspector fields implemented
- [ ] T28: Inspector placeholder properties implemented
- [ ] T29: Zoom/pan controls implemented
- [ ] T30: Reset selection control implemented
- [ ] T31: Fixed row spacing and label truncate implemented
- [ ] T32: All tests passing (Green phase)
- [ ] T33–T34: Theme tests written (Red phase)
- [ ] T35: Node token styles implemented
- [ ] T36: Edge token styles (no arrowheads) implemented
- [ ] T37: Selected state ring with exact token implemented
- [ ] T38: Banner styles implemented
- [ ] T39: All hex literals and fallback tokens removed
- [ ] T40: Token compliance verified (grep returns nothing)
- [ ] T41–T43: A11y tests written (Red phase)
- [ ] T44: useFocusContainment verified in production shell
- [ ] T45: tabIndex and aria-pressed implemented
- [ ] T46: Enter/Space keyboard selection implemented
- [ ] T47: Control accessible names implemented
- [ ] T48: A11y audit passed (axe-core)

### Before Code Review

- [ ] T49: Bundle built and size measured
- [ ] T50: Bundle size 50–70 KB gzipped confirmed (spike gate not triggered)
- [ ] T51: Lazy loading verified (Network tab)
- [ ] T52: Performance tested (10 runs median/p95, evidence documented)
- [ ] T53: Performance evidence documented (no unsupported hard 300ms claim)
- [ ] All 50 acceptance criteria verified (AC1–AC50)
- [ ] Token-only CSS verified (grep commands)
- [ ] Light and dark themes tested
- [ ] Focus containment verified (production)
- [ ] Catalog preview verified (no focus trap)
- [ ] Escape key behavior verified (all scenarios, two-phase)
- [ ] CTA dispatch sequence verified (exact reducer shapes, no Redux DevTools)
- [ ] All graph states tested manually (including invalid systemId)
- [ ] User interactions verified (click-already-selected, click-canvas-clears, pan/scroll)
- [ ] Component structure verified (ReactFlowProvider placement, ErrorBoundary fallback)
- [ ] Dependency highlighting verified (one-hop neighbors, direction ignored)
- [ ] A11y audit passed (axe-core)
- [ ] Unit tests passing (>90% coverage, test-first approach)
- [ ] 87-node smoke test passed

### Before Merge

- [ ] Code review approved
- [ ] All checklist items above complete
- [ ] Documentation updated (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring dashboards configured

---

## 12. Appendix: Quick Reference

### File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/shell/AppShell.tsx` | Modify | Add lazy loading for SystemMapModal |
| `src/components/system/SystemMapModal.tsx` | Rewrite | Replace SVG with React Flow, implement all features |
| `src/components/system/SystemMapModal.css` | Rewrite | New styles for React Flow, inspector, controls, banners |
| `src/components/system/SystemMapSkeleton.tsx` | Create | New skeleton component for Suspense fallback |
| `src/components/system/GraphSkeleton.tsx` | Create | New skeleton component for inner graph |
| `src/components/system/SystemMapFallbackView.tsx` | Create | New fallback component for ErrorBoundary |
| `src/components/system/SystemMapModal.test.tsx` | Update | New tests for all features and states |
| `package.json` | Modify | Add @xyflow/react dependency |
| `vite.config.ts` | Optional | Add bundle analyzer plugin |

### Key Code Snippets

**Lazy Loading (AppShell.tsx):**
```typescript
const SystemMapModal = lazy(() => import('../system/SystemMapModal'))

{state.overlay.kind === 'system-map' && (
  <Suspense fallback={<SystemMapSkeleton />}>
    <SystemMapModal />
  </Suspense>
)}
```

**CTA Dispatch Sequence:**
```typescript
dispatch({ type: 'CLEAR_COMPONENTS' })
dispatch({ type: 'TOGGLE_COMPONENT', componentId })
dispatch({ type: 'CONFIRM_SESSION_CONTEXT', systemId, repoIds: [component.repoId] })
dismissOverlay()
```

**Escape Key Handler (Two-Phase):**
```typescript
onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && selectedNode && !event.isComposing) {
    setSelectedNode(null)
    event.preventDefault()  // Prevent OverlayLifecycle close
    // NOTE: Do NOT call stopPropagation() — source may not support it
  }
}
```

**Selected Ring Style:**
```css
box-shadow: 0 0 0 4px rgb(var(--kx-ink-rgb) / 0.14);
border: 2.5px solid var(--kx-accent-strong);
```

**Component Structure (ReactFlowProvider + ErrorBoundary):**
```typescript
// SystemMapModal.tsx (eager shell)
export default function SystemMapModal() {
  return (
    <Dialog className="kx-modal kx-system-map">
      <ReactFlowProvider>
        <ErrorBoundary fallback={<SystemMapFallbackView />}>
          <Suspense fallback={<GraphSkeleton />}>
            <SystemMapGraph />
          </Suspense>
        </ErrorBoundary>
      </ReactFlowProvider>
    </Dialog>
  )
}

// SystemMapGraph.tsx (lazy inner)
export default function SystemMapGraph() {
  const { fitView, zoomIn, zoomOut } = useReactFlow()  // OK here, below provider
  // ...
}
```

**User Interaction Behaviors:**
```typescript
const handleNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
  // Clicking already-selected node keeps selection
  if (selectedNode?.id !== node.id) {
    setSelectedNode(node)
  }
}, [selectedNode])

const handlePaneClick = useCallback(() => {
  // Clicking empty canvas clears selection
  setSelectedNode(null)
}, [])
```

**Dependency Highlighting (One-Hop Neighbors, Direction Ignored):**
```typescript
const highlightedNodes = useMemo(() => {
  if (!selectedNode) return new Set<string>()
  const highlighted = new Set<string>([selectedNode.id])
  edges.forEach(edge => {
    if (edge.source === selectedNode.id) highlighted.add(edge.target)
    if (edge.target === selectedNode.id) highlighted.add(edge.source)
  })
  return highlighted
}, [selectedNode, edges])
```

**Initial fitView:**
```typescript
useEffect(() => {
  fitView({ duration: 0 })
}, [fitView, nodes])
```

**Control Accessible Names:**
```typescript
<button aria-label="Zoom in" onClick={zoomIn}>+</button>
<button aria-label="Zoom out" onClick={zoomOut}>-</button>
<button aria-label="Fit to view" onClick={() => fitView()}>Fit</button>
<button aria-label="Reset selection" onClick={() => setSelectedNode(null)}>Reset</button>
```

### Contact and Support

| Role | Contact |
|------|---------|
| Implementation Lead | TBD |
| Design Review | TBD |
| A11y Specialist | TBD |
| Code Reviewer | TBD |

---

**End of Planning Package**

*This document is self-contained for external plan review. Do not modify app code, package files, or tests based on this plan without following the task graph and validation procedures.*
