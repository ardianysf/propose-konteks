import { expect, test } from '@playwright/test'

test.describe('interactive system map runtime', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog/components/system-map-modal')
    await expect(page.locator('.react-flow__node')).toHaveCount(9)
  })

  test('renders the full C4 chain, type-distinct nodes, and corner reset', async ({ page }) => {
    // C4 columns for BSI - HRIS: 3 repos + 3 components + 2 containers + 1 system
    await expect(page.locator('.react-flow__node-repository')).toHaveCount(3)
    await expect(page.locator('.react-flow__node-component')).toHaveCount(3)
    await expect(page.locator('.react-flow__node-container')).toHaveCount(2)
    await expect(page.locator('.react-flow__node-system')).toHaveCount(1)

    // Each type is recognizable at a glance: colored icon chip header +
    // caps CATEGORY text + tag chips per level
    await expect(page.locator('.repository-node__icon svg')).toHaveCount(3)
    await expect(page.locator('.component-node__icon svg')).toHaveCount(3)
    await expect(page.locator('.container-node__icon svg')).toHaveCount(2)
    await expect(page.locator('.system-node__icon svg')).toHaveCount(1)

    const catText = (sel: string) =>
      page.locator(sel).first().evaluate((el) => el.textContent)
    expect(await catText('.repository-node__cat')).toBe('Repo')
    expect(await catText('.component-node__cat')).toBe('Component')
    expect(await catText('.container-node__cat')).toBe('Container')
    expect(await catText('.system-node__cat')).toBe('System')

    // Tag chips carry the C4 metadata: repo VCS, container tech, counts
    await expect(page.locator('.repository-node__tag')).toHaveCount(3)
    await expect(page.locator('.container-node__tag').first()).toHaveText(/React SPA|Node.js/)
    await expect(page.locator('.system-node__tag').first()).toHaveText(/2 containers/)

    // hris-web spans two repos → two tags ("hris-frontend-shared", "hris-frontend-promotion")
    const compTags = await page
      .locator('.component-node')
      .filter({ hasText: 'hris-web' })
      .locator('.component-node__tag')
      .allTextContents()
    expect(compTags).toEqual(['hris-frontend-shared', 'hris-frontend-promotion'])

    const edgePaths = page.locator('.react-flow__edge-path')
    const handles = page.locator('.react-flow__handle')
    const backgroundDot = page.locator('.react-flow__background circle')

    // 4 repo→component (hris-web spans two repos) + 3 comp→container + 2 container→system
    await expect(edgePaths).toHaveCount(9)
    await expect(handles).toHaveCount(14)
    await expect(backgroundDot).toHaveCount(1)

    const edgeGeometry = await edgePaths.first().getAttribute('d')
    expect(edgeGeometry).toMatch(/^M.+L/)

    // Many-to-many: comp-hris-web is implemented by BOTH hris repos
    await expect(
      page.locator('.react-flow__edge[data-id="edge-bsi/hris-frontend-shared-to-comp-hris-web"]'),
    ).toHaveCount(1)
    await expect(
      page.locator('.react-flow__edge[data-id="edge-bsi/hris-frontend-promotion-to-comp-hris-web"]'),
    ).toHaveCount(1)

    // C4 chain: component → its container, container → system
    await expect(
      page.locator('.react-flow__edge[data-id="edge-comp-hris-web-to-cont-hris-web"]'),
    ).toHaveCount(1)
    await expect(
      page.locator('.react-flow__edge[data-id="edge-cont-hris-web-to-bsi-hris"]'),
    ).toHaveCount(1)

    const edgeViewport = await page.locator('.react-flow__edges').boundingBox()
    expect(edgeViewport).not.toBeNull()
    expect(edgeViewport!.width).toBeGreaterThan(100)
    expect(edgeViewport!.height).toBeGreaterThan(100)

    // Dots must be paintable: React Flow renders r = size × zoom / 2,
    // so 2.8 × 0.85 / 2 ≈ 1.19px at the default viewport zoom.
    const dotRadius = Number(await backgroundDot.getAttribute('r'))
    expect(dotRadius).toBeGreaterThanOrEqual(1)
    expect(dotRadius).toBeLessThanOrEqual(1.5)

    const resetGap = await page.evaluate(() => {
      const graph = document.querySelector('.kx-system-map__graph-container')
      const reset = document.querySelector('.kx-system-map__reset-btn')
      if (!graph || !reset) return null
      const graphBox = graph.getBoundingClientRect()
      const resetBox = reset.getBoundingClientRect()
      return {
        right: graphBox.right - resetBox.right,
        bottom: graphBox.bottom - resetBox.bottom,
      }
    })

    expect(resetGap).not.toBeNull()
    expect(resetGap!.right).toBeLessThanOrEqual(20)
    expect(resetGap!.bottom).toBeLessThanOrEqual(20)
  })

  test('hides the React Flow attribution label', async ({ page }) => {
    await expect(page.locator('.react-flow__attribution')).toHaveCount(0)
    expect(await page.locator('.kx-system-map__graph-container').textContent()).not.toContain('React Flow')
  })

  test('keeps a fixed initial zoom with no auto-fit; user zoom persists', async ({ page }) => {
    const readZoom = () =>
      page.evaluate(() => {
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
        const transform = viewport?.style.transform ?? ''
        const scale = transform.match(/scale\(([\d.]+)\)/)
        return scale ? Number(scale[1]) : null
      })

    // Initial mount: exactly the declared default zoom (0.85) — an auto
    // fit-view would pick an arbitrary computed zoom instead.
    await page.waitForTimeout(400)
    expect(await readZoom()).toBeCloseTo(0.85, 2)

    // User zoom-out via the controls must persist — no silent re-fit.
    const zoomOut = page.locator('.react-flow__controls-button[aria-label="Zoom Out"]')
    await zoomOut.click()
    await zoomOut.click()
    await page.waitForTimeout(500)
    const afterZoomOut = await readZoom()
    expect(afterZoomOut).not.toBeNull()
    expect(afterZoomOut!).toBeLessThan(0.85)
    expect(await readZoom()).toBeCloseTo(afterZoomOut!, 4)
  })

  test('expanded component shows description, relationships, and Start Session', async ({ page }) => {
    const hrisWeb = page.locator('.component-node').filter({ hasText: 'hris-web' })
    await hrisWeb.click()

    const expanded = page.locator('.component-node.expanded')
    await expect(expanded).toHaveCount(1)
    await expect(expanded.locator('.component-node__cat')).toHaveText('Component')
    await expect(expanded.locator('.component-node__name')).toHaveText('hris-web')
    await expect(expanded.locator('.component-node__description')).toContainText('HRIS Web App')
    await expect(expanded.locator('.component-node__rel-heading')).toHaveText('Relationships')

    const relLabels = await expanded.locator('.component-node__metadata-label').allTextContents()
    expect(relLabels).toEqual(['Container', 'Repos', 'System'])
    const relValues = await expanded.locator('.component-node__metadata-value').allTextContents()
    expect(relValues[0]).toBe('HRIS Web App')
    expect(relValues[1]).toContain('bsi/hris-frontend-shared')
    expect(relValues[1]).toContain('bsi/hris-frontend-promotion')
    expect(relValues[2]).toBe('BSI - HRIS')

    await expect(expanded.getByRole('button', { name: 'Start Session' })).toBeVisible()
  })

  test('keeps dragged node position and updates its connected edge', async ({ page }) => {
    const repository = page.locator('.react-flow__node-repository').first()
    const repositoryId = await repository.getAttribute('data-id')
    const repoKey = repositoryId!.replace(/^repo-/, '')
    const connectedEdge = page.locator(
      `.react-flow__edge[data-id^="edge-${repoKey}-to-"] .react-flow__edge-path`,
    )
    const beforeNode = await repository.boundingBox()
    const beforeEdge = await connectedEdge.getAttribute('d')

    expect(beforeNode).not.toBeNull()
    await repository.hover()
    await page.mouse.down()
    await page.mouse.move(
      beforeNode!.x + beforeNode!.width / 2 + 80,
      beforeNode!.y + beforeNode!.height / 2 + 45,
      { steps: 8 },
    )
    await page.mouse.up()

    const afterNode = await repository.boundingBox()
    const afterEdge = await connectedEdge.getAttribute('d')

    expect(afterNode).not.toBeNull()
    expect(Math.abs(afterNode!.x - beforeNode!.x)).toBeGreaterThan(30)
    expect(Math.abs(afterNode!.y - beforeNode!.y)).toBeGreaterThan(20)
    expect(afterEdge).not.toBe(beforeEdge)
  })
})

test.describe('interactive system map dark theme', () => {
  test('edges and dots use the light dark-theme ink instead of dark ink', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('konteks-theme', 'dark')
    })
    await page.goto('/catalog/components/system-map-modal')
    await expect(page.locator('.react-flow__edge-path').first()).toBeVisible()

    const palette = await page.evaluate(() => {
      const edge = document.querySelector('.react-flow__edge-path') as SVGPathElement | null
      const dot = document.querySelector('.react-flow__background circle') as SVGCircleElement | null
      return {
        htmlTheme: document.documentElement.dataset.theme,
        edgeStroke: edge ? getComputedStyle(edge).stroke : null,
        dotFill: dot ? getComputedStyle(dot).fill : null,
      }
    })

    expect(palette.htmlTheme).toBe('dark')
    // Dark theme strokes/dots are built from the light primary #e8ede8 —
    // dark ink (36 48 37 / 53 80 44) would be invisible on the dark canvas.
    expect(palette.edgeStroke).toContain('232, 237, 232')
    // Dots sit below the content and stay faint (alpha 0.12) so nodes and
    // edges remain the highest-contrast layer on the dark canvas.
    expect(palette.dotFill).toBe('rgba(232, 237, 232, 0.12)')
  })
})

test.describe('system map modal preview fit', () => {
  test('modal fits inside the catalog preview frame without horizontal overflow', async ({ page }) => {
    await page.goto('/catalog/components/system-map-modal')
    await expect(page.locator('.react-flow__node')).toHaveCount(9)

    const fit = await page.evaluate(() => {
      const frame = document.querySelector('.kx-cat-preview-frame') as HTMLElement | null
      const modal = document.querySelector('.kx-system-map') as HTMLElement | null
      if (!frame || !modal) return null
      const frameBox = frame.getBoundingClientRect()
      const modalBox = modal.getBoundingClientRect()
      return {
        frameScrollWidth: frame.scrollWidth,
        frameClientWidth: frame.clientWidth,
        modalRight: modalBox.right,
        frameRight: frameBox.right,
        modalWidth: modalBox.width,
      }
    })

    expect(fit).not.toBeNull()
    expect(fit!.frameScrollWidth).toBeLessThanOrEqual(fit!.frameClientWidth)
    expect(fit!.modalRight).toBeLessThanOrEqual(fit!.frameRight)
    expect(fit!.modalWidth).toBeLessThanOrEqual(900)
  })
})

test.describe('accent button ink contrast (both themes)', () => {
  const openPrimaryButton = async (page: import('@playwright/test').Page) => {
    await page.goto('/')
    await page.getByTestId('repository-trigger').click()
    const done = page.getByRole('button', { name: 'Done' })
    await expect(done).toBeVisible()
    return done
  }

  test.fixme('primary button keeps AA white ink on the solid fill; hover swaps to dark ink on #8fbf6a', {
    annotation: { type: 'fixme', description: 'v2 shell is now the primary app at /; e2e to be rewritten for v2 DOM' },
  }, async ({ page }) => {
    const done = await openPrimaryButton(page)

    const base = await done.evaluate((el) => getComputedStyle(el).color)
    expect(base).toBe('rgb(255, 255, 255)')

    await done.hover()
    await page.waitForTimeout(250)
    const hovered = await done.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }))
    expect(hovered.background).toBe('rgb(143, 191, 106)') // --kx-accent #8fbf6a
    expect(hovered.color).toBe('rgb(36, 48, 37)') // --kx-accent-fill-ink (light)
  })

  test.fixme('dark theme: primary button ink stays AA on both fills', {
    annotation: { type: 'fixme', description: 'v2 shell is now the primary app at /; e2e to be rewritten for v2 DOM' },
  }, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('konteks-theme', 'dark')
    })
    const done = await openPrimaryButton(page)

    const base = await done.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }))
    expect(base.background).toBe('rgb(79, 112, 68)') // --kx-accent-solid-aa
    expect(base.color).toBe('rgb(255, 255, 255)') // --kx-accent-solid-ink (5.6:1)

    await done.hover()
    await page.waitForTimeout(250)
    const hovered = await done.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }))
    expect(hovered.background).toBe('rgb(143, 191, 106)') // #8fbf6a
    expect(hovered.color).toBe('rgb(15, 21, 16)') // --kx-accent-fill-ink dark (≈8.7:1)
  })

  test('system map Start Session CTA (#8fbf6a fill) uses dark ink in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      if (theme === 'dark') {
        await page.addInitScript(() => {
          window.localStorage.setItem('konteks-theme', 'dark')
        })
      }
      await page.goto('/catalog/components/system-map-modal')
      await page.locator('.react-flow__node-component').first().click()
      const cta = page.locator('.component-node__cta')
      await expect(cta).toBeVisible()

      const ink = await cta.evaluate((el) => ({
        fill: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
        applied: document.documentElement.dataset.theme,
      }))
      expect(ink.applied).toBe(theme)
      expect(ink.fill).toBe('rgb(143, 191, 106)') // #8fbf6a fill in both themes
      expect(ink.color).toBe(
        theme === 'dark' ? 'rgb(15, 21, 16)' : 'rgb(36, 48, 37)',
      )
    }
  })
})
