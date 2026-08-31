import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import type { Plugin } from 'vite'

/**
 * Vite plugin to enable clean URL routing for the catalog and /v2 SPAs.
 *
 * This plugin adds middleware to both dev and preview servers that rewrites
 * /catalog/* requests to serve catalog.html and /v2 (+ /v2/*) requests to
 * serve v2.html, allowing HTML5 History API navigation without hash
 * fragments.
 *
 * Valid routes:
 *   /catalog → serves catalog.html
 *   /catalog/tokens → serves catalog.html
 *   /catalog/components → serves catalog.html
 *   /catalog/components/<slug> → serves catalog.html
 *   /v2 → serves v2.html
 *   /v2/anything → serves v2.html
 *   /v2?query → serves v2.html
 *
 * /v2 matches exactly or with a path/query continuation so hypothetical
 * sibling entries like /v2x are never captured.
 */
function multiSpaFallback(): Plugin {
  const makeSpaFallback = () => (req: any, _res: any, next: any) => {
    // Only handle /catalog/* paths — blanket rewrite, identical to the
    // original catalog-only behavior
    if (req.url?.startsWith('/catalog')) {
      // Rewrite to catalog.html for SPA routing
      req.url = '/catalog.html'
    } else if (
      req.url === '/v2' ||
      req.url?.startsWith('/v2/') ||
      req.url?.startsWith('/v2?')
    ) {
      // Rewrite to v2.html for SPA routing
      req.url = '/v2.html'
    }
    next()
  }
  return {
    name: 'catalog-v2-spa-fallback',
    configureServer(server) {
      // Insert middleware at the beginning of the stack to catch /catalog/*
      // and /v2* requests before Vite's internal middleware (which may throw
      // on malformed percent-encoding)
      ;(server.middlewares as any).stack?.unshift({
        route: '',
        handle: makeSpaFallback(),
      })
    },
    configurePreviewServer(server) {
      // Insert middleware at the beginning of the stack for preview server too
      ;(server.middlewares as any).stack?.unshift({
        route: '',
        handle: makeSpaFallback(),
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
    multiSpaFallback(),
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
        v2: fileURLToPath(new URL('./v2.html', import.meta.url)),
      },
    },
  },
})
