import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], { stdio: 'ignore', detached: true })
async function wait(url, tries = 40) { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.ok) return } catch {} await new Promise(r => setTimeout(r, 500)) } throw new Error('no server') }
try {
  await wait('http://localhost:4175/v2')
  const b = await chromium.launch()
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await d.goto('http://localhost:4175/v2'); await d.waitForLoadState('networkidle'); await d.waitForTimeout(300)
  const sb1 = await d.locator('.kx-v2-sidebar').boundingBox()
  const m1 = await d.locator('.kx-main').boundingBox()
  console.log('EXPANDED: sidebar w =', sb1?.width, '| main.x =', m1?.x, '| flush:', Math.abs((sb1?.width ?? 0) - (m1?.x ?? -1)) < 1)
  // minimize → maximize cycle
  await d.click('[data-testid="v2-sidebar-toggle"]'); await d.waitForTimeout(350)
  const sb2 = await d.locator('.kx-v2-sidebar').boundingBox()
  const m2 = await d.locator('.kx-main').boundingBox()
  console.log('RAIL: sidebar w =', sb2?.width, '| main.x =', m2?.x, '| flush:', Math.abs((sb2?.width ?? 0) - (m2?.x ?? -1)) < 1)
  await d.click('[data-testid="v2-sidebar-toggle"]'); await d.waitForTimeout(350)
  const sb3 = await d.locator('.kx-v2-sidebar').boundingBox()
  const m3 = await d.locator('.kx-main').boundingBox()
  console.log('RE-EXPANDED: sidebar w =', sb3?.width, '| main.x =', m3?.x, '| flush:', Math.abs((sb3?.width ?? 0) - (m3?.x ?? -1)) < 1)
  // disclosure
  const sessions = d.locator('[data-testid="v2-sessions-trigger"]')
  const itemVisible = await d.getByText('EDP Integration Fix - Mobile').isVisible()
  await sessions.click(); await d.waitForTimeout(200)
  const itemHidden = (await d.getByText('EDP Integration Fix - Mobile').count()) === 0
  await sessions.click(); await d.waitForTimeout(200)
  console.log('DISCLOSURE: default open:', itemVisible, '| collapses:', itemHidden, '| reopens:', await d.getByText('EDP Integration Fix - Mobile').isVisible())
  // search palette
  await d.click('[data-testid="v2-search-trigger"]'); await d.waitForTimeout(250)
  const palette = await d.locator('.kx-v2-search__panel').boundingBox()
  console.log('PALETTE opens:', !!palette, JSON.stringify(palette))
  await d.keyboard.type('canteen'); await d.waitForTimeout(200)
  const canteen = await d.locator('.kx-v2-search__row', { hasText: 'BSI Canteen' }).count()
  const edp = await d.locator('.kx-v2-search__row', { hasText: 'EDP' }).count()
  console.log('PALETTE filter: canteen row:', canteen === 1, '| edp filtered out:', edp === 0)
  await d.keyboard.press('Escape'); await d.waitForTimeout(200)
  await d.click('[data-testid="v2-search-trigger"]'); await d.waitForTimeout(250)
  await d.keyboard.type('edp'); await d.waitForTimeout(200)
  await d.keyboard.press('Enter'); await d.waitForTimeout(300)
  console.log('PALETTE enter on session → history page:', await d.getByRole('heading', { name: 'Session history' }).isVisible())
  // intro text hidden, illustration present
  await d.click('[data-testid="v2-new-session-trigger"]'); await d.waitForTimeout(250)
  const headingHidden = await d.evaluate(() => document.querySelector('.kx-new-session__intro-heading').getBoundingClientRect().height <= 1)
  const bodyHidden = await d.evaluate(() => document.querySelector('.kx-new-session__intro-body').getBoundingClientRect().height <= 1)
  const imgVisible = await d.locator('.kx-new-session__intro-img').isVisible()
  console.log('INTRO: heading hidden:', headingHidden, '| body hidden:', bodyHidden, '| illustration kept:', imgVisible)
  // new session row quiet at rest (route active = pale pill is fine)
  const nsBg = await d.evaluate(() => getComputedStyle(document.querySelector('.kx-v2-new-session')).backgroundColor)
  const iconHasBg = await d.evaluate(() => { const el = document.querySelector('.kx-v2-new-session__icon'); return getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)' })
  console.log('NEW SESSION: row bg (active pale expected):', nsBg, '| icon has NO circle fill:', !iconHasBg)
  await b.close()
} finally { try { process.kill(-preview.pid) } catch {} }
