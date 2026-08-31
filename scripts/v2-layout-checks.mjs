import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'ignore', detached: true })
async function wait(url, tries = 40) { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.ok) return } catch {} await new Promise(r => setTimeout(r, 500)) } throw new Error('no server') }
try {
  await wait('http://localhost:4174/v2')
  const browser = await chromium.launch()
  // Desktop checks
  const d = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await d.goto('http://localhost:4174/v2'); await d.waitForLoadState('networkidle'); await d.waitForTimeout(300)
  const sidebar = await d.locator('.kx-v2-sidebar').boundingBox()
  console.log('sidebar box:', JSON.stringify(sidebar))
  console.log('h-overflow desktop:', await d.evaluate(() => document.documentElement.scrollWidth > 1440))
  // Context popover position
  await d.click('[data-testid="v2-context-trigger"]'); await d.waitForTimeout(300)
  const pop = await d.locator('.kx-v2-pop__panel').first().boundingBox()
  console.log('context popover box:', JSON.stringify(pop))
  const popVisible = pop && pop.x >= 330 && pop.x <= 340 && pop.y > 0 && pop.y < 120
  console.log('popover anchored right of sidebar near trigger:', popVisible)
  // Direct switch: click account trigger while context popover is open
  await d.click('[data-testid="v2-account-trigger"]'); await d.waitForTimeout(300)
  const acc = await d.locator('[data-testid="v2-account-popover"] .kx-v2-pop__panel').boundingBox()
  console.log('account popover PANEL box:', JSON.stringify(acc))
  const themeInMenu = await d.locator('[data-testid="v2-account-popover"] [aria-label="Theme"]').count()
  const themeInFooter = await d.locator('.kx-v2-footer [aria-label="Theme"]').count()
  console.log('theme control in account popover:', themeInMenu === 1, '| still in footer:', themeInFooter > 0)
  const ctxGone = await d.locator('[data-testid="v2-context-popover"]').count() === 0
  console.log('direct switch works (context closed):', ctxGone)
  // Outside-click dismissal: pointer-down on page content closes it
  await d.mouse.click(900, 450); await d.waitForTimeout(300)
  const noneOpen = await d.locator('.kx-v2-pop__panel').count() === 0
  console.log('outside-click dismissal works:', noneOpen)
  // Rail mode (resize into forced-rail band)
  await d.keyboard.press('Escape'); await d.setViewportSize({ width: 1000, height: 800 }); await d.waitForTimeout(300)
  const rail = await d.locator('.kx-v2-sidebar').boundingBox()
  console.log('rail sidebar width @1000px:', rail?.width, '(expect 64)')
  const wordmarkVisible = await d.locator('.kx-v2-brand__img--wordmark').isVisible()
  const squareVisible = await d.locator('.kx-v2-brand__img--square').isVisible()
  const collapseVisible = await d.locator('.kx-v2-brand__collapse').isVisible()
  console.log('forced rail brand — wordmark hidden:', !wordmarkVisible, '| square shown:', squareVisible, '| collapse hidden:', !collapseVisible)
  console.log('h-overflow @1000px:', await d.evaluate(() => document.documentElement.scrollWidth > 1000))
  // Mobile checks
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await m.goto('http://localhost:4174/v2'); await m.waitForLoadState('networkidle'); await m.waitForTimeout(300)
  console.log('h-overflow mobile:', await m.evaluate(() => document.documentElement.scrollWidth > 390))
  // Old app untouched
  const o = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await o.goto('http://localhost:4174/'); await o.waitForLoadState('networkidle'); await o.waitForTimeout(300)
  const oldSidebar = await o.locator('.kx-sidebar, aside, nav').count()
  const v2Leak = await o.locator('.kx-v2-root').count()
  console.log('old app nav count:', oldSidebar, '| v2 classes leaked into old app:', v2Leak)
  const c = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const res = await c.goto('http://localhost:4174/catalog'); console.log('/catalog status:', res?.status())
  await browser.close()
} finally { try { process.kill(-preview.pid) } catch {} }
