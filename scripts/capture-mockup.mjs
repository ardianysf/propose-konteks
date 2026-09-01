#!/usr/bin/env node
/*
 * capture-mockup.mjs — visual capture protocol for the CSS migration
 * (spec docs/plans/2026-08-20-konteks-dual-output-pivot.md §2 decision D).
 *
 * Captures the mockup routes × ?mock variants × viewports into
 * artifacts/css-migration/<label>/ as full-page PNGs, one set per label
 * ("baseline", "after-account", …). Comparison itself is a manual
 * validator review — this script only guarantees a consistent capture:
 * chromium headless, document.fonts.ready + networkidle, deterministic
 * file names.
 *
 * Target matrix: 5 route/variant targets × 2 viewports = 10 PNGs.
 *   new-session     → default, loading, empty (initial route, no gesture)
 *   session-history → default only
 *   session-detail  → default only
 * The session routes need session data, so loading/empty variants are
 * skipped there (the reducer swaps the list content and the history rows
 * would not exist / never settle).
 *
 * Routes are state-driven (the mockup has no URL router), so route
 * navigation is scripted with the same user gestures the e2e suite uses:
 *   new-session     → initial route (no gesture)
 *   session-history → "View all" button in the sidebar
 *   session-detail  → first row in session history
 * ?mock=loading|empty applies on load (parsed once by initialState), so
 * the variant is set via the URL query and the route gesture runs after.
 *
 * Rail strategy (≤1280px): the responsive media query forces the sidebar
 * into the 64px icon rail and hides `.kx-sidebar__recent` (the "View all"
 * control), so gesture navigation is impossible at the compact viewport.
 * For a target viewport below 1280 that needs navigation, the page is
 * created at the desktop navigation viewport (1440×900), the route is
 * reached via the gestures above, and only then the page is resized to
 * the target viewport — matching tests/e2e/visual.spec.ts. New-session
 * targets are created directly at the target viewport (no gesture).
 *
 * Every target screenshot gets a fresh browser context + page so no
 * state/theme leaks between captures. Failures are logged per target and
 * the script exits nonzero if any target failed.
 *
 * Zero new dependencies: uses the playwright library API already required
 * by @playwright/test (devDependency).
 *
 * CLI: node scripts/capture-mockup.mjs <label> --port 4173 [--base-url http://localhost:4173]
 *
 * NOTE: the v2 shell is now the primary app at / — this script's route
 * gestures ("View all", history-row, session-detail) target the retired old
 * shell DOM and no longer match the root page.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1200x720', width: 1200, height: 720 },
]

/** Below this width the sidebar collapses to the icon rail (View all hidden). */
const RAIL_BREAKPOINT = 1280

/** Desktop viewport used to perform gesture navigation for compact targets. */
const NAV_VIEWPORT = { width: 1440, height: 900 }

// mock variant → query string ('' = ready/default)
const VARIANTS = [
  { name: null, query: '' },
  { name: 'loading', query: '?mock=loading' },
  { name: 'empty', query: '?mock=empty' },
]

/**
 * Route gestures — run after page load. Only the default variant is
 * captured for the session routes (see the header comment), keeping the
 * matrix at (3 + 1 + 1) × 2 = 10 targets.
 */
const ROUTES = [
  { name: 'new-session', variants: ['default', 'loading', 'empty'], navigate: null },
  {
    name: 'session-history',
    variants: ['default'],
    navigate: async (page) => {
      await page.getByRole('button', { name: 'View all' }).click()
      await page.getByRole('region', { name: 'Session history' }).waitFor()
    },
  },
  {
    name: 'session-detail',
    variants: ['default'],
    navigate: async (page) => {
      await page.getByRole('button', { name: 'View all' }).click()
      await page.getByRole('region', { name: 'Session history' }).waitFor()
      await page.getByTestId('history-row').first().click()
      await page.getByTestId('session-detail').waitFor()
    },
  },
]

function parseArgs(argv) {
  const args = { label: null, port: null, baseUrl: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--port') args.port = Number(argv[++i])
    else if (arg === '--base-url') args.baseUrl = argv[++i]
    else if (!arg.startsWith('--') && args.label === null) args.label = arg
    else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!args.label) throw new Error('Missing <label> argument')
  if (!args.baseUrl) {
    if (!args.port) throw new Error('Missing --port (or --base-url)')
    args.baseUrl = `http://localhost:${args.port}`
  }
  return args
}

/** Wait for layout/fonts/network to settle before capturing. */
async function waitForStable(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
}

async function main() {
  const { label, baseUrl } = parseArgs(process.argv.slice(2))
  const outDir = path.resolve('artifacts/css-migration', label)
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch()
  const captured = []
  const failed = []

  try {
    for (const viewport of VIEWPORTS) {
      for (const route of ROUTES) {
        for (const variantName of route.variants) {
          const variant = VARIANTS.find((v) => (v.name ?? 'default') === variantName)
          const file = `${route.name}${variant.name ? `--${variant.name}` : ''}--${viewport.name}.png`
          // Compact targets that need gesture navigation must navigate at
          // the desktop viewport first (the rail hides View all ≤1280px),
          // then resize to the target viewport before capturing.
          const navigateFirst = route.navigate !== null && viewport.width < RAIL_BREAKPOINT
          const initial = navigateFirst ? NAV_VIEWPORT : viewport
          // Fresh context + page per target: no state/theme leakage.
          const context = await browser.newContext({
            viewport: { width: initial.width, height: initial.height },
            // Deterministic captures: pin the app into its reduced-motion
            // code path (global.css §15 zeroes every transition/animation
            // duration with !important). Gesture navigation leaves the
            // pointer hovering whatever control sits at the last click
            // point after the compact-viewport resize (e.g. a history row,
            // revealing the three-dot action); without this the fade-out
            // transition is still mid-flight at screenshot time and the
            // capture flakes by a few antialiased pixels.
            reducedMotion: 'reduce',
          })
          try {
            const page = await context.newPage()
            await page.goto(`${baseUrl}/${variant.query}`, { waitUntil: 'networkidle' })
            if (route.navigate) await route.navigate(page)
            if (navigateFirst) {
              await page.setViewportSize({ width: viewport.width, height: viewport.height })
            }
            // Park the pointer over an inert part of the page before
            // capturing. Gesture navigation leaves the mouse at the last
            // click point; after the compact-viewport resize that point can
            // land on a hover-styled element (sidebar buttons, history
            // rows). (0,0) is NOT safe: at 1440×900 the sidebar spans
            // x 0..312, so the corner still hovers sidebar controls. The
            // bottom-left corner sits on the 64px rail at compact
            // viewports (no hover-reveal controls there) and on empty
            // canvas at desktop.
            await page.mouse.move(2, viewport.height - 1)
            // Wait out the viewport-resize layout race. The resize's style
            // recalc is not guaranteed to have flushed when fonts.ready
            // resolves: documentElement.scrollHeight can still report the
            // PRE-resize height (900) at screenshot time, and Playwright's
            // fullPage capture sizes the output canvas from that stale
            // value — producing a 1200×900 PNG (top 720px identical,
            // canvas-colored padding below) instead of 1200×720. Wait for
            // two consecutive animation frames at the settled height so
            // the capture always reads the post-resize layout.
            await page.waitForFunction((expectedHeight) => {
              return new Promise((resolve) => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    resolve(document.documentElement.scrollHeight === expectedHeight)
                  })
                })
              })
            }, viewport.height)
            await waitForStable(page)
            await page.screenshot({ path: path.join(outDir, file), fullPage: true })
            captured.push(file)
            console.log(`captured ${file}`)
          } catch (error) {
            failed.push(`${file}: ${error.message}`)
            console.error(`FAILED ${file}: ${error.message}`)
          } finally {
            await context.close()
          }
        }
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`\nlabel=${label} dir=${outDir}`)
  console.log(`captured: ${captured.length} file(s)`)
  if (failed.length > 0) {
    console.error(`failed: ${failed.length}`)
    for (const f of failed) console.error(`  - ${f}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
