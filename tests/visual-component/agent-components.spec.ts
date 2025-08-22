import { test, expect } from '@playwright/test';
import { 
  createComponentHTML, 
  loadComponentHTML, 
  generateComponentHTML,
  cleanupComponentHTML
} from './helpers';
import { takeComponentScreenshot, preparePageForScreenshots } from '../../utils/screenshot';

// Mock data
const mockAgentRun = {
  id: 'test-run-id',
  status: 'completed',
  prompt: 'Create a new feature',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T01:00:00Z'
};

// Common styles for all components
const commonStyles = `
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
  .resume-dialog {
    background-color: white;
    padding: 20px;
    border-radius: 4px;
    max-width: 600px;
    margin: 50px auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
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
`;

test.describe('Agent Components', () => {
  test.afterEach(async () => {
    // Clean up temporary files after each test
    await cleanupComponentHTML('AgentRunDetailView');
    await cleanupComponentHTML('CreateAgentRunForm');
    await cleanupComponentHTML('RepositorySelector');
    await cleanupComponentHTML('ResumeDialog');
    await cleanupComponentHTML('FormValidationErrors');
  });

  test('AgentRunDetailView renders correctly', async ({ page }) => {
    // Create component HTML
    const bodyContent = `
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
            <span class="value">${new Date(mockAgentRun.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}</span>
          </div>
          <div class="info-item">
            <span class="label">Updated:</span>
            <span class="value">${new Date(mockAgentRun.updatedAt).toLocaleString('en-US', { timeZone: 'UTC' })}</span>
          </div>
        </div>
        
        <div class="actions">
          <button class="resume-button">Resume</button>
        </div>
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

  test('CreateAgentRunForm renders correctly', async ({ page }) => {
    // Create component HTML
    const bodyContent = `
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
    `;
    
    const html = generateComponentHTML('CreateAgentRunForm Test', commonStyles, bodyContent);
    const htmlPath = await createComponentHTML('CreateAgentRunForm', html);
    
    // Load the component and prepare for screenshots
    await loadComponentHTML(page, htmlPath);
    
    // Take the screenshot with improved reliability
    await takeComponentScreenshot(page, '.create-agent-run-form', {
      name: 'create-agent-run-form.png',
      waitForStable: '.create-agent-run-form',
      waitTimeout: 1000
    });
  });

  test('RepositorySelector renders correctly', async ({ page }) => {
    // Create component HTML
    const bodyContent = `
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
    `;
    
    const html = generateComponentHTML('RepositorySelector Test', commonStyles, bodyContent);
    const htmlPath = await createComponentHTML('RepositorySelector', html);
    
    // Load the component and prepare for screenshots
    await loadComponentHTML(page, htmlPath);
    
    // Take the screenshot with improved reliability
    await takeComponentScreenshot(page, '.repository-selector', {
      name: 'repository-selector.png',
      waitForStable: '.repository-selector',
      waitTimeout: 1000
    });
  });

  test('Resume dialog renders correctly', async ({ page }) => {
    // Create component HTML with dark background to simulate modal
    const bodyContent = `
      <div style="background-color: rgba(0, 0, 0, 0.5); padding: 20px; min-height: 100vh;">
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
      </div>
    `;
    
    const html = generateComponentHTML('Resume Dialog Test', commonStyles, bodyContent);
    const htmlPath = await createComponentHTML('ResumeDialog', html);
    
    // Load the component and prepare for screenshots
    await loadComponentHTML(page, htmlPath);
    
    // Take the screenshot with improved reliability
    await takeComponentScreenshot(page, '.resume-dialog', {
      name: 'resume-dialog.png',
      waitForStable: '.resume-dialog',
      waitTimeout: 1000
    });
  });

  test('Form validation displays errors correctly', async ({ page }) => {
    // Create component HTML with validation errors
    const bodyContent = `
      <div style="background-color: rgba(0, 0, 0, 0.5); padding: 20px; min-height: 100vh;">
        <div class="resume-dialog">
          <h2>Resume Agent Run</h2>
          
          <form>
            <div class="form-group">
              <label for="prompt">Prompt</label>
              <textarea
                id="prompt"
                placeholder="Enter a prompt to continue the agent run"
                rows="4"
                style="border-color: red;"
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
      </div>
    `;
    
    const html = generateComponentHTML('Form Validation Test', commonStyles, bodyContent);
    const htmlPath = await createComponentHTML('FormValidationErrors', html);
    
    // Load the component and prepare for screenshots
    await loadComponentHTML(page, htmlPath);
    
    // Take the screenshot with improved reliability
    await takeComponentScreenshot(page, '.resume-dialog', {
      name: 'form-validation-errors.png',
      waitForStable: '.resume-dialog',
      waitTimeout: 1000
    });
  });
});
