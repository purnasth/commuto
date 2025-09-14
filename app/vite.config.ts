import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Commuto',
        short_name: 'Commuto',
        description:
          'Commuto - Connecting co-workers and students sharing the same route to reduce carbon footprint and promote sustainable commuting.',
        theme_color: '#5eead4',
        icons: [
          {
            src: 'app-icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in development
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    proxy: {
      // Only proxy /logs and its subpaths, not /logs-dashboard
      '^/logs($|/)': 'http://localhost:3000',
    },
  },
});
