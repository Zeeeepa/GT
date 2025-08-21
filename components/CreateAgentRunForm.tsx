import React, { useState } from 'react';
import { createAgentRun } from '../services/codegenApiService';

interface CreateAgentRunFormProps {
  onSuccess: (data: any) => void;
}

const CreateAgentRunForm: React.FC<CreateAgentRunFormProps> = ({ onSuccess }) => {
  const [repository, setRepository] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    repository?: string;
    prompt?: string;
  }>({});

  const validateForm = () => {
    const errors: { repository?: string; prompt?: string } = {};
    let isValid = true;

    if (!repository.trim()) {
      errors.repository = 'Repository is required';
      isValid = false;
    }

    if (!prompt.trim()) {
      errors.prompt = 'Prompt is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await createAgentRun({
        repository,
        prompt
      });

      onSuccess(data);
      
      // Reset form
      setRepository('');
      setPrompt('');
      setValidationErrors({});
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-agent-run-form">
      <h2>Create Agent Run</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repository">Repository</label>
          <input
            type="text"
            id="repository"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="Enter repository name (e.g., org/repo)"
            disabled={loading}
          />
          {validationErrors.repository && (
            <div className="error-message">{validationErrors.repository}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt for the agent"
            rows={4}
            disabled={loading}
          />
          {validationErrors.prompt && (
            <div className="error-message">{validationErrors.prompt}</div>
          )}
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Submit'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
      </form>
    </div>
  );
};

export default CreateAgentRunForm;

