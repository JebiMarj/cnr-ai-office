import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone static build. Do not point this at the C&R AI Office Render service.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Keep font files separate so the stylesheet stays free of inlined font bytes.
    assetsInlineLimit: 0,
  },
});
