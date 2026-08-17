import { expect, test } from '@playwright/test'
import { goto } from './helpers'

test.describe('modes + composer', () => {
  test('renders the exact header and Engineering intro copy', async ({ page }) => {
    await goto(page)

    await expect(page.getByRole('heading', { name: 'New session', level: 1 })).toBeVisible()
    await expect(
      page.getByText('Start governed work with the right mode and context.'),
    ).toBeVisible()
    await expect(page.getByText('Human approval required for proposals')).toBeVisible()

    await expect(
      page.getByRole('heading', { name: 'What would you like to build?', level: 2 }),
    ).toBeVisible()
    await expect(
      page.getByText(
        'Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.',
      ),
    ).toBeVisible()
  })

  test('Engineering renders two setup pills and the Session Mode group on the same top row', async ({ page }) => {
    await goto(page)

    const repoPill = page.getByRole('button', { name: 'Choose system / repositories' })
    const componentPill = page.getByRole('button', { name: 'Choose component' })
    await expect(repoPill).toBeVisible()
    await expect(componentPill).toBeVisible()
    await expect(repoPill).toHaveClass(/kx-panel__pill/)
    await expect(componentPill).toHaveClass(/kx-panel__pill/)

    // The mode group lives inside the single composer top row, right of
    // the setup cluster — not as a separate dominant region above it.
    const topRow = page.locator('.kx-panel__top-row')
    await expect(topRow).toHaveCount(1)
    await expect(topRow).toContainText('Choose system / repositories')
    await expect(topRow).toContainText('Choose component')
    await expect(topRow.getByTestId('session-mode')).toBeVisible()

    const modeBox = await page.getByTestId('session-mode').boundingBox()
    const repoBox = await repoPill.boundingBox()
    expect(modeBox).not.toBeNull()
    expect(repoBox).not.toBeNull()
    expect(modeBox!.x).toBeGreaterThan(repoBox!.x + repoBox!.width)
  })

  test('SESSION MODE label sits above the selector and the active segment computes the exact matcha fill with dark text (AC15)', async ({ page }) => {
    await goto(page)

    const label = page.getByText('SESSION MODE', { exact: true })
    await expect(label).toBeVisible()
    await expect(label).toHaveClass(/kx-session-mode__label/)

    // The label lives inside the session-mode cluster, above the radio group.
    const cluster = page.getByTestId('session-mode')
    const group = cluster.locator('.kx-session-mode__group')
    await expect(cluster).toContainText('SESSION MODE')
    const labelBox = await label.boundingBox()
    const groupBox = await group.boundingBox()
    expect(labelBox).not.toBeNull()
    expect(groupBox).not.toBeNull()
    expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(groupBox!.y)

    // The active radio renders as the exact matcha #95A547 pill with dark
    // primary text (white fails contrast on this fill). The transition
    // (0.15s) means the computed style must be polled.
    const active = page.getByRole('radio', { name: 'Engineering' })
    await expect(active).toBeChecked()
    await expect
      .poll(async () =>
        active.evaluate((el) => {
          const s = getComputedStyle(el)
          return `${s.backgroundColor} ${s.color}`
        }),
      )
      .toBe('rgb(149, 165, 71) rgb(36, 48, 37)') // --kx-accent-segment-aa #95A547 / --kx-primary

    // Switching moves the active styling to Planning.
    await page.getByRole('radio', { name: 'Planning' }).click()
    const planning = page.getByRole('radio', { name: 'Planning' })
    await expect
      .poll(async () =>
        planning.evaluate((el) => {
          const s = getComputedStyle(el)
          return `${s.backgroundColor} ${s.color}`
        }),
      )
      .toBe('rgb(149, 165, 71) rgb(36, 48, 37)')
  })

  test('setup pills render as compact fully-rounded pills (999px radius, 12px side padding)', async ({ page }) => {
    await goto(page)

    for (const name of ['Choose system / repositories', 'Choose component']) {
      const pill = page.getByRole('button', { name })
      const style = await pill.evaluate((el) => {
        const s = getComputedStyle(el)
        return {
          radius: s.borderRadius,
          paddingInline: s.paddingInline,
          minHeight: s.minHeight,
        }
      })
      expect(style.radius, `${name} radius`).toBe('999px')
      expect(style.paddingInline, `${name} padding`).toBe('12px')
      expect(style.minHeight, `${name} height`).toBe('38px')
    }
  })

  test('Planning shows system-only setup and the Start planning copy (AC16)', async ({ page }) => {
    await goto(page)
    await page.getByRole('radio', { name: 'Planning' }).click()

    // The system pill stays; only the component pill disappears.
    await expect(page.getByRole('button', { name: 'Choose system' })).toBeVisible()
    await expect(page.getByTestId('component-trigger')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Choose component' })).toHaveCount(0)

    await expect(page.getByTestId('composer-input')).toHaveAttribute(
      'placeholder',
      'Describe the product outcome you want to plan…',
    )
    await expect(page.getByRole('button', { name: 'Start planning' })).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Start planning', level: 2 })).toBeVisible()
    await expect(
      page.getByText(
        'Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.',
      ),
    ).toBeVisible()
  })

  test('composer renders a soft-matcha outer container around a white input (AC18)', async ({ page }) => {
    await goto(page)
    const outer = await page
      .getByTestId('composer')
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    const inner = await page
      .getByTestId('composer-input-box')
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(outer).toBe('rgb(244, 248, 238)') // --kx-pale #F4F8EE
    expect(inner).toBe('rgb(255, 255, 255)') // --kx-raised #FFF
  })

  test('toolbar icons are unboxed and the send button is a soft accent element (AC19)', async ({ page }) => {
    await goto(page)
    for (const name of ['Attach file', 'Add text document', 'Voice input']) {
      const button = page.getByRole('button', { name })
      await expect(button).toHaveClass(/kx-icon-btn/)
      const borderWidth = await button.evaluate((el) => getComputedStyle(el).borderWidth)
      expect(borderWidth).toBe('0px')
    }

    const send = page.getByRole('button', { name: 'Send' })
    await expect(send).toHaveClass(/kx-composer__send/)
    const sendBorder = await send.evaluate((el) => getComputedStyle(el).borderTopColor)
    expect(sendBorder).toBe('rgb(143, 191, 106)') // --kx-accent #8FBF6A
  })

  test('every composer control lives inside the nested input box', async ({ page }) => {
    await goto(page)
    const inputBox = page.getByTestId('composer-input-box')
    await expect(inputBox.getByTestId('composer-input')).toBeVisible()
    for (const name of ['Attach file', 'Add text document', 'Voice input', 'Send']) {
      await expect(inputBox.getByRole('button', { name })).toBeVisible()
    }
    await expect(inputBox.getByRole('button', { name: /execution profile/i })).toBeVisible()
  })

  test('Reviews waiting sits geometrically and in the DOM above the composer; the centered disclaimer follows it (AC10/AC11)', async ({ page }) => {
    await goto(page)

    const reviews = page.getByTestId('reviews-waiting')
    await expect(reviews).toBeVisible()
    await expect(reviews).toContainText('Reviews waiting')

    const disclaimer = page.getByTestId('disclaimer')
    await expect(disclaimer).toBeVisible()
    await expect(disclaimer).toHaveText('Konteks can make mistakes. Verify important information.')

    // DOM order: the reviews wrapper precedes the composer, the disclaimer
    // follows it — the old combined external footer wrapper is gone.
    const order = await page.evaluate(() => {
      const reviewsWrapper = document.querySelector('[data-testid="reviews-wrapper"]')
      const composer = document.querySelector('[data-testid="composer"]')
      const disclaimerEl = document.querySelector('[data-testid="disclaimer"]')
      const externalFooter = document.querySelector('[data-testid="external-footer"]')
      if (!reviewsWrapper || !composer || !disclaimerEl) return null
      return {
        reviewsBeforeComposer: !!(composer.compareDocumentPosition(reviewsWrapper) & Node.DOCUMENT_POSITION_PRECEDING),
        disclaimerAfterComposer: !!(composer.compareDocumentPosition(disclaimerEl) & Node.DOCUMENT_POSITION_FOLLOWING),
        externalFooterCount: externalFooter ? 1 : 0,
      }
    })
    expect(order).not.toBeNull()
    expect(order!.reviewsBeforeComposer).toBe(true)
    expect(order!.disclaimerAfterComposer).toBe(true)
    expect(order!.externalFooterCount).toBe(0)

    // Geometry: the whole reviews pill sits above the composer panel, and
    // the disclaimer starts below the composer's bottom edge.
    const reviewsBox = await reviews.boundingBox()
    const composerBox = await page.getByTestId('composer').boundingBox()
    const disclaimerBox = await disclaimer.boundingBox()
    expect(reviewsBox).not.toBeNull()
    expect(composerBox).not.toBeNull()
    expect(disclaimerBox).not.toBeNull()
    expect(reviewsBox!.y + reviewsBox!.height).toBeLessThanOrEqual(composerBox!.y)
    expect(disclaimerBox!.y).toBeGreaterThanOrEqual(composerBox!.y + composerBox!.height)

    // Centered disclaimer: its midpoint matches the bounded content column's.
    const contentBox = await page.getByTestId('new-session-content').boundingBox()
    expect(contentBox).not.toBeNull()
    const disclaimerCenter = disclaimerBox!.x + disclaimerBox!.width / 2
    const contentCenter = contentBox!.x + contentBox!.width / 2
    expect(Math.abs(disclaimerCenter - contentCenter)).toBeLessThanOrEqual(2)

    const badge = reviews.locator('.kx-composer__badge')
    await expect(badge).toHaveText('3')
    const radius = await badge.evaluate((el) => getComputedStyle(el).borderRadius)
    expect(radius).not.toBe('0px')
  })

  test('Execution Profile control sits in the toolbar left group after the text/document control (AC21)', async ({ page }) => {
    await goto(page)
    const docBox = await page.getByRole('button', { name: 'Add text document' }).boundingBox()
    const profileBox = await page.getByTestId('execution-profile-trigger').boundingBox()

    expect(docBox).not.toBeNull()
    expect(profileBox).not.toBeNull()
    expect(profileBox!.x).toBeGreaterThan(docBox!.x)
    const inToolbar = await page
      .getByTestId('execution-profile-trigger')
      .evaluate((el) => el.closest('.kx-panel__toolbar') !== null)
    expect(inToolbar).toBe(true)
  })

  test('Execution Profile trigger shows only the profile name + chevron as a plain borderless control while its accessible name keeps working', async ({ page }) => {
    await goto(page)
    const trigger = page.getByTestId('execution-profile-trigger')

    // The explicit accessible name carries the full label + active profile.
    await expect(trigger).toHaveAccessibleName('Execution Profile · Default')
    await expect(
      page.getByRole('button', { name: 'Execution Profile · Default' }),
    ).toBeVisible()

    // Visible content is just the active profile name + one chevron glyph.
    await expect(trigger).toHaveText('Default')
    await expect(trigger.locator('svg')).toHaveCount(1)
    await expect(trigger.locator('svg[data-icon="chevron-down"]')).toBeAttached()
    await expect(trigger.locator('svg[data-icon="chevron-down"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )

    // No visible caption, no gauge icon, no legacy icon/copy wrappers.
    await expect(trigger.locator('.kx-composer__profile-icon')).toHaveCount(0)
    await expect(trigger.locator('.kx-composer__profile-copy')).toHaveCount(0)
    await expect(trigger.locator('.kx-composer__profile-caption')).toHaveCount(0)
    await expect(trigger.locator('svg[data-icon="gauge"]')).toHaveCount(0)
    await expect(trigger).not.toContainText('Execution Profile')

    // Plain: no border, no background of its own.
    const style = await trigger.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        borderWidth: s.borderTopWidth,
        background: s.backgroundColor,
        boxShadow: s.boxShadow,
      }
    })
    expect(style.borderWidth).toBe('0px')
    expect(style.background).toBe('rgba(0, 0, 0, 0)')
    expect(style.boxShadow).toBe('none')
  })

  test('send stays disabled while the input is empty and enables once text exists (AC43)', async ({ page }) => {
    await goto(page)
    const send = page.getByRole('button', { name: 'Send' })
    await expect(send).toBeDisabled()

    await page.getByTestId('composer-input').fill('Fix the EDP integration')
    await expect(send).toBeEnabled()

    await page.getByTestId('composer-input').fill('   ')
    await expect(send).toBeDisabled()
  })
})
