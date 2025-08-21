import { ProjectRepository } from '../types';

const GITHUB_API_BASE_URL = '/api/github';

export class GithubApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'GithubApiError';
    }
}

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GithubApiError(`GitHub API error: ${errorData.message || response.statusText}`, response.status);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
}

async function paginatedFetch<T>(url: string, token: string, allItems: T[] = []): Promise<T[]> {
    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
    const response = await fetch(url, { headers, mode: 'cors' });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new GithubApiError(`GitHub API error: ${errorData.message || response.statusText}`, response.status);
    }

    const items: T[] = await response.json();
    const combinedItems = allItems.concat(items);

    const linkHeader = response.headers.get('Link');
    if (linkHeader) {
        const nextLink = linkHeader.split(',').find(s => s.includes('rel="next"'));
        if (nextLink) {
            const nextUrl = nextLink.match(/<(.+)>/)?.[1];
            if (nextUrl) {
                // The nextUrl from GitHub is absolute, so we need to make it relative to our proxy
                const relativeUrl = nextUrl.replace('https://api.github.com', GITHUB_API_BASE_URL);
                return paginatedFetch(relativeUrl, token, combinedItems);
            }
        }
    }
    return combinedItems;
}

export async function fetchRepositories(token: string): Promise<ProjectRepository[]> {
    const initialUrl = `${GITHUB_API_BASE_URL}/user/repos?type=owner&per_page=100&sort=updated`;
    return paginatedFetch<ProjectRepository>(initialUrl, token);
}

export async function deleteRepository(owner: string, repoName: string, token: string): Promise<void> {
  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repoName}`;
  const response = await fetch(url, {
    method: 'DELETE',
    mode: 'cors',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new GithubApiError(`Failed to delete repository. Status: ${response.status}. Message: ${errorData.message || 'No error message from API.'}`, response.status);
  }
}

export async function syncFork(owner: string, repoName: string, branch: string, token: string): Promise<any> {
  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repoName}/merge-upstream`;
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch }),
  });
  
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
      throw new GithubApiError(responseBody.message || `Failed to sync fork. Status: ${response.status}`, response.status);
  }

  return responseBody;
}