import React from 'react';
import { AgentRunStatus } from '../../../types';

interface AgentRunsFilterProps {
  statusFilter: string | null;
  dateRangeFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  onDateRangeFilterChange: (range: string | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const AgentRunsFilter: React.FC<AgentRunsFilterProps> = ({
  statusFilter,
  dateRangeFilter,
  onStatusFilterChange,
  onDateRangeFilterChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  const statusOptions = [
    { value: AgentRunStatus.RUNNING, label: 'Running' },
    { value: AgentRunStatus.COMPLETED, label: 'Completed' },
    { value: AgentRunStatus.FAILED, label: 'Failed' },
    { value: AgentRunStatus.PROCESSING, label: 'Processing' },
    { value: AgentRunStatus.INITIALIZING, label: 'Initializing' },
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
  ];

  return (
    <div className="agent-runs-filters">
      <div className="filter-group">
        <label className="filter-label">Status:</label>
        <select
          className="filter-select"
          value={statusFilter || ''}
          onChange={(e) => onStatusFilterChange(e.target.value || null)}
        >
          <option value="">All</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Date Range:</label>
        <select
          className="filter-select"
          value={dateRangeFilter || ''}
          onChange={(e) => onDateRangeFilterChange(e.target.value || null)}
        >
          <option value="">All Time</option>
          {dateRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          className="btn btn-secondary"
          onClick={onClearFilters}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default AgentRunsFilter;
