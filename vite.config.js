import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
    viteStaticCopy({
      targets: [
        { src: 'static/wasm_exec.js', dest: '.' },
        { src: 'static/main.wasm', dest: '.' },
      ],
    }),
  ],
});