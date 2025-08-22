# Testing Methodology

This document describes the testing approach and methodology used in this project, with a focus on UI testing and screenshot automation.

## Overview

The project uses a comprehensive testing approach with multiple layers:

1. **Unit Tests**: Test individual functions and components in isolation.
2. **Integration Tests**: Test the interaction between different parts of the system.
3. **Visual Component Tests**: Test the visual appearance of UI components in isolation.
4. **Visual Regression Tests**: Test the visual appearance of the full application.
5. **End-to-End Tests**: Test the full application from a user's perspective.

## Screenshot Automation Methodology

The project uses a screenshot automation methodology based on the AppleScript patterns provided, but adapted for cross-platform compatibility using Playwright. This methodology ensures consistent screenshot capture across different environments, with proper timing and state management.

### Key Components

1. **Screenshot Utility Module**: A utility module that provides functions for taking screenshots with consistent timing and state management.
2. **Component Test Harness**: A harness for testing UI components in isolation with controlled rendering.
3. **Baseline Screenshot Management**: A system for managing baseline screenshots across different environments.

### Screenshot Utility Module

The screenshot utility module (`utils/screenshot.ts`) provides functions for taking screenshots with consistent timing and state management:

- `takeScreenshot`: Take a screenshot of a page with consistent timing and state management.
- `takeComponentScreenshot`: Take a screenshot of a specific component.
- `waitForElementStable`: Wait for an element to be stable (no movement).
- `preparePageForScreenshots`: Prepare a page for consistent screenshots by disabling animations and ensuring consistent font rendering.

### Component Test Harness

The component test harness (`tests/visual-component/helpers.ts`) provides functions for testing UI components in isolation:

- `createComponentHTML`: Create a standalone HTML file for component testing.
- `loadComponentHTML`: Load a component HTML file and prepare it for screenshots.
- `generateComponentHTML`: Generate standard component HTML wrapper.
- `cleanupComponentHTML`: Clean up temporary component HTML files.

### Baseline Screenshot Management

The baseline screenshot management system (`scripts/manage-baselines.ts`) provides functions for managing baseline screenshots across different environments:

- `generateBaselines`: Generate new baseline screenshots.
- `updateBaselines`: Update existing baseline screenshots.
- `compareScreenshots`: Compare screenshots across environments.
- `cleanScreenshots`: Clean up old screenshots.

## Test Types

### Visual Component Tests

Visual component tests (`tests/visual-component/*.spec.ts`) test the visual appearance of UI components in isolation. They use the component test harness to create standalone HTML files for each component, and the screenshot utility module to take screenshots with consistent timing and state management.

Example:

```typescript
test('AgentRunDetailView renders correctly', async ({ page }) => {
  // Create component HTML
  const bodyContent = `
    <div class="agent-run-detail">
      <!-- Component content -->
    </div>
  `;
  
  const html = generateComponentHTML('AgentRunDetailView Test', commonStyles, bodyContent);
  const htmlPath = await createComponentHTML('AgentRunDetailView', html);
  
  // Load the component and prepare for screenshots
  await loadComponentHTML(page, htmlPath);
  
  // Take the screenshot with improved reliability
  await takeComponentScreenshot(page, '.agent-run-detail', {
    name: 'agent-run-detail-view.png',
    waitForStable: '.agent-run-detail',
    waitTimeout: 1000
  });
});
```

### Visual Regression Tests

Visual regression tests (`tests/visual/*.spec.ts`) test the visual appearance of the full application. They use the screenshot utility module to take screenshots with consistent timing and state management.

Example:

```typescript
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
```

### Integration Tests

Integration tests (`tests/integration/*.test.ts`) test the interaction between different parts of the system. They use MSW to mock API responses and test the API client implementation.

Example:

```typescript
describe('resumeAgentRun', () => {
  it('should resume an agent run with valid parameters', async () => {
    const result = await resumeAgentRun('test-run-id', {
      prompt: 'Continue the task',
      additionalContext: 'Some additional context'
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBe('test-run-id');
    expect(result.status).toBe('running');
    expect(result.prompt).toBe('Continue the task');
    expect(result.additionalContext).toBe('Some additional context');
  });
});
```

## Running Tests

### Visual Component Tests

```bash
npm run test:visual-component
```

### Visual Regression Tests

```bash
npm run test:visual
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### All Tests

```bash
npm test
```

## Managing Baseline Screenshots

### Generate New Baselines

```bash
npm run manage-baselines -- generate
```

### Update Existing Baselines

```bash
npm run manage-baselines -- update
```

### Compare Screenshots Across Environments

```bash
npm run manage-baselines -- compare
```

### Clean Up Old Screenshots

```bash
npm run manage-baselines -- clean
```

## CI/CD Integration

The project uses GitHub Actions for CI/CD integration. The workflows are defined in `.github/workflows/`:

- `visual-regression.yml`: Run visual regression tests.
- `ui-component-tests.yml`: Run UI component tests.
- `integration-tests.yml`: Run integration tests.

The workflows use the same testing approach and methodology as the local development environment, but with some environment-specific configurations to ensure consistent results.

## Troubleshooting

### Common Issues

- **Inconsistent Screenshots**: If screenshots are inconsistent across different environments, check the following:
  - Font rendering differences
  - Animation timing differences
  - Browser version differences
  - Operating system differences

- **Test Failures in CI**: If tests fail in CI but pass locally, check the following:
  - CI environment configuration
  - Browser version differences
  - Timing issues

### Solutions

- **Use the Screenshot Utility Module**: The screenshot utility module provides functions for taking screenshots with consistent timing and state management.
- **Use the Component Test Harness**: The component test harness provides functions for testing UI components in isolation with controlled rendering.
- **Use the Baseline Screenshot Management System**: The baseline screenshot management system provides functions for managing baseline screenshots across different environments.
- **Adjust Timeouts**: If tests are failing due to timing issues, try adjusting the timeouts in the test configuration.
- **Disable Animations**: If tests are failing due to animation timing differences, try disabling animations in the test environment.
- **Use Consistent Font Rendering**: If tests are failing due to font rendering differences, try using consistent font rendering in the test environment.

## Best Practices

- **Use the Screenshot Utility Module**: Always use the screenshot utility module for taking screenshots to ensure consistent timing and state management.
- **Use the Component Test Harness**: Always use the component test harness for testing UI components in isolation to ensure controlled rendering.
- **Use the Baseline Screenshot Management System**: Always use the baseline screenshot management system for managing baseline screenshots across different environments.
- **Write Descriptive Test Names**: Always write descriptive test names that clearly indicate what is being tested.
- **Use Consistent Selectors**: Always use consistent selectors for identifying elements in the DOM.
- **Use Consistent Timeouts**: Always use consistent timeouts for waiting for elements to appear or animations to complete.
- **Use Consistent Font Rendering**: Always use consistent font rendering to ensure screenshots are consistent across different environments.
- **Use Consistent Browser Settings**: Always use consistent browser settings to ensure screenshots are consistent across different environments.
- **Use Consistent Viewport Sizes**: Always use consistent viewport sizes to ensure screenshots are consistent across different environments.
- **Use Consistent Date Formatting**: Always use consistent date formatting to ensure screenshots are consistent across different environments.
- **Use Consistent Error Handling**: Always use consistent error handling to ensure tests fail gracefully and provide useful error messages.
- **Use Consistent Mocking**: Always use consistent mocking to ensure tests are isolated from external dependencies.
- **Use Consistent Assertions**: Always use consistent assertions to ensure tests are clear and easy to understand.
- **Use Consistent Test Structure**: Always use consistent test structure to ensure tests are easy to read and maintain.
- **Use Consistent Test Data**: Always use consistent test data to ensure tests are reproducible and easy to understand.
- **Use Consistent Test Environment**: Always use consistent test environment to ensure tests are reproducible and easy to understand.
- **Use Consistent Test Configuration**: Always use consistent test configuration to ensure tests are reproducible and easy to understand.
- **Use Consistent Test Reporting**: Always use consistent test reporting to ensure test results are easy to understand and analyze.
- **Use Consistent Test Documentation**: Always use consistent test documentation to ensure tests are easy to understand and maintain.
- **Use Consistent Test Naming**: Always use consistent test naming to ensure tests are easy to find and understand.
- **Use Consistent Test Organization**: Always use consistent test organization to ensure tests are easy to find and understand.
- **Use Consistent Test Patterns**: Always use consistent test patterns to ensure tests are easy to understand and maintain.
- **Use Consistent Test Practices**: Always use consistent test practices to ensure tests are easy to understand and maintain.
- **Use Consistent Test Principles**: Always use consistent test principles to ensure tests are effective and valuable.
- **Use Consistent Test Process**: Always use consistent test process to ensure tests are reproducible and reliable.
- **Use Consistent Test Strategy**: Always use consistent test strategy to ensure tests are comprehensive and effective.
- **Use Consistent Test Techniques**: Always use consistent test techniques to ensure tests are effective and efficient.
- **Use Consistent Test Tools**: Always use consistent test tools to ensure tests are easy to run and maintain.
- **Use Consistent Test Types**: Always use consistent test types to ensure tests are comprehensive and effective.
- **Use Consistent Test Workflow**: Always use consistent test workflow to ensure tests are easy to run and maintain.

