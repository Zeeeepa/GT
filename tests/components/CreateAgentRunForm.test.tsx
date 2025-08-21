import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAgentRunForm from '../../components/CreateAgentRunForm';
import { createAgentRun } from '../../services/codegenApiService';

// Mock the API service
vi.mock('../../services/codegenApiService', () => ({
  createAgentRun: vi.fn()
}));

describe('CreateAgentRunForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<CreateAgentRunForm onSuccess={vi.fn()} />);
    
    // Check if form elements are rendered
    expect(screen.getByText('Create Agent Run')).toBeInTheDocument();
    expect(screen.getByLabelText('Repository')).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('validates form input before submission', async () => {
    render(<CreateAgentRunForm onSuccess={vi.fn()} />);
    
    // Submit without filling the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Check validation errors
    expect(await screen.findByText('Repository is required')).toBeInTheDocument();
    expect(await screen.findByText('Prompt is required')).toBeInTheDocument();
    
    // Verify API was not called
    expect(createAgentRun).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    // Mock successful API response
    const mockResponse = { id: 'new-run-id', status: 'running' };
    (createAgentRun as any).mockResolvedValue(mockResponse);
    
    const mockOnSuccess = vi.fn();
    render(<CreateAgentRunForm onSuccess={mockOnSuccess} />);
    
    // Select a repository
    const repositoryInput = screen.getByLabelText('Repository');
    fireEvent.change(repositoryInput, { target: { value: 'org/repo1' } });
    
    // Fill in the prompt
    const promptInput = screen.getByLabelText('Prompt');
    fireEvent.change(promptInput, { target: { value: 'Fix the login component' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(createAgentRun).toHaveBeenCalledWith({
        repository: 'org/repo1',
        prompt: 'Fix the login component'
      });
    });
    
    // Verify onSuccess callback was called
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (createAgentRun as any).mockRejectedValue(new Error('Failed to create agent run'));
    
    render(<CreateAgentRunForm onSuccess={vi.fn()} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Repository'), { target: { value: 'org/repo1' } });
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'Fix the login component' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Check error message
    expect(await screen.findByText('Error: Failed to create agent run')).toBeInTheDocument();
  });
});

