import { test, expect } from '@playwright/test';

test('agent run detail view visual test', async ({ page }) => {
  // Mock API responses
  await page.route('**/v1/organizations/*/agent-runs/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-run-id',
        status: 'completed',
        prompt: 'Fix the login component',
        createdAt: '2025-08-20T12:00:00Z',
        updatedAt: '2025-08-20T12:05:00Z'
      })
    });
  });

  // Navigate to agent run details page
  await page.goto('/agents/runs/test-run-id');
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Agent Run Details")');
  
  // Take a screenshot for visual comparison
  await expect(page).toHaveScreenshot('agent-run-details.png');
  
  // Click the resume button
  await page.click('button:has-text("Resume")');
  
  // Wait for the dialog to appear
  await page.waitForSelector('dialog');
  
  // Take a screenshot of the resume dialog
  await expect(page).toHaveScreenshot('agent-run-resume-dialog.png');
});
