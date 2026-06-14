/**
 * 钢琴视图状态（Zustand）
 *
 * 连续滑动视口：scrollPosition 为白键偏移（可小数，支持半键露出）。
 * ◀▶ / 滚轮按「整页」（可见白键数）切换。
 */
import { create } from 'zustand'
import {
  getTotalWhiteKeys,
  getViewportEdgeNotes,
  getWhiteKeyNotes,
  KEYBOARD_MAX_OCTAVE,
  KEYBOARD_MIN_OCTAVE,
  VISIBLE_WHITE_KEYS,
} from '@/features/piano/constants/keys'
import { noteToMidi } from '@/features/music-intent/lib/scales'

export {
  KEYBOARD_MIN_OCTAVE,
  KEYBOARD_MAX_OCTAVE,
  VISIBLE_WHITE_KEYS,
}

/** 默认视口左缘对齐 C3 */
export const DEFAULT_SCROLL_POSITION = 7

/** 兼容旧逻辑 */
export const DEFAULT_START_OCTAVE = 3

/** 兼容旧名 */
export const VISIBLE_OCTAVES = 2

export const MIN_START_OCTAVE = KEYBOARD_MIN_OCTAVE
export const MAX_START_OCTAVE = KEYBOARD_MAX_OCTAVE - 1

export function getMaxScroll(): number {
  return Math.max(0, getTotalWhiteKeys() - VISIBLE_WHITE_KEYS)
}

function defaultScrollPosition(): number {
  const white = getWhiteKeyNotes()
  const c3Index = white.indexOf('C3')
  return c3Index >= 0 ? c3Index : DEFAULT_SCROLL_POSITION
}

interface PianoViewportState {
  scrollPosition: number
  setScrollPosition: (position: number) => void
  shiftPage: (direction: 1 | -1) => void
}

export const usePianoStore = create<PianoViewportState>((set, get) => ({
  scrollPosition: defaultScrollPosition(),
  setScrollPosition: (position) =>
    set({ scrollPosition: Math.max(0, Math.min(getMaxScroll(), position)) }),
  shiftPage: (direction) => {
    const next = get().scrollPosition + direction * VISIBLE_WHITE_KEYS
    set({ scrollPosition: Math.max(0, Math.min(getMaxScroll(), next)) })
  },
}))

export function getViewportOctaveStart(scroll = usePianoStore.getState().scrollPosition): number {
  const white = getWhiteKeyNotes()
  const note = white[Math.min(Math.floor(Math.max(0, scroll)), white.length - 1)]
  const m = note.match(/(\d+)$/)
  return m ? Number(m[1]) : DEFAULT_START_OCTAVE
}

export function getChordOctaveAnchorFromScroll(scroll?: number): number {
  return getViewportOctaveStart(scroll ?? usePianoStore.getState().scrollPosition)
}

/** @deprecated 使用 getChordOctaveAnchorFromScroll */
export function getChordOctaveAnchor(startOctave: number): number {
  return startOctave
}

export function formatViewportRange(scroll = usePianoStore.getState().scrollPosition): string {
  const { left, right } = getViewportEdgeNotes(scroll)
  return `${left} – ${right}`
}

export function formatOctaveRange(startOctave: number, _octaves = VISIBLE_OCTAVES): string {
  return `C${startOctave} – B${startOctave + VISIBLE_OCTAVES - 1}`
}

export function canShiftPage(scroll: number, direction: 1 | -1): boolean {
  const next = scroll + direction * VISIBLE_WHITE_KEYS
  return next >= 0 && next <= getMaxScroll()
}

export function getVisibleMidiRangeFromScroll(scroll: number): [number, number] {
  const white = getWhiteKeyNotes()
  const whiteMidis = white.map(noteToMidi)
  const maxScroll = getMaxScroll()
  const clamped = Math.max(0, Math.min(maxScroll, scroll))

  const low = whiteMidis[Math.min(Math.floor(clamped), whiteMidis.length - 1)]
  const rightPos = clamped + VISIBLE_WHITE_KEYS - 1
  const rightIdx = Math.floor(rightPos)
  const rightFrac = rightPos - rightIdx
  const rightBase = whiteMidis[Math.min(rightIdx, whiteMidis.length - 1)]
  const rightNext =
    rightIdx + 1 < whiteMidis.length ? whiteMidis[rightIdx + 1] : rightBase + 2
  const high = Math.ceil(rightBase + (rightNext - rightBase) * rightFrac) + 1

  return [low, high]
}
