import React, { useState, useEffect } from 'react';
import { AgentRunResponse, AgentRunStep, AgentRunStatus } from '../../../types';
import { getBackgroundMonitoringService, MonitoringEventType } from '../../../utils/backgroundMonitoring';
import { getAPIClient } from '../../../services/codegenApiService';
import { getRepositoryApiService } from '../../../services/repositoryApiService';
import AgentRunMetadata from './AgentRunMetadata';
import LoadingSpinner from '../../../shared/LoadingSpinner';
import { showToast, ToastStyle } from '../../../utils/toast';

interface AgentRunDetailViewProps {
  agentRun: AgentRunResponse;
  onClose?: () => void;
  onResume?: (agentRunId: number) => void;
}

const AgentRunDetailView: React.FC<AgentRunDetailViewProps> = ({ agentRun, onClose, onResume }) => {
  const [run, setRun] = useState<AgentRunResponse>(agentRun);
  const [isLoading, setIsLoading] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    // Subscribe to background monitoring events for this run
    const monitoringService = getBackgroundMonitoringService();
    const unsubscribe = monitoringService.subscribe(MonitoringEventType.RUN_UPDATED, (updatedRun) => {
      if (updatedRun.id === run.id) {
        setRun(updatedRun);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [run.id]);

  const handleResume = async () => {
    if (!run.repository) {
      showToast({
        style: ToastStyle.Failure,
        title: "Cannot resume run",
        message: "This run has no associated repository"
      });
      return;
    }

    try {
      setIsResuming(true);
      const apiClient = getAPIClient();
      const resumedRun = await apiClient.resumeAgentRun(run.id);
      
      showToast({
        style: ToastStyle.Success,
        title: "Run resumed",
        message: `New run created with ID: ${resumedRun.id}`
      });
      
      if (onResume) {
        onResume(resumedRun.id);
      }
    } catch (error) {
      console.error('Error resuming run:', error);
      showToast({
        style: ToastStyle.Failure,
        title: "Failed to resume run",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsResuming(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDistanceToNow = (date: Date | string) => {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  return (
    <div className="agent-run-detail">
      <div className="agent-run-header">
        <h2>Agent Run #{run.id}</h2>
        <div className="header-actions">
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Back
            </button>
          )}
          {run.status !== AgentRunStatus.RUNNING && run.status !== AgentRunStatus.PROCESSING && (
            <button 
              className="btn btn-primary" 
              onClick={handleResume}
              disabled={isResuming}
            >
              {isResuming ? <LoadingSpinner size="small" /> : 'Resume Run'}
            </button>
          )}
        </div>
      </div>
      
      <AgentRunMetadata run={run} />
      
      {run.summary && (
        <div className="agent-run-summary">
          <h3 className="section-title">Summary</h3>
          <div className="summary-content">
            {run.summary}
          </div>
        </div>
      )}
      
      {run.steps && run.steps.length > 0 && (
        <div className="agent-run-steps">
          <h3 className="section-title">Steps</h3>
          {run.steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-header">
                <div className="step-title">{step.name || `Step ${index + 1}`}</div>
                {step.created_at && (
                  <div className="step-timestamp">{formatDistanceToNow(step.created_at)}</div>
                )}
              </div>
              {step.content && (
                <div className="step-content">{step.content}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {run.prompt && (
        <div className="agent-run-prompt">
          <h3 className="section-title">Prompt</h3>
          <div className="prompt-content">
            {run.prompt}
          </div>
        </div>
      )}
      
      {run.result && (
        <div className="agent-run-result">
          <h3 className="section-title">Result</h3>
          <div className="result-content">
            {run.result}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentRunDetailView;
