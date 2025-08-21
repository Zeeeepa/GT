/**
 * Baseline Screenshot Management Script
 * 
 * This script helps manage baseline screenshots for visual regression testing.
 * It can:
 * - Generate new baseline screenshots
 * - Update existing baseline screenshots
 * - Compare screenshots across environments
 * - Clean up old screenshots
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Paths to screenshot directories
const COMPONENT_SNAPSHOTS_DIR = path.join(rootDir, 'snapshots-component');
const VISUAL_SNAPSHOTS_DIR = path.join(rootDir, 'snapshots');
const BASELINE_DIR = path.join(rootDir, 'baseline-snapshots');

// Environment-specific directories
const ENV_DIRS = {
  local: path.join(BASELINE_DIR, 'local'),
  ci: path.join(BASELINE_DIR, 'ci')
};

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    printUsage();
    process.exit(1);
  }
  
  switch (command) {
    case 'generate':
      await generateBaselines();
      break;
    case 'update':
      await updateBaselines();
      break;
    case 'compare':
      await compareScreenshots();
      break;
    case 'clean':
      await cleanScreenshots();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Baseline Screenshot Management Script

Usage:
  npm run manage-baselines -- <command>

Commands:
  generate   Generate new baseline screenshots
  update     Update existing baseline screenshots
  compare    Compare screenshots across environments
  clean      Clean up old screenshots
  `);
}

/**
 * Generate new baseline screenshots
 */
async function generateBaselines() {
  console.log('Generating baseline screenshots...');
  
  // Create baseline directories if they don't exist
  await createDirectoryIfNotExists(BASELINE_DIR);
  await createDirectoryIfNotExists(ENV_DIRS.local);
  await createDirectoryIfNotExists(ENV_DIRS.ci);
  
  // Run the tests to generate screenshots
  try {
    execSync('npm run test:visual-component', { stdio: 'inherit' });
    execSync('npm run test:visual', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error generating screenshots:', error);
    process.exit(1);
  }
  
  // Copy screenshots to baseline directory
  const environment = process.env.CI ? 'ci' : 'local';
  const targetDir = ENV_DIRS[environment];
  
  // Copy component screenshots
  await copyDirectory(COMPONENT_SNAPSHOTS_DIR, path.join(targetDir, 'component'));
  
  // Copy visual screenshots
  await copyDirectory(VISUAL_SNAPSHOTS_DIR, path.join(targetDir, 'visual'));
  
  console.log(`Baseline screenshots generated in ${targetDir}`);
}

/**
 * Update existing baseline screenshots
 */
async function updateBaselines() {
  console.log('Updating baseline screenshots...');
  
  // Run the tests to generate screenshots
  try {
    execSync('npm run test:visual-component', { stdio: 'inherit' });
    execSync('npm run test:visual', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error generating screenshots:', error);
    process.exit(1);
  }
  
  // Copy screenshots to baseline directory
  const environment = process.env.CI ? 'ci' : 'local';
  const targetDir = ENV_DIRS[environment];
  
  // Create directories if they don't exist
  await createDirectoryIfNotExists(targetDir);
  await createDirectoryIfNotExists(path.join(targetDir, 'component'));
  await createDirectoryIfNotExists(path.join(targetDir, 'visual'));
  
  // Copy component screenshots
  await copyDirectory(COMPONENT_SNAPSHOTS_DIR, path.join(targetDir, 'component'));
  
  // Copy visual screenshots
  await copyDirectory(VISUAL_SNAPSHOTS_DIR, path.join(targetDir, 'visual'));
  
  console.log(`Baseline screenshots updated in ${targetDir}`);
}

/**
 * Compare screenshots across environments
 */
async function compareScreenshots() {
  console.log('Comparing screenshots across environments...');
  
  // Check if baseline directories exist
  try {
    await fs.access(ENV_DIRS.local);
    await fs.access(ENV_DIRS.ci);
  } catch (error) {
    console.error('Baseline directories not found. Generate baselines first.');
    process.exit(1);
  }
  
  // Compare component screenshots
  await compareDirectories(
    path.join(ENV_DIRS.local, 'component'),
    path.join(ENV_DIRS.ci, 'component'),
    'component'
  );
  
  // Compare visual screenshots
  await compareDirectories(
    path.join(ENV_DIRS.local, 'visual'),
    path.join(ENV_DIRS.ci, 'visual'),
    'visual'
  );
}

/**
 * Clean up old screenshots
 */
async function cleanScreenshots() {
  console.log('Cleaning up old screenshots...');
  
  // Remove component snapshots
  try {
    await fs.rm(COMPONENT_SNAPSHOTS_DIR, { recursive: true, force: true });
    console.log(`Removed ${COMPONENT_SNAPSHOTS_DIR}`);
  } catch (error) {
    console.error(`Error removing ${COMPONENT_SNAPSHOTS_DIR}:`, error);
  }
  
  // Remove visual snapshots
  try {
    await fs.rm(VISUAL_SNAPSHOTS_DIR, { recursive: true, force: true });
    console.log(`Removed ${VISUAL_SNAPSHOTS_DIR}`);
  } catch (error) {
    console.error(`Error removing ${VISUAL_SNAPSHOTS_DIR}:`, error);
  }
  
  console.log('Cleanup complete');
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

/**
 * Copy a directory
 * 
 * @param source Source directory
 * @param target Target directory
 */
async function copyDirectory(source: string, target: string) {
  // Create target directory if it doesn't exist
  await createDirectoryIfNotExists(target);
  
  // Get all files in source directory
  let files;
  try {
    files = await fs.readdir(source);
  } catch (error) {
    console.error(`Error reading directory ${source}:`, error);
    return;
  }
  
  // Copy each file
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stats = await fs.stat(sourcePath);
    
    if (stats.isDirectory()) {
      // Recursively copy subdirectory
      await copyDirectory(sourcePath, targetPath);
    } else {
      // Copy file
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Compare two directories
 * 
 * @param dir1 First directory
 * @param dir2 Second directory
 * @param label Label for the comparison
 */
async function compareDirectories(dir1: string, dir2: string, label: string) {
  console.log(`\nComparing ${label} screenshots...`);
  
  // Get all files in both directories
  let files1, files2;
  try {
    files1 = await fs.readdir(dir1);
  } catch (error) {
    console.error(`Error reading directory ${dir1}:`, error);
    return;
  }
  
  try {
    files2 = await fs.readdir(dir2);
  } catch (error) {
    console.error(`Error reading directory ${dir2}:`, error);
    return;
  }
  
  // Find files that exist in both directories
  const commonFiles = files1.filter(file => files2.includes(file));
  
  // Find files that exist only in one directory
  const onlyInDir1 = files1.filter(file => !files2.includes(file));
  const onlyInDir2 = files2.filter(file => !files1.includes(file));
  
  console.log(`Found ${commonFiles.length} common files`);
  console.log(`Found ${onlyInDir1.length} files only in local environment`);
  console.log(`Found ${onlyInDir2.length} files only in CI environment`);
  
  // Compare common files
  let differentFiles = 0;
  
  for (const file of commonFiles) {
    const path1 = path.join(dir1, file);
    const path2 = path.join(dir2, file);
    
    const stats1 = await fs.stat(path1);
    const stats2 = await fs.stat(path2);
    
    if (stats1.isDirectory() && stats2.isDirectory()) {
      // Recursively compare subdirectories
      await compareDirectories(path1, path2, `${label}/${file}`);
    } else if (!stats1.isDirectory() && !stats2.isDirectory()) {
      // Compare files
      const buffer1 = await fs.readFile(path1);
      const buffer2 = await fs.readFile(path2);
      
      if (!buffer1.equals(buffer2)) {
        differentFiles++;
        console.log(`  - ${file} is different`);
      }
    }
  }
  
  console.log(`Found ${differentFiles} different files`);
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

