import React, { useState } from 'react';
import { getAPIClient } from '../../../services/codegenApiService';
import { showToast, ToastStyle } from '../../../utils/toast';
import RepositorySelector from './RepositorySelector';
import { CodegenRepository } from '../../../types';
import LoadingSpinner from '../../../shared/LoadingSpinner';

interface CreateAgentRunFormProps {
  onRunCreated?: (runId: number) => void;
  onCancel?: () => void;
}

const CreateAgentRunForm: React.FC<CreateAgentRunFormProps> = ({ onRunCreated, onCancel }) => {
  const [selectedRepository, setSelectedRepository] = useState<CodegenRepository | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleRepositorySelect = (repository: CodegenRepository) => {
    setSelectedRepository(repository);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRepository) {
      showToast({
        style: ToastStyle.Failure,
        title: 'Repository required',
        message: 'Please select a repository for the agent run'
      });
      return;
    }

    if (!prompt.trim()) {
      showToast({
        style: ToastStyle.Failure,
        title: 'Prompt required',
        message: 'Please enter a prompt for the agent run'
      });
      return;
    }

    try {
      setIsCreating(true);
      const apiClient = getAPIClient();
      const newRun = await apiClient.createAgentRun({
        repository_id: selectedRepository.id,
        prompt: prompt.trim()
      });

      showToast({
        style: ToastStyle.Success,
        title: 'Agent run created',
        message: `New run created with ID: ${newRun.id}`
      });

      if (onRunCreated) {
        onRunCreated(newRun.id);
      }
    } catch (error) {
      console.error('Error creating agent run:', error);
      showToast({
        style: ToastStyle.Failure,
        title: 'Failed to create agent run',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-run-form">
      <h2>Create New Agent Run</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="repository">Repository</label>
          <RepositorySelector onRepositorySelect={handleRepositorySelect} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            className="form-textarea"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt for the agent..."
            rows={6}
          />
        </div>

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isCreating}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isCreating}
          >
            {isCreating ? <LoadingSpinner size="small" /> : 'Create Agent Run'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAgentRunForm;
