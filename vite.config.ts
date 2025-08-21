
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      server: {
        proxy: {
          '/api/codegen': {
            target: 'https://api.codegen.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/codegen/, ''),
          },
          '/api/github': {
            target: 'https://api.github.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/github/, ''),
          },
          '/api/npm': {
            target: 'https://registry.npmjs.org',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/npm/, ''),
          },
          '/api/jsdelivr': {
            target: 'https://data.jsdelivr.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/jsdelivr/, ''),
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});