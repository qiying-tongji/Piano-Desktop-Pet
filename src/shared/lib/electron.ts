/** Running inside Electron shell (may still lack preload / electronAPI). */
export function isElectron(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')
}

/** Preload bridge is available. */
export function hasElectronAPI(): boolean {
  return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
}
