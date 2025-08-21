import { test, expect } from '@playwright/test';

// Mock data setup
const mockAgentRun = {
  id: 'test-run-id',
  status: 'completed',
  prompt: 'Fix the login component',
  createdAt: '2025-08-20T12:00:00Z',
  updatedAt: '2025-08-20T12:05:00Z'
};

test.beforeEach(async ({ page }) => {
  // Mock API responses
  await page.route('**/api/agent-runs/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAgentRun)
    });
  });
  
  // Set environment variables
  await page.addInitScript(() => {
    window.env = {
      VITE_CODEGEN_TOKEN: 'mock-codegen-token',
      VITE_CODEGEN_ORG_ID: '123',
      VITE_GITHUB_TOKEN: 'mock-github-token'
    };
  });
});

test('Agent run detail view renders correctly', async ({ page }) => {
  // Navigate to agent run details page
  await page.goto('/agents/runs/test-run-id');
  
  // Wait for content to load
  await page.waitForSelector('h1:has-text("Agent Run Details")');
  
  // Take screenshot for visual comparison
  await page.screenshot({ path: 'snapshots/agent-run-detail.png' });
});

test('Resume dialog renders correctly', async ({ page }) => {
  // Navigate to agent run details page
  await page.goto('/agents/runs/test-run-id');
  
  // Click resume button
  await page.click('button:has-text("Resume")');
  
  // Wait for dialog to appear
  await page.waitForSelector('dialog');
  
  // Take screenshot for visual comparison
  await page.screenshot({ path: 'snapshots/resume-dialog.png' });
});

test('Form validation displays errors correctly', async ({ page }) => {
  // Navigate to agent run details page
  await page.goto('/agents/runs/test-run-id');
  
  // Click resume button
  await page.click('button:has-text("Resume")');
  
  // Wait for dialog to appear
  await page.waitForSelector('dialog');
  
  // Submit without filling form
  await page.click('button:has-text("Submit")');
  
  // Wait for error message
  await page.waitForSelector('.error-message');
  
  // Take screenshot for visual comparison
  await page.screenshot({ path: 'snapshots/form-validation-errors.png' });
});

