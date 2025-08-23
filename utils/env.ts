import { LocalStorage } from './storage';

// Load environment variables from .env file
export const loadEnvironmentVariables = async (): Promise<void> => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // In browser, we need to check if we have environment variables from Vite
      const codegenOrgId = import.meta.env.VITE_CODEGEN_ORG_ID || import.meta.env.CODEGEN_ORG_ID;
      const codegenApiToken = import.meta.env.VITE_CODEGEN_API_TOKEN || import.meta.env.CODEGEN_API_TOKEN;
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN;

      console.log('Environment variables loaded:', {
        codegenOrgId: codegenOrgId ? 'Found' : 'Not found',
        codegenApiToken: codegenApiToken ? 'Found' : 'Not found',
        githubToken: githubToken ? 'Found' : 'Not found',
      });

      // Only set if not already set in localStorage
      if (codegenOrgId && !(await LocalStorage.getItem('codegenOrgId'))) {
        await LocalStorage.setItem('codegenOrgId', codegenOrgId);
      }
      
      if (codegenApiToken && !(await LocalStorage.getItem('codegenToken'))) {
        await LocalStorage.setItem('codegenToken', codegenApiToken);
      }
      
      if (githubToken && !(await LocalStorage.getItem('githubToken'))) {
        await LocalStorage.setItem('githubToken', githubToken);
      }
    }
  } catch (error) {
    console.error('Error loading environment variables:', error);
  }
};

// Export environment variables for direct access
export const getEnvVars = async () => {
  return {
    CODEGEN_ORG_ID: await LocalStorage.getItem('codegenOrgId'),
    CODEGEN_API_TOKEN: await LocalStorage.getItem('codegenToken'),
    GITHUB_TOKEN: await LocalStorage.getItem('githubToken'),
  };
};

