import { test, expect } from '@playwright/test';

test('should display agent run details and allow resuming', async ({ page }) => {
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

  await page.route('**/v1/organizations/*/agent-runs/*/resume', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-run-id',
        status: 'running',
        prompt: 'Continue with the task'
      })
    });
  });

  // Navigate to agent run details page
  await page.goto('/agents/runs/test-run-id');
  
  // Check if the page loads correctly
  await expect(page.locator('h1')).toContainText('Agent Run Details');
  
  // Check if the resume button is visible
  const resumeButton = page.locator('button:has-text("Resume")');
  await expect(resumeButton).toBeVisible();
  
  // Click the resume button
  await resumeButton.click();
  
  // Check if the resume dialog appears
  await expect(page.locator('dialog')).toBeVisible();
  
  // Fill in the prompt
  await page.fill('textarea[name="prompt"]', 'Continue with the task');
  
  // Submit the form
  await page.click('button:has-text("Submit")');
  
  // Check if the success message appears
  await expect(page.locator('.success-message')).toBeVisible();
});
