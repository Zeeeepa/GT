import React, { useState, useEffect } from 'react';
import { ProjectRepository, AgentRun } from '../../types';
import { getAgentRunCache } from '../../storage/agentRunCache';
import { getDefaultOrganizationId } from '../../utils/credentials';
import { showToast, ToastStyle } from '../../utils/toast';
import LoadingSpinner from '../shared/LoadingSpinner';
import { PlusIcon, XIcon, PinIcon } from 'lucide-react';
import { LocalStorage } from '../../utils/storage';

interface DashboardProps {
  projects: ProjectRepository[];
}

interface PinnedProject {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
}

interface PinnedAgentRun {
  id: number;
  prompt: string;
  created_at: string;
  status: string;
  projectId?: number; // Optional project association
}

const STORAGE_KEYS = {
  PINNED_PROJECTS: 'dashboard-pinned-projects',
  PINNED_AGENT_RUNS: 'dashboard-pinned-agent-runs',
};

export const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  const [pinnedProjects, setPinnedProjects] = useState<PinnedProject[]>([]);
  const [pinnedAgentRuns, setPinnedAgentRuns] = useState<PinnedAgentRun[]>([]);
  const [recentAgentRuns, setRecentAgentRuns] = useState<AgentRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  // Load pinned items from local storage
  useEffect(() => {
    const loadPinnedItems = async () => {
      try {
        const pinnedProjectsJson = await LocalStorage.getItem<string>(STORAGE_KEYS.PINNED_PROJECTS);
        const pinnedAgentRunsJson = await LocalStorage.getItem<string>(STORAGE_KEYS.PINNED_AGENT_RUNS);
        
        if (pinnedProjectsJson) {
          setPinnedProjects(JSON.parse(pinnedProjectsJson));
        }
        
        if (pinnedAgentRunsJson) {
          setPinnedAgentRuns(JSON.parse(pinnedAgentRunsJson));
        }
      } catch (error) {
        console.error('Error loading pinned items:', error);
      }
    };
    
    loadPinnedItems();
  }, []);

  // Load recent agent runs
  useEffect(() => {
    const loadAgentRuns = async () => {
      try {
        const defaultOrgId = await getDefaultOrganizationId();
        setOrganizationId(defaultOrgId);
        
        if (defaultOrgId) {
          const cache = getAgentRunCache();
          const runs = await cache.getAgentRuns(defaultOrgId);
          setRecentAgentRuns(runs.slice(0, 10)); // Get 10 most recent runs
        }
      } catch (error) {
        console.error('Error loading agent runs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgentRuns();
  }, []);

  // Save pinned projects to local storage
  const savePinnedProjects = async (projects: PinnedProject[]) => {
    try {
      await LocalStorage.setItem(STORAGE_KEYS.PINNED_PROJECTS, JSON.stringify(projects));
      setPinnedProjects(projects);
    } catch (error) {
      console.error('Error saving pinned projects:', error);
      showToast({ style: ToastStyle.Error, title: 'Error', message: 'Failed to save pinned projects' });
    }
  };

  // Save pinned agent runs to local storage
  const savePinnedAgentRuns = async (runs: PinnedAgentRun[]) => {
    try {
      await LocalStorage.setItem(STORAGE_KEYS.PINNED_AGENT_RUNS, JSON.stringify(runs));
      setPinnedAgentRuns(runs);
    } catch (error) {
      console.error('Error saving pinned agent runs:', error);
      showToast({ style: ToastStyle.Error, title: 'Error', message: 'Failed to save pinned agent runs' });
    }
  };

  // Pin a project
  const pinProject = (project: ProjectRepository) => {
    const pinnedProject = {
      id: project.id,
      name: project.name,
      full_name: project.full_name,
      html_url: project.html_url,
    };
    
    // Check if project is already pinned
    if (!pinnedProjects.some(p => p.id === project.id)) {
      const updatedPinnedProjects = [...pinnedProjects, pinnedProject];
      savePinnedProjects(updatedPinnedProjects);
      showToast({ style: ToastStyle.Success, title: 'Success', message: `Pinned project: ${project.name}` });
    }
  };

  // Unpin a project
  const unpinProject = (projectId: number) => {
    const updatedPinnedProjects = pinnedProjects.filter(p => p.id !== projectId);
    savePinnedProjects(updatedPinnedProjects);
    showToast({ style: ToastStyle.Success, title: 'Success', message: 'Project unpinned' });
  };

  // Pin an agent run
  const pinAgentRun = (run: AgentRun, projectId?: number) => {
    const pinnedRun = {
      id: run.id,
      prompt: run.prompt || 'No prompt',
      created_at: run.created_at,
      status: run.status || 'unknown',
      projectId,
    };
    
    // Check if run is already pinned
    if (!pinnedAgentRuns.some(r => r.id === run.id)) {
      const updatedPinnedRuns = [...pinnedAgentRuns, pinnedRun];
      savePinnedAgentRuns(updatedPinnedRuns);
      showToast({ style: ToastStyle.Success, title: 'Success', message: `Pinned agent run #${run.id}` });
    }
  };

  // Unpin an agent run
  const unpinAgentRun = (runId: number) => {
    const updatedPinnedRuns = pinnedAgentRuns.filter(r => r.id !== runId);
    savePinnedAgentRuns(updatedPinnedRuns);
    showToast({ style: ToastStyle.Success, title: 'Success', message: 'Agent run unpinned' });
  };

  // Associate an agent run with a project
  const associateRunWithProject = (runId: number, projectId: number) => {
    const updatedPinnedRuns = pinnedAgentRuns.map(run => {
      if (run.id === runId) {
        return { ...run, projectId };
      }
      return run;
    });
    
    savePinnedAgentRuns(updatedPinnedRuns);
    showToast({ style: ToastStyle.Success, title: 'Success', message: 'Agent run associated with project' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Pinned Projects Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pinned Projects</h2>
          <div className="relative">
            <select 
              className="bg-secondary border border-border-color rounded-md px-3 py-2 text-sm"
              onChange={(e) => {
                const projectId = parseInt(e.target.value);
                if (projectId) {
                  const project = projects.find(p => p.id === projectId);
                  if (project) pinProject(project);
                }
                e.target.value = ''; // Reset select
              }}
            >
              <option value="">Add Project...</option>
              {projects
                .filter(p => !pinnedProjects.some(pp => pp.id === p.id))
                .map(project => (
                  <option key={project.id} value={project.id}>
                    {project.full_name}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
        
        {pinnedProjects.length === 0 ? (
          <div className="bg-secondary border border-border-color rounded-lg p-6 text-center">
            <p className="text-text-secondary">No pinned projects yet. Select a project to pin it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedProjects.map(project => (
              <div key={project.id} className="bg-secondary border border-border-color rounded-lg p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <button 
                    onClick={() => unpinProject(project.id)}
                    className="text-text-secondary hover:text-danger"
                    title="Unpin project"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <p className="text-sm text-text-secondary mb-3 truncate">{project.full_name}</p>
                <div className="mt-auto flex gap-2">
                  <a 
                    href={project.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-primary hover:bg-tertiary border border-border-color rounded px-2 py-1"
                  >
                    View on GitHub
                  </a>
                  <a 
                    href={`/projects/${project.id}`}
                    className="text-xs bg-primary hover:bg-tertiary border border-border-color rounded px-2 py-1"
                  >
                    Open Project
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pinned Agent Runs Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pinned Agent Runs</h2>
        </div>
        
        {pinnedAgentRuns.length === 0 ? (
          <div className="bg-secondary border border-border-color rounded-lg p-6 text-center">
            <p className="text-text-secondary">No pinned agent runs yet. Pin runs from the Agent Runs tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedAgentRuns.map(run => (
              <div key={run.id} className="bg-secondary border border-border-color rounded-lg p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Run #{run.id}</h3>
                  <button 
                    onClick={() => unpinAgentRun(run.id)}
                    className="text-text-secondary hover:text-danger"
                    title="Unpin agent run"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <p className="text-sm text-text-secondary mb-1">
                  Status: <span className={`font-medium ${run.status === 'completed' ? 'text-green-400' : run.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                    {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                  </span>
                </p>
                <p className="text-sm text-text-secondary mb-3">
                  {new Date(run.created_at).toLocaleString()}
                </p>
                <p className="text-sm mb-3 line-clamp-2">{run.prompt}</p>
                
                {run.projectId ? (
                  <div className="mt-auto">
                    <p className="text-xs text-text-secondary mb-2">
                      Associated with: {pinnedProjects.find(p => p.id === run.projectId)?.name || 'Unknown Project'}
                    </p>
                    <button
                      onClick={() => associateRunWithProject(run.id, 0)} // 0 means no project
                      className="text-xs bg-primary hover:bg-tertiary border border-border-color rounded px-2 py-1"
                    >
                      Remove Association
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto">
                    <p className="text-xs text-text-secondary mb-2">Associate with project:</p>
                    <select 
                      className="w-full bg-primary border border-border-color rounded-md px-2 py-1 text-sm"
                      onChange={(e) => {
                        const projectId = parseInt(e.target.value);
                        if (projectId) {
                          associateRunWithProject(run.id, projectId);
                        }
                        e.target.value = ''; // Reset select
                      }}
                    >
                      <option value="">Select a project...</option>
                      {pinnedProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Agent Runs Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Agent Runs</h2>
        </div>
        
        {recentAgentRuns.length === 0 ? (
          <div className="bg-secondary border border-border-color rounded-lg p-6 text-center">
            <p className="text-text-secondary">No recent agent runs found.</p>
          </div>
        ) : (
          <div className="bg-secondary border border-border-color rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-color">
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Prompt</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAgentRuns.map(run => (
                  <tr key={run.id} className="border-b border-border-color hover:bg-tertiary">
                    <td className="px-4 py-3 text-sm">{run.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate">{run.prompt || 'No prompt'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        run.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        run.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {run.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {!pinnedAgentRuns.some(r => r.id === run.id) && (
                        <button
                          onClick={() => pinAgentRun(run)}
                          className="text-text-secondary hover:text-text-primary"
                          title="Pin agent run"
                        >
                          <PinIcon size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
