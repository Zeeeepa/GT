import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAgentRun, resumeAgentRun, createAgentRun, listAgentRuns } from '../../services/codegenApiService';

// Mock fetch for integration tests
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  // Mock getAgentRun
  http.get('https://api.codegen.com/v1/agent-runs/:runId', () => {
    return HttpResponse.json({
      id: 'test-run-id',
      status: 'completed',
      prompt: 'Test prompt',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T01:00:00Z'
    });
  }),
  
  // Mock resumeAgentRun
  http.post('https://api.codegen.com/v1/agent-runs/:runId/resume', async ({ request }) => {
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
      additionalContext: body.additionalContext || '',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T02:00:00Z'
    });
  }),
  
  // Mock createAgentRun
  http.post('https://api.codegen.com/v1/agent-runs', async ({ request }) => {
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
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    });
  }),
  
  // Mock listAgentRuns
  http.get('https://api.codegen.com/v1/agent-runs', ({ request }) => {
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
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Agent API Integration Tests', () => {
  describe('getAgentRun', () => {
    it('should fetch agent run details', async () => {
      const run = await getAgentRun('test-run-id');
      
      expect(run).toBeDefined();
      expect(run.id).toBe('test-run-id');
      expect(run.status).toBe('completed');
      expect(run.prompt).toBe('Test prompt');
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
  });
});
