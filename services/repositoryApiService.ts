import { CodegenRepository } from '../types';
import { getAPIClient } from './codegenApiService';
import { getRepositoryCache } from '../storage/repositoryCache';

/**
 * Service for interacting with repository-related API endpoints
 */
export class RepositoryApiService {
  private apiClient = getAPIClient();
  private cache = getRepositoryCache();

  /**
   * Get repositories for an organization
   * @param organizationId The organization ID
   * @param useCache Whether to use cached data if available
   * @param page Page number for pagination
   * @param limit Number of repositories per page
   */
  async getRepositories(
    organizationId: string, 
    useCache: boolean = true,
    page: number = 1,
    limit: number = 50
  ): Promise<CodegenRepository[]> {
    // Try to get from cache first if useCache is true
    if (useCache) {
      const cachedRepos = await this.cache.getRepositories(parseInt(organizationId, 10));
      if (cachedRepos.length > 0) {
        return cachedRepos;
      }
    }

    try {
      // Fetch from API
      const response = await this.apiClient.makeRequest<{ items: CodegenRepository[] }>(
        `/v1/organizations/${organizationId}/repositories?page=${page}&limit=${limit}`
      );
      
      // Cache the results
      await this.cache.setRepositories(parseInt(organizationId, 10), response.items);
      
      return response.items;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  /**
   * Get a specific repository by ID
   * @param organizationId The organization ID
   * @param repositoryId The repository ID
   * @param useCache Whether to use cached data if available
   */
  async getRepository(
    organizationId: string,
    repositoryId: number,
    useCache: boolean = true
  ): Promise<CodegenRepository | null> {
    // Try to get from cache first if useCache is true
    if (useCache) {
      const cachedRepo = await this.cache.getRepository(parseInt(organizationId, 10), repositoryId);
      if (cachedRepo) {
        return cachedRepo;
      }
    }

    try {
      // Fetch from API
      const response = await this.apiClient.makeRequest<CodegenRepository>(
        `/v1/organizations/${organizationId}/repositories/${repositoryId}`
      );
      
      // Cache the result
      await this.cache.updateRepository(parseInt(organizationId, 10), response);
      
      return response;
    } catch (error) {
      console.error(`Error fetching repository #${repositoryId}:`, error);
      return null;
    }
  }

  /**
   * Search repositories by name
   * @param organizationId The organization ID
   * @param query The search query
   * @param useCache Whether to use cached data if available
   */
  async searchRepositories(
    organizationId: string,
    query: string,
    useCache: boolean = true
  ): Promise<CodegenRepository[]> {
    // For search, we'll use the cache but filter it client-side
    if (useCache) {
      const cachedRepos = await this.cache.getRepositories(parseInt(organizationId, 10));
      if (cachedRepos.length > 0) {
        const normalizedQuery = query.toLowerCase();
        return cachedRepos.filter(repo => 
          repo.name.toLowerCase().includes(normalizedQuery) || 
          (repo.description && repo.description.toLowerCase().includes(normalizedQuery))
        );
      }
    }

    // If no cache or empty cache, fetch all and filter
    const allRepos = await this.getRepositories(organizationId, false);
    const normalizedQuery = query.toLowerCase();
    
    return allRepos.filter(repo => 
      repo.name.toLowerCase().includes(normalizedQuery) || 
      (repo.description && repo.description.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * Refresh the repository cache for an organization
   * @param organizationId The organization ID
   */
  async refreshRepositories(organizationId: string): Promise<CodegenRepository[]> {
    try {
      // Fetch from API with cache disabled
      return await this.getRepositories(organizationId, false);
    } catch (error) {
      console.error('Error refreshing repositories:', error);
      throw error;
    }
  }
}

// Singleton instance
let repositoryApiService: RepositoryApiService | null = null;

/**
 * Get the repository API service instance
 */
export function getRepositoryApiService(): RepositoryApiService {
  if (!repositoryApiService) {
    repositoryApiService = new RepositoryApiService();
  }
  return repositoryApiService;
}
