// API service for Codegen API

const API_BASE_URL = 'https://api.codegen.com/v1';
const CODEGEN_TOKEN = import.meta.env.VITE_CODEGEN_TOKEN;
const CODEGEN_ORG_ID = import.meta.env.VITE_CODEGEN_ORG_ID;

interface ResumeAgentRunParams {
  prompt: string;
  additionalContext?: string;
}

interface CreateAgentRunParams {
  repository: string;
  prompt: string;
}

// Get agent run details
export const getAgentRun = async (runId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agent-runs/${runId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CODEGEN_TOKEN}`,
        'X-Organization-ID': CODEGEN_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch agent run: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching agent run:', error);
    throw error;
  }
};

// Resume an agent run
export const resumeAgentRun = async (runId: string, params: ResumeAgentRunParams) => {
  try {
    // Validate input
    if (!params.prompt || params.prompt.trim() === '') {
      throw new Error('Prompt is required');
    }

    const response = await fetch(`${API_BASE_URL}/agent-runs/${runId}/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CODEGEN_TOKEN}`,
        'X-Organization-ID': CODEGEN_ORG_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: params.prompt,
        additionalContext: params.additionalContext || ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to resume agent run: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error resuming agent run:', error);
    throw error;
  }
};

// Create a new agent run
export const createAgentRun = async (params: CreateAgentRunParams) => {
  try {
    // Validate input
    if (!params.repository || params.repository.trim() === '') {
      throw new Error('Repository is required');
    }

    if (!params.prompt || params.prompt.trim() === '') {
      throw new Error('Prompt is required');
    }

    const response = await fetch(`${API_BASE_URL}/agent-runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CODEGEN_TOKEN}`,
        'X-Organization-ID': CODEGEN_ORG_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repository: params.repository,
        prompt: params.prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create agent run: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating agent run:', error);
    throw error;
  }
};

// List agent runs
export const listAgentRuns = async (params?: { status?: string; page?: number; limit?: number }) => {
  try {
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
    
    const response = await fetch(`${API_BASE_URL}/agent-runs${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CODEGEN_TOKEN}`,
        'X-Organization-ID': CODEGEN_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to list agent runs: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing agent runs:', error);
    throw error;
  }
};

