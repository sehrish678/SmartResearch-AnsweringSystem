// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // THIS IS THE MAGIC THAT FIXES YOUR ERRORS
  define: {
    global: 'globalThis',           // Fixes "global is not defined"
    'process.env': {},              // Silences process.env errors
    'process.platform': '"browser"',// Some libs check this
    'process.cwd': () => '/',       // Mock current working directory
  },

  // Prevent Vite from trying to bundle Node.js-only deps
  optimizeDeps: {
    exclude: ['simple-spellchecker']
  },

  // Make sure these Node.js built-ins are completely ignored in the browser
  resolve: {
    alias: {
      // These will be replaced with empty mocks so the library doesn't crash
      fs: 'browser-shims/fs',           // We'll create this shim in a second
      path: 'browser-shims/path',
      os: 'browser-shims/os',
      crypto: 'crypto',                 // browser has native crypto
    }
  },

  build: {
    rollupOptions: {
      // Externalize problematic deps during build too
      external: ['simple-spellchecker']
    }
  }
});