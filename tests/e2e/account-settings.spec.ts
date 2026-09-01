import { expect, test } from '@playwright/test'
import { goto, openAccountMenu } from './helpers'

// fixme: v2 shell is now the primary app at /; e2e to be rewritten for v2 DOM
test.describe.fixme('account + settings', () => {
  test('account menu lists exactly the preserved account actions (AC42)', async ({ page }) => {
    await goto(page)
    await openAccountMenu(page)

    const menu = page.getByTestId('account-menu')
    await expect(menu).toBeVisible()
    const items = menu.getByRole('menuitem')
    await expect(items).toHaveCount(5)
    await expect(items.nth(0)).toHaveText('Settings')
    await expect(items.nth(1)).toHaveText('Billing')
    await expect(items.nth(2)).toHaveText('Integrations')
    await expect(items.nth(3)).toHaveText('Keyboard shortcuts')
    await expect(items.nth(4)).toHaveText('Log out')
  })

  test('Settings preserves General / Billing / Team and the exact Billing sub-navigation (AC42)', async ({ page }) => {
    await goto(page)
    await openAccountMenu(page)
    await page.getByRole('menuitem', { name: 'Settings' }).click()

    const modal = page.getByTestId('settings-modal')
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    await expect(modal.getByRole('tab', { name: 'Billing' })).toBeVisible()
    await expect(modal.getByRole('tab', { name: 'Team' })).toBeVisible()

    await modal.getByRole('tab', { name: 'Billing' }).click()
    const subtabs = modal.getByRole('tablist', { name: 'Billing sections' }).getByRole('tab')
    await expect(subtabs).toHaveText(['Usage', 'Plans', 'Providers', 'Budgets', 'Top Up', 'Transactions'])
  })

  test('the Billing account action opens Settings directly on Billing (AC42)', async ({ page }) => {
    await goto(page)
    await openAccountMenu(page)
    await page.getByRole('menuitem', { name: 'Billing' }).click()

    await expect(page.getByTestId('settings-modal')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true')
  })
})
