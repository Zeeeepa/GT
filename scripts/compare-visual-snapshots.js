// Visual snapshot comparison script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create output directory
const outputDir = path.join(process.cwd(), 'visual-diff-report');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get baseline snapshots
const baselineDir = process.env.BASELINE_DIR || path.join(process.cwd(), 'baseline-snapshots');
const currentDir = path.join(process.cwd(), 'snapshots');

// Check if directories exist
if (!fs.existsSync(baselineDir)) {
  console.error('Baseline directory does not exist. Creating empty baseline directory.');
  fs.mkdirSync(baselineDir, { recursive: true });
}

if (!fs.existsSync(currentDir)) {
  console.error('Current snapshots directory does not exist.');
  process.exit(1);
}

// Compare snapshots
const results = {
  passCount: 0,
  failCount: 0,
  diffCount: 0,
  diffs: []
};

// Get all snapshot files
const snapshotFiles = fs.readdirSync(currentDir)
  .filter(file => file.endsWith('.png'));

console.log(`Found ${snapshotFiles.length} snapshots to compare.`);

// Compare each snapshot
snapshotFiles.forEach(file => {
  const baselinePath = path.join(baselineDir, file);
  const currentPath = path.join(currentDir, file);
  const diffPath = path.join(outputDir, `diff-${file}`);
  
  // If baseline doesn't exist, copy current as baseline
  if (!fs.existsSync(baselinePath)) {
    console.log(`Baseline for ${file} does not exist. Using current as baseline.`);
    fs.copyFileSync(currentPath, baselinePath);
    results.passCount++;
    return;
  }
  
  try {
    // Use ImageMagick to compare images
    const compareCommand = `compare -metric AE "${baselinePath}" "${currentPath}" "${diffPath}" 2>&1 || true`;
    const output = execSync(compareCommand).toString().trim();
    
    const diffPixels = parseInt(output, 10);
    if (isNaN(diffPixels) || diffPixels > 0) {
      console.log(`Diff found in ${file}: ${output} pixels different.`);
      results.diffCount++;
      results.diffs.push({
        file,
        diffPixels: isNaN(diffPixels) ? 'unknown' : diffPixels,
        baselineUrl: `baseline-snapshots/${file}`,
        currentUrl: `snapshots/${file}`,
        diffUrl: `diff-${file}`
      });
    } else {
      console.log(`No diff found in ${file}.`);
      results.passCount++;
    }
  } catch (error) {
    console.error(`Error comparing ${file}:`, error);
    results.failCount++;
  }
});

// Generate report
const reportPath = path.join(outputDir, 'report.md');
const summaryPath = path.join(outputDir, 'summary.json');

let reportContent = `# Visual Regression Test Report\n\n`;
reportContent += `## Summary\n\n`;
reportContent += `- Total snapshots: ${snapshotFiles.length}\n`;
reportContent += `- Passed: ${results.passCount}\n`;
reportContent += `- Failed: ${results.failCount}\n`;
reportContent += `- Differences: ${results.diffCount}\n\n`;

if (results.diffCount > 0) {
  reportContent += `## Differences\n\n`;
  results.diffs.forEach(diff => {
    reportContent += `### ${diff.file}\n\n`;
    reportContent += `- Difference: ${diff.diffPixels} pixels\n`;
    reportContent += `- [Baseline](${diff.baselineUrl}) | [Current](${diff.currentUrl}) | [Diff](${diff.diffUrl})\n\n`;
    reportContent += `<table><tr>`;
    reportContent += `<td><img src="${diff.baselineUrl}" width="300" alt="Baseline" /></td>`;
    reportContent += `<td><img src="${diff.currentUrl}" width="300" alt="Current" /></td>`;
    reportContent += `<td><img src="${diff.diffUrl}" width="300" alt="Diff" /></td>`;
    reportContent += `</tr></table>\n\n`;
  });
}

// Add status marker for GitHub workflow
if (results.diffCount > 0) {
  reportContent += `\nVISUAL_DIFF_FAILED\n`;
} else {
  reportContent += `\nVISUAL_DIFF_SUCCESS\n`;
}

fs.writeFileSync(reportPath, reportContent);
fs.writeFileSync(summaryPath, JSON.stringify({
  total: snapshotFiles.length,
  passCount: results.passCount,
  failCount: results.failCount,
  diffCount: results.diffCount
}));

console.log(`Report generated at ${reportPath}`);

// Exit with appropriate code
process.exit(results.diffCount > 0 ? 1 : 0);

