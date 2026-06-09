import type { ScaleId } from '@/stores/musicIntentStore'

/** Pitch classes (0=C … 11=B) per scale. */
export const SCALE_PITCH_CLASSES: Record<ScaleId, readonly number[]> = {
  'C-major': [0, 2, 4, 5, 7, 9, 11],
  'A-minor': [9, 11, 0, 2, 4, 5, 7],
  'C-pentatonic': [0, 2, 4, 7, 9],
  'ambient-dorian': [2, 4, 5, 7, 9, 10, 0],
}

export const SCALE_ROOT_MIDI: Record<ScaleId, number> = {
  'C-major': 48,
  'A-minor': 45,
  'C-pentatonic': 48,
  'ambient-dorian': 50,
}

/** Build ascending scale notes across octaves (e.g. C3–C5). */
export function buildScaleNotes(scaleId: ScaleId, lowMidi = 48, highMidi = 72): string[] {
  const classes = SCALE_PITCH_CLASSES[scaleId]
  const notes: string[] = []
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    if (classes.includes(midi % 12)) {
      notes.push(midiToNote(midi))
    }
  }
  return notes
}

export function noteToMidi(note: string): number {
  const parsed = note.match(/^([A-Ga-g])(#|b)?(\d)$/)
  if (!parsed) return 60
  const [, letterRaw, acc, octaveStr] = parsed
  const letter = letterRaw.toUpperCase()
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let pc = base[letter] ?? 0
  if (acc === '#') pc += 1
  if (acc === 'b') pc -= 1
  return (Number(octaveStr) + 1) * 12 + ((pc % 12) + 12) % 12
}

export function midiToNote(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${names[pc]}${octave}`
}

export function quantizeToScale(note: string, scaleId: ScaleId): string {
  const target = noteToMidi(note)
  const scaleNotes = buildScaleNotes(scaleId, 36, 84)
  if (scaleNotes.length === 0) return note

  let best = scaleNotes[0]
  let bestDist = Infinity
  for (const candidate of scaleNotes) {
    const dist = Math.abs(noteToMidi(candidate) - target)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }
  return best
}

export function scaleIndexOf(note: string, scaleId: ScaleId): number {
  const notes = buildScaleNotes(scaleId, 36, 84)
  const midi = noteToMidi(note)
  return notes.findIndex((n) => noteToMidi(n) === midi)
}
