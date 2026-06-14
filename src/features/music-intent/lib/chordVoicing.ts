/**
 * 和弦 Voicing 构建
 *
 * 根据和弦 ID、品质（三和弦/七和弦）、转位与八度锚点生成实际音符。
 */
import type { ScaleId } from '@/stores/musicIntentStore'
import { CHORD_INTERVALS, getChordIdForQuality } from './chords'
import { midiToNote, noteToMidi, quantizeToScale } from './scales'

export type ChordQuality = 'triad' | 'seventh'

/** 将音高类序列在指定八度锚点展开为音符名 */
function intervalsToNotes(intervals: readonly number[], octaveAnchor: number): string[] {
  const rootMidi = (octaveAnchor + 1) * 12
  const notes: string[] = []
  let prevPc = -1
  let octaveBump = 0

  for (const interval of intervals) {
    const pc = ((interval % 12) + 12) % 12
    if (prevPc >= 0 && pc <= prevPc) octaveBump += 1
    const midi = rootMidi + interval + octaveBump * 12
    notes.push(midiToNote(midi))
    prevPc = pc
  }
  return notes
}

/** 对 voicing 应用转位（每次将最低音上移一个八度） */
export function applyInversion(notes: string[], inversion: number): string[] {
  if (notes.length === 0 || inversion <= 0) return [...notes]
  const result = notes.map((n) => n)
  const maxInv = Math.min(inversion, result.length - 1)
  for (let i = 0; i < maxInv; i++) {
    const bass = result.shift()!
    result.push(midiToNote(noteToMidi(bass) + 12))
  }
  return result
}

/** 按 semitone 平移一组音符 */
export function transposeNotes(notes: string[], semitones: number): string[] {
  if (semitones === 0) return [...notes]
  return notes.map((n) => midiToNote(noteToMidi(n) + semitones))
}

export function buildVoicing(
  chordId: string,
  quality: ChordQuality,
  inversion: number,
  octaveAnchor: number,
  scaleId?: ScaleId,
): string[] {
  const resolvedId = getChordIdForQuality(chordId, quality)
  const intervals = CHORD_INTERVALS[resolvedId]
  if (!intervals) return ['C3', 'E3', 'G3']

  let notes = intervalsToNotes(intervals, octaveAnchor)
  notes = applyInversion(notes, inversion)

  if (scaleId) {
    notes = notes.map((n) => quantizeToScale(n, scaleId))
  }
  return notes
}
