export interface PianoKeyDef {
  note: string
  label: string
  type: 'white' | 'black'
  /** Index among white keys (for layout). */
  whiteIndex?: number
  /** Black key sits after this white key index. */
  afterWhite?: number
}

/** Two octaves: C3 – B4 */
export const PIANO_KEYS: PianoKeyDef[] = [
  { note: 'C3', label: 'C', type: 'white', whiteIndex: 0 },
  { note: 'C#3', label: 'C#', type: 'black', afterWhite: 0 },
  { note: 'D3', label: 'D', type: 'white', whiteIndex: 1 },
  { note: 'D#3', label: 'D#', type: 'black', afterWhite: 1 },
  { note: 'E3', label: 'E', type: 'white', whiteIndex: 2 },
  { note: 'F3', label: 'F', type: 'white', whiteIndex: 3 },
  { note: 'F#3', label: 'F#', type: 'black', afterWhite: 3 },
  { note: 'G3', label: 'G', type: 'white', whiteIndex: 4 },
  { note: 'G#3', label: 'G#', type: 'black', afterWhite: 4 },
  { note: 'A3', label: 'A', type: 'white', whiteIndex: 5 },
  { note: 'A#3', label: 'A#', type: 'black', afterWhite: 5 },
  { note: 'B3', label: 'B', type: 'white', whiteIndex: 6 },
  { note: 'C4', label: 'C', type: 'white', whiteIndex: 7 },
  { note: 'C#4', label: 'C#', type: 'black', afterWhite: 7 },
  { note: 'D4', label: 'D', type: 'white', whiteIndex: 8 },
  { note: 'D#4', label: 'D#', type: 'black', afterWhite: 8 },
  { note: 'E4', label: 'E', type: 'white', whiteIndex: 9 },
  { note: 'F4', label: 'F', type: 'white', whiteIndex: 10 },
  { note: 'F#4', label: 'F#', type: 'black', afterWhite: 10 },
  { note: 'G4', label: 'G', type: 'white', whiteIndex: 11 },
  { note: 'G#4', label: 'G#', type: 'black', afterWhite: 11 },
  { note: 'A4', label: 'A', type: 'white', whiteIndex: 12 },
  { note: 'A#4', label: 'A#', type: 'black', afterWhite: 12 },
  { note: 'B4', label: 'B', type: 'white', whiteIndex: 13 },
]

export const WHITE_KEYS = PIANO_KEYS.filter((k) => k.type === 'white')
export const BLACK_KEYS = PIANO_KEYS.filter((k) => k.type === 'black')

/** Computer keyboard → note (two octaves). */
export const KEYBOARD_MAP: Record<string, string> = {
  z: 'C3',
  s: 'C#3',
  x: 'D3',
  d: 'D#3',
  c: 'E3',
  v: 'F3',
  g: 'F#3',
  b: 'G3',
  h: 'G#3',
  n: 'A3',
  j: 'A#3',
  m: 'B3',
  q: 'C4',
  '2': 'C#4',
  w: 'D4',
  '3': 'D#4',
  e: 'E4',
  r: 'F4',
  '5': 'F#4',
  t: 'G4',
  '6': 'G#4',
  y: 'A4',
  '7': 'A#4',
  u: 'B4',
}

export const KEY_LABELS: Record<string, string> = {
  C3: 'Z',
  'C#3': 'S',
  D3: 'X',
  'D#3': 'D',
  E3: 'C',
  F3: 'V',
  'F#3': 'G',
  G3: 'B',
  'G#3': 'H',
  A3: 'N',
  'A#3': 'J',
  B3: 'M',
  C4: 'Q',
  'C#4': '2',
  D4: 'W',
  'D#4': '3',
  E4: 'E',
  F4: 'R',
  'F#4': '5',
  G4: 'T',
  'G#4': '6',
  A4: 'Y',
  'A#4': '7',
  B4: 'U',
}
