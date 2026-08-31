import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], { stdio: 'ignore', detached: true })
async function wait(url, tries = 40) { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.ok) return } catch {} await new Promise(r => setTimeout(r, 500)) } throw new Error('no server') }
try {
  await wait('http://localhost:4175/v2')
  const b = await chromium.launch()
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await d.goto('http://localhost:4175/v2'); await d.waitForLoadState('networkidle'); await d.waitForTimeout(300)

  // rail cycle
  const sb1 = await d.locator('.kx-v2-sidebar').boundingBox()
  const m1 = await d.locator('.kx-main').boundingBox()
  console.log('EXPANDED flush:', Math.abs((sb1?.width ?? 0) - (m1?.x ?? -1)) < 1, `(${sb1?.width}/${m1?.x})`)
  await d.click('[data-testid="v2-sidebar-toggle"]'); await d.waitForTimeout(350)
  const sb2 = await d.locator('.kx-v2-sidebar').boundingBox()
  const m2 = await d.locator('.kx-main').boundingBox()
  console.log('RAIL flush:', Math.abs((sb2?.width ?? 0) - (m2?.x ?? -1)) < 1, `(${sb2?.width}/${m2?.x})`)
  await d.click('[data-testid="v2-sidebar-toggle"]'); await d.waitForTimeout(350)

  // header gone, intro visible
  const headerGone = await d.evaluate(() => { const el = document.querySelector('.kx-new-session__header'); return !el || getComputedStyle(el).display === 'none' })
  const introH = await d.locator('.kx-new-session__intro-heading').isVisible()
  const introB = await d.locator('.kx-new-session__intro-body').isVisible()
  const img = await d.locator('.kx-new-session__intro-img').isVisible()
  console.log('HEADER hidden:', headerGone, '| INTRO h+b visible:', introH && introB, '| illustration:', img)

  // new session row transparent even when active; icon tile filled
  const nsBg = await d.evaluate(() => getComputedStyle(document.querySelector('.kx-v2-new-session')).backgroundColor)
  const iconFill = await d.evaluate(() => { const el = document.querySelector('.kx-v2-new-session__icon'); return getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)' })
  console.log('NEW SESSION row transparent:', nsBg === 'rgba(0, 0, 0, 0)', '| icon tile filled:', iconFill)

  // workspace card
  const plan = await d.locator('.kx-v2-context__plan').innerText()
  console.log('WORKSPACE plan:', JSON.stringify(plan), '| illustrative stripped:', !plan.includes('illustrative'))

  // customize modal + catalog link
  await d.click('[data-testid="v2-customize-trigger"]'); await d.waitForTimeout(400)
  console.log('CUSTOMIZE modal opens:', await d.locator('[data-testid="customize-modal"]').count() === 1)
  await d.keyboard.press('Escape'); await d.waitForTimeout(300)
  const catHref = await d.evaluate(() => document.querySelector('[data-testid="v2-catalog-trigger"]').getAttribute('href'))
  console.log('CATALOG href:', catHref)

  // sessions anatomy
  const leadIcons = await d.evaluate(() => document.querySelectorAll('.kx-v2-sessions-row .kx-v2-navitem__icon').length)
  const arrowCount = await d.locator('.kx-v2-sessions-nav').count()
  const flush = await d.evaluate(() => { const g = document.querySelector('.kx-v2-sessions-group'); const item = document.querySelector('.kx-v2-recent__item'); const label = document.querySelector('.kx-v2-sessions-label'); if (!g || !item || !label) return null; return getComputedStyle(g).borderLeftWidth === '0px' && Math.abs(item.getBoundingClientRect().x - label.getBoundingClientRect().x) < 4 })
  const gapPx = await d.evaluate(() => { const a = document.querySelector('[data-testid="v2-catalog-trigger"]'); const c = document.querySelector('.kx-v2-sessions-block'); return a && c ? c.getBoundingClientRect().top - a.getBoundingClientRect().bottom : -1 })
  console.log('SESSIONS: leading icons:', leadIcons, '| arrow:', arrowCount === 1, '| flush-left no line:', flush, '| menu→sessions gap:', Math.round(gapPx), 'px')

  // disclosure + arrow navigation
  const lbl = d.locator('[data-testid="v2-sessions-trigger"]')
  await lbl.click(); await d.waitForTimeout(200)
  const collapsed = (await d.getByText('EDP Integration Fix - Mobile').count()) === 0
  await lbl.click(); await d.waitForTimeout(200)
  await d.click('.kx-v2-sessions-nav'); await d.waitForTimeout(300)
  const histVisible = await d.getByRole('heading', { name: 'Session history' }).isVisible()
  console.log('DISCLOSURE collapses:', collapsed, '| ARROW → history:', histVisible)

  await b.close()
} finally { try { process.kill(-preview.pid) } catch {} }
