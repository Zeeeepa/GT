import React, { useState, useEffect, useRef } from 'react';
import { 
  useAgentRunLogs, 
  useAgentRun,
  useAgentRunLogStream 
} from '../../hooks/codegen_api';
import { AgentRunLog, MessageType, AgentRunStatus } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { ChevronDoubleLeftIcon } from '../shared/icons/ChevronDoubleLeftIcon';
import { SearchIcon } from '../shared/icons/SearchIcon';
import { DownloadIcon } from '../shared/icons/DownloadIcon';
import { SyncIcon } from '../shared/icons/SyncIcon';
import { PlayIcon } from '../shared/icons/PlayIcon';
import { StopIcon } from '../shared/icons/StopIcon';
import { EyeIcon } from '../shared/icons/EyeIcon';
import { EyeSlashIcon } from '../shared/icons/EyeSlashIcon';

interface LogsViewerProps {
  agentRunId: number;
  onBack: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ agentRunId, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageType | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const { data: agentRun } = useAgentRun(agentRunId);
  const { data: logsData, loading, error, refetch } = useAgentRunLogs(agentRunId, {
    skip: currentPage * pageSize,
    limit: pageSize
  });
  
  const {
    logs: streamLogs,
    loading: streamLoading,
    isComplete: streamComplete,
    startStreaming,
    stopStreaming
  } = useAgentRunLogStream(agentRun?.status === AgentRunStatus.RUNNING ? agentRunId : null);

  const allLogs = streamLogs.length > 0 ? streamLogs : (logsData?.logs || []);
  const isRunning = agentRun?.status === AgentRunStatus.RUNNING;

  // Filter logs
  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.thought?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tool_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof log.observation === 'string' && log.observation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = messageTypeFilter === 'all' || log.message_type === messageTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoScroll]);

  // Start streaming if run is active
  useEffect(() => {
    if (isRunning && !streamLoading && !streamComplete) {
      startStreaming();
    }
    return () => {
      if (streamLoading) {
        stopStreaming();
      }
    };
  }, [isRunning, streamLoading, streamComplete, startStreaming, stopStreaming]);

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Message Type', 'Tool Name', 'Thought', 'Observation'].join(','),
      ...filteredLogs.map(log => [
        log.created_at,
        log.message_type,
        log.tool_name || '',
        log.thought ? `"${log.thought.replace(/"/g, '""')}"` : '',
        typeof log.observation === 'string' ? `"${log.observation.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-run-${agentRunId}-logs.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMessageTypeColor = (type: MessageType) => {
    switch (type) {
      case MessageType.ACTION:
        return 'bg-blue-100 text-blue-800';
      case MessageType.FINAL_ANSWER:
        return 'bg-green-100 text-green-800';
      case MessageType.ERROR:
        return 'bg-red-100 text-red-800';
      case MessageType.USER_MESSAGE:
        return 'bg-purple-100 text-purple-800';
      case MessageType.PLAN_EVALUATION:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLogValue = (value: any, maxLength: number = 200): string => {
    if (value === null || value === undefined) return '';
    
    let str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    
    if (!showFullDetails && str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    
    return str;
  };

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
                Logs - Agent Run #{agentRunId}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                {agentRun && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    agentRun.status === AgentRunStatus.RUNNING 
                      ? 'bg-yellow-100 text-yellow-800'
                      : agentRun.status === AgentRunStatus.COMPLETED
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agentRun.status}
                  </span>
                )}
                <span className="text-sm text-text-secondary">
                  {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
                </span>
                {isRunning && (
                  <span className="inline-flex items-center text-sm text-accent">
                    <PlayIcon className="w-3 h-3 mr-1" />
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoScroll 
                  ? 'bg-accent text-white' 
                  : 'bg-primary border border-border-color text-text-primary hover:bg-hover'
              }`}
            >
              {autoScroll ? <EyeIcon className="w-4 h-4 mr-1" /> : <EyeSlashIcon className="w-4 h-4 mr-1" />}
              Auto-scroll
            </button>
            
            <button
              onClick={exportLogs}
              className="inline-flex items-center px-3 py-2 bg-primary hover:bg-hover border border-border-color text-text-primary rounded-lg text-sm font-medium transition-colors"
            >
              <DownloadIcon className="w-4 h-4 mr-1" />
              Export CSV
            </button>

            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 bg-primary hover:bg-hover border border-border-color text-text-primary rounded-lg text-sm font-medium transition-colors"
            >
              <SyncIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Message Type Filter */}
          <select
            value={messageTypeFilter}
            onChange={(e) => setMessageTypeFilter(e.target.value as MessageType | 'all')}
            className="px-3 py-2 bg-primary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value={MessageType.ACTION}>Action</option>
            <option value={MessageType.PLAN_EVALUATION}>Plan Evaluation</option>
            <option value={MessageType.FINAL_ANSWER}>Final Answer</option>
            <option value={MessageType.ERROR}>Error</option>
            <option value={MessageType.USER_MESSAGE}>User Message</option>
          </select>

          {/* Toggle Details */}
          <button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="px-3 py-2 bg-primary hover:bg-hover border border-border-color text-text-primary rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {showFullDetails ? 'Compact View' : 'Full Details'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading && allLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">Error loading logs: {error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">No logs found</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-6 space-y-4">
              {filteredLogs.map((log, index) => (
                <LogEntry
                  key={`${log.created_at}-${index}`}
                  log={log}
                  showFullDetails={showFullDetails}
                />
              ))}
              
              {streamLoading && (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                  <span className="ml-2 text-text-secondary">Loading new logs...</span>
                </div>
              )}
              
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LogEntry: React.FC<{
  log: AgentRunLog;
  showFullDetails: boolean;
}> = ({ log, showFullDetails }) => {
  const [expanded, setExpanded] = useState(false);

  const getMessageTypeColor = (type: MessageType) => {
    switch (type) {
      case MessageType.ACTION:
        return 'bg-blue-100 text-blue-800';
      case MessageType.FINAL_ANSWER:
        return 'bg-green-100 text-green-800';
      case MessageType.ERROR:
        return 'bg-red-100 text-red-800';
      case MessageType.USER_MESSAGE:
        return 'bg-purple-100 text-purple-800';
      case MessageType.PLAN_EVALUATION:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderValue = (value: any, label: string) => {
    if (!value) return null;
    
    const isObject = typeof value === 'object';
    const displayValue = isObject ? JSON.stringify(value, null, 2) : value;
    const shouldTruncate = !showFullDetails && !expanded && displayValue.length > 200;
    
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-text-primary">{label}</h4>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-accent hover:text-accent-hover"
            >
              {expanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
        <div className={`bg-primary rounded p-3 border border-border-color ${isObject ? 'font-mono text-xs' : 'text-sm'}`}>
          <pre className="whitespace-pre-wrap text-text-primary">
            {shouldTruncate && !expanded 
              ? `${displayValue.substring(0, 200)}...`
              : displayValue
            }
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-secondary rounded-lg border border-border-color">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(log.message_type)}`}>
              {log.message_type}
            </span>
            {log.tool_name && (
              <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                {log.tool_name}
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary">
            {new Date(log.created_at).toLocaleString()}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {log.thought && renderValue(log.thought, 'Thought')}
          {log.tool_input && renderValue(log.tool_input, 'Tool Input')}
          {log.tool_output && renderValue(log.tool_output, 'Tool Output')}
          {log.observation && renderValue(log.observation, 'Observation')}
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
