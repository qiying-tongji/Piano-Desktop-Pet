/** IPC channel names shared between main and renderer. */
export const IPC_CHANNELS = {
  GET_APP_INFO: 'app:get-info',
  WINDOW_SET_IGNORE_MOUSE: 'window:set-ignore-mouse',
  WINDOW_SET_BOUNDS: 'window:set-bounds',
  WINDOW_GET_BOUNDS: 'window:get-bounds',
  WINDOW_SET_APP_MODE: 'window:set-app-mode',
  WINDOW_INTERACTION_START: 'window:interaction-start',
  WINDOW_INTERACTION_END: 'window:interaction-end',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export interface AppInfo {
  version: string
  platform: NodeJS.Platform
  isDev: boolean
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export type AppWindowMode = 'pet' | 'piano'
