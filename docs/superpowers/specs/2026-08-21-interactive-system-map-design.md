# Interactive System Map — Design Specification

- **Date:** 2026-08-21
- **Artifact type:** Approved design specification for implementation
- **Status:** Approved requirement contract
- **Source:** Screenshot reference (Screenshot 2026-08-21 at 21.42.55.png) and approved design decisions

---

## 1. Objective

Replace the current static SVG SystemMapModal with an interactive, lazy-loaded graph visualization powered by `@xyflow/react` (React Flow). The new interactive system map will display the relationship hierarchy **Repository → Component → System**, enable node selection, highlight direct dependencies, expose component actions via a right-side inspector, and provide zoom/pan controls while maintaining production focus containment, catalog preview compatibility, and full theme token support for both light and dark modes.

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
- Three-tier graph hierarchy: **System (top/center) → Repository (middle layer) → Component (bottom layer)**
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
  type: 'system-to-repo' | 'repo-to-component'
}
```

### 4.3 Graph Construction Rules

- **Root node**: System node (the active system from context)
- **Middle layer**: All Repository nodes belonging to the system (via `system.repoIds`)
- **Bottom layer**: All Component nodes belonging to each repository (via `component.repoId`)
- **Edges**: System → Repository (one per repo), Repository → Component (one per component)
- **Positioning**: Hierarchical layout with System at top-center, Repository nodes in a middle row, Component nodes in a bottom row

### 4.4 Fallback Graph Data

When relation data is incomplete (e.g., `repoIds` is empty, or components have invalid `repoId` references), render a deterministic illustrative graph similar to the current SVG implementation:

- 1 System node
- 2-3 Repository nodes
- 2-3 Component nodes per repository
- Edges following the same hierarchy

Label the graph with a visible indicator: "Illustrative graph — relation data incomplete"

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
- **Background**: Uses `--kx-raised` (white in light, `#1a231b` in dark)
- **Grid**: Optional subtle grid pattern using `--kx-border` at low opacity
- **Padding**: 16px around the graph content

### 5.3 Node Styling

| Node Type | Fill | Stroke | Stroke Width | Corner Radius |
|-----------|------|--------|--------------|---------------|
| System | `--kx-accent` (`#8FBF6A`) | `--kx-accent-strong` (`#5F8D4E`) | 2px | 12px |
| Repository | `--kx-pale` (`#F4F8EE`) | `--kx-border` (`#E2E9D5`) | 1.5px | 10px |
| Component | `--kx-raised` (`#FFF`) | `--kx-border` (`#E2E9D5`) | 1.5px | 8px |

**Selected state** (any type):
- Fill: `--kx-accent`
- Stroke: `--kx-accent-strong`
- Stroke width: 2.5px
- Drop shadow: `0 0 0 3px rgb(var(--kx-accent-rgb) / 0.2)`

**Hover state** (unselected nodes):
- Stroke: `--kx-accent-strong`
- Cursor: pointer

### 5.4 Edge Styling

| Edge Type | Stroke | Stroke Width | Stroke Style |
|-----------|--------|--------------|--------------|
| Default (unselected) | `--kx-border` | 1.5px | solid |
| Highlighted (selected node's dependencies) | `--kx-accent-strong` | 2px | solid |
| Dimmed (not related to selection) | `--kx-border` | 1px | opacity 0.3 |

Edges should have rounded corners (React Flow `smoothstep` or `bezier` curve type).

### 5.5 Typography in Nodes

- **Font family**: `--kx-font-family` (DM Sans)
- **Size**: `--kx-text-md` (12px)
- **Weight**: `--kx-font-medium` (500)
- **Color**: 
  - System nodes: white text (contrast on accent fill)
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
- Background: `--kx-accent-solid-aa` (`#4f7044`)
- Text: white
- Padding: 10px 16px
- Border radius: 8px
- Font: `--kx-text-sm`, `--kx-font-medium`
- Hover: background `--kx-accent-strong` (`#5F8D4E`)

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
   - For Component nodes: CTA button appears
3. **User clicks another node**:
   - Previous selection clears
   - New node selected
   - Inspector updates
4. **User clicks canvas background**:
   - Selection clears
   - All nodes/edges return to normal opacity
   - Inspector shows empty state

### 6.2 Keyboard Navigation

- **Tab**: Move focus to next tabbable element (nodes, zoom controls, close button, CTA)
- **Shift+Tab**: Move focus backward
- **Enter/Space**: Activate focused node (select it)
- **Escape**: Clear selection (if selected) or close modal (if no selection)
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

- Preserve existing `useFocusContainment` behavior
- Respect `CatalogPreviewContext` (skip containment in catalog preview)
- Initial focus: First node in the graph (or close button if graph is empty)
- Focus trap: All focus stays within modal (except in catalog preview)
- Focus restoration: On modal close, return focus to trigger element

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

Uses tokens from `:root` in `src/styles/tokens.css`:

- Canvas: `--kx-canvas` (`#FAF8EF`)
- Modal background: `--kx-raised` (`#FFF`)
- Graph background: `--kx-raised` (`#FFF`)
- Borders: `--kx-border` (`#E2E9D5`)
- Text primary: `--kx-primary` (`#243025`)
- Text secondary: `--kx-secondary` (`#58735A`)
- Accent: `--kx-accent` (`#8FBF6A`)
- Accent strong: `--kx-accent-strong` (`#5F8D4E`)

### 8.2 Dark Theme

Uses tokens from `[data-theme='dark']`:

- Canvas: `--kx-canvas` (`#0F1510`)
- Modal background: `--kx-raised` (`#1A231B`)
- Graph background: `--kx-raised` (`#1A231B`)
- Borders: `--kx-border` (`#35502C`)
- Text primary: `--kx-primary` (`#E8EDE8`)
- Text secondary: `--kx-secondary` (`#C5CFC6`)
- Accent: `--kx-accent` (`#8FBF6A`) — unchanged
- Accent strong: `--kx-accent-strong` (`#5F8D4E`) — unchanged

### 8.3 Theme Switching

- React Flow must re-render when theme changes
- Use CSS custom properties (variables) for all colors
- No hardcoded hex values in React Flow node/edge styles
- Listen for theme changes and update React Flow instance if needed

## 9. Acceptance Criteria

### 9.1 Core Functionality

1. Opening the system map modal (from SystemMenu "Map" action) displays an interactive graph using `@xyflow/react`.
2. The graph renders the three-tier hierarchy: System node at top, Repository nodes in middle, Component nodes at bottom.
3. Edges correctly connect System → Repository and Repository → Component based on data relationships.
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

21. In light theme, the graph uses light colors: white/canvas backgrounds, dark text, matcha accents.
22. In dark theme, the graph uses dark colors: dark backgrounds, light text, matcha accents (unchanged).
23. Switching themes updates the graph colors immediately without page reload.
24. All text in nodes, edges (if labeled), and the inspector meets WCAG AA contrast in both themes.

### 9.4 Catalog Preview Compatibility

25. When rendered in the catalog preview (`CatalogPreviewContext`), focus containment is disabled.
26. The graph renders correctly in the catalog preview frame with the static overlay class.
27. Catalog navigation (breadcrumb, backlink) remains functional when the SystemMapModal preview loads.

### 9.5 Fallback Behavior

28. When a system has no `repoIds` or repositories have no matching components, a fallback illustrative graph renders.
29. The fallback graph includes a visible indicator "Illustrative graph — relation data incomplete".
30. The fallback graph is interactive (selectable, zoomable) like the real graph.

### 9.6 Loading and Error States

31. While the graph is loading, a spinner or skeleton is visible in the canvas area.
32. If graph construction fails, an error message displays with a "Retry" button.
33. When a system has no repositories or components, an empty state displays with a helpful message.

### 9.7 Performance and Bundle Size

34. The `@xyflow/react` library is lazy-loaded and does not block initial page load.
35. The gzipped bundle size for the SystemMapModal chunk is approximately 60KB (±10KB acceptable).
36. The graph renders smoothly with no perceptible jank on first selection or zoom.

### 9.8 Data Model Correctness

37. Nodes are created from the active system's repositories (via `system.repoIds`).
38. Components are correctly associated with their parent repositories via `component.repoId`.
39. Edges are created only where valid relationships exist (no orphaned nodes).
40. Node labels display the correct names from the data model.

## 10. Test Plan

### 10.1 Unit Tests (Vitest)

- `buildGraphData(system, repositories, components)`:
  - Returns correct node count (1 system + N repos + M components)
  - Creates correct edges (system→repo, repo→component)
  - Handles empty `repoIds` with fallback
  - Handles invalid `repoId` references gracefully

- `getHighlightedNodesAndEdges(selectedNodeId, nodes, edges)`:
  - Returns direct neighbors (upstream and downstream)
  - Returns edges connecting to neighbors
  - Returns empty arrays when no selection

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

### 11.2 Lazy Loading

The SystemMapModal and its React Flow dependency should be code-split:

```typescript
// In catalog registry or component loader
const SystemMapModal = lazy(() => import('../components/system/SystemMapModal'))
```

This ensures the ~60KB gzip chunk is only loaded when the system map is actually opened.

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

Use React Flow's built-in positioning or a simple hierarchical layout:

```typescript
// Position nodes in three rows
const SYSTEM_ROW_Y = 50
const REPO_ROW_Y = 200
const COMPONENT_ROW_Y = 350

// System: centered horizontally
const systemNode = {
  id: system.id,
  type: 'system',
  position: { x: 320, y: SYSTEM_ROW_Y }, // Center of 640px canvas
  // ...
}

// Repositories: distributed horizontally
const repoNodes = repositories.map((repo, i) => ({
  id: repo.id,
  type: 'repository',
  position: { x: 80 + (i * 200), y: REPO_ROW_Y },
  // ...
}))

// Components: grouped under their repositories
const componentNodes = components.map((comp, i) => {
  const repoIndex = repositories.findIndex(r => r.id === comp.repoId)
  const baseX = 80 + (repoIndex * 200)
  return {
    id: comp.id,
    type: 'component',
    position: { x: baseX + ((i % 3) * 60), y: COMPONENT_ROW_Y + (Math.floor(i / 3) * 60) },
    // ...
}
})
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

Use CSS custom properties in React Flow node styles:

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
  color: white;
}

.kx-flow-node--repo {
  background-color: var(--kx-pale);
}

.kx-flow-node--selected {
  border-color: var(--kx-accent-strong);
  border-width: 2.5px;
  box-shadow: 0 0 0 3px rgb(var(--kx-ink-rgb) / 0.14);
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

Wrap graph initialization in a check for catalog preview context to disable any React Flow features that might interfere:

```typescript
const isCatalogPreview = useIsCatalogPreview()

const onNodeClick = useCallback((event: NodeMouseEvent) => {
  if (isCatalogPreview) return // Disable selection in preview
  // ... normal selection logic
}, [isCatalogPreview])
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

## 14. Open Questions

1. **CTA integration**: What is the exact action for "Start session with {component-name}"? Does it:
   - Navigate to the New Session page with the component pre-selected?
   - Open the New Session modal with the component pre-selected?
   - Trigger a specific session creation API call?
   
   *Recommendation*: Navigate to New Session page (or open modal if that's the primary session creation flow) with component pre-selected, matching existing session creation patterns.

2. **Graph canvas size**: Is the fixed 480px height sufficient for systems with many components? Should it be dynamic based on node count?

   *Recommendation*: Start with fixed 480px with scroll within the canvas if needed. Evaluate post-implementation and adjust if real-world systems overflow.

3. **Component grouping**: Should components be visually grouped under their repositories (e.g., subtle background regions), or is the hierarchical edge connection sufficient?

   *Recommendation*: Edge connections are sufficient for this phase. Visual grouping can be a future enhancement.

4. **Zoom limits**: What are the minimum and maximum zoom levels? React Flow defaults may need adjustment.

   *Recommendation*: Use React Flow defaults (min: 0.1, max: 4) unless testing shows they're inadequate.

5. **Session context**: When clicking the CTA, what additional context is passed to the session? System? Repository? Execution profile?

   *Recommendation*: Pass the full context: system ID, repository ID (from component's repo), and component ID. Let the session flow determine execution profile.

## 15. Self-Review for Ambiguity and Contradictions

### 15.1 Reviewed Areas

| Area | Status | Notes |
|------|--------|-------|
| Graph hierarchy | Clear | System → Repository → Component is well-defined |
| Node selection | Clear | Single selection with dependency highlighting |
| Inspector content | Clear | Details vary by node type, CTA for Components only |
| Zoom/pan controls | Clear | Four buttons: in, out, fit, reset |
| Theme support | Clear | All colors via CSS variables, no hardcoded values |
| Keyboard navigation | Clear | Tab, Enter/Space, Escape documented |
| Focus containment | Clear | Preserve existing `useFocusContainment` behavior |
| Catalog preview | Clear | Respect `CatalogPreviewContext` |
| Fallback behavior | Clear | Illustrative graph when data incomplete |
| Bundle strategy | Clear | Lazy loading, ~60KB gzip target |
| Accessibility | Clear | ARIA, focus management, screen reader support |

### 15.2 Potential Ambiguities Resolved

1. **Ambiguity**: Should the graph be draggable or fixed position?
   - **Resolution**: Graph nodes are NOT draggable (user cannot rearrange layout). The canvas is pannable via drag.

2. **Ambiguity**: What happens when a component's `repoId` doesn't match any repository?
   - **Resolution**: Orphan components render as separate nodes but with a warning icon or visual indicator. They connect to the graph if possible, or float separately.

3. **Ambiguity**: Should the inspector be collapsible?
   - **Resolution**: No, inspector is fixed-width (280px) and always visible. It shows empty state when no selection.

4. **Ambiguity**: How does the CTA interact with existing session flow?
   - **Resolution**: This is documented as an open question (§14.1). The spec recommends navigation to New Session with pre-selection.

### 15.3 No Contradictions Found

The specification is internally consistent:
- Visual design uses the same token system as the rest of the app
- Interaction patterns match existing modal behavior
- Accessibility requirements align with WCAG AA and existing patterns
- Bundle strategy accounts for the new dependency

---

*End of specification.*
