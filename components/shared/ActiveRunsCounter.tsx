import React from 'react';
import { useAgentRunsStatus } from '../../hooks/useAgentRunsStatus';

interface ActiveRunsCounterProps {
  className?: string;
}

const ActiveRunsCounter: React.FC<ActiveRunsCounterProps> = ({ className = '' }) => {
  const { activeRunsCount, loading } = useAgentRunsStatus();

  if (loading && activeRunsCount === 0) {
    return null;
  }

  return (
    <div className={`font-mono text-sm ${className}`}>
      <span className="text-neon-green animate-pulse">
        Agent Runs Active: {activeRunsCount}
      </span>
    </div>
  );
};

export default ActiveRunsCounter;

