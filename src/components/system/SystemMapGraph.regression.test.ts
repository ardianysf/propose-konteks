/**
 * Regression test for the collision bug fix
 * Counterexample: selected component {x:280,y:0}, component {x:280,y:80}, compact node {x:280,y:220}
 * The expanded bounds must not overlap either node using the production conservative geometry/margin.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateExpandedPosition,
  getNodeBoundingBox,
  boxesOverlap,
  EXPANDED_WIDTH,
  EXPANDED_BASE_HEIGHT,
  EXPANDED_SCALE,
  buildGraphData,
  type FlowNode,
} from './SystemMapGraph'
import { mockData } from '../../data/mockData'

function createTestNode(
  id: string,
  type: 'system' | 'repository' | 'component',
  x: number,
  y: number,
  isExpanded: boolean = false,
  metadata?: Record<string, string>,
): FlowNode {
  return {
    id,
    type,
    position: { x, y },
    data: {
      type,
      label: `${type}-${id}`,
      description: `Test ${type}`,
      metadata,
      isExpanded,
    },
  }
}

// ---------------------------------------------------------------------------
// ConnectionMode edge rendering regression test
// ---------------------------------------------------------------------------

describe('SystemMapGraph — ConnectionMode edge rendering regression', () => {
  it('builds edges without explicit handle IDs, requiring ConnectionMode.Loose', () => {
    // This test verifies the edge structure that necessitates ConnectionMode.Loose
    // In @xyflow/react v12, edges without explicit sourceHandle/targetHandle IDs
    // require ConnectionMode.Loose to render properly

    const system = mockData.systems[0] // BSI - HRIS
    const { nodes, edges } = buildGraphData(
      system,
      mockData.repositories,
      mockData.components,
      mockData.containers,
    )

    // Verify edges exist and have the expected structure
    expect(edges.length).toBeGreaterThan(0)

    // Verify edges connect nodes (source and target are node IDs)
    // but do NOT have explicit handle IDs
    for (const edge of edges) {
      // Edge must have valid source and target node IDs
      expect(edge.source).toBeTruthy()
      expect(edge.target).toBeTruthy()

      // Verify source is a valid node ID
      const sourceNode = nodes.find(n => n.id === edge.source)
      expect(sourceNode).toBeDefined()

      // Verify target is a valid node ID
      const targetNode = nodes.find(n => n.id === edge.target)
      expect(targetNode).toBeDefined()

      // CRITICAL: Edges do NOT have explicit handle IDs
      // This is why ConnectionMode.Loose is required
      expect(edge.sourceHandle).toBeUndefined()
      expect(edge.targetHandle).toBeUndefined()
    }

    // Verify the C4 edge chain: repo → component → container → system
    const typeOf = (id: string) => nodes.find(n => n.id === id)?.data.type

    const repoToCompEdges = edges.filter(e =>
      typeOf(e.source) === 'repository' && typeOf(e.target) === 'component')
    expect(repoToCompEdges.length).toBeGreaterThan(0)

    const compToContEdges = edges.filter(e =>
      typeOf(e.source) === 'component' && typeOf(e.target) === 'container')
    expect(compToContEdges.length).toBeGreaterThan(0)

    const contToSysEdges = edges.filter(e =>
      typeOf(e.source) === 'container' && typeOf(e.target) === 'system')
    expect(contToSysEdges.length).toBeGreaterThan(0)
  })

  it('fallback graph also builds edges without handle IDs', () => {
    // Test the fallback graph scenario (invalid systemId)
    const { edges, state } = buildGraphData(
      null, // null system triggers fallback
      mockData.repositories,
      mockData.components,
      mockData.containers,
    )

    // Fallback state should have no edges (handled by component fallback rendering)
    expect(state).toBe('fallback')
    expect(edges.length).toBe(0)
  })
})

describe('SystemMapGraph — collision regression bug fix', () => {
  it('counterexample: {x:280,y:0} expands without overlapping {x:280,y:80} OR {x:280,y:220}', () => {
    // The validator counterexample
    const expandedNode = createTestNode('comp1', 'component', 280, 0, true)
    const otherNodes = [
      createTestNode('comp2', 'component', 280, 80, false),  // Directly below
      createTestNode('comp3', 'component', 280, 220, false), // Further below
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Use actual conservative expanded bounds from CSS
    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE // 240 * 1.05 = 252
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE // 180 * 1.05 = 189

    const resultBox = {
      left: result.x,
      right: result.x + expandedWidth,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    const box2 = getNodeBoundingBox(otherNodes[0])
    const box3 = getNodeBoundingBox(otherNodes[1])

    // The fix must ensure NO overlap with either node
    expect(boxesOverlap(resultBox, box2), 'Result must not overlap node at y=80').toBe(false)
    expect(boxesOverlap(resultBox, box3), 'Result must not overlap node at y=220').toBe(false)
  })

  it('expanded node position is verified against ALL nodes at final position', () => {
    // Multiple nodes at different positions
    const expandedNode = createTestNode('comp1', 'component', 280, 0, true)
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 80, false),
      createTestNode('comp2', 'component', 280, 160, false),
      createTestNode('comp3', 'component', 280, 240, false),
      createTestNode('comp4', 'component', 280, 320, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE

    const resultBox = {
      left: result.x,
      right: result.x + expandedWidth,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    // Verify NO overlap with ANY node
    for (const node of otherNodes) {
      const nodeBox = getNodeBoundingBox(node)
      expect(
        boxesOverlap(resultBox, nodeBox),
        `Result must not overlap node ${node.id} at y=${node.position.y}`
      ).toBe(false)
    }
  })
})
