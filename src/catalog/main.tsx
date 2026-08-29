import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
// Catalog display face ("Industrial Parts Catalog" world): Sarabun 400-700.
import '@fontsource/sarabun/400.css'
import '@fontsource/sarabun/500.css'
import '@fontsource/sarabun/600.css'
import '@fontsource/sarabun/700.css'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/components.css'
import './catalog.css'
import { initTheme } from '../theme'
import CatalogApp from './CatalogApp'

// Same theme bootstrap as the mockup entry (index.html's inline script
// already stamped data-theme; this persists/attaches the system listener).
initTheme()

// Add catalog-scoped class to enable vertical scrolling.
// This overrides global.css's overflow: hidden for catalog pages only,
// preserving the mockup shell's scroll ownership.
document.documentElement.classList.add('kx-catalog-page')

// Cleanup function for hot module replacement (development only).
// @ts-ignore - Vite HMR API
if (import.meta.hot) {
  // @ts-ignore - Vite HMR API
  import.meta.hot.dispose(() => {
    document.documentElement.classList.remove('kx-catalog-page')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CatalogApp />
  </StrictMode>,
)
