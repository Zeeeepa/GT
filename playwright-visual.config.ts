import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/visual-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    // Standardized viewport size for consistent rendering
    viewport: { width: 1280, height: 720 },
    // Consistent browser settings
    deviceScaleFactor: 1,
    // Disable animations for consistent screenshots
    actionTimeout: 10000,
    navigationTimeout: 15000,
    // Consistent color scheme
    colorScheme: 'light',
    // Reduce flakiness by setting a longer timeout
    expect: {
      timeout: 10000,
      toHaveScreenshot: {
        // More permissive threshold for pixel differences
        maxDiffPixelRatio: 0.05,
        threshold: 0.2,
        // Standardized screenshot options
        animations: 'disabled',
        caret: 'hide',
      }
    }
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Increase timeout for CI environments
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
      },
    }
  ],
  outputDir: 'snapshots/',
  // Increase timeout for CI environments
  timeout: process.env.CI ? 60000 : 30000,
});
