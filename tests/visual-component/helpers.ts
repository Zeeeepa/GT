/**
 * Helper functions for visual component tests
 */

import fs from 'fs/promises';
import path from 'path';
import { Page } from '@playwright/test';
import { preparePageForScreenshots } from '../../utils/screenshot';

/**
 * Create a standalone HTML file for component testing
 * 
 * @param componentName Name of the component
 * @param html HTML content
 * @returns Path to the created HTML file
 */
export async function createComponentHTML(componentName: string, html: string): Promise<string> {
  const filePath = path.join(process.cwd(), `temp-${componentName}.html`);
  await fs.writeFile(filePath, html);
  return filePath;
}

/**
 * Load a component HTML file and prepare it for screenshots
 * 
 * @param page Playwright page
 * @param htmlPath Path to the HTML file
 * @returns Promise that resolves when the page is loaded and prepared
 */
export async function loadComponentHTML(page: Page, htmlPath: string): Promise<void> {
  // Navigate to the HTML file
  await page.goto(`file://${htmlPath}`);
  
  // Prepare the page for screenshots
  await preparePageForScreenshots(page);
  
  // Wait for any remaining resources to load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit to ensure everything is rendered
  await page.waitForTimeout(500);
}

/**
 * Generate standard component HTML wrapper
 * 
 * @param title Page title
 * @param styles CSS styles
 * @param bodyContent HTML body content
 * @returns Complete HTML document
 */
export function generateComponentHTML(title: string, styles: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
          }
          
          /* Reset some browser-specific styles for consistency */
          button, input, select, textarea {
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            color: inherit;
          }
          
          /* Ensure consistent form element rendering */
          input, textarea, select, button {
            box-sizing: border-box;
          }
          
          /* Custom styles */
          ${styles}
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

/**
 * Clean up temporary component HTML files
 * 
 * @param componentName Name of the component
 * @returns Promise that resolves when the file is deleted
 */
export async function cleanupComponentHTML(componentName: string): Promise<void> {
  const filePath = path.join(process.cwd(), `temp-${componentName}.html`);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore errors if file doesn't exist
    console.warn(`Could not delete file ${filePath}:`, error);
  }
}

