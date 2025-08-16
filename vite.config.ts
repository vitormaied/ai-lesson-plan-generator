import path from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3003', // This will be the Vercel CLI dev server
        changeOrigin: true,
      },
    },
  },
});