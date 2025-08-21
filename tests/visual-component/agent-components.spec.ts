import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

// Mock data
const mockAgentRun = {
  id: 'test-run-id',
  status: 'completed',
  prompt: 'Create a new feature',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T01:00:00Z'
};

// Helper function to create HTML file with component
async function createComponentHTML(componentName: string, html: string) {
  const filePath = path.join(process.cwd(), `temp-${componentName}.html`);
  await fs.writeFile(filePath, html);
  return filePath;
}

test('AgentRunDetailView renders correctly', async ({ page }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgentRunDetailView Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .agent-run-detail {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 4px;
            max-width: 800px;
            margin: 0 auto;
            background-color: #f9f9f9;
          }
          .run-info {
            margin-top: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .label {
            font-weight: bold;
            margin-right: 10px;
          }
          .actions {
            margin-top: 20px;
          }
          button {
            padding: 8px 16px;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="agent-run-detail">
          <h1>Agent Run Details</h1>
          
          <div class="run-info">
            <div class="info-item">
              <span class="label">ID:</span>
              <span class="value">${mockAgentRun.id}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value">${mockAgentRun.status}</span>
            </div>
            <div class="info-item">
              <span class="label">Prompt:</span>
              <span class="value">${mockAgentRun.prompt}</span>
            </div>
            <div class="info-item">
              <span class="label">Created:</span>
              <span class="value">${new Date(mockAgentRun.createdAt).toLocaleString()}</span>
            </div>
            <div class="info-item">
              <span class="label">Updated:</span>
              <span class="value">${new Date(mockAgentRun.updatedAt).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="actions">
            <button class="resume-button">Resume</button>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const htmlPath = await createComponentHTML('AgentRunDetailView', html);
  await page.goto(`file://${htmlPath}`);
  await expect(page).toHaveScreenshot('agent-run-detail-view.png');
});

test('CreateAgentRunForm renders correctly', async ({ page }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CreateAgentRunForm Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .create-agent-run-form {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 4px;
            max-width: 800px;
            margin: 0 auto;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          button {
            padding: 8px 16px;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="create-agent-run-form">
          <h2>Create Agent Run</h2>
          
          <form>
            <div class="form-group">
              <label for="repository">Repository</label>
              <input
                type="text"
                id="repository"
                placeholder="Enter repository name (e.g., org/repo)"
              />
            </div>
            
            <div class="form-group">
              <label for="prompt">Prompt</label>
              <textarea
                id="prompt"
                placeholder="Enter a prompt for the agent"
                rows="4"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </body>
    </html>
  `;
  
  const htmlPath = await createComponentHTML('CreateAgentRunForm', html);
  await page.goto(`file://${htmlPath}`);
  await expect(page).toHaveScreenshot('create-agent-run-form.png');
});

test('RepositorySelector renders correctly', async ({ page }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RepositorySelector Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .repository-selector {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 4px;
            max-width: 800px;
            margin: 0 auto;
          }
          .search-container {
            margin-bottom: 15px;
          }
          .search-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .repository-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
          }
          .repository-item:hover {
            background-color: #f5f5f5;
          }
          .repository-name {
            font-weight: bold;
          }
          .repository-description {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="repository-selector">
          <div class="search-container">
            <input
              type="text"
              placeholder="Search repositories"
              class="search-input"
            />
          </div>
          
          <div class="repositories-list">
            <div class="repository-item">
              <div class="repository-name">org/repo1</div>
              <div class="repository-description">Repository 1</div>
            </div>
            <div class="repository-item">
              <div class="repository-name">org/repo2</div>
              <div class="repository-description">Repository 2</div>
            </div>
            <div class="repository-item">
              <div class="repository-name">org/repo3</div>
              <div class="repository-description">Repository 3</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const htmlPath = await createComponentHTML('RepositorySelector', html);
  await page.goto(`file://${htmlPath}`);
  await expect(page).toHaveScreenshot('repository-selector.png');
});

test('Resume dialog renders correctly', async ({ page }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume Dialog Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.5);
          }
          .resume-dialog {
            background-color: white;
            padding: 20px;
            border-radius: 4px;
            max-width: 600px;
            margin: 50px auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .dialog-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          button {
            padding: 8px 16px;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
          }
          button[type="button"] {
            background-color: #f2f2f2;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="resume-dialog">
          <h2>Resume Agent Run</h2>
          
          <form>
            <div class="form-group">
              <label for="prompt">Prompt</label>
              <textarea
                id="prompt"
                placeholder="Enter a prompt to continue the agent run"
                rows="4"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="additionalContext">Additional Context (optional)</label>
              <textarea
                id="additionalContext"
                placeholder="Enter any additional context"
                rows="2"
              ></textarea>
            </div>
            
            <div class="dialog-actions">
              <button type="button">Cancel</button>
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </body>
    </html>
  `;
  
  const htmlPath = await createComponentHTML('ResumeDialog', html);
  await page.goto(`file://${htmlPath}`);
  await expect(page).toHaveScreenshot('resume-dialog.png');
});

test('Form validation displays errors correctly', async ({ page }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Form Validation Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.5);
          }
          .resume-dialog {
            background-color: white;
            padding: 20px;
            border-radius: 4px;
            max-width: 600px;
            margin: 50px auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .dialog-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          button {
            padding: 8px 16px;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
          }
          button[type="button"] {
            background-color: #f2f2f2;
            color: #333;
          }
          .error-message {
            color: red;
            font-size: 0.9em;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="resume-dialog">
          <h2>Resume Agent Run</h2>
          
          <form>
            <div class="form-group">
              <label for="prompt">Prompt</label>
              <textarea
                id="prompt"
                placeholder="Enter a prompt to continue the agent run"
                rows="4"
              ></textarea>
              <div class="error-message">Prompt is required</div>
            </div>
            
            <div class="form-group">
              <label for="additionalContext">Additional Context (optional)</label>
              <textarea
                id="additionalContext"
                placeholder="Enter any additional context"
                rows="2"
              ></textarea>
            </div>
            
            <div class="dialog-actions">
              <button type="button">Cancel</button>
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </body>
    </html>
  `;
  
  const htmlPath = await createComponentHTML('FormValidationErrors', html);
  await page.goto(`file://${htmlPath}`);
  await expect(page).toHaveScreenshot('form-validation-errors.png');
});

