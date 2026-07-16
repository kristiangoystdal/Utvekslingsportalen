import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

// @mdi/font ships its @font-face without font-display, which blocks text
// rendering until the icon font loads. Inject font-display: swap so icon
// glyphs don't hold up the page's first paint.
function mdiFontDisplaySwap() {
  return {
    name: 'mdi-font-display-swap',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@mdi/font') || !id.endsWith('.css')) return null;
      return code.replace(/@font-face\s*{/, '@font-face {\n  font-display: swap;');
    },
  };
}

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    mdiFontDisplaySwap(),
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
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/storage', 'firebase/functions'],
          'vendor': ['vue', 'vue-router', 'vuex', 'vue-i18n'],
        },
      },
    },
  },
});
