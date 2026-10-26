import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the game work from any sub-folder (GitHub Pages, a USB stick, etc.)
export default defineConfig({
  base: './',
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
