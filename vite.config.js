// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/', 
  
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.cwd': JSON.stringify('/'),
  },
  
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'src/browser-shims/fs.js'),
      path: path.resolve(__dirname, 'src/browser-shims/path.js'),
      os: path.resolve(__dirname, 'src/browser-shims/os.js'),
    },
  },
});