import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { WindowBounds } from './ipc/channels'

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json')

export function loadWindowBounds(): WindowBounds | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as WindowBounds
    if (
      typeof data.x === 'number' &&
      typeof data.y === 'number' &&
      typeof data.width === 'number' &&
      typeof data.height === 'number'
    ) {
      return data
    }
    return null
  } catch {
    return null
  }
}

export function saveWindowBounds(bounds: WindowBounds): void {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
    fs.writeFileSync(STATE_FILE, JSON.stringify(bounds))
  } catch {
    // Non-fatal: position just won't persist
  }
}
