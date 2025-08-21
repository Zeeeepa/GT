import React, { useState, useEffect } from 'react';
import { AgentRunResponse } from '../../types';
import { getAPIClient } from '../../services/codegenApiService';
import DashboardLayout from '../dashboard/DashboardLayout';
import AgentRunsListView from './components/AgentRunsListView';
import AgentRunDetailView from './components/AgentRunDetailView';
import CreateAgentRunForm from './components/CreateAgentRunForm';
import ToastProvider from '../common/ToastProvider';

const AgentsView: React.FC = () => {
  const [selectedRun, setSelectedRun] = useState<AgentRunResponse | null>(null);
  const [isCreatingRun, setIsCreatingRun] = useState(false);

  const handleSelectRun = (run: AgentRunResponse) => {
    setSelectedRun(run);
  };

  const handleCloseRunDetail = () => {
    setSelectedRun(null);
  };

  const handleResumeRun = async (runId: number) => {
    try {
      const apiClient = getAPIClient();
      const resumedRun = await apiClient.resumeAgentRun(runId);
      setSelectedRun(resumedRun);
    } catch (error) {
      console.error('Error resuming run:', error);
    }
  };

  const handleCreateRun = () => {
    setIsCreatingRun(true);
  };

  const handleRunCreated = (runId: number) => {
    setIsCreatingRun(false);
    // Fetch the newly created run and select it
    const fetchRun = async () => {
      try {
        const apiClient = getAPIClient();
        const run = await apiClient.getAgentRun(runId);
        setSelectedRun(run);
      } catch (error) {
        console.error('Error fetching created run:', error);
      }
    };
    fetchRun();
  };

  const handleCancelCreateRun = () => {
    setIsCreatingRun(false);
  };

  return (
    <ToastProvider>
      <DashboardLayout>
        {isCreatingRun ? (
          <CreateAgentRunForm 
            onRunCreated={handleRunCreated} 
            onCancel={handleCancelCreateRun} 
          />
        ) : selectedRun ? (
          <AgentRunDetailView 
            agentRun={selectedRun} 
            onClose={handleCloseRunDetail} 
            onResume={handleResumeRun} 
          />
        ) : (
          <AgentRunsListView onSelectRun={handleSelectRun} />
        )}
      </DashboardLayout>
    </ToastProvider>
  );
};

export default AgentsView;
