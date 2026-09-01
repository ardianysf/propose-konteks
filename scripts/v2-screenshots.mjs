/*
 * V2 visual capture — screenshots for the v2 navigation surface (now the root app at /).
 * Run: node scripts/v2-screenshots.mjs (serves dist/ via `vite preview`).
 */
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = 'test-results/v2'
mkdirSync(OUT, { recursive: true })

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  stdio: 'ignore',
  detached: true,
})

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('preview server did not start')
}

try {
  await waitForServer('http://localhost:4173/')
  const browser = await chromium.launch()

  // Desktop 1440x900 — light
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await desktop.goto('http://localhost:4173/')
  await desktop.waitForLoadState('networkidle')
  await desktop.waitForTimeout(400)
  await desktop.screenshot({ path: `${OUT}/v2-desktop-light.png` })

  // Desktop dark — via the account popover's theme control (real user path)
  await desktop.click('[data-testid="v2-account-trigger"]')
  await desktop.click('[aria-label="Dark theme"]')
  await desktop.mouse.click(900, 450) // outside-click closes the popover
  await desktop.waitForTimeout(300)
  await desktop.screenshot({ path: `${OUT}/v2-desktop-dark.png` })

  // Desktop dark — context popover open (anchored right of the sidebar)
  await desktop.click('[data-testid="v2-context-trigger"]')
  await desktop.waitForTimeout(400)
  await desktop.screenshot({ path: `${OUT}/v2-desktop-dark-context-popover.png` })
  await desktop.close()

  // Mobile 390x844 — light, drawer closed
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto('http://localhost:4173/')
  await mobile.waitForLoadState('networkidle')
  await mobile.waitForTimeout(400)
  await mobile.screenshot({ path: `${OUT}/v2-mobile-light-closed.png` })

  // Mobile — drawer open via hamburger
  await mobile.click('[data-testid="v2-mobile-sidebar-toggle"]')
  await mobile.waitForTimeout(500)
  await mobile.screenshot({ path: `${OUT}/v2-mobile-light-drawer-open.png` })
  await mobile.close()

  await browser.close()
  console.log('Screenshots written to', OUT)
} finally {
  try {
    process.kill(-preview.pid)
  } catch {}
}
