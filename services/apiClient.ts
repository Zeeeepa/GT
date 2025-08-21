/**
 * API Client for Codegen API
 */

const API_BASE_URL = 'https://api.codegen.com';
const CODEGEN_TOKEN = import.meta.env.VITE_CODEGEN_TOKEN;

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

interface ResumeAgentRunOptions {
  prompt: string;
  images?: string[];
  metadata?: Record<string, any>;
}

/**
 * API Client for interacting with the Codegen API
 */
export class APIClient {
  private baseUrl: string;
  private token: string;
  
  constructor(baseUrl: string = API_BASE_URL, token: string = CODEGEN_TOKEN) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  /**
   * Make a request to the API
   * @param endpoint API endpoint path
   * @param options Request options
   * @returns Response data
   */
  async makeRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: 'include'
    };
    
    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing JSON fails, use the default error message
        }
        
        throw new Error(errorMessage);
      }
      
      // For 204 No Content responses, return empty object
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Resume an agent run
   * @param organizationId Organization ID
   * @param runId Agent run ID
   * @param options Resume options
   * @returns Response data
   */
  async resumeAgentRun(organizationId: string, runId: number | string, options: ResumeAgentRunOptions) {
    return this.makeRequest(`/v1/organizations/${organizationId}/agent-runs/${runId}/resume`, {
      method: 'POST',
      body: {
        prompt: options.prompt,
        images: options.images,
        metadata: options.metadata
      },
      headers: {
        'X-Organization-ID': organizationId
      }
    });
  }
  
  /**
   * Get agent run details
   * @param organizationId Organization ID
   * @param runId Agent run ID
   * @returns Agent run details
   */
  async getAgentRun(organizationId: string, runId: number | string) {
    return this.makeRequest(`/v1/organizations/${organizationId}/agent-runs/${runId}`, {
      headers: {
        'X-Organization-ID': organizationId
      }
    });
  }
  
  /**
   * List agent runs
   * @param organizationId Organization ID
   * @param params Query parameters
   * @returns List of agent runs
   */
  async listAgentRuns(organizationId: string, params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return this.makeRequest(`/v1/organizations/${organizationId}/agent-runs${queryString}`, {
      headers: {
        'X-Organization-ID': organizationId
      }
    });
  }
  
  /**
   * Create a new agent run
   * @param organizationId Organization ID
   * @param params Create parameters
   * @returns Created agent run
   */
  async createAgentRun(organizationId: string, params: { repository: string; prompt: string; images?: string[] }) {
    return this.makeRequest(`/v1/organizations/${organizationId}/agent-runs`, {
      method: 'POST',
      body: {
        repository: params.repository,
        prompt: params.prompt,
        images: params.images
      },
      headers: {
        'X-Organization-ID': organizationId
      }
    });
  }
}

// Singleton instance
let apiClient: APIClient | null = null;

/**
 * Get the API client instance
 * @returns API client instance
 */
export function getAPIClient(): APIClient {
  if (!apiClient) {
    apiClient = new APIClient();
  }
  return apiClient;
}

