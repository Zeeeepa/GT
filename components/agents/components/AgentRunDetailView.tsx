import React, { useState, useEffect } from 'react';
import { List, ActionPanel, Action, Detail, Icon } from '@raycast/api';
import { AgentRunResponse, AgentRunStep, AgentRunStatus } from '../../../types';
import { formatDistanceToNow } from 'date-fns';
import { getBackgroundMonitoringService, MonitoringEventType } from '../../../utils/backgroundMonitoring';
import { getAPIClient } from '../../../services/codegenApiService';
import { getRepositoryApiService } from '../../../services/repositoryApiService';
import { AgentRunStepList } from './AgentRunStepList';

interface AgentRunDetailViewProps {
  agentRun: AgentRunResponse;
  onClose?: () => void;
  onResume?: (agentRunId: number) => void;
}

export function AgentRunDetailView({ agentRun, onClose, onResume }: AgentRunDetailViewProps) {
  const [run, setRun] = useState<AgentRunResponse>(agentRun);
  const [isLoading, setIsLoading] = useState(false);
  const [repositoryName, setRepositoryName] = useState<string | null>(null);
  
  const apiClient = getAPIClient();
  const monitoringService = getBackgroundMonitoringService();
  const repositoryService = getRepositoryApiService();

  // Load repository details if available
  useEffect(() => {
    async function loadRepositoryDetails() {
      if (run.repository_id || (run.metadata?.repository_id)) {
        const repoId = run.repository_id || run.metadata?.repository_id;
        if (repoId) {
          try {
            const repo = await repositoryService.getRepository(
              run.organization_id.toString(),
              repoId
            );
            if (repo) {
              setRepositoryName(repo.name);
            }
          } catch (error) {
            console.error("Error loading repository details:", error);
          }
        }
      } else if (run.metadata?.repository_name) {
        setRepositoryName(run.metadata.repository_name);
      }
    }
    
    loadRepositoryDetails();
  }, [run]);

  // Set up monitoring for real-time updates
  useEffect(() => {
    const handleRunUpdate = (event: any) => {
      if (event.data && event.data.id === run.id) {
        setRun(event.data);
      }
    };

    // Start tracking this run for updates
    if (run.status.toLowerCase() === AgentRunStatus.ACTIVE.toLowerCase() ||
        run.status.toLowerCase() === AgentRunStatus.PENDING.toLowerCase()) {
      monitoringService.trackRun(run.organization_id, run.id, run.status);
    }

    // Add event listener for updates
    monitoringService.addEventListener(MonitoringEventType.RUN_UPDATED, handleRunUpdate);
    
    // Clean up
    return () => {
      monitoringService.removeEventListener(MonitoringEventType.RUN_UPDATED, handleRunUpdate);
      // Stop tracking if component unmounts
      if (monitoringService.isTracking(run.id)) {
        monitoringService.untrackRun(run.id);
      }
    };
  }, [run.id, monitoringService]);

  // Refresh run data
  const refreshRun = async () => {
    setIsLoading(true);
    try {
      const updatedRun = await apiClient.getAgentRun(
        run.organization_id.toString(),
        run.id
      );
      setRun(updatedRun);
    } catch (error) {
      console.error("Error refreshing agent run:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format the creation date
  const formattedDate = formatDistanceToNow(new Date(run.created_at), { addSuffix: true });
  
  // Determine status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case AgentRunStatus.ACTIVE.toLowerCase():
        return "⏳";
      case AgentRunStatus.COMPLETE.toLowerCase():
        return "✅";
      case AgentRunStatus.FAILED.toLowerCase():
      case AgentRunStatus.ERROR.toLowerCase():
        return "❌";
      case AgentRunStatus.PAUSED.toLowerCase():
        return "⏸️";
      default:
        return "🔄";
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!run.steps || run.steps.length === 0) return 0;
    
    const completedSteps = run.steps.filter(
      step => step.status === 'completed'
    ).length;
    
    return Math.round((completedSteps / run.steps.length) * 100);
  };

  // Generate markdown content for the detail view
  const generateMarkdown = () => {
    const progress = calculateProgress();
    const statusIcon = getStatusIcon(run.status);
    
    let markdown = `# Agent Run #${run.id}\n\n`;
    
    // Status and creation time
    markdown += `**Status:** ${statusIcon} ${run.status.toUpperCase()}\n`;
    markdown += `**Created:** ${formattedDate}\n`;
    
    // Repository context if available
    if (repositoryName) {
      markdown += `**Repository:** ${repositoryName}\n`;
    }
    
    // Progress bar for active runs
    if (run.status.toLowerCase() === AgentRunStatus.ACTIVE.toLowerCase() && run.steps && run.steps.length > 0) {
      markdown += `\n**Progress:** ${progress}%\n`;
      const progressBarWidth = 20;
      const filledBlocks = Math.round((progress / 100) * progressBarWidth);
      const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(progressBarWidth - filledBlocks);
      markdown += `\`${progressBar}\`\n`;
    }
    
    // Prompt
    if (run.prompt) {
      markdown += `\n## Prompt\n\n${run.prompt}\n`;
    }
    
    // Result (if completed)
    if (run.result && (
      run.status.toLowerCase() === AgentRunStatus.COMPLETE.toLowerCase() ||
      run.status.toLowerCase() === AgentRunStatus.FAILED.toLowerCase() ||
      run.status.toLowerCase() === AgentRunStatus.ERROR.toLowerCase()
    )) {
      markdown += `\n## Result\n\n${run.result}\n`;
    }
    
    // GitHub PRs if available
    if (run.github_pull_requests && run.github_pull_requests.length > 0) {
      markdown += `\n## Pull Requests\n\n`;
      run.github_pull_requests.forEach(pr => {
        markdown += `- [${pr.title}](${pr.url}) (Created ${formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })})\n`;
      });
    }
    
    return markdown;
  };

  return (
    <Detail
      markdown={generateMarkdown()}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="ID" text={run.id.toString()} />
          <Detail.Metadata.Label title="Status" text={run.status.toUpperCase()} />
          <Detail.Metadata.Label title="Created" text={formattedDate} />
          {repositoryName && (
            <Detail.Metadata.Label title="Repository" text={repositoryName} />
          )}
          {run.steps && run.steps.length > 0 && (
            <Detail.Metadata.Label 
              title="Progress" 
              text={`${calculateProgress()}%`} 
            />
          )}
          {run.parent_run_id && (
            <Detail.Metadata.Label 
              title="Resumed From" 
              text={`Run #${run.parent_run_id}`} 
            />
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action 
            title="Refresh" 
            icon={Icon.ArrowClockwise} 
            onAction={refreshRun} 
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
          {(run.status.toLowerCase() === AgentRunStatus.COMPLETE.toLowerCase() ||
            run.status.toLowerCase() === AgentRunStatus.FAILED.toLowerCase() ||
            run.status.toLowerCase() === AgentRunStatus.PAUSED.toLowerCase()) && onResume && (
            <Action 
              title="Resume Run" 
              icon={Icon.Play} 
              onAction={() => onResume(run.id)} 
              shortcut={{ modifiers: ["cmd"], key: "e" }}
            />
          )}
          {run.web_url && (
            <Action.OpenInBrowser 
              title="Open in Browser" 
              url={run.web_url} 
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
          )}
          {onClose && (
            <Action 
              title="Close" 
              icon={Icon.XmarkCircle} 
              onAction={onClose} 
              shortcut={{ modifiers: ["cmd"], key: "w" }}
            />
          )}
        </ActionPanel>
      }
    >
      {run.steps && run.steps.length > 0 && (
        <AgentRunStepList steps={run.steps} />
      )}
    </Detail>
  );
}
