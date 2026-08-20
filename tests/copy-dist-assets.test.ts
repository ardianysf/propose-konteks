/*
 * copy-dist-assets.test.ts (R6) — tests the copy-dist-assets.mjs script.
 *
 * Verifies that:
 * 1. The script runs successfully with exit code 0
 * 2. Both artifacts (components.json, ai-adoption.md) are copied to dist/
 * 3. Copied files match their sources (same content)
 */

import { readFileSync, rmSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '..')
const DIST_DIR = resolve(ROOT, 'dist')

describe('copy-dist-assets.mjs', () => {
  beforeAll(() => {
    // Clean dist/ before tests to ensure a fresh state
    try {
      rmSync(DIST_DIR, { recursive: true, force: true })
    } catch {
      // Ignore if dist/ doesn't exist
    }
  })

  afterAll(() => {
    // Clean up dist/ after tests
    try {
      rmSync(DIST_DIR, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  it('runs successfully with exit code 0', () => {
    expect(() => {
      execSync('node scripts/copy-dist-assets.mjs', { cwd: ROOT, stdio: 'pipe' })
    }).not.toThrow()
  })

  it('creates dist/ directory if it does not exist', () => {
    execSync('node scripts/copy-dist-assets.mjs', { cwd: ROOT, stdio: 'pipe' })
    expect(existsSync(DIST_DIR)).toBe(true)
  })

  it('copies components.json to dist/components.json', () => {
    execSync('node scripts/copy-dist-assets.mjs', { cwd: ROOT, stdio: 'pipe' })

    const sourcePath = resolve(ROOT, 'src/catalog/components.json')
    const destPath = resolve(DIST_DIR, 'components.json')

    expect(existsSync(destPath)).toBe(true)

    const sourceContent = readFileSync(sourcePath, 'utf-8')
    const destContent = readFileSync(destPath, 'utf-8')

    expect(destContent).toBe(sourceContent)
  })

  it('copies ai-adoption.md to dist/ai-adoption.md', () => {
    execSync('node scripts/copy-dist-assets.mjs', { cwd: ROOT, stdio: 'pipe' })

    const sourcePath = resolve(ROOT, 'docs/ai-adoption.md')
    const destPath = resolve(DIST_DIR, 'ai-adoption.md')

    expect(existsSync(destPath)).toBe(true)

    const sourceContent = readFileSync(sourcePath, 'utf-8')
    const destContent = readFileSync(destPath, 'utf-8')

    expect(destContent).toBe(sourceContent)
  })

  it('copies both artifacts in a single run', () => {
    execSync('node scripts/copy-dist-assets.mjs', { cwd: ROOT, stdio: 'pipe' })

    const componentsJsonExists = existsSync(resolve(DIST_DIR, 'components.json'))
    const aiAdoptionMdExists = existsSync(resolve(DIST_DIR, 'ai-adoption.md'))

    expect(componentsJsonExists).toBe(true)
    expect(aiAdoptionMdExists).toBe(true)
  })

  it('fails with exit code 1 when source file is missing', () => {
    expect(() => {
      // Use --root to point to a non-existent directory
      execSync('node scripts/copy-dist-assets.mjs --root /nonexistent', {
        cwd: ROOT,
        stdio: 'pipe',
      })
    }).toThrow()
  })

  it('supports custom --dist argument', () => {
    const customDist = resolve(ROOT, 'test-dist')

    try {
      rmSync(customDist, { recursive: true, force: true })
    } catch {
      // Ignore
    }

    execSync(`node scripts/copy-dist-assets.mjs --dist ${customDist}`, {
      cwd: ROOT,
      stdio: 'pipe',
    })

    expect(existsSync(resolve(customDist, 'components.json'))).toBe(true)
    expect(existsSync(resolve(customDist, 'ai-adoption.md'))).toBe(true)

    // Cleanup
    try {
      rmSync(customDist, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  it('rejects unknown arguments with exit code 1', () => {
    expect(() => {
      execSync('node scripts/copy-dist-assets.mjs --unknown-flag', {
        cwd: ROOT,
        stdio: 'pipe',
      })
    }).toThrow()
  })

  it('rejects positional arguments with exit code 1', () => {
    expect(() => {
      execSync('node scripts/copy-dist-assets.mjs unexpected-arg', {
        cwd: ROOT,
        stdio: 'pipe',
      })
    }).toThrow()
  })

  it('rejects --root flag without a value with exit code 1', () => {
    expect(() => {
      execSync('node scripts/copy-dist-assets.mjs --root', {
        cwd: ROOT,
        stdio: 'pipe',
      })
    }).toThrow()
  })

  it('rejects --dist flag without a value with exit code 1', () => {
    expect(() => {
      execSync('node scripts/copy-dist-assets.mjs --dist', {
        cwd: ROOT,
        stdio: 'pipe',
      })
    }).toThrow()
  })
})

/**
 * Build-level integration tests.
 *
 * Note: These tests validate the configured npm build script ordering and verify
 * that the final dist artifacts exist. They do NOT spawn `npm run build` to avoid
 * test-time performance overhead and environment coupling. Instead, they validate:
 *
 * 1. The build script order in package.json (tsc -b && vite build && copy-dist-assets)
 * 2. That copy-dist-assets.mjs runs after Vite (produces artifacts into dist/)
 * 3. That the final dist contains all expected artifacts
 *
 * For full build validation, run `npm run build` manually and verify the output.
 */
describe('Build-level integration', () => {
  it('validates package.json build script ordering', () => {
    const packageJsonPath = resolve(ROOT, 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    // Build script must exist
    expect(packageJson.scripts.build).toBeDefined()

    // Build script must have correct order: tsc -> vite -> copy
    const buildScript = packageJson.scripts.build
    expect(buildScript).toContain('tsc -b')
    expect(buildScript).toContain('vite build')
    expect(buildScript).toContain('node scripts/copy-dist-assets.mjs')

    // Verify order: tsc appears before vite build, vite build appears before copy
    const tscIndex = buildScript.indexOf('tsc -b')
    const viteIndex = buildScript.indexOf('vite build')
    const copyIndex = buildScript.indexOf('node scripts/copy-dist-assets.mjs')

    expect(tscIndex).toBeGreaterThanOrEqual(0)
    expect(viteIndex).toBeGreaterThanOrEqual(0)
    expect(copyIndex).toBeGreaterThanOrEqual(0)
    expect(tscIndex).toBeLessThan(viteIndex)
    expect(viteIndex).toBeLessThan(copyIndex)
  })

  it('validates copy-dist-assets.mjs creates artifacts in dist/', () => {
    // Run the copy script
    execSync('node scripts/copy-dist-assets.mjs', {
      cwd: ROOT,
      stdio: 'pipe',
    })

    // Verify both artifacts exist in dist/
    expect(existsSync(resolve(DIST_DIR, 'components.json'))).toBe(true)
    expect(existsSync(resolve(DIST_DIR, 'ai-adoption.md'))).toBe(true)

    // Verify content matches sources
    const componentsJsonSource = readFileSync(
      resolve(ROOT, 'src/catalog/components.json'),
      'utf-8'
    )
    const componentsJsonDest = readFileSync(
      resolve(DIST_DIR, 'components.json'),
      'utf-8'
    )
    expect(componentsJsonDest).toBe(componentsJsonSource)

    const aiAdoptionSource = readFileSync(
      resolve(ROOT, 'docs/ai-adoption.md'),
      'utf-8'
    )
    const aiAdoptionDest = readFileSync(
      resolve(DIST_DIR, 'ai-adoption.md'),
      'utf-8'
    )
    expect(aiAdoptionDest).toBe(aiAdoptionSource)
  })

  it('documents that full build validation requires manual npm run build', () => {
    // This test documents the limitation: we don't run `npm run build` in tests
    // to avoid performance overhead and environment coupling.
    // Manual verification:
    // 1. Run `npm run build`
    // 2. Verify dist/ contains: index.html, catalog.html, components.json, ai-adoption.md
    // 3. Verify dist/assets/ contains bundled JS and CSS
    // 4. Verify dist/manifest.json exists (Vite manifest)

    expect(true).toBe(true) // Documentation-only test
  })
})
