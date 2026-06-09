import type { ScaleId } from '@/stores/musicIntentStore'
import { quantizeToScale } from './scales'

export const CHORD_TONES: Record<string, string[]> = {
  C: ['C3', 'E3', 'G3'],
  Dm: ['D3', 'F3', 'A3'],
  Em: ['E3', 'G3', 'B3'],
  F: ['F3', 'A3', 'C4'],
  G: ['G3', 'B3', 'D4'],
  Am7: ['A3', 'C4', 'E4', 'G4'],
  Cmaj7: ['C3', 'E3', 'G3', 'B3'],
  Fmaj7: ['F3', 'A3', 'C4', 'E4'],
  G7: ['G3', 'B3', 'D4', 'F4'],
  Dm7: ['D3', 'F3', 'A3', 'C4'],
  Em7: ['E3', 'G3', 'B3', 'D4'],
}

export function getChordNotes(chord: string, scaleId: ScaleId): string[] {
  const raw = CHORD_TONES[chord] ?? CHORD_TONES.Am7
  return raw.map((n) => quantizeToScale(n, scaleId))
}

export function getPadVoicing(chord: string, scaleId: ScaleId): string[] {
  const notes = getChordNotes(chord, scaleId)
  return notes.slice(0, 4)
}

export function getExpandedPadVoicing(chord: string, scaleId: ScaleId): string[] {
  const base = getPadVoicing(chord, scaleId)
  const extra = quantizeToScale('B4', scaleId)
  if (!base.includes(extra)) return [...base, extra]
  return base
}
