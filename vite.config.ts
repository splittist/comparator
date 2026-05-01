import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const commitFull = process.env.CF_PAGES_COMMIT_SHA ?? process.env.VITE_APP_COMMIT_SHA ?? 'dev';
const commitShort = commitFull === 'dev' ? 'dev' : commitFull.slice(0, 7);
const branchName = process.env.CF_PAGES_BRANCH ?? process.env.VITE_APP_BRANCH ?? '';
const deploymentId =
  process.env.CF_PAGES_DEPLOYMENT_ID ?? process.env.VITE_APP_DEPLOYMENT_ID ?? '';

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_COMMIT_FULL__: JSON.stringify(commitFull),
    __APP_COMMIT_SHORT__: JSON.stringify(commitShort),
    __APP_BRANCH__: JSON.stringify(branchName),
    __APP_DEPLOYMENT_ID__: JSON.stringify(deploymentId),
  },
  resolve: {
    dedupe: ['vue', 'pinia'],
  },
  optimizeDeps: {
    include: ['superdoc', 'pinia', 'vue'],
    exclude: [],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          superdoc: ['superdoc'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
