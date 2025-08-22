/**
 * Integration tests for the Agent API
 * 
 * These tests verify that the API client correctly interacts with the Codegen API,
 * including proper handling of parameters, responses, and errors.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { getAgentRun, resumeAgentRun, createAgentRun, listAgentRuns } from '../../services/codegenApiService';
import { APIClient } from '../../services/apiClient';

// Mock fetch for integration tests
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Create handlers for API endpoints
const handlers = [
  // Mock getAgentRun
  http.get('https://api.codegen.com/v1/organizations/:orgId/agent-runs/:runId', () => {
    return HttpResponse.json({
      id: 'test-run-id',
      status: 'completed',
      prompt: 'Test prompt',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T01:00:00Z'
    });
  }),
  
  // Mock resumeAgentRun
  http.post('https://api.codegen.com/v1/organizations/:orgId/agent-runs/:runId/resume', async ({ request }) => {
    const body = await request.json();
    
    if (!body.prompt) {
      return new HttpResponse(
        JSON.stringify({ message: 'Prompt is required' }),
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      id: 'test-run-id',
      status: 'running',
      prompt: body.prompt,
      additionalContext: body.metadata?.additionalContext || '',
      images: body.images || [],
      metadata: body.metadata || {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T02:00:00Z'
    });
  }),
  
  // Mock createAgentRun
  http.post('https://api.codegen.com/v1/organizations/:orgId/agent-runs', async ({ request }) => {
    const body = await request.json();
    
    if (!body.repository) {
      return new HttpResponse(
        JSON.stringify({ message: 'Repository is required' }),
        { status: 400 }
      );
    }
    
    if (!body.prompt) {
      return new HttpResponse(
        JSON.stringify({ message: 'Prompt is required' }),
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      id: 'new-run-id',
      status: 'running',
      repository: body.repository,
      prompt: body.prompt,
      images: body.images || [],
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    });
  }),
  
  // Mock listAgentRuns
  http.get('https://api.codegen.com/v1/organizations/:orgId/agent-runs', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    
    const runs = [
      {
        id: 'run-1',
        status: 'completed',
        prompt: 'First prompt',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T01:00:00Z'
      },
      {
        id: 'run-2',
        status: 'running',
        prompt: 'Second prompt',
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T01:00:00Z'
      }
    ];
    
    // Filter by status if provided
    const filteredRuns = status 
      ? runs.filter(run => run.status === status)
      : runs;
    
    return HttpResponse.json({
      data: filteredRuns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredRuns.length
      }
    });
  }),
  
  // Fallback handler for any unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return new HttpResponse(
      JSON.stringify({ message: 'Not Found' }),
      { status: 404 }
    );
  })
];

// Create and configure the mock server
const server = setupServer(...handlers);

// Set up and tear down the mock server
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

// Set environment variables for testing
process.env.VITE_CODEGEN_TOKEN = 'test-token';
process.env.VITE_CODEGEN_ORG_ID = '123';

describe('Agent API Integration Tests', () => {
  describe('getAgentRun', () => {
    it('should fetch agent run details', async () => {
      const run = await getAgentRun('test-run-id');
      
      expect(run).toBeDefined();
      expect(run.id).toBe('test-run-id');
      expect(run.status).toBe('completed');
      expect(run.prompt).toBe('Test prompt');
    });
    
    it('should handle API errors gracefully', async () => {
      // Override the handler for this test
      server.use(
        http.get('https://api.codegen.com/v1/organizations/:orgId/agent-runs/:runId', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'Agent run not found' }),
            { status: 404 }
          );
        })
      );
      
      await expect(getAgentRun('non-existent-id')).rejects.toThrow();
    });
  });
  
  describe('resumeAgentRun', () => {
    it('should resume an agent run with valid parameters', async () => {
      const result = await resumeAgentRun('test-run-id', {
        prompt: 'Continue the task',
        additionalContext: 'Some additional context'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-run-id');
      expect(result.status).toBe('running');
      expect(result.prompt).toBe('Continue the task');
      expect(result.additionalContext).toBe('Some additional context');
    });
    
    it('should support images and metadata parameters', async () => {
      const result = await resumeAgentRun('test-run-id', {
        prompt: 'Continue the task with images',
        images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='],
        metadata: { key: 'value' }
      });
      
      expect(result).toBeDefined();
      expect(result.images).toBeDefined();
      expect(result.images).toHaveLength(1);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.key).toBe('value');
    });
    
    it('should throw an error when prompt is missing', async () => {
      await expect(resumeAgentRun('test-run-id', {
        prompt: ''
      })).rejects.toThrow('Prompt is required');
    });
  });
  
  describe('createAgentRun', () => {
    it('should create a new agent run with valid parameters', async () => {
      const result = await createAgentRun({
        repository: 'org/repo',
        prompt: 'Create a new feature'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe('new-run-id');
      expect(result.status).toBe('running');
      expect(result.repository).toBe('org/repo');
      expect(result.prompt).toBe('Create a new feature');
    });
    
    it('should support images parameter', async () => {
      const result = await createAgentRun({
        repository: 'org/repo',
        prompt: 'Create a new feature',
        images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']
      });
      
      expect(result).toBeDefined();
      expect(result.images).toBeDefined();
      expect(result.images).toHaveLength(1);
    });
    
    it('should throw an error when repository is missing', async () => {
      await expect(createAgentRun({
        repository: '',
        prompt: 'Create a new feature'
      })).rejects.toThrow('Repository is required');
    });
    
    it('should throw an error when prompt is missing', async () => {
      await expect(createAgentRun({
        repository: 'org/repo',
        prompt: ''
      })).rejects.toThrow('Prompt is required');
    });
  });
  
  describe('listAgentRuns', () => {
    it('should list all agent runs', async () => {
      const result = await listAgentRuns();
      
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
    });
    
    it('should filter agent runs by status', async () => {
      const result = await listAgentRuns({ status: 'completed' });
      
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('completed');
    });
    
    it('should support pagination parameters', async () => {
      const result = await listAgentRuns({ page: 2, limit: 5 });
      
      expect(result).toBeDefined();
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
    });
  });
  
  describe('APIClient', () => {
    it('should handle network errors gracefully', async () => {
      // Create a client with an invalid URL
      const client = new APIClient('https://invalid-url.example.com', 'test-token');
      
      // Mock fetch to simulate a network error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await expect(client.getAgentRun('123', 'test-run-id')).rejects.toThrow();
      } finally {
        // Restore fetch
        global.fetch = originalFetch;
      }
    });
  });
});
