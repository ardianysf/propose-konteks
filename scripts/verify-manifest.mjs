#!/usr/bin/env node
/*
 * verify-manifest.mjs (Task T3b, spec §2 keputusan B/C, AC8) — validates
 * src/catalog/components.json against the repo and src/catalog/registry.tsx.
 *
 * Checks (tagged S1–S7 in output):
 *   S1  schemaVersion === 1; id unique; id kebab-case slug; domain valid
 *       (account|composer|context|customize|reviews|session|shell|system);
 *       classification valid (adoptable|mockup-coupled|internal|utility).
 *   S2  sourcePath exists on the filesystem.
 *   S3  exports exist (TypeScript Compiler API AST per file):
 *         - exportName "default"  → file has `export default`
 *         - exportName array      → every name is a named export
 *         - exportName <string>   → file has that named export
 *       Utility modules are validated exactly like every other entry:
 *       against their declared exportName (preservedContent, formatTime,
 *       useFocusContainment are pure named-export modules and must
 *       declare their named exports).
 *   S4  propDocs: every documented prop name must exist in the props
 *       interface/type of the exported component (first parameter type of
 *       the component function; supports TypeReference to a local
 *       interface/type alias and inline object type literals).
 *   S5  manifest ↔ registry 1:1: literal ids extracted from registry.tsx;
 *       no manifest id without a registry entry and vice versa.
 *   S6  tokenDeps: every name must match a `--<name>` definition in
 *       src/styles/tokens.css (simple line parser for this file's syntax).
 *       Currently all tokenDeps are empty; the check stays active.
 *   S7  contextContract shape vs classification:
 *         - mockup-coupled|internal → MUST be an object with EXACTLY the
 *           properties { reads: string[], dispatches: string[] } (both
 *           arrays of strings; empty arrays allowed — e.g. overlay-
 *           lifecycle reads is legitimately empty; null/undefined/missing
 *           or any other shape → violation).
 *         - adoptable|utility → contextContract must be absent or null.
 *
 * Usage: node scripts/verify-manifest.mjs [--manifest <path>] [--registry <path>]
 *        [--tokens <path>] [--root <dir>]
 * sourcePath values are resolved against --root (default: repo root).
 * Exit 0 with "OK (<n> entries)" when clean, exit 1 with a human-readable
 * list of violations otherwise.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Resolve a repo-relative path against the repo root. */
function fromRoot(p) {
  return isAbsolute(p) ? p : resolve(root, p)
}

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function argValue(flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const manifestPath = fromRoot(argValue('--manifest') ?? 'src/catalog/components.json')
const registryPath = fromRoot(argValue('--registry') ?? 'src/catalog/registry.tsx')
const tokensPath = fromRoot(argValue('--tokens') ?? 'src/styles/tokens.css')
const sourceRoot = fromRoot(argValue('--root') ?? '.')

// ── violation collector ─────────────────────────────────────────────────────
const violations = []
function fail(check, where, message) {
  violations.push(`[${check}] ${where}: ${message}`)
}

const VALID_DOMAINS = new Set([
  'account',
  'composer',
  'context',
  'customize',
  'reviews',
  'session',
  'shell',
  'system',
])
const VALID_CLASSIFICATIONS = new Set(['adoptable', 'mockup-coupled', 'internal', 'utility'])
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

// ── AST helpers (TypeScript Compiler API) ───────────────────────────────────

/** Has `export` or `default` among modifiers? */
function hasModifier(node, kind) {
  return (node.modifiers ?? []).some((m) => m.kind === kind)
}

/** Direct (non-re-exported) export information of one source file. */
function collectExports(sf) {
  const named = new Set()
  let hasDefault = false
  for (const st of sf.statements) {
    if (ts.isExportAssignment(st) && !st.isExportEquals) {
      hasDefault = true // `export default <expr>`
      continue
    }
    if (ts.isExportDeclaration(st)) {
      if (st.moduleSpecifier) continue // re-export from another module: ignore
      if (st.exportClause && ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) {
          named.add((el.name ?? el.propertyName).text)
        }
      }
      continue
    }
    const isExported = hasModifier(st, ts.SyntaxKind.ExportKeyword)
    const isDefault = hasModifier(st, ts.SyntaxKind.DefaultKeyword)
    if (!isExported && !isDefault) continue
    if (isDefault) hasDefault = true
    const decls =
      ts.isVariableStatement(st) ? st.declarationList.declarations
      : st.name ? [st]
      : []
    for (const d of decls) {
      if (isExported && d.name) named.add(d.name.text)
    }
  }
  return { named, hasDefault }
}

/**
 * Resolve a props TypeNode to its member property names.
 * Supports: TypeReference to a local interface or type alias (object literal),
 * and inline object type literals. Returns null when unsupported.
 */
function propNamesOfType(typeNode, sf) {
  if (!typeNode) return null
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members.filter(ts.isPropertySignature).map((m) => m.name?.text).filter(Boolean)
  }
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    const refName = typeNode.typeName.text
    for (const st of sf.statements) {
      if (ts.isInterfaceDeclaration(st) && st.name.text === refName) {
        return st.members.filter(ts.isPropertySignature).map((m) => m.name?.text).filter(Boolean)
      }
      if (ts.isTypeAliasDeclaration(st) && st.name.text === refName) {
        return propNamesOfType(st.type, sf)
      }
    }
  }
  return null
}

/**
 * Collect the prop names of every component function in the file, keyed by
 * component name ("<default>" for the anonymous default-exported function).
 * Component = function declaration/expression/arrow whose first parameter
 * carries a props type annotation.
 */
function collectComponentProps(sf) {
  const map = new Map() // name -> string[] | null
  const record = (name, fn) => {
    const param = fn.parameters?.[0]
    if (!param || !param.type) return
    map.set(name, propNamesOfType(param.type, sf))
  }
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st)) {
      record(st.name?.text ?? '<default>', st)
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (
          d.initializer &&
          (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) &&
          ts.isIdentifier(d.name)
        ) {
          record(d.name.text, d.initializer)
        }
      }
    } else if (ts.isExportAssignment(st) && !st.isExportEquals) {
      // `export default function (...) {}` without name
      if (ts.isFunctionExpression(st.expression)) record('<default>', st.expression)
    }
  }
  return map
}

/** Parse a .ts/.tsx source file. */
function parseSource(absPath) {
  const text = readFileSync(absPath, 'utf8')
  const kind = absPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, kind)
}

// ── registry id extraction ──────────────────────────────────────────────────
/** Extract literal `id: '...'` values from the registry array (literal file). */
function registryIds(registryAbsPath) {
  const sf = parseSource(registryAbsPath)
  const ids = []
  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'id' &&
      ts.isStringLiteral(node.initializer)
    ) {
      ids.push(node.initializer.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return ids
}

// ── tokens.css parser ───────────────────────────────────────────────────────
/** Names of `--token` custom properties defined in tokens.css. */
function tokenNames(cssAbsPath) {
  const names = new Set()
  for (const line of readFileSync(cssAbsPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*(--[\w-]+)\s*:/)
    if (m) names.add(m[1])
  }
  return names
}

// ── main ────────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(manifestPath)) {
    console.error(`FAIL: manifest not found at ${manifestPath}`)
    process.exit(1)
  }
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    console.error(`FAIL: manifest is not valid JSON: ${err.message}`)
    process.exit(1)
  }

  // S1 — schema shape
  if (manifest.schemaVersion !== 1) {
    fail('S1', 'manifest', `schemaVersion must be 1, got ${JSON.stringify(manifest.schemaVersion)}`)
  }
  const components = manifest.components
  if (!Array.isArray(components)) {
    fail('S1', 'manifest', 'components must be an array')
  }
  const entries = Array.isArray(components) ? components : []
  const seenIds = new Map()
  entries.forEach((entry, i) => {
    const where = entry?.id ? `entry "${entry.id}"` : `entry #${i}`
    if (typeof entry?.id !== 'string' || entry.id === '') {
      fail('S1', where, 'id must be a non-empty string')
    } else {
      if (seenIds.has(entry.id)) {
        fail('S1', where, `duplicate id (first seen at entry #${seenIds.get(entry.id)})`)
      } else {
        seenIds.set(entry.id, i)
      }
      if (!SLUG_RE.test(entry.id)) {
        fail('S1', where, `id "${entry.id}" is not kebab-case slug format`)
      }
    }
    if (!VALID_DOMAINS.has(entry?.domain)) {
      fail('S1', where, `domain ${JSON.stringify(entry?.domain)} is not valid`)
    }
    if (!VALID_CLASSIFICATIONS.has(entry?.classification)) {
      fail('S1', where, `classification ${JSON.stringify(entry?.classification)} is not valid`)
    }
  })

  const definedTokens = existsSync(tokensPath) ? tokenNames(tokensPath) : null
  if (definedTokens === null) fail('S6', 'tokens', `tokens.css not found at ${tokensPath}`)

  const astCache = new Map() // absPath -> { sf, exports, props }
  function analyze(absPath) {
    if (!astCache.has(absPath)) {
      const sf = parseSource(absPath)
      astCache.set(absPath, {
        sf,
        exports: collectExports(sf),
        props: collectComponentProps(sf),
      })
    }
    return astCache.get(absPath)
  }

  for (const entry of entries) {
    if (typeof entry?.id !== 'string' || entry.id === '') continue
    const where = `entry "${entry.id}"`

    // S2 — sourcePath exists
    if (typeof entry.sourcePath !== 'string' || entry.sourcePath === '') {
      fail('S2', where, 'sourcePath must be a non-empty string')
      continue
    }
    const absSource = resolve(sourceRoot, entry.sourcePath)
    if (!existsSync(absSource)) {
      fail('S2', where, `sourcePath "${entry.sourcePath}" does not exist`)
      continue
    }

    const { exports: ex, props } = analyze(absSource)

    // S3 — exports exist (utility modules validated by exportName too)
    if (entry.exportName === 'default') {
      if (!ex.hasDefault) {
        fail('S3', where, `"${entry.sourcePath}" has no default export`)
      }
    } else if (Array.isArray(entry.exportName)) {
      for (const name of entry.exportName) {
        if (!ex.named.has(name)) {
          fail('S3', where, `"${entry.sourcePath}" has no named export "${name}"`)
        }
      }
    } else if (typeof entry.exportName === 'string') {
      if (!ex.named.has(entry.exportName)) {
        fail('S3', where, `"${entry.sourcePath}" has no named export "${entry.exportName}"`)
      }
    } else {
      fail('S3', where, `exportName must be "default", a name, or an array of names`)
    }

    // S4 — propDocs names exist in the component's props type
    const propDocs = entry.propDocs
    if (propDocs && typeof propDocs === 'object' && Object.keys(propDocs).length > 0) {
      const targetNames = Array.isArray(entry.exportName)
        ? entry.exportName
        : entry.exportName === 'default'
          ? ['<default>']
          : [entry.exportName]
      // component candidates: the exported names, falling back to entry.name
      const candidates = [...targetNames, entry.name]
      let resolved = null
      for (const c of candidates) {
        if (props.has(c)) {
          resolved = { name: c, names: props.get(c) }
          break
        }
      }
      if (!resolved) {
        fail('S4', where, `could not locate component function to check propDocs against`)
      } else if (resolved.names === null) {
        fail('S4', where, `props type of "${resolved.name}" is not a supported shape (TypeReference to local interface/type alias or inline object literal)`)
      } else {
        for (const docName of Object.keys(propDocs)) {
          if (!resolved.names.includes(docName)) {
            fail('S4', where, `propDocs documents "${docName}" but it is not a property of the props type of "${resolved.name}"`)
          }
        }
      }
    }

    // S6 — tokenDeps defined in tokens.css
    if (Array.isArray(entry.tokenDeps) && definedTokens) {
      for (const dep of entry.tokenDeps) {
        const token = dep.startsWith('--') ? dep : `--${dep}`
        if (!definedTokens.has(token)) {
          fail('S6', where, `tokenDeps references "${token}" which is not defined in src/styles/tokens.css`)
        }
      }
    }

    // S7 — contextContract shape vs classification
    const cc = entry.contextContract
    if (entry.classification === 'adoptable' || entry.classification === 'utility') {
      if (cc != null) {
        fail('S7', where, `classification "${entry.classification}" must have contextContract null/absent (found a value)`)
      }
    } else if (entry.classification === 'mockup-coupled' || entry.classification === 'internal') {
      const shapeProblem = (() => {
        if (cc == null) return 'contextContract is required (must be an object, not null/absent)'
        if (typeof cc !== 'object' || Array.isArray(cc)) return 'contextContract must be an object { reads, dispatches }'
        const keys = Object.keys(cc)
        const missing = ['reads', 'dispatches'].filter((k) => !(k in cc))
        if (missing.length > 0) return `contextContract is missing required propertie(s): ${missing.join(', ')}`
        const extra = keys.filter((k) => k !== 'reads' && k !== 'dispatches')
        if (extra.length > 0) return `contextContract has unexpected propertie(s): ${extra.join(', ')}`
        for (const k of ['reads', 'dispatches']) {
          const v = cc[k]
          if (!Array.isArray(v)) return `contextContract.${k} must be an array of strings`
          if (!v.every((x) => typeof x === 'string')) return `contextContract.${k} must be an array of strings`
        }
        return null
      })()
      if (shapeProblem) fail('S7', where, shapeProblem)
    }
  }

  // S5 — manifest ↔ registry 1:1
  if (!existsSync(registryPath)) {
    fail('S5', 'registry', `registry not found at ${registryPath}`)
  } else {
    const ids = registryIds(registryPath)
    const regSet = new Set(ids)
    ids.forEach((id, i) => {
      if (ids.indexOf(id) !== i) fail('S5', 'registry', `duplicate id "${id}" in registry`)
    })
    for (const id of seenIds.keys()) {
      if (!regSet.has(id)) fail('S5', 'registry', `manifest id "${id}" has no registry entry`)
    }
    for (const id of regSet) {
      if (!seenIds.has(id)) fail('S5', 'registry', `registry id "${id}" has no manifest entry`)
    }
  }

  // ── report ──
  if (violations.length > 0) {
    console.error(`Manifest verification failed with ${violations.length} violation(s):`)
    for (const v of violations) console.error(`  ${v}`)
    process.exit(1)
  }
  console.log(`OK (${entries.length} entries)`)
}

main()
