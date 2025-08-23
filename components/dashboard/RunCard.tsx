import React, { useState } from 'react';
import { AgentRun, AgentRunStatus, ProjectRepository } from '../../types';
import { ChevronRightIcon } from '../shared/icons/ChevronRightIcon';
import { DotsVerticalIcon } from '../shared/icons/DotsVerticalIcon';

interface RunCardProps {
  run: AgentRun;
  onView: () => void;
  onViewLogs: () => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
  pinnedProjects?: ProjectRepository[];
  onAssociateWithProject?: (run: AgentRun, project: ProjectRepository) => void;
}

export const RunCard: React.FC<RunCardProps> = ({ 
  run, 
  onView, 
  onViewLogs, 
  isStarred, 
  onToggleStar,
  pinnedProjects,
  onAssociateWithProject
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const getStatusColor = (status: AgentRunStatus) => {
    switch (status) {
      case AgentRunStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case AgentRunStatus.RUNNING:
        return 'bg-yellow-100 text-yellow-800';
      case AgentRunStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case AgentRunStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case AgentRunStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case AgentRunStatus.PAUSED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-hover rounded-lg hover:bg-border-color transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              Run #{run.id}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {new Date(run.created_at).toLocaleDateString()} at{' '}
              {new Date(run.created_at).toLocaleTimeString()}
            </p>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
            {run.status}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        {pinnedProjects && pinnedProjects.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="text-text-secondary hover:text-text-primary"
              aria-label="Associate with project"
            >
              <DotsVerticalIcon className="w-4 h-4" />
            </button>
            
            {showProjectMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-primary rounded-md shadow-lg z-10 border border-border-color">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-text-secondary border-b border-border-color">
                    Pin to Project
                  </div>
                  {pinnedProjects.map(project => (
                    <button
                      key={project.id}
                      className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-hover"
                      onClick={() => {
                        onAssociateWithProject?.(run, project);
                        setShowProjectMenu(false);
                      }}
                    >
                      {project.full_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={onToggleStar}
          className={`text-xs font-medium ${isStarred ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
          aria-label={isStarred ? 'Unstar run' : 'Star run'}
        >
          {isStarred ? '★' : '☆'}
        </button>
        <button
          onClick={onViewLogs}
          className="text-xs text-accent hover:text-accent-hover font-medium"
        >
          Logs
        </button>
        <button
          onClick={onView}
          className="text-text-secondary hover:text-text-primary"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

