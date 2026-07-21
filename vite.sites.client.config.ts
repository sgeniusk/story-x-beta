import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function cleanSitesDist(): Plugin {
  return {
    name: 'storyx-sites-clean-dist',
    buildStart() {
      rmSync(resolve(process.cwd(), 'dist'), { recursive: true, force: true });
    }
  };
}

export default defineConfig({
  plugins: [cleanSitesDist(), react()],
  define: {
    'import.meta.env.VITE_STORYX_AI_RUNTIME': JSON.stringify('disabled')
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true
  }
});
