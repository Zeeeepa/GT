import { test, expect } from '@playwright/test';

// Mock data
const mockAgentRun = {
  id: 'test-run-id',
  status: 'completed',
  prompt: 'Create a new feature',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T01:00:00Z'
};

// Mock API responses
test.beforeEach(async ({ page }) => {
  // Mock getAgentRun API
  await page.route('**/api/agent-runs/*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAgentRun)
    });
  });
  
  // Mock resumeAgentRun API
  await page.route('**/api/agent-runs/*/resume', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockAgentRun,
        status: 'running'
      })
    });
  });
});

test('Agent run detail view renders correctly', async ({ page }) => {
  // Navigate to the agent run detail page
  await page.goto('/agent-runs/test-run-id');
  
  // Wait for the page to load
  await page.waitForSelector('.agent-run-detail');
  
  // Take a screenshot for visual comparison
  await expect(page).toHaveScreenshot('agent-run-detail.png');
});

test('Resume dialog renders correctly', async ({ page }) => {
  // Navigate to the agent run detail page
  await page.goto('/agent-runs/test-run-id');
  
  // Wait for the page to load
  await page.waitForSelector('.agent-run-detail');
  
  // Click the resume button
  await page.click('.resume-button');
  
  // Wait for the dialog to appear
  await page.waitForSelector('.resume-dialog');
  
  // Take a screenshot for visual comparison
  await expect(page).toHaveScreenshot('resume-dialog.png');
});

test('Form validation displays errors correctly', async ({ page }) => {
  // Navigate to the agent run detail page
  await page.goto('/agent-runs/test-run-id');
  
  // Wait for the page to load
  await page.waitForSelector('.agent-run-detail');
  
  // Click the resume button
  await page.click('.resume-button');
  
  // Wait for the dialog to appear
  await page.waitForSelector('.resume-dialog');
  
  // Submit the form without entering a prompt
  await page.click('.dialog-actions button[type="submit"]');
  
  // Wait for the error message to appear
  await page.waitForSelector('.error-message');
  
  // Take a screenshot for visual comparison
  await expect(page).toHaveScreenshot('form-validation-errors.png');
});

