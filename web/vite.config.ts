import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasm from 'vite-plugin-wasm'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

const time = JSON.stringify(
  (() => {
    const now = new Date()
    const day = String(now.getUTCDate()).padStart(2, '0')
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const year = now.getUTCFullYear()
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
  })()
)

export default defineConfig({
  define: {
    __BUILD_TIME__: time
  },
  plugins: [
    wasm(),
    svelte(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
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
        enabled: false,
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
      $src: path.resolve('./src'),
      $lib: path.resolve('./src/lib'),
      $stores: path.resolve('./src/stores')
    }
  },
  worker: {
    format: 'es',
    plugins: () => [wasm()]
  }
})
