#!/usr/bin/env node
/*
 * Verifies the five required first-party Konteks PNG assets (Task 2, plan §Task 2 step 5):
 *  - exists
 *  - size > 1 KiB
 *  - PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
 *  - SHA-256 digest matches the provenance table in public/assets/konteks/ASSETS.md
 * Success output is exactly: OK: 5/5 Konteks assets verified  (exit 0)
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = join(root, 'public', 'assets', 'konteks')
const assetsMdPath = join(assetsDir, 'ASSETS.md')

const REQUIRED = [
  'logo-text-main.png',
  'web-topbar-icon-128.png',
  'favicon.png',
  'empty-sessions.png',
  'empty-results.png',
]

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Parse `| `file.png` | source-url | `sha256` | size |` rows out of ASSETS.md. */
function parseExpectedDigests(md) {
  const digests = new Map()
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*`([^`]+\.png)`\s*\|[^|]+\|\s*`([0-9a-fA-F]{64})`\s*\|/)
    if (m) digests.set(m[1], m[2].toLowerCase())
  }
  return digests
}

function fail(file, message) {
  console.error(`FAIL: ${file}: ${message}`)
  process.exitCode = 1
}

if (!existsSync(assetsMdPath)) {
  console.error(`FAIL: ASSETS.md not found at ${assetsMdPath}`)
  process.exit(1)
}

const expected = parseExpectedDigests(readFileSync(assetsMdPath, 'utf8'))
let passed = 0

for (const file of REQUIRED) {
  const path = join(assetsDir, file)
  if (!expected.has(file)) {
    fail(file, 'no SHA-256 entry in ASSETS.md')
    continue
  }
  if (!existsSync(path)) {
    fail(file, 'missing')
    continue
  }
  const bytes = readFileSync(path)
  if (bytes.length <= 1024) {
    fail(file, `size ${bytes.length} B is not > 1 KiB`)
    continue
  }
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    fail(file, 'PNG magic bytes mismatch')
    continue
  }
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== expected.get(file)) {
    fail(file, `SHA-256 mismatch (expected ${expected.get(file)}, got ${actual})`)
    continue
  }
  passed++
}

if (passed === REQUIRED.length) {
  console.log(`OK: ${passed}/${REQUIRED.length} Konteks assets verified`)
} else {
  console.error(`Verified only ${passed}/${REQUIRED.length} Konteks assets`)
}
