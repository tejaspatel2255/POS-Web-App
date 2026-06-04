// File Path: d:/Projects/Web/Universal POS/vite.config.ts
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: false }, // disable in dev — causes slowness
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Universal POS',
        short_name: 'POS',
        description: 'Universal Multi-Tenant POS',
        theme_color: '#0f766e',
        background_color: '#fffbf5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'vendor'
            }
            if (id.includes('@supabase/')) {
              return 'supabase'
            }
            if (id.includes('@tanstack/')) {
              return 'query'
            }
            if (id.includes('recharts/')) {
              return 'charts'
            }
            if (id.includes('react-hook-form/') || id.includes('zod/') || id.includes('@hookform/')) {
              return 'forms'
            }
            if (id.includes('zustand/')) {
              return 'state'
            }
            return 'vendor-libs'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@tanstack/react-query', 'zustand', 'idb'],
  },
})
