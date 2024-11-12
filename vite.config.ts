import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasm from 'vite-plugin-wasm'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    wasm(),
    svelte(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,

      manifest: {
        name: 'Grocery List',
        short_name: 'Grocery',
        background_color: '#ffffff',
        start_url: '/',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-512.png',
            type: 'image/png',
            purpose: 'maskable',
            sizes: '512x512'
          },
          { src: '/icon-512.png', type: 'image/png', sizes: '512x512' },
          { src: '/icon-192.png', type: 'image/png', sizes: '192x192' }
        ]
      },

      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}']
      },

      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        type: 'module'
      }
    })
  ],
  build: {
    target: 'esnext'
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  },
  worker: {
    format: 'es',
    plugins: () => [wasm()]
  }
})
