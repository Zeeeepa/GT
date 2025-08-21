import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateAgentRunForm from '../../components/agents/components/CreateAgentRunForm';
import { getAPIClient } from '../../services/codegenApiService';
import { getRepositoryApiService } from '../../services/repositoryApiService';
import { showToast } from '../../utils/toast';
import { CodegenRepository } from '../../types';

// Mock dependencies
vi.mock('../../services/codegenApiService', () => ({
  getAPIClient: vi.fn(),
}));

vi.mock('../../services/repositoryApiService', () => ({
  getRepositoryApiService: vi.fn(),
}));

vi.mock('../../utils/toast', () => ({
  showToast: vi.fn(),
  ToastStyle: {
    Success: 'success',
    Failure: 'failure',
  },
}));

// Mock RepositorySelector component
vi.mock('../../components/agents/components/RepositorySelector', () => ({
  default: ({ onRepositorySelect }: { onRepositorySelect: (repo: CodegenRepository) => void }) => {
    return (
      <div data-testid="repository-selector">
        <button 
          data-testid="select-repository-button"
          onClick={() => onRepositorySelect({
            id: 123,
            name: 'test-repo',
            owner: 'test-owner',
          })}
        >
          Select Repository
        </button>
      </div>
    );
  },
}));

describe('CreateAgentRunForm', () => {
  const mockOnRunCreated = vi.fn();
  const mockOnCancel = vi.fn();
  const mockCreateAgentRun = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getAPIClient as any).mockReturnValue({
      createAgentRun: mockCreateAgentRun,
    });
  });

  it('renders the form correctly', () => {
    render(
      <CreateAgentRunForm
        onRunCreated={mockOnRunCreated}
        onCancel={mockOnCancel}
      />
    );

    // Check if form elements are rendered
    expect(screen.getByText('Create New Agent Run')).toBeInTheDocument();
    expect(screen.getByText('Repository')).toBeInTheDocument();
    expect(screen.getByText('Prompt')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your prompt for the agent...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Agent Run')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <CreateAgentRunForm
        onRunCreated={mockOnRunCreated}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows error toast when submitting without selecting a repository', async () => {
    render(
      <CreateAgentRunForm
        onRunCreated={mockOnRunCreated}
        onCancel={mockOnCancel}
      />
    );

    // Enter prompt but don't select repository
    const promptInput = screen.getByPlaceholderText('Enter your prompt for the agent...');
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    // Submit form
    const submitButton = screen.getByText('Create Agent Run');
    fireEvent.click(submitButton);

    // Check if error toast is shown
    expect(showToast).toHaveBeenCalledWith({
      style: 'failure',
      title: 'Repository required',
      message: 'Please select a repository for the agent run',
    });
  });

  it('shows error toast when submitting without entering a prompt', async () => {
    render(
      <CreateAgentRunForm
        onRunCreated={mockOnRunCreated}
        onCancel={mockOnCancel}
      />
    );

    // Select repository but don't enter prompt
    const selectRepoButton = screen.getByTestId('select-repository-button');
    fireEvent.click(selectRepoButton);

    // Submit form
    const submitButton = screen.getByText('Create Agent Run');
    fireEvent.click(submitButton);

    // Check if error toast is shown
    expect(showToast).toHaveBeenCalledWith({
      style: 'failure',
      title: 'Prompt required',
      message: 'Please enter a prompt for the agent run',
    });
  });

  it('successfully creates an agent run', async () => {
    const mockNewRun = { id: 456 };
    mockCreateAgentRun.mockResolvedValue(mockNewRun);

    render(
      <CreateAgentRunForm
        onRunCreated={mockOnRunCreated}
        onCancel={mockOnCancel}
      />
    );

    // Select repository
    const selectRepoButton = screen.getByTestId('select-repository-button');
    fireEvent.click(selectRepoButton);

    // Enter prompt
    const promptInput = screen.getByPlaceholderText('Enter your prompt for the agent...');
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    // Submit form
    const submitButton = screen.getByText('Create Agent Run');
    fireEvent.click(submitButton);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockCreateAgentRun).toHaveBeenCalledWith({
        repository_id: 123,
        prompt: 'Test prompt',
      });
      expect(showToast).toHaveBeenCalledWith({
        style: 'success',
        title: 'Agent run created',
        message: `New run created with ID: ${mockNewRun.id}`,
      });
      expect(mockOnRunCreated).toHaveBeenCalledWith(mockNewRun.id);
    });
  });

  it('handles API error when creating an agent run', async () => {
    const mockError = new Error('API error');
    mockCreateAgentRun.mockRejectedValue(mockError);

    render(
      <CreateAgentRunForm
        onRunCreated={mockOnRunCreated}
        onCancel={mockOnCancel}
      />
    );

    // Select repository
    const selectRepoButton = screen.getByTestId('select-repository-button');
    fireEvent.click(selectRepoButton);

    // Enter prompt
    const promptInput = screen.getByPlaceholderText('Enter your prompt for the agent...');
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    // Submit form
    const submitButton = screen.getByText('Create Agent Run');
    fireEvent.click(submitButton);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockCreateAgentRun).toHaveBeenCalledWith({
        repository_id: 123,
        prompt: 'Test prompt',
      });
      expect(showToast).toHaveBeenCalledWith({
        style: 'failure',
        title: 'Failed to create agent run',
        message: 'API error',
      });
      expect(mockOnRunCreated).not.toHaveBeenCalled();
    });
  });
});
