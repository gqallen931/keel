import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    resolve: {
      alias: { '@': resolve('src/renderer/src') }
    },
    server: {
      port: 5180,
      proxy: {
        '/api': { target: 'http://127.0.0.1:8800', changeOrigin: true },
        '/health': { target: 'http://127.0.0.1:8800', changeOrigin: true },
        '/ws': { target: 'ws://127.0.0.1:8800', ws: true }
      }
    }
  }
})
