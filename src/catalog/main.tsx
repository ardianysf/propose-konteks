import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/components.css'
import './catalog.css'
import { initTheme } from '../theme'
import CatalogApp from './CatalogApp'

// Same theme bootstrap as the mockup entry (index.html's inline script
// already stamped data-theme; this persists/attaches the system listener).
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CatalogApp />
  </StrictMode>,
)
