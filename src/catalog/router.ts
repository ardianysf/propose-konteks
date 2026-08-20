import { useSyncExternalStore } from 'react'

/**
 * Konteks catalog hash router (spec §2 — "Hash router katalog").
 *
 * Route contract:
 *   '' | '#' | '#/'              → overview
 *   '#/tokens'                   → tokens
 *   '#/components'               → components index
 *   '#/components/<slug>'        → component detail (slug is URI-decoded)
 *   anything else                → not-found (carries the original hash)
 *
 * The parser is pure and unit-testable; the hook is a thin subscription over
 * `hashchange`. Navigation is plain `location.hash = ...` so browser
 * back/forward works naturally.
 */
export type CatalogRoute =
  | { name: 'overview' }
  | { name: 'tokens' }
  | { name: 'components' }
  | { name: 'component'; slug: string }
  | { name: 'not-found'; hash: string }

export function parseHash(hash: string): CatalogRoute {
  // Normalize: strip the leading '#', then the leading '/'. Fragments like
  // '', '#', and '#/' all collapse to the empty path (overview).
  const path = hash.replace(/^#\/?/, '')

  if (path === '') return { name: 'overview' }
  if (path === 'tokens') return { name: 'tokens' }
  if (path === 'components') return { name: 'components' }

  if (path.startsWith('components/')) {
    const rest = path.slice('components/'.length)
    // `#/components/` (no slug) or a nested path is not a valid detail route.
    if (rest !== '' && !rest.includes('/')) {
      try {
        return { name: 'component', slug: decodeURIComponent(rest) }
      } catch {
        // Malformed percent-encoding (e.g. '#/components/%',
        // '#/components/%E0%A4%A') throws URIError — per the spec contract,
        // any hash that does not parse maps to not-found, never a crash.
        return { name: 'not-found', hash }
      }
    }
  }

  return { name: 'not-found', hash }
}

// getSnapshot must return a cached value (useSyncExternalStore re-reads it
// during render and loops on fresh object identities), so we cache by raw
// hash string and only re-parse when the hash actually changed.
let cachedHash: string | null = null
let cachedRoute: CatalogRoute = { name: 'overview' }

function readRoute(): CatalogRoute {
  const hash = window.location.hash
  if (hash !== cachedHash) {
    cachedHash = hash
    cachedRoute = parseHash(hash)
  }
  return cachedRoute
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  // Setting location.hash fires `hashchange` and a history entry, so
  // back/forward arrives as `hashchange` too. Some environments (jsdom
  // edge cases, hash-only `history.go`) can surface `popstate` without a
  // `hashchange`; listening to both is harmless because the callback only
  // re-reads the current hash.
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

/** Current catalog route, re-derived on every hashchange/popstate. */
export function useCatalogRoute(): CatalogRoute {
  return useSyncExternalStore(subscribe, readRoute)
}
