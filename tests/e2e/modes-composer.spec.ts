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

  test('page footer renders the exact disclaimer left and Reviews waiting with a round badge right, outside the composer (AC20)', async ({ page }) => {
    await goto(page)

    const footer = page.getByTestId('external-footer')
    await expect(footer).toBeVisible()
    await expect(
      footer.getByText('Konteks can make mistakes. Verify important information.', { exact: true }),
    ).toBeVisible()

    const reviews = footer.getByTestId('reviews-waiting')
    await expect(reviews).toBeVisible()
    await expect(reviews).toContainText('Reviews waiting')

    // The footer sits below the nested input box, not inside the composer.
    const inputBox = await page.getByTestId('composer-input-box').boundingBox()
    const footerBox = await footer.boundingBox()
    expect(inputBox).not.toBeNull()
    expect(footerBox).not.toBeNull()
    expect(footerBox!.y).toBeGreaterThan(inputBox!.y)

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
