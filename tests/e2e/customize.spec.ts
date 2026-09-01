import { expect, test } from '@playwright/test'
import { goto, openCustomize, openRepositoryModal } from './helpers'

const TABS = ['Agents', 'Context', 'MCP', 'Connectors', 'VCS', 'Skills', 'Tools'] as const

// fixme: v2 shell is now the primary app at /; e2e to be rewritten for v2 DOM
test.describe.fixme('customize', () => {
  test('modal measures 790×580 on every one of the seven tabs (AC34)', async ({ page }) => {
    await goto(page)
    await openCustomize(page)

    const modal = page.getByTestId('customize-modal')
    await expect(modal).toBeVisible()

    for (const tab of TABS) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
      const box = await modal.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeCloseTo(790, 0)
      expect(box!.height).toBeCloseTo(580, 0)
    }
  })

  test('header and nav stay fixed while only the content area scrolls (AC35)', async ({ page }) => {
    await goto(page)
    await openCustomize(page)

    const modal = page.getByTestId('customize-modal')
    await expect(modal.locator('.kx-customize__content .kx-customize__head')).toHaveCount(0)
    await expect(modal.locator('.kx-customize__content .kx-customize__nav')).toHaveCount(0)

    const overflow = await modal.locator('.kx-customize__content').evaluate((el) => getComputedStyle(el).overflowY)
    expect(overflow).toBe('auto')

    const headBefore = await modal.locator('.kx-customize__head').boundingBox()
    await modal.locator('.kx-customize__content').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await page.waitForTimeout(50)
    const headAfter = await modal.locator('.kx-customize__head').boundingBox()
    expect(headAfter!.y).toBe(headBefore!.y)
  })

  test('Agents tab exposes the Create profile / Active Profiles / Review setup / disclosure hierarchy (AC36)', async ({ page }) => {
    await goto(page)
    await openCustomize(page)

    const modal = page.getByTestId('customize-modal')
    await expect(modal.getByRole('button', { name: 'Create profile' })).toBeVisible()

    const table = modal.getByRole('table', { name: 'Active Profiles' })
    await expect(table).toBeVisible()
    await expect(table.locator('tbody tr')).toHaveCount(5)

    await expect(modal.getByText('Review setup')).toBeVisible()
    await expect(modal.locator('details.kx-agents__disclosure')).toHaveCount(5)

    const aiRoles = modal.locator('details.kx-agents__disclosure', { hasText: 'AI roles' })
    await aiRoles.locator('summary').click()
    await expect(aiRoles).toContainText('Planner')
    await expect(aiRoles).toContainText('Executor')
    await expect(aiRoles).toContainText('Reviewer')

    const providers = modal.locator('details.kx-agents__disclosure', { hasText: 'Providers' })
    await providers.locator('summary').click()
    await expect(providers).toContainText('OpenAI')
    await expect(providers).toContainText('Anthropic')
    await expect(providers).toContainText('Azure OpenAI')

    const archived = modal.locator('details.kx-agents__disclosure', { hasText: 'Archived agents' })
    await archived.locator('summary').click()
    await expect(archived).toContainText('hris-promotion-reviewer')
    await expect(archived).toContainText('canteen-audit-writer')

    const permissions = modal.locator('details.kx-agents__disclosure', { hasText: 'Permissions' })
    await permissions.locator('summary').click()
    await expect(permissions).toContainText('Admin allowlist')
    await expect(permissions).toContainText('Workspace default access')
  })

  test('Context tab shows Files / Skills / Repositories and integration tabs show compact content (AC37)', async ({ page }) => {
    await goto(page)
    await openCustomize(page)

    const modal = page.getByTestId('customize-modal')
    await page.getByRole('tab', { name: 'Context' }).click()
    const panel = modal.getByRole('tabpanel')
    await expect(panel.getByText('Files', { exact: true })).toBeVisible()
    await expect(panel.getByText('Skills', { exact: true })).toBeVisible()
    await expect(panel.getByText('Repositories', { exact: true })).toBeVisible()

    await page.getByRole('tab', { name: 'MCP' }).click()
    const mcpTable = modal.getByRole('table', { name: 'MCP servers' })
    await expect(mcpTable).toBeVisible()
    await expect(mcpTable).toContainText('Context7')

    await page.getByRole('tab', { name: 'Connectors' }).click()
    await expect(modal.getByText('No connectors yet')).toBeVisible()

    await page.getByRole('tab', { name: 'VCS' }).click()
    const vcsTable = modal.getByRole('table', { name: 'VCS connectors' })
    await expect(vcsTable).toBeVisible()
    await expect(vcsTable).toContainText('GitHub')
  })

  test('Context tab repositories — no session selection shows the empty scope, never a fake list (AC37)', async ({ page }) => {
    await goto(page)
    await openCustomize(page)

    const modal = page.getByTestId('customize-modal')
    await page.getByRole('tab', { name: 'Context' }).click()
    const repositories = modal
      .getByRole('tabpanel')
      .locator('.kx-context__row', { hasText: 'Repositories' })

    // Nothing selected: count 0 plus the concise empty note.
    await expect(repositories).toContainText('0 repositories')
    await expect(repositories).toContainText('No repositories selected')
    // The only row is the designed empty note — no repository rows at all.
    await expect(repositories.locator('.kx-context__item')).toHaveCount(1)
    await expect(repositories.locator('.kx-context__item--empty')).toHaveCount(1)
    await expect(repositories.getByText('bsi/hris-frontend-shared')).toHaveCount(0)
    await expect(repositories.getByText('bsi/canteen-backend')).toHaveCount(0)
  })

  test('Context tab repositories — only the committed session subset renders after Done (AC37)', async ({ page }) => {
    await goto(page)

    // Commit a two-repository session scope through the real selector.
    await openRepositoryModal(page)
    const repoDialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    await repoDialog.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }).check()
    await repoDialog.getByRole('checkbox', { name: 'bsi/hris-frontend-promotion' }).check()
    await repoDialog.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI - HRIS')

    await openCustomize(page)
    const modal = page.getByTestId('customize-modal')
    await page.getByRole('tab', { name: 'Context' }).click()
    const repositories = modal
      .getByRole('tabpanel')
      .locator('.kx-context__row', { hasText: 'Repositories' })

    // Exactly the committed subset — count and rows.
    await expect(repositories).toContainText('2 repositories')
    await expect(repositories.getByText('bsi/hris-frontend-shared')).toBeVisible()
    await expect(repositories.getByText('bsi/hris-frontend-promotion')).toBeVisible()
    // Unrelated repositories never render, and the empty note is gone.
    await expect(repositories.getByText('bsi/canteen-backend')).toHaveCount(0)
    await expect(repositories.getByText('kookree/agent-runner')).toHaveCount(0)
    await expect(repositories.getByText('No repositories selected')).toHaveCount(0)
  })

  test('Skills and Tools tabs preserve their content inside the new shell (AC38)', async ({ page }) => {
    await goto(page)
    await openCustomize(page)

    const modal = page.getByTestId('customize-modal')
    await page.getByRole('tab', { name: 'Skills' }).click()
    const skills = modal.getByRole('list', { name: 'Preserved skills' })
    await expect(skills).toBeVisible()
    await expect(skills.getByRole('listitem')).toHaveCount(3)
    await expect(skills).toContainText('Create Jira issues')

    await page.getByRole('tab', { name: 'Tools' }).click()
    const tools = modal.getByRole('list', { name: 'Preserved tools' })
    await expect(tools).toBeVisible()
    await expect(tools.getByRole('listitem')).toHaveCount(3)
    await expect(tools).toContainText('GitHub PR review')
  })

  test('the sliders icon shows its tooltip and opens Customize in one click (AC9)', async ({ page }) => {
    await goto(page)
    const customizeBtn = page.getByRole('button', { name: 'Customize' })

    await customizeBtn.hover()
    await expect(customizeBtn.getByRole('tooltip')).toBeVisible()
    await expect(customizeBtn.getByRole('tooltip')).toHaveText('Customize')

    await customizeBtn.click()
    await expect(page.getByTestId('customize-modal')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Agents' })).toHaveAttribute('aria-selected', 'true')
  })

  test('the sliders icon reveals its Customize tooltip on keyboard focus (AC9/AC45)', async ({ page }) => {
    await goto(page)
    const customizeBtn = page.getByRole('button', { name: 'Customize' })

    await customizeBtn.focus()
    await expect(customizeBtn.getByRole('tooltip')).toBeVisible()
    await expect(customizeBtn.getByRole('tooltip')).toHaveText('Customize')
  })
})
