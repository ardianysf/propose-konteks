/*
 * Automated tests for scripts/verify-manifest.mjs (Task T3b, spec AC8).
 *
 * Each test builds a small fixture tree (manifest + registry + tiny .tsx
 * source files) inside a fresh tmp directory and spawns the real script
 * via node child_process, asserting exit code and violation output.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const script = join(root, 'scripts', 'verify-manifest.mjs')

/** Minimal valid fixture: two entries (one default-exported component with
 *  documented props, one named-export component) + matching registry. */
const VALID_COMPONENT_TSX = `export interface WidgetProps {
  label: string
  count?: number
}

export default function Widget({ label }: WidgetProps) {
  return <div>{label}</div>
}
`

const VALID_NAMED_TSX = `export interface BadgeProps {
  tone: 'info' | 'warn'
}

export function Badge({ tone }: BadgeProps) {
  return <span>{tone}</span>
}
`

function validManifest(): {
  schemaVersion: number
  components: Array<Record<string, unknown> & { id: string; sourcePath: string }>
} {
  return {
    schemaVersion: 1,
    components: [
      {
        id: 'widget',
        name: 'Widget',
        domain: 'shell',
        sourcePath: 'fixture/Widget.tsx',
        exportName: 'default',
        classification: 'adoptable',
        description: 'fixture widget',
        propDocs: { label: 'required string' },
        contextContract: null,
        cssFiles: [],
        tokenDeps: [],
        variants: [],
        fixtureRef: null,
        adoptionNotes: '',
      },
      {
        id: 'badge',
        name: 'Badge',
        domain: 'session',
        sourcePath: 'fixture/Badge.tsx',
        exportName: ['Badge'],
        classification: 'mockup-coupled',
        description: 'fixture badge',
        propDocs: null,
        contextContract: { reads: [], dispatches: [] },
        cssFiles: [],
        tokenDeps: [],
        variants: [],
        fixtureRef: null,
        adoptionNotes: '',
      },
    ],
  }
}

const VALID_REGISTRY = `export const registry = [
  { id: 'widget', kind: 'component', load: () => import('../fixture/Widget') },
  { id: 'badge', kind: 'component', load: () => import('../fixture/Badge') },
]
`

describe('verify-manifest script', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'verify-manifest-'))
    mkdirSync(join(dir, 'fixture'), { recursive: true })
    writeFileSync(join(dir, 'fixture', 'Widget.tsx'), VALID_COMPONENT_TSX)
    writeFileSync(join(dir, 'fixture', 'Badge.tsx'), VALID_NAMED_TSX)
    writeManifest(validManifest())
    writeRegistry(VALID_REGISTRY)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  function writeManifest(obj: unknown) {
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify(obj, null, 2))
  }

  function writeRegistry(text: string) {
    writeFileSync(join(dir, 'registry.tsx'), text)
  }

  /** Run the script against the fixture; returns { status, stdout, stderr }. */
  function run() {
    try {
      const stdout = execFileSync(
        process.execPath,
        [script, '--manifest', join(dir, 'manifest.json'), '--registry', join(dir, 'registry.tsx'), '--root', dir],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      )
      return { status: 0, stdout, stderr: '' }
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string }
      return {
        status: e.status ?? 1,
        stdout: e.stdout ?? '',
        stderr: e.stderr ?? '',
      }
    }
  }

  it('(a) exits 0 for a valid fixture manifest + registry', () => {
    const r = run()
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('OK (2 entries)')
  })

  it('(b) exits 1 with a message when a sourcePath is missing', () => {
    const m = validManifest()
    m.components[0].sourcePath = 'fixture/DoesNotExist.tsx'
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S2]')
    expect(r.stderr).toContain('does not exist')
  })

  it('(c) exits 1 when the declared export is missing', () => {
    const m = validManifest()
    m.components[1].exportName = ['NotExported']
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S3]')
    expect(r.stderr).toContain('no named export "NotExported"')
  })

  it('(d) exits 1 on duplicate ids', () => {
    const m = validManifest()
    m.components[1].id = 'widget'
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S1]')
    expect(r.stderr).toContain('duplicate id')
  })

  it('(e) exits 1 when a propDocs name is absent from the props interface', () => {
    const m = validManifest()
    m.components[0].propDocs = { label: 'ok', bogus: 'not a real prop' }
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S4]')
    expect(r.stderr).toContain('"bogus"')
  })

  it('(f) exits 1 when manifest and registry are not 1:1', () => {
    writeRegistry(`export const registry = [
  { id: 'widget', kind: 'component', load: () => import('../fixture/Widget') },
  { id: 'other', kind: 'component', load: () => import('../fixture/Badge') },
]
`)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S5]')
    expect(r.stderr).toContain('manifest id "badge" has no registry entry')
    expect(r.stderr).toContain('registry id "other" has no manifest entry')
  })

  it('(g) exits 1 on unknown tokenDeps names', () => {
    const m = validManifest()
    m.components[0].tokenDeps = ['kx-no-such-token']
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S6]')
    expect(r.stderr).toContain('--kx-no-such-token')
  })

  it('(h) exits 1 when a mockup-coupled entry has contextContract null', () => {
    const m = validManifest()
    m.components[1].contextContract = null
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S7]')
    expect(r.stderr).toContain('entry "badge"')
  })

  it('(i) exits 1 when contextContract.reads is not an array', () => {
    const m = validManifest()
    m.components[1].contextContract = { reads: 'bad', dispatches: [] }
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S7]')
    expect(r.stderr).toContain('contextContract.reads must be an array of strings')
  })

  it('(j) exits 1 when contextContract.dispatches contains non-strings', () => {
    const m = validManifest()
    m.components[1].contextContract = { reads: [], dispatches: [123] }
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S7]')
    expect(r.stderr).toContain('contextContract.dispatches must be an array of strings')
  })

  it('(k) exits 1 when a utility entry declares a wrong exportName', () => {
    const m = validManifest()
    writeManifest({
      schemaVersion: 1,
      components: [
        ...m.components,
        {
          id: 'widget-utils',
          name: 'widgetUtils',
          domain: 'shell',
          sourcePath: 'fixture/widgetUtils.ts',
          exportName: 'notARealExport',
          classification: 'utility',
          description: 'fixture utility module',
          propDocs: null,
          contextContract: null,
          cssFiles: [],
          tokenDeps: [],
          variants: [],
          fixtureRef: null,
          adoptionNotes: '',
        },
      ],
    })
    writeRegistry(`export const registry = [
  { id: 'widget', kind: 'component', load: () => import('../fixture/Widget') },
  { id: 'badge', kind: 'component', load: () => import('../fixture/Badge') },
  { id: 'widget-utils', kind: 'utility', load: () => import('../fixture/widgetUtils') },
]
`)
    writeFileSync(
      join(dir, 'fixture', 'widgetUtils.ts'),
      'export function widgetHelper(): string { return \'ok\' }\n',
    )
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S3]')
    expect(r.stderr).toContain('no named export "notARealExport"')
  })

  it('(l) exits 1 when an adoptable entry has a filled contextContract', () => {
    const m = validManifest()
    m.components[0].contextContract = { reads: ['overlay'], dispatches: [] }
    writeManifest(m)
    const r = run()
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('[S7]')
    expect(r.stderr).toContain('entry "widget"')
  })
})
