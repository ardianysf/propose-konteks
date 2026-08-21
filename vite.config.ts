import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/**
 * Vite plugin to enable clean URL routing for the catalog SPA.
 *
 * This plugin adds middleware to both dev and preview servers that rewrites
 * /catalog/* requests to serve catalog.html, allowing HTML5 History API
 * navigation without hash fragments.
 *
 * Valid routes:
 *   /catalog → serves catalog.html
 *   /catalog/tokens → serves catalog.html
 *   /catalog/components → serves catalog.html
 *   /catalog/components/<slug> → serves catalog.html
 */
function catalogSpaFallback(): Plugin {
  return {
    name: 'catalog-spa-fallback',
    configureServer(server) {
      // Insert middleware at the beginning of the stack to catch /catalog/*
      // requests before Vite's internal middleware (which may throw on
      // malformed percent-encoding)
      const spaFallback = (req: any, _res: any, next: any) => {
        // Only handle /catalog/* paths
        if (req.url?.startsWith('/catalog')) {
          // Rewrite to catalog.html for SPA routing
          req.url = '/catalog.html'
        }
        next()
      }
      // Prepend to the middleware stack so it runs first
      ;(server.middlewares as any).stack?.unshift({
        route: '',
        handle: spaFallback,
      })
    },
    configurePreviewServer(server) {
      // Insert middleware at the beginning of the stack for preview server too
      const spaFallback = (req: any, _res: any, next: any) => {
        // Only handle /catalog/* paths
        if (req.url?.startsWith('/catalog')) {
          // Rewrite to catalog.html for SPA routing
          req.url = '/catalog.html'
        }
        next()
      }
      // Prepend to the middleware stack so it runs first
      ;(server.middlewares as any).stack?.unshift({
        route: '',
        handle: spaFallback,
      })
    },
  }
}

// Dual-output repo (spec docs/plans/2026-08-20-konteks-dual-output-pivot.md):
// `main` is the clickable mockup (unchanged), `catalog` is the design system
// reference. The manifest powers the bundle-isolation check (spec §2).
export default defineConfig({
  plugins: [react(), catalogSpaFallback()],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        catalog: fileURLToPath(new URL('./catalog.html', import.meta.url)),
      },
    },
  },
})
