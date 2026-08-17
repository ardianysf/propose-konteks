import { expect, test } from '@playwright/test'
import {
  goto,
  mainCanvas,
  openCustomize,
  openSystemMenu,
  pressEscape,
  sidebar,
  sidebarWidth,
} from './helpers'

test.describe('shell', () => {
  test('renders the shell with a white 240px sidebar, matcha canvas, and DM Sans (AC1)', async ({ page }) => {
    await goto(page)
    await expect.poll(() => sidebarWidth(page)).toBe(240)
    await expect(sidebar(page)).toBeVisible()

    const bg = await mainCanvas(page).evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(250, 248, 239)') // #FAF8EF

    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(font).toContain('DM Sans')
  })

  test('main canvas has 19.5px top-left and bottom-left corners (AC2)', async ({ page }) => {
    await goto(page)
    const radii = await mainCanvas(page).evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        topLeft: s.borderTopLeftRadius,
        topRight: s.borderTopRightRadius,
        bottomLeft: s.borderBottomLeftRadius,
        bottomRight: s.borderBottomRightRadius,
      }
    })
    expect(radii.topLeft).toBe('19.5px')
    expect(radii.bottomLeft).toBe('19.5px')
    expect(radii.topRight).toBe('0px')
    expect(radii.bottomRight).toBe('0px')
  })

  test('radial matcha glow is present and non-interactive (AC3)', async ({ page }) => {
    await goto(page)
    const glow = await mainCanvas(page).evaluate((el) => {
      const s = getComputedStyle(el, '::before')
      return { pointerEvents: s.pointerEvents, backgroundImage: s.backgroundImage }
    })
    expect(glow.pointerEvents).toBe('none')
    expect(glow.backgroundImage).toContain('radial-gradient')
  })

  test('resolves only Warm Enterprise palette tokens and on-palette surfaces (AC4)', async ({ page }) => {
    await goto(page)
    const tokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      const read = (name: string) => styles.getPropertyValue(name).trim()
      return {
        canvas: read('--kx-canvas'),
        raised: read('--kx-raised'),
        primary: read('--kx-primary'),
        secondary: read('--kx-secondary'),
        muted: read('--kx-muted'),
        border: read('--kx-border'),
        pale: read('--kx-pale'),
        accent: read('--kx-accent'),
        accentStrong: read('--kx-accent-strong'),
      }
    })

    const expandHex = (value: string) => {
      const normalized = value.toLowerCase()
      return normalized.replace(
        /^#([0-9a-f])([0-9a-f])([0-9a-f])$/,
        '#$1$1$2$2$3$3',
      )
    }

    expect(expandHex(tokens.canvas)).toBe('#faf8ef')
    expect(expandHex(tokens.raised)).toBe('#ffffff')
    expect(expandHex(tokens.primary)).toBe('#243025')
    expect(expandHex(tokens.secondary)).toBe('#58735a')
    expect(expandHex(tokens.muted)).toBe('#778c78')
    expect(expandHex(tokens.border)).toBe('#e2e9d5')
    expect(expandHex(tokens.pale)).toBe('#f4f8ee')
    expect(expandHex(tokens.accent)).toBe('#8fbf6a')
    expect(expandHex(tokens.accentStrong)).toBe('#5f8d4e')

    const sidebarBg = await sidebar(page).evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(sidebarBg).toBe('rgb(255, 255, 255)')
    const canvasBg = await mainCanvas(page).evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(canvasBg).toBe('rgb(250, 248, 239)')
  })

  test('typography scale tokens resolve to the exact DM Sans 24→10 scale (AC5)', async ({ page }) => {
    await goto(page)
    const scale = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      const read = (name: string) => styles.getPropertyValue(name).trim()
      return {
        threeXl: read('--kx-text-3xl'),
        twoXl: read('--kx-text-2xl'),
        xl: read('--kx-text-xl'),
        l: read('--kx-text-l'),
        md: read('--kx-text-md'),
        sm: read('--kx-text-sm'),
        xs: read('--kx-text-xs'),
        twoXs: read('--kx-text-2xs'),
        body: getComputedStyle(document.body).fontSize,
      }
    })

    expect(scale).toEqual({
      threeXl: '24px',
      twoXl: '20px',
      xl: '18px',
      l: '16px',
      md: '13px',
      sm: '12px',
      xs: '11px',
      twoXs: '10px',
      body: '13px',
    })
  })

  test('workspace box is the only persistent boxed container in the sidebar (AC6)', async ({ page }) => {
    await goto(page)
    const boxes = page.locator('.kx-sidebar-box')
    await expect(boxes).toHaveCount(1)
    await expect(boxes).toHaveClass(/kx-sidebar__workspace/)
    await expect(boxes).toContainText('Refactory')
  })

  test('workspace and system controls carry chevrons and open menus to the right (AC7)', async ({ page }) => {
    await goto(page)
    const navBox = await sidebar(page).boundingBox()

    const workspaceBtn = page.getByRole('button', { name: /workspace$/i })
    await expect(workspaceBtn.locator('svg[data-icon="chevron-right"]')).toBeAttached()
    await workspaceBtn.click()
    const wsMenu = page.getByRole('menu', { name: 'Workspace' })
    await expect(wsMenu).toBeVisible()
    const wsMenuBox = await wsMenu.boundingBox()
    expect(wsMenuBox!.x).toBeGreaterThanOrEqual(navBox!.x + navBox!.width)
    await pressEscape(page)

    const systemBtn = page.getByRole('button', { name: /open system menu/i })
    await expect(systemBtn.locator('svg[data-icon="chevron-right"]')).toBeAttached()
    await systemBtn.click()
    const sysMenu = page.getByRole('menu', { name: 'Systems' })
    await expect(sysMenu).toBeVisible()
    const sysMenuBox = await sysMenu.boundingBox()
    expect(sysMenuBox!.x).toBeGreaterThanOrEqual(navBox!.x + navBox!.width)
  })

  test('system menu has no avatar imagery and rows show icon, name, and count only (AC8)', async ({ page }) => {
    await goto(page)
    await openSystemMenu(page)
    const menu = page.getByRole('menu', { name: 'Systems' })
    await expect(menu.locator('img')).toHaveCount(0)
    await expect(menu.getByText('All systems', { exact: true })).toBeVisible()

    const firstRow = menu.locator('.kx-system-menu__item').first()
    await expect(firstRow).toContainText('BSI - HRIS')
    await expect(firstRow).toContainText('3 repositories')
    await expect(firstRow.locator('svg[data-icon="system"]')).toBeAttached()
  })

  test('system menu pins All systems above a search-filtered list (AC13)', async ({ page }) => {
    await goto(page)
    await openSystemMenu(page)
    const menu = page.getByRole('menu', { name: 'Systems' })

    const all = menu.locator('.kx-system-menu__all')
    await expect(all).toBeVisible()
    await expect(all).toContainText('All systems')

    const list = menu.locator('.kx-system-menu__list')
    const allBox = await all.boundingBox()
    const listBox = await list.boundingBox()
    expect(allBox).not.toBeNull()
    expect(listBox).not.toBeNull()
    expect(allBox!.y).toBeLessThan(listBox!.y)

    const search = menu.getByRole('searchbox', { name: 'Search systems' })
    await search.fill('canteen')
    await expect(menu.locator('.kx-system-menu__item')).toHaveCount(1)
    await expect(menu.locator('.kx-system-menu__item')).toContainText('BSI Canteen')
    await expect(all).toBeVisible()

    await search.fill('zzz-no-match')
    await expect(menu.locator('.kx-system-menu__item')).toHaveCount(0)
    await expect(menu.getByText('No systems match your search.')).toBeVisible()
    await expect(all).toBeVisible()

    await search.fill('')
    await expect(menu.locator('.kx-system-menu__item')).toHaveCount(9)
  })

  test('recent sessions are chronological with system and time on each row (AC10)', async ({ page }) => {
    await goto(page)
    const rows = page.getByRole('list', { name: 'Recent sessions' }).getByRole('listitem')
    await expect(rows).toHaveCount(5)
    await expect(rows.nth(0)).toContainText('EDP Integration Fix - Mobile')
    await expect(rows.nth(0)).toContainText('BSI - HRIS')
    await expect(rows.nth(0)).toContainText('2h ago')
    await expect(rows.nth(4)).toContainText('Validate delivery evidence')
  })

  test('View all opens Session History while the sidebar stays byte-identical (AC11)', async ({ page }) => {
    await goto(page)
    const before = await sidebar(page).evaluate((el) => el.outerHTML)
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
    const after = await sidebar(page).evaluate((el) => el.outerHTML)
    expect(after).toBe(before)
  })

  test('sidebar collapses to the icon rail and expands back to 240px (AC12)', async ({ page }) => {
    await goto(page)
    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect(sidebar(page)).toHaveClass(/kx-sidebar--rail/)
    await expect.poll(() => sidebarWidth(page)).toBe(64)
    await page.getByRole('button', { name: 'Expand sidebar' }).click()
    await expect(sidebar(page)).not.toHaveClass(/kx-sidebar--rail/)
    await expect.poll(() => sidebarWidth(page)).toBe(240)
  })

  test('Create new system stays sticky while the system list scrolls (AC13)', async ({ page }) => {
    await goto(page)
    await openSystemMenu(page)
    const footer = page.locator('.kx-system-menu__footer')
    await expect(footer).toBeVisible()
    const before = await footer.boundingBox()
    await page.locator('.kx-system-menu__list').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await page.waitForTimeout(50)
    await expect(footer).toBeVisible()
    const after = await footer.boundingBox()
    expect(after!.y).toBe(before!.y)
  })

  test('no All Systems page or link exists anywhere (AC14)', async ({ page }) => {
    await goto(page)
    await expect(page.locator('.kx-sidebar a')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /all systems/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /all systems/i })).toHaveCount(0)
  })

  test('visible Illustrative data marker renders in the sidebar only on New Session; both on Session History (AC46)', async ({ page }) => {
    await goto(page)
    let notes = page.getByTestId('illustrative-data-note')
    await expect(notes).toHaveCount(1)
    await expect(notes).toBeVisible()
    await expect(notes).toHaveText('Illustrative data')
    await expect(notes).toHaveClass(/kx-sidebar__note/)

    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
    notes = page.getByTestId('illustrative-data-note')
    await expect(notes).toHaveCount(2)
    await expect(notes.nth(0)).toBeVisible()
    await expect(notes.nth(0)).toHaveText('Illustrative data')
    await expect(notes.nth(1)).toBeVisible()
    await expect(notes.nth(1)).toHaveText('Illustrative data')
  })

  test('Escape closes the system menu and returns focus to its trigger (AC45)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByRole('button', { name: /open system menu/i })
    await trigger.click()
    const menu = page.getByRole('menu', { name: 'Systems' })
    await expect(menu).toBeVisible()
    await pressEscape(page)
    await expect(menu).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('interactive controls expose a visible keyboard focus ring (AC45)', async ({ page }) => {
    await goto(page)
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active) return null
      const styles = getComputedStyle(active)
      return {
        matchesFocusVisible: active.matches(':focus-visible'),
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
      }
    })

    expect(focus).not.toBeNull()
    expect(focus!.matchesFocusVisible).toBe(true)
    expect(focus!.outlineStyle).not.toBe('none')
    expect(focus!.outlineWidth).toBe('2px')
  })

  test('Escape closes the Customize modal and returns focus to its trigger (AC45)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByRole('button', { name: 'Customize' })
    await trigger.click()
    const modal = page.getByTestId('customize-modal')
    await expect(modal).toBeVisible()
    await pressEscape(page)
    await expect(modal).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('Escape closes the Learned drawer and returns focus to Reviews waiting (AC45)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('reviews-waiting')
    await trigger.click()
    const drawer = page.getByTestId('learned-drawer')
    await expect(drawer).toBeVisible()
    await pressEscape(page)
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('composer layout correction surfaces', () => {
  test('renders exactly one h1 and a decorative intro image (empty alt, aria-hidden)', async ({ page }) => {
    await goto(page)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'New session', level: 1 })).toBeVisible()

    const introImg = page.locator('.kx-new-session__intro-img')
    await expect(introImg).toHaveCount(1)
    await expect(introImg).toHaveAttribute('alt', '')
    await expect(introImg).toHaveAttribute('aria-hidden', 'true')
    await expect(introImg).toHaveAttribute('src', '/assets/konteks/empty-sessions.png')
  })

  test('header spans full width independent of the composer; the bounded content column sits below it', async ({ page }) => {
    await goto(page)

    const headerBox = await page.getByTestId('new-session-header').boundingBox()
    const contentBox = await page.getByTestId('new-session-content').boundingBox()
    const composerBox = await page.getByTestId('composer').boundingBox()
    expect(headerBox).not.toBeNull()
    expect(contentBox).not.toBeNull()
    expect(composerBox).not.toBeNull()

    // The header band is wider than the bounded composer/content column.
    expect(headerBox!.width).toBeGreaterThan(contentBox!.width)
    expect(headerBox!.width).toBeGreaterThan(composerBox!.width)

    // The header sits above the content region; both are centered in the
    // page column, so the bounded column is inset inside the header band.
    expect(headerBox!.y + headerBox!.height).toBeLessThanOrEqual(contentBox!.y)
    expect(contentBox!.x).toBeGreaterThanOrEqual(headerBox!.x)
    const headerCenter = headerBox!.x + headerBox!.width / 2
    const contentCenter = contentBox!.x + contentBox!.width / 2
    expect(Math.abs(headerCenter - contentCenter)).toBeLessThanOrEqual(2)
  })

  test('reviews pill and disclaimer carry the exact copy in their standalone wrappers', async ({ page }) => {
    await goto(page)

    const wrapper = page.getByTestId('reviews-wrapper')
    await expect(wrapper).toBeVisible()
    await expect(wrapper).toHaveClass(/kx-new-session__reviews/)

    const reviews = wrapper.getByTestId('reviews-waiting')
    await expect(reviews).toBeVisible()
    await expect(reviews).toContainText('Reviews waiting')
    await expect(reviews.locator('.kx-composer__badge')).toHaveText('3')

    const disclaimer = page.getByTestId('disclaimer')
    await expect(disclaimer).toBeVisible()
    await expect(disclaimer).toHaveClass(/kx-new-session__disclaimer/)
    await expect(disclaimer).toHaveText('Konteks can make mistakes. Verify important information.')
  })

  test('intro keeps a clear gap above the reviews pill and the composer', async ({ page }) => {
    await goto(page)

    const introBox = await page.getByTestId('new-session-intro').boundingBox()
    const reviewsBox = await page.getByTestId('reviews-wrapper').boundingBox()
    const composerBox = await page.getByTestId('composer').boundingBox()
    expect(introBox).not.toBeNull()
    expect(reviewsBox).not.toBeNull()
    expect(composerBox).not.toBeNull()

    // The intro's bottom margin (clamp(40px, 7vh, 72px)) separates it
    // from the reviews pill, which sits 12px above the composer.
    const introToReviews = reviewsBox!.y - (introBox!.y + introBox!.height)
    expect(introToReviews).toBeGreaterThanOrEqual(40)
    const reviewsToComposer = composerBox!.y - (reviewsBox!.y + reviewsBox!.height)
    expect(reviewsToComposer).toBeGreaterThanOrEqual(12)
  })

  test('repository trigger opens the repository modal over the shell (modal regression)', async ({ page }) => {
    await goto(page)
    await page.getByTestId('repository-trigger').click()
    const dialog = page.getByRole('dialog', { name: 'Choose work repositories' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toBeFocused()

    // The modal operates: Cancel closes it and returns focus to the trigger.
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('repository-trigger')).toBeFocused()
  })

  test('component trigger opens and operates the component menu (modal regression)', async ({ page }) => {
    await goto(page)
    await page.getByTestId('component-trigger').click()
    const menu = page.getByTestId('component-menu')
    await expect(menu).toBeVisible()

    // The menu operates: a search narrows the rows and Clear resets them.
    const search = menu.getByRole('searchbox', { name: 'Search components or repositories' })
    await search.fill('mytok')
    await expect(menu.locator('.kx-component-menu__row')).toHaveCount(1)
    await menu.getByRole('menuitemcheckbox', { name: /mytok-mobile/ }).check()
    await menu.getByRole('menuitem', { name: 'Clear' }).click()
    await expect(page.getByTestId('component-trigger')).toHaveText('Choose component')

    await pressEscape(page)
    await expect(menu).toHaveCount(0)
    await expect(page.getByTestId('component-trigger')).toBeFocused()
  })
})

test.describe('responsive regressions (Task 13)', () => {
  test('crossing 1280px forces the rail; crossing back restores the stored expanded state', async ({ page }) => {
    await goto(page)
    await expect.poll(() => sidebarWidth(page)).toBe(240)

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect.poll(() => sidebarWidth(page)).toBe(64)

    await page.setViewportSize({ width: 1281, height: 900 })
    await expect.poll(() => sidebarWidth(page)).toBe(240)
  })

  test('a stored rail preference survives the 1280→1281 round trip', async ({ page }) => {
    await goto(page)
    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect(sidebar(page)).toHaveClass(/kx-sidebar--rail/)
    await expect.poll(() => sidebarWidth(page)).toBe(64)

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect.poll(() => sidebarWidth(page)).toBe(64)

    await page.setViewportSize({ width: 1281, height: 900 })
    await expect.poll(() => sidebarWidth(page)).toBe(64)
  })

  test('fits 1200×720 with no horizontal scroll and unclipped composer/modal (AC44)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 720 })
    await goto(page)

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(1200)

    const composerBox = await page.getByTestId('composer').boundingBox()
    expect(composerBox).not.toBeNull()
    expect(composerBox!.x + composerBox!.width).toBeLessThanOrEqual(1200)

    await openCustomize(page)
    const modalBox = await page.getByTestId('customize-modal').boundingBox()
    expect(modalBox).not.toBeNull()
    expect(modalBox!.x).toBeGreaterThanOrEqual(0)
    expect(modalBox!.y).toBeGreaterThanOrEqual(0)
    expect(modalBox!.x + modalBox!.width).toBeLessThanOrEqual(1200)
    expect(modalBox!.y + modalBox!.height).toBeLessThanOrEqual(720)
  })

  test('keeps the header, intro, reviews pill, composer/input box, and disclaimer fully inside both required viewports', async ({ page }) => {
    for (const { width, height } of [
      { width: 1440, height: 900 },
      { width: 1200, height: 720 },
    ]) {
      await page.setViewportSize({ width, height })
      await goto(page)

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(scrollWidth, `document must not overflow ${width}px horizontally`).toBeLessThanOrEqual(width)

      // Both axes: every required New Session region must sit fully inside
      // the viewport — x AND y bounds — at 1440×900 and the compact-height
      // 1200×720 regression viewport (AC44).
      for (const testId of [
        'new-session-header',
        'new-session-content',
        'new-session-intro',
        'composer',
        'composer-input-box',
        'reviews-wrapper',
        'disclaimer',
      ]) {
        const box = await page.getByTestId(testId).boundingBox()
        expect(box, `${testId} should be visible at ${width}x${height}`).not.toBeNull()
        expect(box!.x, `${testId} left edge at ${width}x${height}`).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width, `${testId} right edge at ${width}x${height}`).toBeLessThanOrEqual(width)
        expect(box!.y, `${testId} top edge at ${width}x${height}`).toBeGreaterThanOrEqual(0)
        expect(box!.y + box!.height, `${testId} bottom edge at ${width}x${height}`).toBeLessThanOrEqual(height)
      }

      // Full-width header stays wider than the bounded composer column at
      // both viewports — the header never collapses to the content width.
      const headerBox = await page.getByTestId('new-session-header').boundingBox()
      const composerBox = await page.getByTestId('composer').boundingBox()
      expect(headerBox!.width, `header wider than composer at ${width}x${height}`).toBeGreaterThan(
        composerBox!.width,
      )
    }
  })
})
