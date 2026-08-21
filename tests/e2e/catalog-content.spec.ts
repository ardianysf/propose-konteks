import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Catalog content E2E (T4, spec AC5/AC6/AC7): real catalog pages render
 * their content, the theme toggle flips live token values, the components
 * index links the two T4 sample entries to working detail pages (live
 * preview + contract/meta sections), and every catalog page is axe
 * WCAG2AA-clean at both spec viewports.
 *
 * Patterns copied from catalog-shell.spec.ts (gotoCatalog/nav/main,
 * console+pageerror capture) and accessibility.spec.ts (AxeBuilder with
 * the wcag2aa tag).
 */

const nav = (page: Page) => page.getByRole('navigation', { name: 'Catalog' })
const main = (page: Page) => page.locator('main.kx-cat-main')

async function gotoCatalog(page: Page, path = '/catalog') {
  await page.goto(path)
  await expect(nav(page)).toBeVisible()
}

/** Collect console errors + page errors while `run` executes. */
async function captureErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  await run()
  expect(errors).toEqual([])
}

async function expectNoWcag2aaViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()
  expect(
    results.violations,
    `${label}: ${JSON.stringify(results.violations, null, 2)}`,
  ).toEqual([])
}

test.describe('catalog content', () => {
  test('overview renders its core content without console errors', async ({
    page,
  }) => {
    await captureErrors(page, async () => {
      await gotoCatalog(page)
      await expect(
        main(page).getByRole('heading', { name: 'Konteks Design System' }),
      ).toBeVisible()
      // Core sections of the real overview content (T4).
      await expect(
        main(page).getByRole('heading', { name: 'Dual-output repository' }),
      ).toBeVisible()
      await expect(
        main(page).getByRole('heading', { name: 'Klasifikasi komponen' }),
      ).toBeVisible()
      // Classification cards carry their badge labels.
      for (const label of ['Adoptable', 'Mockup-coupled', 'Internal', 'Utility']) {
        await expect(main(page).getByText(label, { exact: true })).toBeVisible()
      }
      await expect(
        main(page).getByRole('heading', { name: 'Cara AI memakai katalog ini' }),
      ).toBeVisible()
      await expect(
        main(page).getByRole('heading', { name: 'Contoh komposisi' }),
      ).toBeVisible()
      // Composition table lists the domain groups (chips per component).
      await expect(main(page).locator('table.kx-cat-table')).toBeVisible()
    })
  })

  test('tokens page groups render and the theme toggle flips live token values', async ({
    page,
  }) => {
    await gotoCatalog(page, '/catalog/tokens')

    // All three token groups render with their rows.
    for (const title of ['Colors', 'Typography', 'Dimensions']) {
      await expect(main(page).getByRole('heading', { name: title })).toBeVisible()
    }
    await expect(
      main(page).locator('code.kx-cat-token-name', { hasText: '--kx-canvas' }),
    ).toBeVisible()

    const html = page.locator('html')
    const toggle = main(page).getByRole('group', { name: 'Theme pratinjau' })
    await expect(toggle).toBeVisible()

    // Establish a known baseline: the toggle's Light button stamps
    // data-theme="light" on <html> and re-reads computed values.
    await toggle.getByRole('button', { name: 'Light' }).click()
    await expect(html).toHaveAttribute('data-theme', 'light')

    // The displayed value chips are read live via getComputedStyle, so
    // --kx-canvas (a theme-aware palette token) must flip with the theme.
    const canvasRow = main(page)
      .locator('li.kx-cat-token-row', { hasText: '--kx-canvas' })
      .first()
    const canvasChip = canvasRow.locator('.kx-cat-value-chip')
    const lightValue = (await canvasChip.textContent())?.trim()
    expect(lightValue).toBeTruthy()
    expect(lightValue).not.toBe('—')

    await toggle.getByRole('button', { name: 'Dark' }).click()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    // Robust assertion: wait for the re-read value to actually change.
    await expect
      .poll(async () => (await canvasChip.textContent())?.trim())
      .not.toBe(lightValue)
    const darkValue = (await canvasChip.textContent())?.trim()
    expect(darkValue).toBeTruthy()
    expect(darkValue).not.toBe(lightValue)

    // aria-pressed follows the active theme option.
    await expect(toggle.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(toggle.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  test('components index groups entries per domain and links both samples to details', async ({
    page,
  }) => {
    await gotoCatalog(page, '/catalog/components')
    await expect(main(page).getByRole('heading', { name: 'Components' })).toBeVisible()

    // Entries are grouped per domain (component domains + internal + utility).
    for (const domain of [
      'account',
      'composer',
      'context',
      'customize',
      'reviews',
      'session',
      'shell',
      'system',
      'internal',
      'utility',
    ]) {
      await expect(
        main(page).locator(`#kx-cat-domain-${domain}`),
      ).toBeVisible()
    }

    // The two T4 sample entries are links inside their domain groups.
    const workspaceMenuLink = main(page).getByRole('link', { name: 'WorkspaceMenu' })
    const sessionStatusBadgeLink = main(page).getByRole('link', {
      name: 'SessionStatusBadge',
    })
    await expect(workspaceMenuLink).toHaveAttribute(
      'href',
      '/catalog/components/workspace-menu',
    )
    await expect(sessionStatusBadgeLink).toHaveAttribute(
      'href',
      '/catalog/components/session-status-badge',
    )

    // Clicking each sample entry opens its detail page.
    await workspaceMenuLink.click()
    expect(new URL(page.url()).pathname).toBe('/catalog/components/workspace-menu')
    await expect(
      main(page).getByRole('heading', { name: 'WorkspaceMenu' }),
    ).toBeVisible()

    await main(page).getByRole('link', { name: 'Components' }).first().click()
    expect(new URL(page.url()).pathname).toBe('/catalog/components')
    await sessionStatusBadgeLink.click()
    expect(new URL(page.url()).pathname).toBe('/catalog/components/session-status-badge')
    await expect(
      main(page).getByRole('heading', { name: 'SessionStatusBadge' }),
    ).toBeVisible()
  })

  test('workspace-menu detail shows the live preview and contract/meta sections', async ({
    page,
  }) => {
    await gotoCatalog(page, '/catalog/components/workspace-menu')
    await expect(
      main(page).getByRole('heading', { name: 'WorkspaceMenu' }),
    ).toBeVisible()
    await expect(
      main(page).getByRole('heading', { name: 'Live preview' }),
    ).toBeVisible()

    // The preview renders the real WorkspaceMenu (menu role + its item).
    const preview = main(page).locator('.kx-cat-preview-frame')
    await expect(preview.getByRole('menu', { name: 'Workspace' })).toBeVisible()
    await expect(preview.getByRole('menuitem')).toBeVisible()

    // Contract + usage + meta sections render manifest-driven content.
    await expect(
      main(page).getByRole('heading', { name: 'API contract' }),
    ).toBeVisible()
    await expect(
      main(page).getByRole('heading', { name: 'Contoh pemakaian' }),
    ).toBeVisible()
    await expect(
      main(page).getByRole('heading', { name: 'Meta', exact: true }),
    ).toBeVisible()
    // Meta list carries the manifest values for this entry.
    await expect(main(page).locator('dl.kx-cat-meta')).toContainText('cssFiles')
    await expect(main(page).locator('dl.kx-cat-meta')).toContainText(
      'src/styles/components.css',
    )
    await expect(main(page).locator('dl.kx-cat-meta')).toContainText('adoptionNotes')
  })

  test('session-status-badge detail shows status variant previews and sections', async ({
    page,
  }) => {
    await gotoCatalog(page, '/catalog/components/session-status-badge')
    await expect(
      main(page).getByRole('heading', { name: 'SessionStatusBadge' }),
    ).toBeVisible()

    // The fixture preview renders one badge per previewed status variant.
    const preview = main(page).locator('.kx-cat-preview-frame')
    for (const label of ['In Progress', 'Waiting Approval', 'Delivering', 'Completed']) {
      await expect(
        preview.locator('[data-testid="session-status"]', { hasText: label }),
      ).toBeVisible()
    }
    // Variant labels mirror the status codes.
    for (const code of ['in_progress', 'waiting_approval', 'delivering', 'completed']) {
      await expect(preview.getByText(code, { exact: true })).toBeVisible()
    }

    // Contract + meta sections: coupled entries document their context reads.
    await expect(
      main(page).getByRole('heading', { name: 'API contract' }),
    ).toBeVisible()
    await expect(main(page).locator('.kx-cat-contract')).toContainText('sessionDetail')
    await expect(
      main(page).getByRole('heading', { name: 'Contoh pemakaian' }),
    ).toBeVisible()
    await expect(
      main(page).getByRole('heading', { name: 'Meta', exact: true }),
    ).toBeVisible()
    await expect(main(page).locator('dl.kx-cat-meta')).toContainText('fixtureRef')
  })

  test.describe('axe wcag2aa', () => {
    const PAGES: Array<{ label: string; path: string }> = [
      { label: 'overview', path: '/catalog' },
      { label: 'tokens', path: '/catalog/tokens' },
      { label: 'components index', path: '/catalog/components' },
      { label: 'workspace-menu detail', path: '/catalog/components/workspace-menu' },
      {
        label: 'session-status-badge detail',
        path: '/catalog/components/session-status-badge',
      },
    ]
    const VIEWPORTS: Array<{ width: number; height: number }> = [
      { width: 1440, height: 900 },
      { width: 1200, height: 720 },
    ]

    for (const viewport of VIEWPORTS) {
      for (const { label, path } of PAGES) {
        test(`${label} has zero violations at ${viewport.width}x${viewport.height}`, async ({
          page,
        }) => {
          await page.setViewportSize(viewport)
          await gotoCatalog(page, path)
          // Wait for the page's main heading (and, on detail pages, the
          // async live preview) so axe scans the fully rendered content.
          await expect(
            main(page).locator('h1.kx-cat-title').first(),
          ).toBeVisible()
          if (path.startsWith('/catalog/components/')) {
            await expect(
              main(page)
                .locator('.kx-cat-preview-frame')
                .locator('.kx-cat-placeholder'),
            ).toHaveCount(0)
          }
          await expectNoWcag2aaViolations(
            page,
            `${label} @ ${viewport.width}x${viewport.height}`,
          )
        })
      }
    }
  })
})
