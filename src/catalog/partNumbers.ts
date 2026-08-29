/*
 * Part-number derivation for the "Industrial Parts Catalog" world.
 *
 * Every manifest entry carries a stable mono part number `KX-<DOM>-<NN>`:
 *   - <DOM> is the three-letter domain code (ACC/CMP/CTX/CST/REV/SES/SHL/SYS)
 *   - <NN> is the entry's 1-based position inside its FULL manifest domain
 *     group (manifest order). Numbering is total and stable: internal and
 *     utility entries hold their slot too, so the numbers on the components
 *     index, the utility/internal sections, and the detail datasheets all
 *     agree — gaps in a domain section are real (those parts are catalogued
 *     under their own sections).
 *
 * Pure derivation over the manifest; no logic in manifest.ts is changed.
 */
import { entriesByDomain, type ManifestEntry } from './manifest'

/** Domain → stencil code (matches the Overview index order, alphabetical). */
export const DOMAIN_CODES: Record<string, string> = {
  account: 'ACC',
  composer: 'CMP',
  context: 'CTX',
  customize: 'CST',
  reviews: 'REV',
  session: 'SES',
  shell: 'SHL',
  system: 'SYS',
}

function codeForDomain(domain: string): string {
  return DOMAIN_CODES[domain] ?? domain.slice(0, 3).toUpperCase()
}

/** entry id → part number, computed once from the manifest. */
const PART_NUMBERS = new Map<string, string>()
for (const group of entriesByDomain()) {
  const code = codeForDomain(group.domain)
  group.entries.forEach((entry, index) => {
    PART_NUMBERS.set(entry.id, `KX-${code}-${String(index + 1).padStart(2, '0')}`)
  })
}

/** Stable catalog part number for a manifest entry, e.g. `KX-SHL-04`. */
export function partNumber(entry: ManifestEntry): string {
  return PART_NUMBERS.get(entry.id) ?? entry.id.toUpperCase()
}
