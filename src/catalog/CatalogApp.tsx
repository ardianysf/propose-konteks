import { useCatalogRoute, type CatalogRoute } from './router'
import { OverviewPage } from './pages/OverviewPage'
import { TokensPage } from './pages/TokensPage'
import { ComponentsIndexPage } from './pages/ComponentsIndexPage'
import { ComponentDetailPage } from './pages/ComponentDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

interface NavItem {
  label: string
  hash: string
  isActive: (route: CatalogRoute) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', hash: '#/', isActive: (r) => r.name === 'overview' },
  { label: 'Tokens', hash: '#/tokens', isActive: (r) => r.name === 'tokens' },
  {
    label: 'Components',
    hash: '#/components',
    isActive: (r) => r.name === 'components' || r.name === 'component',
  },
]

function renderPage(route: CatalogRoute) {
  switch (route.name) {
    case 'overview':
      return <OverviewPage />
    case 'tokens':
      return <TokensPage />
    case 'components':
      return <ComponentsIndexPage />
    case 'component':
      return <ComponentDetailPage slug={route.slug} />
    case 'not-found':
      return <NotFoundPage hash={route.hash} />
  }
}

/**
 * Catalog shell (T2): header + nav yang mencerminkan route aktif, main area
 * merender halaman sesuai hash route. Navigasi via hash biasa sehingga
 * back/forward browser bekerja alami.
 */
export default function CatalogApp() {
  const route = useCatalogRoute()

  return (
    <div className="kx-cat-shell">
      <header className="kx-cat-header">
        <a className="kx-cat-brand" href="#/">
          Konteks <span>Design System</span>
        </a>
        <nav className="kx-cat-nav" aria-label="Catalog">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.hash}
              href={item.hash}
              aria-current={item.isActive(route) ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="kx-cat-main">{renderPage(route)}</main>
    </div>
  )
}
