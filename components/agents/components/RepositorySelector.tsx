import React, { useState, useEffect } from 'react';
import { List, ActionPanel, Action, Icon } from '@raycast/api';
import { CodegenRepository } from '../../../types';
import { getRepositoryApiService } from '../../../services/repositoryApiService';

interface RepositorySelectorProps {
  organizationId: string;
  onSelect: (repository: CodegenRepository) => void;
  onCancel?: () => void;
  initialSelectedId?: number;
}

export function RepositorySelector({ 
  organizationId, 
  onSelect, 
  onCancel,
  initialSelectedId 
}: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<CodegenRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredRepositories, setFilteredRepositories] = useState<CodegenRepository[]>([]);
  
  const repositoryService = getRepositoryApiService();

  // Load repositories
  useEffect(() => {
    async function loadRepositories() {
      setIsLoading(true);
      try {
        const repos = await repositoryService.getRepositories(organizationId);
        setRepositories(repos);
        setFilteredRepositories(repos);
      } catch (error) {
        console.error("Error loading repositories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadRepositories();
  }, [organizationId]);

  // Filter repositories based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredRepositories(repositories);
      return;
    }
    
    const normalizedSearchText = searchText.toLowerCase();
    const filtered = repositories.filter(repo => 
      repo.name.toLowerCase().includes(normalizedSearchText) || 
      (repo.description && repo.description.toLowerCase().includes(normalizedSearchText))
    );
    
    setFilteredRepositories(filtered);
  }, [searchText, repositories]);

  // Refresh repositories
  const refreshRepositories = async () => {
    setIsLoading(true);
    try {
      const repos = await repositoryService.refreshRepositories(organizationId);
      setRepositories(repos);
      setFilteredRepositories(repos);
    } catch (error) {
      console.error("Error refreshing repositories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search repositories..."
      throttle
    >
      {filteredRepositories.map(repo => (
        <List.Item
          key={repo.id}
          id={repo.id.toString()}
          title={repo.name}
          subtitle={repo.description || ''}
          icon={
            repo.id === initialSelectedId 
              ? { source: Icon.CheckCircle, tintColor: Icon.Color.Green } 
              : Icon.Code
          }
          accessories={[
            { text: repo.language || '' },
            { text: repo.visibility || '' }
          ]}
          actions={
            <ActionPanel>
              <Action 
                title="Select Repository" 
                onAction={() => onSelect(repo)} 
                icon={Icon.CheckCircle}
              />
              <Action 
                title="Refresh Repositories" 
                onAction={refreshRepositories} 
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
              {onCancel && (
                <Action 
                  title="Cancel" 
                  onAction={onCancel} 
                  icon={Icon.XmarkCircle}
                  shortcut={{ modifiers: ["cmd"], key: "escape" }}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
      {filteredRepositories.length === 0 && !isLoading && (
        <List.EmptyView
          title="No repositories found"
          description={searchText ? `No repositories matching "${searchText}"` : "No repositories available"}
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action 
                title="Refresh Repositories" 
                onAction={refreshRepositories} 
                icon={Icon.ArrowClockwise}
              />
              {onCancel && (
                <Action 
                  title="Cancel" 
                  onAction={onCancel} 
                  icon={Icon.XmarkCircle}
                />
              )}
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
