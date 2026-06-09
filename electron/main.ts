import { app, BrowserWindow, session } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers, unregisterIpcHandlers } from './ipc/handlers'
import {
  attachWindowStatePersistence,
  createPetWindowOptions,
  setMainWindow,
  showPetWindow,
} from './windowManager'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

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
      showPetWindow(mainWindow)
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
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
