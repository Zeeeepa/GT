import { vi } from 'vitest';

// Use environment variables (placeholders for security)
vi.stubGlobal('import.meta', {
  env: {
    VITE_GITHUB_TOKEN: 'github_pat_PLACEHOLDER_TOKEN',
    VITE_CODEGEN_TOKEN: 'sk-PLACEHOLDER_TOKEN',
    VITE_CODEGEN_ORG_ID: '323'
  }
});
