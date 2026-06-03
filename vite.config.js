import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
  server: {
    watch: {
      // Don't crash the dev server when the installer build writes temp
      // files into these folders.
      ignored: ['**/release/**', '**/dist/**', '**/release-builds/**'],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
});
