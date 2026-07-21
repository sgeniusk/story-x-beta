import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    ssr: 'sites/worker.ts',
    outDir: 'dist/server',
    emptyOutDir: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'index.js'
      }
    }
  }
});
