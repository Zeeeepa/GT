import React, { useState, useEffect, useRef } from 'react';
import { CodegenRepository } from '../../../types';
import { getRepositoryApiService } from '../../../services/repositoryApiService';
import LoadingSpinner from '../../../shared/LoadingSpinner';

interface RepositorySelectorProps {
  onRepositorySelect: (repository: CodegenRepository) => void;
  initialSelectedId?: number;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({ 
  onRepositorySelect,
  initialSelectedId 
}) => {
  const [repositories, setRepositories] = useState<CodegenRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredRepositories, setFilteredRepositories] = useState<CodegenRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<CodegenRepository | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Load repositories
  useEffect(() => {
    async function loadRepositories() {
      setIsLoading(true);
      try {
        const repositoryService = getRepositoryApiService();
        const repos = await repositoryService.getRepositories();
        setRepositories(repos);
        setFilteredRepositories(repos);
        
        // Set initial selected repository if provided
        if (initialSelectedId) {
          const initialRepo = repos.find(repo => repo.id === initialSelectedId);
          if (initialRepo) {
            setSelectedRepository(initialRepo);
          }
        }
      } catch (error) {
        console.error('Error loading repositories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadRepositories();
  }, [initialSelectedId]);

  // Filter repositories based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredRepositories(repositories);
      return;
    }
    
    const filtered = repositories.filter(repo => 
      repo.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchText.toLowerCase()))
    );
    
    setFilteredRepositories(filtered);
  }, [searchText, repositories]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleRepositoryClick = (repository: CodegenRepository) => {
    setSelectedRepository(repository);
    setIsDropdownOpen(false);
    onRepositorySelect(repository);
  };

  return (
    <div className="repository-selector" ref={dropdownRef}>
      <input
        type="text"
        className="repository-search"
        placeholder="Search repositories..."
        value={searchText}
        onChange={handleSearchChange}
        onClick={() => setIsDropdownOpen(true)}
      />
      
      {selectedRepository && !isDropdownOpen && (
        <div className="selected-repository">
          {selectedRepository.name}
        </div>
      )}
      
      {isDropdownOpen && (
        <div className="repository-dropdown">
          {isLoading ? (
            <div className="repository-loading">
              <LoadingSpinner size="small" />
              <span>Loading repositories...</span>
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="repository-empty">
              No repositories found
            </div>
          ) : (
            filteredRepositories.map(repo => (
              <div
                key={repo.id}
                className={`repository-item ${selectedRepository?.id === repo.id ? 'selected' : ''}`}
                onClick={() => handleRepositoryClick(repo)}
              >
                <div className="repository-name">{repo.name}</div>
                {repo.description && (
                  <div className="repository-description">{repo.description}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RepositorySelector;
