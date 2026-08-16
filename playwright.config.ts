import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // Practical timeout: the SPA mounts synchronously and assertions are
  // mostly class/geometry checks, so 5s keeps slow runs honest without
  // adding flake. Artifacts (traces/videos/report/results) land under the
  // already-gitignored artifacts/ directory.
  expect: { timeout: 5000 },
  outputDir: 'artifacts/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // The ideal viewport (spec §16) is the default; the 1200×720 and
      // 1280→1281 regressions opt into their own per-test viewports.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
