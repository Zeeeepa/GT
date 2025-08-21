import React, { useState, useEffect } from 'react';
import { getAgentRun, resumeAgentRun } from '../services/codegenApiService';

interface AgentRunDetailViewProps {
  runId: string;
}

interface AgentRun {
  id: string;
  status: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

const AgentRunDetailView: React.FC<AgentRunDetailViewProps> = ({ runId }) => {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);

  useEffect(() => {
    const fetchRun = async () => {
      try {
        setLoading(true);
        const data = await getAgentRun(runId);
        setRun(data);
        setError(null);
      } catch (err) {
        setError(`Error fetching agent run: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRun();
  }, [runId]);

  const handleResumeClick = () => {
    setShowResumeDialog(true);
    setPrompt('');
    setAdditionalContext('');
    setResumeError(null);
    setResumeSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setResumeError('Prompt is required');
      return;
    }

    try {
      await resumeAgentRun(runId, { prompt, additionalContext });
      setResumeSuccess(true);
      setResumeError(null);
      
      // Close dialog after success
      setTimeout(() => {
        setShowResumeDialog(false);
      }, 2000);
    } catch (err) {
      setResumeError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setResumeSuccess(false);
    }
  };

  if (loading) {
    return <div>Loading agent run details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!run) {
    return <div>No agent run found with ID: {runId}</div>;
  }

  return (
    <div className="agent-run-detail">
      <h1>Agent Run Details</h1>
      
      <div className="run-info">
        <div className="info-item">
          <span className="label">ID:</span>
          <span className="value">{run.id}</span>
        </div>
        <div className="info-item">
          <span className="label">Status:</span>
          <span className="value">{run.status}</span>
        </div>
        <div className="info-item">
          <span className="label">Prompt:</span>
          <span className="value">{run.prompt}</span>
        </div>
        <div className="info-item">
          <span className="label">Created:</span>
          <span className="value">{new Date(run.createdAt).toLocaleString()}</span>
        </div>
        <div className="info-item">
          <span className="label">Updated:</span>
          <span className="value">{new Date(run.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="actions">
        <button 
          className="resume-button"
          onClick={handleResumeClick}
          disabled={run.status === 'running'}
        >
          Resume
        </button>
      </div>
      
      {showResumeDialog && (
        <dialog open className="resume-dialog">
          <h2>Resume Agent Run</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="prompt">Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt to continue the agent run"
                rows={4}
              />
              {resumeError && resumeError.includes('Prompt') && (
                <div className="error-message">{resumeError}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="additionalContext">Additional Context (optional)</label>
              <textarea
                id="additionalContext"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Enter any additional context"
                rows={2}
              />
            </div>
            
            <div className="dialog-actions">
              <button type="button" onClick={() => setShowResumeDialog(false)}>
                Cancel
              </button>
              <button type="submit">Submit</button>
            </div>
            
            {resumeError && !resumeError.includes('Prompt') && (
              <div className="error-message">{resumeError}</div>
            )}
            
            {resumeSuccess && (
              <div className="success-message">Agent run resumed successfully!</div>
            )}
          </form>
        </dialog>
      )}
    </div>
  );
};

export default AgentRunDetailView;

