import { BrowserWindow, screen } from 'electron'
import type { AppWindowMode, WindowBounds } from './ipc/channels'
import { loadWindowBounds, saveWindowBounds } from './windowState'

/** Default desktop pet window size (compact corner sprite). */
export const PET_WINDOW = {
  width: 220,
  height: 220,
} as const

let mainWindow: BrowserWindow | null = null
let petBoundsBeforeExpand: WindowBounds | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

/** Full-screen piano bounds on the display that contains the window. */
export function getPianoFullscreenBounds(win: BrowserWindow): WindowBounds {
  const display = screen.getDisplayMatching(win.getBounds())
  const { x, y, width, height } = display.workArea
  return { x, y, width, height }
}

/** Keep window fully inside the nearest display work area. */
export function clampBounds(bounds: WindowBounds): WindowBounds {
  const display = screen.getDisplayMatching(bounds)
  const { x: workX, y: workY, width: workW, height: workH } = display.workArea
  const width = Math.min(bounds.width, workW)
  const height = Math.min(bounds.height, workH)
  const x = Math.max(workX, Math.min(bounds.x, workX + workW - width))
  const y = Math.max(workY, Math.min(bounds.y, workY + workH - height))
  return { x, y, width, height }
}

function getCenterBounds(width: number, height: number): WindowBounds {
  const display = screen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = display.workAreaSize
  const { x: workX, y: workY } = display.workArea

  return clampBounds({
    x: workX + Math.round((screenW - width) / 2),
    y: workY + Math.round((screenH - height) / 2),
    width,
    height,
  })
}

/** Electron: 0 = no constraint. Must clear before resizing frameless windows on Windows. */
function clearSizeConstraints(win: BrowserWindow): void {
  win.setMinimumSize(0, 0)
  win.setMaximumSize(0, 0)
}

/** Apply bounds — enable resize, clear min/max locks, setBounds, lock again. */
function applyWindowBounds(win: BrowserWindow, bounds: WindowBounds): WindowBounds {
  const next = clampBounds(bounds)

  clearSizeConstraints(win)
  win.setResizable(true)

  if (win.isMaximized()) win.unmaximize()
  if (win.isFullScreen()) win.setFullScreen(false)

  win.setBounds(next, false)

  // Windows transparent window: retry if size did not stick
  const applied = win.getBounds()
  if (applied.width < next.width - 20 || applied.height < next.height - 20) {
    win.hide()
    clearSizeConstraints(win)
    win.setBounds(next, false)
    win.show()
  }

  win.setResizable(false)
  const result = win.getBounds()
  saveWindowBounds(result)
  return result
}

function enterPianoMode(win: BrowserWindow): WindowBounds {
  if (!win.isMaximized() && !win.isFullScreen()) {
    petBoundsBeforeExpand = win.getBounds()
  }

  win.setSkipTaskbar(false)
  const result = applyWindowBounds(win, getPianoFullscreenBounds(win))
  win.focus()
  win.moveTop()
  return result
}

function exitPianoMode(win: BrowserWindow): WindowBounds {
  const saved = petBoundsBeforeExpand
  const next = saved
    ? clampBounds({
        x: Math.round(saved.x + saved.width / 2 - PET_WINDOW.width / 2),
        y: Math.round(saved.y + saved.height / 2 - PET_WINDOW.height / 2),
        width: PET_WINDOW.width,
        height: PET_WINDOW.height,
      })
    : getCenterBounds(PET_WINDOW.width, PET_WINDOW.height)

  petBoundsBeforeExpand = null
  win.setSkipTaskbar(true)
  return applyWindowBounds(win, next)
}

export function setAppWindowModeForWindow(win: BrowserWindow, mode: AppWindowMode): WindowBounds {
  if (mode === 'piano') {
    return enterPianoMode(win)
  }
  return exitPianoMode(win)
}

export function setAppWindowMode(mode: AppWindowMode): WindowBounds | null {
  if (!mainWindow) return null
  return setAppWindowModeForWindow(mainWindow, mode)
}

export function createPetWindowOptions(preloadPath: string): Electron.BrowserWindowConstructorOptions {
  return {
    width: PET_WINDOW.width,
    height: PET_WINDOW.height,
    show: false,
    transparent: true,
    frame: false,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  }
}

export function setWindowBounds(bounds: WindowBounds): void {
  if (!mainWindow) return
  applyWindowBounds(mainWindow, bounds)
}

export function setWindowIgnoreMouseEvents(ignore: boolean, forward = true): void {
  if (!mainWindow) return
  mainWindow.setIgnoreMouseEvents(ignore, { forward })
}

export function showPetWindow(win: BrowserWindow): void {
  const saved = loadWindowBounds()

  if (saved && saved.width <= PET_WINDOW.width + 20 && saved.height <= PET_WINDOW.height + 20) {
    applyWindowBounds(
      win,
      clampBounds({
        x: saved.x,
        y: saved.y,
        width: PET_WINDOW.width,
        height: PET_WINDOW.height,
      }),
    )
  } else if (saved) {
    const centerX = saved.x + saved.width / 2
    const centerY = saved.y + saved.height / 2
    applyWindowBounds(
      win,
      clampBounds({
        x: Math.round(centerX - PET_WINDOW.width / 2),
        y: Math.round(centerY - PET_WINDOW.height / 2),
        width: PET_WINDOW.width,
        height: PET_WINDOW.height,
      }),
    )
  } else {
    applyWindowBounds(win, getCenterBounds(PET_WINDOW.width, PET_WINDOW.height))
  }

  win.setResizable(false)
  win.show()
}

export function attachWindowStatePersistence(win: BrowserWindow): void {
  const persist = () => saveWindowBounds(win.getBounds())
  win.on('moved', persist)
  win.on('resized', persist)
}

const DRAG_THRESHOLD_PX = 4

interface InteractionSession {
  win: BrowserWindow
  startCursor: { x: number; y: number }
  startPos: { x: number; y: number }
  width: number
  height: number
  dragging: boolean
}

let interaction: InteractionSession | null = null
let interactionTimer: ReturnType<typeof setInterval> | null = null

/** Begin tracking cursor in main process (renderer mousemove is unreliable here). */
export function beginWindowInteraction(win: BrowserWindow): void {
  endWindowInteraction()

  const cursor = screen.getCursorScreenPoint()
  const [x, y] = win.getPosition()
  const { width, height } = win.getBounds()

  interaction = {
    win,
    startCursor: { x: cursor.x, y: cursor.y },
    startPos: { x, y },
    width,
    height,
    dragging: false,
  }

  interactionTimer = setInterval(() => {
    if (!interaction) return

    const point = screen.getCursorScreenPoint()
    const dx = point.x - interaction.startCursor.x
    const dy = point.y - interaction.startCursor.y
    const dist = Math.hypot(dx, dy)

    if (!interaction.dragging && dist >= DRAG_THRESHOLD_PX) {
      interaction.dragging = true
    }

    if (!interaction.dragging) return

    const next = clampBounds({
      x: interaction.startPos.x + dx,
      y: interaction.startPos.y + dy,
      width: interaction.width,
      height: interaction.height,
    })
    interaction.win.setBounds({
      x: next.x,
      y: next.y,
      width: next.width,
      height: next.height,
    })
  }, 4)
}

/** Stop tracking; returns whether the session was a drag (vs tap). */
export function endWindowInteraction(): boolean {
  if (interactionTimer) {
    clearInterval(interactionTimer)
    interactionTimer = null
  }

  const wasDrag = interaction?.dragging ?? false

  if (interaction) {
    saveWindowBounds(interaction.win.getBounds())
    interaction = null
  }

  return wasDrag
}
