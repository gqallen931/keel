import { BrowserWindow, dialog, ipcMain, net } from 'electron'
import { writeFile } from 'node:fs/promises'
import { streamManager } from './stream/StreamManager'

/** 本地服务地址（对应 ai-service 默认端口） */
const SERVICE_BASE = 'http://127.0.0.1:8800'

/**
 * 主进程 IPC 注册表。
 * 通道命名约定：`domain:action`，参数与返回值均为可结构化克隆的数据。
 */
export function registerIpc(): void {
  // ---------------- 窗口控制（自绘标题栏） ----------------
  ipcMain.handle('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
    return true
  })

  ipcMain.handle('window:toggle-maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return false
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
    return win.isMaximized()
  })

  ipcMain.handle('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
    return true
  })

  ipcMain.handle('window:is-maximized', (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false
  })

  // ---------------- 本地服务健康探测 ----------------
  ipcMain.handle('service:health', async () => {
    try {
      const resp = await net.fetch(`${SERVICE_BASE}/health`, { method: 'GET' })
      return { ok: resp.ok, status: resp.status }
    } catch (error) {
      return { ok: false, error: (error as Error).message }
    }
  })

  // ---------------- 任意 HTML → PDF（走隐藏窗口 printToPDF） ----------------
  ipcMain.handle('report:save-pdf', async (e, payload: { filename: string; html: string }) => {
    const parent = BrowserWindow.fromWebContents(e.sender)
    const safeName = payload.filename.replace(/[\\/:*?"<>|]/g, '_')
    const options = {
      title: '导出 PDF',
      defaultPath: `${safeName}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    }
    const picked = parent
      ? await dialog.showSaveDialog(parent, options)
      : await dialog.showSaveDialog(options)
    if (picked.canceled || !picked.filePath) return { ok: false, canceled: true }

    let printer: BrowserWindow | null = null
    try {
      printer = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
      await printer.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`)
      const data = await printer.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'custom', top: 0.5, bottom: 0.5, left: 0.4, right: 0.4 }
      })
      await writeFile(picked.filePath, data)
      return { ok: true, path: picked.filePath }
    } catch (error) {
      return { ok: false, error: (error as Error).message }
    } finally {
      printer?.destroy()
    }
  })

  // ---------------- 可选能力：RTSP 拉流 ----------------
  ipcMain.handle('stream:start', (_e, streamId: string, rtspUrl: string) => {
    const info = streamManager.start(streamId, rtspUrl)
    return {
      streamId,
      status: info.status,
      wsUrl: `ws://127.0.0.1:9999/stream/${streamId}`,
      error: info.error
    }
  })

  ipcMain.handle('stream:stop', (_e, streamId: string) => {
    streamManager.stop(streamId)
    return { ok: true }
  })

  ipcMain.handle('stream:status', (_e, streamId?: string) => {
    return streamManager.status(streamId)
  })
}
