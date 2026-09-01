import { expect, test } from '@playwright/test'
import { goto, openLearnedDrawer } from './helpers'

// fixme: v2 shell is now the primary app at /; e2e to be rewritten for v2 DOM
test.describe.fixme('konteks learned drawer', () => {
  test('opens as a 450px right drawer with Pending primary and a flat Audit timeline (AC39)', async ({ page }) => {
    await goto(page)
    await openLearnedDrawer(page)

    const drawer = page.getByTestId('learned-drawer')
    await expect(drawer).toBeVisible()
    const box = await drawer.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeCloseTo(450, 0)

    await expect(page.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true')

    const pending = drawer.getByRole('list', { name: 'Pending reviews' })
    await expect(pending).toBeVisible()
    await expect(pending.getByRole('listitem')).toHaveCount(3)
    await expect(pending).toContainText('Attendance mapper override')

    await page.getByRole('tab', { name: 'Audit History' }).click()
    const timeline = drawer.getByRole('list', { name: 'Audit history' })
    await expect(drawer.locator('.kx-learned-timeline')).toBeVisible()
    await expect(timeline).toBeVisible()
    await expect(timeline.getByRole('listitem')).toHaveCount(5)
    await expect(timeline).toContainText('Approved learned rule "pref-eval weighting"')
  })

  test('Reviews waiting opens the drawer directly on Pending (AC20)', async ({ page }) => {
    await goto(page)
    await openLearnedDrawer(page)

    await expect(page.getByTestId('learned-drawer')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Audit History' })).toHaveAttribute('aria-selected', 'false')
  })

  test('drawer shows designed empty and loading states for both tabs (AC43)', async ({ page }) => {
    await goto(page, '/?mock=empty')
    await openLearnedDrawer(page)
    await expect(page.getByText('No pending reviews')).toBeVisible()

    await page.getByRole('tab', { name: 'Audit History' }).click()
    await expect(page.getByText('No audit events yet')).toBeVisible()

    await goto(page, '/?mock=loading')
    await openLearnedDrawer(page)
    await expect(page.locator('.kx-learned__loading')).toBeVisible()

    await page.getByRole('tab', { name: 'Audit History' }).click()
    await expect(page.locator('.kx-learned__loading')).toBeVisible()
  })
})
