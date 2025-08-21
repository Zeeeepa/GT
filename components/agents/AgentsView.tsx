import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Filter, 
  Plus, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  FileText
} from "lucide-react";
import { useAgentRunSelection } from "./contexts/AgentRunSelectionContext";
import { useDialog } from "./contexts/DialogContext";
import { AgentRunResponseModal } from "./components/AgentRunResponseModal";
import { ResumeAgentRunDialog } from "./components/ResumeAgentRunDialog";
import { CreateRunDialog } from "./components/CreateRunDialog";
import { useCachedAgentRuns } from "../../hooks/useCachedAgentRuns";
import { getAPIClient } from "../../services/codegenApiService";
import { getAgentRunCache } from "../../storage/agentRunCache";
import { AgentRunStatus, CachedAgentRun } from "../../types";
import { getDateRanges, getStatusFilterOptions, hasActiveFilters, clearFilters } from "../../utils/filtering";
import { SyncStatus } from "../../storage/cacheTypes";
import { CodegenIcon } from '../shared/icons/CodegenIcon';
import LoadingSpinner from '../../shared/LoadingSpinner';

export default function AgentsView() {
  const {
    filteredRuns,
    isLoading,
    isRefreshing,
    error,
    syncStatus,
    refresh,
    updateFilters,
    filters,
    organizationId,
  } = useCachedAgentRuns();

  const selection = useAgentRunSelection();
  const { openDialog, closeDialog, isDialogOpen, dialogData } = useDialog();
  const [searchText, setSearchText] = useState("");
  const [dateRanges] = useState(() => getDateRanges());
  const [responseModalRun, setResponseModalRun] = useState<CachedAgentRun | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const apiClient = getAPIClient();
  const cache = getAgentRunCache();

  const statusFilterOptions = useMemo(() => {
    return getStatusFilterOptions(filteredRuns);
  }, [filteredRuns]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    updateFilters({
      ...filters,
      searchQuery: text,
    });
  }, [filters, updateFilters]);

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "running":
        return Clock;
      case "complete":
      case "completed":
        return CheckCircle;
      case "failed":
      case "error":
        return XCircle;
      case "cancelled":
      case "stopped":
        return Square;
      case "paused":
        return Pause;
      case "pending":
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "running":
        return "text-blue-400";
      case "complete":
      case "completed":
        return "text-success";
      case "failed":
      case "error":
        return "text-danger";
      case "cancelled":
      case "stopped":
        return "text-text-secondary";
      case "paused":
        return "text-yellow-500";
      case "pending":
        return "text-gray-400";
      default:
        return "text-text-secondary";
    }
  };

  const getStatusDisplay = (status: string) => ({
    icon: getStatusIcon(status),
    color: getStatusColor(status),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const stopAgentRun = async (agentRunId: number) => {
    if (!organizationId) return;
    if (!window.confirm(`Are you sure you want to stop agent run #${agentRunId}?`)) return;

    try {
      await apiClient.stopAgentRun(organizationId, { agent_run_id: agentRunId });
      toast.success(`Agent run #${agentRunId} has been stopped`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to stop agent run");
    }
  };

  const resumeAgentRun = (agentRunId: number) => {
    if (!organizationId) return;
    openDialog('resume-run', { agentRunId, organizationId });
  };

  const deleteAgentRun = async (agentRunId: number) => {
    if (!organizationId) return;
    if (!window.confirm(`Are you sure you want to delete agent run #${agentRunId}? This removes it from local cache.`)) return;

    try {
      await cache.removeAgentRun(organizationId, agentRunId);
      toast.success(`Agent run #${agentRunId} has been removed`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete agent run");
    }
  };

  const handleClearFilters = useCallback(() => {
    updateFilters(clearFilters());
    setSearchText("");
  }, [updateFilters]);

  const filterByStatus = useCallback((status: string) => {
    if (status === 'all') {
        updateFilters({ ...filters, status: undefined });
        return;
    }
    const currentStatuses = filters.status || [];
    const newStatus = status as AgentRunStatus;
    const newStatuses = currentStatuses.includes(newStatus)
      ? currentStatuses.filter(s => s !== newStatus)
      : [...currentStatuses, newStatus];
    
    updateFilters({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  }, [filters, updateFilters]);

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="h-12 w-12 text-danger mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Error Loading Agent Runs</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <button onClick={refresh} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent/80">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-primary text-text-primary flex flex-col p-6">
      <header className="flex items-center justify-between pb-4 border-b border-border-color">
        <div className="flex items-center gap-3">
            <CodegenIcon className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-text-primary">Codegen Agent Runs</h1>
        </div>
        <div className="flex items-center gap-4">
            <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent/80 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent Run
            </button>
        </div>
      </header>

      {/* Filters */}
      <div className="py-4 border-b border-border-color">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
              <input type="text" placeholder="Search by prompt or ID..." value={searchText} onChange={(e) => handleSearchTextChange(e.target.value)}
                  className="w-full bg-secondary border border-border-color rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
          </div>
          <select value={filters.status?.[0] || 'all'} onChange={(e) => filterByStatus(e.target.value)}
              className="bg-secondary border border-border-color rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="all">All Statuses</option>
              {statusFilterOptions.map(({ status, count, label }) => (
                  <option key={status} value={status}> {label} ({count}) </option>
              ))}
          </select>
          {hasActiveFilters(filters) && (
            <button onClick={handleClearFilters} className="inline-flex items-center px-3 py-2 border border-border-color text-sm rounded-md hover:bg-tertiary">
              <Filter className="h-4 w-4 mr-2" /> Clear
            </button>
          )}
          <button onClick={refresh} disabled={isRefreshing} className="inline-flex items-center px-3 py-2 border border-border-color text-sm rounded-md hover:bg-tertiary disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-4">
        {isLoading && filteredRuns.length === 0 ? (
          <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white mb-2">{hasActiveFilters(filters) ? "No Matching Agent Runs" : "No Agent Runs"}</h3>
            <p className="text-text-secondary mb-6">{hasActiveFilters(filters) ? "Try adjusting your search or filters" : "Create your first agent run to get started"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-color">
            {filteredRuns.map((run) => {
              const { icon: StatusIcon, color } = getStatusDisplay(run.status);
              const canStop = run.status.toLowerCase() === "active" || run.status.toLowerCase() === "running";
              const canResume = run.status.toLowerCase() === "paused";
              const canViewResponse = run.status.toLowerCase() === "complete" && run.result;
              const isSelected = selection.isSelected(run.id);

              return (
                <div key={run.id} onClick={() => selection.toggleRun(run.id, run as CachedAgentRun)}
                  className={`p-4 rounded-lg my-2 border transition-all cursor-pointer ${isSelected ? 'bg-accent/10 border-accent' : 'bg-secondary border-border-color hover:bg-tertiary'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <StatusIcon className={`h-6 w-6 ${color} shrink-0`} />
                      <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{run.prompt || 'No prompt'}</p>
                          <div className="flex items-center space-x-3 text-xs text-text-secondary mt-1">
                              <span>ID: {run.id}</span>
                              <span>•</span>
                              <span>{formatDate(run.created_at)}</span>
                          </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {canViewResponse && (
                            <button onClick={() => setResponseModalRun(run as CachedAgentRun)} className="p-2 rounded-md hover:bg-border-color" title="View Response"><FileText className="h-4 w-4" /></button>
                        )}
                        <a href={run.web_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-border-color" title="Open in Browser"><ExternalLink className="h-4 w-4" /></a>
                        <button onClick={() => copyToClipboard(run.web_url, 'Web URL copied')} className="p-2 rounded-md hover:bg-border-color" title="Copy Web URL"><Copy className="h-4 w-4" /></button>
                        {canStop && (
                            <button onClick={() => stopAgentRun(run.id)} className="p-2 rounded-md text-danger hover:bg-danger/20" title="Stop Agent Run"><Square className="h-4 w-4" /></button>
                        )}
                        {canResume && (
                            <button onClick={() => resumeAgentRun(run.id)} className="p-2 rounded-md text-success hover:bg-success/20" title="Resume Agent Run"><Play className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => deleteAgentRun(run.id)} className="p-2 rounded-md text-danger hover:bg-danger/20" title="Delete Agent Run"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Modals */}
      {responseModalRun && <AgentRunResponseModal run={responseModalRun} isOpen={!!responseModalRun} onClose={() => setResponseModalRun(null)} />}
      {isDialogOpen('resume-run') && dialogData && (
          <ResumeAgentRunDialog isOpen={isDialogOpen('resume-run')} onClose={closeDialog} agentRunId={dialogData.agentRunId} organizationId={dialogData.organizationId} onResumed={refresh} />
      )}
      <CreateRunDialog isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} onCreated={refresh} />
    </div>
  );
}