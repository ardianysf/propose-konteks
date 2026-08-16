import { expect, test } from '@playwright/test'
import { goto, sidebar } from './helpers'

test.describe('session history', () => {
  test('is a dedicated page with an unchanged sidebar, chronological rows, and hover-only actions (AC40)', async ({ page }) => {
    await goto(page)
    const sidebarBefore = await sidebar(page).evaluate((el) => el.outerHTML)

    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('region', { name: 'Session history' })).toBeVisible()
    const sidebarAfter = await sidebar(page).evaluate((el) => el.outerHTML)
    expect(sidebarAfter).toBe(sidebarBefore)

    const rows = page.getByRole('list', { name: 'Session history' }).getByRole('listitem')
    await expect(rows).toHaveCount(9)
    await expect(rows.nth(0)).toContainText('EDP Integration Fix - Mobile')

    const first = rows.nth(0)
    await expect(first.locator('.kx-history__row-title')).toHaveText('EDP Integration Fix - Mobile')
    await expect(first.locator('.kx-history__row-meta')).toHaveText('Engineering · BSI - HRIS · hris-web')
    await expect(first.locator('.kx-history__row-time')).toHaveText('2h ago')

    const action = first.locator('.kx-history__action')
    await expect.poll(() => action.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
    await expect.poll(() => action.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')

    await first.hover()
    await expect.poll(() => action.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await expect.poll(() => action.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('auto')
  })

  test('search and mode/system filters narrow the list with a designed no-results state (AC41)', async ({ page }) => {
    await goto(page)
    await page.getByRole('button', { name: 'View all' }).click()

    const rows = () => page.getByRole('list', { name: 'Session history' }).getByRole('listitem')
    const search = page.getByRole('searchbox', { name: 'Search sessions' })

    await search.fill('EDP')
    await expect(rows()).toHaveCount(1)
    await expect(rows().nth(0)).toContainText('EDP Integration Fix - Mobile')

    await search.fill('')
    await page.getByRole('combobox', { name: 'Mode' }).selectOption('planning')
    const planningRows = await rows().all()
    expect(planningRows.length).toBeGreaterThan(0)
    for (const row of planningRows) {
      await expect(row.locator('.kx-history__row-meta')).toContainText('Planning')
    }

    await page.getByRole('combobox', { name: 'System' }).selectOption('bsi-hris')
    await expect(page.getByTestId('history-no-results')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open session' })).toBeDisabled()

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(rows()).toHaveCount(9)
  })

  test('session history renders loading and empty demo variants (AC43)', async ({ page }) => {
    await goto(page, '/?mock=loading')
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByTestId('history-loading')).toBeVisible()

    await goto(page, '/?mock=empty')
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByTestId('history-empty')).toBeVisible()
    await expect(page.getByText('No sessions yet')).toBeVisible()
  })
})
