import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RepositorySelector from '../../components/agents/components/RepositorySelector';
import { getRepositoryApiService } from '../../services/repositoryApiService';
import { CodegenRepository } from '../../types';

// Mock dependencies
vi.mock('../../services/repositoryApiService', () => ({
  getRepositoryApiService: vi.fn(),
}));

describe('RepositorySelector', () => {
  const mockRepositories: CodegenRepository[] = [
    {
      id: 1,
      name: 'repo-one',
      description: 'First repository',
      owner: 'owner-one',
    },
    {
      id: 2,
      name: 'repo-two',
      description: 'Second repository',
      owner: 'owner-two',
    },
    {
      id: 3,
      name: 'another-repo',
      description: 'Another repository',
      owner: 'owner-three',
    },
  ];

  const mockGetRepositories = vi.fn().mockResolvedValue(mockRepositories);
  const mockOnRepositorySelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getRepositoryApiService as any).mockReturnValue({
      getRepositories: mockGetRepositories,
    });
  });

  it('renders the repository selector with loading state', () => {
    // Don't resolve the promise yet to keep it in loading state
    const mockGetRepositoriesLoading = vi.fn().mockReturnValue(new Promise(() => {}));
    (getRepositoryApiService as any).mockReturnValue({
      getRepositories: mockGetRepositoriesLoading,
    });

    render(
      <RepositorySelector
        onRepositorySelect={mockOnRepositorySelect}
      />
    );

    // Click to open dropdown
    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.click(searchInput);

    // Check if loading state is displayed
    expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
  });

  it('loads and displays repositories', async () => {
    render(
      <RepositorySelector
        onRepositorySelect={mockOnRepositorySelect}
      />
    );

    // Click to open dropdown
    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.click(searchInput);

    // Wait for repositories to load
    await waitFor(() => {
      expect(mockGetRepositories).toHaveBeenCalled();
      expect(screen.getByText('repo-one')).toBeInTheDocument();
      expect(screen.getByText('repo-two')).toBeInTheDocument();
      expect(screen.getByText('another-repo')).toBeInTheDocument();
    });
  });

  it('filters repositories based on search text', async () => {
    render(
      <RepositorySelector
        onRepositorySelect={mockOnRepositorySelect}
      />
    );

    // Click to open dropdown
    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.click(searchInput);

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText('repo-one')).toBeInTheDocument();
    });

    // Type in search box
    fireEvent.change(searchInput, { target: { value: 'another' } });

    // Check if only matching repositories are displayed
    expect(screen.getByText('another-repo')).toBeInTheDocument();
    expect(screen.queryByText('repo-one')).not.toBeInTheDocument();
    expect(screen.queryByText('repo-two')).not.toBeInTheDocument();
  });

  it('selects a repository when clicked', async () => {
    render(
      <RepositorySelector
        onRepositorySelect={mockOnRepositorySelect}
      />
    );

    // Click to open dropdown
    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.click(searchInput);

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText('repo-one')).toBeInTheDocument();
    });

    // Click on a repository
    fireEvent.click(screen.getByText('repo-one'));

    // Check if onRepositorySelect was called with the correct repository
    expect(mockOnRepositorySelect).toHaveBeenCalledWith(mockRepositories[0]);
    
    // Check if the selected repository is displayed
    expect(screen.getByText('repo-one')).toBeInTheDocument();
  });

  it('initializes with a selected repository if initialSelectedId is provided', async () => {
    render(
      <RepositorySelector
        onRepositorySelect={mockOnRepositorySelect}
        initialSelectedId={2}
      />
    );

    // Wait for repositories to load and initial selection to be set
    await waitFor(() => {
      expect(mockGetRepositories).toHaveBeenCalled();
    });

    // Click to open dropdown to see if the correct repository is selected
    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.click(searchInput);

    await waitFor(() => {
      const repoItems = screen.getAllByText(/repo-/);
      expect(repoItems.length).toBeGreaterThan(0);
    });

    // Close dropdown
    fireEvent.click(document.body);

    // Check if the selected repository is displayed
    expect(screen.getByText('repo-two')).toBeInTheDocument();
  });

  it('shows "No repositories found" when search has no results', async () => {
    render(
      <RepositorySelector
        onRepositorySelect={mockOnRepositorySelect}
      />
    );

    // Click to open dropdown
    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.click(searchInput);

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText('repo-one')).toBeInTheDocument();
    });

    // Type in search box with a query that won't match any repositories
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    // Check if "No repositories found" message is displayed
    expect(screen.getByText('No repositories found')).toBeInTheDocument();
  });
});
