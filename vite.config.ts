import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
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
 *
 * The site root redirects to /catalog. The app remains available at /v2.
 */
export function routeSiteRequest(
  req: { url?: string },
  res: { statusCode: number; setHeader(name: string, value: string): unknown; end(): void },
  next: () => void,
) {
  const url = req.url ?? ''
  const queryIndex = url.indexOf('?')
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex)
  const query = queryIndex === -1 ? '' : url.slice(queryIndex)
  if (pathname === '/') {
    res.statusCode = 302
    res.setHeader('Location', `/catalog${query}`)
    res.end()
    return
  }
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) {
    req.url = `/catalog.html${query}`
  } else if (pathname === '/v2' || pathname.startsWith('/v2/')) {
    req.url = `/index.html${query}`
  }
  next()
}

function catalogSpaFallback(): Plugin {
  return {
    name: 'catalog-spa-fallback',
    configureServer(server) {
      // Insert middleware at the beginning of the stack to catch /catalog/*
      // requests before Vite's internal middleware (which may throw on
      // malformed percent-encoding)
      ;(server.middlewares as any).stack?.unshift({
        route: '',
        handle: routeSiteRequest,
      })
    },
    configurePreviewServer(server) {
      // Insert middleware at the beginning of the stack for preview server too
      ;(server.middlewares as any).stack?.unshift({
        route: '',
        handle: routeSiteRequest,
      })
    },
  }
}

// Dual-output repo (spec docs/plans/2026-08-20-konteks-dual-output-pivot.md):
// `main` is the clickable mockup (unchanged), `catalog` is the design system
// reference. The manifest powers the bundle-isolation check (spec §2).
export default defineConfig({
  plugins: [
    react(),
    catalogSpaFallback(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
    }),
  ],
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
