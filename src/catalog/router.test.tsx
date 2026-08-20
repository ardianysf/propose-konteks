import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CatalogApp from './CatalogApp'
import { parseHash } from './router'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// ---------------------------------------------------------------------------
// parseHash — pure parser contract (spec §2 "Hash router katalog")
// ---------------------------------------------------------------------------

describe('parseHash', () => {
  it('maps empty and root hashes to overview', () => {
    expect(parseHash('')).toEqual({ name: 'overview' })
    expect(parseHash('#')).toEqual({ name: 'overview' })
    expect(parseHash('#/')).toEqual({ name: 'overview' })
  })

  it('maps #/tokens to the tokens route', () => {
    expect(parseHash('#/tokens')).toEqual({ name: 'tokens' })
  })

  it('maps #/components to the components index route', () => {
    expect(parseHash('#/components')).toEqual({ name: 'components' })
  })

  it('maps #/components/<slug> to a component detail route', () => {
    expect(parseHash('#/components/workspace-menu')).toEqual({
      name: 'component',
      slug: 'workspace-menu',
    })
  })

  it('URI-decodes the slug', () => {
    expect(parseHash('#/components/session%20status')).toEqual({
      name: 'component',
      slug: 'session status',
    })
  })

  it('treats unknown hashes as not-found and keeps the original hash', () => {
    expect(parseHash('#/bogus')).toEqual({ name: 'not-found', hash: '#/bogus' })
    expect(parseHash('#/TOKENS')).toEqual({ name: 'not-found', hash: '#/TOKENS' })
    expect(parseHash('#/tokens/extra')).toEqual({
      name: 'not-found',
      hash: '#/tokens/extra',
    })
  })

  it('treats trailing/empty or nested slugs as not-found', () => {
    expect(parseHash('#/components/')).toEqual({
      name: 'not-found',
      hash: '#/components/',
    })
    expect(parseHash('#/components/a/b')).toEqual({
      name: 'not-found',
      hash: '#/components/a/b',
    })
  })

  it('treats malformed percent-encoding as not-found without throwing', () => {
    // decodeURIComponent throws URIError on these; the parser must catch it
    // and fall back to the not-found contract instead of crashing the render.
    expect(() => parseHash('#/components/%')).not.toThrow()
    expect(parseHash('#/components/%')).toEqual({
      name: 'not-found',
      hash: '#/components/%',
    })
    expect(() => parseHash('#/components/%E0%A4%')).not.toThrow()
    expect(parseHash('#/components/%E0%A4%')).toEqual({
      name: 'not-found',
      hash: '#/components/%E0%A4%',
    })
  })
})

// ---------------------------------------------------------------------------
// CatalogApp — smoke: renders the shell and follows hash navigation
// ---------------------------------------------------------------------------

describe('CatalogApp', () => {
  it('renders the overview page by default with working nav', async () => {
    const user = userEvent.setup()
    render(<CatalogApp />)

    // Overview renders by default (empty hash).
    expect(
      screen.getByRole('heading', { name: 'Konteks Design System' }),
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
    expect(await screen.findByRole('heading', { name: 'Tokens' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute(
      'aria-current',
    )

    await user.click(screen.getByRole('link', { name: 'Components' }))
    expect(
      await screen.findByRole('heading', { name: 'Components' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Components' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders the component detail page for a slug hash', async () => {
    window.location.hash = '#/components/session-status-badge'
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

  it('renders the documented not-found page for unknown hashes', async () => {
    window.location.hash = '#/nope'
    render(<CatalogApp />)

    expect(
      await screen.findByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('#/nope')).toBeInTheDocument()
  })
})
