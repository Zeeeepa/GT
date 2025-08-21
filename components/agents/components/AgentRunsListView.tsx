import React, { useState, useEffect } from 'react';
import { AgentRunResponse, AgentRunStatus } from '../../../types';
import { getAPIClient } from '../../../services/codegenApiService';
import { getBackgroundMonitoringService, MonitoringEventType } from '../../../utils/backgroundMonitoring';
import { showToast, ToastStyle } from '../../../utils/toast';
import LoadingSpinner from '../../../shared/LoadingSpinner';

interface AgentRunsListViewProps {
  onSelectRun: (run: AgentRunResponse) => void;
  onCreateRun?: () => void;
}

const AgentRunsListView: React.FC<AgentRunsListViewProps> = ({ onSelectRun, onCreateRun }) => {
  const [runs, setRuns] = useState<AgentRunResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  // Load agent runs
  useEffect(() => {
    const loadAgentRuns = async () => {
      setIsLoading(true);
      try {
        const apiClient = getAPIClient();
        const response = await apiClient.getAgentRuns();
        setRuns(response);
      } catch (error) {
        console.error('Error loading agent runs:', error);
        showToast({
          style: ToastStyle.Failure,
          title: 'Failed to load agent runs',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgentRuns();
  }, []);

  // Set up background monitoring for active runs
  useEffect(() => {
    const monitoringService = getBackgroundMonitoringService();
    
    // Start tracking active runs
    runs.forEach(run => {
      if (
        run.status === AgentRunStatus.ACTIVE ||
        run.status === AgentRunStatus.RUNNING ||
        run.status === AgentRunStatus.PROCESSING ||
        run.status === AgentRunStatus.INITIALIZING ||
        run.status === AgentRunStatus.PENDING
      ) {
        monitoringService.trackRun(run.organization_id, run.id, run.status);
      }
    });
    
    // Handle run updates
    const handleRunUpdate = (updatedRun: AgentRunResponse) => {
      setRuns(prevRuns => 
        prevRuns.map(run => 
          run.id === updatedRun.id ? updatedRun : run
        )
      );
    };
    
    monitoringService.addEventListener(MonitoringEventType.RUN_UPDATED, handleRunUpdate);
    
    // Clean up
    return () => {
      monitoringService.removeEventListener(MonitoringEventType.RUN_UPDATED, handleRunUpdate);
      runs.forEach(run => {
        if (monitoringService.isTracking(run.id)) {
          monitoringService.untrackRun(run.id);
        }
      });
    };
  }, [runs]);

  // Filter runs based on status and date
  const filteredRuns = runs.filter(run => {
    let matchesStatus = true;
    let matchesDate = true;
    
    if (statusFilter) {
      matchesStatus = run.status.toLowerCase() === statusFilter.toLowerCase();
    }
    
    if (dateFilter) {
      const runDate = new Date(run.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = runDate.toDateString() === today.toDateString();
          break;
        case 'yesterday': {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          matchesDate = runDate.toDateString() === yesterday.toDateString();
          break;
        }
        case 'week': {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = runDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          matchesDate = runDate >= monthAgo;
          break;
        }
      }
    }
    
    return matchesStatus && matchesDate;
  });

  // Sort runs by creation date (newest first)
  const sortedRuns = [...filteredRuns].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'processing':
      case 'initializing':
        return 'status-active';
      case 'complete':
      case 'resumed':
        return 'status-complete';
      case 'failed':
      case 'error':
      case 'timeout':
      case 'cancelled':
      case 'max_iterations_reached':
      case 'out_of_tokens':
        return 'status-error';
      case 'paused':
        return 'status-paused';
      case 'pending':
      case 'evaluation':
        return 'status-pending';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="agent-runs-list-view">
      <div className="list-header">
        <h2>Agent Runs</h2>
        <div className="header-actions">
          {onCreateRun && (
            <button className="btn btn-primary" onClick={onCreateRun}>
              New Run
            </button>
          )}
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter || ''} 
            onChange={e => setStatusFilter(e.target.value || null)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="running">Running</option>
            <option value="complete">Complete</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date:</label>
          <select 
            value={dateFilter || ''} 
            onChange={e => setDateFilter(e.target.value || null)}
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <LoadingSpinner size="large" />
          <p>Loading agent runs...</p>
        </div>
      ) : sortedRuns.length === 0 ? (
        <div className="empty-state">
          <p>No agent runs found</p>
          {onCreateRun && (
            <button className="btn btn-primary" onClick={onCreateRun}>
              Create Your First Run
            </button>
          )}
        </div>
      ) : (
        <div className="runs-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Repository</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRuns.map(run => (
                <tr key={run.id} onClick={() => onSelectRun(run)}>
                  <td>{run.id}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td>{formatDate(run.created_at)}</td>
                  <td>
                    {run.repository?.name || 
                     run.metadata?.repository_name || 
                     'Unknown'}
                  </td>
                  <td>
                    <button 
                      className="btn btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRun(run);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentRunsListView;
