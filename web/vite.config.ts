import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasm from 'vite-plugin-wasm'
import path from 'path'
import { readFileSync } from 'fs'
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

const appVersion = JSON.stringify(
  JSON.parse(readFileSync(path.resolve('../package.json'), 'utf-8')).version
)
const useCloudflarePlugin = process.env.VITE_USE_CLOUDFLARE_PLUGIN === 'true'

const cloudflarePlugin =
  useCloudflarePlugin && process.env.npm_lifecycle_event !== 'check'
    ? (await import('@cloudflare/vite-plugin')).cloudflare()
    : null

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const plugins = [
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
        display: 'standalone',
        background_color: '#ffffff',
        start_url: '/',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-sidebar-icon.svg',
            type: 'image/svg+xml',
            purpose: 'maskable',
            sizes: 'any'
          },
          {
            src: '/pwa-sidebar-icon.svg',
            type: 'image/svg+xml',
            sizes: 'any'
          }
        ]
      },

      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        type: 'module'
      }
    })
  ]

  // Cloudflare plugin requires web APIs (e.g. File) unavailable in this check runtime.
  if (cloudflarePlugin) {
    plugins.push(cloudflarePlugin)
  }

  return {
    define: {
      __BUILD_TIME__: time,
      __APP_VERSION__: appVersion
    },

    server: {
      host: true,
      allowedHosts: process.env.VITE_ALLOWED_HOSTS
        ? process.env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim())
        : true
      },
    preview: {
      host: true,
      port: 5173
    },
    plugins,

    build: {
      sourcemap: true,
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
  }
})
