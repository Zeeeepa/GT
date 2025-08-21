import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { CachedAgentRun } from '../../../types';

interface AgentRunSelectionContextType {
  selectedIds: Set<number>;
  selectedRuns: Map<number, CachedAgentRun>;
  selectionCount: number;
  hasSelection: boolean;
  toggleRun: (runId: number, runData: CachedAgentRun) => void;
  selectRuns: (runs: CachedAgentRun[]) => void;
  clearSelection: () => void;
  isSelected: (runId: number) => boolean;
}

const AgentRunSelectionContext = createContext<AgentRunSelectionContextType | undefined>(undefined);

export const AgentRunSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRuns, setSelectedRuns] = useState<Map<number, CachedAgentRun>>(new Map());

  const toggleRun = useCallback((runId: number, runData: CachedAgentRun) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(runId)) {
        newSet.delete(runId);
      } else {
        newSet.add(runId);
      }
      return newSet;
    });
    setSelectedRuns(prev => {
      const newMap = new Map(prev);
      if (newMap.has(runId)) {
        newMap.delete(runId);
      } else {
        newMap.set(runId, runData);
      }
      return newMap;
    });
  }, []);

  const selectRuns = useCallback((runs: CachedAgentRun[]) => {
    setSelectedIds(new Set(runs.map(r => r.id)));
    setSelectedRuns(new Map(runs.map(r => [r.id, r])));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedRuns(new Map());
  }, []);

  const isSelected = useCallback((runId: number) => selectedIds.has(runId), [selectedIds]);

  const value = useMemo(() => ({
    selectedIds,
    selectedRuns,
    selectionCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
    toggleRun,
    selectRuns,
    clearSelection,
    isSelected,
  }), [selectedIds, selectedRuns, toggleRun, selectRuns, clearSelection, isSelected]);

  return (
    <AgentRunSelectionContext.Provider value={value}>
      {children}
    </AgentRunSelectionContext.Provider>
  );
};

export const useAgentRunSelection = (): AgentRunSelectionContextType => {
  const context = useContext(AgentRunSelectionContext);
  if (!context) {
    throw new Error('useAgentRunSelection must be used within an AgentRunSelectionProvider');
  }
  return context;
};
