import { useCatalogRoute, type CatalogRoute, navigateTo, getPathnameFor } from './router'
import { OverviewPage } from './pages/OverviewPage'
import { TokensPage } from './pages/TokensPage'
import { ComponentsIndexPage } from './pages/ComponentsIndexPage'
import { ComponentDetailPage } from './pages/ComponentDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

interface NavItem {
  label: string
  route: CatalogRoute
  isActive: (route: CatalogRoute) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', route: { name: 'overview' }, isActive: (r) => r.name === 'overview' },
  { label: 'Tokens', route: { name: 'tokens' }, isActive: (r) => r.name === 'tokens' },
  {
    label: 'Components',
    route: { name: 'components' },
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
      return <NotFoundPage path={route.path} />
  }
}

/**
 * Catalog shell (T2): header + nav yang mencerminkan route aktif, main area
 * merender halaman sesuai clean URL route. Navigasi via HTML5 History API
 * sehingga back/forward browser bekerja alami.
 */
export default function CatalogApp() {
  const route = useCatalogRoute()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault()
    navigateTo(item.route)
  }

  return (
    <div className="kx-cat-shell">
      <header className="kx-cat-header">
        <a
          className="kx-cat-brand"
          href={getPathnameFor({ name: 'overview' })}
          onClick={(e) => handleNavClick(e, NAV_ITEMS[0])}
        >
          Konteks <span>Design System</span>
        </a>
        <nav className="kx-cat-nav" aria-label="Catalog">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={getPathnameFor(item.route)}
              onClick={(e) => handleNavClick(e, item)}
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
