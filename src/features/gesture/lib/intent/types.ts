export type IntentType =
  | 'swipe'
  | 'expand'
  | 'compress'
  | 'chord_select'
  | 'chord_release'

export type HandSide = 'left' | 'right'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface IntentEvent {
  type: IntentType
  hand: HandSide
  handIndex: number
  strength: number
  direction?: SwipeDirection
  fingerCount?: number
  chordId?: string
  timestamp: number
}

export const INTENT_LABELS: Record<IntentType, string> = {
  swipe: 'Phrase',
  expand: 'Expand ✦',
  compress: 'Compress ●',
  chord_select: 'Chord ♯',
  chord_release: 'Chord↑',
}
