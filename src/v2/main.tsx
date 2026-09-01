/*
 * V2 entry — mirrors src/main.tsx (same fonts, same style stack, same
 * theme init) and mounts V2App. v2.css is imported LAST so its .kx-v2-*
 * rules win same-specificity ties against the shared sheets, letting the
 * V2 shell scope geometry overrides for the reused anchored menus.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/components.css'
// V2App is imported BEFORE v2.css so the shared frame/menu sheets it pulls
// in (AppShell.css, shell/shared.css, menu CSS) land earlier in the module
// graph — v2.css is guaranteed to be the last stylesheet, letting its
// .kx-v2-* overrides win same-specificity ties.
import { initTheme } from '../theme'
import V2App from './V2App'
import './v2.css'
// Content-canvas overrides (scoped .kx-v2-root) — after v2.css so the
// surface layers read shell → content in source order.
import './v2-content.css'

// Resolve + stamp the stored theme before first paint (index.html's
// inline script already set data-theme; this persists/attaches the
// system listener).
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <V2App />
  </StrictMode>,
)
