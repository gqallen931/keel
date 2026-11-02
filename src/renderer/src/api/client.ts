import axios, { AxiosInstance } from 'axios'

/**
 * 后端服务 HTTP 客户端。
 * - 开发（vite 代理）：/api
 * - 生产（Electron file://）：http://127.0.0.1:8800/api
 */
const baseURL = import.meta.env.DEV ? '/api' : 'http://127.0.0.1:8800/api'

export const http: AxiosInstance = axios.create({ baseURL, timeout: 8000 })

/** 后端探测缓存：null=未探测，false=已降级 */
let backendReady: boolean | null = null

/** 探测本地服务是否可用（开发走代理 /health，生产直连） */
export async function isBackendReady(): Promise<boolean> {
  try {
    await axios.get(import.meta.env.DEV ? '/health' : 'http://127.0.0.1:8800/health', {
      timeout: 2500
    })
    backendReady = true
  } catch {
    backendReady = false
  }
  return backendReady
}

export function backendState(): boolean | null {
  return backendReady
}

/** 优先真实后端；后端不可用或 5xx 时降级到本地示例数据 */
export async function withBackend<T>(real: () => Promise<T>, mock: () => T | Promise<T>): Promise<T> {
  if (backendReady === false) return mock()
  try {
    return await real()
  } catch (e) {
    if (axios.isAxiosError(e) && (!e.response || e.response.status >= 500)) {
      backendReady = false
      return mock()
    }
    throw e
  }
}
