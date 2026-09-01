import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  goto,
  openCustomize,
  openLearnedDrawer,
  openRepositoryModal,
  openSystemMenu,
} from './helpers'

async function expectNoWcag2aaViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()
  expect(
    results.violations,
    `${label}: ${JSON.stringify(results.violations, null, 2)}`,
  ).toEqual([])
}

// fixme: v2 shell is now the primary app at /; e2e to be rewritten for v2 DOM
test.describe.fixme('accessibility (axe wcag2aa)', () => {
  test('new session page has zero violations', async ({ page }) => {
    await goto(page)
    await expectNoWcag2aaViolations(page, 'new session')
  })

  test('session history page has zero violations', async ({ page }) => {
    await goto(page)
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
    await expectNoWcag2aaViolations(page, 'session history')
  })

  test('system menu has zero violations', async ({ page }) => {
    await goto(page)
    await openSystemMenu(page)
    await expect(page.getByRole('menu', { name: 'Systems' })).toBeVisible()
    await expectNoWcag2aaViolations(page, 'system menu')
  })

  test('Customize modal has zero violations', async ({ page }) => {
    await goto(page)
    await openCustomize(page)
    await expect(page.getByTestId('customize-modal')).toBeVisible()
    await expectNoWcag2aaViolations(page, 'customize modal')
  })

  test('Konteks Learned drawer has zero violations', async ({ page }) => {
    await goto(page)
    await openLearnedDrawer(page)
    await expect(page.getByTestId('learned-drawer')).toBeVisible()
    await expectNoWcag2aaViolations(page, 'learned drawer')
  })

  test('repository modal has zero violations', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    await expect(page.getByRole('dialog', { name: 'Choose work repositories' })).toBeVisible()
    await expectNoWcag2aaViolations(page, 'repository modal')
  })
})
