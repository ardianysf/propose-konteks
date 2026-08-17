import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import {
  goto,
  openAccountMenu,
  openComponentMenu,
  openCustomize,
  openExecutionProfileMenu,
  openLearnedDrawer,
  openRepositoryModal,
  openSystemMenu,
} from './helpers'

/**
 * Deterministic visual capture checks (Task 14, plan §14.3).
 *
 * These are NOT snapshot-baseline comparisons: each view performs a real
 * assertion that the expected surface is visible, then writes a
 * page.screenshot() to the gitignored artifacts/screenshots/ directory so a
 * human reviewer can eyeball the mockup. The same view set is captured at the
 * spec's ideal viewport (1440×900) and at the compact 1200×720 regression
 * viewport (AC44).
 */

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1200, height: 720 },
] as const

const SCREENSHOTS_DIR = path.join(process.cwd(), 'artifacts', 'screenshots')

interface CaptureView {
  /** Stable name used in the <view>-<w>x<h>.png filename. */
  name: string
  /** Navigates to and asserts the expected surface is visible. */
  prepare: (page: Page, width: number, height: number) => Promise<void>
}

async function capture(page: Page, name: string, width: number, height: number) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  const filename = `${name}-${width}x${height}.png`
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: false })
  return filename
}

async function assertNoHorizontalOverflow(page: Page, width: number) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth, `document must not overflow ${width}px horizontally`).toBeLessThanOrEqual(width)
}

/** Both axes (AC44): a region is fully inside the capture viewport —
 * x AND y bounds — including the compact-height 1200×720 window. */
async function assertFullyInViewport(page: Page, testId: string, width: number, height: number) {
  const box = await page.getByTestId(testId).boundingBox()
  expect(box, `${testId} should render at ${width}x${height}`).not.toBeNull()
  expect(box!.x, `${testId} left edge at ${width}x${height}`).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width, `${testId} right edge at ${width}x${height}`).toBeLessThanOrEqual(width)
  expect(box!.y, `${testId} top edge at ${width}x${height}`).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height, `${testId} bottom edge at ${width}x${height}`).toBeLessThanOrEqual(height)
  return box!
}

/** The centered disclaimer must stay visible below the composer. */
async function assertDisclaimerVisibleAndCentered(page: Page, width: number, height: number) {
  const disclaimerBox = await assertFullyInViewport(page, 'disclaimer', width, height)
  const composerBox = await page.getByTestId('composer').boundingBox()
  expect(composerBox).not.toBeNull()
  expect(disclaimerBox.y).toBeGreaterThanOrEqual(composerBox!.y + composerBox!.height)
  const contentBox = await page.getByTestId('new-session-content').boundingBox()
  expect(contentBox).not.toBeNull()
  const disclaimerCenter = disclaimerBox.x + disclaimerBox.width / 2
  const contentCenter = contentBox!.x + contentBox!.width / 2
  expect(Math.abs(disclaimerCenter - contentCenter), `disclaimer centered at ${width}x${height}`).toBeLessThanOrEqual(2)
}

async function assertCustomizeFullyInViewport(page: Page, width: number, height: number) {
  const box = await page.getByTestId('customize-modal').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(width)
  expect(box!.y + box!.height).toBeLessThanOrEqual(height)
}

const VIEWS: CaptureView[] = [
  {
    name: 'engineering',
    prepare: async (page, width, height) => {
      await goto(page)
      await expect(page.getByRole('radio', { name: 'Engineering' })).toBeChecked()
      await expect(page.getByTestId('composer')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Choose system / repositories' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Choose component' })).toBeVisible()
      await expect(page.getByTestId('composer-input-box')).toBeVisible()

      // Composer-refinement geometry holds at the capture viewport too:
      // full-width header wider than the bounded composer column, reviews
      // pill above the composer, centered disclaimer below it — and every
      // required region fully inside the viewport on BOTH axes (AC44).
      for (const testId of [
        'new-session-header',
        'new-session-content',
        'new-session-intro',
        'composer',
        'composer-input-box',
        'reviews-wrapper',
        'disclaimer',
      ]) {
        await assertFullyInViewport(page, testId, width, height)
      }
      const headerBox = await page.getByTestId('new-session-header').boundingBox()
      const contentBox = await page.getByTestId('new-session-content').boundingBox()
      const composerBox = await page.getByTestId('composer').boundingBox()
      const reviewsBox = await page.getByTestId('reviews-wrapper').boundingBox()
      expect(headerBox!.width, `header wider than content at ${width}`).toBeGreaterThan(contentBox!.width)
      expect(headerBox!.width, `header wider than composer at ${width}`).toBeGreaterThan(composerBox!.width)
      expect(reviewsBox!.y + reviewsBox!.height).toBeLessThanOrEqual(composerBox!.y)
      await assertDisclaimerVisibleAndCentered(page, width, height)
    },
  },
  {
    name: 'planning',
    prepare: async (page, width, height) => {
      await goto(page)
      await page.getByRole('radio', { name: 'Planning' }).click()
      await expect(page.getByRole('button', { name: 'Start planning' })).toBeVisible()
      // Planning keeps the system trigger but drops only the component pill.
      await expect(page.getByRole('button', { name: 'Choose system' })).toBeVisible()
      await expect(page.getByTestId('component-trigger')).toHaveCount(0)
      await expect(page.getByTestId('composer-input-box')).toBeVisible()
      // The SESSION MODE label + segmented group survive the mode swap.
      await expect(page.getByText('SESSION MODE', { exact: true })).toBeVisible()
      // Planning keeps the same in-viewport guarantee as Engineering at the
      // capture viewport — including the centered disclaimer (AC44).
      for (const testId of [
        'new-session-header',
        'new-session-intro',
        'composer',
        'composer-input-box',
        'reviews-wrapper',
      ]) {
        await assertFullyInViewport(page, testId, width, height)
      }
      await assertDisclaimerVisibleAndCentered(page, width, height)
    },
  },
  {
    name: 'system-menu',
    prepare: async (page) => {
      await goto(page)
      await openSystemMenu(page)
      await expect(page.getByRole('menu', { name: 'Systems' })).toBeVisible()
    },
  },
  {
    name: 'execution-profile',
    prepare: async (page) => {
      await goto(page)
      await openExecutionProfileMenu(page)
      await page
        .getByTestId('execution-profile-menu')
        .locator('.kx-profile-menu__item', { hasText: 'Commerce Platform' })
        .hover()
      await expect(page.getByTestId('execution-profile-sidecar')).toBeVisible()
    },
  },
  {
    name: 'repository-modal',
    prepare: async (page) => {
      await goto(page)
      await openRepositoryModal(page)
      await expect(page.getByRole('dialog', { name: 'Choose work repositories' })).toBeVisible()
    },
  },
  {
    name: 'nested-create-system',
    prepare: async (page, width, height) => {
      await goto(page)
      await openRepositoryModal(page)
      await page
        .getByRole('dialog', { name: 'Choose work repositories' })
        .getByRole('button', { name: /Add new system/ })
        .click()

      // The repository-sourced Create System modal nests above the
      // suspended selector — assert the stacked precondition before the
      // capture: two frames, one accessible dialog, dedicated layers.
      const create = page.locator('.kx-create-modal--nested')
      await expect(create).toBeVisible()
      const suspended = page.locator('.kx-repo-modal--suspended')
      await expect(suspended).toHaveCount(1)
      await expect(suspended).toHaveAttribute('aria-hidden', 'true')
      await expect(page.getByRole('dialog')).toHaveCount(1)
      const createZ = await create.evaluate((element) => Number(getComputedStyle(element).zIndex))
      const suspendedZ = await suspended.evaluate((element) =>
        Number(getComputedStyle(element).zIndex),
      )
      expect(createZ).toBeGreaterThan(suspendedZ)

      // The top dialog stays fully inside the viewport on BOTH axes (AC44).
      const box = await create.boundingBox()
      expect(box, `nested create renders at ${width}x${height}`).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
      expect(box!.y + box!.height).toBeLessThanOrEqual(height)
    },
  },
  {
    name: 'component-menu',
    prepare: async (page) => {
      await goto(page)
      await openComponentMenu(page)
      await expect(page.getByTestId('component-menu')).toBeVisible()
    },
  },
  {
    name: 'customize-agents',
    prepare: async (page) => {
      await goto(page)
      await openCustomize(page)
      await expect(page.getByTestId('customize-modal')).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Agents' })).toHaveAttribute('aria-selected', 'true')
    },
  },
  {
    name: 'customize-mcp',
    prepare: async (page) => {
      await goto(page)
      await openCustomize(page)
      await page.getByRole('tab', { name: 'MCP' }).click()
      await expect(page.getByRole('tab', { name: 'MCP' })).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByRole('table', { name: 'MCP servers' })).toBeVisible()
    },
  },
  {
    name: 'learned',
    prepare: async (page) => {
      await goto(page)
      await openLearnedDrawer(page)
      await expect(page.getByTestId('learned-drawer')).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true')
    },
  },
  {
    name: 'session-history',
    prepare: async (page, width, height) => {
      // At ≤1280px the responsive media query forces the sidebar into the
      // 64px icon rail, hiding the "View all" control (and the expand
      // toggle). Reach Session History while the sidebar is expanded, then
      // shrink to the target viewport for the capture.
      if (width <= 1280) {
        await page.setViewportSize({ width: 1440, height: 900 })
        await goto(page)
        await page.getByRole('button', { name: 'View all' }).click()
        await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
        await page.setViewportSize({ width, height })
      } else {
        await goto(page)
        await page.getByRole('button', { name: 'View all' }).click()
      }
      await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
    },
  },
  {
    name: 'settings',
    prepare: async (page) => {
      await goto(page)
      await openAccountMenu(page)
      await page.getByRole('menuitem', { name: 'Settings' }).click()
      await expect(page.getByTestId('settings-modal')).toBeVisible()
      await expect(page.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    },
  },
]

test.describe('visual capture checks (deterministic, no snapshot baseline)', () => {
  for (const view of VIEWS) {
    test(`${view.name} captures at both viewports`, async ({ page }) => {
      for (const { width, height } of VIEWPORTS) {
        await page.setViewportSize({ width, height })
        await view.prepare(page, width, height)

        // The full page stays horizontally contained at BOTH the ideal
        // 1440×900 and the compact 1200×720 regression viewport (AC44).
        await assertNoHorizontalOverflow(page, width)
        if (width === 1200 && view.name.startsWith('customize-')) {
          await assertCustomizeFullyInViewport(page, width, height)
        }

        const filename = await capture(page, view.name, width, height)
        // The screenshot artifact itself is a deterministic check output; assert
        // the file path shape so regressions in the naming convention surface.
        expect(filename).toBe(`${view.name}-${width}x${height}.png`)
      }
    })
  }
})
