/*
 * SystemMapGraph — lazy-loaded inner graph component for the interactive
 * System Map modal.
 *
 * Uses @xyflow/react to display Repository → Component → System hierarchy
 * (left to right) with node selection, dependency highlighting, inspector
 * panel, zoom/pan controls, and full theme token support.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow as ReactFlowComponent,
  type Node,
  type Edge,
  Controls,
  Background,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Workaround for TypeScript issue with named export
const ReactFlow = ReactFlowComponent as any
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { mockData } from '../../data/mockData'
import type { System, Repository, ComponentEntry } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface FlowNodeData extends Record<string, unknown> {
  type: 'system' | 'repository' | 'component'
  label: string
  description?: string
  metadata?: Record<string, string>
  // Underlying data IDs for CTA dispatch (node IDs are namespaced)
  componentId?: string
  repoId?: string
  systemId?: string
}

export type FlowNode = Node<FlowNodeData>
export type FlowEdge = Edge

export type GraphState =
  | 'fallback' // Invalid systemId, unresolved system, or graph construction throws
  | 'invalid' // Some repo IDs have no matching Repository record
  | 'truly-empty' // System has empty repoIds array
  | 'repos-no-components' // All repos resolve but zero in-scope components
  | 'normal' // Default state with full graph

// ---------------------------------------------------------------------------
// Node components with React Flow props interface
interface NodeProps {
  data: FlowNodeData
  selected?: boolean
}

function SystemNode({ data, selected }: NodeProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        !(event.nativeEvent as KeyboardEvent).isComposing
      ) {
        event.preventDefault()
        // Trigger click on parent to let ReactFlow handle selection
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
        event.currentTarget.dispatchEvent(clickEvent)
      }
    },
    [],
  )

  return (
    <div
      className={`system-node ${selected ? 'selected' : ''}`}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      onKeyDown={handleKeyDown}
    >
      <span className="system-node__label">{data.label}</span>
      <span className="system-node__badge">System</span>
    </div>
  )
}

function RepositoryNode({ data, selected, isPlaceholder }: { data: FlowNodeData; selected?: boolean; isPlaceholder?: boolean }) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        !(event.nativeEvent as KeyboardEvent).isComposing
      ) {
        event.preventDefault()
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
        event.currentTarget.dispatchEvent(clickEvent)
      }
    },
    [],
  )

  return (
    <div
      className={`repository-node ${selected ? 'selected' : ''} ${isPlaceholder ? 'placeholder' : ''}`}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      onKeyDown={handleKeyDown}
    >
      <span className="repository-node__label">{data.label}</span>
    </div>
  )
}

function ComponentNode({ data, selected }: NodeProps) {
  const isExpanded = (data.isExpanded as boolean) || false
  const handleCTAClick = (data.onCTAClick as (() => void) | undefined)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        !(event.nativeEvent as KeyboardEvent).isComposing
      ) {
        event.preventDefault()
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
        event.currentTarget.dispatchEvent(clickEvent)
      }
    },
    [],
  )

  const handleButtonClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation() // Prevent node selection when clicking button
    handleCTAClick?.()
  }, [handleCTAClick])

  // When expanded, the container is NOT a button (avoids nested-interactive)
  // It remains a tab-able focusable div for keyboard navigation
  const isInteractive = !isExpanded

  return (
    <div
      className={`component-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
      tabIndex={isInteractive ? 0 : -1}
      role={isInteractive ? 'button' : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      aria-expanded={isExpanded}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      {!isExpanded ? (
        <>
          <span className="component-node__label">{data.label}</span>
          <span className="component-node__badge">Component</span>
        </>
      ) : (
        <div className="component-node__expanded-content">
          <div className="component-node__header">
            <span className="component-node__label">{data.label}</span>
            <span className="component-node__badge">Component</span>
          </div>
          {data.description && (
            <p className="component-node__description">{data.description}</p>
          )}
          {data.metadata && Object.keys(data.metadata).length > 0 && (
            <div className="component-node__metadata">
              {Object.entries(data.metadata as Record<string, string>).map(([key, value]) => (
                <div key={key} className="component-node__metadata-row">
                  <span className="component-node__metadata-label">{key}</span>
                  <span className="component-node__metadata-value">{value || '—'}</span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="component-node__cta"
            onClick={handleButtonClick}
          >
            Start Session
          </button>
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  system: SystemNode,
  repository: RepositoryNode,
  component: ComponentNode,
}

// ---------------------------------------------------------------------------
// Graph data builder with deterministic manual coordinates
// ---------------------------------------------------------------------------

export const NODE_HEIGHT = 60
export const ROW_HEIGHT = 80

export function buildGraphData(
  system: System | null,
  repositories: Repository[],
  components: ComponentEntry[],
): { nodes: FlowNode[]; edges: FlowEdge[]; state: GraphState; hasMissingRepos: boolean } {
  // Fallback state: invalid systemId or unresolved system
  if (!system) {
    return { nodes: [], edges: [], state: 'fallback', hasMissingRepos: false }
  }

  // Truly empty state: empty repoIds array
  if (system.repoIds.length === 0) {
    return { nodes: [], edges: [], state: 'truly-empty', hasMissingRepos: false }
  }

  // Filter repositories to only those in the system's repoIds
  const inScopeRepos = repositories.filter((repo) => system.repoIds.includes(repo.id))
  const hasMissingRepos = inScopeRepos.length < system.repoIds.length

  // Filter components to only those whose repoId is in the system's repoIds
  const inScopeComponents = components.filter((comp) => system.repoIds.includes(comp.repoId))

  // Repos-no-components state
  // If hasMissingRepos, classify as 'invalid' instead (AC 34 priority)
  if (inScopeComponents.length === 0) {
    const state = hasMissingRepos ? 'invalid' : 'repos-no-components'

    // Create placeholder nodes for missing repos
    const missingRepoIds = system.repoIds.filter(
      (id) => !inScopeRepos.some((r) => r.id === id),
    )

    const repoNodes = inScopeRepos.map((repo, index) => ({
      id: `repo-${repo.id}`,
      type: 'repository' as const,
      position: { x: 50, y: index * ROW_HEIGHT },
      data: {
        type: 'repository' as const,
        label: repo.name,
        description: `Repository in ${system.name}`,
        metadata: {
          VCS: repo.vcs,
          'Last updated': repo.updatedAt,
        },
        repoId: repo.id,
        systemId: system.id,
      },
    }))

    const placeholderNodes = missingRepoIds.map((repoId, index) => ({
      id: `repo-placeholder-${repoId}`,
      type: 'repository' as const,
      position: { x: 50, y: (inScopeRepos.length + index) * ROW_HEIGHT },
      data: {
        type: 'repository' as const,
        label: `[Missing: ${repoId}]`,
        description: 'Repository not found',
        metadata: {},
        repoId,
        systemId: system.id,
      },
    }))

    const allRepoNodes = [...repoNodes, ...placeholderNodes]

    const nodes: FlowNode[] = [
      {
        id: `system-${system.id}`,
        type: 'system',
        position: { x: 500, y: (allRepoNodes.length * ROW_HEIGHT) / 2 - NODE_HEIGHT / 2 },
        data: {
          type: 'system',
          label: system.name,
          description: system.description,
          metadata: { systemId: system.id },
          systemId: system.id,
        },
      },
      ...allRepoNodes,
    ]

    const edges: FlowEdge[] = allRepoNodes.map((repo) => ({
      id: `edge-${repo.data.repoId as string}-to-${system.id}`,
      source: repo.id,
      target: `system-${system.id}`,
      animated: false,
      style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 },
    }))

    return { nodes, edges, state, hasMissingRepos }
  }

  // Normal state: build full graph with manual coordinates
  // Sort for stable ordering (normalized-name+id)
  const sortedRepos = [...inScopeRepos].sort((a, b) =>
    `${a.name.toLowerCase()}-${a.id}`.localeCompare(`${b.name.toLowerCase()}-${b.id}`),
  )
  const sortedComponents = [...inScopeComponents].sort((a, b) =>
    `${a.name.toLowerCase()}-${a.id}`.localeCompare(`${b.name.toLowerCase()}-${b.id}`),
  )

  // Create placeholder nodes for missing repos
  const missingRepoIds = system.repoIds.filter(
    (id) => !inScopeRepos.some((r) => r.id === id),
  )

  const repoNodes = sortedRepos.map((repo, index) => ({
    id: `repo-${repo.id}`,
    type: 'repository' as const,
    position: { x: 50, y: index * ROW_HEIGHT },
    data: {
      type: 'repository' as const,
      label: repo.name,
      description: `Repository in ${system.name}`,
      metadata: {
        VCS: repo.vcs,
        'Last updated': repo.updatedAt,
      },
      repoId: repo.id,
      systemId: system.id,
    },
  }))

  const placeholderNodes = missingRepoIds.map((repoId, index) => ({
    id: `repo-placeholder-${repoId}`,
    type: 'repository' as const,
    position: { x: 50, y: (sortedRepos.length + index) * ROW_HEIGHT },
    data: {
      type: 'repository' as const,
      label: `[Missing: ${repoId}]`,
      description: 'Repository not found',
      metadata: {},
      repoId,
      systemId: system.id,
    },
  }))

  const allRepoNodes = [...repoNodes, ...placeholderNodes]

  const nodes: FlowNode[] = [
    // System node (right column)
    {
      id: `system-${system.id}`,
      type: 'system',
      position: { x: 500, y: (Math.max(allRepoNodes.length, sortedComponents.length) * ROW_HEIGHT) / 2 - NODE_HEIGHT / 2 },
      data: {
        type: 'system',
        label: system.name,
        description: system.description,
        metadata: { systemId: system.id },
        systemId: system.id,
      },
    },
    // Repository nodes (left column)
    ...allRepoNodes,
    // Component nodes (middle column)
    ...sortedComponents.map((comp, index) => ({
      id: `comp-${comp.id}`,
      type: 'component' as const,
      position: { x: 280, y: index * ROW_HEIGHT },
      data: {
        type: 'component' as const,
        label: comp.name,
        description: `Component in ${comp.repoId}`,
        metadata: {
          'Repository ID': comp.repoId,
        },
        componentId: comp.id,
        repoId: comp.repoId,
        systemId: system.id,
      },
    })),
  ]

  // Edges: Repository → Component, Component → System
  // Placeholder repos also connect to their components (if any)
  const edges: FlowEdge[] = [
    ...sortedComponents.flatMap((comp) => {
      const repoNode = allRepoNodes.find(
        (r) => r.data.repoId === comp.repoId,
      )
      const repoEdge: FlowEdge[] = [
        {
          id: `edge-${comp.repoId}-to-${comp.id}`,
          source: repoNode ? repoNode.id : `repo-placeholder-${comp.repoId}`,
          target: `comp-${comp.id}`,
          animated: false,
          style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 },
        },
      ]
      // Add edge to system only if repo exists (not a placeholder)
      if (inScopeRepos.some((r) => r.id === comp.repoId)) {
        repoEdge.push({
          id: `edge-${comp.id}-to-${system.id}`,
          source: `comp-${comp.id}`,
          target: `system-${system.id}`,
          animated: false,
          style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 },
        })
      }
      return repoEdge
    }),
  ]

  return {
    nodes,
    edges,
    state: hasMissingRepos ? 'invalid' : 'normal',
    hasMissingRepos,
  }
}

// Fallback graph (8 nodes / 9 edges) for invalid systemId
function buildFallbackGraph(systemName: string = 'Unknown System'): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [
    {
      id: 'client',
      type: 'repository',
      position: { x: 50, y: 90 },
      data: {
        type: 'repository',
        label: 'Web client',
        metadata: {},
      },
    },
    {
      id: 'mobile',
      type: 'repository',
      position: { x: 50, y: 226 },
      data: {
        type: 'repository',
        label: 'Mobile app',
        metadata: {},
      },
    },
    {
      id: 'api',
      type: 'component',
      position: { x: 280, y: 24 },
      data: {
        type: 'component',
        label: `${systemName} API`,
        metadata: {},
      },
    },
    {
      id: 'auth',
      type: 'component',
      position: { x: 280, y: 112 },
      data: {
        type: 'component',
        label: 'Auth service',
        metadata: {},
      },
    },
    {
      id: 'worker',
      type: 'component',
      position: { x: 280, y: 200 },
      data: {
        type: 'component',
        label: 'Worker queue',
        metadata: {},
      },
    },
    {
      id: 'dashboard',
      type: 'component',
      position: { x: 280, y: 288 },
      data: {
        type: 'component',
        label: 'Dashboard',
        metadata: {},
      },
    },
    {
      id: 'db',
      type: 'system',
      position: { x: 500, y: 68 },
      data: {
        type: 'system',
        label: 'Postgres',
        metadata: {},
      },
    },
    {
      id: 'cache',
      type: 'system',
      position: { x: 500, y: 200 },
      data: {
        type: 'system',
        label: 'Redis cache',
        metadata: {},
      },
    },
  ]

  const edges: FlowEdge[] = [
    { id: 'e1', source: 'client', target: 'api', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e2', source: 'client', target: 'auth', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e3', source: 'mobile', target: 'api', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e4', source: 'mobile', target: 'worker', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e5', source: 'api', target: 'db', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e6', source: 'auth', target: 'db', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e7', source: 'worker', target: 'cache', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e8', source: 'worker', target: 'db', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
    { id: 'e9', source: 'dashboard', target: 'cache', style: { stroke: 'var(--kx-border)', strokeWidth: 1.5 } },
  ]

  return { nodes, edges }
}

// ---------------------------------------------------------------------------
// Collision avoidance helper (exported for testing)
// ---------------------------------------------------------------------------

/** Constants for node dimensions and collision detection */
export const COMPACT_NODE_WIDTH = 160
export const COMPACT_NODE_HEIGHT = 60
export const EXPANDED_WIDTH = 240
export const EXPANDED_BASE_HEIGHT = 180
export const EXPANDED_SCALE = 1.05 // CSS transform scale for expanded nodes
export const EXPANDED_MARGIN = 20 // Extra margin for visibility

/** Calculate the actual height of an expanded node's content based on metadata rows.
 * Each metadata row adds approximately 28px (6px gap + 22px row height).
 */
function calculateExpandedContentHeight(metadata: Record<string, string> | undefined): number {
  if (!metadata || Object.keys(metadata).length === 0) {
    return EXPANDED_BASE_HEIGHT
  }
  const metadataRows = Object.keys(metadata).length
  // Base 180px + 28px per metadata row (6px gap + 22px row)
  return EXPANDED_BASE_HEIGHT + (metadataRows * 28)
}

/** Get the bounding box for a node, accounting for expanded state and CSS scale.
 * This is a pure function exported for testing.
 */
export function getNodeBoundingBox(
  node: FlowNode,
): { left: number; right: number; top: number; bottom: number } {
  const isExpanded = (node.data.isExpanded as boolean) || false
  
  let width = COMPACT_NODE_WIDTH
  let height = COMPACT_NODE_HEIGHT
  
  if (node.data.type === 'component' && isExpanded) {
    const contentHeight = calculateExpandedContentHeight(node.data.metadata as Record<string, string> | undefined)
    // Apply CSS scale (1.05) to get actual rendered dimensions
    width = EXPANDED_WIDTH * EXPANDED_SCALE
    height = contentHeight * EXPANDED_SCALE
  }
  
  return {
    left: node.position.x,
    right: node.position.x + width,
    top: node.position.y,
    bottom: node.position.y + height,
  }
}

/** Check if two bounding boxes overlap (including margin).
 * Pure function exported for testing.
 * Boxes that are exactly margin-separated do NOT overlap.
 */
export function boxesOverlap(
  box1: { left: number; right: number; top: number; bottom: number },
  box2: { left: number; right: number; top: number; bottom: number },
): boolean {
  // Two boxes overlap if they are NOT separated in any direction
  // Separated means: box1 is completely to the left, right, above, or below box2 (with margin)
  const separatedHorizontally =
    box1.right + EXPANDED_MARGIN <= box2.left ||
    box2.right + EXPANDED_MARGIN <= box1.left

  const separatedVertically =
    box1.bottom + EXPANDED_MARGIN <= box2.top ||
    box2.bottom + EXPANDED_MARGIN <= box1.top

  return !separatedHorizontally && !separatedVertically
}

/** Calculate non-overlapping position for an expanded component node.
 * Uses a deterministic bounded search: tries candidate positions (valid row positions above/below)
 * and verifies each candidate against EVERY other node at the final position.
 * Returns a position that guarantees no overlap with any other node.
 * Pure function exported for testing.
 */
export function calculateExpandedPosition(
  expandedNode: FlowNode,
  allNodes: FlowNode[],
  _allEdges: FlowEdge[], // eslint-disable-line @typescript-eslint/no-unused-vars
): { x: number; y: number } {
  const basePosition = expandedNode.position
  const contentHeight = calculateExpandedContentHeight(expandedNode.data.metadata as Record<string, string> | undefined)
  const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
  const expandedHeight = contentHeight * EXPANDED_SCALE
  
  // Helper: check if a candidate position overlaps with any node
  const hasOverlapAtPosition = (candidateY: number): boolean => {
    const candidateBox = {
      left: basePosition.x,
      right: basePosition.x + expandedWidth,
      top: candidateY,
      bottom: candidateY + expandedHeight,
    }
    
    return allNodes.some(node => {
      if (node.id === expandedNode.id) return false
      const nodeBox = getNodeBoundingBox(node)
      return boxesOverlap(candidateBox, nodeBox)
    })
  }
  
  // Check if base position is valid (no overlap)
  if (!hasOverlapAtPosition(basePosition.y)) {
    return basePosition
  }
  
  // Bounded deterministic candidate search
  // Try positions in expanding distance from base, alternating up and down
  // Search bound: try up to 50 row positions (4000px) in each direction
  // If graph needs more vertical area, canvas/fit-view will handle it
  const MAX_SEARCH_DISTANCE = 50 * ROW_HEIGHT // 4000px in each direction
  
  for (let distance = ROW_HEIGHT; distance <= MAX_SEARCH_DISTANCE; distance += ROW_HEIGHT) {
    // Try upward first (prefer to keep node higher if possible)
    const upCandidateY = basePosition.y - distance
    if (upCandidateY >= 0 && !hasOverlapAtPosition(upCandidateY)) {
      return { x: basePosition.x, y: upCandidateY }
    }
    
    // Then try downward
    const downCandidateY = basePosition.y + distance
    if (!hasOverlapAtPosition(downCandidateY)) {
      return { x: basePosition.x, y: downCandidateY }
    }
  }
  
  // Fallback: when bounded search is exhausted, derive a deterministic position
  // beyond the maximum bottom of ALL relevant node bounding boxes plus production margin.
  // Verify with the same all-node overlap predicate; advance further deterministically if needed.
  // This guarantees we never return an overlapping position.
  
  // Calculate the maximum bottom of ALL node bounding boxes
  let maxBottom = 0
  for (const node of allNodes) {
    if (node.id === expandedNode.id) continue
    const nodeBox = getNodeBoundingBox(node)
    if (nodeBox.bottom > maxBottom) {
      maxBottom = nodeBox.bottom
    }
  }
  
  // Start candidate search beyond the maximum bottom, with production margin
  // Use ROW_HEIGHT increments for deterministic behavior
  let fallbackCandidateY = maxBottom + EXPANDED_MARGIN
  
  // Align to ROW_HEIGHT grid for deterministic positioning
  const gridAlignedStart = Math.ceil(fallbackCandidateY / ROW_HEIGHT) * ROW_HEIGHT
  fallbackCandidateY = Math.max(gridAlignedStart, 0)
  
  // Advance deterministically until we find a non-overlapping position
  // This loop will always terminate because we're searching beyond all existing nodes
  while (hasOverlapAtPosition(fallbackCandidateY)) {
    fallbackCandidateY += ROW_HEIGHT
  }
  
  return { x: basePosition.x, y: fallbackCandidateY }
}

// ---------------------------------------------------------------------------
// Main SystemMapGraph component
// ---------------------------------------------------------------------------

export default function SystemMapGraph() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const { fitView } = useReactFlow()
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)

  // Resolve system
  const systemId = state.overlay.kind === 'system-map' ? state.overlay.systemId : null
  const system = state.systems.find((s) => s.id === systemId) ?? null

  // Build graph data
  const { nodes, edges, state: graphState, hasMissingRepos } = useMemo(
    () => buildGraphData(system, mockData.repositories, mockData.components),
    [system],
  )

  // Fallback nodes/edges when in fallback state
  const displayNodes = graphState === 'fallback' ? buildFallbackGraph(system?.name).nodes : nodes
  const displayEdges = graphState === 'fallback' ? buildFallbackGraph(system?.name).edges : edges

  // Initial fitView on graph load
  useEffect(() => {
    fitView({ duration: 0 })
  }, [fitView, displayNodes])

  // Event handlers
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      // Clicking already-selected component node toggles expansion
      if (selectedNode?.id === node.id) {
        // Keep selection, expansion is handled by re-render
        setSelectedNode(node)
      } else {
        setSelectedNode(node)
      }
    },
    [selectedNode],
  )

  const handlePaneClick = useCallback(() => {
    // Clicking empty canvas clears selection
    setSelectedNode(null)
  }, [])

  const handleCTAClick = useCallback(() => {
    if (!selectedNode || selectedNode.data.type !== 'component') return

    // Use exact reducer shapes from mockupReducer.ts (flat, no payload wrapper)
    dispatch({ type: 'CLEAR_COMPONENTS' })
    dispatch({ type: 'TOGGLE_COMPONENT', componentId: selectedNode.data.componentId as string })
    dispatch({
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: system?.id || (selectedNode.data.systemId as string),
      repoIds: [selectedNode.data.repoId as string],
    })
    dismissOverlay()
  }, [selectedNode, system, dispatch, dismissOverlay])

  // Dependency highlighting: selected node + one-hop incident edge neighbors (direction ignored)
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const highlighted = new Set<string>([selectedNode.id])
    displayEdges.forEach((edge) => {
      if (edge.source === selectedNode.id) highlighted.add(edge.target)
      if (edge.target === selectedNode.id) highlighted.add(edge.source)
    })
    return highlighted
  }, [selectedNode, displayEdges])

  const highlightedEdges = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const highlighted = new Set<string>()
    displayEdges.forEach((edge) => {
      if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
        highlighted.add(edge.id)
      }
    })
    return highlighted
  }, [selectedNode, displayEdges])

  // Apply styling based on highlighting and expansion state
  const styledNodes = displayNodes.map((node) => {
    const isHighlighted = highlightedNodes.has(node.id)
    const isExpanded = selectedNode?.id === node.id && node.data.type === 'component'
    
    // Collision avoidance: shift expanded node position if needed
    let position = { ...node.position }
    if (isExpanded && node.data.type === 'component') {
      position = calculateExpandedPosition(node, displayNodes, displayEdges)
    }
    
    return {
      ...node,
      position,
      className: isHighlighted ? 'highlighted' : '',
      data: {
        ...node.data,
        isExpanded,
        onCTAClick: isExpanded ? handleCTAClick : undefined,
      },
    }
  })

  const styledEdges = displayEdges.map((edge) => ({
    ...edge,
    className: highlightedEdges.has(edge.id) ? 'highlighted' : '',
    style: highlightedEdges.has(edge.id)
      ? { stroke: 'var(--kx-accent-strong)', strokeWidth: 2 }
      : highlightedNodes.size > 0
        ? { stroke: 'var(--kx-border)', strokeWidth: 1, opacity: 0.3 }
        : { stroke: 'var(--kx-border)', strokeWidth: 1.5, opacity: 1 },
  }))

  // Banner message based on graph state
  const banner = useMemo(() => {
    if (graphState === 'fallback') {
      return { type: 'warning', message: 'Illustrative graph — unable to load real data' }
    }
    if (graphState === 'invalid' && hasMissingRepos) {
      return { type: 'warning', message: 'Some repositories are missing' }
    }
    if (graphState === 'truly-empty') {
      return { type: 'info', message: `No repositories or components found for ${system?.name || 'this system'}` }
    }
    if (graphState === 'repos-no-components') {
      return { type: 'info', message: 'No components — repositories exist but components are missing' }
    }
    return null
  }, [graphState, hasMissingRepos, system])

  // Render
  if (graphState === 'truly-empty') {
    return (
      <div className="kx-system-map__empty">
        <p className="kx-system-map__empty-message">
          {banner?.message || 'No repositories or components found'}
        </p>
      </div>
    )
  }

  // Modal-wide Escape handler (not just content area)
  const handleModalKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && selectedNode && !(event.nativeEvent as KeyboardEvent).isComposing) {
        setSelectedNode(null)
        event.preventDefault() // Prevent OverlayLifecycle from closing
        // NOTE: Do NOT call stopPropagation() — source may not support it
      }
    },
    [selectedNode],
  )

  // Determine if there's an active selection for dimming purposes
  const hasSelection = selectedNode !== null

  return (
    <div className="kx-system-map__content" onKeyDown={handleModalKeyDown}>
      {/* Banner */}
      {banner && (
        <div className={`kx-system-map__banner kx-system-map__banner--${banner.type}`}>
          {banner.message}
        </div>
      )}

      {/* Full-width graph container */}
      <div className={`kx-system-map__graph-container ${hasSelection ? 'has-selection' : ''}`}>
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          style={{ width: '100%', height: '100%' }}
        >
          <Background color="var(--kx-border)" gap={16} />
          <Controls
            showZoom={true}
            showFitView={true}
            showInteractive={false}
            className="kx-system-map__controls"
          />
        </ReactFlow>
        <button
          type="button"
          className="kx-system-map__reset-btn"
          onClick={() => setSelectedNode(null)}
          aria-label="Reset selection"
          disabled={!selectedNode}
        >
          Reset selection
        </button>
      </div>
    </div>
  )
}
