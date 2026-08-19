import { expect, test } from '@playwright/test'
import { goto } from './helpers'

/**
 * Session Detail E2E — the final conversation layout:
 *   - sticky full-width header with title, status, and share only
 *   - no Back to sessions control anywhere
 *   - user bubbles right-aligned without sender identity or timestamps;
 *     assistant bubbles without identity chrome
 *   - sticky final composer reusing the exact main-page input-box/toolbar
 *     primitives (attach, text document, Execution Profile left; voice, send
 *     right) without an outer composer panel, offset from the bottom edge
 *   - minimal tracker: cycle context text + a single active-stage pill, pinned
 *     directly above the composer input box inside the same sticky region
 */

async function gotoSessionDetail(page: Parameters<typeof goto>[0]) {
  await goto(page)
  await page.getByRole('button', { name: 'View all' }).click()
  await expect(page.getByRole('region', { name: 'Session history' })).toBeVisible()
  await page.getByTestId('history-row').first().click()
  await expect(page.getByTestId('session-detail')).toBeVisible()
}

test.describe('session detail', () => {
  test('sticky full-width header carries title, status, and share — and no back control', async ({ page }) => {
    await gotoSessionDetail(page)

    const header = page.getByTestId('session-detail-header')
    await expect(header).toBeVisible()

    // Sticky + full-width: spans the main canvas and sticks to the top.
    const geometry = await header.evaluate((el) => {
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return { position: style.position, top: style.top, width: rect.width, viewport: window.innerWidth }
    })
    expect(geometry.position).toBe('sticky')
    expect(geometry.top).toBe('0px')
    expect(geometry.width).toBeGreaterThan(800)

    // Title, context line, share affordance only — the status badge has moved
    // out of the header to the sticky composer area.
    await expect(header.getByRole('heading', { level: 1 })).toContainText(
      'Investigate and fix the error when get list approval exception that list not showing',
    )
    await expect(header.getByTestId('session-status')).toHaveCount(0)
    await expect(page.getByTestId('session-status')).toHaveText(/Waiting Approval/)
    await expect(page.getByTestId('share-session')).toHaveAccessibleName('Share session')

    // Metadata stays out of the sticky header.
    await expect(header.locator('.kx-session-detail__meta')).toHaveCount(0)

    // No Back to sessions control anywhere on the page.
    await expect(page.getByTestId('back-to-sessions')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /back to sessions/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /back to sessions/i })).toHaveCount(0)
  })

  test('header padding is independent from the composer and content column', async ({ page }) => {
    await gotoSessionDetail(page)

    const headPad = await page.getByTestId('session-detail-header').evaluate((el) => {
      const style = getComputedStyle(el)
      return { left: style.paddingLeft, right: style.paddingRight }
    })
    expect(headPad.left).toBe('32px')
    expect(headPad.right).toBe('32px')

    // The composer is bound to the reading column while the header spans the
    // full width — their paddings never couple.
    const composerBox = await page.getByTestId('session-composer-input-box').boundingBox()
    const headerBox = await page.getByTestId('session-detail-header').boundingBox()
    expect(composerBox).not.toBeNull()
    expect(headerBox).not.toBeNull()
    expect(headerBox!.width).toBeGreaterThan(composerBox!.width)
  })

  test('reading column resolves to 740px with 680px centered blocks at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoSessionDetail(page)

    // The content column is min(740px, 100% - 64px); at 1440 it resolves to
    // 740px and the blocks column caps at 680px, centered within it.
    const content = page.locator('.kx-session-detail__content')
    const blocks = page.getByTestId('session-detail-blocks')
    const contentBox = await content.boundingBox()
    const blocksBox = await blocks.boundingBox()
    expect(contentBox).not.toBeNull()
    expect(blocksBox).not.toBeNull()
    expect(Math.round(contentBox!.width)).toBe(740)
    expect(Math.round(blocksBox!.width)).toBe(680)
    const leftInset = blocksBox!.x - contentBox!.x
    const rightInset = contentBox!.x + contentBox!.width - (blocksBox!.x + blocksBox!.width)
    expect(Math.abs(leftInset - rightInset)).toBeLessThanOrEqual(2)

    // The composer area spans the full content width (it bleeds 16px past
    // each edge through negative margins for its sticky backdrop).
    const composerAreaBox = await page.getByTestId('session-composer-area').boundingBox()
    expect(Math.round(composerAreaBox!.width)).toBe(740 + 32)
  })

  test('share button and context row stay vertically centered in the sticky header', async ({ page }) => {
    await gotoSessionDetail(page)
    const headMain = page.locator('.kx-session-detail__head-main')
    expect(await headMain.evaluate((el) => getComputedStyle(el).alignItems)).toBe('center')

    // The share button visually centers against the title row.
    const titleBox = await page.locator('.kx-session-detail__title').boundingBox()
    const shareBox = await page.getByTestId('share-session').boundingBox()
    expect(titleBox).not.toBeNull()
    expect(shareBox).not.toBeNull()
    const titleCenter = titleBox!.y + titleBox!.height / 2
    const shareCenter = shareBox!.y + shareBox!.height / 2
    expect(Math.abs(titleCenter - shareCenter)).toBeLessThanOrEqual(4)

    // The context row sits directly under the title row, vertically centered
    // internally (no top-aligned control in the header).
    const context = page.getByTestId('session-context')
    expect(await context.evaluate((el) => getComputedStyle(el).alignItems)).toBe('center')
  })

  test('sticky final composer reuses the main-page input-box and toolbar primitives without an outer panel', async ({ page }) => {
    await gotoSessionDetail(page)

    const composer = page.getByTestId('session-composer')
    await expect(composer).toBeVisible()

    // The composer area (tracker + composer) is sticky and pinned to the
    // bottom edge; a solid canvas backdrop strip fills the gap below it so no
    // scrolled content shows through, while the composer keeps its bottom
    // breathing room inside that solid region.
    const composerArea = page.getByTestId('session-composer-area')
    await expect.poll(() => composerArea.evaluate((el) => getComputedStyle(el).position)).toBe('sticky')
    const bottomOffset = await composerArea.evaluate((el) => parseFloat(getComputedStyle(el).bottom))
    expect(bottomOffset).toBe(0)

    // Exactly the main-page input box/toolbar primitives.
    const inputBox = page.getByTestId('session-composer-input-box')
    await expect(inputBox).toHaveClass(/kx-composer__input-box/)
    await expect(page.getByTestId('session-composer-input')).toHaveAttribute(
      'placeholder',
      'Describe the outcome you need…',
    )
    await expect(page.getByTestId('session-composer-toolbar')).toHaveClass(/kx-composer__toolbar/)

    await expect(composer.getByRole('button', { name: 'Attach file' })).toBeVisible()
    await expect(composer.getByRole('button', { name: 'Add text document' })).toBeVisible()
    await expect(
      composer.getByRole('button', { name: /Execution Profile · Default/i }),
    ).toBeVisible()
    await expect(composer.getByRole('button', { name: 'Voice input' })).toBeVisible()
    await expect(composer.getByRole('button', { name: 'Send message' })).toBeDisabled()

    // Toolbar groups match the main page exactly: attach + text document +
    // Execution Profile on the left; voice + send on the right.
    const leftGroup = composer.getByTestId('toolbar-left')
    await expect(leftGroup.getByRole('button', { name: 'Attach file' })).toBeVisible()
    await expect(leftGroup.getByRole('button', { name: 'Add text document' })).toBeVisible()
    await expect(leftGroup.getByRole('button', { name: /Execution Profile/i })).toBeVisible()
    await expect(leftGroup.getByRole('button', { name: 'Voice input' })).toHaveCount(0)
    const rightGroup = composer.getByTestId('toolbar-right')
    await expect(rightGroup.getByRole('button', { name: 'Voice input' })).toBeVisible()
    await expect(rightGroup.getByRole('button', { name: 'Send message' })).toBeVisible()
    await expect(rightGroup.getByRole('button', { name: 'Attach file' })).toHaveCount(0)
    await expect(rightGroup.getByRole('button', { name: /Execution Profile/i })).toHaveCount(0)

    // No outer composer panel (the main page's kx-composer kx-panel wrapper).
    await expect(composer.locator('.kx-composer.kx-panel')).toHaveCount(0)
    await expect(composer.locator('[data-testid="composer"]')).toHaveCount(0)

    // Typing enables send; Enter sends and the message lands as a user bubble.
    const bubblesBefore = await page.locator('.kx-session-timeline__bubble--user').count()
    await page.getByTestId('session-composer-input').fill('Please rerun the failing checks')
    await expect(composer.getByRole('button', { name: 'Send message' })).toBeEnabled()
    await page.getByTestId('session-composer-input').press('Enter')
    await expect(page.locator('.kx-session-timeline__bubble--user')).toHaveCount(bubblesBefore + 1)
    await expect(page.locator('.kx-session-timeline__bubble--user').last()).toContainText(
      'Please rerun the failing checks',
    )
  })

  test('timeline bubbles carry no sender identity or timestamps, with user bubbles right-aligned', async ({ page }) => {
    await gotoSessionDetail(page)

    const userBubble = page.locator('.kx-session-timeline__bubble--user').first()
    await expect(userBubble).toBeVisible()
    const userItem = page.locator('.kx-session-timeline__item--user').first()

    // Right-aligned: the user bubble ends at the right edge of its row.
    const [itemBox, bubbleBox] = await Promise.all([userItem.boundingBox(), userBubble.boundingBox()])
    expect(itemBox).not.toBeNull()
    expect(bubbleBox).not.toBeNull()
    expect(Math.abs(itemBox!.x + itemBox!.width - (bubbleBox!.x + bubbleBox!.width))).toBeLessThan(2)
    expect(bubbleBox!.x).toBeGreaterThan(itemBox!.x)

    // No sender identity ("You") and no timestamps anywhere in the timeline.
    await expect(userItem).not.toContainText('You')
    await expect(page.locator('.kx-session-timeline__timestamp')).toHaveCount(0)
    await expect(page.locator('.kx-session-timeline__agent-label')).toHaveCount(0)
    await expect(page.locator('.kx-session-timeline__agent-header')).toHaveCount(0)

    const assistantItem = page.locator('.kx-session-timeline__item--assistant').first()
    await expect(assistantItem).toBeVisible()
    const assistantBubble = page.locator('.kx-session-timeline__bubble--assistant').first()
    const [aItemBox, aBubbleBox] = await Promise.all([assistantItem.boundingBox(), assistantBubble.boundingBox()])
    // Left-aligned: the assistant bubble starts at the left edge of its row.
    expect(Math.abs(aItemBox!.x - aBubbleBox!.x)).toBeLessThan(2)
  })

  test('tracker shows the cycle context and a single active-stage pill', async ({ page }) => {
    await gotoSessionDetail(page)

    const tracker = page.getByTestId('session-tracker')
    await expect(tracker).toBeVisible()
    await expect(tracker).toContainText('Current stage · Cycle 2 of 3')

    // Exactly one current-stage summary with a single active-stage pill.
    await expect(tracker.locator('.kx-session-detail__tracker-current')).toHaveCount(1)
    const pill = tracker.locator('.kx-session-detail__stage-pill')
    await expect(pill).toHaveCount(1)
    await expect(pill).toContainText('Quote')
    await expect(pill).toContainText('Awaiting approval')

    // No completed-stage chips or legacy per-stage tracker lists.
    await expect(tracker.locator('.kx-session-detail__completed-chip')).toHaveCount(0)
    await expect(tracker.locator('.kx-session-detail__tracker-item')).toHaveCount(0)
    await expect(tracker.locator('.kx-session-detail__tracker-list')).toHaveCount(0)

    // The tracker is pinned directly above the composer input box inside the
    // sticky composer area, no longer in the upper blocks container.
    const area = page.getByTestId('session-composer-area')
    await expect(area.locator('[data-testid="session-tracker"]')).toHaveCount(1)
    await expect(page.getByTestId('session-detail-blocks').locator('[data-testid="session-tracker"]')).toHaveCount(0)
    const [trackerBox, inputBoxBox] = await Promise.all([
      tracker.boundingBox(),
      page.getByTestId('session-composer-input-box').boundingBox(),
    ])
    expect(trackerBox).not.toBeNull()
    expect(inputBoxBox).not.toBeNull()
    expect(trackerBox!.y + trackerBox!.height).toBeLessThanOrEqual(inputBoxBox!.y + 1)
  })
})
