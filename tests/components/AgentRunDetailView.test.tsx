import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentRunDetailView from '../../components/AgentRunDetailView';
import { resumeAgentRun } from '../../services/codegenApiService';

// Mock the API service
vi.mock('../../services/codegenApiService', () => ({
  resumeAgentRun: vi.fn(),
  getAgentRun: vi.fn().mockResolvedValue({
    id: 'test-run-id',
    status: 'completed',
    prompt: 'Fix the login component',
    createdAt: '2025-08-20T12:00:00Z',
    updatedAt: '2025-08-20T12:05:00Z'
  })
}));

describe('AgentRunDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders agent run details correctly', async () => {
    render(<AgentRunDetailView runId="test-run-id" />);
    
    // Check if the component renders the run details
    await waitFor(() => {
      expect(screen.getByText('Agent Run Details')).toBeInTheDocument();
      expect(screen.getByText('test-run-id')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('Fix the login component')).toBeInTheDocument();
    });
  });

  it('allows resuming an agent run', async () => {
    // Mock successful resume
    const mockResumeResponse = {
      id: 'resumed-run-id',
      status: 'running'
    };
    (resumeAgentRun as any).mockResolvedValue(mockResumeResponse);
    
    render(<AgentRunDetailView runId="test-run-id" />);
    
    // Click the resume button
    const resumeButton = await screen.findByText('Resume');
    fireEvent.click(resumeButton);
    
    // Fill in the prompt
    const promptInput = screen.getByLabelText('Prompt');
    fireEvent.change(promptInput, { target: { value: 'Continue with the task' } });
    
    // Submit the form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(resumeAgentRun).toHaveBeenCalledWith('test-run-id', {
        prompt: 'Continue with the task',
        additionalContext: ''
      });
    });
    
    // Check success message
    expect(await screen.findByText('Agent run resumed successfully!')).toBeInTheDocument();
  });

  it('handles errors when resuming an agent run', async () => {
    // Mock API error
    (resumeAgentRun as any).mockRejectedValue(new Error('Failed to resume agent run'));
    
    render(<AgentRunDetailView runId="test-run-id" />);
    
    // Click the resume button
    const resumeButton = await screen.findByText('Resume');
    fireEvent.click(resumeButton);
    
    // Fill in the prompt
    const promptInput = screen.getByLabelText('Prompt');
    fireEvent.change(promptInput, { target: { value: 'Continue with the task' } });
    
    // Submit the form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    // Check error message
    expect(await screen.findByText('Error: Failed to resume agent run')).toBeInTheDocument();
  });

  it('validates form input before submission', async () => {
    render(<AgentRunDetailView runId="test-run-id" />);
    
    // Click the resume button
    const resumeButton = await screen.findByText('Resume');
    fireEvent.click(resumeButton);
    
    // Submit without filling the form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    // Check validation error
    expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
    
    // Verify API was not called
    expect(resumeAgentRun).not.toHaveBeenCalled();
  });
});

