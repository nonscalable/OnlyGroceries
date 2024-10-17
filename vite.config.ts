import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasm from 'vite-plugin-wasm'
import path from 'path'

export default defineConfig({
  build: {
    manifest: true,
    target: 'esnext'
  },
  plugins: [wasm(), svelte()],
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
