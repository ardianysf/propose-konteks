import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'
import { initTheme } from './theme'
import App from './App'

// Resolve + stamp the stored theme before first paint (index.html's inline
// script already set data-theme; this persists/attaches the system listener).
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
