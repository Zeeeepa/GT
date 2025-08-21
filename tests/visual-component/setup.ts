/**
 * Global setup for visual component tests
 * 
 * This file sets up the environment for visual component tests, including:
 * - Setting environment variables
 * - Creating necessary directories
 * - Setting up global mocks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment variables for visual component tests
process.env.VITE_GITHUB_TOKEN = 'github_pat_PLACEHOLDER_TOKEN';
process.env.VITE_CODEGEN_TOKEN = 'sk-PLACEHOLDER_TOKEN';
process.env.VITE_CODEGEN_ORG_ID = '323';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Global setup function for visual component tests
 */
export default async function globalSetup() {
  // Create necessary directories if they don't exist
  await createDirectoryIfNotExists(path.join(rootDir, 'snapshots-component'));
  await createDirectoryIfNotExists(path.join(rootDir, 'test-results'));
  
  // Set timezone to ensure consistent date formatting
  process.env.TZ = 'UTC';
  
  // Log setup completion
  console.log('Visual component test setup completed');
}

/**
 * Create a directory if it doesn't exist
 * 
 * @param dirPath Directory path
 */
async function createDirectoryIfNotExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
  }
}
