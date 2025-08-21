// Setup environment variables for visual component tests
process.env.VITE_GITHUB_TOKEN = 'github_pat_PLACEHOLDER_TOKEN';
process.env.VITE_CODEGEN_TOKEN = 'sk-PLACEHOLDER_TOKEN';
process.env.VITE_CODEGEN_ORG_ID = '323';

export default async function globalSetup() {
  // Any additional setup can go here
}

