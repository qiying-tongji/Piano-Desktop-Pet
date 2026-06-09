/// <reference types="vite/client" />

import type { AppInfo, AppWindowMode, WindowBounds } from '../electron/ipc/channels'

export interface ElectronAPI {
  getAppInfo: () => Promise<AppInfo>
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => Promise<void>
  setWindowBounds: (bounds: WindowBounds) => Promise<void>
  getWindowBounds: () => Promise<WindowBounds | null>
  setAppWindowMode: (mode: AppWindowMode) => Promise<WindowBounds | null>
  beginWindowInteraction: () => void
  endWindowInteraction: () => boolean
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
