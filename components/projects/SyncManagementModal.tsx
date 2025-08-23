import React, { useState } from 'react';
import { ProjectRepository } from '../../types';
import { XIcon } from '../shared/icons/XIcon';
import { SearchIcon } from '../shared/icons/SearchIcon';

interface SyncManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: ProjectRepository[];
  syncSettings: Record<string, boolean>;
  onToggleSync: (repo: ProjectRepository) => void;
}

const SyncManagementModal: React.FC<SyncManagementModalProps> = ({
  isOpen,
  onClose,
  repositories,
  syncSettings,
  onToggleSync
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!isOpen) return null;
  
  const filteredRepos = repositories.filter(repo => 
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold text-text-primary">
            Sync Management
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-border-color">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-text-secondary" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-md bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRepos.length === 0 ? (
            <div className="text-text-secondary text-center py-8">
              No repositories found matching "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map(repo => (
                <div 
                  key={repo.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-hover"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {repo.full_name}
                    </p>
                    {repo.description && (
                      <p className="text-xs text-text-secondary truncate">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!syncSettings[repo.full_name]}
                        onChange={() => onToggleSync(repo)}
                      />
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${
                        syncSettings[repo.full_name] ? 'bg-accent' : 'bg-border-color'
                      }`}>
                        <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          syncSettings[repo.full_name] ? 'transform translate-x-5' : ''
                        }`}></div>
                      </div>
                      <span className="ml-2 text-sm text-text-secondary">
                        {syncSettings[repo.full_name] ? 'Sync enabled' : 'Sync disabled'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border-color flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-hover text-text-primary rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncManagementModal;

