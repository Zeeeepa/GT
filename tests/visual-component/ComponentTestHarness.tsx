import React from 'react';
import { render } from '@testing-library/react';
import AgentRunDetailView from '../../components/AgentRunDetailView';
import CreateAgentRunForm from '../../components/CreateAgentRunForm';
import RepositorySelector from '../../components/RepositorySelector';

// Import mock data
import { mockAgentRun, mockRepositories } from './mocks/services';

// Component test harness
export const renderAgentRunDetailView = () => {
  return render(
    <div className="component-test-harness">
      <AgentRunDetailView runId={mockAgentRun.id} />
    </div>
  );
};

export const renderCreateAgentRunForm = () => {
  return render(
    <div className="component-test-harness">
      <CreateAgentRunForm onSuccess={() => {}} />
    </div>
  );
};

export const renderRepositorySelector = () => {
  return render(
    <div className="component-test-harness">
      <RepositorySelector onSelect={() => {}} />
    </div>
  );
};

export const renderResumeDialog = () => {
  return render(
    <div className="component-test-harness">
      <div className="resume-dialog">
        <h2>Resume Agent Run</h2>
        <form>
          <div className="form-group">
            <label htmlFor="prompt">Prompt</label>
            <textarea id="prompt" name="prompt" rows={4} />
          </div>
          <div className="form-group">
            <label htmlFor="additionalContext">Additional Context (optional)</label>
            <textarea id="additionalContext" name="additionalContext" rows={4} />
          </div>
          <div className="dialog-actions">
            <button type="button">Cancel</button>
            <button type="submit">Resume</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const renderFormValidationErrors = () => {
  return render(
    <div className="component-test-harness">
      <div className="resume-dialog">
        <h2>Resume Agent Run</h2>
        <form>
          <div className="form-group">
            <label htmlFor="prompt">Prompt</label>
            <textarea id="prompt" name="prompt" rows={4} />
            <div className="error-message">Prompt is required</div>
          </div>
          <div className="form-group">
            <label htmlFor="additionalContext">Additional Context (optional)</label>
            <textarea id="additionalContext" name="additionalContext" rows={4} />
          </div>
          <div className="dialog-actions">
            <button type="button">Cancel</button>
            <button type="submit">Resume</button>
          </div>
        </form>
      </div>
    </div>
  );
};
