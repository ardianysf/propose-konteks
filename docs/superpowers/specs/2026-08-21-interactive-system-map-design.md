# Interactive System Map — Design Specification

- **Date:** 2026-08-21
- **Artifact type:** Source-of-truth design
- **Status:** Approved contract for implementation

---

## Objective

Replace static SVG system map with interactive graph visualization displaying Repository → Component → System hierarchy, featuring full-width canvas, in-place component expansion, dependency emphasis, and existing canvas controls.

---

## Scope

### In Scope
- Graph canvas occupying full width with no persistent inspector, sidebar, or detail box
- Dotted grid background visible on canvas
- All Repository → Component and Component → System edges visibly rendered at initial load
- Compact nodes that expand in place on selection
- Component expansion revealing description and relationship metadata
- Exactly one component action with literal label "Start Session"
- Selected component and its adjacent nodes/edges emphasized while all other nodes and relationships remain visible at reduced opacity
- Existing start-session result flow retained
- Existing canvas controls (zoom, pan, fit) retained
- Collision avoidance ensuring expanded node does not overlap other nodes

### Non-Goals
- Real-time graph updates
- Drag-and-drop node repositioning
- Edge creation/deletion
- Graph persistence or export
- Multi-selection of nodes
- Mini-map or overview panel
- Graph search or filtering
- Persistent inspector panel
- Separate detail card or popup

---

## Acceptance Criteria

1. **Full-width canvas:** Graph canvas occupies full width with no persistent inspector panel, sidebar, or separate detail box visible.

2. **Initial rendering:** Dotted grid background is visible, and all Repository → Component and Component → System edges are visibly rendered when the graph loads.

3. **Node expansion:** Clicking a component expands that same node in place (not a separate box), revealing its available description and relationship metadata.

4. **Component action:** Expanded component includes exactly one action button with the literal label "Start Session".

5. **Visual emphasis:** When a component is selected, it and its adjacent nodes and edges are visually emphasized while every other node and relationship remains visible at reduced opacity.

6. **Collision avoidance:** Expanded component node does not overlap any other nodes in the graph.

7. **Start session flow:** Clicking "Start Session" produces the existing start-session result and the modal dismisses.

8. **Canvas controls:** Existing zoom, pan, and fit controls are functional and retain their current behavior.

9. **Accessibility:** Standard accessibility behaviors (keyboard navigation, screen reader support, focus management) must not regress.

10. **Regression:** Existing functionality and visual styling outside the specified changes must not regress.

---

## Interaction Summary

1. User opens the system map modal.
2. Graph renders with dotted grid, all nodes and edges visible, compact node states.
3. User clicks a component node → node expands in place showing description and relationship metadata with "Start Session" button.
4. Selected component and its adjacent nodes/edges are emphasized; other nodes/edges remain visible at reduced opacity.
5. User clicks "Start Session" → start-session flow executes and modal closes.
6. User clicks empty canvas or Escape → selection clears, expanded node collapses.
7. User uses zoom/pan/fit controls → canvas responds as before.

---

## Validation Plan

| Test | Expected Outcome | Evidence Method |
|------|------------------|-----------------|
| Canvas width | Full-width canvas, no inspector/sidebar/detail box | Visual inspection |
| Initial load | Dotted grid visible, all edges rendered | Visual inspection |
| Component expansion | Clicking component expands same node in place | Visual inspection |
| Expanded content | Description, relationship metadata, "Start Session" button visible | Visual inspection |
| Visual emphasis | Selected component and neighbors emphasized, others reduced opacity | Visual inspection |
| Collision avoidance | Expanded node does not overlap other nodes | Visual inspection across all components |
| Start session | Clicking "Start Session" executes flow and dismisses modal | Functional test |
| Canvas controls | Zoom, pan, fit controls functional | Functional test |
| Accessibility | Keyboard navigation, screen reader, focus management work | Accessibility audit |
| Regression | Existing functionality unchanged | Regression test suite |

---

*End of specification.*
