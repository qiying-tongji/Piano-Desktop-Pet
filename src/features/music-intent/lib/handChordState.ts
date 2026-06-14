/**
 * 多手并行和弦状态合并
 */
import type { HandSide } from '@/features/gesture/lib/intent/types'
import type { MusicState } from '@/stores/musicIntentStore'

export interface HandChordHold {
  handIndex: number
  side: HandSide
  fingerCount: number
  chordId: string
  root: string
  notes: string[]
}

export function mergeHandChordHolds(
  holds: Record<number, HandChordHold>,
): Pick<MusicState, 'activeChordNotes' | 'isHolding' | 'leftFingerCount' | 'chord' | 'root'> {
  const list = Object.values(holds)
  if (list.length === 0) {
    return {
      activeChordNotes: [],
      isHolding: false,
      leftFingerCount: 0,
      chord: 'C',
      root: 'C3',
    }
  }

  const activeChordNotes = [...new Set(list.flatMap((h) => h.notes))]
  const primary = list[list.length - 1]

  return {
    activeChordNotes,
    isHolding: true,
    leftFingerCount: primary.fingerCount,
    chord: primary.chordId,
    root: primary.root,
  }
}

export function mergePhraseHighlights(
  byHand: Record<number, string[]>,
): string[] {
  return [...new Set(Object.values(byHand).flat())]
}
