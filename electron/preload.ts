import { contextBridge, ipcRenderer } from 'electron'
import type { AppInfo, AppWindowMode, WindowBounds } from './ipc/channels'
import { IPC_CHANNELS } from './ipc/channels'

export interface ElectronAPI {
  getAppInfo: () => Promise<AppInfo>
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => Promise<void>
  setWindowBounds: (bounds: WindowBounds) => Promise<void>
  getWindowBounds: () => Promise<WindowBounds | null>
  setAppWindowMode: (mode: AppWindowMode) => Promise<WindowBounds | null>
  beginWindowInteraction: () => void
  endWindowInteraction: () => boolean
}

const electronAPI: ElectronAPI = {
  getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_INFO),
  setIgnoreMouseEvents: (ignore, forward) =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE, ignore, forward),
  setWindowBounds: (bounds) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_BOUNDS, bounds),
  getWindowBounds: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_BOUNDS),
  setAppWindowMode: (mode) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_APP_MODE, mode),
  beginWindowInteraction: () => {
    ipcRenderer.sendSync(IPC_CHANNELS.WINDOW_INTERACTION_START)
  },
  endWindowInteraction: () =>
    ipcRenderer.sendSync(IPC_CHANNELS.WINDOW_INTERACTION_END) as boolean,
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
