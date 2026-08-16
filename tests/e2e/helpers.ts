import { expect, type Page } from '@playwright/test'

/**
 * Small shared E2E helpers. Kept deliberately thin: production carries its
 * own stable data-testid values, and these helpers only wrap the repeated
 * "navigate + wait for the shell" and "open this overlay" gestures.
 */

export async function goto(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByRole('navigation', { name: 'Sidebar' })).toBeVisible()
}

export function sidebar(page: Page) {
  return page.getByRole('navigation', { name: 'Sidebar' })
}

export function mainCanvas(page: Page) {
  return page.locator('main.kx-main')
}

export async function sidebarWidth(page: Page): Promise<number> {
  return sidebar(page).evaluate((element) => element.getBoundingClientRect().width)
}

export async function openWorkspaceMenu(page: Page) {
  await page.getByRole('button', { name: /workspace$/i }).click()
}

export async function openSystemMenu(page: Page) {
  await page.getByRole('button', { name: /open system menu/i }).click()
}

export async function openExecutionProfileMenu(page: Page) {
  await page.getByRole('button', { name: /execution profile/i }).click()
}

export async function openComponentMenu(page: Page) {
  await page.getByTestId('component-trigger').click()
}

export async function openRepositoryModal(page: Page) {
  await page.getByTestId('repository-trigger').click()
}

export async function openCustomize(page: Page) {
  await page.getByRole('button', { name: 'Customize' }).click()
}

export async function openLearnedDrawer(page: Page) {
  await page.getByTestId('reviews-waiting').click()
}

export async function openAccountMenu(page: Page) {
  await page.getByTestId('account-trigger').click()
}

export async function pressEscape(page: Page) {
  await page.keyboard.press('Escape')
}

/** True when `later` is to the right of / below `earlier` in the page. */
export function isAfter(earlier: { x: number; y: number }, later: { x: number; y: number }) {
  return later.y > earlier.y || (later.y === earlier.y && later.x > earlier.x)
}
