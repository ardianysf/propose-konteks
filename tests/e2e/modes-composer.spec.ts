import { expect, test } from '@playwright/test'
import { goto } from './helpers'

test.describe('modes + composer', () => {
  test('Engineering/Planning control is the dominant hierarchy above setup and composer (AC15)', async ({ page }) => {
    await goto(page)
    const modeBox = await page.getByTestId('session-mode').boundingBox()
    const setupBox = await page.locator('.kx-setup-row').boundingBox()
    const composerBox = await page.getByTestId('composer').boundingBox()

    expect(modeBox).not.toBeNull()
    expect(setupBox).not.toBeNull()
    expect(composerBox).not.toBeNull()
    expect(modeBox!.y).toBeLessThan(setupBox!.y)
    expect(setupBox!.y).toBeLessThan(composerBox!.y)
    await expect(page.getByTestId('session-mode')).toHaveClass(/kx-session-mode--dominant/)
  })

  test('Planning mode hides setup and shows the Start planning copy (AC16)', async ({ page }) => {
    await goto(page)
    await page.getByRole('radio', { name: 'Planning' }).click()

    await expect(page.locator('.kx-setup-row')).toHaveCount(0)
    await expect(page.getByTestId('component-trigger')).toHaveCount(0)
    await expect(page.getByTestId('repository-trigger')).toHaveCount(0)

    await expect(page.getByTestId('composer-input')).toHaveAttribute(
      'placeholder',
      'Describe the product outcome you want to plan…',
    )
    await expect(page.getByRole('button', { name: 'Start planning' })).toBeVisible()
  })

  test('Engineering mode shows system/repository and component selection beside the composer (AC17)', async ({ page }) => {
    await goto(page)
    await expect(page.getByTestId('repository-trigger')).toBeVisible()
    await expect(page.getByTestId('component-trigger')).toBeVisible()
    await expect(page.getByTestId('composer')).toBeVisible()
  })

  test('composer renders a soft-matcha outer container around a white input (AC18)', async ({ page }) => {
    await goto(page)
    const outer = await page.getByTestId('composer').evaluate((el) => getComputedStyle(el).backgroundColor)
    const inner = await page.getByTestId('composer-input').evaluate((el) => getComputedStyle(el).backgroundColor)
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

  test('disclaimer sits left below the input and Reviews waiting with a round badge sits right (AC20)', async ({ page }) => {
    await goto(page)
    const inputBox = await page.getByTestId('composer-input').boundingBox()
    const disclaimer = page.locator('.kx-composer__disclaimer')
    const reviews = page.getByRole('button', { name: /reviews waiting/i })

    const disclaimerBox = await disclaimer.boundingBox()
    const reviewsBox = await reviews.boundingBox()

    expect(disclaimerBox!.y).toBeGreaterThan(inputBox!.y)
    expect(reviewsBox!.x).toBeGreaterThan(disclaimerBox!.x)

    const badge = reviews.locator('.kx-composer__badge')
    await expect(badge).toHaveText('3')
    const radius = await badge.evaluate((el) => getComputedStyle(el).borderRadius)
    expect(radius).not.toBe('0px')
  })

  test('Execution Profile control sits bottom-left of the toolbar after the text/document control (AC21)', async ({ page }) => {
    await goto(page)
    const docBox = await page.getByRole('button', { name: 'Add text document' }).boundingBox()
    const profileBox = await page.getByTestId('execution-profile-trigger').boundingBox()

    expect(profileBox!.x).toBeGreaterThan(docBox!.x)
    const inToolbar = await page
      .getByTestId('execution-profile-trigger')
      .evaluate((el) => el.closest('.kx-composer__toolbar') !== null)
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
