/*
 * Typed access layer over src/catalog/components.json (the machine-readable
 * manifest, spec §2 "Dua lapis data katalog"). The JSON is the single
 * source of truth; this module only types and re-exports it.
 */
import manifestJson from './components.json'

export type ManifestClassification =
  | 'adoptable'
  | 'mockup-coupled'
  | 'internal'
  | 'utility'

export interface ManifestContextContract {
  reads: string[]
  dispatches: string[]
}

export interface ManifestEntry {
  id: string
  name: string
  domain: string
  sourcePath: string
  exportName: string | string[]
  classification: ManifestClassification
  description: string
  propDocs: Record<string, string> | null
  contextContract: ManifestContextContract | null
  cssFiles: string[]
  tokenDeps: string[]
  variants: string[]
  fixtureRef: string | null
  adoptionNotes: string
  /** Mobile (≤760px) behavior notes — present only for components with
   * responsive adaptations; the catalog surfaces them as guidelines. */
  responsive?: string
}

export interface Manifest {
  schemaVersion: number
  components: ManifestEntry[]
}

export const manifest = manifestJson as Manifest

export const manifestEntries: readonly ManifestEntry[] = manifest.components

export function getManifestEntry(id: string): ManifestEntry | undefined {
  return manifest.components.find((entry) => entry.id === id)
}

/** Entries grouped by domain, preserving manifest order within a domain and
 *  first-appearance order across domains. */
export function entriesByDomain(): Array<{ domain: string; entries: ManifestEntry[] }> {
  const groups = new Map<string, ManifestEntry[]>()
  for (const entry of manifest.components) {
    const list = groups.get(entry.domain)
    if (list) list.push(entry)
    else groups.set(entry.domain, [entry])
  }
  return [...groups.entries()].map(([domain, entries]) => ({ domain, entries }))
}
