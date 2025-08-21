import React, { useState, useEffect } from 'react';
import { getRepositories } from '../services/githubService';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
}

interface RepositorySelectorProps {
  onSelect: (repository: Repository) => void;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({ onSelect }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        const data = await getRepositories();
        setRepositories(data);
        setFilteredRepositories(data);
        setError(null);
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepositories(repositories);
    } else {
      const filtered = repositories.filter(repo => 
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRepositories(filtered);
    }
  }, [searchTerm, repositories]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRepositoryClick = (repository: Repository) => {
    onSelect(repository);
  };

  if (loading) {
    return <div>Loading repositories...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="repository-selector">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search repositories"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      
      <div className="repositories-list">
        {filteredRepositories.length === 0 ? (
          <div className="no-results">No repositories found</div>
        ) : (
          filteredRepositories.map(repo => (
            <div 
              key={repo.id} 
              className="repository-item"
              onClick={() => handleRepositoryClick(repo)}
            >
              <div className="repository-name">{repo.full_name}</div>
              {repo.description && (
                <div className="repository-description">{repo.description}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepositorySelector;

