import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { 
  useAgentRuns, 
  useCurrentUser, 
  useRepositories, 
  useOrganizations,
  useOrganizationIntegrations 
} from '../../hooks/codegen_api';
import { updateWithRuns } from '../../utils/notifications';
import { AgentRunStatus, AgentRun } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { CogIcon } from '../shared/icons/CogIcon';
import { ListBulletIcon } from '../shared/icons/ListBulletIcon';
import { UserGroupIcon } from '../shared/icons/UserGroupIcon';
import { CheckIcon } from '../shared/icons/CheckIcon';
import { ExclamationIcon } from '../shared/icons/ExclamationIcon';
import { ChevronRightIcon } from '../shared/icons/ChevronRightIcon';

interface DashboardProps {
  onCreateRun: () => void;
  onViewRun: (agentRunId: number) => void;
  onViewLogs: (agentRunId: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateRun, onViewRun, onViewLogs }) => {
  const { data: agentRuns, loading: runsLoading } = useAgentRuns({ limit: 50 });
  const { data: currentUser, loading: userLoading } = useCurrentUser();
  const { data: repositories, loading: reposLoading } = useRepositories();
  const { data: organizations, loading: orgsLoading } = useOrganizations();
  const { data: integrations, loading: integrationsLoading } = useOrganizationIntegrations();
  const [starredRunIds, setStarredRunIds] = useLocalStorage<number[]>('starredAgentRunIds', []);

  const recentRuns = agentRuns?.items || [];
  // update unseen notifications with any status changes observed here
  if (recentRuns.length > 0) {
    try { updateWithRuns(recentRuns as any); } catch {}
  }
  // Only ACTIVE (RUNNING) and STARRED
  const displayedRuns = recentRuns.filter(run => run.status === AgentRunStatus.RUNNING || starredRunIds.includes(run.id));
  
  // Calculate statistics
  const runStats = recentRuns.reduce((acc, run) => {
    acc.total++;
    if (run.status === AgentRunStatus.COMPLETED) acc.completed++;
    else if (run.status === AgentRunStatus.RUNNING) acc.running++;
    else if (run.status === AgentRunStatus.FAILED) acc.failed++;
    else if (run.status === AgentRunStatus.PENDING) acc.pending++;
    return acc;
  }, { total: 0, completed: 0, running: 0, failed: 0, pending: 0 });

  const activeIntegrations = Array.isArray(integrations) ? integrations.filter(int => int.status === 'active') : [];

  if (userLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Agent Runs */}
          <div className="lg:col-span-2">
            <div className="bg-secondary rounded-lg">
              <div className="px-6 py-4 border-b border-border-color">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Recent Agent Runs</h3>
                  <button
                    onClick={onCreateRun}
                    className="text-accent hover:text-accent-hover text-sm font-medium"
                  >
                    Create New Run
                  </button>
                </div>
              </div>
              <div className="p-6">
                {runsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : displayedRuns.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary mb-2">No active or starred runs</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedRuns.slice(0, 5).map((run) => (
                      <RunCard
                        key={run.id}
                        run={run}
                        onView={() => onViewRun(run.id)}
                        onViewLogs={() => onViewLogs(run.id)}
                        isStarred={starredRunIds.includes(run.id)}
                        onToggleStar={() => {
                          setStarredRunIds(prev => prev.includes(run.id) ? prev.filter(id => id !== run.id) : [...prev, run.id]);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Integrations Status */}
            <div className="bg-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Integrations</h3>
              {integrationsLoading ? (
                <LoadingSpinner size="sm" />
              ) : activeIntegrations.length > 0 ? (
                <div className="space-y-2">
                  {activeIntegrations.slice(0, 3).map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between">
                      <span className="text-text-primary">{integration.name}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  ))}
                  {activeIntegrations.length > 3 && (
                    <p className="text-sm text-text-secondary">
                      +{activeIntegrations.length - 3} more integrations
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-text-secondary">No active integrations</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
  icon: React.ReactNode;
}> = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-secondary rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const RunCard: React.FC<{
  run: AgentRun;
  onView: () => void;
  onViewLogs: () => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
}> = ({ run, onView, onViewLogs, isStarred, onToggleStar }) => {
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

  return (
    <div className="flex items-center justify-between p-4 bg-hover rounded-lg hover:bg-border-color transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              Run #{run.id}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {new Date(run.created_at).toLocaleDateString()} at{' '}
              {new Date(run.created_at).toLocaleTimeString()}
            </p>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
            {run.status}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={onToggleStar}
          className={`text-xs font-medium ${isStarred ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
          aria-label={isStarred ? 'Unstar run' : 'Star run'}
        >
          {isStarred ? '★' : '☆'}
        </button>
        <button
          onClick={onViewLogs}
          className="text-xs text-accent hover:text-accent-hover font-medium"
        >
          Logs
        </button>
        <button
          onClick={onView}
          className="text-text-secondary hover:text-text-primary"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
