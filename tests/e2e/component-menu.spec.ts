import { expect, test } from '@playwright/test'
import { goto } from './helpers'

test.describe('component menu', () => {
  test('opens anchored to the Component button with no modal or backdrop (AC30)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('component-trigger')
    await trigger.click()

    const menu = page.getByTestId('component-menu')
    await expect(menu).toBeVisible()
    await expect(page.locator('.kx-modal-backdrop')).toHaveCount(0)

    const triggerBox = await trigger.boundingBox()
    const menuBox = await menu.boundingBox()
    expect(Math.abs(menuBox!.x - triggerBox!.x)).toBeLessThan(2)
  })

  test('renders flat rows with name + repository and no component-type chip (AC31)', async ({ page }) => {
    await goto(page)
    await page.getByTestId('component-trigger').click()

    const menu = page.getByTestId('component-menu')
    const firstRow = menu.locator('.kx-component-menu__row').first()
    await expect(firstRow).toContainText('hris-web')
    await expect(firstRow).toContainText('bsi/hris-frontend-shared')
    await expect(menu.locator('.kx-component-menu__row .kx-chip')).toHaveCount(0)
  })

  test('component pill reflects placeholder → one name → multiple count → cleared placeholder (AC32)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('component-trigger')
    await expect(trigger).toHaveText('Choose component')

    await trigger.click()
    const menu = page.getByTestId('component-menu')

    await menu.getByRole('menuitemcheckbox', { name: /canteen-api/ }).check()
    await expect(trigger).toHaveText('canteen-api')

    await menu.getByRole('menuitemcheckbox', { name: /canteen-cms/ }).check()
    await expect(trigger).toHaveText('2 components')

    await menu.getByRole('menuitem', { name: 'Clear' }).click()
    await expect(trigger).toHaveText('Choose component')
  })

  test('searches by component or repository and supports multi-select count + Clear (AC32)', async ({ page }) => {
    await goto(page)
    await page.getByTestId('component-trigger').click()

    const menu = page.getByTestId('component-menu')
    const search = menu.getByRole('searchbox', { name: 'Search components or repositories' })

    await search.fill('canteen')
    await expect(menu.locator('.kx-component-menu__row')).toHaveCount(2)

    await search.fill('mytok')
    await expect(menu.locator('.kx-component-menu__row')).toHaveCount(1)
    await expect(menu.locator('.kx-component-menu__row')).toContainText('mytok-mobile')

    await search.fill('')
    await expect(menu.locator('.kx-component-menu__row')).toHaveCount(13)

    await menu.getByRole('menuitemcheckbox', { name: /hris-web/ }).check()
    await menu.getByRole('menuitemcheckbox', { name: /canteen-api/ }).check()
    await expect(menu.getByText('2 selected')).toBeVisible()

    await menu.getByRole('menuitem', { name: 'Clear' }).click()
    await expect(menu.getByText('0 selected')).toBeVisible()
    await expect(menu.getByRole('menuitemcheckbox', { name: /hris-web/ })).not.toBeChecked()
  })

  test('component menu renders empty and loading demo variants (AC43)', async ({ page }) => {
    await goto(page, '/?mock=empty')
    await page.getByTestId('component-trigger').click()
    await expect(page.getByText('No components yet')).toBeVisible()

    await goto(page, '/?mock=loading')
    await page.getByTestId('component-trigger').click()
    await expect(page.locator('.kx-component-menu__loading')).toBeVisible()
  })
})
