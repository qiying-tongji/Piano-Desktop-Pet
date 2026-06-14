/**
 * IPC 通道注册
 *
 * 职责：将 preload 暴露的 API 映射到 windowManager 等主进程能力。
 */
import { app, BrowserWindow, ipcMain } from 'electron'
import type { AppInfo, AppWindowMode, WindowBounds } from './channels'
import { IPC_CHANNELS } from './channels'
import {
  beginWindowInteraction,
  endWindowInteraction,
  getMainWindow,
  setAppWindowModeForWindow,
  setWindowBounds,
  setWindowIgnoreMouseEvents,
} from '../windowManager'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_APP_INFO, (): AppInfo => ({
    version: app.getVersion(),
    platform: process.platform,
    isDev: !app.isPackaged,
  }))

  ipcMain.handle(
    IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE,
    (_event, ignore: boolean, forward?: boolean) => {
      setWindowIgnoreMouseEvents(ignore, forward ?? true)
    },
  )

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_BOUNDS, (_event, bounds: WindowBounds) => {
    setWindowBounds(bounds)
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_BOUNDS, (): WindowBounds | null => {
    const win = getMainWindow()
    if (!win) return null
    return win.getBounds()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_APP_MODE, (event, mode: AppWindowMode) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    return setAppWindowModeForWindow(win, mode)
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_INTERACTION_START, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    beginWindowInteraction(win)
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_INTERACTION_END, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    event.returnValue = endWindowInteraction()
  })
}

export function unregisterIpcHandlers(): void {
  Object.values(IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel)
  })
  ipcMain.removeAllListeners(IPC_CHANNELS.WINDOW_INTERACTION_START)
  ipcMain.removeAllListeners(IPC_CHANNELS.WINDOW_INTERACTION_END)
}
