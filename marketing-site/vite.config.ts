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
  },
});
