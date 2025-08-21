import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_CODEGEN_TOKEN: 'mock-codegen-token',
    VITE_CODEGEN_ORG_ID: '123',
    VITE_GITHUB_TOKEN: 'mock-github-token',
  },
});

// Create MSW server for API mocking
const server = setupServer(
  // Mock the resume agent run endpoint
  http.post('https://api.codegen.com/v1/agent-runs/:runId/resume', async ({ params, request }) => {
    const { runId } = params;
    const body = await request.json();
    
    // Validate input
    if (!body.prompt || body.prompt.trim() === '') {
      return new HttpResponse(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400 }
      );
    }
    
    // Handle invalid run ID
    if (runId === 'invalid-run-id') {
      return new HttpResponse(
        JSON.stringify({ error: 'Run not found' }),
        { status: 404 }
      );
    }
    
    // Return successful response
    return HttpResponse.json({
      id: 'resumed-run-id',
      originalRunId: runId,
      status: 'running',
      prompt: body.prompt,
      additionalContext: body.additionalContext || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }),
  
  // Mock other API endpoints as needed
  http.get('https://api.codegen.com/v1/agent-runs/:runId', ({ params }) => {
    const { runId } = params;
    
    if (runId === 'invalid-run-id') {
      return new HttpResponse(
        JSON.stringify({ error: 'Run not found' }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      id: runId,
      status: 'completed',
      prompt: 'Original prompt',
      createdAt: '2025-08-20T12:00:00Z',
      updatedAt: '2025-08-20T12:05:00Z'
    });
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

