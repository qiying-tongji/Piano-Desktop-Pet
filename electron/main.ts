/**
 * Electron 主进程入口
 *
 * 职责：创建透明桌宠窗口、注册 IPC、授予摄像头/媒体权限、管理应用生命周期。
 */
import { app, BrowserWindow, session } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers, unregisterIpcHandlers } from './ipc/handlers'
import {
  attachWindowStatePersistence,
  createPetWindowOptions,
  setAppWindowModeForWindow,
  setMainWindow,
} from './windowManager'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

/** 创建主窗口并加载 Vite 开发服务器或打包后的 dist/index.html */
function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.cjs')
  if (!fs.existsSync(preloadPath)) {
    console.error('[main] preload missing:', preloadPath)
  }

  mainWindow = new BrowserWindow(createPetWindowOptions(preloadPath))
  setMainWindow(mainWindow)
  attachWindowStatePersistence(mainWindow)

  mainWindow.webContents.on('preload-error', (_event, path, error) => {
    console.error('[main] preload-error:', path, error)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    setMainWindow(null)
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      setAppWindowModeForWindow(mainWindow, 'piano')
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  // 手势识别需要摄像头，仅允许 media 相关权限
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = permission === 'media' || permission === 'mediaKeySystem'
    callback(allowed)
  })

  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return permission === 'media' || permission === 'mediaKeySystem'
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  unregisterIpcHandlers()
})
