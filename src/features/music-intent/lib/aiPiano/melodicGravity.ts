import type { ScaleId } from '@/stores/musicIntentStore'
import { getChordNotes } from '../chords'
import { buildScaleNotes, midiToNote, noteToMidi } from '../scales'

/** Chord tones + nearby scale pool for voice-leading. */
export function buildGravityPool(
  chord: string,
  scaleId: ScaleId,
  lowMidi: number,
  highMidi: number,
): string[] {
  const chordMidis = new Set(
    getChordNotes(chord, scaleId).map((n) => noteToMidi(n)),
  )
  const scaleNotes = buildScaleNotes(scaleId, lowMidi, highMidi)
  const pool = new Set<string>()

  for (const note of scaleNotes) {
    const midi = noteToMidi(note)
    pool.add(note)
    const pc = midi % 12
    for (const cm of chordMidis) {
      if (cm % 12 === pc) pool.add(note)
    }
  }

  return [...pool].sort((a, b) => noteToMidi(a) - noteToMidi(b))
}

export function isChordTone(note: string, chord: string, scaleId: ScaleId): boolean {
  const midi = noteToMidi(note)
  const tones = getChordNotes(chord, scaleId).map((n) => noteToMidi(n) % 12)
  return tones.includes(midi % 12)
}

export function nearestInPool(targetMidi: number, pool: string[]): string {
  if (pool.length === 0) return midiToNote(targetMidi)
  let best = pool[0]
  let bestDist = Infinity
  for (const n of pool) {
    const d = Math.abs(noteToMidi(n) - targetMidi)
    if (d < bestDist) {
      bestDist = d
      best = n
    }
  }
  return best
}

export function pickPassingTone(
  fromMidi: number,
  toMidi: number,
  pool: string[],
  chord: string,
  scaleId: ScaleId,
): string | null {
  if (Math.random() > 0.28) return null
  const lo = Math.min(fromMidi, toMidi)
  const hi = Math.max(fromMidi, toMidi)
  const candidates = pool.filter((n) => {
    const m = noteToMidi(n)
    return m > lo && m < hi && !isChordTone(n, chord, scaleId)
  })
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}
