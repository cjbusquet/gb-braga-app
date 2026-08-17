import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the SW manually (src/main.tsx via `virtual:pwa-register`)
      // so an update can force a one-time reload instead of silently leaving
      // an open tab running a stale bundle until the next navigation.
      injectRegister: false,

      // Assets to pre-cache alongside the app shell
      includeAssets: ['favicon.svg', 'logo.png', 'icons.svg'],

      // Web App Manifest — replaces public/manifest.json
      manifest: {
        name: 'Gracie Barra Braga',
        short_name: 'GB Braga',
        description: 'Portal de gestão e área do atleta — Gracie Barra Braga',
        theme_color: '#C8102E',
        background_color: '#F7F6F4',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'pt-PT',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Check-in',
            short_name: 'Check-in',
            url: '/checkin',
            icons: [{ src: '/logo.png', sizes: '96x96' }],
          },
          {
            name: 'Alunos',
            short_name: 'Alunos',
            url: '/alunos',
            icons: [{ src: '/logo.png', sizes: '96x96' }],
          },
        ],
      },

      // Workbox — cache strategies
      workbox: {
        // Serve index.html for all navigation requests (SPA fallback)
        navigateFallback: '/index.html',

        // Pre-cache all JS/CSS/HTML/assets produced by Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            // Google Fonts — cache-first
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Supabase REST API — network-first, fall back to cache (5 min TTL)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
            },
          },
          {
            // Supabase Storage (images, files) — stale-while-revalidate
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },

      // Don't run the SW in local dev (avoids confusion)
      devOptions: { enabled: false },
    }),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  build: {
    target: 'es2020',
    sourcemap: false,
  },

  server: {
    allowedHosts: ['kim-dorsispinal-ugly.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
      // Lets the app reach the local Supabase stack through the dev
      // server's own origin (see resolveSupabaseUrl in supabaseClient.ts) —
      // needed when the page is loaded via an ngrok tunnel or any other
      // non-localhost origin, since the browser can't otherwise reach
      // 127.0.0.1:54321 on the developer's machine.
      '/supabase': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/supabase/, ''),
      },
    },
  },
});
