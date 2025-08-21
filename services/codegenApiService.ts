// API service for Codegen API
import { getAPIClient } from './apiClient';

const CODEGEN_ORG_ID = import.meta.env.VITE_CODEGEN_ORG_ID;

interface ResumeAgentRunParams {
  prompt: string;
  additionalContext?: string;
  images?: string[];
  metadata?: Record<string, any>;
}

interface CreateAgentRunParams {
  repository: string;
  prompt: string;
  images?: string[];
}

// Get agent run details
export const getAgentRun = async (runId: string) => {
  try {
    const apiClient = getAPIClient();
    return await apiClient.getAgentRun(CODEGEN_ORG_ID, runId);
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

    const apiClient = getAPIClient();
    return await apiClient.resumeAgentRun(CODEGEN_ORG_ID, runId, {
      prompt: params.prompt,
      images: params.images,
      metadata: {
        additionalContext: params.additionalContext || '',
        ...params.metadata
      }
    });
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

    const apiClient = getAPIClient();
    return await apiClient.createAgentRun(CODEGEN_ORG_ID, {
      repository: params.repository,
      prompt: params.prompt,
      images: params.images
    });
  } catch (error) {
    console.error('Error creating agent run:', error);
    throw error;
  }
};

// List agent runs
export const listAgentRuns = async (params?: { status?: string; page?: number; limit?: number }) => {
  try {
    const apiClient = getAPIClient();
    return await apiClient.listAgentRuns(CODEGEN_ORG_ID, params);
  } catch (error) {
    console.error('Error listing agent runs:', error);
    throw error;
  }
};

// Re-export the getAPIClient function
export { getAPIClient } from './apiClient';

