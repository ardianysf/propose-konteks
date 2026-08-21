/*
 * Catalog scroll contract test (catalog-scroll-fix).
 *
 * Verifies that:
 * 1. catalog.css enables vertical scrolling when kx-catalog-page class is present
 * 2. The global.css overflow: hidden rule is NOT affected when catalog class is absent
 * 3. This preserves the mockup shell's scroll ownership (.kx-main is the only scroll owner)
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const GLOBAL_CSS_PATH = resolve(__dirname, '../styles/global.css')
const CATALOG_CSS_PATH = resolve(__dirname, './catalog.css')

describe('catalog scroll contract', () => {
  it('global.css locks html/body overflow hidden for mockup', () => {
    const globalCss = readFileSync(GLOBAL_CSS_PATH, 'utf-8')

    // Verify the core contract: global.css locks overflow
    expect(globalCss).toMatch(/html,\s*body\s*{[\s\S]*overflow:\s*hidden/)
    expect(globalCss).toContain('overflow: hidden')
  })

  it('catalog.css enables scrolling ONLY when kx-catalog-page class is present', () => {
    const catalogCss = readFileSync(CATALOG_CSS_PATH, 'utf-8')

    // Verify the catalog enables scroll with scoped selector
    expect(catalogCss).toMatch(/html\.kx-catalog-page/)

    // Verify it enables vertical scroll (selectors are comma-separated on separate lines)
    // Match: either html.kx-catalog-page or html.kx-catalog-page body, followed by overflow-y
    expect(catalogCss).toMatch(/html\.kx-catalog-page(?:\s+body)?\s*{[\s\S]*?overflow-y:\s*auto/)

    // Verify horizontal overflow is still hidden (prevent horizontal scroll)
    expect(catalogCss).toMatch(/overflow-x:\s*hidden/)

    // The selector should be specific to avoid affecting the main app
    expect(catalogCss).toContain('html.kx-catalog-page,')
    expect(catalogCss).toContain('html.kx-catalog-page body')
  })

  it('catalog.css does NOT use naked html/body selectors that would affect mockup', () => {
    const catalogCss = readFileSync(CATALOG_CSS_PATH, 'utf-8')

    // Remove comments to avoid false positives
    const cssWithoutComments = catalogCss.replace(/\/\*[\s\S]*?\*\//g, '')

    // Look for bare html or body selectors (not with .kx-catalog-page class)
    // These would be problematic as they'd affect the mockup app
    const bareHtmlBodyMatch = cssWithoutComments.match(
      /^(html|body)\s*{[\s\S]*?overflow/m,
    )

    // We should NOT have bare html/body overflow rules in catalog.css
    expect(bareHtmlBodyMatch).toBeNull()
  })

  it('catalog.css uses only kx-cat- namespace for component styles', () => {
    const catalogCss = readFileSync(CATALOG_CSS_PATH, 'utf-8')

    // Remove comments
    const cssWithoutComments = catalogCss.replace(/\/\*[\s\S]*?\*\//g, '')

    // Extract all CSS rules to check for top-level (non-descendant) selectors
    // We allow descendant selectors like .kx-cat-preview-static-menu .kx-menu
    // because they're scoped within catalog contexts.
    const ruleBlocks = cssWithoutComments.split('}')
    const topLevelSelectors: string[] = []

    for (const block of ruleBlocks) {
      if (!block.trim()) continue
      // Get the selector part (before the first {)
      const selectorMatch = block.match(/^([^{]+){/)
      if (!selectorMatch) continue

      const selector = selectorMatch[1].trim()
      // Extract class selectors from this rule
      const classes = selector.match(/\.[a-z][a-z0-9-]*/gi) || []

      // Check if this is a descendant selector (contains space, >, +, or ~)
      const isDescendant = /[>+~\s]/.test(selector)

      // Only collect non-descendant class selectors
      if (!isDescendant) {
        topLevelSelectors.push(...classes)
      }
    }

    // Filter for invalid top-level selectors
    const invalidSelectors = topLevelSelectors.filter(
      (sel) =>
        !sel.startsWith('.kx-cat-') &&
        sel !== '.kx-catalog-page',
    )

    expect(
      invalidSelectors,
      `Found non-namespaced top-level selectors that could affect the mockup: ${invalidSelectors.join(', ')}`,
    ).toHaveLength(0)
  })

  it('catalog.css scroll rules are specific enough to override global.css', () => {
    const catalogCss = readFileSync(CATALOG_CSS_PATH, 'utf-8')

    // The selector should be specific enough to override global.css's
    // bare html/body selectors (specificity 0,0,2)
    // html.kx-catalog-page has specificity 0,1,1 which wins
    expect(catalogCss).toContain('html.kx-catalog-page')

    // Both html and body should be covered
    expect(catalogCss).toContain('html.kx-catalog-page,')
    expect(catalogCss).toContain('html.kx-catalog-page body')
  })
})
