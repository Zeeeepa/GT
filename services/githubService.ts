// API service for GitHub API

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

// Get repositories for the authenticated user
export const getRepositories = async () => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch repositories: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
};

// Search repositories
export const searchRepositories = async (query: string) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to search repositories: ${response.status}`);
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error searching repositories:', error);
    throw error;
  }
};

// Get repository details
export const getRepository = async (owner: string, repo: string) => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch repository: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching repository:', error);
    throw error;
  }
};

