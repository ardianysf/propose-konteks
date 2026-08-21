import { expect, test, type Page } from '@playwright/test'

/**
 * Catalog shell E2E (T2, spec AC2/AC3): dual entry renders without console
 * errors, clean URL navigation works, deep links survive reload, back/forward
 * works, and unknown paths land on the documented not-found page.
 */

const nav = (page: Page) => page.getByRole('navigation', { name: 'Catalog' })
const main = (page: Page) => page.locator('main.kx-cat-main')

async function gotoCatalog(page: Page, path = '/catalog') {
  await page.goto(path)
  await expect(nav(page)).toBeVisible()
}

test.describe('catalog shell', () => {
  test('overview renders at /catalog without console errors (AC2)', async ({ page }) => {
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

  test('clicking nav updates the pathname and the rendered page (AC3)', async ({ page }) => {
    await gotoCatalog(page)

    await nav(page).getByRole('link', { name: 'Tokens' }).click()
    expect(new URL(page.url()).pathname).toBe('/catalog/tokens')
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await expect(nav(page).getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await nav(page).getByRole('link', { name: 'Components' }).click()
    expect(new URL(page.url()).pathname).toBe('/catalog/components')
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()
  })

  test('deep link /catalog/tokens survives a reload (AC3)', async ({ page }) => {
    await gotoCatalog(page, '/catalog/tokens')
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()

    await page.reload()
    await expect(nav(page)).toBeVisible()
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await expect(nav(page).getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('browser back/forward works after clean URL navigation (AC3)', async ({ page }) => {
    await gotoCatalog(page)

    await nav(page).getByRole('link', { name: 'Tokens' }).click()
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await nav(page).getByRole('link', { name: 'Components' }).click()
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()

    await page.goBack()
    expect(new URL(page.url()).pathname).toBe('/catalog/tokens')
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()

    await page.goForward()
    expect(new URL(page.url()).pathname).toBe('/catalog/components')
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()
  })

  test('unknown path renders the documented not-found page (AC3)', async ({ page }) => {
    await gotoCatalog(page, '/catalog/does-not-exist')
    await expect(
      main(page).getByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeVisible()
    await expect(main(page).getByText('/catalog/does-not-exist')).toBeVisible()
    // Recovery links back to known routes are offered.
    await main(page).getByRole('link', { name: 'Tokens' }).click()
    await expect(main(page).getByRole('heading', { name: 'Tokens' })).toBeVisible()
  })

  test('malformed percent-encoded path renders not-found without page errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    // '%' alone is invalid percent-encoding; before the fix this threw a
    // URIError during path parsing and crashed the render.
    await gotoCatalog(page, '/catalog/components/%')
    await expect(
      main(page).getByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeVisible()
    await expect(main(page).getByText('/catalog/components/%')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('catalog enables vertical scrolling via kx-catalog-page class (catalog-scroll-fix)', async ({
    page,
  }) => {
    await gotoCatalog(page)

    // Verify the catalog-scoped class is added to html element
    const htmlClass = await page.evaluate(() => document.documentElement.classList.toString())
    expect(htmlClass).toContain('kx-catalog-page')

    // Verify body overflow is not hidden (catalog scroll is enabled)
    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflowY)
    expect(bodyOverflow).toBe('auto')

    // Verify html overflow is not hidden (catalog scroll is enabled)
    const htmlOverflow = await page.evaluate(
      () => getComputedStyle(document.documentElement).overflowY,
    )
    expect(htmlOverflow).toBe('auto')

    // Verify horizontal overflow is still hidden (no horizontal scroll)
    const bodyOverflowX = await page.evaluate(() => getComputedStyle(document.body).overflowX)
    expect(bodyOverflowX).toBe('hidden')
  })

  test('catalog scroll works on long pages', async ({ page }) => {
    // Navigate to tokens page which has many token rows
    await gotoCatalog(page, '/catalog/tokens')

    // Get the initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY)
    expect(initialScrollY).toBe(0)

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollAfterDown = await page.evaluate(() => window.scrollY)
    expect(scrollAfterDown).toBeGreaterThan(0)

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0))
    const scrollAfterUp = await page.evaluate(() => window.scrollY)
    expect(scrollAfterUp).toBe(0)

    // Verify the page is actually scrollable (has scrollable content)
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight)
    expect(scrollHeight).toBeGreaterThan(clientHeight)
  })
})
