/**
 * 主进程 ↔ 渲染进程契约。
 *
 * 该文件不依赖 electron / node，可同时被 preload 与 renderer 引用，
 * 避免渲染层通过 `preload/index.d.ts` 间接把 Electron 实现拉入 DOM 工程。
 */

export interface StreamStartResult {
  streamId: string
  status: string
  wsUrl: string
  error?: string
}

export interface PdfResult {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export interface DesktopApi {
  /** 自绘标题栏窗口控制 */
  win: {
    minimize: () => Promise<boolean>
    toggleMaximize: () => Promise<boolean>
    close: () => Promise<boolean>
    isMaximized: () => Promise<boolean>
  }
  /** 本地服务健康探测（主进程代理，避免渲染层跨域） */
  service: {
    health: () => Promise<{ ok: boolean; status?: number; error?: string }>
  }
  /** 任意 HTML 导出为 PDF */
  report: {
    savePdf: (payload: { filename: string; html: string }) => Promise<PdfResult>
  }
  /** 可选能力：RTSP 拉流 */
  stream: {
    start: (streamId: string, rtspUrl: string) => Promise<StreamStartResult>
    stop: (streamId: string) => Promise<{ ok: boolean }>
    status: (streamId?: string) => Promise<unknown>
  }
}
