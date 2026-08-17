import { expect, test, type Locator } from '@playwright/test'
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

test.describe('session context draft (composer correction)', () => {
  test('fresh New Session shows the system placeholder, not the sidebar active system', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('repository-trigger')
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveText('Choose system / repositories')
    await expect(trigger).not.toHaveText('BSI - HRIS')
  })

  test('Cancel discards the draft without committing or leaking global state', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })

    // Switch to BSI Canteen and pick its repository in the draft only.
    await dialog.getByRole('button', { name: /BSI Canteen/ }).click()
    const check = dialog.getByRole('checkbox', { name: 'bsi/canteen-backend' })
    await check.check()
    await expect(check).toBeChecked()

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)

    // No commit: the pill stays on the fresh placeholder.
    await expect(page.getByTestId('repository-trigger')).toHaveText('Choose system / repositories')
    // No global leak: the sidebar still shows the default system.
    await expect(page.getByRole('button', { name: /BSI - HRIS — open system menu/ })).toBeVisible()

    // Reopening reseeds a fresh draft from global, not the cancelled edit.
    await openRepositoryModal(page)
    const reopened = page.getByRole('dialog', { name: 'Choose work repositories' })
    await expect(reopened.locator('.kx-repo-modal__system--active')).toContainText('BSI - HRIS')
  })

  test('Done commits the selected system and labels the session pill with it', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })

    await dialog.getByRole('button', { name: /BSI Canteen/ }).click()
    await dialog.getByRole('checkbox', { name: 'bsi/canteen-backend' }).check()
    await dialog.getByRole('button', { name: 'Done' }).click()
    await expect(dialog).toHaveCount(0)

    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI Canteen')
  })

  test('sidebar system changes after commit do not alter the committed session pill', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    await dialog.getByRole('button', { name: /BSI Canteen/ }).click()
    await dialog.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI Canteen')

    // Change the sidebar system to Kookree — the session pill stays committed.
    await openSystemMenu(page)
    await page
      .getByRole('menu', { name: 'Systems' })
      .getByRole('menuitem', { name: /Kookree/ })
      .click()
    await expect(page.getByRole('button', { name: /Kookree — open system menu/ })).toBeVisible()
    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI Canteen')
  })

  test('repository-sourced Create nests above the suspended selector — Create returns to it, Done commits (session context draft)', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    const repoDialog = page.getByRole('dialog', { name: 'Choose work repositories' })

    // Seed a draft selection before nesting so the return path proves the
    // draft survives the suspended round trip.
    await repoDialog.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }).check()
    await repoDialog.getByRole('button', { name: /Add new system/ }).click()

    const create = page.getByRole('dialog', { name: 'Create a new system' })
    await expect(create).toBeVisible()

    // The repository modal stays mounted behind the nested Create modal:
    // two stacked backdrops, and the suspended selector is aria-hidden —
    // only the Create dialog is accessible and active.
    const suspended = page.locator('.kx-repo-modal--suspended')
    await expect(suspended).toHaveCount(1)
    await expect(suspended).toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator('.kx-modal-backdrop')).toHaveCount(2)
    await expect(page.getByRole('dialog')).toHaveCount(1)

    // Create returns straight to the repository selector with the new
    // system active in the draft — the session context is not committed.
    await create.getByLabel(/Name/).fill('QA Platform')
    await create.getByRole('button', { name: 'Create' }).click()
    await expect(create).toHaveCount(0)
    await expect(repoDialog).toBeVisible()
    await expect(page.locator('.kx-modal-backdrop')).toHaveCount(1)
    await expect(repoDialog.locator('.kx-repo-modal__system--active')).toContainText('QA Platform')
    await expect(repoDialog.getByText(/0 repositories selected/)).toBeVisible()

    // The composer pill still shows the fresh placeholder — uncommitted.
    await expect(page.getByTestId('repository-trigger')).toHaveText('Choose system / repositories')

    // Done is the only commit: it closes the chain and the pill picks up
    // the new system name.
    await repoDialog.getByRole('button', { name: 'Done' }).click()
    await expect(repoDialog).toHaveCount(0)
    await expect(page.getByTestId('repository-trigger')).toHaveText('QA Platform')
  })

  test('nested Cancel and Escape return to the repository selector with the draft intact — no commit', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    const repoDialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    const check = repoDialog.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' })
    await check.check()

    // Cancel — returns to the selector, the draft survives, nothing commits.
    await repoDialog.getByRole('button', { name: /Add new system/ }).click()
    const create = page.getByRole('dialog', { name: 'Create a new system' })
    await expect(create).toBeVisible()
    await create.getByRole('button', { name: 'Cancel' }).click()
    await expect(create).toHaveCount(0)
    await expect(repoDialog).toBeVisible()
    await expect(check).toBeChecked()
    await expect(repoDialog.getByText(/1 repository selected/)).toBeVisible()
    await expect(page.getByTestId('repository-trigger')).toHaveText('Choose system / repositories')

    // Escape from the nested dialog — the same return contract, never a
    // full-chain dismissal and never a commit.
    await repoDialog.getByRole('button', { name: /Add new system/ }).click()
    await expect(create).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(create).toHaveCount(0)
    await expect(repoDialog).toBeVisible()
    await expect(check).toBeChecked()
    await expect(page.getByTestId('repository-trigger')).toHaveText('Choose system / repositories')

    // The surviving draft is still live: Done commits it.
    await repoDialog.getByRole('button', { name: 'Done' }).click()
    await expect(repoDialog).toHaveCount(0)
    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI - HRIS')
  })

  test('nested Create stacks above the suspended selector and fits both viewports without form/footer overlap', async ({ page }) => {
    const zIndex = (locator: Locator) =>
      locator.evaluate((element) => Number(getComputedStyle(element).zIndex))

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1200, height: 720 },
    ]) {
      await page.setViewportSize(viewport)
      await goto(page)
      await openRepositoryModal(page)
      await page
        .getByRole('dialog', { name: 'Choose work repositories' })
        .getByRole('button', { name: /Add new system/ })
        .click()

      const create = page.getByRole('dialog', { name: 'Create a new system' })
      await expect(create).toBeVisible()
      const suspended = page.locator('.kx-repo-modal--suspended')
      await expect(suspended).toHaveCount(1)

      // Dedicated stacking layers: the nested Create dialog (61) and its
      // backdrop (60) sit strictly above the suspended repository modal (51).
      const createZ = await zIndex(create)
      const suspendedZ = await zIndex(suspended)
      const backdropZ = await zIndex(page.locator('.kx-modal-backdrop--nested'))
      expect(createZ).toBeGreaterThan(suspendedZ)
      expect(backdropZ).toBeGreaterThan(suspendedZ)

      // The top dialog is fully inside the viewport on both axes.
      const box = await create.boundingBox()
      expect(box, `create dialog renders at ${viewport.width}x${viewport.height}`).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)

      // The scrolling form body never overlaps the pinned footer.
      const bodyBox = await create.locator('.kx-create-modal__body').boundingBox()
      const footerBox = await create.locator('.kx-create-modal__footer').boundingBox()
      expect(bodyBox!.y + bodyBox!.height).toBeLessThanOrEqual(footerBox!.y + 1)
    }
  })

  test('system-menu Create activates the sidebar system but leaves the committed session pill unchanged', async ({ page }) => {
    await goto(page)
    await openRepositoryModal(page)
    const repoDialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    await repoDialog.getByRole('button', { name: /BSI Canteen/ }).click()
    await repoDialog.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI Canteen')

    await openSystemMenu(page)
    await page
      .getByRole('menu', { name: 'Systems' })
      .getByRole('menuitem', { name: /Create new system/ })
      .click()
    const createDialog = page.getByRole('dialog', { name: 'Create a new system' })
    await createDialog.getByLabel(/Name/).fill('QA Platform')
    await createDialog.getByRole('button', { name: 'Create' }).click()
    await expect(createDialog).toHaveCount(0)

    await expect(page.getByRole('button', { name: /QA Platform — open system menu/ })).toBeVisible()
    await expect(page.getByTestId('repository-trigger')).toHaveText('BSI Canteen')
  })
})
