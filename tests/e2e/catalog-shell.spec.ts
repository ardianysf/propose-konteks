import { expect, test, type Page } from '@playwright/test'

/**
 * Catalog shell E2E (T2, spec AC2/AC3): dual entry renders without console
 * errors, hash navigation works, deep links survive reload, back/forward
 * works, and unknown hashes land on the documented not-found page.
 */

const nav = (page: Page) => page.getByRole('navigation', { name: 'Catalog' })
const main = (page: Page) => page.locator('main.kx-cat-main')

async function gotoCatalog(page: Page, hash = '') {
  await page.goto(`/catalog.html${hash}`)
  await expect(nav(page)).toBeVisible()
}

test.describe('catalog shell', () => {
  test('overview renders at /catalog.html without console errors (AC2)', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await gotoCatalog(page)
    await expect(page).toHaveTitle('Konteks Design System')
    await expect(
      main(page).getByRole('heading', { name: 'Konteks Design System' }),
    ).toBeVisible()
    await expect(nav(page).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    expect(errors).toEqual([])
  })

  test('clicking nav updates the hash and the rendered page (AC3)', async ({ page }) => {
    await gotoCatalog(page)

    await nav(page).getByRole('link', { name: 'Tokens' }).click()
    expect(new URL(page.url()).hash).toBe('#/tokens')
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await expect(nav(page).getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await nav(page).getByRole('link', { name: 'Components' }).click()
    expect(new URL(page.url()).hash).toBe('#/components')
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()
  })

  test('deep link #/tokens survives a reload (AC3)', async ({ page }) => {
    await gotoCatalog(page, '#/tokens')
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()

    await page.reload()
    await expect(nav(page)).toBeVisible()
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await expect(nav(page).getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('browser back/forward works after hash navigation (AC3)', async ({ page }) => {
    await gotoCatalog(page)

    await nav(page).getByRole('link', { name: 'Tokens' }).click()
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await nav(page).getByRole('link', { name: 'Components' }).click()
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()

    await page.goBack()
    expect(new URL(page.url()).hash).toBe('#/tokens')
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()

    await page.goForward()
    expect(new URL(page.url()).hash).toBe('#/components')
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()
  })

  test('unknown hash renders the documented not-found page (AC3)', async ({ page }) => {
    await gotoCatalog(page, '#/does-not-exist')
    await expect(
      main(page).getByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeVisible()
    await expect(main(page).getByText('#/does-not-exist')).toBeVisible()
    // Recovery links back to known routes are offered.
    await main(page).getByRole('link', { name: 'Tokens' }).click()
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
  })

  test('malformed percent-encoded hash renders not-found without page errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    // '%' alone is invalid percent-encoding; before the fix this threw a
    // URIError during hash parsing and crashed the render.
    await gotoCatalog(page, '#/components/%')
    await expect(
      main(page).getByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeVisible()
    await expect(main(page).getByText('#/components/%')).toBeVisible()

    expect(errors).toEqual([])
  })
})
