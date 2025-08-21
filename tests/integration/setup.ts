import { vi } from 'vitest';

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_GITHUB_TOKEN: 'mock-github-token',
    VITE_CODEGEN_TOKEN: 'mock-codegen-token',
    VITE_CODEGEN_ORG_ID: 'mock-org-id'
  }
});

