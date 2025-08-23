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

// --- Codegen API Types ---

export enum SourceType {
  LOCAL = "LOCAL",
  SLACK = "SLACK",
  GITHUB = "GITHUB",
  GITHUB_CHECK_SUITE = "GITHUB_CHECK_SUITE",
  LINEAR = "LINEAR",
  API = "API",
  CHAT = "CHAT",
  JIRA = "JIRA"
}

export enum MessageType {
  ACTION = "ACTION",
  PLAN_EVALUATION = "PLAN_EVALUATION",
  FINAL_ANSWER = "FINAL_ANSWER",
  ERROR = "ERROR",
  USER_MESSAGE = "USER_MESSAGE",
  USER_GITHUB_ISSUE_COMMENT = "USER_GITHUB_ISSUE_COMMENT",
  INITIAL_PR_GENERATION = "INITIAL_PR_GENERATION",
  DETECT_PR_ERRORS = "DETECT_PR_ERRORS",
  FIX_PR_ERRORS = "FIX_PR_ERRORS",
  PR_CREATION_FAILED = "PR_CREATION_FAILED",
  PR_EVALUATION = "PR_EVALUATION",
  COMMIT_EVALUATION = "COMMIT_EVALUATION",
  AGENT_RUN_LINK = "AGENT_RUN_LINK"
}

export enum AgentRunStatus {
  PENDING = "pending",
  RUNNING = "running", 
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused"
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO", 
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL"
}

export interface User {
  id: number;
  email?: string;
  github_user_id: string;
  github_username: string;
  avatar_url?: string;
  full_name?: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  url: string;
  owner: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  updated_at?: string;
}

export interface CodegenRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  url: string;
  owner: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  updated_at?: string;
}

export interface GithubPullRequest {
  id: number;
  title: string;
  url: string;
  created_at: string;
  number?: number;
  state?: string;
}

export interface AgentRun {
  id: number;
  organization_id: number;
  status: AgentRunStatus;
  created_at: string;
  updated_at?: string;
  web_url?: string;
  result?: string;
  source_type?: SourceType;
  github_pull_requests?: GithubPullRequest[];
  metadata?: Record<string, any>;
  prompt?: string;
  user_id?: number;
}

export interface AgentRunLog {
  agent_run_id: number;
  created_at: string;
  message_type: MessageType;
  thought?: string;
  tool_name?: string;
  tool_input?: Record<string, any>;
  tool_output?: Record<string, any>;
  observation?: Record<string, any> | string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  avatar_url?: string;
  created_at: string;
}

export interface Integration {
  id: number;
  type: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  config?: Record<string, any>;
  created_at: string;
}

export interface SetupCommand {
  id: string;
  command: string;
  description: string;
  required: boolean;
}

export interface SandboxAnalysis {
  id: string;
  status: 'analyzing' | 'completed' | 'failed';
  results?: {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// API Request Interfaces
export interface CreateAgentRunRequest {
  prompt: string;
  images?: string[];
  metadata?: Record<string, any>;
  repo_id?: number;
}

export interface ResumeAgentRunRequest {
  agent_run_id: number;
  prompt: string;
  images?: string[];
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
