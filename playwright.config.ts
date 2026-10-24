import { defineConfig, devices } from '@playwright/test';

/** Browser playthrough runs. `npm run test:e2e` starts its own Vite dev server (with the local game library) on a
 * dedicated port, so it never attaches to another running instance on the default 5317. */
const port = Number(process.env.E2E_PORT ?? 5391);
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/e2e',
  timeout: 10 * 60_000,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 900 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
  webServer: { command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false, timeout: 120_000 },
});
