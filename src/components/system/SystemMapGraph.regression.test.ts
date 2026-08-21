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
  type FlowNode,
} from './SystemMapGraph'

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
