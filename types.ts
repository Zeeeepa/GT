// --- Project Catalog Types ---

export interface ProjectRepository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    owner: {
      login: string;
    };
    private: boolean;
    updated_at: string;
    fork: boolean;
    default_branch: string;
    parent?: {
        full_name: string;
        html_url: string;
    };
}

export interface ProjectList {
  id: string;
  name: string;
  color?: string;
}
  
export type ProjectView = { type: 'all' } | { type: 'list'; list: ProjectList & { item_count?: number } };


// --- Search Feature Types ---

export interface RepoOwner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface SearchGithubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: RepoOwner;
  html_url:string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  size: number; // in KB
}

export interface TextMatchMatch {
  text: string;
  indices: [number, number];
}

export interface TextMatch {
  object_url: string;
  object_type: string;
  property: string;
  fragment: string;
  matches: TextMatchMatch[];
}

export interface SearchGithubCodeItem {
    name: string;
    path: string;
    html_url: string;
    repository: {
        full_name: string;
        html_url: string;
        owner: RepoOwner;
    };
    text_matches?: TextMatch[];
}

export interface SearchGithubUser {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
}

// NPM Types
export interface NpmPublisher {
    username: string;
    email: string;
}

export interface NpmPackage {
    name: string;
    version: string;
    description: string;
    publisher?: NpmPublisher;
    date: string;
    license?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    // Enhanced data from search API
    downloads?: {
        monthly: number;
        weekly: number;
    };
    dependents?: string; // Number as string from API
    updated?: string;
    score?: {
        final: number;
        detail: {
            quality: number;
            popularity: number;
            maintenance: number;
        };
    };
    // Additional package details
    unpackedSize?: number;
    fileCount?: number;
    dependencies?: Record<string, string>;
}

export interface NpmPackageDetail extends NpmPackage {
    license: string;
    unpackedSize: number;
    fileCount: number;
    homepage?: string;
    dependencies?: Record<string, string>;
}

export interface FileNode {
    type: 'file' | 'directory';
    name: string;
    path: string;
    files?: FileNode[];
}

// Search Parameter Types
export type SearchProvider = 'github' | 'npm';
export type GithubSearchType = 'repositories' | 'code' | 'users' | 'trending';
export type NpmSearchType = 'packages';
export type SearchType = GithubSearchType | NpmSearchType;
export type TrendingDateRange = 'day' | 'week' | 'month';

export type SortOption = 'stars' | 'forks' | 'updated' | 'size' | 'followers' | 'repositories' | 'joined' | 'indexed' | '' | 'repo-size' | 'package-size' | 'newest-updated';

export interface SearchParams {
  query: string;
  startDate: string;
  endDate: string;
  limit: number;
  sort: SortOption;
  searchType: SearchType;
  provider: SearchProvider;
  githubToken: string | null;
  trendingDateRange?: TrendingDateRange;
  language?: string;
  isChineseFilter?: boolean;
}

export interface GroupedCodeResult {
  repository: {
    full_name: string;
    html_url: string;
    owner: RepoOwner;
    size?: number;
  };
  files: SearchGithubCodeItem[];
  total_matches: number;
}

export type SearchResult = SearchGithubRepo | SearchGithubCodeItem | SearchGithubUser | NpmPackage;

// --- Codegen Agent Types ---

export interface AgentRunStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'failed' | 'running' | 'pending';
  timestamp: string;
  details?: string;
  logs?: string[];
  duration?: number; // in milliseconds
  error?: string;
}

// Repository type for project context
export interface CodegenRepository {
  id: number;
  name: string;
  full_name?: string;
  description?: string;
  url?: string;
  html_url?: string;
  language?: string;
  default_branch?: string;
  created_at?: string;
  updated_at?: string;
  visibility?: 'public' | 'private' | 'internal';
}

// API Response Types based on Codegen API
export interface AgentRunResponse {
  id: number;
  organization_id: number;
  status: string;
  created_at: string;
  web_url: string;
  result?: string;
  prompt?: string;
  summary?: string;
  steps?: AgentRunStep[];
  repository_id?: number;
  repository?: CodegenRepository;
  parent_run_id?: number; // For resumed runs
  metadata?: {
    repository_id?: number;
    repository_name?: string;
    [key: string]: any;
  };
  github_pull_requests?: {
    id: number;
    title: string;
    url: string;
    created_at: string;
  }[];
}

export interface UserResponse {
  id: number;
  email?: string;
  github_user_id: string;
  github_username: string;
  avatar_url?: string;
  full_name?: string;
}

export interface OrganizationResponse {
  id: number;
  name: string;
  settings: {
    enable_pr_creation: boolean;
    enable_rules_detection: boolean;
  };
}

export interface CodegenRepository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    github_id: string;
    organization_id: number;
    visibility: string | null;
    archived: boolean | null;
    setup_status: string;
    language: string | null;
}

// API Request Types
export interface CreateAgentRunRequest {
  prompt: string;
  images?: string[]; // Base64 encoded data URIs
  repo_id?: number | null;
}

export interface ResumeAgentRunRequest {
  agent_run_id: number;
  prompt: string;
  images?: string[];
}

export interface StopAgentRunRequest {
  agent_run_id: number;
}

// Paginated Response Type
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Agent Run Status Types (matching backend AgentRunStatusType)
export enum AgentRunStatus {
  ACTIVE = "ACTIVE",
  ERROR = "ERROR",
  EVALUATION = "EVALUATION",
  COMPLETE = "COMPLETE",
  CANCELLED = "CANCELLED",
  TIMEOUT = "TIMEOUT",
  MAX_ITERATIONS_REACHED = "MAX_ITERATIONS_REACHED",
  OUT_OF_TOKENS = "OUT_OF_TOKENS",
  FAILED = "FAILED",
  PAUSED = "PAUSED",
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  PROCESSING = "PROCESSING",
  INITIALIZING = "INITIALIZING",
  RESUMED = "RESUMED",
}

// Local Cache Types
export interface CachedAgentRun extends AgentRunResponse {
  lastUpdated: string;
  organizationName?: string;
  isPolling?: boolean;
}

export interface CachedOrganization extends OrganizationResponse {
  lastUpdated: string;
  isDefault?: boolean;
}

export interface CachedUser extends UserResponse {
  lastUpdated: string;
  organizationId: number;
}

// Filter and Search Types
export interface AgentRunFilters {
  status?: AgentRunStatus[];
  organizationId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface SortOptions {
  field: "created_at" | "status" | "organization_id";
  direction: "asc" | "desc";
}

// Error Types
export interface APIError {
  message: string;
  status_code: number;
  details?: string;
}

// Cache Metadata
export interface CacheMetadata {
  lastSync: string;
  version: string;
  organizationId?: number;
}

// Status Change Tracking
export interface AgentRunStatusChange {
  agentRunId: number;
  organizationId: number;
  oldStatus: string | null;
  newStatus: string;
  timestamp: string;
  webUrl: string;
}

// Tracked Agent Run
export interface TrackedAgentRun {
  id: number;
  organizationId: number;
  lastKnownStatus: string | null;
  createdAt: string;
  webUrl: string;
  addedAt: string; // When it was added to tracking
}

// API Request Types
export interface ResumeAgentRunRequest {
  agent_run_id: number;
  prompt: string;
  images?: string[];
  metadata?: Record<string, any>;
}
