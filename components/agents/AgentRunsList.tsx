import React, { useMemo, useState } from 'react';
import { useAgentRuns } from '../../hooks/codegen_api';
import { updateWithRuns } from '../../utils/notifications';
import { AgentRunStatus, AgentRun, SourceType } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { SearchIcon } from '../shared/icons/SearchIcon';
import { PlusIcon } from '../shared/icons/PlusIcon';
import { ChevronRightIcon } from '../shared/icons/ChevronRightIcon';
import { EyeIcon } from '../shared/icons/EyeIcon';
import { PlayIcon } from '../shared/icons/PlayIcon';
import { StopIcon } from '../shared/icons/StopIcon';
import { filterAgentRuns, sortAgentRuns, getDateRanges, hasActiveFilters, clearFilters, type AgentRunFilters, type SortOptions } from '../../utils/agentRunFilters';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useResumeAgentRun, useStopAgentRun } from '../../hooks/codegen_api';

interface AgentRunsListProps {
  onSelectRun: (agentRunId: number) => void;
  onCreateRun: () => void;
}

const AgentRunsList: React.FC<AgentRunsListProps> = ({ onSelectRun, onCreateRun }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentRunStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const { data: agentRunsData, loading, error, refetch } = useAgentRuns({
    skip: currentPage * pageSize,
    limit: pageSize
  });

  const agentRuns = agentRunsData?.items || [];
  if (agentRuns.length > 0) { try { updateWithRuns(agentRuns as any); } catch {} }
  const totalPages = agentRunsData ? Math.ceil(agentRunsData.total / pageSize) : 0;

  const [starredRunIds, setStarredRunIds] = useLocalStorage<number[]>('starredAgentRunIds', []);
  const { execute: resumeRun, loading: resuming } = useResumeAgentRun();
  const { execute: stopRun, loading: stopping } = useStopAgentRun();

  // New unified filters + sort
  const filters: AgentRunFilters = useMemo(() => ({
    status: statusFilter === 'all' ? undefined : [statusFilter as AgentRunStatus],
    searchQuery: searchTerm,
  }), [statusFilter, searchTerm]);

  const sort: SortOptions = useMemo(() => ({ field: 'created_at', direction: 'desc' }), []);

  const filteredRuns = useMemo(() => sortAgentRuns(filterAgentRuns(
    sourceFilter === 'all' ? agentRuns : agentRuns.filter(r => r.source_type === sourceFilter),
    filters
  ), sort), [agentRuns, sourceFilter, filters, sort]);

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

  const getStatusIcon = (status: AgentRunStatus) => {
    switch (status) {
      case AgentRunStatus.RUNNING:
        return <PlayIcon className="w-3 h-3" />;
      case AgentRunStatus.COMPLETED:
        return <StopIcon className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (loading && agentRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header and Filters */}
      <div className="bg-secondary border-b border-border-color p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Agent Runs</h2>
          <button
            onClick={onCreateRun}
            className="inline-flex items-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Run
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID or prompt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgentRunStatus | 'all')}
            className="px-3 py-2 bg-primary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value={AgentRunStatus.PENDING}>Pending</option>
            <option value={AgentRunStatus.RUNNING}>Running</option>
            <option value={AgentRunStatus.COMPLETED}>Completed</option>
            <option value={AgentRunStatus.FAILED}>Failed</option>
            <option value={AgentRunStatus.CANCELLED}>Cancelled</option>
            <option value={AgentRunStatus.PAUSED}>Paused</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceType | 'all')}
            className="px-3 py-2 bg-primary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value={SourceType.GITHUB}>GitHub</option>
            <option value={SourceType.SLACK}>Slack</option>
            <option value={SourceType.API}>API</option>
            <option value={SourceType.CHAT}>Chat</option>
            <option value={SourceType.LINEAR}>Linear</option>
            <option value={SourceType.JIRA}>Jira</option>
          </select>
          {hasActiveFilters(filters) && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSourceFilter('all'); }}
              className="px-3 py-2 bg-primary border border-border-color rounded-lg text-text-primary hover:bg-hover"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">Error loading agent runs: {error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-6 text-center">
            {agentRuns.length === 0 ? (
              <div>
                <p className="text-text-secondary mb-4">No agent runs found</p>
                <button
                  onClick={onCreateRun}
                  className="inline-flex items-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create First Run
                </button>
              </div>
            ) : (
              <p className="text-text-secondary">No runs match your search criteria</p>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-2">
              {filteredRuns.map((run) => (
                <RunListItem
                  key={run.id}
                  run={run}
                  isStarred={starredRunIds.includes(run.id)}
                  onToggleStar={() => setStarredRunIds(prev => prev.includes(run.id) ? prev.filter(id => id !== run.id) : [...prev, run.id])}
                  onResume={async () => {
                    await resumeRun(run.id, 'Resume run');
                    refetch();
                  }}
                  onStop={async () => {
                    await stopRun(run.id);
                    refetch();
                  }}
                  onSelect={() => onSelectRun(run.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-color">
                <p className="text-text-secondary text-sm">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, agentRunsData?.total || 0)} of {agentRunsData?.total || 0} results
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-2 text-sm bg-secondary border border-border-color rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover"
                  >
                    Previous
                  </button>
                  <span className="text-text-secondary text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-2 text-sm bg-secondary border border-border-color rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
};

const RunListItem: React.FC<{
  run: AgentRun;
  onSelect: () => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}> = ({ run, onSelect, isStarred, onToggleStar, onResume, onStop }) => {
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
    <div
      onClick={onSelect}
      className="flex items-center justify-between p-4 bg-secondary hover:bg-hover rounded-lg cursor-pointer transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white font-bold">
              #{run.id}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-text-primary font-medium">
                Agent Run #{run.id}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                {run.status}
              </span>
              {run.source_type && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {run.source_type}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <span>
                Created {new Date(run.created_at).toLocaleDateString()} at{' '}
                {new Date(run.created_at).toLocaleTimeString()}
              </span>
              {run.github_pull_requests && run.github_pull_requests.length > 0 && (
                <span className="inline-flex items-center">
                  <GithubIcon className="w-3 h-3 mr-1" />
                  {run.github_pull_requests.length} PR{run.github_pull_requests.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {run.prompt && (
              <p className="text-text-secondary text-sm mt-2 truncate">
                {run.prompt.length > 100 ? `${run.prompt.substring(0, 100)}...` : run.prompt}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 ml-4 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar && onToggleStar(); }}
          className={`text-xs ${isStarred ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
          aria-label={isStarred ? 'Unstar run' : 'Star run'}
          title={isStarred ? 'Unstar' : 'Star'}
        >
          {isStarred ? '★' : '☆'}
        </button>
        {run.status === AgentRunStatus.PAUSED && (
          <button
            onClick={(e) => { e.stopPropagation(); onResume && onResume(); }}
            className="px-2 py-1 rounded bg-accent text-white text-xs hover:bg-accent-hover"
            title="Resume"
          >
            Resume
          </button>
        )}
        {run.status === AgentRunStatus.RUNNING && (
          <button
            onClick={(e) => { e.stopPropagation(); onStop && onStop(); }}
            className="px-2 py-1 rounded bg-danger text-white text-xs hover:bg-danger/80"
            title="Stop"
          >
            Stop
          </button>
        )}
        {run.status === AgentRunStatus.COMPLETED && (
          <button
            onClick={(e) => { e.stopPropagation(); onResume && onResume(); }}
            className="px-2 py-1 rounded bg-accent text-white text-xs hover:bg-accent-hover"
            title="Resume"
          >
            Resume
          </button>
        )}
        <ChevronRightIcon className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
      </div>
    </div>
  );
};

// GitHub Icon component (small)
const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default AgentRunsList;
