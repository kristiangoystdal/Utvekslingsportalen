import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vuetify': ['vuetify', 'vuetify/components', 'vuetify/directives'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/storage', 'firebase/functions'],
          'vendor': ['vue', 'vue-router', 'vuex', 'vue-i18n'],
        },
      },
    },
  },
});
