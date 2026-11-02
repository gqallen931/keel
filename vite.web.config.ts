import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/** 纯浏览器联调配置：只启动 renderer，/api 与 /ws 代理到本地服务（8800） */
export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  resolve: {
    alias: { '@': resolve('src/renderer/src') }
  },
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8800', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:8800', changeOrigin: true },
      '/ws': { target: 'ws://127.0.0.1:8800', ws: true }
    }
  }
})
