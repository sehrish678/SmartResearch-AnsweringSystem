// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Fix global/process errors
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.cwd': JSON.stringify('/'),  // Changed: Must be a string, not a function
  },

  // Prevent Vite from trying to bundle Node.js-only deps
  optimizeDeps: {
    exclude: ['simple-spellchecker'],
  },

  // Aliases to shim Node.js built-ins
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'src/browser-shims/fs.js'),
      path: path.resolve(__dirname, 'src/browser-shims/path.js'),
      os: path.resolve(__dirname, 'src/browser-shims/os.js'),
    },
  },

  build: {
    rollupOptions: {
      external: ['simple-spellchecker'],
    },
  },
});