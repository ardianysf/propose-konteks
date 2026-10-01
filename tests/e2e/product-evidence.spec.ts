import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

test.describe.configure({ mode: 'parallel' })

const surfaces = [
  ['activities', '/v2/activities', 'Activities'],
  ['work', '/v2/work', 'Work In Progress'],
  [
    'work-detail',
    '/v2/work-detail/initiative-1',
    'Improve the checkout experience',
  ],
  ['issues', '/v2/issues', 'Issues'],
  ['releases', '/v2/releases', 'Releases'],
  ['leaderboard', '/v2/leaderboard', 'Leaderboard'],
  ['customize-runtimes', '/v2/customize/runtimes', 'Customize'],
  ['customize-access', '/v2/customize/access', 'Customize'],
  ['customize-models', '/v2/customize/models', 'Customize'],
  ['customize-context', '/v2/customize/context', 'Customize'],
  ['customize-skills', '/v2/customize/skills', 'Customize'],
  ['customize-tools', '/v2/customize/tools', 'Customize'],
  ['customize-mcps', '/v2/customize/mcps', 'Customize'],
  ['customize-connectors', '/v2/customize/connectors', 'Customize'],
  ['customize-vcs', '/v2/customize/vcs', 'Customize'],
  ['customize-operations', '/v2/customize/operations', 'Customize'],
  ['settings-general', '/v2/settings/general', 'Settings'],
  ['settings-plan', '/v2/settings/plan', 'Settings'],
  ['settings-usage', '/v2/settings/usage', 'Settings'],
  ['settings-budgets', '/v2/settings/budgets', 'Settings'],
  ['settings-payments', '/v2/settings/payments', 'Settings'],
  ['profile', '/v2/profile', 'Profile'],
  ['runtime', '/v2/runtime/runtime-mac', 'Studio Mac'],
  ['systems', '/v2/systems', 'Software Systems'],
  ['system-detail', '/v2/systems/bsi-hris', 'BSI - HRIS'],
  ['work-locally', '/v2/work-locally', 'Work Locally'],
  ['support', '/v2/support', 'Support'],
] as const

async function evidence(page: Page, name: string) {
  const dir =
    process.env.KONTEKS_CAPTURE_EVIDENCE === '1'
      ? 'docs/evidence/live-app-refactor/screenshots'
      : 'artifacts/product-evidence'
  mkdirSync(dir, { recursive: true })
  await page.screenshot({
    path: path.join(dir, `${name}.jpg`),
    type: 'jpeg',
    quality: 78,
    fullPage: false,
    animations: 'disabled',
  })
}
async function verifyLayout(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width)
  const main = page.locator('main.kx-main')
  expect(
    await main.evaluate((el) => el.scrollWidth - el.clientWidth),
  ).toBeLessThanOrEqual(1)
}
for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const variant = `${theme}-${viewport.width}`
    test.describe(variant, () => {
      test.use({ viewport })
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((pref) => {
          localStorage.setItem('konteks-theme', pref)
        }, theme)
      })
      for (const [name, route, title] of surfaces) {
        test(`${name}: theme, layout and accessibility`, async ({ page }) => {
          await page.goto(route)
          await expect(
            page.getByRole('heading', { name: title, exact: true, level: 1 }),
          ).toBeVisible()
          await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            theme,
          )
          await page.evaluate(() => document.fonts.ready)
          await verifyLayout(page)
          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze()
          expect(
            results.violations,
            `${route}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
          ).toEqual([])
          await evidence(page, `${name}-${variant}`)
        })
      }
      test('dialogs and detail states', async ({ page }) => {
        await page.goto('/v2/work')
        await page
          .getByRole('button', { name: 'New initiative', exact: true })
          .click()
        await expect(
          page.getByRole('dialog', { name: 'New initiative' }),
        ).toBeVisible()
        await evidence(page, `new-initiative-${variant}`)
        await page.keyboard.press('Escape')
        await page.goto('/v2/work-detail/initiative-1')
        await page.getByRole('button', { name: 'Updates', exact: true }).click()
        await expect(
          page.getByRole('dialog', { name: 'Updates' }),
        ).toBeVisible()
        await evidence(page, `updates-${variant}`)
        await page.keyboard.press('Escape')
        await page.goto('/v2/runtime/runtime-mac')
        await page
          .getByRole('button', { name: 'Runtime details', exact: true })
          .click()
        await expect(
          page.getByRole('dialog', { name: 'Runtime' }),
        ).toBeVisible()
        await evidence(page, `runtime-detail-${variant}`)
        await page.keyboard.press('Escape')
        await page.goto('/v2/customize/runtimes')
        await page
          .getByRole('region', { name: 'Runtimes', exact: true })
          .getByRole('button', { name: 'Connect a runtime' })
          .click()
        await expect(
          page.getByRole('dialog', { name: 'Connect a runtime' }),
        ).toBeVisible()
        await evidence(page, `connect-runtime-${variant}`)
        await page.keyboard.press('Escape')
        await page.goto('/v2/customize/tools')
        await page.locator('.kx-list-row--button').first().click()
        await expect(page.locator('.kx-detail-panel')).toBeVisible()
        await evidence(page, `tool-detail-${variant}`)
        await page.goto('/v2/settings/payments')
        await page
          .getByRole('tab', { name: 'Payment history', exact: true })
          .click()
        await evidence(page, `payment-history-${variant}`)
        await page.goto('/v2/work-locally')
        await page
          .getByRole('button', { name: 'Generate Credential', exact: true })
          .click()
        await expect(
          page.getByRole('region', { name: 'Demo setup' }),
        ).toBeVisible()
        await evidence(page, `local-setup-${variant}`)
        await page.goto('/v2/work?mock=loading')
        await expect(
          page.getByRole('status', { name: 'Loading content' }),
        ).toBeVisible()
        await evidence(page, `loading-${variant}`)
        await page.goto('/v2/work?mock=empty')
        await expect(
          page.getByRole('heading', { name: 'Nothing here yet' }),
        ).toBeVisible()
        await evidence(page, `empty-${variant}`)
        await page.goto('/v2/work?mock=error')
        await expect(page.getByRole('alert')).toContainText('Unable to load')
        await evidence(page, `error-${variant}`)
      })
    })
  }
}
