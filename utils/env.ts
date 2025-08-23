import { LocalStorage } from './storage';

// Load environment variables from .env file
export const loadEnvironmentVariables = async (): Promise<void> => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // In browser, we need to check if we have environment variables from Vite
      // Vite automatically exposes variables prefixed with VITE_
      const codegenOrgId = import.meta.env.VITE_CODEGEN_ORG_ID;
      const codegenApiToken = import.meta.env.VITE_CODEGEN_API_TOKEN;
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

      console.log('Environment variables loaded:', {
        codegenOrgId: codegenOrgId ? 'Found' : 'Not found',
        codegenApiToken: codegenApiToken ? 'Found' : 'Not found',
        githubToken: githubToken ? 'Found' : 'Not found',
      });

      // Always set the environment variables in localStorage
      // This ensures they're available even if they change
      if (codegenOrgId) {
        await LocalStorage.setItem('codegenOrgId', codegenOrgId);
        console.log('Stored CODEGEN_ORG_ID in localStorage');
      }
      
      if (codegenApiToken) {
        await LocalStorage.setItem('codegenToken', codegenApiToken);
        console.log('Stored CODEGEN_API_TOKEN in localStorage');
      }
      
      if (githubToken) {
        await LocalStorage.setItem('githubToken', githubToken);
        console.log('Stored GITHUB_TOKEN in localStorage');
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
