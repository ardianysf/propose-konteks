import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CatalogApp from './CatalogApp'
import { parsePathname, getPathnameFor, navigateTo } from './router'

afterEach(() => {
  cleanup()
  // Reset to catalog base path after each test
  window.history.replaceState(null, '', '/catalog')
})

// ---------------------------------------------------------------------------
// parsePathname — pure parser contract (spec §2 "Clean URL routing")
// ---------------------------------------------------------------------------

describe('parsePathname', () => {
  it('maps /catalog and /catalog/ to overview', () => {
    expect(parsePathname('/catalog')).toEqual({ name: 'overview' })
    expect(parsePathname('/catalog/')).toEqual({ name: 'overview' })
  })

  it('maps /catalog/tokens to the tokens route', () => {
    expect(parsePathname('/catalog/tokens')).toEqual({ name: 'tokens' })
  })

  it('maps /catalog/components to the components index route', () => {
    expect(parsePathname('/catalog/components')).toEqual({ name: 'components' })
  })

  it('maps /catalog/components/<slug> to a component detail route', () => {
    expect(parsePathname('/catalog/components/workspace-menu')).toEqual({
      name: 'component',
      slug: 'workspace-menu',
    })
  })

  it('URI-decodes the slug', () => {
    expect(parsePathname('/catalog/components/session%20status')).toEqual({
      name: 'component',
      slug: 'session status',
    })
  })

  it('treats paths without /catalog base as not-found', () => {
    expect(parsePathname('/')).toEqual({ name: 'not-found', path: '/' })
    expect(parsePathname('/bogus')).toEqual({ name: 'not-found', path: '/bogus' })
    expect(parsePathname('/tokens')).toEqual({ name: 'not-found', path: '/tokens' })
  })

  it('treats unknown catalog paths as not-found and keeps the original path', () => {
    expect(parsePathname('/catalog/bogus')).toEqual({ name: 'not-found', path: '/catalog/bogus' })
    expect(parsePathname('/catalog/TOKENS')).toEqual({ name: 'not-found', path: '/catalog/TOKENS' })
    expect(parsePathname('/catalog/tokens/extra')).toEqual({
      name: 'not-found',
      path: '/catalog/tokens/extra',
    })
  })

  it('treats trailing/empty or nested slugs as not-found', () => {
    expect(parsePathname('/catalog/components/')).toEqual({
      name: 'not-found',
      path: '/catalog/components/',
    })
    expect(parsePathname('/catalog/components/a/b')).toEqual({
      name: 'not-found',
      path: '/catalog/components/a/b',
    })
  })

  it('treats malformed percent-encoding as not-found without throwing', () => {
    // decodeURIComponent throws URIError on these; the parser must catch it
    // and fall back to the not-found contract instead of crashing the render.
    expect(() => parsePathname('/catalog/components/%')).not.toThrow()
    expect(parsePathname('/catalog/components/%')).toEqual({
      name: 'not-found',
      path: '/catalog/components/%',
    })
    expect(() => parsePathname('/catalog/components/%E0%A4%')).not.toThrow()
    expect(parsePathname('/catalog/components/%E0%A4%')).toEqual({
      name: 'not-found',
      path: '/catalog/components/%E0%A4%',
    })
  })
})

// ---------------------------------------------------------------------------
// getPathnameFor — route to pathname conversion
// ---------------------------------------------------------------------------

describe('getPathnameFor', () => {
  it('converts overview route to /catalog', () => {
    expect(getPathnameFor({ name: 'overview' })).toBe('/catalog')
  })

  it('converts tokens route to /catalog/tokens', () => {
    expect(getPathnameFor({ name: 'tokens' })).toBe('/catalog/tokens')
  })

  it('converts components route to /catalog/components', () => {
    expect(getPathnameFor({ name: 'components' })).toBe('/catalog/components')
  })

  it('converts component route with slug to /catalog/components/<slug>', () => {
    expect(getPathnameFor({ name: 'component', slug: 'workspace-menu' })).toBe(
      '/catalog/components/workspace-menu',
    )
  })

  it('encodes the slug in the pathname', () => {
    expect(getPathnameFor({ name: 'component', slug: 'session status' })).toBe(
      '/catalog/components/session%20status',
    )
  })

  it('returns the original path for not-found routes', () => {
    expect(getPathnameFor({ name: 'not-found', path: '/catalog/unknown' })).toBe(
      '/catalog/unknown',
    )
  })
})

// ---------------------------------------------------------------------------
// navigateTo — programmatic navigation
// ---------------------------------------------------------------------------

describe('navigateTo', () => {
  beforeEach(() => {
    // Reset to catalog base before each test
    window.history.replaceState(null, '', '/catalog')
  })

  it('navigates to overview route', () => {
    navigateTo({ name: 'overview' })
    expect(window.location.pathname).toBe('/catalog')
  })

  it('navigates to tokens route', () => {
    navigateTo({ name: 'tokens' })
    expect(window.location.pathname).toBe('/catalog/tokens')
  })

  it('navigates to components route', () => {
    navigateTo({ name: 'components' })
    expect(window.location.pathname).toBe('/catalog/components')
  })

  it('navigates to component detail route', () => {
    navigateTo({ name: 'component', slug: 'workspace-menu' })
    expect(window.location.pathname).toBe('/catalog/components/workspace-menu')
  })

  it('encodes the slug when navigating', () => {
    navigateTo({ name: 'component', slug: 'session status' })
    expect(window.location.pathname).toBe('/catalog/components/session%20status')
  })
})

// ---------------------------------------------------------------------------
// CatalogApp — smoke: renders the shell and follows clean URL navigation
// ---------------------------------------------------------------------------

describe('CatalogApp', () => {
  beforeEach(() => {
    // Set up catalog base path before each test
    window.history.replaceState(null, '', '/catalog')
  })

  it('renders the overview page by default with working nav', async () => {
    const user = userEvent.setup()
    render(<CatalogApp />)

    // Overview renders by default (/catalog path).
    expect(
      screen.getByRole('heading', { name: 'Component Catalog' }),
    ).toBeInTheDocument()

    // Nav reflects the active route.
    const nav = screen.getByRole('navigation', { name: 'Catalog' })
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(nav).toBeInTheDocument()

    // Clicking nav changes the route and the rendered page.
    await user.click(screen.getByRole('link', { name: 'Tokens' }))
    expect(window.location.pathname).toBe('/catalog/tokens')
    expect(await screen.findByRole('heading', { name: 'Tokens' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute(
      'aria-current',
    )

    await user.click(screen.getByRole('link', { name: 'Components' }))
    expect(window.location.pathname).toBe('/catalog/components')
    expect(
      await screen.findByRole('heading', { name: 'Components' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Components' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders the component detail page for a slug path', async () => {
    window.history.replaceState(null, '', '/catalog/components/session-status-badge')
    render(<CatalogApp />)

    // The detail page renders the manifest entry (name in the header).
    expect(
      await screen.findByRole('heading', { name: 'SessionStatusBadge' }),
    ).toBeInTheDocument()
    // Detail pages keep the Components nav item active (breadcrumb excluded
    // by scoping the query to the nav landmark).
    const nav = screen.getByRole('navigation', { name: 'Catalog' })
    expect(within(nav).getByRole('link', { name: 'Components' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders the documented not-found page for unknown paths', async () => {
    window.history.replaceState(null, '', '/catalog/nope')
    render(<CatalogApp />)

    expect(
      await screen.findByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('/catalog/nope')).toBeInTheDocument()
  })

  it('back navigation from component detail to components index works', async () => {
    const user = userEvent.setup()
    // Start at a component detail page
    window.history.replaceState(null, '', '/catalog/components/settings-modal')
    render(<CatalogApp />)

    // Verify we're on the detail page
    expect(
      screen.getByRole('heading', { name: 'SettingsModal' }),
    ).toBeInTheDocument()

    // Click the back link
    const backLink = screen.getByRole('link', { name: /kembali ke indeks komponen/i })
    await user.click(backLink)

    // Verify we navigated back to components index
    expect(window.location.pathname).toBe('/catalog/components')
    expect(await screen.findByRole('heading', { name: 'Components' })).toBeInTheDocument()
  })
})
