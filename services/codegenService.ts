import { 
  User, 
  Repository, 
  AgentRun, 
  AgentRunLog, 
  Organization, 
  Integration, 
  SetupCommand, 
  SandboxAnalysis,
  PaginatedResponse,
  ApiError,
  CreateAgentRunRequest,
  ResumeAgentRunRequest,
  PaginationParams,
  SourceType,
  MessageType,
  AgentRunStatus,
  LogLevel,
  GithubPullRequest
} from '../types';

// Enhanced client configuration
export interface CodegenClientConfig {
  api_token: string;
  org_id: string;
  base_url: string;
  timeout: number;
  max_retries: number;
  retry_delay: number;
  retry_backoff_factor: number;
  rate_limit_requests_per_period: number;
  rate_limit_period_seconds: number;
  enable_caching: boolean;
  cache_ttl_seconds: number;
  cache_max_size: number;
  log_level: string;
  log_requests: boolean;
  log_responses: boolean;
  user_agent: string;
}

// Exception Classes
export class ValidationError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class CodegenAPIError extends Error {
  statusCode: number;
  responseData?: any;
  requestId?: string;

  constructor(
    message: string,
    statusCode: number = 0,
    responseData?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'CodegenAPIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
    this.requestId = requestId;
  }
}

export class RateLimitError extends CodegenAPIError {
  retryAfter: number;

  constructor(retryAfter: number = 60, requestId?: string) {
    super(`Rate limited. Retry after ${retryAfter} seconds`, 429, undefined, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends CodegenAPIError {
  constructor(message: string = "Authentication failed", requestId?: string) {
    super(message, 401, undefined, requestId);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends CodegenAPIError {
  constructor(message: string = "Resource not found", requestId?: string) {
    super(message, 404, undefined, requestId);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends CodegenAPIError {
  constructor(
    message: string = "Server error occurred",
    statusCode: number = 500,
    requestId?: string
  ) {
    super(message, statusCode, undefined, requestId);
    this.name = 'ServerError';
  }
}

export class TimeoutError extends CodegenAPIError {
  constructor(message: string = "Request timed out", requestId?: string) {
    super(message, 408, undefined, requestId);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends CodegenAPIError {
  constructor(message: string = "Network error occurred", requestId?: string) {
    super(message, 0, undefined, requestId);
    this.name = 'NetworkError';
  }
}

// Rate Limiter Class
class RateLimiter {
  private requests: number[] = [];
  private readonly requestsPerPeriod: number;
  private readonly periodSeconds: number;

  constructor(requestsPerPeriod: number, periodSeconds: number) {
    this.requestsPerPeriod = requestsPerPeriod;
    this.periodSeconds = periodSeconds;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now() / 1000;
    
    // Remove old requests
    this.requests = this.requests.filter(
      requestTime => now - requestTime < this.periodSeconds
    );

    if (this.requests.length >= this.requestsPerPeriod) {
      const sleepTime = this.periodSeconds - (now - this.requests[0]);
      if (sleepTime > 0) {
        console.log(`Rate limit reached, sleeping for ${sleepTime.toFixed(2)}s`);
        await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
      }
    }

    this.requests.push(now);
  }

  getCurrentUsage(): Record<string, any> {
    const now = Date.now() / 1000;
    const recentRequests = this.requests.filter(
      requestTime => now - requestTime < this.periodSeconds
    );

    return {
      current_requests: recentRequests.length,
      max_requests: this.requestsPerPeriod,
      period_seconds: this.periodSeconds,
      usage_percentage: (recentRequests.length / this.requestsPerPeriod) * 100
    };
  }
}

// Cache Manager Class
class CacheManager {
  private cache: Map<string, any> = new Map();
  private timestamps: Map<string, number> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private readonly maxSize: number;
  private readonly ttlSeconds: number;

  constructor(maxSize: number = 128, ttlSeconds: number = 300) {
    this.maxSize = maxSize;
    this.ttlSeconds = ttlSeconds;
  }

  get(key: string): any | null {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }

    const now = Date.now() / 1000;
    const timestamp = this.timestamps.get(key) || 0;

    // Check if expired
    if (now - timestamp > this.ttlSeconds) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      if (this.timestamps.size > 0) {
        let oldestKey = '';
        let oldestTime = Infinity;
        
        for (const [k, timestamp] of this.timestamps.entries()) {
          if (timestamp < oldestTime) {
            oldestTime = timestamp;
            oldestKey = k;
          }
        }

        if (oldestKey) {
          this.cache.delete(oldestKey);
          this.timestamps.delete(oldestKey);
        }
      }
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() / 1000);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): Record<string, any> {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      max_size: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hit_rate_percentage: hitRate,
      ttl_seconds: this.ttlSeconds
    };
  }
}

// Main Codegen Service Class
export class CodegenService {
  private config: CodegenClientConfig;
  private rateLimiter: RateLimiter;
  private cache?: CacheManager;

  constructor(config: Partial<CodegenClientConfig> = {}) {
    // Default configuration
    this.config = {
      api_token: config.api_token || import.meta.env.VITE_CODEGEN_API_TOKEN || '',
      org_id: config.org_id || import.meta.env.VITE_CODEGEN_ORG_ID || '',
      base_url: config.base_url || 'https://api.codegen.com/v1',
      timeout: config.timeout || 30000,
      max_retries: config.max_retries || 3,
      retry_delay: config.retry_delay || 1000,
      retry_backoff_factor: config.retry_backoff_factor || 2.0,
      rate_limit_requests_per_period: config.rate_limit_requests_per_period || 60,
      rate_limit_period_seconds: config.rate_limit_period_seconds || 60,
      enable_caching: config.enable_caching !== false,
      cache_ttl_seconds: config.cache_ttl_seconds || 300,
      cache_max_size: config.cache_max_size || 128,
      log_level: config.log_level || 'INFO',
      log_requests: config.log_requests !== false,
      log_responses: config.log_responses || false,
      user_agent: config.user_agent || 'codegen-typescript-client/1.0.0'
    };

    if (!this.config.api_token) {
      throw new ValidationError('API token is required');
    }

    if (!this.config.org_id) {
      throw new ValidationError('Organization ID is required');
    }

    // Initialize components
    this.rateLimiter = new RateLimiter(
      this.config.rate_limit_requests_per_period,
      this.config.rate_limit_period_seconds
    );

    if (this.config.enable_caching) {
      this.cache = new CacheManager(
        this.config.cache_max_size,
        this.config.cache_ttl_seconds
      );
    }

    console.log(`Initialized CodegenService with base URL: ${this.config.base_url}`);
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private createAbortSignal(timeoutMs: number): AbortSignal | undefined {
    if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
      return (AbortSignal as any).timeout(timeoutMs);
    }
    
    // Fallback for environments without AbortSignal.timeout
    if (typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    }
    
    return undefined;
  }

  private validatePagination(skip: number, limit: number): void {
    if (skip < 0) {
      throw new ValidationError('skip must be >= 0');
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('limit must be between 1 and 100');
    }
  }

  private handleResponse(response: Response, requestId: string): void {
    const statusCode = response.status;

    if (statusCode === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new RateLimitError(retryAfter, requestId);
    }

    if (statusCode === 401) {
      throw new AuthenticationError('Invalid API token or insufficient permissions', requestId);
    } else if (statusCode === 404) {
      throw new NotFoundError('Requested resource not found', requestId);
    } else if (statusCode === 409) {
      throw new Error('Resource conflict occurred');
    } else if (statusCode >= 500) {
      throw new ServerError(`Server error: ${statusCode}`, statusCode, requestId);
    } else if (!response.ok) {
      throw new CodegenAPIError(`API request failed: ${statusCode}`, statusCode, undefined, requestId);
    }
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = false
  ): Promise<any> {
    const requestId = this.generateRequestId();

    // Rate limiting
    await this.rateLimiter.waitIfNeeded();

    // Check cache
    let cacheKey: string | null = null;
    if (useCache && this.cache && method.toUpperCase() === 'GET') {
      cacheKey = `${method}:${endpoint}:${JSON.stringify(options)}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`Cache hit for ${endpoint} (request_id: ${requestId})`);
        return cachedResult;
      }
    }

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.max_retries; attempt++) {
      const startTime = Date.now();
      const url = `${this.config.base_url}${endpoint}`;

      if (this.config.log_requests) {
        console.log(`Making ${method} request to ${endpoint} (request_id: ${requestId})`);
      }

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${this.config.api_token}`,
            'User-Agent': this.config.user_agent,
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options,
          signal: this.createAbortSignal(this.config.timeout)
        });

        const duration = (Date.now() - startTime) / 1000;

        if (this.config.log_requests) {
          console.log(`Request completed in ${duration.toFixed(2)}s - Status: ${response.status} (request_id: ${requestId})`);
        }

        this.handleResponse(response, requestId);

        const result = await response.json();

        if (this.config.log_responses && response.ok) {
          console.log(`Response: ${JSON.stringify(result, null, 2)}`);
        }

        // Cache successful GET requests
        if (cacheKey && response.ok && this.cache) {
          this.cache.set(cacheKey, result);
        }

        return result;

      } catch (error) {
        lastError = error as Error;

        if (error instanceof RateLimitError) {
          if (attempt === this.config.max_retries) {
            throw error;
          }
          console.log(`Rate limited, waiting ${error.retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
          continue;
        }

        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (attempt === this.config.max_retries) {
            throw new NetworkError(`Network error: ${error.message}`, requestId);
          }
          const sleepTime = this.config.retry_delay * Math.pow(this.config.retry_backoff_factor, attempt);
          console.log(`Request failed (attempt ${attempt + 1}), retrying in ${sleepTime}ms: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, sleepTime));
          continue;
        }

        if (error instanceof DOMException && error.name === 'TimeoutError') {
          throw new TimeoutError(`Request timed out after ${this.config.timeout}ms`, requestId);
        }

        throw error;
      }
    }

    throw lastError || new CodegenAPIError('Request failed after all retries', 0, undefined, requestId);
  }

  // ========================================================================
  // Agent Run Management
  // ========================================================================

  async createAgentRun(data: CreateAgentRunRequest): Promise<AgentRun> {
    if (!data.prompt || data.prompt.trim().length === 0) {
      throw new ValidationError('Prompt cannot be empty');
    }
    if (data.prompt.length > 50000) {
      throw new ValidationError('Prompt cannot exceed 50,000 characters');
    }
    if (data.images && data.images.length > 10) {
      throw new ValidationError('Cannot include more than 10 images');
    }

    const response = await this.makeRequest(
      'POST',
      `/organizations/${this.config.org_id}/agent/run`,
      { body: JSON.stringify(data) }
    );

    return this.parseAgentRunResponse(response);
  }

  async getAgentRun(agentRunId: number): Promise<AgentRun> {
    const response = await this.makeRequest(
      'GET',
      `/organizations/${this.config.org_id}/agent/run/${agentRunId}`,
      {},
      true
    );
    return this.parseAgentRunResponse(response);
  }

  async listAgentRuns(params: {
    user_id?: number;
    source_type?: SourceType;
    skip?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<AgentRun>> {
    const { user_id, source_type, skip = 0, limit = 100 } = params;
    this.validatePagination(skip, limit);

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    if (user_id) {
      queryParams.append('user_id', user_id.toString());
    }
    if (source_type) {
      queryParams.append('source_type', source_type);
    }

    const response = await this.makeRequest(
      'GET',
      `/organizations/${this.config.org_id}/agent/runs?${queryParams.toString()}`,
      {},
      true
    );

    return {
      items: response.items.map((run: any) => this.parseAgentRunResponse(run)),
      total: response.total,
      page: response.page,
      size: response.size,
      pages: response.pages
    };
  }

  async resumeAgentRun(agentRunId: number, prompt: string, images?: string[]): Promise<AgentRun> {
    if (!prompt || prompt.trim().length === 0) {
      throw new ValidationError('Prompt cannot be empty');
    }

    const data: ResumeAgentRunRequest = { 
      agent_run_id: agentRunId, 
      prompt, 
      images 
    };

    const response = await this.makeRequest(
      'POST',
      `/organizations/${this.config.org_id}/agent/run/resume`,
      { body: JSON.stringify(data) }
    );

    return this.parseAgentRunResponse(response);
  }

  async stopAgentRun(agentRunId: number): Promise<AgentRun> {
    const response = await this.makeRequest(
      'POST',
      `/organizations/${this.config.org_id}/agent/run/${agentRunId}/stop`
    );
    return this.parseAgentRunResponse(response);
  }

  async banChecksForAgentRun(agentRunId: number): Promise<{ success: boolean }> {
    return this.makeRequest('POST', `/organizations/${this.config.org_id}/agent/run/${agentRunId}/ban-checks`);
  }

  async unbanChecksForAgentRun(agentRunId: number): Promise<{ success: boolean }> {
    return this.makeRequest('POST', `/organizations/${this.config.org_id}/agent/run/${agentRunId}/unban-checks`);
  }

  async removeCodegenFromPR(agentRunId: number): Promise<{ success: boolean }> {
    return this.makeRequest('POST', `/organizations/${this.config.org_id}/agent/run/${agentRunId}/remove-codegen`);
  }

  // ========================================================================
  // Logs Management
  // ========================================================================

  async getAgentRunLogs(agentRunId: number, params: PaginationParams = {}): Promise<{
    logs: AgentRunLog[];
    total_logs?: number;
    status?: string;
    id: number;
    organization_id: number;
    created_at?: string;
    web_url?: string;
    result?: string;
    metadata?: Record<string, any>;
    page?: number;
    size?: number;
    pages?: number;
  }> {
    const { skip = 0, limit = 100 } = params;
    this.validatePagination(skip, limit);

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    const response = await this.makeRequest(
      'GET',
      `/organizations/${this.config.org_id}/agent/run/${agentRunId}/logs?${queryParams.toString()}`,
      {},
      true
    );

    return {
      id: response.id,
      organization_id: response.organization_id,
      logs: response.logs.map((log: any): AgentRunLog => ({
        agent_run_id: log.agent_run_id,
        created_at: log.created_at,
        message_type: log.message_type as MessageType,
        thought: log.thought,
        tool_name: log.tool_name,
        tool_input: log.tool_input,
        tool_output: log.tool_output,
        observation: log.observation
      })),
      status: response.status,
      created_at: response.created_at,
      web_url: response.web_url,
      result: response.result,
      metadata: response.metadata,
      total_logs: response.total_logs,
      page: response.page,
      size: response.size,
      pages: response.pages
    };
  }

  async getAllAgentRunLogs(agentRunId: number): Promise<AgentRunLog[]> {
    const allLogs: AgentRunLog[] = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getAgentRunLogs(agentRunId, { skip, limit });
      allLogs.push(...response.logs);
      
      // Check if we have more pages
      hasMore = response.logs.length === limit;
      skip += limit;
      
      // Safety check to prevent infinite loops
      if (skip > 10000) {
        console.warn('Reached maximum log fetch limit (10,000 logs)');
        break;
      }
    }

    return allLogs;
  }

  // ========================================================================
  // Repository and Organization Management
  // ========================================================================

  async getRepositories(params?: { skip?: number; limit?: number }): Promise<Repository[]> {
    // If pagination params not provided, fetch all pages (accumulate >100 repos)
    if (!params) {
      const all: Repository[] = [];
      let skip = 0;
      const limit = 100;
      while (true) {
        const pageItems = await this.fetchRepositoriesPage(skip, limit);
        all.push(...pageItems);
        if (pageItems.length < limit) break;
        skip += limit;
        // Safety cap to avoid infinite loop
        if (skip > 5000) break;
      }
      return all;
    }

    // Single page fetch
    const { skip = 0, limit = 100 } = params;
    this.validatePagination(skip, limit);
    const items = await this.fetchRepositoriesPage(skip, limit);
    return items;
  }

  private async fetchRepositoriesPage(skip: number, limit: number): Promise<Repository[]> {
    const qp = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    const resp = await this.makeRequest('GET', `/organizations/${this.config.org_id}/repos?${qp.toString()}`, {}, true);
    if (Array.isArray(resp)) return resp as Repository[];
    if (resp && Array.isArray(resp.items)) return resp.items as Repository[];
    return [];
  }

  async getOrganizations(): Promise<Organization[]> {
    const resp = await this.makeRequest('GET', '/organizations', {}, true);
    if (Array.isArray(resp)) return resp as Organization[];
    if (resp && Array.isArray(resp.items)) return resp.items as Organization[];
    return [];
  }

  async getOrganizationIntegrations(): Promise<Integration[]> {
    const resp = await this.makeRequest('GET', `/organizations/${this.config.org_id}/integrations`, {}, true);
    const toIntegration = (it: any): Integration => {
      const raw = it?.status ?? it?.state ?? (it?.enabled ? 'active' : 'inactive');
      const v = typeof raw === 'string' ? raw.toLowerCase() : (raw ? 'active' : 'inactive');
      const normalized: 'active' | 'inactive' | 'error' = v === 'active' ? 'active' : (v === 'error' ? 'error' : 'inactive');
      return {
        id: it.id ?? 0,
        type: String(it.type ?? it.name ?? 'integration'),
        name: String(it.name ?? it.type ?? 'Integration'),
        status: normalized,
        config: it.config ?? undefined,
        created_at: it.created_at ?? new Date().toISOString(),
      };
    };

    if (Array.isArray(resp)) return resp.map(toIntegration);
    if (resp && Array.isArray(resp.items)) return resp.items.map(toIntegration);
    return [];
  }

  // ========================================================================
  // User Management
  // ========================================================================

  async getUsers(): Promise<User[]> {
    return this.makeRequest('GET', `/organizations/${this.config.org_id}/users`);
  }

  async getUser(id: number): Promise<User> {
    return this.makeRequest('GET', `/organizations/${this.config.org_id}/users/${id}`);
  }

  async getCurrentUser(): Promise<User> {
    // According to docs, current user is global: GET /v1/users/me
    return this.makeRequest('GET', `/users/me`);
  }

  // ========================================================================
  // Setup and Analysis
  // ========================================================================

  async generateSetupCommands(data: {
    repository_id: number;
    branch?: string;
  }): Promise<SetupCommand[]> {
    return this.makeRequest('POST', '/setup-commands/generate', {
      body: JSON.stringify(data),
    });
  }

  async analyzeSandboxLogs(data: {
    logs: string;
    context?: Record<string, any>;
  }): Promise<SandboxAnalysis> {
    return this.makeRequest('POST', '/sandbox/analyze-logs', {
      body: JSON.stringify(data),
    });
  }

  async getAgentRunLogsGuide(): Promise<{ content: string }> {
    return this.makeRequest('GET', '/guides/agent-run-logs');
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  async waitForCompletion(
    agentRunId: number,
    options: {
      pollInterval?: number;
      timeout?: number;
      onLogUpdate?: (logs: AgentRunLog[]) => void;
      onStatusUpdate?: (status: string, progress?: number) => void;
    } = {}
  ): Promise<{
    agentRun: AgentRun;
    allLogs: AgentRunLog[];
  }> {
    const { 
      pollInterval = 5000, 
      timeout, 
      onLogUpdate, 
      onStatusUpdate 
    } = options;
    
    const startTime = Date.now();
    let lastLogCount = 0;
    const allLogs: AgentRunLog[] = [];

    while (true) {
      const run = await this.getAgentRun(agentRunId);
      
      // Get new logs since last check
      if (onLogUpdate) {
        try {
          const logsResponse = await this.getAgentRunLogs(agentRunId, {
            skip: lastLogCount,
            limit: 100
          });
          
          if (logsResponse.logs.length > 0) {
            allLogs.push(...logsResponse.logs);
            lastLogCount += logsResponse.logs.length;
            onLogUpdate(logsResponse.logs);
          }
        } catch (error) {
          console.warn('Failed to fetch logs during wait:', error);
        }
      }
      
      // Calculate progress based on status and log activity
      let progress = 0;
      if (run.status === AgentRunStatus.PENDING) progress = 10;
      else if (run.status === AgentRunStatus.RUNNING) progress = Math.min(90, 20 + (lastLogCount * 2));
      else if (run.status === AgentRunStatus.COMPLETED) progress = 100;
      else if (run.status === AgentRunStatus.FAILED) progress = 100;
      
      if (onStatusUpdate) {
        onStatusUpdate(run.status, progress);
      }

      if ([
        AgentRunStatus.COMPLETED,
        AgentRunStatus.FAILED,
        AgentRunStatus.CANCELLED
      ].includes(run.status)) {
        // Get any remaining logs
        if (onLogUpdate) {
          try {
            const finalLogs = await this.getAllAgentRunLogs(agentRunId);
            const newLogs = finalLogs.slice(lastLogCount);
            if (newLogs.length > 0) {
              allLogs.push(...newLogs);
              onLogUpdate(newLogs);
            }
          } catch (error) {
            console.warn('Failed to fetch final logs:', error);
          }
        }
        
        return {
          agentRun: run,
          allLogs: allLogs
        };
      }

      if (timeout && (Date.now() - startTime) > timeout) {
        throw new TimeoutError(
          `Agent run ${agentRunId} did not complete within ${timeout}ms`
        );
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  private parseAgentRunResponse(data: any): AgentRun {
    const normalizeStatus = (s: any): AgentRunStatus => {
      if (!s) return AgentRunStatus.PENDING;
      const v = String(s).toUpperCase();
      switch (v) {
        case 'ACTIVE':
        case 'RUNNING':
          return AgentRunStatus.RUNNING;
        case 'COMPLETE':
        case 'COMPLETED':
          return AgentRunStatus.COMPLETED;
        case 'ERROR':
        case 'FAILED':
          return AgentRunStatus.FAILED;
        case 'CANCELLED':
          return AgentRunStatus.CANCELLED;
        case 'PAUSED':
          return AgentRunStatus.PAUSED;
        case 'PENDING':
          return AgentRunStatus.PENDING;
        default:
          return AgentRunStatus.PENDING;
      }
    };

    return {
      id: data.id,
      organization_id: data.organization_id,
      status: normalizeStatus(data.status),
      created_at: data.created_at,
      updated_at: data.updated_at,
      web_url: data.web_url,
      result: data.result,
      source_type: data.source_type ? data.source_type as SourceType : undefined,
      github_pull_requests: (data.github_pull_requests || []).map((pr: any): GithubPullRequest => ({
        id: pr.id || 0,
        title: pr.title || '',
        url: pr.url || '',
        created_at: pr.created_at || '',
        number: pr.number,
        state: pr.state
      })),
      metadata: data.metadata,
      prompt: data.prompt,
      user_id: data.user_id
    };
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      config: {
        base_url: this.config.base_url,
        org_id: this.config.org_id,
        timeout: this.config.timeout,
        max_retries: this.config.max_retries,
        rate_limit_requests_per_period: this.config.rate_limit_requests_per_period,
        caching_enabled: this.config.enable_caching
      }
    };

    if (this.cache) {
      stats.cache = this.cache.getStats();
    }

    stats.rate_limiter = this.rateLimiter.getCurrentUsage();

    return stats;
  }

  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
      console.log('Cache cleared');
    }
  }

  async healthCheck(): Promise<Record<string, any>> {
    try {
      const startTime = Date.now();
      await this.makeRequest('GET', '/health', {}, false);
      const duration = (Date.now() - startTime) / 1000;

      return {
        status: 'healthy',
        response_time_seconds: duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
let __singleton: CodegenService | null = null;

function readFromLocalStorage(key: string): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) || '';
    }
  } catch (_) {
    // ignore
  }
  return '';
}

export function getRuntimeCodegenCredentials(): { api_token: string; org_id: string } {
  const lsToken = readFromLocalStorage('codegen_api_token');
  const lsOrg = readFromLocalStorage('codegen_org_id');

  const envToken = (import.meta as any)?.env?.VITE_CODEGEN_API_TOKEN || '';
  const envOrg = (import.meta as any)?.env?.VITE_CODEGEN_ORG_ID || '';

  return {
    api_token: lsToken || envToken || '',
    org_id: lsOrg || envOrg || '',
  };
}

export function setCodegenCredentials(api_token: string, org_id: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('codegen_api_token', api_token || '');
      window.localStorage.setItem('codegen_org_id', org_id || '');
    }
  } catch (_) {
    // ignore storage errors
  }
  // Reset singleton so next call re-initializes with new creds
  __singleton = null;
}

function getDefaultBaseUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const host = window.location?.hostname || '';
      if (host === 'localhost' || host === '127.0.0.1') {
        // Use Vite dev proxy in local development
        return '/codegen';
      }
    }
  } catch (_) {
    // ignore
  }
  return 'https://api.codegen.com/v1';
}

export function getCodegenService(): CodegenService {
  if (!__singleton) {
    const creds = getRuntimeCodegenCredentials();
    const base_url = readFromLocalStorage('codegen_base_url') || getDefaultBaseUrl();
    __singleton = new CodegenService({ api_token: creds.api_token, org_id: creds.org_id, base_url });
  }
  return __singleton;
}
