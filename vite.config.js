import { defineConfig } from 'vite';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
  define: {
    // Make environment variables available to the client
    'import.meta.env.CODEGEN_ORG_ID': JSON.stringify(process.env.CODEGEN_ORG_ID),
    'import.meta.env.CODEGEN_API_TOKEN': JSON.stringify(process.env.CODEGEN_API_TOKEN),
    'import.meta.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN),
  }
});
