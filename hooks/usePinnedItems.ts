import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ProjectRepository, AgentRun } from '../types';

export interface PinnedItemsState {
  pinnedProjects: ProjectRepository[];
  pinnedRunIds: number[];
  projectRunAssociations: Record<string, number[]>;
}

export function usePinnedItems() {
  const [pinnedProjects, setPinnedProjects] = useLocalStorage<ProjectRepository[]>('pinnedProjects', []);
  const [pinnedRunIds, setPinnedRunIds] = useLocalStorage<number[]>('pinnedAgentRunIds', []);
  const [projectRunAssociations, setProjectRunAssociations] = useLocalStorage<Record<string, number[]>>('projectRunAssociations', {});

  // Toggle project pin status
  const toggleProjectPin = (project: ProjectRepository) => {
    setPinnedProjects(prev => {
      const isPinned = prev.some(p => p.id === project.id);
      if (isPinned) {
        // Remove project
        return prev.filter(p => p.id !== project.id);
      } else {
        // Add project
        return [...prev, project];
      }
    });
  };

  // Check if a project is pinned
  const isProjectPinned = (projectId: number) => {
    return pinnedProjects.some(p => p.id === projectId);
  };

  // Toggle agent run pin status
  const toggleRunPin = (run: AgentRun) => {
    setPinnedRunIds(prev => {
      const isPinned = prev.includes(run.id);
      if (isPinned) {
        // Remove run
        return prev.filter(id => id !== run.id);
      } else {
        // Add run
        return [...prev, run.id];
      }
    });
  };

  // Check if an agent run is pinned
  const isRunPinned = (runId: number) => {
    return pinnedRunIds.includes(runId);
  };

  // Associate a run with a project
  const associateRunWithProject = (run: AgentRun, project: ProjectRepository) => {
    // Ensure the run is pinned
    if (!isRunPinned(run.id)) {
      toggleRunPin(run);
    }

    // Ensure the project is pinned
    if (!isProjectPinned(project.id)) {
      toggleProjectPin(project);
    }

    // Associate the run with the project
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

  // Remove a run from a project
  const removeRunFromProject = (runId: number, projectFullName: string) => {
    setProjectRunAssociations(prev => {
      const projectRuns = prev[projectFullName] || [];
      return {
        ...prev,
        [projectFullName]: projectRuns.filter(id => id !== runId)
      };
    });
  };

  // Get runs associated with a project
  const getProjectRuns = (projectFullName: string): number[] => {
    return projectRunAssociations[projectFullName] || [];
  };

  return {
    pinnedProjects,
    pinnedRunIds,
    projectRunAssociations,
    toggleProjectPin,
    isProjectPinned,
    toggleRunPin,
    isRunPinned,
    associateRunWithProject,
    removeRunFromProject,
    getProjectRuns
  };
}

