/**
 * 旋律引力与经过音
 *
 * 基于当前和弦音 + 调内音阶构建候选音池；优先和弦音，允许调内经过音。
 */
import type { KeyId } from '../diatonicHarmony'
import { buildKeyScaleNotes } from '../diatonicHarmony'
import { getChordNotes } from '../chords'
import type { ScaleId } from '@/stores/musicIntentStore'
import { buildScaleNotes, midiToNote, noteToMidi } from '../scales'

function buildPoolFromScaleAndChord(
  chordNotes: string[],
  scaleNotes: string[],
): string[] {
  const chordPcs = new Set(chordNotes.map((n) => noteToMidi(n) % 12))
  const pool: string[] = []

  for (const note of scaleNotes) {
    pool.push(note)
    if (chordPcs.has(noteToMidi(note) % 12)) {
      pool.push(note)
      pool.push(note)
    }
  }

  for (const cn of chordNotes) {
    if (!pool.includes(cn)) pool.push(cn)
  }

  return [...new Set(pool)].sort((a, b) => noteToMidi(a) - noteToMidi(b))
}

/** 旧 API：从和弦 ID + 音阶 ID 构建（兼容） */
export function buildGravityPool(
  chord: string,
  scaleId: ScaleId,
  lowMidi: number,
  highMidi: number,
): string[] {
  return buildPoolFromScaleAndChord(
    getChordNotes(chord, scaleId),
    buildScaleNotes(scaleId, lowMidi, highMidi),
  )
}

/** 调性和声版：当前和弦音 + 调内音阶 */
export function buildGravityPoolForHarmony(
  chordNotes: string[],
  keyId: KeyId,
  lowMidi: number,
  highMidi: number,
): string[] {
  return buildPoolFromScaleAndChord(chordNotes, buildKeyScaleNotes(keyId, lowMidi, highMidi))
}

export function isChordTone(note: string, chord: string, scaleId: ScaleId): boolean {
  return isChordToneFromNotes(note, getChordNotes(chord, scaleId))
}

export function isChordToneFromNotes(note: string, chordNotes: string[]): boolean {
  const midi = noteToMidi(note) % 12
  return chordNotes.some((n) => noteToMidi(n) % 12 === midi)
}

export function nearestInPool(targetMidi: number, pool: string[], preferChordNotes?: string[]): string {
  if (pool.length === 0) return midiToNote(targetMidi)
  const chordPcs = preferChordNotes
    ? new Set(preferChordNotes.map((n) => noteToMidi(n) % 12))
    : null

  let best = pool[0]
  let bestScore = Infinity
  for (const n of pool) {
    const dist = Math.abs(noteToMidi(n) - targetMidi)
    const isChord = chordPcs?.has(noteToMidi(n) % 12) ?? false
    const score = dist - (isChord ? 1.5 : 0)
    if (score < bestScore) {
      bestScore = score
      best = n
    }
  }
  return best
}

export function pickPassingTone(
  fromMidi: number,
  toMidi: number,
  pool: string[],
  chordNotes: string[],
): string | null {
  if (Math.random() > 0.22) return null
  const lo = Math.min(fromMidi, toMidi)
  const hi = Math.max(fromMidi, toMidi)
  const candidates = pool.filter((n) => {
    const m = noteToMidi(n)
    return m > lo && m < hi && !isChordToneFromNotes(n, chordNotes)
  })
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}
