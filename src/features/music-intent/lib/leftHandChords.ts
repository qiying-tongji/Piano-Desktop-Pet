/** Left hand finger count → basic triads on the 2-octave keyboard (C3–B4). */
export interface LeftHandChord {
  fingerCount: 1 | 2 | 3 | 4 | 5
  id: string
  name: string
  /** Piano key notes highlighted + pad voicing. */
  notes: string[]
}

export const LEFT_HAND_CHORDS: readonly LeftHandChord[] = [
  { fingerCount: 1, id: 'C', name: 'C', notes: ['C3', 'E3', 'G3'] },
  { fingerCount: 2, id: 'Dm', name: 'Dm', notes: ['D3', 'F3', 'A3'] },
  { fingerCount: 3, id: 'Em', name: 'Em', notes: ['E3', 'G3', 'B3'] },
  { fingerCount: 4, id: 'F', name: 'F', notes: ['F3', 'A3', 'C4'] },
  { fingerCount: 5, id: 'G', name: 'G', notes: ['G3', 'B3', 'D4'] },
] as const

export function getLeftHandChordByFingerCount(count: number): LeftHandChord | null {
  if (count < 1 || count > 5) return null
  return LEFT_HAND_CHORDS.find((c) => c.fingerCount === count) ?? null
}

export function getLeftHandChordLabel(count: number): string {
  const chord = getLeftHandChordByFingerCount(count)
  return chord ? `${count}指 · ${chord.name}` : `${count}指`
}
