/**
 * GitHub API Service
 * Handles all interactions with the GitHub API
 */

import { LocalStorage } from '../utils/storage';

// GitHub API Constants
const GITHUB_API_URL = 'https://api.github.com';

/**
 * GitHub API Client
 */
export class GitHubService {
  private token: string | null = null;
  
  /**
   * Initialize the GitHub service
   */
  constructor() {
    this.initializeToken();
  }
  
  /**
   * Initialize the GitHub token from environment variables or localStorage
   */
  private async initializeToken(): Promise<void> {
    // First try to get from environment variables
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    
    if (envToken) {
      this.token = envToken;
      return;
    }
    
    // Fall back to localStorage
    const storedToken = await LocalStorage.getItem<string>('githubToken');
    if (storedToken) {
      this.token = storedToken;
    }
  }
  
  /**
   * Set the GitHub token
   * @param token The GitHub token
   */
  public async setToken(token: string): Promise<void> {
    this.token = token;
    await LocalStorage.setItem('githubToken', token);
  }
  
  /**
   * Make a request to the GitHub API
   * @param endpoint The API endpoint
   * @param options Request options
   * @returns The response data
   */
  public async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      await this.initializeToken();
      if (!this.token) {
        throw new Error('GitHub token not set');
      }
    }
    
    const url = `${GITHUB_API_URL}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) {
        return null as unknown as T;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('GitHub API request failed:', error);
      throw error;
    }
  }
  
  /**
   * Get the authenticated user
   * @returns The user data
   */
  public async getUser(): Promise<any> {
    return this.makeRequest('/user');
  }
  
  /**
   * Get repositories for the authenticated user
   * @param page Page number
   * @param perPage Items per page
   * @returns List of repositories
   */
  public async getRepositories(page = 1, perPage = 30): Promise<any[]> {
    return this.makeRequest(`/user/repos?page=${page}&per_page=${perPage}`);
  }
  
  /**
   * Get a specific repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Repository data
   */
  public async getRepository(owner: string, repo: string): Promise<any> {
    return this.makeRequest(`/repos/${owner}/${repo}`);
  }
}

// Singleton instance
let githubService: GitHubService | null = null;

/**
 * Get the GitHub service instance
 * @returns The GitHub service
 */
export function getGitHubService(): GitHubService {
  if (!githubService) {
    githubService = new GitHubService();
  }
  return githubService;
}
