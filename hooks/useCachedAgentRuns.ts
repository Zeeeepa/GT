import { useState, useEffect, useCallback, useMemo } from "react";
import { showToast, ToastStyle } from "../utils/toast";
import { AgentRun } from "../types";
import { AgentRunFilters, SortOptions } from "../utils/filtering";
import { getAgentRunCache } from "../storage/agentRunCache";
import { filterAgentRuns, sortAgentRuns } from "../utils/filtering";
import { getDefaultOrganizationId, hasCredentials } from "../utils/credentials";
import { SyncStatus } from "../storage/cacheTypes";
import { getBackgroundMonitoringService } from "../utils/backgroundMonitoring";

interface UseCachedAgentRunsResult {
  agentRuns: AgentRun[];
  filteredRuns: AgentRun[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  refresh: () => Promise<void>;
  updateFilters: (filters: AgentRunFilters) => void;
  updateSort: (sort: SortOptions) => void;
  filters: AgentRunFilters;
  sortOptions: SortOptions;
  organizationId: number | null;
  setOrganizationId: (orgId: number) => void;
}

export function useCachedAgentRuns(): UseCachedAgentRunsResult {
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [organizationId, setOrganizationIdState] = useState<number | null>(null);
  
  const [filters, setFilters] = useState<AgentRunFilters>({});
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "created_at",
    direction: "desc",
  });

  const cache = useMemo(() => getAgentRunCache(), []);
  const backgroundMonitoring = useMemo(() => getBackgroundMonitoringService(), []);

  useEffect(() => {
    async function initialize() {
      if (!await hasCredentials()) {
        setError("API token not configured. Please set it in your Codegen settings.");
        setIsLoading(false);
        return;
      }
      const defaultOrgId = await getDefaultOrganizationId();
      setOrganizationIdState(defaultOrgId);
      
      if (!backgroundMonitoring.isMonitoring()) {
        backgroundMonitoring.start();
      }
    }
    initialize();
  }, [backgroundMonitoring]);

  const loadCachedData = useCallback(async () => {
    if (!organizationId) {
        setAgentRuns([]);
        return;
    };
    try {
      const cachedRuns = await cache.getAgentRuns(organizationId);
      setAgentRuns(cachedRuns);
      const status = await cache.getSyncStatus(organizationId);
      setSyncStatus(status.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cached data");
    }
  }, [organizationId, cache]);

  const syncWithAPI = useCallback(async (showSuccessToast = false) => {
    if (!organizationId) return;

    setIsRefreshing(true);
    setError(null);
    try {
      const syncResult = await cache.syncAgentRuns(organizationId.toString());
      setSyncStatus(syncResult.status);

      if (syncResult.status === SyncStatus.SUCCESS) {
        const updatedRuns = await cache.getAgentRuns(organizationId);
        setAgentRuns(updatedRuns);
        if (showSuccessToast) {
          showToast({ style: ToastStyle.Success, title: "Agent Runs Updated", message: `Loaded ${updatedRuns.length} agent runs` });
        }
      } else if (syncResult.error) {
        setError(syncResult.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sync data";
      setError(errorMessage);
      setSyncStatus(SyncStatus.ERROR);
    } finally {
      setIsRefreshing(false);
    }
  }, [organizationId, cache]);

  const refresh = useCallback(async () => {
    await loadCachedData();
    await syncWithAPI(true);
  }, [loadCachedData, syncWithAPI]);

  useEffect(() => {
    if (organizationId) {
      setIsLoading(true);
      setError(null);
      loadCachedData().finally(() => {
        setIsLoading(false);
        syncWithAPI(false);
      });
    } else {
        setIsLoading(false);
        setAgentRuns([]);
    }
  }, [organizationId, loadCachedData, syncWithAPI]);

  const filteredRuns = useMemo(() => {
    return sortAgentRuns(
      filterAgentRuns(agentRuns, filters),
      sortOptions
    );
  }, [agentRuns, filters, sortOptions]);

  return {
    agentRuns,
    filteredRuns,
    isLoading,
    isRefreshing,
    error,
    syncStatus,
    refresh,
    updateFilters: setFilters,
    updateSort: setSortOptions,
    filters,
    sortOptions,
    organizationId,
    setOrganizationId: setOrganizationIdState,
  };
}
