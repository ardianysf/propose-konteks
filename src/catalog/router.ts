import { useSyncExternalStore } from 'react'

/**
 * Konteks catalog clean URL router (spec §2 — "Clean URL routing").
 *
 * Route contract:\n *   `/catalog`                    → overview\n *   `/catalog/tokens`             → tokens\n *   `/catalog/components`         → components index\n *   `/catalog/components/<slug>`  → component detail (slug is URI-decoded)\n *   anything else                  → not-found (carries the original path)
 *
 * The parser is pure and unit-testable; the hook is a thin subscription over
 * `popstate`. Navigation uses `history.pushState` so browser back/forward
 * works naturally.
 */
export type CatalogRoute =
  | { name: 'overview' }
  | { name: 'tokens' }
  | { name: 'components' }
  | { name: 'component'; slug: string }
  | { name: 'not-found'; path: string }

const CATALOG_BASE = '/catalog'

/**
 * Parse a pathname into a CatalogRoute. Strips the `/catalog` prefix and
 * routes the remainder. Paths without the catalog base are treated as
 * not-found.
 *
 * Valid routes:
 *   `/catalog` or `/catalog/` → overview
 *   `/catalog/tokens` → tokens (trailing slash not allowed)
 *   `/catalog/components` → components (trailing slash not allowed)
 *   `/catalog/components/<slug>` → component detail (trailing slash not allowed)
 */
export function parsePathname(pathname: string): CatalogRoute {
  // Path must start with /catalog
  if (!pathname.startsWith(CATALOG_BASE)) {
    return { name: 'not-found', path: pathname }
  }

  // Extract the path after /catalog
  const rest = pathname.slice(CATALOG_BASE.length)

  // Empty or just slash → overview (both /catalog and /catalog/ are valid)
  if (rest === '' || rest === '/') {
    return { name: 'overview' }
  }

  // Remove leading slash for segment matching
  const segment = rest.startsWith('/') ? rest.slice(1) : rest

  // Check for trailing slash on non-base routes (not allowed)
  if (segment.endsWith('/')) {
    return { name: 'not-found', path: pathname }
  }

  if (segment === 'tokens') {
    return { name: 'tokens' }
  }

  if (segment === 'components') {
    return { name: 'components' }
  }

  if (segment.startsWith('components/')) {
    const slug = segment.slice('components/'.length)
    // `/catalog/components/` (no slug) or a nested path is not a valid detail route.
    if (slug !== '' && !slug.includes('/')) {
      try {
        return { name: 'component', slug: decodeURIComponent(slug) }
      } catch {
        // Malformed percent-encoding (e.g. '/catalog/components/%',
        // '/catalog/components/%E0%A4%A') throws URIError — per the spec contract,
        // any path that does not parse maps to not-found, never a crash.
        return { name: 'not-found', path: pathname }
      }
    }
  }

  return { name: 'not-found', path: pathname }
}

// getSnapshot must return a cached value (useSyncExternalStore re-reads it
// during render and loops on fresh object identities), so we cache by raw
// pathname string and only re-parse when the path actually changed.
let cachedPathname: string | null = null
let cachedRoute: CatalogRoute = { name: 'overview' }

function readRoute(): CatalogRoute {
  const pathname = window.location.pathname
  if (pathname !== cachedPathname) {
    cachedPathname = pathname
    cachedRoute = parsePathname(pathname)
  }
  return cachedRoute
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
  }
}

/** Current catalog route, re-derived on every popstate. */
export function useCatalogRoute(): CatalogRoute {
  return useSyncExternalStore(subscribe, readRoute)
}

/**
 * Navigate to a catalog route using HTML5 History API.
 * This replaces hash-based navigation (location.hash = ...) with
 * clean URLs (history.pushState).
 */
export function navigateTo(route: CatalogRoute): void {
  let pathname = CATALOG_BASE
  switch (route.name) {
    case 'overview':
      pathname = CATALOG_BASE
      break
    case 'tokens':
      pathname = `${CATALOG_BASE}/tokens`
      break
    case 'components':
      pathname = `${CATALOG_BASE}/components`
      break
    case 'component':
      pathname = `${CATALOG_BASE}/components/${encodeURIComponent(route.slug)}`
      break
    case 'not-found':
      // Keep the original path for not-found routes
      pathname = route.path
      break
  }
  window.history.pushState(null, '', pathname)
  // Manually trigger a route update since pushState doesn't fire popstate
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/**
 * Get the pathname for a route without navigating.
 * Useful for rendering href attributes.
 */
export function getPathnameFor(route: CatalogRoute): string {
  switch (route.name) {
    case 'overview':
      return CATALOG_BASE
    case 'tokens':
      return `${CATALOG_BASE}/tokens`
    case 'components':
      return `${CATALOG_BASE}/components`
    case 'component':
      return `${CATALOG_BASE}/components/${encodeURIComponent(route.slug)}`
    case 'not-found':
      return route.path
  }
}
