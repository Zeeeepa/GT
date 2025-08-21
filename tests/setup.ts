import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_CODEGEN_TOKEN: 'mock-codegen-token',
    VITE_CODEGEN_ORG_ID: '123',
    VITE_GITHUB_TOKEN: 'mock-github-token',
  },
});

// Mock fetch API
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Reset mocks between tests
beforeEach(() => {
  vi.resetAllMocks();
  localStorageMock.clear();
});
