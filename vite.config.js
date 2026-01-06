import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: 'static',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'wasm_exec.js', dest: '.' },
        { src: 'main.wasm', dest: '.' },
      ],
    }),
  ],
});