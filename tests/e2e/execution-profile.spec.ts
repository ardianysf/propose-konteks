import { expect, test } from '@playwright/test'
import { goto, openExecutionProfileMenu } from './helpers'

test.describe('execution profile menu', () => {
  test('the trigger toggles the menu closed on a second click (AC22)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('execution-profile-trigger')
    await trigger.click()
    const menu = page.getByTestId('execution-profile-menu')
    await expect(menu).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Same-click toggle: the second click dismisses the menu (focus is
    // restored to the trigger through the lifecycle) instead of
    // re-opening it.
    await trigger.click()
    await expect(menu).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()

    // The trigger keeps working after a toggle — it re-opens.
    await trigger.click()
    await expect(page.getByTestId('execution-profile-menu')).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  test('opens anchored (no backdrop, no header) with a flat list and Manage entry (AC22)', async ({ page }) => {
    await goto(page)
    await openExecutionProfileMenu(page)

    const menu = page.getByTestId('execution-profile-menu')
    await expect(menu).toBeVisible()
    await expect(page.locator('.kx-modal-backdrop')).toHaveCount(0)
    await expect(menu.locator('header')).toHaveCount(0)
    await expect(menu.locator('h1,h2,h3,h4,h5,h6')).toHaveCount(0)
    await expect(menu.locator('.kx-profile-menu__item')).toHaveCount(5)
    await expect(menu.getByRole('menuitem', { name: /Manage \/ Customize Profile/ })).toBeVisible()
  })

  test('hovering a profile reveals the Planner/Executor/authorization/readiness sidecar (AC23)', async ({ page }) => {
    await goto(page)
    await openExecutionProfileMenu(page)

    const row = page.getByTestId('execution-profile-menu').locator('.kx-profile-menu__item', {
      hasText: 'Commerce Platform',
    })
    await row.hover()

    const sidecar = page.getByTestId('execution-profile-sidecar')
    await expect(sidecar).toBeVisible()
    await expect(sidecar).toContainText('Commerce Platform')
    await expect(sidecar).toContainText('Claude Sonnet 4.5')
    await expect(sidecar).toContainText('Claude Haiku 4.5')
    await expect(sidecar).toContainText('Commerce GitHub organization')
    await expect(sidecar).toContainText('Ready')
  })

  test('Assistant and Search render under a separated Workspace settings section (AC24)', async ({ page }) => {
    await goto(page)
    await openExecutionProfileMenu(page)

    const workspace = page.locator('.kx-profile-menu__workspace')
    await expect(workspace).toBeVisible()
    await expect(workspace).toContainText('Workspace settings')
    await expect(workspace).toContainText('Assistant')
    await expect(workspace).toContainText('Search')

    const inProfileList = await workspace.evaluate((el) => el.closest('.kx-profile-menu__list') !== null)
    expect(inProfileList).toBe(false)
  })

  test('Manage / Customize Profile opens Customize on the Agents tab (AC22)', async ({ page }) => {
    await goto(page)
    await openExecutionProfileMenu(page)

    await page
      .getByTestId('execution-profile-menu')
      .getByRole('menuitem', { name: /Manage \/ Customize Profile/ })
      .click()

    await expect(page.getByTestId('customize-modal')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Agents' })).toHaveAttribute('aria-selected', 'true')
  })
})
