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
  // Vite automatically exposes variables prefixed with VITE_
  // No need to manually define them
});
