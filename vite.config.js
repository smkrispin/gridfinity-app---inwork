import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // This tells Vite to build the worker as a modern ES Module
  // which prevents it from trying to use 'window' or 'document'
  worker: {
    format: 'es',
  },

  build: {
    outDir: 'build', // Ensures it matches your Docker COPY command
    assetsInlineLimit: 0, // Keeps WASM and Worker as separate files
  }
});