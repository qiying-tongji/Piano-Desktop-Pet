import type { ScaleId } from '@/stores/musicIntentStore'

export type PhraseBehavior = 'ascend' | 'descend' | 'lift' | 'settle' | 'climax' | 'intimate'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface PhraseNote {
  note: string
  time: number
  velocity: number
  duration: string
}

export interface PianoPhrase {
  behavior: PhraseBehavior
  direction: SwipeDirection | null
  notes: PhraseNote[]
  /** Total phrase length in seconds (for UI highlight). */
  durationSec: number
}

export interface PhraseMemory {
  previousNotes: string[]
  previousNote: string | null
  previousBehavior: PhraseBehavior | null
  registerBias: number
}

export const DEFAULT_PHRASE_MEMORY: PhraseMemory = {
  previousNotes: [],
  previousNote: null,
  previousBehavior: null,
  registerBias: 0.5,
}

export interface PhraseRequest {
  behavior: PhraseBehavior
  direction: SwipeDirection | null
  chord: string
  scale: ScaleId
  energy: number
  tension: number
  strength: number
  memory: PhraseMemory
}
