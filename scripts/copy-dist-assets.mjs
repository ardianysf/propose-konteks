#!/usr/bin/env node
/*
 * copy-dist-assets.mjs (R6) — copies canonical artifacts to dist/ after Vite build.
 *
 * This script ensures that src/catalog/components.json and docs/ai-adoption.md
 * are always present in dist/ after npm run build, with no runtime dependencies.
 *
 * Usage: node scripts/copy-dist-assets.mjs [--root <dir>] [--dist <dir>]
 * Exit 0 on success, exit 1 on error.
 */

import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// CLI args
const VALID_FLAGS = ['--root', '--dist']
const args = process.argv.slice(2)

function argValue(flag) {
  const i = args.indexOf(flag)
  if (i < 0) return undefined
  const value = args[i + 1]
  if (value === undefined || value.startsWith('--')) {
    console.error(`Error: --${flag.slice(2)} requires a value`)
    process.exit(1)
  }
  return value
}

// Validate: no unknown arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg.startsWith('--')) {
    if (!VALID_FLAGS.includes(arg)) {
      console.error(`Error: Unknown argument: ${arg}`)
      console.error(`Valid arguments: ${VALID_FLAGS.join(', ')}`)
      process.exit(1)
    }
    // Skip the value for this flag
    i++
  } else {
    // Positional argument (not a flag)
    console.error(`Error: Unexpected positional argument: ${arg}`)
    console.error(`This script only accepts flags: ${VALID_FLAGS.join(', ')}`)
    process.exit(1)
  }
}

const rootDir = resolve(argValue('--root') || join(__dirname, '..'))
const distDir = resolve(argValue('--dist') || join(rootDir, 'dist'))

// Artifact definitions: source path (relative to root) and destination filename
const ARTIFACTS = [
  {
    source: 'src/catalog/components.json',
    dest: 'components.json',
    description: 'Component manifest',
  },
  {
    source: 'docs/ai-adoption.md',
    dest: 'ai-adoption.md',
    description: 'AI adoption guide',
  },
]

/**
 * Ensure a directory exists (recursive mkdir).
 */
async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

/**
 * Copy a single file from source to destination.
 */
async function copyArtifact(sourcePath, destPath, description) {
  const absSource = join(rootDir, sourcePath)
  const absDest = join(distDir, destPath)

  try {
    await copyFile(absSource, absDest)
    console.log(`✓ Copied ${description}: ${sourcePath} → dist/${destPath}`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Source file not found: ${absSource}`)
    }
    throw err
  }
}

/**
 * Main: copy all artifacts to dist/.
 */
async function main() {
  await ensureDir(distDir)

  const errors = []
  for (const artifact of ARTIFACTS) {
    try {
      await copyArtifact(artifact.source, artifact.dest, artifact.description)
    } catch (err) {
      errors.push(`${artifact.description}: ${err.message}`)
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Failed to copy artifacts:')
    for (const err of errors) {
      console.error(`  - ${err}`)
    }
    process.exit(1)
  }

  console.log(`\n✅ OK: ${ARTIFACTS.length} artifact(s) copied to dist/`)
}

main().catch((err) => {
  console.error(`\n❌ Fatal error: ${err.message}`)
  process.exit(1)
})
