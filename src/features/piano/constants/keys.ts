/**
 * 钢琴键位与键盘映射
 *
 * 全量键盘布局（C2–B6）+ 连续滑动视口下的标签/映射。
 */
import { midiToNote, noteToMidi } from '@/features/music-intent/lib/scales'

/** 全键盘最低八度 */
export const KEYBOARD_MIN_OCTAVE = 2
/** 全键盘最高八度（含 B6） */
export const KEYBOARD_MAX_OCTAVE = 6
/** 可见白键数（约两八度） */
export const VISIBLE_WHITE_KEYS = 14

export interface PianoKeyDef {
  note: string
  label: string
  type: 'white' | 'black'
  whiteIndex?: number
  afterWhite?: number
}

const OCTAVE_PATTERN: { name: string; type: 'white' | 'black'; afterWhite?: number }[] = [
  { name: 'C', type: 'white' },
  { name: 'C#', type: 'black', afterWhite: 0 },
  { name: 'D', type: 'white' },
  { name: 'D#', type: 'black', afterWhite: 1 },
  { name: 'E', type: 'white' },
  { name: 'F', type: 'white' },
  { name: 'F#', type: 'black', afterWhite: 3 },
  { name: 'G', type: 'white' },
  { name: 'G#', type: 'black', afterWhite: 4 },
  { name: 'A', type: 'white' },
  { name: 'A#', type: 'black', afterWhite: 5 },
  { name: 'B', type: 'white' },
]

const LOW_ROW_KEYS = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'] as const
const HIGH_ROW_KEYS = ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u'] as const
const LOW_ROW_LABELS = ['Z', 'S', 'X', 'D', 'C', 'V', 'G', 'B', 'H', 'N', 'J', 'M'] as const
const HIGH_ROW_LABELS = ['Q', '2', 'W', '3', 'E', 'R', '5', 'T', '6', 'Y', '7', 'U'] as const

const FULL_KEYBOARD_OCTAVES = KEYBOARD_MAX_OCTAVE - KEYBOARD_MIN_OCTAVE + 1

let cachedWhiteKeyNotes: string[] | null = null
let cachedFullKeys: PianoKeyDef[] | null = null

export function getWhiteKeyNotes(): string[] {
  if (!cachedWhiteKeyNotes) {
    const notes: string[] = []
    for (let o = KEYBOARD_MIN_OCTAVE; o <= KEYBOARD_MAX_OCTAVE; o++) {
      for (const w of ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const) {
        notes.push(`${w}${o}`)
      }
    }
    cachedWhiteKeyNotes = notes
  }
  return cachedWhiteKeyNotes
}

export function getTotalWhiteKeys(): number {
  return getWhiteKeyNotes().length
}

export function buildPianoKeys(startOctave: number, octaveCount = 2): PianoKeyDef[] {
  const keys: PianoKeyDef[] = []
  let whiteIndex = 0

  for (let o = 0; o < octaveCount; o++) {
    const octave = startOctave + o
    for (const pat of OCTAVE_PATTERN) {
      const note = `${pat.name}${octave}`
      const label = pat.name.replace('#', '♯')

      if (pat.type === 'white') {
        keys.push({ note, label, type: 'white', whiteIndex })
        whiteIndex += 1
      } else {
        keys.push({
          note,
          label,
          type: 'black',
          afterWhite: pat.afterWhite !== undefined ? pat.afterWhite + o * 7 : undefined,
        })
      }
    }
  }
  return keys
}

/** 全量键盘 C2–B6，白键带全局 whiteIndex */
export function buildFullPianoKeys(): PianoKeyDef[] {
  if (!cachedFullKeys) {
    cachedFullKeys = buildPianoKeys(KEYBOARD_MIN_OCTAVE, FULL_KEYBOARD_OCTAVES)
  }
  return cachedFullKeys
}

export function getMappingStartOctave(scroll: number): number {
  const whiteIndex = Math.floor(Math.max(0, scroll))
  const octaveSpan = 7
  const rel = Math.min(
    FULL_KEYBOARD_OCTAVES - 2,
    Math.max(0, Math.floor(whiteIndex / octaveSpan)),
  )
  return KEYBOARD_MIN_OCTAVE + rel
}

/** 白键 index 是否与视口 [scroll, scroll + VISIBLE_WHITE_KEYS) 相交 */
function isWhiteKeyInViewport(whiteIndex: number, scroll: number): boolean {
  const viewEnd = scroll + VISIBLE_WHITE_KEYS
  return whiteIndex < viewEnd && whiteIndex + 1 > scroll
}

/** 黑键是否处于当前视口可见范围（相邻白键任一可见即纳入） */
function isBlackKeyInViewport(afterWhite: number, scroll: number): boolean {
  return (
    isWhiteKeyInViewport(afterWhite, scroll) ||
    isWhiteKeyInViewport(afterWhite + 1, scroll)
  )
}

/**
 * 当前视口内可见的琴键（chromatic 顺序，随 scroll 滑动）。
 * 最多 24 个，对应 Z–M / Q–U 两排共 24 个物理键。
 */
export function getVisiblePianoKeysForScroll(scroll: number): PianoKeyDef[] {
  const allKeys = buildFullPianoKeys()
  const maxScroll = Math.max(0, getTotalWhiteKeys() - VISIBLE_WHITE_KEYS)
  const clamped = Math.max(0, Math.min(maxScroll, scroll))

  const visible = allKeys.filter((k) => {
    if (k.type === 'white') {
      return isWhiteKeyInViewport(k.whiteIndex ?? 0, clamped)
    }
    return isBlackKeyInViewport(k.afterWhite ?? 0, clamped)
  })

  return visible.slice(0, LOW_ROW_KEYS.length + HIGH_ROW_KEYS.length)
}

export function buildKeyboardMapForScroll(scroll: number): Record<string, string> {
  const visible = getVisiblePianoKeysForScroll(scroll)
  const map: Record<string, string> = {}

  visible.slice(0, LOW_ROW_KEYS.length).forEach((k, i) => {
    map[LOW_ROW_KEYS[i]] = k.note
  })
  visible.slice(LOW_ROW_KEYS.length, LOW_ROW_KEYS.length + HIGH_ROW_KEYS.length).forEach((k, i) => {
    map[HIGH_ROW_KEYS[i]] = k.note
  })

  return map
}

export function buildKeyLabelsForScroll(scroll: number): Record<string, string> {
  const visible = getVisiblePianoKeysForScroll(scroll)
  const labels: Record<string, string> = {}

  visible.slice(0, LOW_ROW_KEYS.length).forEach((k, i) => {
    labels[k.note] = LOW_ROW_LABELS[i]
  })
  visible.slice(LOW_ROW_KEYS.length, LOW_ROW_KEYS.length + HIGH_ROW_KEYS.length).forEach((k, i) => {
    labels[k.note] = HIGH_ROW_LABELS[i]
  })

  return labels
}

export function buildKeyboardMap(startOctave: number, octaveCount = 2): Record<string, string> {
  const keys = buildPianoKeys(startOctave, octaveCount)
  const map: Record<string, string> = {}
  const lowOctaveNotes = keys.filter((k) => k.note.endsWith(String(startOctave)))
  const highOctaveNotes = keys.filter((k) => k.note.endsWith(String(startOctave + 1)))

  lowOctaveNotes.forEach((k, i) => {
    if (i < LOW_ROW_KEYS.length) map[LOW_ROW_KEYS[i]] = k.note
  })
  highOctaveNotes.forEach((k, i) => {
    if (i < HIGH_ROW_KEYS.length) map[HIGH_ROW_KEYS[i]] = k.note
  })
  return map
}

export function buildKeyLabels(startOctave: number, octaveCount = 2): Record<string, string> {
  const keys = buildPianoKeys(startOctave, octaveCount)
  const labels: Record<string, string> = {}
  const lowOctaveNotes = keys.filter((k) => k.note.endsWith(String(startOctave)))
  const highOctaveNotes = keys.filter((k) => k.note.endsWith(String(startOctave + 1)))

  lowOctaveNotes.forEach((k, i) => {
    if (i < LOW_ROW_LABELS.length) labels[k.note] = LOW_ROW_LABELS[i]
  })
  highOctaveNotes.forEach((k, i) => {
    if (i < HIGH_ROW_LABELS.length) labels[k.note] = HIGH_ROW_LABELS[i]
  })
  return labels
}

/** 连续视口左/右缘音高（支持半键偏移） */
export function getViewportEdgeNotes(scroll: number): { left: string; right: string } {
  const white = getWhiteKeyNotes()
  const whiteMidis = white.map(noteToMidi)
  const maxScroll = Math.max(0, white.length - VISIBLE_WHITE_KEYS)

  const clamped = Math.max(0, Math.min(maxScroll, scroll))
  const leftIdx = Math.floor(clamped)
  const rightPos = clamped + VISIBLE_WHITE_KEYS - 1
  const rightIdx = Math.floor(rightPos)
  const rightFrac = rightPos - rightIdx

  const left = midiToNote(whiteMidis[Math.min(leftIdx, whiteMidis.length - 1)])
  const rightBase = whiteMidis[Math.min(rightIdx, whiteMidis.length - 1)]
  const rightNext =
    rightIdx + 1 < whiteMidis.length ? whiteMidis[rightIdx + 1] : rightBase + 2
  const rightMidi = Math.round(rightBase + (rightNext - rightBase) * rightFrac)
  return { left, right: midiToNote(rightMidi) }
}

export const PIANO_KEYS = buildPianoKeys(3, 2)
export const KEYBOARD_MAP = buildKeyboardMap(3, 2)
export const KEY_LABELS = buildKeyLabels(3, 2)
