# Interactive System Map — Design Specification

- **Date:** 2026-08-21
- **Artifact type:** Approved design specification for implementation
- **Status:** Approved requirement contract
- **Source:** Screenshot reference (Screenshot 2026-08-21 at 21.42.55.png) and approved design decisions

---

## 1. Objective

Replace the current static SVG SystemMapModal with an interactive, lazy-loaded graph visualization powered by `@xyflow/react` (React Flow). The new interactive system map will display the relationship hierarchy **Repository → Component → System** (left to right), enable node selection, highlight direct dependencies, expose component actions via a right-side inspector, and provide zoom/pan controls while maintaining production focus containment, catalog preview compatibility, and full theme token support for both light and dark modes.

## 2. Source of Truth

1. **This specification** — the single authoritative contract for the interactive system map implementation.
2. **Screenshot reference** — `Screenshot 2026-08-21 at 21.42.55.png` (provided by user) — visual reference for the desired interactive layout and inspector panel placement.
3. **Existing SystemMapModal** — `src/components/system/SystemMapModal.tsx` and `.css` — reference for current focus containment, modal structure, and styling patterns to preserve.
4. **Theme tokens** — `src/styles/tokens.css` — authoritative color/typography/dimension tokens (light/dark variants).
5. **Data model** — `src/data/mockData.ts` — `System`, `Repository`, `ComponentEntry` interfaces and relationship structure.
6. **CatalogPreviewContext** — `src/catalog/CatalogPreviewContext.tsx` — preview compatibility contract.
7. **@xyflow/react documentation** — React Flow library API for graph visualization, node selection, edges, zoom/pan, and theming.

## 3. Scope

### 3.1 In Scope

- Replace static SVG SystemMapModal with lazy-loaded `@xyflow/react` graph
- Three-tier graph hierarchy: **Repository (left) → Component (middle) → System (right)**
- Edge direction: Left to right (Repository → Component, Component → System)
- Node selection via mouse click and keyboard (Enter/Space)
- Selection highlights direct dependencies (connected nodes and edges)
- Right-side inspector panel showing selected node details
- For selected Component nodes: expose CTA button "Start session with [component-name]"
- Zoom/pan functionality with visible controls: zoom in, zoom out, fit view, reset selection
- Full theme token support for both light and dark modes (no fixed dark colors)
- Keyboard navigation: Tab/Shift+Tab between nodes, Enter/Space to select, Escape to close modal
- Production focus containment via `useFocusContainment` (respecting `CatalogPreviewContext`)
- Catalog preview compatibility (no focus traps in preview context)
- Fallback illustrative graph when relation data is incomplete or missing
- Lazy loading of `@xyflow/react` bundle (~60KB gzip target)

### 3.2 Out of Scope

- Real-time graph updates from backend
- Drag-and-drop node repositioning
- Edge creation/deletion
- Node editing or creation from the graph
- Graph persistence or export
- Multi-selection of nodes
- Graph layout algorithms beyond React Flow's defaults
- Mini-map or overview panel
- Graph search or filtering
- Edge labels or annotations
- Custom node shapes beyond rounded rectangles
- Animated transitions between states

## 4. Data Model

### 4.1 Domain Types (Existing)

```typescript
// From src/data/mockData.ts
export interface System {
  id: string
  name: string
  description?: string
  repoIds: string[]
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
  repoId: string
}
```

### 4.2 Graph Node Types

```typescript
export type GraphNodeType = 'system' | 'repository' | 'component'

export interface GraphNode {
  id: string
  type: GraphNodeType
  label: string
  data: {
    systemId?: string
    repositoryId?: string
    componentId?: string
    vcs?: string
    description?: string
    updatedAt?: string
  }
  position: { x: number; y: number }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'repo-to-component' | 'component-to-system'
}
```

### 4.3 Graph Construction Rules

- **Left layer**: All Repository nodes belonging to the system (via `system.repoIds`)
- **Middle layer**: All Component nodes belonging to each repository (via `component.repoId`)
- **Right layer**: System node (the active system from context)
- **Edges**: Repository → Component (one per component), Component → System (one per component)
- **Positioning**: Left-to-right layout with Repository nodes in a left column, Component nodes in a middle column, System node on the right
- **Edge direction**: All edges flow left to right, representing dependency direction (System depends on Components depends on Repositories)

### 4.4 Graph States

The graph operates in mutually exclusive states. The current state is determined by data availability and validity:

| State | Trigger Condition | Behavior | Indicator |
|-------|------------------|----------|-----------|
| **Normal** | System has `repoIds` with at least one repository; components have valid `repoId` references | Renders full interactive graph with all nodes and edges | None (normal rendering) |
| **Repos-No-Components** | System has repositories but no components, or all components have invalid `repoId` references | Renders Repository nodes and System node, shows message "No components found for these repositories" | Info banner: "No components — repositories exist but components are missing" |
| **Invalid Relations/Orphans** | Some components have `repoId` values that don't match any repository in `system.repoIds` | Renders valid nodes, orphaned nodes appear with warning indicator, dashed edges to orphan container | Warning banner: "Some components reference unknown repositories" |
| **Truly Empty System** | System has empty `repoIds` array or system exists with no associated repositories | Shows empty state with helpful message | Empty state: "No repositories or components found for {systemName}. Add repositories to this system to see its architecture graph." |
| **Fallback** | Graph construction throws exception or data is null/undefined | Renders deterministic illustrative graph (1 System, 2-3 Repository, 2-3 Component per repo) | Warning banner: "Illustrative graph — unable to load real data" |

**State Priority (evaluated in order)**: Fallback → Invalid Relations/Orphans → Truly Empty System → Repos-No-Components → Normal

**Fallback Graph Data** (only for Fallback state):
- 1 System node
- 2-3 Repository nodes
- 2-3 Component nodes per repository
- Edges: Repository → Component → System (same hierarchy as normal)
- Edges following the same hierarchy

## 5. Visual and Layout Contract

### 5.1 Modal Frame (Preserve Current)

The modal frame follows the existing SystemMapModal conventions:

```
.kx-modal.kx-system-map (width: min(720px, calc(100vw - 48px)))
├── .kx-system-map__head (header)
│   ├── h2.kx-system-map__title ("{SystemName} — system map")
│   └── button.kx-icon-btn.kx-system-map__close (close icon)
└── Main layout (new structure)
    ├── Left/Center: Graph canvas (flex: 1)
    │   └── Zoom/pan controls overlay (bottom-right)
    └── Right: Inspector panel (width: 280px, collapsible)
        └── Node details + actions
```

### 5.2 Graph Canvas

- **Height**: Fixed 480px minimum (fits within 720px modal with header and inspector)
- **Background**: Uses `--kx-raised` (light theme: matches token value; dark theme: `#1a231b`)
- **Grid**: Optional subtle grid pattern using `--kx-border` at low opacity
- **Padding**: 16px around the graph content

### 5.3 Node Styling

| Node Type | Fill | Stroke | Stroke Width | Corner Radius |
|-----------|------|--------|--------------|---------------|
| System | `--kx-accent` | `--kx-accent-strong` | 2px | 12px |
| Repository | `--kx-pale` | `--kx-border` | 1.5px | 10px |
| Component | `--kx-raised` | `--kx-border` | 1.5px | 8px |

**Selected state** (any type):
- Fill: `--kx-accent`
- Stroke: `--kx-accent-strong`
- Stroke width: 2.5px
- Drop shadow: `0 0 0 3px var(--kx-selection-ring, rgba(143, 191, 106, 0.2))` (use existing token or documented AA-safe value)

**Hover state** (unselected nodes):
- Stroke: `--kx-accent-strong`
- Cursor: pointer

### 5.4 Edge Styling

| Edge Type | Stroke | Stroke Width | Stroke Style |
|-----------|--------|--------------|--------------|
| Default (unselected) | `--kx-border` | 1.5px | solid |
| Highlighted (selected node's dependencies) | `--kx-accent-strong` | 2px | solid |
| Dimmed (not related to selection) | `--kx-border` | 1px | opacity 0.3 |
| Orphan component edge | `--kx-border` | 1px | dashed |

Edges should have rounded corners (React Flow `smoothstep` or `bezier` curve type).

### 5.5 Typography in Nodes

- **Font family**: `--kx-font-family` (DM Sans)
- **Size**: `--kx-text-md` (12px)
- **Weight**: `--kx-font-medium` (500)
- **Color**: 
  - System nodes: `var(--kx-text-on-accent, #FFFFFF)` (AA-safe on `--kx-accent`)
  - Repository nodes: `--kx-primary`
  - Component nodes: `--kx-secondary`

### 5.6 Inspector Panel

**Structure**:

```
.kx-system-map__inspector (width: 280px, border-left: 1px solid --kx-border)
├── .kx-system-map__inspector-header
│   └── h3 ("Node Details" / node-type-specific title)
├── .kx-system-map__inspector-content
│   ├── Node type badge (System/Repository/Component)
│   ├── Name (large, --kx-text-l, --kx-primary)
│   ├── Description (if present, --kx-text-sm, --kx-secondary)
│   ├── Metadata (VCS, updated date, etc.)
│   └── [Component only] CTA button: "Start session with {name}"
└── .kx-system-map__inspector-empty (when no selection)
    └── "Select a node to view details"
```

**Inspector CTA Button** (Component nodes only):
- Background: `--kx-accent-solid-aa`
- Text: `var(--kx-text-on-accent, #FFFFFF)` (AA-safe on `--kx-accent-solid-aa`)
- Padding: 10px 16px
- Border radius: 8px
- Font: `--kx-text-sm`, `--kx-font-medium`
- Hover: background `--kx-accent-strong`
- Disabled state (no component selected): opacity 0.5, pointer-events: none

### 5.7 Zoom/Pan Controls

**Placement**: Bottom-right corner of graph canvas, 8px inset from edges

**Control buttons**:
- Zoom in (+ icon)
- Zoom out (- icon)
- Fit view (expand/fit icon)
- Reset selection (X icon or "Reset" text button)

**Button styling**:
- Size: 32×32px
- Background: `--kx-raised`
- Border: `1px solid --kx-border`
- Border radius: 6px
- Icon color: `--kx-secondary`
- Hover: background `--kx-pale`, icon `--kx-primary`

## 6. Interaction States

### 6.1 Selection Flow

1. **Initial state**: No node selected, inspector shows "Select a node to view details"
2. **User clicks a node**:
   - Node enters selected state (accent fill, stronger stroke, shadow)
   - Direct dependencies highlight (connected nodes and edges)
   - Non-connected nodes/edges dim (opacity 0.3)
   - Inspector populates with node details
   - For Component nodes: CTA button appears in enabled state
3. **User clicks another node**:
   - Previous selection clears
   - New node selected
   - Inspector updates
4. **User clicks canvas background**:
   - Selection clears
   - All nodes/edges return to normal opacity
   - Inspector shows empty state
5. **User clicks CTA on selected Component**:
   - System Map modal closes
   - Navigation/dispatch to New Session route/modal
   - Selected component is committed as the session context (component ID, repository ID, system ID)

### 6.2 Keyboard Navigation

- **Tab**: Move focus to next tabbable element (nodes, zoom controls, inspector content, close button, CTA)
- **Shift+Tab**: Move focus backward
- **Enter/Space**: Activate focused node (select it)
- **Escape** (two-phase ownership):
  1. **First Escape** (when a node is selected): Clears selection, returns focus to the first node or close button
  2. **Second Escape** (or when no selection): Delegates to modal close lifecycle, closes the modal and restores focus to trigger
- **Arrow keys** (optional enhancement): Navigate between connected nodes

### 6.3 Zoom/Pan Interaction

- **Mouse wheel**: Zoom in/out at pointer position
- **Click + drag**: Pan the graph
- **Double-click**: Reset zoom to fit view
- **Zoom controls**: Programmatic zoom in/out/fit/reset

### 6.4 Loading State

- Show a skeleton loader or spinner while the graph is being computed and React Flow is initializing
- Use the same loading pattern as other modal surfaces (e.g., RepositorySelectorModal)

### 6.5 Error State

If graph construction fails:
- Show error message: "Unable to load system map. Please try again."
- Display "Retry" button
- Log error to console for debugging

### 6.6 Empty State

When a system has no repositories or components:
- Show empty state illustration or icon
- Message: "No repositories or components found for {systemName}"
- Subtext: "Add repositories to this system to see its architecture graph"

## 7. Accessibility

### 7.1 ARIA Attributes

- Modal root: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing title
- Graph canvas: `role="application"`, `aria-label="System architecture graph for {systemName}"`
- Nodes: `role="button"`, `aria-label="{type}: {name}", aria-selected` state
- Inspector: `role="region"`, `aria-label="Selected node details"`
- Zoom controls: `aria-label` for each button

### 7.2 Focus Management

#### Production Dialog Root Behavior (modal opened in-app)
- Preserve existing `useFocusContainment` behavior for focus trapping
- Initial focus: First node in the graph (or close button if graph is empty)
- Focus trap: All focus stays within modal boundaries
- Focus restoration: On modal close, return focus to trigger element
- Escape key: Two-phase ownership as defined in §6.2

#### Catalog Preview Behavior (modal rendered in preview frame)
- Respect `CatalogPreviewContext` by disabling only production focus-trap and modal blocking behavior
- **Graph interactivity remains fully functional**: node selection, zoom/pan controls, inspector, CTA button all work normally
- Initial focus: First node in the graph (no focus trap applied)
- No focus restoration on close (preview frame manages its own focus)
- Escape key: Delegated entirely to parent preview frame (no two-phase ownership in preview)

#### Node Keyboard Focus
- Nodes are focusable via Tab/Shift+Tab in both production and preview contexts
- Focused node receives visible focus indicator (outline or ring)
- Enter/Space on focused node triggers selection
- Arrow keys (if implemented) move focus between connected nodes

### 7.3 Keyboard Operability

- All interactive elements reachable via keyboard
- Visible focus indicators on all focusable elements
- Enter/Space activates nodes and buttons
- Escape dismisses modal or clears selection
- Tab order follows visual layout: graph nodes → zoom controls → inspector → close button

### 7.4 Screen Reader Support

- Graph structure announced: "System map for {systemName} with {X} repositories and {Y} components"
- Selection changes announced: "Selected {type} {name}, {Z} dependencies"
- Inspector content announced when it updates

### 7.5 Color Contrast

- All text meets WCAG AA contrast against its background
- Selected state has sufficient visual indicator beyond color (stroke, shadow)
- Dimmed state uses opacity, not just color change

## 8. Theme Support

### 8.1 Light Theme (Default)

Uses tokens from `:root` in `src/styles/tokens.css`. **All runtime CSS must exclusively consume tokens; hex values in this section are documentation-only for reference**:

- Canvas: `--kx-canvas` (documentation: `#FAF8EF`)
- Modal background: `--kx-raised` (documentation: `#FFF`)
- Graph background: `--kx-raised` (documentation: `#FFF`)
- Borders: `--kx-border` (documentation: `#E2E9D5`)
- Text primary: `--kx-primary` (documentation: `#243025`)
- Text secondary: `--kx-secondary` (documentation: `#58735A`)
- Accent: `--kx-accent` (documentation: `#8FBF6A`)
- Accent strong: `--kx-accent-strong` (documentation: `#5F8D4E`)

### 8.2 Dark Theme

Uses tokens from `[data-theme='dark']`. **All runtime CSS must exclusively consume tokens; hex values in this section are documentation-only for reference**:

- Canvas: `--kx-canvas` (documentation: `#0F1510`)
- Modal background: `--kx-raised` (documentation: `#1A231B`)
- Graph background: `--kx-raised` (documentation: `#1A231B`)
- Borders: `--kx-border` (documentation: `#35502C`)
- Text primary: `--kx-primary` (documentation: `#E8EDE8`)
- Text secondary: `--kx-secondary` (documentation: `#C5CFC6`)
- Accent: `--kx-accent` (documentation: `#8FBF6A`) — unchanged
- Accent strong: `--kx-accent-strong` (documentation: `#5F8D4E`) — unchanged

### 8.3 Theme Switching

- React Flow must re-render when theme changes
- **All runtime CSS must use CSS custom properties (variables) exclusively; hardcoded hex values are prohibited in production code**
- Hex values are only allowed in documentation (as shown in §8.1 and §8.2) and in token definitions in `src/styles/tokens.css`
- Listen for theme changes and update React Flow instance if needed

## 9. Acceptance Criteria

### 9.1 Core Functionality

1. Opening the system map modal (from SystemMenu "Map" action) displays an interactive graph using `@xyflow/react`.
2. The graph renders the three-tier hierarchy: Repository nodes (left), Component nodes (middle), System node (right).
3. Edges correctly connect Repository → Component and Component → System based on data relationships.
4. Clicking a node selects it, highlighting the node with accent fill, stronger stroke, and shadow.
5. When a node is selected, its direct dependencies (connected nodes and edges) highlight, and non-connected elements dim.
6. The right-side inspector panel shows details for the selected node including type, name, description, and metadata.
7. For selected Component nodes, the inspector displays a CTA button "Start session with {component-name}".
8. Clicking the CTA button on a Component node dismisses the modal and initiates a new session flow with that component pre-selected.
9. Clicking the canvas background clears the selection and returns the inspector to its empty state.
10. Zoom in/out via mouse wheel zooms the graph at the pointer position.
11. Dragging the canvas pans the graph.
12. The zoom controls (bottom-right) provide buttons for zoom in, zoom out, fit view, and reset selection.
13. The "Fit view" button centers and scales the graph to fit within the canvas.
14. The "Reset selection" button clears the current selection.

### 9.2 Keyboard Accessibility

15. Tab navigates between graph nodes, zoom controls, inspector content, and the close button.
16. Enter or Space on a focused node selects it.
17. Escape clears the current selection if a node is selected.
18. Escape a second time (or when no selection) closes the modal.
19. All interactive elements have visible focus indicators.
20. The modal maintains focus containment (focus cannot escape to the page behind).

### 9.3 Theme Support

21. In light theme, the graph uses light colors: `--kx-raised`/`--kx-canvas` backgrounds, `--kx-primary` text, `--kx-accent` accents.
22. In dark theme, the graph uses dark colors: `--kx-raised`/`--kx-canvas` backgrounds, `--kx-primary` text, `--kx-accent` accents (unchanged token values).
23. Switching themes updates the graph colors immediately without page reload.
24. All text in nodes, edges (if labeled), and the inspector meets WCAG AA contrast in both themes.

### 9.4 Catalog Preview Compatibility

25. When rendered in the catalog preview (`CatalogPreviewContext`), production focus containment is disabled (no focus trap, no modal blocking).
26. The graph renders correctly in the catalog preview frame with the static overlay class.
27. Graph selection, zoom/pan controls, and inspector panel remain fully interactive in catalog preview.
28. CTA button on Component nodes is functional in catalog preview and performs the same navigation/dispatch action.
29. Catalog navigation (breadcrumb, backlink) remains functional when the SystemMapModal preview loads.
30. Escape key in catalog preview does not have two-phase ownership; it delegates to the parent preview frame immediately.

### 9.5 Graph States

31. When the graph is in **Normal state**, all nodes and edges render correctly with valid relationships.
32. When the graph is in **Repos-No-Components state**, an info banner displays "No components — repositories exist but components are missing".
33. When the graph is in **Invalid Relations/Orphans state**, a warning banner displays "Some components reference unknown repositories" and orphaned nodes appear with a warning indicator.
34. When the graph is in **Truly Empty System state**, an empty state displays with message "No repositories or components found for {systemName}. Add repositories to this system to see its architecture graph."
35. When the graph is in **Fallback state**, a fallback illustrative graph renders with warning banner "Illustrative graph — unable to load real data".
36. The fallback graph is interactive (selectable, zoomable) like the real graph.
37. Graph states are mutually exclusive and evaluated in priority order: Fallback → Invalid Relations/Orphans → Truly Empty System → Repos-No-Components → Normal.

### 9.6 Loading and Error States

38. While the graph is loading, a spinner or skeleton is visible in the canvas area.
39. If graph construction fails, an error message displays with a "Retry" button.
40. When a system has no repositories or components, an empty state displays with a helpful message.

### 9.7 Performance and Bundle Size

41. The `@xyflow/react` library is lazy-loaded at the **AppShell/overlay slot boundary** and does not block initial page load.
    - **Validation**: Run Lighthouse performance audit before and after. Initial Time to Interactive (TTI) must not increase by more than 50ms.
    - **Validation**: Network tab shows SystemMapModal chunk loaded only after user opens the modal, not on initial page load.
    - **Lazy import location**: `src/AppShell.tsx` or the overlay slot component that renders modal dialogs.
42. The gzipped bundle size for the SystemMapModal chunk is approximately 60KB (±10KB acceptable).
    - **Validation**: Run `npx vite-bundle-visualizer` or `webpack-bundle-analyzer`. Confirm SystemMapModal chunk size is between 50-70KB gzipped.
    - **Validation**: The chunk includes `@xyflow/react` core, React Flow CSS, custom node components, and graph utilities.
43. The graph renders smoothly with no perceptible jank on first selection or zoom.
    - **Validation**: Chrome DevTools Performance recording shows frame rate ≥ 55 FPS during first node selection and zoom interaction.
    - **Validation**: Long Tasks API shows no task > 50ms during graph initialization or interaction.

### 9.8 Data Model Correctness

44. Nodes are created from the active system's repositories (via `system.repoIds`).
45. Components are correctly associated with their parent repositories via `component.repoId`.
46. Edges are created only where valid relationships exist (no orphaned nodes).
47. Node labels display the correct names from the data model.

## 10. Test Plan

### 10.1 Unit Tests (Vitest)

- `buildGraphData(system, repositories, components)`:
  - Returns correct node count (1 system + N repos + M components)
  - Creates correct edges (repo→component, component→system)
  - Handles empty `repoIds` with appropriate state (not fallback)
  - Handles invalid `repoId` references by triggering "Invalid Relations/Orphans" state
  - Determines correct graph state based on data availability

- `getHighlightedNodesAndEdges(selectedNodeId, nodes, edges)`:
  - Returns direct neighbors (immediate incoming/outgoing only, no transitive)
  - Returns edges connecting to direct neighbors only
  - Returns empty arrays when no selection
  - Test with graph depth > 2 to verify only immediate neighbors are returned

- `getGraphState(system, repositories, components)`:
  - Returns 'normal' when all data is valid and complete
  - Returns 'repos-no-components' when repos exist but no components
  - Returns 'invalid-relations' when components have invalid repoId references
  - Returns 'truly-empty' when system has no repositories
  - Returns 'fallback' when data is null/undefined or construction fails

- Inspector component:
  - Renders empty state when no selection
  - Renders correct details for System nodes
  - Renders correct details for Repository nodes (including VCS, updated date)
  - Renders correct details for Component nodes (including CTA button)
  - CTA button triggers correct action

### 10.2 Integration Tests (React Testing Library)

- Modal lifecycle:
  - Opens from SystemMenu map action
  - Renders graph canvas and inspector
  - Closes on close button click
  - Closes on Escape key

- Node selection:
  - Clicking a node selects it
  - Selected node has correct styling classes
  - Inspector updates with correct content
  - Clicking background clears selection

- CTA functionality:
  - CTA button appears for Component nodes only
  - Clicking CTA dismisses modal
  - Session flow receives correct component context

- Zoom/pan controls:
  - Zoom in button increases zoom level
  - Zoom out button decreases zoom level
  - Fit view button centers and scales graph
  - Reset selection button clears selection

### 10.3 Accessibility Tests (Playwright + axe-core)

- All interactive elements are keyboard reachable
- Focus trap works correctly (except in catalog preview)
- ARIA attributes are correct and descriptive
- Color contrast meets WCAG AA
- Screen reader announces selection changes
- Escape key behavior is correct

### 10.4 Visual Regression Tests

- Graph renders correctly in light theme
- Graph renders correctly in dark theme
- Selected state styling is correct
- Highlighted dependencies are correct
- Inspector panel layout is correct
- Zoom controls position and styling are correct

### 10.5 E2E Tests (Playwright)

- User opens system map from SystemMenu
- User selects a Component node
- User clicks "Start session" CTA
- User starts a session with the selected component
- User reopens system map and uses zoom controls
- User switches themes and verifies graph updates

## 11. Dependency and Bundle Strategy

### 11.1 New Dependency

Add `@xyflow/react` to `package.json`:

```json
{
  "dependencies": {
    "@xyflow/react": "^11.10.0"
  }
}
```

Version should be the latest stable at implementation time (v11+ recommended for modern React 18+ support).

### 11.2 Lazy Loading Boundary

The SystemMapModal and its React Flow dependency must be lazy-loaded at the **AppShell/overlay slot boundary**:

```typescript
// In src/AppShell.tsx or overlay slot component
const SystemMapModal = lazy(() => import('./components/system/SystemMapModal'))

// Usage in overlay slot:
{state.modal === 'system-map' && (
  <Suspense fallback={<SystemMapSkeleton />}>
    <SystemMapModal />
  </Suspense>
)}
```

This ensures the ~60KB gzip chunk is only loaded when the system map is actually opened.

**Measurable chunk validation**:
```bash
# Build and analyze bundle
npm run build
npx vite-bundle-visualizer
# Check that SystemMapModal appears as separate chunk
# Verify chunk size: 50-70KB gzipped
```

### 11.3 Bundle Size Targets

- `@xyflow/react` (gzip): ~45-55KB
- SystemMapModal + graph logic (gzip): ~10-15KB
- **Total incremental bundle**: ~55-70KB gzip (acceptable range: 50-80KB)

### 11.4 Tree Shaking

Ensure only used React Flow exports are imported:

```typescript
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background,
  useNodesState, 
  useEdgesState,
  BackgroundVariant 
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
```

### 11.5 CSS Loading

React Flow's CSS should be imported in the SystemMapModal component or in a shared styles file, not globally unless other components use it.

## 12. Implementation Notes

### 12.1 Graph Layout Algorithm

Use React Flow's built-in positioning or a simple left-to-right hierarchical layout:

```typescript
// Position nodes in three columns (left to right)
const REPO_COL_X = 50
const COMPONENT_COL_X = 300
const SYSTEM_COL_X = 600

// Repositories: distributed vertically on the left
const repoNodes = repositories.map((repo, i) => ({
  id: repo.id,
  type: 'repository',
  position: { x: REPO_COL_X, y: 50 + (i * 120) },
  // ...
}))

// Components: grouped vertically in the middle
const componentNodes = components.map((comp, i) => {
  const repoIndex = repositories.findIndex(r => r.id === comp.repoId)
  const baseY = 50 + (repoIndex * 120)
  return {
    id: comp.id,
    type: 'component',
    position: { x: COMPONENT_COL_X, y: baseY + ((i % 3) * 40) },
    // ...
}
})

// System: centered vertically on the right
const systemNode = {
  id: system.id,
  type: 'system',
  position: { x: SYSTEM_COL_X, y: 200 }, // Center of ~400px height
  // ...
}
```

### 12.2 Custom Node Types

Define custom node components for each type:

```typescript
const SystemNode = ({ data, selected }: NodeProps) => (
  <div className={`kx-flow-node kx-flow-node--system ${selected ? 'kx-flow-node--selected' : ''}`}>
    {data.label}
  </div>
)

const RepositoryNode = ({ data, selected }: NodeProps) => (
  <div className={`kx-flow-node kx-flow-node--repo ${selected ? 'kx-flow-node--selected' : ''}`}>
    {data.label}
  </div>
)

const ComponentNode = ({ data, selected }: NodeProps) => (
  <div className={`kx-flow-node kx-flow-node--component ${selected ? 'kx-flow-node--selected' : ''}`}>
    {data.label}
  </div>
)

const nodeTypes = {
  system: SystemNode,
  repository: RepositoryNode,
  component: ComponentNode,
}
```

### 12.3 CSS Variables for Theming

**All runtime CSS must exclusively consume tokens. No hardcoded hex values in production code.**

```css
.kx-flow-node {
  background-color: var(--kx-raised);
  border: 1.5px solid var(--kx-border);
  color: var(--kx-primary);
  transition: all 0.2s ease;
}

.kx-flow-node--system {
  background-color: var(--kx-accent);
  border-color: var(--kx-accent-strong);
  color: var(--kx-text-on-accent, #FFFFFF); /* AA-safe on --kx-accent */
}

.kx-flow-node--repo {
  background-color: var(--kx-pale);
}

.kx-flow-node--selected {
  border-color: var(--kx-accent-strong);
  border-width: 2.5px;
  box-shadow: 0 0 0 3px var(--kx-selection-ring, rgba(143, 191, 106, 0.2)); /* Use existing token or AA-safe documented value */
}

.kx-flow-edge {
  stroke: var(--kx-border);
  stroke-width: 1.5px;
}

.kx-flow-edge--highlighted {
  stroke: var(--kx-accent-strong);
  stroke-width: 2px;
}

.kx-flow-edge--dimmed {
  stroke: var(--kx-border);
  stroke-width: 1px;
  opacity: 0.3;
}
```

### 12.4 Focus Containment Integration

Preserve the existing `useFocusContainment` hook usage:

```typescript
export default function SystemMapModal() {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusContainment(dialogRef)
  
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" className="kx-modal kx-system-map">
      {/* ... */}
    </div>
  )
}
```

### 12.5 Catalog Preview Compatibility

Wrap focus containment in a check for catalog preview context to disable only the focus trap, while preserving all graph interactivity:

```typescript
const isCatalogPreview = useIsCatalogPreview()

// Hook-safe focus containment: always called, enabled via option
const dialogRef = useRef<HTMLDivElement>(null)
useFocusContainment(dialogRef, { enabled: !isCatalogPreview })

// Graph interactivity remains fully functional in preview
const onNodeClick = useCallback((event: NodeMouseEvent) => {
  // Normal selection logic works in both production and preview
  // No need to check isCatalogPreview here
  setSelectedNode(event.node)
  updateInspector(event.node)
}, [])
```

For Escape key handling:
```typescript
const onKeyDown = useCallback((event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  
  if (isCatalogPreview) {
    // In preview: selection clear may run, but do NOT call onClose or stopPropagation.
    // Allow the parent preview frame to handle Escape for navigation.
    if (selectedNode) {
      setSelectedNode(null)
    }
    // Do NOT call event.stopPropagation() or onClose() in preview.
    // Parent preview frame manages Escape for its own navigation.
    return
  }
  
  // In production: two-phase ownership
  if (selectedNode) {
    setSelectedNode(null)
    // Return focus to first node or close button
    focusFirstNodeOrClose()
  } else {
    onClose() // Close modal and restore focus to trigger
  }
}, [selectedNode, isCatalogPreview, onClose])
```

## 13. Risks and Non-Goals

### 13.1 Risks

1. **Bundle size**: `@xyflow/react` adds ~60KB gzip. Mitigation: lazy loading, tree shaking.
2. **Performance**: Large graphs (50+ components) may render slowly. Mitigation: limit to current system scope (typically <20 nodes), virtualization if needed.
3. **Theme switching**: React Flow may not update immediately on theme change. Mitigation: force re-render or update styles directly.
4. **Focus containment**: React Flow's internal focus management may conflict with `useFocusContainment`. Mitigation: test thoroughly, potentially disable React Flow's keyboard controls in favor of custom implementation.
5. **Accessibility**: Complex graphs can be challenging for screen readers. Mitigation: provide ARIA descriptions, announce structure on load, keep graph simple.
6. **Data inconsistencies**: Missing or invalid `repoId` references in components. Mitigation: graceful fallback, warn in dev mode.

### 13.2 Non-Goals (Reiterated)

- Real-time graph updates from backend (future enhancement)
- Drag-and-drop node repositioning (future enhancement)
- Edge creation/deletion (future enhancement)
- Graph persistence or export (future enhancement)
- Multi-selection of nodes (future enhancement)
- Graph search or filtering (future enhancement)
- Custom layout algorithms (React Flow defaults are sufficient)
- Mini-map or overview panel (not required for current scope)
- Edge labels or annotations (nodes carry the information)

## 14. Resolved Decisions

### 14.1 CTA State and Dispatch Contract (RESOLVED)

**User-confirmed behavior for "Start session with {component-name}"**:

When a user clicks the CTA button on a selected Component node:
1. The System Map modal closes immediately
2. Navigation/dispatch to the New Session route or modal occurs
3. The selected component is committed as the session context with the following data:
   ```typescript
   {
     componentId: string,      // The selected component's ID
     repositoryId: string,     // The component's parent repository ID
     systemId: string,         // The active system's ID
     source: 'system-map-cta'  // Indicates the source for analytics
   }
   ```

**Implementation requirements**:
- Use the existing session creation flow (same as selecting a component from other UI paths)
- Do not bypass existing validation or authentication checks
- Ensure focus is properly managed after navigation
- Log the `system-map-cta` source for analytics

### 14.2 Additional Implementation Notes

1. **Graph canvas size**: The fixed 480px height is sufficient for typical systems (<20 nodes). For systems with many components, the React Flow canvas supports scrolling/panning internally.

2. **Component grouping**: Edge connections are sufficient for this phase. Visual grouping (subtle background regions) can be a future enhancement.

3. **Zoom limits**: Use React Flow defaults (min: 0.1, max: 4) unless testing shows they're inadequate.

4. **Session context**: When clicking the CTA, the full context is passed: system ID, repository ID (from component's repo), and component ID. The session flow determines execution profile.

## 15. Self-Review for Ambiguity and Contradictions

### 15.1 Reviewed Areas

| Area | Status | Notes |
|------|--------|-------|
| Graph hierarchy | ✅ Resolved | Repository → Component → System (left to right) is clearly defined |
| Edge direction | ✅ Resolved | All edges flow left to right, representing dependency direction |
| Node selection | ✅ Clear | Single selection with dependency highlighting |
| Direct dependencies | ✅ Resolved | Immediate incoming/outgoing neighbors only (no transitive) |
| Inspector content | ✅ Clear | Details vary by node type, CTA for Components only |
| CTA contract | ✅ Resolved | Close modal → navigate to New Session → commit component context |
| Zoom/pan controls | ✅ Clear | Four buttons: in, out, fit, reset |
| Theme support | ✅ Resolved | All runtime CSS uses tokens exclusively; hex values documentation-only |
| Keyboard navigation | ✅ Resolved | Two-phase Escape ownership: clear selection first, then close |
| Focus management | ✅ Resolved | Production (focus trap) vs Preview (no trap) behavior separately defined |
| Node keyboard focus | ✅ Resolved | Focusable nodes in both contexts with visible indicators |
| Catalog preview | ✅ Resolved | Focus trap disabled, graph interactivity fully functional |
| Graph states | ✅ Resolved | Five mutually exclusive states: normal, repos-no-components, invalid relations/orphans, truly empty, fallback |
| Fallback behavior | ✅ Clear | Illustrative graph only in Fallback state |
| Bundle strategy | ✅ Resolved | Lazy load at AppShell/overlay slot, measurable validation defined |
| Accessibility | ✅ Clear | ARIA, focus management, screen reader support |

### 15.2 Previously Resolved Ambiguities

1. **Graph layout direction**: **RESOLVED** — Left-to-right (Repository → Component → System), not top-to-bottom.

2. **Edge direction**: **RESOLVED** — All edges flow left to right, representing that System depends on Components, which depend on Repositories.

3. **Node dragging**: **RESOLVED** — Graph nodes are NOT draggable. The canvas is pannable via drag.

4. **Orphan components**: **RESOLVED** — Handled by "Invalid Relations/Orphans" state with warning banner.

5. **Inspector collapsibility**: **RESOLVED** — Inspector is fixed-width (280px) and always visible, showing empty state when no selection.

6. **CTA behavior**: **RESOLVED** — User confirmed: closes System Map, navigates to New Session, commits component as session context.

7. **Catalog preview interactivity**: **RESOLVED** — Only focus trap is disabled; graph selection, controls, inspector, and CTA all work normally.

8. **Escape key ownership**: **RESOLVED** — Two-phase in production (clear selection, then close); immediate delegation in preview.

9. **Direct dependencies definition**: **RESOLVED** — Immediate incoming/outgoing neighbors only, not transitive.

10. **Lazy import boundary**: **RESOLVED** — At AppShell/overlay slot with measurable validation criteria.

11. **Theme CSS literals**: **RESOLVED** — Runtime CSS uses tokens exclusively; hex values only in documentation.

12. **Initial focus separation**: **RESOLVED** — Production (first node or close button) vs Preview (first node, no trap).

### 15.3 No Contradictions Found

The specification is now internally consistent:
- Visual design uses the same token system as the rest of the app
- Interaction patterns match existing modal behavior
- Accessibility requirements align with WCAG AA and existing patterns
- Bundle strategy accounts for the new dependency with measurable validation
- All validator findings have been addressed
- Graph states are mutually exclusive and clearly prioritized
- CTA state and dispatch contract are explicit
- Escape key ownership is clearly defined for both production and preview contexts

---

*End of specification.*
