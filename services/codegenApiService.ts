import {
  AgentRun,
  Organization,
  CreateAgentRunRequest,
  ApiError,
  CodegenRepository,
  User,
  ResumeAgentRunRequest,
  StopAgentRunRequest,
  SetupCommand,
} from '../types';
import { getCredentials, validateCredentials } from '../utils/credentials';
import { showToast, ToastStyle } from '../utils/toast';
import { clearStoredUserInfo } from '../storage/userStorage';


// --- API Constants ---

const DEFAULT_API_BASE_URL = "/api/codegen";

const API_ENDPOINTS = {
  // User endpoints
  USER_ME: "/v1/users/me",
  
  // Organization endpoints
  ORGANIZATIONS: "/v1/organizations",
  ORGANIZATIONS_PAGINATED: (page: number, size: number) => `/v1/organizations?page=${page}&size=${size}`,
  
  // Agent Run endpoints
  AGENT_RUN_CREATE: (organizationId: number | string) => 
    `/v1/organizations/${organizationId}/agent/run`,
  AGENT_RUN_GET: (organizationId: number | string, agentRunId: number) => 
    `/v1/organizations/${organizationId}/agent/run/${agentRunId}`,
  AGENT_RUN_RESUME: (organizationId: number | string) => 
    `/v1/organizations/${organizationId}/agent/run/resume`,
  AGENT_RUN_STOP: (organizationId: number) => 
    `/v1/beta/organizations/${organizationId}/agent/run/stop`,
  
  // Setup Commands
  SETUP_COMMANDS: (organizationId: number | string, projectId: number) =>
    `/v1/organizations/${organizationId}/setup-commands/generate?project_id=${projectId}`,
} as const;


// --- API Client Class ---

class CodegenAPIClient {
  private baseUrl: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = DEFAULT_API_BASE_URL;
    this.apiToken = '';
  }

  private async initializeCredentials(): Promise<void> {
    if (!this.apiToken) {
      const credentials = await getCredentials();
      this.apiToken = credentials.apiToken;
    }
  }

  public async refreshCredentials(): Promise<void> {
    const credentials = await getCredentials();
    this.apiToken = credentials.apiToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.initializeCredentials();
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      "Authorization": `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    try {
      const response = await fetch(url, {
        ...options,
        mode: "cors",
        headers: { ...defaultHeaders, ...options.headers },
      });

      if (!response.ok) {
        await this.handleAPIError(response);
      }
      
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null as T;
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  private async handleAPIError(response: Response): Promise<never> {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = (errorData as any).detail || errorData.message || errorMessage;
    } catch {}

    if (response.status === 401 || response.status === 403) {
      showToast({
        style: ToastStyle.Failure,
        title: "Authentication Error",
        message: "Invalid or expired API token. Please update your credentials."
      });
      throw new Error("Authentication failed");
    }

    showToast({
      style: ToastStyle.Failure,
      title: "API Error",
      message: errorMessage,
    });

    throw new Error(errorMessage);
  }

  // --- Agent Run Methods ---

  async createAgentRun(organizationId: string, request: CreateAgentRunRequest): Promise<AgentRun> {
    return this.makeRequest<AgentRun>(
      API_ENDPOINTS.AGENT_RUN_CREATE(organizationId),
      { method: "POST", body: JSON.stringify(request) }
    );
  }

  async getAgentRun(organizationId: string, agentRunId: number): Promise<AgentRun> {
    return this.makeRequest<AgentRun>(
      API_ENDPOINTS.AGENT_RUN_GET(organizationId, agentRunId)
    );
  }

  async resumeAgentRun(organizationId: string, agentRunId: number, request: { prompt: string }): Promise<AgentRun> {
    const fullRequest: ResumeAgentRunRequest = {
        ...request,
        agent_run_id: agentRunId
    };
    return this.makeRequest<AgentRun>(
      API_ENDPOINTS.AGENT_RUN_RESUME(organizationId),
      { 
        method: "POST",
        body: JSON.stringify(fullRequest),
      }
    );
  }

  async stopAgentRun(organizationId: number, request: StopAgentRunRequest): Promise<AgentRun> {
    return this.makeRequest<AgentRun>(
      API_ENDPOINTS.AGENT_RUN_STOP(organizationId),
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }
  
  // --- Organization & User Methods ---

  async getOrganizations(page = 1, size = 50): Promise<{ items: Organization[] }> {
    return this.makeRequest<{ items: Organization[] }>(
      API_ENDPOINTS.ORGANIZATIONS_PAGINATED(page, size)
    );
  }

  async getMe(): Promise<User> {
    return this.makeRequest<User>(API_ENDPOINTS.USER_ME);
  }


  // --- Validation ---
  
  async validateConnection(): Promise<boolean> {
    try {
      const result = await validateCredentials();
      return result.isValid;
    } catch {
      return false;
    }
  }

  // --- Setup Commands ---
  
  async generateSetupCommands(organizationId: string, projectId: number): Promise<SetupCommand[]> {
    return this.makeRequest<SetupCommand[]>(
      API_ENDPOINTS.SETUP_COMMANDS(organizationId, projectId),
      { method: "GET" }
    );
  }
}

// Singleton instance
let apiClient: CodegenAPIClient | null = null;

export function getAPIClient(): CodegenAPIClient {
  if (!apiClient) {
    apiClient = new CodegenAPIClient();
  }
  return apiClient;
}

export async function resetAPIClient(): Promise<void> {
  apiClient = null;
  await clearStoredUserInfo();
}
