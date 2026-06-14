/**
 * Electron 环境检测工具
 */
/** 是否在 Electron 壳内运行（preload 可能尚未加载） */
export function isElectron(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')
}

/** preload 桥接是否可用 */
export function hasElectronAPI(): boolean {
  return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
}
