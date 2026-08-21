# Interactive System Map — Implementation Specification

- **Date:** 2026-08-21
- **Artifact type:** Implementation-ready specification
- **Status:** Approved contract for implementation
- **Visual reference:** `Screenshot 2026-08-21 at 21.42.55.png`

---

## Objective

Replace static SVG SystemMapModal with lazy-loaded `@xyflow/react` graph visualization displaying Repository → Component → System hierarchy (left to right), with node selection, dependency highlighting, inspector panel, zoom/pan controls, production focus containment, catalog preview compatibility, and full theme token support.

---

## Visual Layout

### Graph Structure
- **Layout direction:** Left to right
- **Node layers:** Repository (left) → Component (middle) → System (right)
- **Edge direction:** All edges flow left to right (Repository → Component, Component → System)
- **Canvas:** Fixed 480px minimum height, `--kx-raised` background

### Node Styling (Tokens Only)

| Node Type | Background | Stroke | Stroke Width | Text | Badge |
|-----------|------------|--------|--------------|------|-------|
| System | `--kx-raised` | `--kx-accent-strong` | 2px | `--kx-primary` | `--kx-accent-text-aa` |
| Repository | `--kx-pale` | `--kx-border` | 1.5px | `--kx-primary` | — |
| Component | `--kx-raised` | `--kx-border` | 1.5px | `--kx-primary` | — |

**Selected state (all types):**
- Border: `--kx-accent-strong`, width 2.5px
- Ring: `0 0 0 4px rgb(var(--kx-ink-rgb) / 0.14)`
- Background unchanged from unselected

**Edge styling:**
- Default: `--kx-border`, 1.5px solid
- Highlighted (selected dependencies): `--kx-accent-strong`, 2px solid
- Dimmed: `--kx-border`, 1px, opacity 0.3
- Dashed placeholder: `--kx-border`, 1px dashed

**CTA button:** Reuses `.kx-btn--primary` primitive — no internal color restatement.

---

## Bundle and Lazy Loading

### Lazy Loading Boundary
```typescript
// src/components/shell/AppShell.tsx overlay slot
const SystemMapModal = lazy(() => import('../system/SystemMapModal'))

{state.overlay.kind === 'system-map' && (
  <Suspense fallback={<SystemMapSkeleton />}>
    <SystemMapModal />
  </Suspense>
)}
```

### Bundle Size Target
- **Target:** 50–70 KB gzipped
- **Verification:** Network tab confirms chunk loads only on overlay open, not initial page load
- **Evidence required:** Build output or bundle analyzer screenshot

---

## Accessibility and Focus

### Production Dialog Root
- `useFocusContainment(dialogRef)` — no custom option
- Initial focus: Dialog root via useFocusContainment (never first tabbable)
- Focus trap: Active, all focus stays within modal

### Catalog Preview
- `useFocusContainment(dialogRef)` automatically bypasses itself (no conditional code needed)
- All interactions remain live: selection, zoom/pan, inspector, CTA
- No focus trap applied

### Node Keyboard Focus
- `tabIndex={0}` on all nodes
- `aria-pressed={selected}` for selection state (not `aria-selected`)
- Enter/Space on focused node triggers selection

### Escape Key (Identical Production/Preview)
```typescript
onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (selectedNode && !event.isComposing) {
      setSelectedNode(null)
      event.preventDefault() // Prevent OverlayLifecycle from closing
    }
    // Otherwise: no action, OverlayLifecycle document listener closes modal
  }
}
```
- IME/composing Escape (isComposing=true): Ignored by both root selection logic and OverlayLifecycle — does not clear selection or close modal
- Selected + Escape (non-composing): Clears selection, prevents default
- No selection + Escape (non-composing): Delegates to OverlayLifecycle to close modal

---

## CTA Reducer Sequence

When clicking "Start session with {component-name}":

```typescript
dispatch({ type: 'CLEAR_COMPONENTS' })
dispatch({ type: 'TOGGLE_COMPONENT', componentId })
dispatch({ type: 'CONFIRM_SESSION_CONTEXT', payload: { systemId, repoIds: [component.repoId] } })
dismissOverlay()
```

- No made-up payload fields (e.g., no `source: 'system-map-cta'`)
- `repoIds` contains only the selected component's repository ID

---

## Graph States and Data Scope

### State Priority (Evaluated in Order)

1. **Fallback** — System unresolved or graph construction throws exception
   - Renders exactly deterministic 8 node / 9 edge legacy illustrative graph
   - Warning banner: "Illustrative graph — unable to load real data"

2. **Invalid Repository** — Some repo IDs in `system.repoIds` have no matching Repository record
   - Renders dashed placeholder repository node for missing repos
   - Normal edges connect placeholder to in-scope components
   - Warning banner: "Some repositories are missing"

3. **Truly Empty** — System has empty `repoIds` array
   - Empty state message: "No repositories or components found for {systemName}"
   - No graph rendered

4. **Repos-No-Components** — All repo IDs resolve but zero in-scope components
   - Renders all repository nodes and system node
   - Info banner: "No components — repositories exist but components are missing"

5. **Normal** — Default state
   - Renders full graph with all nodes and edges
   - No banner

### Data Scope Rules
- Repository nodes: Only for `repo.id` in `system.repoIds` with matching Repository record
- Component nodes: Only if `component.repoId` in `system.repoIds`
- Out-of-scope components: Never render
- No orphan container
- No retry logic

---

## UI Components

### Inspector Panel (Right Side)
- Width: 280px, fixed, always visible
- Shows empty state when no selection: "Select a node to view details"
- For selected nodes: type badge, name, description, metadata
- Component nodes only: CTA button "Start session with {name}"

### Zoom/Pan Controls (Bottom-Right)
- Zoom in button
- Zoom out button
- Fit view button
- Reset selection button

---

## Acceptance Criteria

### Core Functionality

1. Opening system map displays interactive `@xyflow/react` graph with Repository → Component → System layout (left to right).

2. Edges connect Repository → Component and Component → System flowing left to right based on data relationships.

3. Node selection highlights node with 2.5px `--kx-accent-strong` stroke and `rgb(var(--kx-ink-rgb) / 0.14)` ring.

4. Selected node's direct dependencies (connected nodes and edges) highlight with `--kx-accent-strong`, non-connected elements dim to opacity 0.3.

5. Inspector panel shows selected node details; Component nodes include CTA button using `.kx-btn--primary`.

6. Clicking CTA dispatches `CLEAR_COMPONENTS` → `TOGGLE_COMPONENT {componentId}` → `CONFIRM_SESSION_CONTEXT {systemId, repoIds:[component.repoId]}` → `dismissOverlay`.

7. Zoom/pan controls (in, out, fit, reset) are functional and positioned bottom-right.

8. System nodes use `--kx-raised` background, `--kx-accent-strong` stroke, `--kx-primary` text, `--kx-accent-text-aa` badge.

9. Repository nodes use `--kx-pale` background, `--kx-border` stroke, `--kx-primary` text.

10. Component nodes use `--kx-raised` background, `--kx-border` stroke, `--kx-primary` text.

### Bundle and Lazy Loading

11. `@xyflow/react` is lazy-loaded at `src/components/shell/AppShell.tsx` overlay slot.

12. SystemMapModal chunk is 50–70 KB gzipped (verified via bundle analyzer).

13. Network tab confirms chunk loads only on overlay open, not initial page load.

### Accessibility

14. Production uses `useFocusContainment(dialogRef)` with no custom option.

15. Catalog preview bypasses focus containment automatically (no conditional code).

16. Nodes have `tabIndex={0}` and `aria-pressed={selected}` (not `aria-selected`).

17. Selected node + Escape (non-composing) clears selection and prevents default.

18. Escape without selection delegates to OverlayLifecycle to close modal (identical production/preview).

19. Initial focus goes to dialog root in production; no initial focus trap in preview.

20. All interactions (selection, zoom/pan, inspector, CTA) remain live in catalog preview.

### Graph States

21. Fallback state (unresolved system/build exception) renders exactly 8 nodes / 9 edges deterministic illustrative graph with warning banner.

22. Invalid repository state (missing repo record) renders dashed placeholder repository node with normal edges.

23. Truly empty state (empty `repoIds`) shows empty message with no graph.

24. Repos-no-components state (all repos resolve, zero components) renders repositories + system with info banner.

25. Normal state renders full graph with no banner.

26. Graph states are mutually exclusive and evaluated in priority order: Fallback → Invalid → Truly Empty → Repos-No-Components → Normal.

27. Out-of-scope components (repoId not in system.repoIds) never render.

28. No orphan container or retry logic exists.

### Theme and Styling

29. All runtime CSS uses tokens exclusively; no raw hex colors or nonexistent tokens.

30. Selected state ring uses exactly `rgb(var(--kx-ink-rgb) / 0.14)`.

31. CTA button reuses `.kx-btn--primary` with no internal color restatement.

32. System node badge uses `--kx-accent-text-aa`.

33. Light and dark themes render correctly using token values.

---

## Validation Plan

### Bundle Size Verification
```bash
npm run build
npx vite-bundle-visualizer
# Verify SystemMapModal chunk: 50–70 KB gzipped
# Screenshot bundle analyzer for evidence
```

### Lazy Loading Verification
1. Open DevTools Network tab
2. Load application (do not open system map)
3. Verify SystemMapModal chunk is NOT in network requests
4. Open system map modal
5. Verify SystemMapModal chunk loads at this moment
6. Screenshot network tab for evidence

### Graph States Verification
| Test | Expected State | Evidence |
|------|----------------|----------|
| Null system data | Fallback | 8 nodes/9 edges, warning banner |
| Build exception | Fallback | 8 nodes/9 edges, warning banner |
| Missing repo record | Invalid | Dashed placeholder node, warning banner |
| Empty repoIds array | Truly Empty | Empty message, no graph |
| All repos resolve, 0 components | Repos-No-Components | Repos + system, info banner |
| Valid data with components | Normal | Full graph, no banner |
| Component with out-of-scope repoId | Normal | Component not rendered |

### Focus Behavior Verification
| Context | Test | Expected |
|---------|------|----------|
| Production | Modal opens | Focus at dialog root |
| Production | Tab through nodes | Focus cycles within modal |
| Production | Escape with selection | Selection cleared, modal stays open |
| Production | Escape without selection | Modal closes |
| Preview | Modal opens | No focus trap |
| Preview | Tab through nodes | Focus moves, can exit modal |
| Preview | Escape with selection | Selection cleared, modal stays open |
| Preview | Escape without selection | Modal closes |

### CTA Dispatch Verification
1. Select Component node
2. Click CTA button
3. Verify Redux DevTools shows actions in sequence:
   - `CLEAR_COMPONENTS`
   - `TOGGLE_COMPONENT {componentId}`
   - `CONFIRM_SESSION_CONTEXT {systemId, repoIds:[component.repoId]}`
4. Verify modal closes and session flow initiates

### Token-Only CSS Verification
```bash
# Search for hex color literals in component files
grep -r '#[0-9A-Fa-f]\{6\}' src/components/system/SystemMapModal*
# Should return nothing (except comments)

# Search for nonexistent tokens
grep -r 'kx-text-on-accent\|kx-selection-ring' src/components/system/SystemMapModal*
# Should return nothing
```

---

## Source of Truth

1. **This specification** — authoritative contract
2. **Screenshot reference** — `Screenshot 2026-08-21 at 21.42.55.png` — visual reference
3. **Existing SystemMapModal** — `src/components/system/SystemMapModal.tsx` — focus containment patterns
4. **Theme tokens** — `src/styles/tokens.css` — color/typography tokens
5. **Data model** — `src/data/mockData.ts` — System, Repository, ComponentEntry interfaces
6. **CatalogPreviewContext** — `src/catalog/CatalogPreviewContext.tsx` — preview contract

---

## Out of Scope

- Real-time graph updates from backend
- Drag-and-drop node repositioning
- Edge creation/deletion
- Graph persistence or export
- Multi-selection of nodes
- Mini-map or overview panel
- Graph search or filtering
- Custom layout algorithms beyond React Flow defaults
- Animated transitions between states

---

*End of specification.*
