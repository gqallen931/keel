import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { registerIpc } from './ipc'
import { streamManager } from './stream/StreamManager'
import { wsStreamServer } from './stream/WsStreamServer'

const isDev = !!process.env.ELECTRON_RENDERER_URL

/** 创建主窗口：无边框 + 应用内自绘标题栏（见 renderer/components/TitleBar.tsx） */
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f4',
    title: 'Keel',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  // 外部链接交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL as string)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return win
}

app.whenReady().then(() => {
  // 可选能力：RTSP → MPEG1-TS 分发服务（不使用可移除）
  wsStreamServer.listen(9999)
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  streamManager.stopAll()
  wsStreamServer.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  streamManager.stopAll()
  wsStreamServer.close()
})
