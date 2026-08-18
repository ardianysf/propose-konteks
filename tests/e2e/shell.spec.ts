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

  test('typography scale tokens resolve to the exact DM Sans 19→8 scale (AC5, 80% density)', async ({ page }) => {
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
      threeXl: '19px',
      twoXl: '16px',
      xl: '14px',
      l: '13px',
      md: '10px',
      sm: '10px',
      xs: '9px',
      twoXs: '8px',
      body: '10px',
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

  test('View all opens Session History while the sidebar stays byte-identical apart from the nav-active state (AC11)', async ({ page }) => {
    await goto(page)
    // The only allowed DOM delta is the New session control's
    // aria-current="page" route state — the sidebar never remounts.
    const stripNavState = (html: string) =>
      html.replace(' aria-current="page"', '').replace(' kx-sidebar__new-session--active', '')
    const before = stripNavState(await sidebar(page).evaluate((el) => el.outerHTML))
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
    const after = stripNavState(await sidebar(page).evaluate((el) => el.outerHTML))
    expect(after).toBe(before)
    await expect(page.getByTestId('new-session-trigger')).not.toHaveAttribute('aria-current')
  })

  test('workspace, system, and account triggers toggle their own menu closed on a second click; other triggers replace', async ({ page }) => {
    await goto(page)

    // Workspace: same-trigger second click dismisses and restores focus.
    const workspace = page.getByRole('button', { name: /workspace$/i })
    await workspace.click()
    const wsMenu = page.getByRole('menu', { name: 'Workspace' })
    await expect(wsMenu).toBeVisible()
    await expect(workspace).toHaveAttribute('aria-expanded', 'true')
    await workspace.click()
    await expect(wsMenu).toHaveCount(0)
    await expect(workspace).toHaveAttribute('aria-expanded', 'false')
    await expect(workspace).toBeFocused()

    // Cross-trigger replacement still holds: a different trigger swaps
    // the open overlay instead of toggling.
    await workspace.click()
    await expect(wsMenu).toBeVisible()
    const system = page.getByRole('button', { name: /open system menu/i })
    await system.click()
    await expect(wsMenu).toHaveCount(0)
    await expect(page.getByRole('menu', { name: 'Systems' })).toBeVisible()

    // System: same-trigger toggle.
    await system.click()
    await expect(page.getByRole('menu', { name: 'Systems' })).toHaveCount(0)
    await expect(system).toHaveAttribute('aria-expanded', 'false')
    await expect(system).toBeFocused()

    // Account: same-trigger toggle.
    const account = page.getByTestId('account-trigger')
    await account.click()
    const acctMenu = page.getByRole('menu', { name: 'Account' })
    await expect(acctMenu).toBeVisible()
    await expect(account).toHaveAttribute('aria-expanded', 'true')
    await account.click()
    await expect(acctMenu).toHaveCount(0)
    await expect(account).toHaveAttribute('aria-expanded', 'false')
    await expect(account).toBeFocused()
  })

  test('New session navigates from Session History and leaves no overlay rendered', async ({ page }) => {
    await goto(page)
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('region', { name: 'Session history' })).toBeVisible()

    // Navigate with an overlay open — New session must close it through
    // the lifecycle so the route lands clean.
    await openSystemMenu(page)
    await expect(page.getByRole('menu', { name: 'Systems' })).toBeVisible()

    const newSession = page.getByTestId('new-session-trigger')
    await newSession.click()
    await expect(page.getByRole('heading', { name: 'New session', level: 1 })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Session history' })).toHaveCount(0)
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.locator('.kx-modal-backdrop')).toHaveCount(0)
    await expect(newSession).toHaveAttribute('aria-current', 'page')

    // A second click with no overlay open navigates directly (no-op route
    // change, still clean).
    await newSession.click()
    await expect(page.getByRole('heading', { name: 'New session', level: 1 })).toBeVisible()
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('New session stays visible and navigates from the forced ≤1280 rail', async ({ page }) => {
    // Reach Session History while the sidebar is still expanded — the
    // forced rail hides View all (display:none), so navigation must
    // start from the default viewport.
    await goto(page)
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('region', { name: 'Session history' })).toBeVisible()

    // Shrink into the forced rail.
    await page.setViewportSize({ width: 1200, height: 720 })
    await expect.poll(() => sidebarWidth(page)).toBe(64)

    const newSession = page.getByTestId('new-session-trigger')
    await expect(newSession).toBeVisible()
    await expect(newSession).toBeEnabled()
    // Focusable in the forced rail — keyboard users reach it.
    await newSession.focus()
    await expect(newSession).toBeFocused()
    // The rail icon stays visible — only the label hides, and the
    // accessible name survives via aria-label.
    await expect(newSession.locator('svg[data-icon="new-session"]')).toBeVisible()
    await expect(newSession).toHaveAccessibleName('New session')
    await expect(newSession.locator('.kx-sidebar__new-session-label')).toBeHidden()

    // Navigation from Session History works through the rail control.
    await newSession.click()
    await expect(page.getByRole('heading', { name: 'New session', level: 1 })).toBeVisible()
    await expect(newSession).toHaveAttribute('aria-current', 'page')
  })

  test('New session paints no resting background — hover alone is the visual affordance', async ({ page }) => {
    await goto(page)
    // The default route is new-session, so the control carries
    // aria-current="page" — and still computes a transparent background.
    const newSession = page.getByTestId('new-session-trigger')
    await expect(newSession).toHaveAttribute('aria-current', 'page')
    await page.mouse.move(0, 0) // move the pointer off the control
    expect(
      await newSession.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgba(0, 0, 0, 0)')
    // The icon chip paints nothing at rest either — a semantic glyph only.
    expect(
      await newSession
        .locator('.kx-sidebar__new-session-icon')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgba(0, 0, 0, 0)')
    // Hover is the only resting-route visual: the pale fill appears (the
    // 0.15s transition means the computed style is polled).
    await newSession.hover()
    await expect
      .poll(() => newSession.evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe('rgb(244, 248, 238)') // --kx-pale #F4F8EE
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

  test('no Illustrative data marker on New Session; Session History carries only its page marker (AC46)', async ({ page }) => {
    await goto(page)
    // The sidebar footer no longer carries a marker and the New Session
    // page never had one — the route renders zero notes.
    await expect(page.getByTestId('illustrative-data-note')).toHaveCount(0)

    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page.getByRole('heading', { name: 'Session history' })).toBeVisible()
    const notes = page.getByTestId('illustrative-data-note')
    await expect(notes).toHaveCount(1)
    await expect(notes).toBeVisible()
    await expect(notes).toHaveText('Illustrative data')
    await expect(notes).toHaveClass(/kx-illustrative-note/)
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

  test('component trigger opens above its trigger and operates the menu (modal regression)', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('component-trigger')
    await trigger.click()
    const menu = page.getByTestId('component-menu')
    await expect(menu).toBeVisible()

    // Anchored above the trigger, flush with its left edge: the menu's
    // bottom never reaches past the trigger's top.
    const triggerBox = await trigger.boundingBox()
    const menuBox = await menu.boundingBox()
    expect(Math.abs(menuBox!.x - triggerBox!.x)).toBeLessThan(2)
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(triggerBox!.y)

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

  test('component trigger toggles its menu closed on a second click', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('component-trigger')
    await trigger.click()
    const menu = page.getByTestId('component-menu')
    await expect(menu).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // The same trigger's second click dismisses the menu and restores
    // focus instead of re-opening it.
    await trigger.click()
    await expect(menu).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
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
