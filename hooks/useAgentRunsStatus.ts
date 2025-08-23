import { useState, useEffect } from 'react';
import { useAgentRuns } from './codegen_api';
import { AgentRunStatus } from '../types';

export function useAgentRunsStatus() {
  const { data: agentRuns, loading, error, refetch } = useAgentRuns({ limit: 50 });
  const [activeRunsCount, setActiveRunsCount] = useState(0);

  useEffect(() => {
    if (agentRuns?.items) {
      const activeRuns = agentRuns.items.filter(run => run.status === AgentRunStatus.RUNNING);
      setActiveRunsCount(activeRuns.length);
    }
  }, [agentRuns]);

  // Set up polling for active runs
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRunsCount > 0) {
        refetch();
      }
    }, 10000); // Poll every 10 seconds if there are active runs

    return () => clearInterval(interval);
  }, [activeRunsCount, refetch]);

  return {
    activeRunsCount,
    loading,
    error,
    refetch
  };
}

