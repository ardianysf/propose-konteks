import { Fragment } from 'react'
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

/** Registration crosshair — print-sheet corner mark on the footer band:
 * two hairlines + a circle, 12px, stroke currentColor at ~55% ink.
 * Purely decorative (aria-hidden, pointer-events none). */
function RegistrationMark({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg
      className={`kx-cat-regmark kx-cat-regmark--${corner}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      aria-hidden="true"
    >
      <path d="M6 0v12M0 6h12" />
      <circle cx="6" cy="6" r="2.75" />
    </svg>
  )
}

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
 * Catalog shell ("Industrial Parts Catalog"): the page area grows to fill
 * the viewport and the navigation lives in the 44px footer band under a 2px
 * ink rule — OVERVIEW · TOKENS · COMPONENTS, active entry in stamp red with
 * aria-current="page", mono sheet meta on the right. Navigation via HTML5
 * History API so back/forward browser bekerja alami.
 */
export default function CatalogApp() {
  const route = useCatalogRoute()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault()
    navigateTo(item.route)
  }

  return (
    <div className="kx-cat-shell">
      <main className="kx-cat-main">{renderPage(route)}</main>
      <footer className="kx-cat-footer">
        <RegistrationMark corner="tl" />
        <RegistrationMark corner="tr" />
        <RegistrationMark corner="bl" />
        <RegistrationMark corner="br" />
        <nav className="kx-cat-nav" aria-label="Catalog">
          {NAV_ITEMS.map((item, index) => (
            <Fragment key={item.label}>
              {index > 0 && (
                <span className="kx-cat-nav-dot" aria-hidden="true">
                  ·
                </span>
              )}
              <a
                href={getPathnameFor(item.route)}
                onClick={(e) => handleNavClick(e, item)}
                aria-current={item.isActive(route) ? 'page' : undefined}
              >
                {item.label}
              </a>
            </Fragment>
          ))}
        </nav>
        <p className="kx-cat-sheet">SHEET 1/1</p>
      </footer>
    </div>
  )
}
