import { LocalStorage, Cache } from "../utils/storage";
import { AgentRun, AgentRunStatus } from "../types";
import { CachedAgentRun } from "./cacheTypes";
import { getAPIClient } from "../services/codegenApiService";
import {
  AgentRunCacheEntry,
  CacheMetadata,
  CACHE_KEYS,
  CACHE_NAMESPACES,
  CACHE_CONFIGS,
  SyncStatus,
  SyncState,
} from "./cacheTypes";

export class AgentRunCache {
  private cache: Cache;
  private metadata: CacheMetadata;

  constructor() {
    this.cache = new Cache({
      namespace: CACHE_NAMESPACES.AGENT_RUNS
    });
    this.metadata = {
      lastFullSync: "",
      version: "1.0.0",
      organizationSyncStatus: {},
    };
    this.loadMetadata();
  }

  async getAgentRuns(organizationId: number): Promise<AgentRun[]> {
    const cacheKey = this.getOrgCacheKey(organizationId);
    const cached = await LocalStorage.getItem<string>(cacheKey);
    if (!cached) return [];
    try {
      const entries: AgentRunCacheEntry[] = JSON.parse(cached);
      return entries.map(e => e.data).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error("Error parsing cached agent runs:", error);
      return [];
    }
  }

  async setAgentRuns(organizationId: number, runs: AgentRun[]): Promise<void> {
    const cacheKey = this.getOrgCacheKey(organizationId);
    const now = new Date();
    const entries: AgentRunCacheEntry[] = runs.map(run => ({
      data: run,
      timestamp: now.toISOString(),
      version: this.metadata.version,
      organizationId,
    }));
    await LocalStorage.setItem(cacheKey, JSON.stringify(entries));
  }

  async updateAgentRun(organizationId: number, run: AgentRun): Promise<void> {
      const runs = await this.getAgentRuns(organizationId);
      const index = runs.findIndex(r => r.id === run.id);
      if (index > -1) {
          runs[index] = run;
      } else {
          runs.unshift(run);
      }
      await this.setAgentRuns(organizationId, runs);
  }

  async removeAgentRun(organizationId: number, agentRunId: number): Promise<void> {
    const runs = await this.getAgentRuns(organizationId);
    const filteredRuns = runs.filter(run => run.id !== agentRunId);
    await this.setAgentRuns(organizationId, filteredRuns);
  }

  async syncAgentRuns(organizationId: string): Promise<SyncState> {
    const orgIdNum = parseInt(organizationId, 10);
    try {
      await this.setSyncStatus(orgIdNum, SyncStatus.SYNCING);
      const apiClient = getAPIClient();
      const cachedRuns = await this.getAgentRuns(orgIdNum);
      if (cachedRuns.length === 0) {
        await this.setSyncStatus(orgIdNum, SyncStatus.SUCCESS);
        return { status: SyncStatus.SUCCESS, lastSync: new Date().toISOString() };
      }

      const results = await Promise.allSettled(
        cachedRuns.map(run => apiClient.getAgentRun(organizationId, run.id))
      );
      
      const refreshedRuns: AgentRun[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          refreshedRuns.push(result.value);
        } else {
          // If 404, remove from cache, otherwise keep stale data
          if (result.reason instanceof Error && result.reason.message.includes('404')) {
            console.log(`Run #${cachedRuns[index].id} not found on server. Removing from cache.`);
          } else {
            console.warn(`Could not refresh run ${cachedRuns[index].id}, keeping cached version.`, result.reason);
            refreshedRuns.push(cachedRuns[index]);
          }
        }
      });

      await this.setAgentRuns(orgIdNum, refreshedRuns);
      await this.setSyncStatus(orgIdNum, SyncStatus.SUCCESS);
      
      return { status: SyncStatus.SUCCESS, lastSync: new Date().toISOString() };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await this.setSyncStatus(orgIdNum, SyncStatus.ERROR, errorMessage);
      return { status: SyncStatus.ERROR, error: errorMessage };
    }
  }

  async getSyncStatus(organizationId: number): Promise<SyncState> {
    const statusKey = `sync-status-${organizationId}`;
    const status = await LocalStorage.getItem<string>(statusKey);
    if (status) {
      try { return JSON.parse(status); } catch {}
    }
    return { status: SyncStatus.IDLE };
  }

  private async setSyncStatus(organizationId: number, status: SyncStatus, error?: string): Promise<void> {
    const statusKey = `sync-status-${organizationId}`;
    const syncState: SyncState = { status, lastSync: new Date().toISOString(), error };
    await LocalStorage.setItem(statusKey, JSON.stringify(syncState));
  }
  
  private getOrgCacheKey = (orgId: number) => `${CACHE_KEYS.AGENT_RUNS}-org-${orgId}`;
  private saveMetadata = async () => await LocalStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(this.metadata));
  private loadMetadata = async () => {
    const stored = await LocalStorage.getItem<string>(CACHE_KEYS.METADATA);
    if (stored) {
      try { this.metadata = JSON.parse(stored); } catch (e) { console.error("Error loading cache metadata:", e); }
    }
  }
}

let agentRunCache: AgentRunCache | null = null;
export function getAgentRunCache(): AgentRunCache {
  if (!agentRunCache) {
    agentRunCache = new AgentRunCache();
  }
  return agentRunCache;
}
