#!/usr/bin/env node
/**
 * Capture marketing pages (pricing / docs / journal) with Playwright chromium.
 *
 * Usage:
 *   node scripts/capture-marketing.mjs \
 *     --url http://localhost:4173/pricing/ \
 *     --width 1440 --height 900 \
 *     --theme dark \
 *     --out .impeccable/review/pricing-dark-desktop.png
 *
 * --theme sets localStorage konteks-theme before navigation so the pre-paint
 * stamp resolves the requested theme without a flash. Prints overflow info.
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
const read = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}

const url = read('--url', 'http://localhost:4173/')
const width = Number(read('--width', 1440))
const height = Number(read('--height', 900))
const theme = read('--theme', 'light')
const full = args.includes('--full')
const out = resolve(read('--out', `.impeccable/review/capture-${theme}-${width}.png`))

const browser = await chromium.launch()
try {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  await context.addInitScript((t) => {
    try { localStorage.setItem('konteks-theme', t) } catch (_) {}
  }, theme)
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    title: document.title,
  }))
  mkdirSync(dirname(out), { recursive: true })
  await page.screenshot({ path: out, fullPage: full })
  const overflow = metrics.scrollWidth > metrics.innerWidth
  console.log(JSON.stringify({ out, theme, width, height, ...metrics, overflow }))
  if (overflow) process.exitCode = 2
} finally {
  await browser.close()
}
