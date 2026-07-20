import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the static build works on any host (GitHub Pages, Netlify, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
});
