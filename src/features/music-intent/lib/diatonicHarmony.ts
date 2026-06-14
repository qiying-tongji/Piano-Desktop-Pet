/**
 * 调性和声系统
 *
 * 根据调性 + 和弦模式 + 级数（I–V）自动计算左手和弦；
 * 并为右手旋律提供调内音阶与和弦音。
 */
import { applyInversion } from './chordVoicing'
import { midiToNote, noteToMidi } from './scales'
import { getVisibleMidiRangeFromScroll, getViewportOctaveStart } from '@/stores/pianoStore'

/** 支持的调性 */
export type KeyId =
  | 'C-major'
  | 'G-major'
  | 'D-major'
  | 'A-major'
  | 'E-major'
  | 'B-major'
  | 'F-major'
  | 'A-minor'
  | 'E-minor'
  | 'B-minor'
  | 'D-minor'
  | 'G-minor'
  | 'C-minor'

export type ChordHarmonyMode = 'triad' | 'seventh' | 'power'

export type ScaleDegree = 1 | 2 | 3 | 4 | 5

export type FingerCount = 1 | 2 | 3 | 4 | 5

/** 手指数 → 级数（I, ii, iii, IV, V） */
export const FINGER_TO_DEGREE: Record<FingerCount, ScaleDegree> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
}

export const ROMAN_LABELS: Record<ScaleDegree, string> = {
  1: 'I',
  2: 'ii',
  3: 'iii',
  4: 'IV',
  5: 'V',
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

const KEY_ROOT_PC: Record<KeyId, number> = {
  'C-major': 0,
  'G-major': 7,
  'D-major': 2,
  'A-major': 9,
  'E-major': 4,
  'B-major': 11,
  'F-major': 5,
  'A-minor': 9,
  'E-minor': 4,
  'B-minor': 11,
  'D-minor': 2,
  'G-minor': 7,
  'C-minor': 0,
}

const MAJOR_PATTERN = [0, 2, 4, 5, 7, 9, 11] as const
const NATURAL_MINOR_PATTERN = [0, 2, 3, 5, 7, 8, 10] as const

const MAJOR_TRIAD: Record<ScaleDegree, number[]> = {
  1: [0, 4, 7],
  2: [0, 3, 7],
  3: [0, 3, 7],
  4: [0, 4, 7],
  5: [0, 4, 7],
}

const MAJOR_SEVENTH: Record<ScaleDegree, number[]> = {
  1: [0, 4, 7, 11],
  2: [0, 3, 7, 10],
  3: [0, 3, 7, 10],
  4: [0, 4, 7, 11],
  5: [0, 4, 7, 10],
}

const MINOR_TRIAD: Record<ScaleDegree, number[]> = {
  1: [0, 3, 7],
  2: [0, 3, 6],
  3: [0, 4, 7],
  4: [0, 3, 7],
  5: [0, 3, 7],
}

const MINOR_SEVENTH: Record<ScaleDegree, number[]> = {
  1: [0, 3, 7, 10],
  2: [0, 3, 6, 10],
  3: [0, 4, 7, 11],
  4: [0, 3, 7, 10],
  5: [0, 3, 7, 10],
}

const POWER: number[] = [0, 7]

export const KEY_OPTIONS: { id: KeyId; label: string; group: 'major' | 'minor' }[] = [
  { id: 'C-major', label: 'C Major', group: 'major' },
  { id: 'G-major', label: 'G Major', group: 'major' },
  { id: 'D-major', label: 'D Major', group: 'major' },
  { id: 'A-major', label: 'A Major', group: 'major' },
  { id: 'E-major', label: 'E Major', group: 'major' },
  { id: 'B-major', label: 'B Major', group: 'major' },
  { id: 'F-major', label: 'F Major', group: 'major' },
  { id: 'A-minor', label: 'A Minor', group: 'minor' },
  { id: 'E-minor', label: 'E Minor', group: 'minor' },
  { id: 'B-minor', label: 'B Minor', group: 'minor' },
  { id: 'D-minor', label: 'D Minor', group: 'minor' },
  { id: 'G-minor', label: 'G Minor', group: 'minor' },
  { id: 'C-minor', label: 'C Minor', group: 'minor' },
]

export const CHORD_HARMONY_MODE_OPTIONS: { id: ChordHarmonyMode; label: string; hint: string }[] = [
  { id: 'triad', label: '三和弦', hint: 'Major / Minor Triad' },
  { id: 'seventh', label: '七和弦', hint: 'maj7 / m7 / dom7 / m7b5' },
  { id: 'power', label: 'Power', hint: '根音 + 五度' },
]

export function isMajorKey(keyId: KeyId): boolean {
  return keyId.endsWith('major')
}

export function getKeyPitchClasses(keyId: KeyId): number[] {
  const root = KEY_ROOT_PC[keyId]
  const pattern = isMajorKey(keyId) ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN
  return pattern.map((p) => (root + p) % 12)
}

export function buildKeyScaleNotes(keyId: KeyId, lowMidi = 48, highMidi = 84): string[] {
  const pcs = getKeyPitchClasses(keyId)
  const notes: string[] = []
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    if (pcs.includes(midi % 12)) notes.push(midiToNote(midi))
  }
  return notes
}

function getDegreeIntervals(keyId: KeyId, degree: ScaleDegree, mode: ChordHarmonyMode): number[] {
  if (mode === 'power') return POWER
  const major = isMajorKey(keyId)
  if (mode === 'triad') return major ? MAJOR_TRIAD[degree] : MINOR_TRIAD[degree]
  return major ? MAJOR_SEVENTH[degree] : MINOR_SEVENTH[degree]
}

function pcToNoteName(pc: number): string {
  return NOTE_NAMES[((pc % 12) + 12) % 12]
}

function degreeRootPc(keyId: KeyId, degree: ScaleDegree): number {
  return getKeyPitchClasses(keyId)[degree - 1]
}

function intervalsToNotesAtAnchor(intervals: readonly number[], degreeRoot: number, octaveAnchor: number): string[] {
  const baseMidi = (octaveAnchor + 1) * 12 + degreeRoot
  const notes: string[] = []
  let prevPc = -1
  let bump = 0
  for (const iv of intervals) {
    const pc = (degreeRoot + iv) % 12
    if (prevPc >= 0 && pc <= prevPc) bump += 1
    notes.push(midiToNote(baseMidi + iv + bump * 12))
    prevPc = pc
  }
  return notes
}

/** 可见键盘 MIDI 范围（含两端，基于连续 scroll） */
export function getVisibleMidiRange(
  scrollOrStartOctave: number,
  _legacyOctaves?: number,
): [number, number] {
  return getVisibleMidiRangeFromScroll(scrollOrStartOctave)
}

/**
 * 将 voicing 整体移八度，使全部音落在可见键盘内。
 */
export function fitVoicingToVisibleRange(
  notes: string[],
  scrollPosition: number,
): string[] {
  if (notes.length === 0) return notes

  const [low, high] = getVisibleMidiRangeFromScroll(scrollPosition)
  let midis = notes.map(noteToMidi)

  for (let i = 0; i < 8; i++) {
    const min = Math.min(...midis)
    const max = Math.max(...midis)
    if (min >= low && max <= high) break
    if (max > high) {
      midis = midis.map((m) => m - 12)
      continue
    }
    if (min < low) {
      midis = midis.map((m) => m + 12)
      continue
    }
    break
  }

  midis.sort((a, b) => a - b)
  return midis.map(midiToNote)
}

export function getChordSymbol(keyId: KeyId, degree: ScaleDegree, mode: ChordHarmonyMode): string {
  const rootName = pcToNoteName(degreeRootPc(keyId, degree))
  if (mode === 'power') return `${rootName}5`

  const major = isMajorKey(keyId)
  if (mode === 'triad') {
    if (major) return degree === 1 || degree === 4 || degree === 5 ? rootName : `${rootName}m`
    if (degree === 1 || degree === 4 || degree === 5) return `${rootName}m`
    if (degree === 2) return `${rootName}dim`
    return rootName
  }

  if (major) {
    if (degree === 1 || degree === 4) return `${rootName}maj7`
    if (degree === 5) return `${rootName}7`
    return `${rootName}m7`
  }
  if (degree === 1 || degree === 4 || degree === 5) return `${rootName}m7`
  if (degree === 2) return `${rootName}m7b5`
  if (degree === 3) return `${rootName}maj7`
  return `${rootName}m7`
}

export interface ResolvedDiatonicChord {
  id: string
  name: string
  symbol: string
  degree: ScaleDegree
  roman: string
  notes: string[]
  chordTones: string[]
}

export function resolveDiatonicChord(
  keyId: KeyId,
  harmonyMode: ChordHarmonyMode,
  fingerCount: FingerCount,
  scrollPosition: number,
  inversion = 0,
): ResolvedDiatonicChord {
  const degree = FINGER_TO_DEGREE[fingerCount]
  const rootPc = degreeRootPc(keyId, degree)
  const intervals = getDegreeIntervals(keyId, degree, harmonyMode)
  const octaveAnchor = getViewportOctaveStart(scrollPosition)
  let notes = intervalsToNotesAtAnchor(intervals, rootPc, octaveAnchor)
  notes = applyInversion(notes, inversion)
  notes = fitVoicingToVisibleRange(notes, scrollPosition)

  const symbol = getChordSymbol(keyId, degree, harmonyMode)
  return {
    id: symbol,
    name: `${ROMAN_LABELS[degree]} · ${symbol}`,
    symbol,
    degree,
    roman: ROMAN_LABELS[degree],
    notes,
    chordTones: intervals.map((iv) => pcToNoteName(rootPc + iv)),
  }
}

export function getDiatonicMappingPreview(
  keyId: KeyId,
  harmonyMode: ChordHarmonyMode,
  scrollPosition: number,
  inversion = 0,
): ResolvedDiatonicChord[] {
  return ([1, 2, 3, 4, 5] as FingerCount[]).map((f) =>
    resolveDiatonicChord(keyId, harmonyMode, f, scrollPosition, inversion),
  )
}

export function getLeftHandChordLabel(
  fingerCount: number,
  keyId: KeyId,
  harmonyMode: ChordHarmonyMode,
): string {
  if (fingerCount < 1 || fingerCount > 5) return ''
  const degree = FINGER_TO_DEGREE[fingerCount as FingerCount]
  return `${fingerCount}指 · ${ROMAN_LABELS[degree]} · ${getChordSymbol(keyId, degree, harmonyMode)}`
}

export function getTonicChord(
  keyId: KeyId,
  harmonyMode: ChordHarmonyMode,
  scrollPosition: number,
): ResolvedDiatonicChord {
  return resolveDiatonicChord(keyId, harmonyMode, 1, scrollPosition, 0)
}

const HARMONIC_STORAGE_KEY = 'piano-harmonic-settings'

export interface HarmonicSettings {
  keyId: KeyId
  harmonyMode: ChordHarmonyMode
  inversion: number
}

export const DEFAULT_HARMONIC_SETTINGS: HarmonicSettings = {
  keyId: 'C-major',
  harmonyMode: 'triad',
  inversion: 0,
}

export function loadHarmonicSettings(): HarmonicSettings {
  try {
    const raw = localStorage.getItem(HARMONIC_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_HARMONIC_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<HarmonicSettings>
    const keyId = KEY_OPTIONS.some((k) => k.id === parsed.keyId)
      ? (parsed.keyId as KeyId)
      : DEFAULT_HARMONIC_SETTINGS.keyId
    const harmonyMode =
      parsed.harmonyMode === 'seventh' || parsed.harmonyMode === 'power' || parsed.harmonyMode === 'triad'
        ? parsed.harmonyMode
        : DEFAULT_HARMONIC_SETTINGS.harmonyMode
    return {
      keyId,
      harmonyMode,
      inversion: Math.max(0, Math.min(3, Number(parsed.inversion) || 0)),
    }
  } catch {
    return { ...DEFAULT_HARMONIC_SETTINGS }
  }
}

export function saveHarmonicSettings(settings: HarmonicSettings): void {
  try {
    localStorage.setItem(HARMONIC_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}
