import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RepositorySelector from '../../components/RepositorySelector';
import { getRepositories } from '../../services/githubService';

// Mock the GitHub service
vi.mock('../../services/githubService', () => ({
  getRepositories: vi.fn()
}));

describe('RepositorySelector', () => {
  const mockRepositories = [
    { id: 1, name: 'repo1', full_name: 'org/repo1', description: 'Repository 1' },
    { id: 2, name: 'repo2', full_name: 'org/repo2', description: 'Repository 2' },
    { id: 3, name: 'repo3', full_name: 'org/repo3', description: 'Repository 3' }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getRepositories as any).mockResolvedValue(mockRepositories);
  });

  it('loads and displays repositories', async () => {
    render(<RepositorySelector onSelect={vi.fn()} />);
    
    // Check loading state
    expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
    
    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText('org/repo1')).toBeInTheDocument();
      expect(screen.getByText('org/repo2')).toBeInTheDocument();
      expect(screen.getByText('org/repo3')).toBeInTheDocument();
    });
    
    // Verify API was called
    expect(getRepositories).toHaveBeenCalledTimes(1);
  });

  it('allows searching repositories', async () => {
    render(<RepositorySelector onSelect={vi.fn()} />);
    
    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText('org/repo1')).toBeInTheDocument();
    });
    
    // Search for a repository
    const searchInput = screen.getByPlaceholderText('Search repositories');
    fireEvent.change(searchInput, { target: { value: 'repo2' } });
    
    // Check filtered results
    expect(screen.queryByText('org/repo1')).not.toBeInTheDocument();
    expect(screen.getByText('org/repo2')).toBeInTheDocument();
    expect(screen.queryByText('org/repo3')).not.toBeInTheDocument();
  });

  it('calls onSelect when a repository is selected', async () => {
    const mockOnSelect = vi.fn();
    render(<RepositorySelector onSelect={mockOnSelect} />);
    
    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText('org/repo1')).toBeInTheDocument();
    });
    
    // Select a repository
    fireEvent.click(screen.getByText('org/repo1'));
    
    // Verify onSelect was called with the correct repository
    expect(mockOnSelect).toHaveBeenCalledWith(mockRepositories[0]);
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (getRepositories as any).mockRejectedValue(new Error('Failed to load repositories'));
    
    render(<RepositorySelector onSelect={vi.fn()} />);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load repositories')).toBeInTheDocument();
    });
  });
});

