import React, { useState, useEffect } from 'react';
import { getAgentRunCache } from '../../storage/agentRunCache';
import { getDefaultOrganizationId } from '../../utils/credentials';
import { AgentRunStatus } from '../../types';

export const ActiveAgentRunsCounter: React.FC = () => {
  const [activeRuns, setActiveRuns] = useState<number>(0);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  useEffect(() => {
    const loadOrganizationId = async () => {
      try {
        const defaultOrgId = await getDefaultOrganizationId();
        setOrganizationId(defaultOrgId);
      } catch (error) {
        console.error('Error loading organization ID:', error);
      }
    };
    
    loadOrganizationId();
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    
    const updateActiveRuns = async () => {
      try {
        const cache = getAgentRunCache();
        const runs = await cache.getAgentRuns(organizationId);
        
        // Count runs with status 'running' or 'pending'
        const active = runs.filter(run => 
          run.status === AgentRunStatus.RUNNING || 
          run.status === AgentRunStatus.PENDING
        ).length;
        
        setActiveRuns(active);
      } catch (error) {
        console.error('Error counting active runs:', error);
      }
    };
    
    // Initial update
    updateActiveRuns();
    
    // Set up interval to update every 10 seconds
    const intervalId = setInterval(updateActiveRuns, 10000);
    
    return () => clearInterval(intervalId);
  }, [organizationId]);

  if (activeRuns === 0) return null;

  return (
    <div className="flex items-center px-3 py-1 rounded-md bg-primary border border-border-color">
      <span className="text-sm font-medium" style={{ color: '#39FF14' }}>
        Agent Runs Active: {activeRuns}
      </span>
    </div>
  );
};

export default ActiveAgentRunsCounter;
