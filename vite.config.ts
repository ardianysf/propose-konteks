import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dual-output repo (spec docs/plans/2026-08-20-konteks-dual-output-pivot.md):
// `main` is the clickable mockup (unchanged), `catalog` is the design system
// reference. The manifest powers the bundle-isolation check (spec §2).
export default defineConfig({
  plugins: [react()],
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
