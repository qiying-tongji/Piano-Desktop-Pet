export type InputSource = 'mouse' | 'keyboard' | 'gesture'

export type NoteEvent =
  | { type: 'noteOn'; note: string; velocity: number; source: InputSource }
  | { type: 'noteOff'; note: string; source: InputSource }
