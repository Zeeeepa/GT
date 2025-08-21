import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  globalSetup: path.join(__dirname, 'tests/visual-component/setup.ts'),
  testDir: './tests/visual-component',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-component-report' }],
    ['json', { outputFile: 'test-results/visual-component-results.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
  outputDir: 'snapshots-component/',
});
