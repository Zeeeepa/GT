import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProjectRepository, AgentRun, AgentRunStatus } from '../../types';
import { useAgentRuns } from '../../hooks/codegen_api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ProjectCard from '../projects/ProjectCard';
import { RunCard } from './RunCard';

interface DashboardViewProps {
  onViewAgentRun?: (agentRunId: number) => void;
  onViewAgentLogs?: (agentRunId: number) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  onViewAgentRun, 
  onViewAgentLogs 
}) => {
  const [pinnedProjects, setPinnedProjects] = useLocalStorage<ProjectRepository[]>('pinnedProjects', []);
  const [pinnedRunIds, setPinnedRunIds] = useLocalStorage<number[]>('pinnedAgentRunIds', []);
  const [projectRunAssociations, setProjectRunAssociations] = useLocalStorage<Record<string, number[]>>('projectRunAssociations', {});
  
  const { data: agentRuns, loading: runsLoading } = useAgentRuns({ limit: 50 });
  const [pinnedRuns, setPinnedRuns] = useState<AgentRun[]>([]);

  // Load pinned runs when agent runs data is available
  useEffect(() => {
    if (agentRuns?.items && pinnedRunIds.length > 0) {
      const runs = agentRuns.items.filter(run => pinnedRunIds.includes(run.id));
      setPinnedRuns(runs);
    } else {
      setPinnedRuns([]);
    }
  }, [agentRuns, pinnedRunIds]);

  const handleToggleRunPin = (run: AgentRun) => {
    setPinnedRunIds(prev => 
      prev.includes(run.id) 
        ? prev.filter(id => id !== run.id) 
        : [...prev, run.id]
    );
  };

  const handleRemoveProject = (project: ProjectRepository) => {
    setPinnedProjects(prev => prev.filter(p => p.id !== project.id));
    
    // Also clean up any associations
    setProjectRunAssociations(prev => {
      const newAssociations = { ...prev };
      delete newAssociations[project.full_name];
      return newAssociations;
    });
  };

  const handleAssociateRunWithProject = (run: AgentRun, project: ProjectRepository) => {
    setProjectRunAssociations(prev => {
      const projectRuns = prev[project.full_name] || [];
      if (!projectRuns.includes(run.id)) {
        return {
          ...prev,
          [project.full_name]: [...projectRuns, run.id]
        };
      }
      return prev;
    });
  };

  const handleRemoveRunFromProject = (runId: number, projectFullName: string) => {
    setProjectRunAssociations(prev => {
      const projectRuns = prev[projectFullName] || [];
      return {
        ...prev,
        [projectFullName]: projectRuns.filter(id => id !== runId)
      };
    });
  };

  // Get runs associated with a project
  const getProjectRuns = (projectFullName: string): AgentRun[] => {
    const runIds = projectRunAssociations[projectFullName] || [];
    return pinnedRuns.filter(run => runIds.includes(run.id));
  };

  // Count active agent runs
  const activeRunsCount = agentRuns?.items?.filter(run => run.status === AgentRunStatus.RUNNING).length || 0;

  if (runsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Pinned Projects Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pinned Projects</h2>
          {pinnedProjects.length === 0 ? (
            <div className="bg-secondary rounded-lg p-6 text-center">
              <p className="text-text-secondary">No pinned projects yet. Pin projects from the Projects tab to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pinnedProjects.map(project => (
                <div key={project.id} className="flex flex-col">
                  <ProjectCard 
                    repo={project}
                    allLists={[]}
                    repoListMembership={[]}
                    onDelete={() => {}}
                    onAddToList={() => {}}
                    onRemoveFromList={() => {}}
                    isPinned={true}
                    onTogglePin={() => handleRemoveProject(project)}
                  />
                  
                  {/* Associated Runs */}
                  <div className="mt-2">
                    {getProjectRuns(project.full_name).map(run => (
                      <div key={run.id} className="bg-secondary rounded-lg p-2 mb-2 text-sm flex justify-between items-center">
                        <span>Run #{run.id}</span>
                        <button 
                          onClick={() => handleRemoveRunFromProject(run.id, project.full_name)}
                          className="text-text-secondary hover:text-danger"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pinned Agent Runs Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pinned Agent Runs</h2>
          {pinnedRuns.length === 0 ? (
            <div className="bg-secondary rounded-lg p-6 text-center">
              <p className="text-text-secondary">No pinned agent runs yet. Pin runs from the Agents tab to see them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedRuns.map(run => (
                <RunCard
                  key={run.id}
                  run={run}
                  onView={() => onViewAgentRun?.(run.id)}
                  onViewLogs={() => onViewAgentLogs?.(run.id)}
                  isStarred={true}
                  onToggleStar={() => handleToggleRunPin(run)}
                  pinnedProjects={pinnedProjects}
                  onAssociateWithProject={handleAssociateRunWithProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

