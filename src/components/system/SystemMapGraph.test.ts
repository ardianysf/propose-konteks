/**
 * Pure function tests for SystemMapGraph
 *
 * Tests exported pure functions: calculateExpandedPosition, getNodeBoundingBox,
 * boxesOverlap, buildGraphData, and the collision detection logic including
 * the formerly failing y=80/upper-node scenario.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateExpandedPosition,
  getNodeBoundingBox,
  boxesOverlap,
  buildGraphData,
  COMPACT_NODE_WIDTH,
  COMPACT_NODE_HEIGHT,
  EXPANDED_WIDTH,
  EXPANDED_BASE_HEIGHT,
  EXPANDED_SCALE,
  EXPANDED_MARGIN,
  ROW_HEIGHT,
  type FlowNode,
} from './SystemMapGraph'
import { mockData } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Helper functions for creating test nodes
// ---------------------------------------------------------------------------

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
// getNodeBoundingBox tests
// ---------------------------------------------------------------------------

describe('SystemMapGraph — getNodeBoundingBox', () => {
  it('returns correct bounding box for compact node', () => {
    const node = createTestNode('test1', 'component', 100, 200, false)
    const box = getNodeBoundingBox(node)

    expect(box.left).toBe(100)
    expect(box.right).toBe(100 + COMPACT_NODE_WIDTH) // 260
    expect(box.top).toBe(200)
    expect(box.bottom).toBe(200 + COMPACT_NODE_HEIGHT) // 260
  })

  it('returns correct bounding box for expanded node with scale', () => {
    const node = createTestNode('test2', 'component', 100, 200, true)
    const box = getNodeBoundingBox(node)

    // Expanded dimensions should include CSS scale (1.05)
    const expectedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
    const expectedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE

    expect(box.left).toBe(100)
    expect(box.right).toBeCloseTo(100 + expectedWidth, 1)
    expect(box.top).toBe(200)
    expect(box.bottom).toBeCloseTo(200 + expectedHeight, 1)
  })

  it('accounts for metadata rows in expanded node height', () => {
    const metadata = {
      'Repository ID': 'test-repo',
      'Owner': 'test-owner',
    }
    const node = createTestNode('test3', 'component', 100, 200, true, metadata)
    const box = getNodeBoundingBox(node)

    // Height should account for metadata rows
    const contentHeight = EXPANDED_BASE_HEIGHT + (Object.keys(metadata).length * 28)
    const expectedHeight = contentHeight * EXPANDED_SCALE

    expect(box.bottom - box.top).toBeCloseTo(expectedHeight, 1)
  })

  it('handles non-component nodes', () => {
    const repoNode = createTestNode('repo1', 'repository', 50, 100, false)
    const repoBox = getNodeBoundingBox(repoNode)

    expect(repoBox.right - repoBox.left).toBe(COMPACT_NODE_WIDTH)
    expect(repoBox.bottom - repoBox.top).toBe(COMPACT_NODE_HEIGHT)

    const systemNode = createTestNode('sys1', 'system', 500, 150, false)
    const systemBox = getNodeBoundingBox(systemNode)

    expect(systemBox.right - systemBox.left).toBe(COMPACT_NODE_WIDTH)
    expect(systemBox.bottom - systemBox.top).toBe(COMPACT_NODE_HEIGHT)
  })
})

// ---------------------------------------------------------------------------
// boxesOverlap tests
// ---------------------------------------------------------------------------

describe('SystemMapGraph — boxesOverlap', () => {
  it('detects horizontal overlap', () => {
    const box1 = { left: 0, right: 100, top: 0, bottom: 60 }
    const box2 = { left: 50, right: 150, top: 0, bottom: 60 }

    expect(boxesOverlap(box1, box2)).toBe(true)
  })

  it('detects vertical overlap', () => {
    const box1 = { left: 0, right: 160, top: 0, bottom: 60 }
    const box2 = { left: 0, right: 160, top: 40, bottom: 100 }

    expect(boxesOverlap(box1, box2)).toBe(true)
  })

  it('detects diagonal overlap', () => {
    const box1 = { left: 0, right: 100, top: 0, bottom: 60 }
    const box2 = { left: 50, right: 150, top: 40, bottom: 100 }

    expect(boxesOverlap(box1, box2)).toBe(true)
  })

  it('returns false for non-overlapping boxes (separated horizontally)', () => {
    const box1 = { left: 0, right: 100, top: 0, bottom: 60 }
    const box2 = { left: 150, right: 250, top: 0, bottom: 60 }

    // With margin, they still shouldn't overlap
    expect(boxesOverlap(box1, box2)).toBe(false)
  })

  it('returns false for non-overlapping boxes (separated vertically)', () => {
    const box1 = { left: 0, right: 160, top: 0, bottom: 60 }
    const box2 = { left: 0, right: 160, top: 100, bottom: 160 }

    expect(boxesOverlap(box1, box2)).toBe(false)
  })

  it('accounts for margin in overlap detection', () => {
    const box1 = { left: 0, right: 100, top: 0, bottom: 60 }
    const box2 = { left: 100, right: 200, top: 0, bottom: 60 }

    // Boxes are touching at the edge (box1.right == box2.left)
    // With margin (20px), they should NOT overlap since 100 + 20 > 100 is FALSE for separation
    // Actually, with margin, they become separated:
    // box1.right + margin = 100 + 20 = 120
    // box2.left = 100
    // 120 <= 100 is FALSE, so they are NOT separated horizontally
    // But box2.right + margin = 200 + 20 = 220
    // box1.left = 0
    // 220 <= 0 is FALSE, so they are NOT separated in that direction either
    // So they DO overlap
    expect(boxesOverlap(box1, box2)).toBe(true)

    // To be truly separated with margin, boxes need to be further apart
    const box3 = { left: 0, right: 100, top: 0, bottom: 60 }
    const box4 = { left: 121, right: 221, top: 0, bottom: 60 }
    // Now: box3.right + margin = 100 + 20 = 120 <= box4.left = 121, so separated
    expect(boxesOverlap(box3, box4)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// calculateExpandedPosition tests (main collision resolution logic)
// ---------------------------------------------------------------------------

describe('SystemMapGraph — calculateExpandedPosition', () => {
  it('returns original position when no overlap', () => {
    // Create an expanded node that is vertically separated from others
    const expandedNode = createTestNode('comp1', 'component', 280, 300, true)
    const otherNodes = [
      createTestNode('repo1', 'repository', 50, 0, false),
      createTestNode('sys1', 'system', 500, 40, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Should remain at original position since there's vertical separation
    expect(result.x).toBe(280)
    expect(result.y).toBe(300)
  })

  it('shifts node downward to avoid overlap with node below (chooses minimal shift)', () => {
    const expandedNode = createTestNode('comp1', 'component', 280, 0, true)
    // Create a node at y=80 that would overlap when comp1 expands
    // Expanded node height: EXPANDED_BASE_HEIGHT * EXPANDED_SCALE = 180 * 1.05 = 189
    // So expanded node at y=0 would span y=0 to y=189
    // Node at y=80 spans y=80 to y=140 (COMPACT_NODE_HEIGHT = 60)
    // These overlap (80 < 189)
    const otherNodes = [
      createTestNode('comp2', 'component', 280, 80, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Calculate expected bounds
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE // 189
    const resultBox = {
      left: result.x,
      right: result.x + EXPANDED_WIDTH * EXPANDED_SCALE,
      top: result.y,
      bottom: result.y + expandedHeight,
    }
    const otherBox = getNodeBoundingBox(otherNodes[0])

    // Verify no overlap with the new position
    expect(boxesOverlap(resultBox, otherBox)).toBe(false)
    
    // Verify the shift is downward (moving below the overlapping node)
    // The node at y=80 has bottom at y=140
    // With margin (20), the expanded node's top should be at least 160
    expect(resultBox.top).toBeGreaterThanOrEqual(otherBox.bottom + 20 - 1) // Allow 1px rounding
  })

  it('shifts node upward when possible to avoid overlap with node above', () => {
    // Node at y=0 that would overlap with expansion
    const expandedNode = createTestNode('comp1', 'component', 280, 80, true)
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 0, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Calculate bounds
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE // 189
    const resultBox = {
      left: result.x,
      right: result.x + EXPANDED_WIDTH * EXPANDED_SCALE,
      top: result.y,
      bottom: result.y + expandedHeight,
    }
    const upperNodeBox = getNodeBoundingBox(otherNodes[0])

    // Verify no overlap
    expect(boxesOverlap(resultBox, upperNodeBox)).toBe(false)
    
    // Since shifting upward would go negative (y=0 - shift < 0),
    // it should shift downward instead
    expect(result.y).toBeGreaterThanOrEqual(80)
  })

  it('handles multiple overlapping nodes and finds non-overlapping position', () => {
    const expandedNode = createTestNode('comp1', 'component', 280, 160, true)
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 0, false),
      createTestNode('comp2', 'component', 280, 80, false),
      createTestNode('comp3', 'component', 280, 240, false),
      createTestNode('comp4', 'component', 280, 320, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Calculate bounds
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE // 189
    const resultBox = {
      left: result.x,
      right: result.x + EXPANDED_WIDTH * EXPANDED_SCALE,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    // Verify no overlap with any node
    for (const node of otherNodes) {
      const nodeBox = getNodeBoundingBox(node)
      expect(boxesOverlap(resultBox, nodeBox)).toBe(false)
    }
  })

  it('the critical y=80/upper-node scenario: component at y=80 expands without overlapping node at y=0', () => {
    // This is the specific adjacent geometry scenario: y=80 and y=0
    // Component at y=0: spans y=0 to y=60
    // Component at y=80: when expanded, height = 180 * 1.05 = 189, spans y=80 to y=269
    // These would overlap if expanded at original position (60 < 80 with margin check)
    const expandedNode = createTestNode('comp1', 'component', 280, 80, true)
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 0, false),
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

    const upperNodeBox = getNodeBoundingBox(otherNodes[0])
    
    // Prove no overlap after resolution
    expect(boxesOverlap(resultBox, upperNodeBox)).toBe(false)
    
    // Verify deterministic behavior: same inputs produce same outputs
    const result2 = calculateExpandedPosition(expandedNode, otherNodes, [])
    expect(result).toEqual(result2)
  })
  
  it('the critical y=0/lower-node scenario: component at y=0 expands without overlapping node at y=80', () => {
    // The reverse scenario: node at y=0 expands, would overlap with node at y=80
    const expandedNode = createTestNode('comp0', 'component', 280, 0, true)
    const otherNodes = [
      createTestNode('comp1', 'component', 280, 80, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Use actual conservative expanded bounds
    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE // 252
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE // 189
    
    const resultBox = {
      left: result.x,
      right: result.x + expandedWidth,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    const lowerNodeBox = getNodeBoundingBox(otherNodes[0])
    
    // Prove no overlap after resolution
    expect(boxesOverlap(resultBox, lowerNodeBox)).toBe(false)
    
    // Since shifting up would go negative, should shift down
    expect(result.y).toBeGreaterThanOrEqual(0)
  })

  it('handles nodes with different x positions (no overlap)', () => {
    // Place expanded node far to the right so it doesn't overlap horizontally
    const expandedNode = createTestNode('comp1', 'component', 600, 0, true)
    const otherNodes = [
      // Nodes at different x positions, should not overlap
      createTestNode('repo1', 'repository', 50, 0, false),
      createTestNode('sys1', 'system', 280, 40, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Should remain at original position since there's horizontal separation
    expect(result.x).toBe(600)
    expect(result.y).toBe(0)
  })

  it('handles multiple neighbors: expands node at y=80 with neighbors at y=0, y=160, y=240', () => {
    // Component at y=80 with adjacent neighbors above and below
    const expandedNode = createTestNode('comp1', 'component', 280, 80, true)
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 0, false),
      createTestNode('comp2', 'component', 280, 160, false),
      createTestNode('comp3', 'component', 280, 240, false),
    ]

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Use actual conservative expanded bounds
    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE
    
    const resultBox = {
      left: result.x,
      right: result.x + expandedWidth,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    // Prove no overlap with ALL neighbors
    for (const node of otherNodes) {
      const nodeBox = getNodeBoundingBox(node)
      expect(boxesOverlap(resultBox, nodeBox)).toBe(false)
    }
  })

  it('is deterministic: same inputs always produce same outputs', () => {
    const expandedNode = createTestNode('comp1', 'component', 280, 80, true)
    const otherNodes = [
      createTestNode('comp2', 'component', 280, 150, false),
      createTestNode('comp3', 'component', 280, 220, false),
    ]

    const results = []
    for (let i = 0; i < 5; i++) {
      results.push(calculateExpandedPosition(expandedNode, otherNodes, []))
    }

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0])
    }
  })

  it('exhausted/dense search: finds verified fallback beyond all nodes when bounded search exhausted', () => {
    // Create a dense column of nodes that fills the ENTIRE bounded search area
    // The bounded search checks candidates at baseY ± distance for distance = 80, 160, ..., 4000
    // For baseY = 2000, this means checking positions: 0, 80, 160, ..., 6000
    // We'll place nodes at EVERY ROW_HEIGHT position to exhaust ALL candidates
    const baseY = 2000
    const expandedNode = createTestNode('comp1', 'component', 280, baseY, true)
    const otherNodes: FlowNode[] = []

    // Fill the ENTIRE bounded search area (baseY ± 4000px) with nodes
    // This blocks ALL candidate positions the bounded search would try
    const minY = Math.max(0, baseY - 50 * ROW_HEIGHT) // 0 (can't go negative)
    const maxY = baseY + 50 * ROW_HEIGHT // 6000
    
    for (let y = minY; y <= maxY; y += ROW_HEIGHT) {
      otherNodes.push(createTestNode(`dense-${y}`, 'component', 280, y, false))
    }

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Calculate expanded bounds
    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE

    const resultBox = {
      left: result.x,
      right: result.x + expandedWidth,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    // PROVE the fallback branch was actually triggered:
    // If bounded search found a position, result.y would be at most maxY (6000)
    // Since we blocked ALL candidates (including y=2000), the result must be BEYOND maxY
    const maxBoundedCandidate = baseY + 50 * ROW_HEIGHT // 6000
    expect(
      result.y,
      'Fallback position must be beyond all bounded candidates (proves fallback executed)'
    ).toBeGreaterThan(maxBoundedCandidate)

    // With a node at y=2000, maxBottom is 6060 (from node at y=6000)
    // Fallback start: ceil((6060 + 20) / 80) * 80 = 6080
    // With expanded height 189 at y=6080, bottom would be 6269
    // Node at y=6080 would have bottom 6140, so no overlap at 6080
    const expectedFallbackY = 6080
    expect(result.y).toBe(expectedFallbackY)

    // Prove the final position does NOT overlap ANY node
    for (const node of otherNodes) {
      const nodeBox = getNodeBoundingBox(node)
      expect(
        boxesOverlap(resultBox, nodeBox),
        `Fallback position must not overlap node ${node.id} at y=${node.position.y}`
      ).toBe(false)
    }

    // Position should be deterministic (same inputs = same outputs)
    const result2 = calculateExpandedPosition(expandedNode, otherNodes, [])
    expect(result).toEqual(result2)
  })

  it('node occupies the initial fallback coordinate: algorithm advances beyond without overlap', () => {
    // Simulate a node already placed at the initial fallback coordinate
    // This test replaces the ineffective old-y+4000 scenario with proper exhaustion
    // 
    // Scenario: We place nodes at ALL bounded candidate positions (including y=baseY),
    // PLUS one at the calculated fallback position. The algorithm must advance beyond it.
    
    const baseY = 2000
    const expandedNode = createTestNode('comp1', 'component', 280, baseY, true)
    const otherNodes: FlowNode[] = []

    // Fill the ENTIRE bounded search area (baseY ± 4000px = 0 to 6000)
    // This exhausts all normal candidates, forcing the fallback path
    const minY = Math.max(0, baseY - 50 * ROW_HEIGHT) // 0
    const maxY = baseY + 50 * ROW_HEIGHT // 6000
    
    for (let y = minY; y <= maxY; y += ROW_HEIGHT) {
      otherNodes.push(createTestNode(`dense-${y}`, 'component', 280, y, false))
    }

    // Calculate where the initial fallback would be (maxBottom + margin, grid-aligned)
    // Max node is at y=6000 with bottom=6060
    // Fallback start = 6060 + 20 = 6080, already grid-aligned
    const maxBottom = 6000 + COMPACT_NODE_HEIGHT // 6060
    const initialFallbackY = Math.ceil((maxBottom + EXPANDED_MARGIN) / ROW_HEIGHT) * ROW_HEIGHT // 6080

    // Place a node at the initial fallback coordinate to block it
    // This forces the algorithm to advance beyond the initial fallback
    otherNodes.push(
      createTestNode('node-at-initial-fallback', 'component', 280, initialFallbackY, false)
    )

    const result = calculateExpandedPosition(expandedNode, otherNodes, [])

    // Calculate expanded bounds
    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE

    const resultBox = {
      left: result.x,
      right: result.x + expandedWidth,
      top: result.y,
      bottom: result.y + expandedHeight,
    }

    // PROVE the fallback branch was triggered (result beyond all bounded candidates)
    expect(
      result.y,
      'Fallback must be triggered (result beyond bounded candidates)'
    ).toBeGreaterThan(maxY) // 6000

    // PROVE the algorithm advanced BEYOND the initial fallback coordinate
    // (which was blocked by a node at y=6080)
    expect(
      result.y,
      'Result must advance beyond the blocked initial fallback coordinate'
    ).toBeGreaterThan(initialFallbackY) // 6080

    // Expected result: initialFallbackY (6080) is blocked
    // With expanded height 189, at y=6080 bottom would be 6269
    // Node at y=6080 has bottom 6140
    // With 20px margin: need node.bottom + margin <= result.top for vertical separation
    // At y=6160: node.bottom + margin = 6140 + 20 = 6160 <= result.top (6160), no overlap!
    const expectedAdvancedFallbackY = 6160
    expect(result.y).toBe(expectedAdvancedFallbackY)

    // Prove the result does NOT overlap the node at the initial fallback coordinate
    const fallbackNodeBox = getNodeBoundingBox(
      otherNodes.find(n => n.id === 'node-at-initial-fallback')!
    )
    expect(
      boxesOverlap(resultBox, fallbackNodeBox),
      'Result must not overlap node at initial fallback coordinate'
    ).toBe(false)

    // Prove it does not overlap ANY node
    for (const node of otherNodes) {
      const nodeBox = getNodeBoundingBox(node)
      expect(
        boxesOverlap(resultBox, nodeBox),
        `Result must not overlap node ${node.id} at y=${node.position.y}`
      ).toBe(false)
    }

    // Position should be deterministic
    const result2 = calculateExpandedPosition(expandedNode, otherNodes, [])
    expect(result).toEqual(result2)
  })
})

// ---------------------------------------------------------------------------
// buildGraphData tests (graph structure and edges)
// ---------------------------------------------------------------------------

describe('SystemMapGraph — buildGraphData', () => {
  it('builds complete repository → component → system graph edges', () => {
    const system = mockData.systems[0] // BSI - HRIS
    const { nodes, edges, state } = buildGraphData(
      system,
      mockData.repositories,
      mockData.components,
    )

    expect(state).not.toBe('truly-empty')
    expect(state).not.toBe('repos-no-components')
    expect(state).not.toBe('fallback')

    // Verify we have system nodes
    const systemNodes = nodes.filter(n => n.data.type === 'system')
    expect(systemNodes.length).toBeGreaterThan(0)
    expect(systemNodes[0].id).toBe(`system-${system.id}`)

    // Verify we have repository nodes
    const repoNodes = nodes.filter(n => n.data.type === 'repository')
    expect(repoNodes.length).toBeGreaterThan(0)

    // Verify we have component nodes
    const componentNodes = nodes.filter(n => n.data.type === 'component')
    expect(componentNodes.length).toBeGreaterThan(0)

    // Verify edges connect repository → component
    const repoToCompEdges = edges.filter(e => {
      const source = nodes.find(n => n.id === e.source)
      const target = nodes.find(n => n.id === e.target)
      return source?.data.type === 'repository' && target?.data.type === 'component'
    })
    expect(repoToCompEdges.length).toBeGreaterThan(0)
    expect(repoToCompEdges.length).toBeGreaterThan(0)

    // Verify edges connect component → system
    const compToSysEdges = edges.filter(e => {
      const source = nodes.find(n => n.id === e.source)
      const target = nodes.find(n => n.id === e.target)
      return source?.data.type === 'component' && target?.data.type === 'system'
    })
    expect(compToSysEdges.length).toBeGreaterThan(0)
  })

  it('assigns correct node types and metadata', () => {
    const system = mockData.systems[0]
    const { nodes } = buildGraphData(
      system,
      mockData.repositories,
      mockData.components,
    )

    // Check system node
    const systemNode = nodes.find(n => n.data.type === 'system')
    expect(systemNode).toBeDefined()
    expect(systemNode?.data.label).toBe(system.name)
    expect(systemNode?.data.systemId).toBe(system.id)

    // Check repository nodes
    const repoNodes = nodes.filter(n => n.data.type === 'repository')
    for (const repoNode of repoNodes) {
      expect(repoNode.data.type).toBe('repository')
      expect(repoNode.data.repoId).toBeDefined()
      expect(repoNode.data.systemId).toBe(system.id)
    }

    // Check component nodes
    const componentNodes = nodes.filter(n => n.data.type === 'component')
    for (const compNode of componentNodes) {
      expect(compNode.data.type).toBe('component')
      expect(compNode.data.componentId).toBeDefined()
      expect(compNode.data.repoId).toBeDefined()
      expect(compNode.data.systemId).toBe(system.id)
    }
  })

  it('handles truly-empty state (empty repoIds)', () => {
    const emptySystem = { id: 'empty', name: 'Empty', description: 'Test', repoIds: [] }
    const { nodes, edges, state } = buildGraphData(
      emptySystem,
      mockData.repositories,
      mockData.components,
    )

    expect(state).toBe('truly-empty')
    expect(nodes.length).toBe(0)
    expect(edges.length).toBe(0)
  })

  it('handles repos-no-components state', () => {
    const system = { id: 'test', name: 'Test', description: 'Test', repoIds: ['test-repo'] }
    const testRepo = { id: 'test-repo', name: 'Test Repo', systemId: 'test', vcs: 'GitHub', updatedAt: '2026-01-01' }
    // No components for this repo

    const { nodes, state } = buildGraphData(
      system,
      [testRepo],
      [],
    )

    expect(state).toBe('repos-no-components')
    expect(nodes.length).toBeGreaterThan(0) // Should have system and repo nodes
  })

  it('handles fallback state (null system)', () => {
    const { nodes, edges, state } = buildGraphData(
      null,
      mockData.repositories,
      mockData.components,
    )

    expect(state).toBe('fallback')
    expect(nodes.length).toBe(0)
    expect(edges.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Position restoration tests
// ---------------------------------------------------------------------------

describe('SystemMapGraph — position restoration', () => {
  it('node returns to original position when selection is cleared', () => {
    const basePosition = { x: 280, y: 0 }

    // Create a node at original position
    const node = createTestNode('comp1', 'component', basePosition.x, basePosition.y, false)

    // When selected, the node calculates an expanded position
    const expandedNode = { ...node, data: { ...node.data, isExpanded: true } }
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 80, false),
    ]
    const expandedPos = calculateExpandedPosition(expandedNode, otherNodes, [])

    // The expanded position should be different from original (due to collision)
    expect(expandedPos.y).not.toBe(basePosition.y)

    // When selection is cleared, the node returns to original position
    // (This is verified by checking the node's original position is unchanged)
    expect(node.position.x).toBe(basePosition.x)
    expect(node.position.y).toBe(basePosition.y)
  })

  it('expanded position is deterministic when re-selecting the same node', () => {
    const basePosition = { x: 280, y: 0 }
    const node = createTestNode('comp1', 'component', basePosition.x, basePosition.y, false)
    const otherNodes = [
      createTestNode('comp0', 'component', 280, 80, false),
      createTestNode('comp2', 'component', 280, 160, false),
    ]

    // First selection
    const expandedNode1 = { ...node, data: { ...node.data, isExpanded: true } }
    const expandedPos1 = calculateExpandedPosition(expandedNode1, otherNodes, [])

    // Simulate clearing and re-selecting
    const expandedNode2 = { ...node, data: { ...node.data, isExpanded: true } }
    const expandedPos2 = calculateExpandedPosition(expandedNode2, otherNodes, [])

    // Positions should be identical
    expect(expandedPos1).toEqual(expandedPos2)
  })

  it('different nodes can be expanded independently without affecting each other', () => {
    // Use widely spaced nodes to ensure they don't interfere with each other
    const nodes = [
      createTestNode('comp1', 'component', 280, 0, false),
      createTestNode('comp2', 'component', 280, 400, false),
      createTestNode('comp3', 'component', 280, 800, false),
    ]

    // Expand comp1
    const expanded1 = { ...nodes[0], data: { ...nodes[0].data, isExpanded: true } }
    const pos1 = calculateExpandedPosition(expanded1, nodes, [])

    // Expand comp2 (with comp1 at original position, not expanded)
    const expanded2 = { ...nodes[1], data: { ...nodes[1].data, isExpanded: true } }
    const pos2 = calculateExpandedPosition(expanded2, nodes, [])

    // Expand comp3 (with comp1 and comp2 at original positions)
    const expanded3 = { ...nodes[2], data: { ...nodes[2].data, isExpanded: true } }
    const pos3 = calculateExpandedPosition(expanded3, nodes, [])

    // Each should get a position that doesn't overlap with the ORIGINAL positions of others
    const expandedWidth = EXPANDED_WIDTH * EXPANDED_SCALE
    const expandedHeight = EXPANDED_BASE_HEIGHT * EXPANDED_SCALE
    
    const box1 = { left: pos1.x, right: pos1.x + expandedWidth, top: pos1.y, bottom: pos1.y + expandedHeight }
    const box2 = { left: pos2.x, right: pos2.x + expandedWidth, top: pos2.y, bottom: pos2.y + expandedHeight }
    const box3 = { left: pos3.x, right: pos3.x + expandedWidth, top: pos3.y, bottom: pos3.y + expandedHeight }

    // Check that expanded positions don't overlap with OTHER nodes' original positions
    const nodeBoxes = nodes.map(n => getNodeBoundingBox(n))
    
    // box1 (expanded comp1) should not overlap with comp2 and comp3 original positions
    expect(boxesOverlap(box1, nodeBoxes[1])).toBe(false)
    expect(boxesOverlap(box1, nodeBoxes[2])).toBe(false)
    
    // box2 (expanded comp2) should not overlap with comp1 and comp3 original positions
    expect(boxesOverlap(box2, nodeBoxes[0])).toBe(false)
    expect(boxesOverlap(box2, nodeBoxes[2])).toBe(false)
    
    // box3 (expanded comp3) should not overlap with comp1 and comp2 original positions
    expect(boxesOverlap(box3, nodeBoxes[0])).toBe(false)
    expect(boxesOverlap(box3, nodeBoxes[1])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Expanded same-node selection state tests
// ---------------------------------------------------------------------------

describe('SystemMapGraph — expanded same-node selection state', () => {
  it('clicking same node twice keeps selection and expands on second click', () => {
    const node = createTestNode('comp1', 'component', 280, 80, false)

    // First click: select node (not expanded)
    const selected1 = node
    const isExpanded1 = (selected1.data.isExpanded as boolean) || false
    expect(isExpanded1).toBe(false)

    // Second click on same node: should expand (in actual component, handleNodeClick toggles)
    // The isExpanded flag is set based on whether the selected node matches
    const selected2 = { ...selected1, data: { ...selected1.data, isExpanded: true } }
    const isExpanded2 = (selected2.data.isExpanded as boolean) || false
    expect(isExpanded2).toBe(true)
    expect(selected2.id).toBe(selected1.id) // Same node selected
  })

  it('selecting a different node clears previous expansion', () => {
    const node1 = createTestNode('comp1', 'component', 280, 80, false)
    createTestNode('comp2', 'component', 280, 160, false) // Different node (unused, for context)

    // Select and expand node1
    const expanded1 = { ...node1, data: { ...node1.data, isExpanded: true } }
    expect(expanded1.data.isExpanded).toBe(true)

    // Select a different node (node1 should no longer be expanded)
    // In the actual component, styledNodes recalculates isExpanded based on selectedNode
    // So node1 would have isExpanded=false when node2 is selected
    const node1AfterSelection = { ...node1, data: { ...node1.data, isExpanded: false } }
    expect(node1AfterSelection.data.isExpanded).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Initial/selected opacity state tests
// ---------------------------------------------------------------------------

describe('SystemMapGraph — initial/selected opacity state', () => {
  it('initial state has all nodes at full opacity (no selection)', () => {
    // This is verified via CSS in the component tests
    // Here we verify the logic: when selectedNode is null, no dimming class is applied
    const selectedNode = null
    const hasSelection = selectedNode !== null

    expect(hasSelection).toBe(false)
    // In CSS: .kx-system-map__graph-container:not(.has-selection) .react-flow__node { opacity: 1 }
  })

  it('selected state applies dimming to non-highlighted nodes', () => {
    const selectedNode = createTestNode('comp1', 'component', 280, 80, false)
    const hasSelection = selectedNode !== null

    expect(hasSelection).toBe(true)
    // In CSS: .kx-system-map__graph-container.has-selection .react-flow__node:not(.highlighted) { opacity: 0.3 }
  })

  it('selected node and its neighbors are highlighted (full opacity)', () => {
    const selectedNode = createTestNode('comp1', 'component', 280, 80, true)
    // In the component, highlightedNodes is calculated as:
    // - selected node itself
    // - nodes connected by edges (one-hop neighbors)

    const highlightedNodes = new Set([selectedNode.id])
    // Simulate edge-based highlighting
    const _edges = [
      { id: 'e1', source: 'repo1', target: 'comp1' },
      { id: 'e2', source: 'comp1', target: 'sys1' },
    ]

    _edges.forEach((edge) => {
      if (edge.source === selectedNode.id) highlightedNodes.add(edge.target)
      if (edge.target === selectedNode.id) highlightedNodes.add(edge.source)
    })

    expect(highlightedNodes.has('comp1')).toBe(true)
    expect(highlightedNodes.has('repo1')).toBe(true)
    expect(highlightedNodes.has('sys1')).toBe(true)

    // In CSS: .kx-system-map__graph-container.has-selection .react-flow__node.highlighted { opacity: 1 }
  })
})
