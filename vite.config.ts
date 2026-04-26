import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
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
