import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/** GitHub Pages project site: https://<user>.github.io/bc-tigers/ */
const githubPagesBase =
  process.env.GITHUB_PAGES === 'true' ? '/bc-tigers/' : '/';

export default defineConfig({
  base: githubPagesBase,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/src/pages/admin/')) return 'pages-admin';
            if (
              id.includes('/src/pages/coach/') ||
              id.includes('/src/pages/referee/') ||
              id.includes('/src/pages/player/')
            ) {
              return 'pages-portals';
            }
            if (id.includes('/src/pages/auth/')) return 'pages-auth';
            return;
          }
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('/react/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('axios') || id.includes('zustand') || id.includes('socket.io-client')) {
            return 'vendor-data';
          }
          if (id.includes('motion')) return 'vendor-motion';
          if (
            id.includes('lucide-react') ||
            id.includes('@radix-ui') ||
            id.includes('react-hook-form') ||
            id.includes('zod')
          ) {
            return 'vendor-ui';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
