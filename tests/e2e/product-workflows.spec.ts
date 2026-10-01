import { expect, test } from '@playwright/test'

test('all primary menus navigate and browser history restores the selected initiative', async ({
  page,
}) => {
  await page.goto('/v2/work')
  const nav = page.getByRole('navigation', { name: 'Sidebar' })
  for (const label of [
    'Activities',
    'Work In Progress',
    'Issues',
    'Releases',
    'Leaderboard',
    'Customize',
  ]) {
    await nav.getByRole('button', { name: label, exact: true }).click()
    await expect(
      page.getByRole('heading', { name: label, exact: true, level: 1 }),
    ).toBeVisible()
  }
  await nav
    .getByRole('button', { name: 'Work In Progress', exact: true })
    .click()
  await page
    .getByRole('searchbox', { name: 'Search initiatives' })
    .fill('checkout')
  await expect(
    page.getByRole('button', { name: /Refresh repository/ }),
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: /Improve the checkout experience Driven/ })
    .click()
  await expect(page).toHaveURL(/work-detail\/initiative-1/)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Improve the checkout experience' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Back to Work In Progress' }).click()
  await page.goBack()
  await expect(
    page.getByRole('heading', { name: 'Improve the checkout experience' }),
  ).toBeVisible()
  await page.goForward()
  await expect(
    page.getByRole('heading', { name: 'Work In Progress', exact: true }),
  ).toBeVisible()
})

test('create initiative, attach a transcript, post a note, react and comment', async ({
  page,
}) => {
  await page.goto('/v2/work')
  await page
    .getByRole('button', { name: 'New initiative', exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'New initiative',
    exact: true,
  })
  await dialog.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(dialog).toBeVisible()
  await dialog
    .getByLabel('What is this initiative about?')
    .fill('Make search accessible')
  await dialog
    .getByLabel('Attach meeting transcript')
    .setInputFiles({
      name: 'meeting.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Illustrative meeting transcript'),
    })
  await dialog.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Make search accessible' }),
  ).toBeVisible()
  await expect(page.getByText('meeting.txt', { exact: true })).toBeVisible()
  await page
    .getByLabel('Draft your thinking… notes feed the plan')
    .fill('Keep keyboard focus visible')
  await page.getByRole('button', { name: 'Post note', exact: true }).click()
  const note = page
    .locator('.kx-product-note')
    .filter({ hasText: 'Keep keyboard focus visible' })
  await note.getByRole('button', { name: 'React', exact: true }).click()
  await note.getByRole('button', { name: 'Like', exact: true }).click()
  await expect(
    note.getByRole('button', { name: 'Like', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await note.getByRole('button', { name: 'Comment', exact: true }).click()
  await note
    .getByLabel('Comment', { exact: true })
    .fill('Agreed, include the mobile menu')
  await note.getByRole('button', { name: 'Post comment' }).click()
  await expect(note.getByText('Agreed, include the mobile menu')).toBeVisible()
  await page.getByRole('button', { name: 'Updates', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Updates' })).toContainText(
    'Keep keyboard focus visible',
  )
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Updates', exact: true }),
  ).toBeFocused()
})

test('Software System filtering and notifications lead to matching records', async ({
  page,
}) => {
  await page.goto('/v2/work')
  await page
    .getByRole('group', { name: 'Filter by Software System' })
    .getByRole('button', { name: 'MPM - Mytok', exact: true })
    .click()
  await expect(
    page.getByRole('button', {
      name: /Improve the checkout experience Driven/,
    }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: /Review component accessibility Driven/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Notifications', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Notifications' })
    .getByRole('button', { name: /Improve the checkout/ })
    .click()
  await expect(page).toHaveURL(/from=activities/)
  await page.getByRole('button', { name: 'Back to Activities' }).click()
  await expect(page.getByRole('heading', { name: 'Activities' })).toBeVisible()
})

test('runtime setup, editing, policy and agent sessions use local state', async ({
  page,
}) => {
  await page.goto('/v2/customize/runtimes')
  await page
    .getByRole('region', { name: 'Runtimes', exact: true })
    .getByRole('button', { name: 'Connect a runtime' })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'Connect a runtime',
    exact: true,
  })
  await expect(
    dialog.getByRole('button', { name: 'Get the command' }),
  ).toBeDisabled()
  await dialog.getByLabel('Name', { exact: true }).fill('Demo workstation')
  await dialog.getByRole('button', { name: 'Get the command' }).click()
  await expect(dialog).toContainText('DEMO-ONLY')
  await dialog.getByRole('button', { name: 'Finish setup' }).click()
  await page
    .getByRole('region', { name: 'Runtimes', exact: true })
    .getByRole('button', { name: /Demo workstation/ })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Demo workstation', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Runtime details' }).click()
  const details = page.getByRole('dialog', { name: 'Runtime', exact: true })
  await details.getByRole('button', { name: 'Edit details' }).click()
  await details
    .getByLabel('Name', { exact: true })
    .fill('Demo workstation renamed')
  await details.getByRole('button', { name: 'Save details' }).click()
  await expect(details).toContainText('Demo workstation renamed')
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Runtime details' }),
  ).toBeFocused()
  await page.goto('/v2/runtime/runtime-mac')
  await page.getByRole('tab', { name: 'Claude Code', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'No sessions for this agent' }),
  ).toBeVisible()
  await page.getByRole('tab', { name: 'Codex', exact: true }).click()
  await page
    .getByRole('button', { name: /Review the checkout changes/ })
    .click()
  await expect(page).toHaveURL(/session-stream-detail/)
})

test('Settings profile, workspace and Operations forms save locally', async ({
  page,
}) => {
  await page.goto('/v2/settings/general')
  await page.getByLabel('Workspace name', { exact: true }).fill('Demo team')
  await page.getByRole('button', { name: 'Save workspace' }).click()
  await expect(page.getByRole('status')).toContainText('Workspace saved')
  await page
    .getByLabel('Display name', { exact: true })
    .fill('Demo administrator')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Sidebar' })
    .getByRole('button', { name: 'Customize', exact: true })
    .click()
  await page
    .getByRole('navigation', { name: 'Customize', exact: true })
    .getByRole('button', { name: 'Operations', exact: true })
    .click()
  await page.getByRole('button', { name: 'Add a channel', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Name', { exact: true })
    .fill('Demo alerts')
  await page.getByRole('button', { name: 'Create the channel' }).click()
  await expect(page.getByText('Demo alerts', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Disable', exact: true }).click()
  await expect(page.getByText('Datadog · Disabled')).toBeVisible()
})

test('mobile menu closes on navigation and modal keyboard focus stays contained', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/v2/work')
  await page.getByTestId('v2-mobile-sidebar-toggle').click()
  await page
    .getByRole('navigation', { name: 'Sidebar' })
    .getByRole('button', { name: 'Issues', exact: true })
    .click()
  await expect(page.getByTestId('v2-mobile-scrim')).toHaveCount(0)
  await page.goto('/v2/work')
  await page.getByRole('button', { name: 'New initiative' }).click()
  const dialog = page.getByRole('dialog')
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((d) => d.contains(document.activeElement)),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'New initiative' }),
  ).toBeFocused()
})

test('unknown records render recovery and error state retries without losing route', async ({
  page,
}) => {
  await page.goto('/v2/work-detail/missing')
  await expect(
    page.getByRole('heading', { name: 'Initiative not found' }),
  ).toBeVisible()
  await page.goto('/v2/work?mock=error')
  await expect(page.getByRole('alert')).toContainText('Unable to load')
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(
    page.getByRole('button', {
      name: /Improve the checkout experience Driven/,
    }),
  ).toBeVisible()
})
