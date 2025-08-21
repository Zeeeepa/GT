import { LocalStorage, Cache } from "../utils/storage";
import { CodegenRepository } from "../types";
import {
  CACHE_KEYS,
  CACHE_NAMESPACES,
  SyncStatus,
  SyncState,
} from "./cacheTypes";

/**
 * Cache entry for a repository
 */
interface RepositoryCacheEntry {
  data: CodegenRepository;
  timestamp: string;
  version: string;
  organizationId: number;
}

/**
 * Cache for repository data
 */
export class RepositoryCache {
  private cache: Cache;
  private metadata: {
    lastFullSync: string;
    version: string;
    organizationSyncStatus: Record<number, SyncState>;
  };

  constructor() {
    this.cache = new Cache({
      namespace: CACHE_NAMESPACES.REPOSITORIES
    });
    this.metadata = {
      lastFullSync: "",
      version: "1.0.0",
      organizationSyncStatus: {},
    };
    this.loadMetadata();
  }

  /**
   * Get all repositories for an organization
   * @param organizationId The organization ID
   */
  async getRepositories(organizationId: number): Promise<CodegenRepository[]> {
    const cacheKey = this.getOrgCacheKey(organizationId);
    const cached = await LocalStorage.getItem<string>(cacheKey);
    if (!cached) return [];
    try {
      const entries: RepositoryCacheEntry[] = JSON.parse(cached);
      return entries.map(e => e.data).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error parsing cached repositories:", error);
      return [];
    }
  }

  /**
   * Set repositories for an organization
   * @param organizationId The organization ID
   * @param repositories The repositories to cache
   */
  async setRepositories(organizationId: number, repositories: CodegenRepository[]): Promise<void> {
    const cacheKey = this.getOrgCacheKey(organizationId);
    const now = new Date();
    const entries: RepositoryCacheEntry[] = repositories.map(repo => ({
      data: repo,
      timestamp: now.toISOString(),
      version: this.metadata.version,
      organizationId,
    }));
    await LocalStorage.setItem(cacheKey, JSON.stringify(entries));
    await this.setSyncStatus(organizationId, SyncStatus.SUCCESS);
  }

  /**
   * Get a specific repository by ID
   * @param organizationId The organization ID
   * @param repositoryId The repository ID
   */
  async getRepository(organizationId: number, repositoryId: number): Promise<CodegenRepository | null> {
    const repositories = await this.getRepositories(organizationId);
    return repositories.find(repo => repo.id === repositoryId) || null;
  }

  /**
   * Update a specific repository
   * @param organizationId The organization ID
   * @param repository The repository to update
   */
  async updateRepository(organizationId: number, repository: CodegenRepository): Promise<void> {
    const repositories = await this.getRepositories(organizationId);
    const index = repositories.findIndex(r => r.id === repository.id);
    if (index > -1) {
      repositories[index] = repository;
    } else {
      repositories.push(repository);
    }
    await this.setRepositories(organizationId, repositories);
  }

  /**
   * Remove a repository from the cache
   * @param organizationId The organization ID
   * @param repositoryId The repository ID to remove
   */
  async removeRepository(organizationId: number, repositoryId: number): Promise<void> {
    const repositories = await this.getRepositories(organizationId);
    const filteredRepos = repositories.filter(repo => repo.id !== repositoryId);
    await this.setRepositories(organizationId, filteredRepos);
  }

  /**
   * Get the sync status for an organization
   * @param organizationId The organization ID
   */
  async getSyncStatus(organizationId: number): Promise<SyncState> {
    const statusKey = `repo-sync-status-${organizationId}`;
    const status = await LocalStorage.getItem<string>(statusKey);
    if (status) {
      try { return JSON.parse(status); } catch {}
    }
    return { status: SyncStatus.IDLE };
  }

  /**
   * Set the sync status for an organization
   * @param organizationId The organization ID
   * @param status The sync status
   * @param error Optional error message
   */
  private async setSyncStatus(organizationId: number, status: SyncStatus, error?: string): Promise<void> {
    const statusKey = `repo-sync-status-${organizationId}`;
    const syncState: SyncState = { status, lastSync: new Date().toISOString(), error };
    await LocalStorage.setItem(statusKey, JSON.stringify(syncState));
    
    // Update metadata
    this.metadata.organizationSyncStatus[organizationId] = syncState;
    await this.saveMetadata();
  }
  
  /**
   * Get the cache key for an organization
   * @param orgId The organization ID
   */
  private getOrgCacheKey = (orgId: number) => `${CACHE_KEYS.REPOSITORIES}-org-${orgId}`;
  
  /**
   * Save metadata to storage
   */
  private saveMetadata = async () => await LocalStorage.setItem(CACHE_KEYS.REPO_METADATA, JSON.stringify(this.metadata));
  
  /**
   * Load metadata from storage
   */
  private loadMetadata = async () => {
    const stored = await LocalStorage.getItem<string>(CACHE_KEYS.REPO_METADATA);
    if (stored) {
      try { this.metadata = JSON.parse(stored); } catch (e) { console.error("Error loading repository cache metadata:", e); }
    }
  }
}

// Singleton instance
let repositoryCache: RepositoryCache | null = null;

/**
 * Get the repository cache instance
 */
export function getRepositoryCache(): RepositoryCache {
  if (!repositoryCache) {
    repositoryCache = new RepositoryCache();
  }
  return repositoryCache;
}
