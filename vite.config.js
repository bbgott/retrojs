import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  root: '.',
  publicDir: 'static',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    react(),
  ],
});