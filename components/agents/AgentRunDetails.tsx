import React, { useState } from 'react';
import { 
  useAgentRun, 
  useAgentRunLogs, 
  useResumeAgentRun,
  useBanChecks,
  useUnbanChecks,
  useRemoveCodegenFromPR
} from '../../hooks/codegen_api';
import { AgentRunStatus } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import ConfirmationModal from '../shared/ConfirmationModal';
import { ChevronDoubleLeftIcon } from '../shared/icons/ChevronDoubleLeftIcon';
import { EyeIcon } from '../shared/icons/EyeIcon';
import { PlayIcon } from '../shared/icons/PlayIcon';
import { LockIcon } from '../shared/icons/LockIcon';
import { TrashIcon } from '../shared/icons/TrashIcon';
import { ExclamationIcon } from '../shared/icons/ExclamationIcon';
import { CheckIcon } from '../shared/icons/CheckIcon';
import { InformationCircleIcon } from '../shared/icons/InformationCircleIcon';

interface AgentRunDetailsProps {
  agentRunId: number;
  onBack: () => void;
  onViewLogs: () => void;
}

const AgentRunDetails: React.FC<AgentRunDetailsProps> = ({ agentRunId, onBack, onViewLogs }) => {
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [resumePrompt, setResumePrompt] = useState('');

  const { data: agentRun, loading: runLoading, error: runError, refetch } = useAgentRun(agentRunId);
  const { data: logsData, loading: logsLoading } = useAgentRunLogs(agentRunId, { limit: 5 });
  
  const { execute: resumeRun, loading: resumeLoading } = useResumeAgentRun();
  const { execute: banChecks, loading: banLoading } = useBanChecks();
  const { execute: unbanChecks, loading: unbanLoading } = useUnbanChecks();
  const { execute: removeFromPR, loading: removeLoading } = useRemoveCodegenFromPR();

  const handleResume = async () => {
    if (!resumePrompt.trim()) return;
    
    const result = await resumeRun(agentRunId, resumePrompt.trim());
    if (result) {
      setShowResumeModal(false);
      setResumePrompt('');
      await refetch();
    }
  };

  const handleBanChecks = async () => {
    const result = await banChecks(agentRunId);
    if (result) {
      setShowBanModal(false);
      await refetch();
    }
  };

  const handleUnbanChecks = async () => {
    const result = await unbanChecks(agentRunId);
    if (result) {
      setShowUnbanModal(false);
      await refetch();
    }
  };

  const handleRemoveFromPR = async () => {
    const result = await removeFromPR(agentRunId);
    if (result) {
      setShowRemoveModal(false);
      await refetch();
    }
  };

  if (runLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (runError || !agentRun) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">
          {runError?.message || 'Agent run not found'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-secondary hover:bg-hover text-text-primary rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getStatusColor = (status: AgentRunStatus) => {
    switch (status) {
      case AgentRunStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case AgentRunStatus.RUNNING:
        return 'bg-yellow-100 text-yellow-800';
      case AgentRunStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case AgentRunStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case AgentRunStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case AgentRunStatus.PAUSED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canResume = [AgentRunStatus.COMPLETED, AgentRunStatus.FAILED, AgentRunStatus.CANCELLED].includes(agentRun.status);
  const isActive = agentRun.status === AgentRunStatus.RUNNING;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-secondary border-b border-border-color p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary"
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Agent Run #{agentRun.id}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(agentRun.status)}`}>
                  {agentRun.status}
                </span>
                {agentRun.source_type && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {agentRun.source_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onViewLogs}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-hover border border-border-color text-text-primary rounded-lg font-medium transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              View Logs
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-secondary rounded-lg p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Created</span>
                    <span className="text-text-primary">
                      {new Date(agentRun.created_at).toLocaleString()}
                    </span>
                  </div>
                  {agentRun.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Updated</span>
                      <span className="text-text-primary">
                        {new Date(agentRun.updated_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Organization ID</span>
                    <span className="text-text-primary">{agentRun.organization_id}</span>
                  </div>
                  {agentRun.user_id && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">User ID</span>
                      <span className="text-text-primary">{agentRun.user_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt */}
              {agentRun.prompt && (
                <div className="bg-secondary rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Original Prompt</h2>
                  <div className="bg-primary rounded-lg p-4 border border-border-color">
                    <pre className="text-text-primary whitespace-pre-wrap text-sm">
                      {agentRun.prompt}
                    </pre>
                  </div>
                </div>
              )}

              {/* Result */}
              {agentRun.result && (
                <div className="bg-secondary rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Result</h2>
                  <div className="bg-primary rounded-lg p-4 border border-border-color">
                    <pre className="text-text-primary whitespace-pre-wrap text-sm">
                      {agentRun.result}
                    </pre>
                  </div>
                </div>
              )}

              {/* GitHub Pull Requests */}
              {agentRun.github_pull_requests && agentRun.github_pull_requests.length > 0 && (
                <div className="bg-secondary rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">GitHub Pull Requests</h2>
                  <div className="space-y-3">
                    {agentRun.github_pull_requests.map((pr) => (
                      <div key={pr.id} className="flex items-center justify-between p-4 bg-primary rounded-lg border border-border-color">
                        <div>
                          <h3 className="font-medium text-text-primary">{pr.title}</h3>
                          <p className="text-sm text-text-secondary">
                            Created {new Date(pr.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-hover font-medium"
                        >
                          View PR
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Logs Preview */}
              <div className="bg-secondary rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Recent Logs</h2>
                  <button
                    onClick={onViewLogs}
                    className="text-accent hover:text-accent-hover text-sm font-medium"
                  >
                    View All Logs
                  </button>
                </div>
                {logsLoading ? (
                  <LoadingSpinner />
                ) : logsData && logsData.logs.length > 0 ? (
                  <div className="space-y-2">
                    {logsData.logs.slice(0, 3).map((log, index) => (
                      <div key={index} className="p-3 bg-primary rounded border border-border-color">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-accent">{log.message_type}</span>
                          <span className="text-xs text-text-secondary">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {log.thought && (
                          <p className="text-sm text-text-primary line-clamp-2">{log.thought}</p>
                        )}
                        {log.tool_name && (
                          <p className="text-xs text-text-secondary mt-1">Tool: {log.tool_name}</p>
                        )}
                      </div>
                    ))}
                    {logsData.logs.length > 3 && (
                      <p className="text-sm text-text-secondary text-center pt-2">
                        +{logsData.logs.length - 3} more logs
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary">No logs available</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Control Panel */}
              <div className="bg-secondary rounded-lg p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Control Panel</h2>
                <div className="space-y-3">
                  {canResume && (
                    <button
                      onClick={() => setShowResumeModal(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Resume Run
                    </button>
                  )}

                  <button
                    onClick={() => setShowBanModal(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <LockIcon className="w-4 h-4 mr-2" />
                    Ban Checks
                  </button>

                  <button
                    onClick={() => setShowUnbanModal(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Unban Checks
                  </button>

                  {agentRun.github_pull_requests && agentRun.github_pull_requests.length > 0 && (
                    <button
                      onClick={() => setShowRemoveModal(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Remove from PR
                    </button>
                  )}
                </div>
              </div>

              {/* Web URL */}
              {agentRun.web_url && (
                <div className="bg-secondary rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">External Links</h2>
                  <a
                    href={agentRun.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-accent hover:text-accent-hover font-medium"
                  >
                    <InformationCircleIcon className="w-4 h-4 mr-2" />
                    View in Codegen
                  </a>
                </div>
              )}

              {/* Metadata */}
              {agentRun.metadata && Object.keys(agentRun.metadata).length > 0 && (
                <div className="bg-secondary rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Metadata</h2>
                  <div className="bg-primary rounded p-3 border border-border-color">
                    <pre className="text-xs text-text-primary whitespace-pre-wrap">
                      {JSON.stringify(agentRun.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Resume Agent Run</h2>
            <p className="text-text-secondary mb-4">
              Provide a prompt to resume this agent run:
            </p>
            <textarea
              value={resumePrompt}
              onChange={(e) => setResumePrompt(e.target.value)}
              placeholder="Enter your prompt..."
              className="w-full h-32 p-3 bg-primary border border-border-color rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowResumeModal(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleResume}
                disabled={!resumePrompt.trim() || resumeLoading}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resumeLoading ? 'Resuming...' : 'Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Checks Confirmation */}
      {showBanModal && (
        <ConfirmationModal
          title="Ban Checks"
          message="Are you sure you want to ban checks for this agent run? This action may affect the run's ability to perform certain operations."
          confirmText="Ban Checks"
          cancelText="Cancel"
          onConfirm={handleBanChecks}
          onCancel={() => setShowBanModal(false)}
          isLoading={banLoading}
          variant="danger"
        />
      )}

      {/* Unban Checks Confirmation */}
      {showUnbanModal && (
        <ConfirmationModal
          title="Unban Checks"
          message="Are you sure you want to unban checks for this agent run?"
          confirmText="Unban Checks"
          cancelText="Cancel"
          onConfirm={handleUnbanChecks}
          onCancel={() => setShowUnbanModal(false)}
          isLoading={unbanLoading}
          variant="success"
        />
      )}

      {/* Remove from PR Confirmation */}
      {showRemoveModal && (
        <ConfirmationModal
          title="Remove from Pull Request"
          message="Are you sure you want to remove Codegen from the associated pull request? This action cannot be undone."
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={handleRemoveFromPR}
          onCancel={() => setShowRemoveModal(false)}
          isLoading={removeLoading}
          variant="danger"
        />
      )}
    </div>
  );
};

export default AgentRunDetails;
