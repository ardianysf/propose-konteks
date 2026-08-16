import { expect, test } from '@playwright/test'
import { goto, openRepositoryModal, openSystemMenu } from './helpers'

test.describe('system / repository flow', () => {
  test('repositories group under one active system with checkboxes disabled outside it (AC25)', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)

    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    await expect(dialog).toBeVisible()

    const active = dialog.locator('.kx-repo-modal__system--active')
    await expect(active).toContainText('BSI - HRIS')
    const activeChecks = active.locator('input[type="checkbox"]')
    await expect(activeChecks).toHaveCount(3)
    for (let i = 0; i < 3; i += 1) {
      await expect(activeChecks.nth(i)).toBeEnabled()
    }

    const canteen = dialog.locator('.kx-repo-modal__system', { hasText: 'BSI Canteen' })
    const canteenChecks = canteen.locator('input[type="checkbox"]')
    await expect(canteenChecks).toHaveCount(2)
    for (let i = 0; i < 2; i += 1) {
      await expect(canteenChecks.nth(i)).toBeDisabled()
    }
  })

  test('switching the active system clears the repository selection (AC26)', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)

    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    const check = dialog.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' })
    await check.check()
    await expect(check).toBeChecked()

    await dialog.getByRole('button', { name: /BSI Canteen/ }).click()
    await expect(dialog.locator('.kx-repo-modal__system--active')).toContainText('BSI Canteen')
    await expect(check).not.toBeChecked()
  })

  test('search filters systems and repositories with Add new system pinned at the top (AC27)', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)

    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    const addSystem = dialog.getByRole('button', { name: /Add new system/ })
    const search = dialog.getByRole('searchbox', { name: 'Search systems or repositories' })

    const addBox = await addSystem.boundingBox()
    const searchBox = await search.boundingBox()
    expect(addBox!.y).toBeLessThan(searchBox!.y)

    await search.fill('canteen')
    await expect(dialog.locator('.kx-repo-modal__system')).toHaveCount(1)
    await expect(dialog.locator('.kx-repo-modal__system')).toContainText('BSI Canteen')
  })

  test('Add repository manually appears only inside the active system with a single-line footer (AC28)', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)

    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    await expect(dialog.getByRole('button', { name: /Add repository manually/ })).toHaveCount(1)
    await expect(dialog.locator('.kx-repo-modal__system--active')).toContainText('Add repository manually')

    await expect(dialog.locator('.kx-repo-modal__footer')).toBeVisible()
    await expect(dialog.locator('.kx-repo-modal__footer .kx-repo-modal__actions')).toHaveCount(1)
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await dialog.getByRole('button', { name: /BSI Canteen/ }).click()
    await expect(dialog.locator('.kx-repo-modal__system--active')).toContainText('BSI Canteen')
    await expect(dialog.locator('.kx-repo-modal__system--active')).toContainText('Add repository manually')
    await expect(dialog.getByRole('button', { name: /Add repository manually/ })).toHaveCount(1)
  })

  test('manual repository form exposes the full field set and Connect disabled validation (AC29)', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    await page
      .getByRole('dialog', { name: 'Choose work repositories' })
      .getByRole('button', { name: /Add repository manually/ })
      .click()

    const manual = page.getByRole('dialog', { name: 'Add repository manually' })
    await expect(manual).toBeVisible()
    await expect(manual.getByLabel('VCS Connector')).toBeVisible()
    await expect(manual.getByLabel('Execution')).toBeVisible()
    await expect(manual.getByRole('button', { name: /Enter URL manually/ })).toBeVisible()
    await expect(manual.getByText('3 results')).toBeVisible()
    await expect(manual.getByText('Page 1 of 2')).toBeVisible()
    await expect(manual.getByRole('checkbox', { name: 'Require private network' })).toBeVisible()

    const connect = manual.getByRole('button', { name: 'Connect' })
    await expect(connect).toBeDisabled()

    await manual.getByRole('button', { name: /bsi\/hris-frontend-shared/ }).click()
    await expect(manual.locator('.kx-chip')).toHaveCount(1)
    await expect(manual.locator('.kx-chip')).toContainText('bsi/hris-frontend-shared')
    await expect(manual.getByRole('button', { name: /Add another repository/ })).toBeVisible()
    await expect(connect).toBeDisabled()

    await manual.getByLabel('VCS Connector').selectOption('github')
    await manual.getByLabel('Execution').selectOption('profile-default')
    await expect(connect).toBeEnabled()

    await manual.getByRole('button', { name: 'Remove bsi/hris-frontend-shared' }).click()
    await expect(manual.locator('.kx-chip')).toHaveCount(0)
    await expect(connect).toBeDisabled()
  })

  test('Create System requires a name and the new system becomes active (AC33)', async ({ page }) => {
    await goto(page)
    await openSystemMenu(page)
    await page
      .getByRole('menu', { name: 'Systems' })
      .getByRole('menuitem', { name: /Create new system/ })
      .click()

    const dialog = page.getByRole('dialog', { name: 'Create a new system' })
    await expect(dialog).toBeVisible()
    const create = dialog.getByRole('button', { name: 'Create' })
    await expect(create).toBeDisabled()

    await dialog.getByLabel(/Name/).fill('QA Platform')
    await expect(create).toBeEnabled()
    await create.click()
    await expect(dialog).toHaveCount(0)

    await expect(page.getByRole('button', { name: /QA Platform — open system menu/ })).toBeVisible()

    await openSystemMenu(page)
    await expect(page.getByRole('menu', { name: 'Systems' })).toContainText('QA Platform')
  })

  test('Create System marks Description optional and shows the required grouping helper (AC33)', async ({ page }) => {
    await goto(page)
    await openSystemMenu(page)
    await page
      .getByRole('menu', { name: 'Systems' })
      .getByRole('menuitem', { name: /Create new system/ })
      .click()

    const dialog = page.getByRole('dialog', { name: 'Create a new system' })
    await expect(dialog).toBeVisible()

    await expect(dialog.locator('.kx-create-modal__req')).toHaveText('(required)')
    await expect(dialog.locator('.kx-create-modal__opt')).toHaveText('(optional)')
    await expect(dialog.locator('.kx-create-modal__helper')).toHaveText(
      'Systems group repositories and components so sessions start with the right scope.',
    )
  })

  test('repository modal renders loading and empty demo variants (AC43)', async ({ page }) => {
    await goto(page, '/?mock=loading')
    await openRepositoryModal(page)
    await expect(page.locator('.kx-repo-modal__loading')).toBeVisible()

    await goto(page, '/?mock=empty')
    await openRepositoryModal(page)
    await expect(page.getByText('No systems yet')).toBeVisible()
  })
})
