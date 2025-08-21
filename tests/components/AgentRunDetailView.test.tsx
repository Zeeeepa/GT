import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AgentRunDetailView from '../../components/agents/components/AgentRunDetailView';
import { AgentRunResponse, AgentRunStatus } from '../../types';
import { getAPIClient } from '../../services/codegenApiService';
import { showToast } from '../../utils/toast';
import { getBackgroundMonitoringService } from '../../utils/backgroundMonitoring';

// Mock dependencies
vi.mock('../../services/codegenApiService', () => ({
  getAPIClient: vi.fn(() => ({
    resumeAgentRun: vi.fn(),
  })),
}));

vi.mock('../../utils/toast', () => ({
  showToast: vi.fn(),
  ToastStyle: {
    Success: 'success',
    Failure: 'failure',
  },
}));

vi.mock('../../utils/backgroundMonitoring', () => ({
  getBackgroundMonitoringService: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()), // Return unsubscribe function
    MonitoringEventType: {
      RUN_UPDATED: 'RUN_UPDATED',
    },
  })),
  MonitoringEventType: {
    RUN_UPDATED: 'RUN_UPDATED',
  },
}));

describe('AgentRunDetailView', () => {
  const mockAgentRun: AgentRunResponse = {
    id: 123,
    status: AgentRunStatus.COMPLETED,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T01:00:00Z',
    repository: {
      id: 456,
      name: 'test-repo',
      owner: 'test-owner',
    },
    prompt: 'Test prompt',
    result: 'Test result',
    summary: 'Test summary',
    steps: [
      {
        id: 1,
        name: 'Step 1',
        content: 'Step 1 content',
        created_at: '2023-01-01T00:30:00Z',
      },
    ],
  };

  const mockOnClose = vi.fn();
  const mockOnResume = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders agent run details correctly', () => {
    render(
      <AgentRunDetailView
        agentRun={mockAgentRun}
        onClose={mockOnClose}
        onResume={mockOnResume}
      />
    );

    // Check if the component renders the run ID
    expect(screen.getByText(`Agent Run #${mockAgentRun.id}`)).toBeInTheDocument();

    // Check if summary is displayed
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();

    // Check if steps are displayed
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 1 content')).toBeInTheDocument();

    // Check if prompt is displayed
    expect(screen.getByText('Prompt')).toBeInTheDocument();
    expect(screen.getByText('Test prompt')).toBeInTheDocument();

    // Check if result is displayed
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('Test result')).toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', () => {
    render(
      <AgentRunDetailView
        agentRun={mockAgentRun}
        onClose={mockOnClose}
        onResume={mockOnResume}
      />
    );

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('successfully resumes an agent run', async () => {
    const mockResumedRun = { id: 456 };
    const mockResumeAgentRun = vi.fn().mockResolvedValue(mockResumedRun);
    
    (getAPIClient as any).mockReturnValue({
      resumeAgentRun: mockResumeAgentRun,
    });

    render(
      <AgentRunDetailView
        agentRun={mockAgentRun}
        onClose={mockOnClose}
        onResume={mockOnResume}
      />
    );

    const resumeButton = screen.getByText('Resume Run');
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(mockResumeAgentRun).toHaveBeenCalledWith(mockAgentRun.id);
      expect(showToast).toHaveBeenCalledWith({
        style: 'success',
        title: 'Run resumed',
        message: `New run created with ID: ${mockResumedRun.id}`,
      });
      expect(mockOnResume).toHaveBeenCalledWith(mockResumedRun.id);
    });
  });

  it('handles error when resuming an agent run fails', async () => {
    const mockError = new Error('Resume failed');
    const mockResumeAgentRun = vi.fn().mockRejectedValue(mockError);
    
    (getAPIClient as any).mockReturnValue({
      resumeAgentRun: mockResumeAgentRun,
    });

    render(
      <AgentRunDetailView
        agentRun={mockAgentRun}
        onClose={mockOnClose}
        onResume={mockOnResume}
      />
    );

    const resumeButton = screen.getByText('Resume Run');
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(mockResumeAgentRun).toHaveBeenCalledWith(mockAgentRun.id);
      expect(showToast).toHaveBeenCalledWith({
        style: 'failure',
        title: 'Failed to resume run',
        message: 'Resume failed',
      });
      expect(mockOnResume).not.toHaveBeenCalled();
    });
  });

  it('does not show resume button for running agent runs', () => {
    const runningAgentRun = {
      ...mockAgentRun,
      status: AgentRunStatus.RUNNING,
    };

    render(
      <AgentRunDetailView
        agentRun={runningAgentRun}
        onClose={mockOnClose}
        onResume={mockOnResume}
      />
    );

    expect(screen.queryByText('Resume Run')).not.toBeInTheDocument();
  });
});
