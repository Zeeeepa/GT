import { test, expect } from '@playwright/test';
import { takeScreenshot, preparePageForScreenshots } from '../../utils/screenshot';

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
  // Prepare page for consistent screenshots
  await preparePageForScreenshots(page);
  
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
  
  // Set consistent date formatting
  await page.addInitScript(() => {
    // Override Date.prototype.toLocaleString to return consistent date strings
    const originalToLocaleString = Date.prototype.toLocaleString;
    Date.prototype.toLocaleString = function(locales, options) {
      // Force UTC timezone for consistent date formatting
      const utcOptions = { ...options, timeZone: 'UTC' };
      return originalToLocaleString.call(this, 'en-US', utcOptions);
    };
  });
});

test.describe('Agent Run UI', () => {
  test('Agent run detail view renders correctly', async ({ page }) => {
    // Navigate to the agent run detail page
    await page.goto('/agent-runs/test-run-id');
    
    // Wait for the page to load and network to be idle
    await page.waitForSelector('.agent-run-detail');
    await page.waitForLoadState('networkidle');
    
    // Wait for any animations to complete
    await page.waitForTimeout(500);
    
    // Take a screenshot with improved reliability
    await takeScreenshot(page, {
      name: 'agent-run-detail.png',
      waitForSelector: '.agent-run-detail',
      waitForStable: '.agent-run-detail',
      waitTimeout: 1000
    });
  });

  test('Resume dialog renders correctly', async ({ page }) => {
    // Navigate to the agent run detail page
    await page.goto('/agent-runs/test-run-id');
    
    // Wait for the page to load
    await page.waitForSelector('.agent-run-detail');
    await page.waitForLoadState('networkidle');
    
    // Click the resume button
    await page.click('.resume-button');
    
    // Wait for the dialog to appear and animations to complete
    await page.waitForSelector('.resume-dialog');
    await page.waitForTimeout(500);
    
    // Take a screenshot with improved reliability
    await takeScreenshot(page, {
      name: 'resume-dialog.png',
      waitForSelector: '.resume-dialog',
      waitForStable: '.resume-dialog',
      waitTimeout: 1000
    });
  });

  test('Form validation displays errors correctly', async ({ page }) => {
    // Navigate to the agent run detail page
    await page.goto('/agent-runs/test-run-id');
    
    // Wait for the page to load
    await page.waitForSelector('.agent-run-detail');
    await page.waitForLoadState('networkidle');
    
    // Click the resume button
    await page.click('.resume-button');
    
    // Wait for the dialog to appear
    await page.waitForSelector('.resume-dialog');
    
    // Submit the form without entering a prompt
    await page.click('.dialog-actions button[type="submit"]');
    
    // Wait for the error message to appear and animations to complete
    await page.waitForSelector('.error-message');
    await page.waitForTimeout(500);
    
    // Take a screenshot with improved reliability
    await takeScreenshot(page, {
      name: 'form-validation-errors.png',
      waitForSelector: '.error-message',
      waitForStable: '.resume-dialog',
      waitTimeout: 1000
    });
  });
});
