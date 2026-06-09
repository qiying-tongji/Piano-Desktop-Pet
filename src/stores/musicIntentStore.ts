import { create } from 'zustand'
import type { IntentEvent } from '@/features/gesture/lib/intent/types'

export type ScaleId = 'C-major' | 'A-minor' | 'C-pentatonic' | 'ambient-dorian'

export type MusicMode = 'dream' | 'pulse' | 'drift' | 'ritual'

export interface MusicState {
  scale: ScaleId
  chord: string
  root: string
  energy: number
  tension: number
  ambience: number
  mode: MusicMode
  isHolding: boolean
  loopActive: boolean
  /** Left-hand chord keys shown pressed on piano. */
  activeChordNotes: string[]
  /** Right-hand phrase keys briefly highlighted. */
  phraseHighlightNotes: string[]
  leftFingerCount: number
  lastPhraseBehavior: string | null
  pianoMood: 'neutral' | 'cinematic' | 'intimate'
  lastIntentAt: number
}

export const DEFAULT_MUSIC_STATE: MusicState = {
  scale: 'C-pentatonic',
  chord: 'C',
  root: 'C3',
  energy: 0.5,
  tension: 0.3,
  ambience: 0.7,
  mode: 'dream',
  isHolding: false,
  loopActive: false,
  activeChordNotes: [],
  phraseHighlightNotes: [],
  leftFingerCount: 0,
  lastPhraseBehavior: null,
  pianoMood: 'neutral',
  lastIntentAt: 0,
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

interface MusicIntentState {
  musicState: MusicState
  lastMelodyNote: string | null
  recentIntents: IntentEvent[]
  setMusicState: (partial: Partial<MusicState>) => void
  pushIntent: (event: IntentEvent) => void
  clearRecentIntents: () => void
  resetMusicState: () => void
}

export const useMusicIntentStore = create<MusicIntentState>((set) => ({
  musicState: DEFAULT_MUSIC_STATE,
  lastMelodyNote: null,
  recentIntents: [],
  setMusicState: (partial) =>
    set((s) => ({
      musicState: {
        ...s.musicState,
        ...partial,
        energy: partial.energy !== undefined ? clamp01(partial.energy) : s.musicState.energy,
        tension: partial.tension !== undefined ? clamp01(partial.tension) : s.musicState.tension,
        ambience: partial.ambience !== undefined ? clamp01(partial.ambience) : s.musicState.ambience,
      },
    })),
  pushIntent: (event) =>
    set((s) => ({
      recentIntents: [event, ...s.recentIntents].slice(0, 5),
    })),
  clearRecentIntents: () => set({ recentIntents: [] }),
  resetMusicState: () =>
    set({
      musicState: { ...DEFAULT_MUSIC_STATE, activeChordNotes: [] },
      recentIntents: [],
      lastMelodyNote: null,
    }),
}))
