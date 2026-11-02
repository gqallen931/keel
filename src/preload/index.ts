import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi, StreamStartResult } from '../shared/bridge'

/** 运行时实现：方法签名必须与 shared/bridge.ts 中的 DesktopApi 完全一致 */
const api: DesktopApi = {
  win: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized')
  },
  service: {
    health: () => ipcRenderer.invoke('service:health')
  },
  report: {
    savePdf: (payload) => ipcRenderer.invoke('report:save-pdf', payload)
  },
  stream: {
    start: (streamId: string, rtspUrl: string): Promise<StreamStartResult> =>
      ipcRenderer.invoke('stream:start', streamId, rtspUrl),
    stop: (streamId: string) => ipcRenderer.invoke('stream:stop', streamId),
    status: (streamId?: string) => ipcRenderer.invoke('stream:status', streamId)
  }
}

contextBridge.exposeInMainWorld('desktop', api)

export type { DesktopApi }
