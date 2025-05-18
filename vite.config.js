import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/dicoding--fe-mid-last-submission/',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['leaflet'],
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.gif'],
});

