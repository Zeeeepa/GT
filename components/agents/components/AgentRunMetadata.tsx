import React from 'react';
import { AgentRunResponse } from '../../../types';

interface AgentRunMetadataProps {
  run: AgentRunResponse;
}

const AgentRunMetadata: React.FC<AgentRunMetadataProps> = ({ run }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'status-badge status-completed';
      case 'FAILED':
        return 'status-badge status-failed';
      case 'RUNNING':
      case 'PROCESSING':
      case 'INITIALIZING':
        return 'status-badge status-running';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="agent-run-metadata">
      <div className="metadata-item">
        <span className="metadata-label">Status</span>
        <span className={getStatusClass(run.status)}>{run.status}</span>
      </div>
      
      <div className="metadata-item">
        <span className="metadata-label">Created</span>
        <span className="metadata-value">{formatDate(run.created_at)}</span>
      </div>
      
      {run.repository && (
        <div className="metadata-item">
          <span className="metadata-label">Repository</span>
          <span className="metadata-value">
            <a href={run.repository.html_url} target="_blank" rel="noopener noreferrer">
              {run.repository.name}
            </a>
          </span>
        </div>
      )}
      
      {run.parent_run_id && (
        <div className="metadata-item">
          <span className="metadata-label">Parent Run</span>
          <span className="metadata-value">
            <a href={`#/agent-runs/${run.parent_run_id}`}>
              #{run.parent_run_id}
            </a>
          </span>
        </div>
      )}
      
      {run.github_pull_requests && run.github_pull_requests.length > 0 && (
        <div className="metadata-item">
          <span className="metadata-label">Pull Requests</span>
          <div className="metadata-value">
            {run.github_pull_requests.map(pr => (
              <div key={pr.id}>
                <a href={pr.url} target="_blank" rel="noopener noreferrer">
                  {pr.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {run.web_url && (
        <div className="metadata-item">
          <span className="metadata-label">Web URL</span>
          <span className="metadata-value">
            <a href={run.web_url} target="_blank" rel="noopener noreferrer">
              View on Web
            </a>
          </span>
        </div>
      )}
    </div>
  );
};

export default AgentRunMetadata;
