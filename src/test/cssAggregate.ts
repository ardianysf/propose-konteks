/*
 * cssAggregate.ts — shared CSS source reader for source-string assertion tests.
 *
 * Spec: docs/plans/2026-08-20-konteks-dual-output-pivot.md §8 (addendum,
 * T5a escalation). While the T5 CSS migration moves rules out of
 * src/styles/components.css into per-domain src/components/**\/*.css files,
 * tests must assert against the AGGREGATE of all shipped stylesheets
 * instead of components.css alone. The aggregate is a superset of
 * components.css, so existing presence assertions keep their intent; after
 * pass 2 deletes migrated rules from components.css the aggregate keeps
 * them findable at their new location.
 *
 * Deterministic order: tokens.css, global.css, components.css, then every
 * src/components/**\/*.css sorted by path (localeCompare).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd
// (same convention as tokens.test.ts / responsive.test.ts).
const ROOT = process.cwd()
const STYLES_DIR = join(ROOT, 'src/styles')
const COMPONENTS_DIR = join(ROOT, 'src/components')

function listComponentCssFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listComponentCssFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(full)
    }
  }
  return files
}

/** Deterministic aggregate of every shipped stylesheet (see header). */
export function getAggregatedCss(): string {
  return getAggregatedCssParts()
    .map((p) => p.css)
    .join('\n')
}

/**
 * Same aggregate as getAggregatedCss(), but as per-file parts with correct
 * file attribution. Use this when a test needs to know WHICH file a rule
 * lives in (e.g. contrast inventory classification); use the plain string
 * for order-insensitive presence assertions.
 */
export function getAggregatedCssParts(): Array<{ file: string; css: string }> {
  const parts: Array<{ file: string; css: string }> = [
    { file: 'src/styles/tokens.css', css: readFileSync(join(STYLES_DIR, 'tokens.css'), 'utf8') },
    { file: 'src/styles/global.css', css: readFileSync(join(STYLES_DIR, 'global.css'), 'utf8') },
    { file: 'src/styles/components.css', css: readFileSync(join(STYLES_DIR, 'components.css'), 'utf8') },
  ]
  const componentFiles = listComponentCssFiles(COMPONENTS_DIR).sort((a, b) => a.localeCompare(b))
  for (const file of componentFiles) {
    parts.push({ file: file.slice(ROOT.length + 1), css: readFileSync(file, 'utf8') })
  }
  return parts
}

/**
 * Collect the bodies of EVERY @media block whose query matches `query`
 * (string containment, e.g. '(max-width: 1280px)') and concatenate them.
 *
 * Unlike an indexOf+slice read this works on the aggregate, where the same
 * query may appear in several files. The scan is a simple brace-matching
 * parser (not a greedy regex): it walks the source linearly, tracks brace
 * depth, and slices each matching block from its outer `{` to its matching
 * `}`. Returns the concatenated INNER bodies of all matching blocks.
 */
export function extractMediaBlocks(css: string, query: string): string {
  const needle = '@media'
  const bodies: string[] = []
  let i = 0
  while (i < css.length) {
    const at = css.indexOf(needle, i)
    if (at === -1) break
    const open = css.indexOf('{', at + needle.length)
    if (open === -1) break
    const header = css.slice(at + needle.length, open)
    // Brace-match from the opening brace to find the block end.
    let depth = 0
    let end = -1
    for (let j = open; j < css.length; j++) {
      const ch = css[j]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          end = j
          break
        }
      }
    }
    if (end === -1) break // unbalanced source — stop scanning
    if (header.includes(query)) {
      bodies.push(css.slice(open + 1, end))
    }
    i = end + 1
  }
  return bodies.join('\n')
}
