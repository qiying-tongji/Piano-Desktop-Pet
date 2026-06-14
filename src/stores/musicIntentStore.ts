/**
 * 音乐意图状态（Zustand）
 *
 * 调性和声 / 能量 / 左手和弦与右手短语高亮、最近意图事件。
 */
import { create } from 'zustand'
import type { IntentEvent } from '@/features/gesture/lib/intent/types'
import {
  loadHarmonicSettings,
  saveHarmonicSettings,
  type HarmonicSettings,
  type KeyId,
  type ChordHarmonyMode,
} from '@/features/music-intent/lib/diatonicHarmony'

/** 遗留类型：部分和弦工具仍引用，旋律已改由 harmonicKey 驱动 */
export type ScaleId = 'C-major' | 'A-minor' | 'C-pentatonic' | 'ambient-dorian'

/** 短语节奏风格，内部默认 dream，不再暴露 UI */
export type MusicMode = 'dream' | 'pulse' | 'drift' | 'ritual'

import type { HandChordHold } from '@/features/music-intent/lib/handChordState'

export interface MusicState {
  chord: string
  root: string
  energy: number
  tension: number
  ambience: number
  isHolding: boolean
  activeChordNotes: string[]
  /** 每只 MediaPipe 手独立的和弦按住状态 */
  handChordHolds: Record<number, HandChordHold>
  phraseHighlightNotes: string[]
  /** 每只手独立的短语高亮（合并后写入 phraseHighlightNotes） */
  phraseHighlightsByHand: Record<number, string[]>
  leftFingerCount: number
  lastPhraseBehavior: string | null
  pianoMood: 'neutral' | 'cinematic' | 'intimate'
  lastIntentAt: number
}

export const DEFAULT_MUSIC_STATE: MusicState = {
  chord: 'C',
  root: 'C3',
  energy: 0.5,
  tension: 0.3,
  ambience: 0.7,
  isHolding: false,
  activeChordNotes: [],
  handChordHolds: {},
  phraseHighlightNotes: [],
  phraseHighlightsByHand: {},
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
  harmonicSettings: HarmonicSettings
  recentIntents: IntentEvent[]
  setMusicState: (partial: Partial<MusicState>) => void
  setHarmonicKey: (keyId: KeyId) => void
  setHarmonyMode: (mode: ChordHarmonyMode) => void
  setChordInversion: (inversion: number) => void
  setHarmonicSettings: (partial: Partial<HarmonicSettings>) => void
  pushIntent: (event: IntentEvent) => void
  clearRecentIntents: () => void
  resetMusicState: () => void
}

export const useMusicIntentStore = create<MusicIntentState>((set, get) => ({
  musicState: DEFAULT_MUSIC_STATE,
  harmonicSettings: loadHarmonicSettings(),
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
  setHarmonicKey: (keyId) => {
    const next = { ...get().harmonicSettings, keyId }
    saveHarmonicSettings(next)
    set({ harmonicSettings: next })
  },
  setHarmonyMode: (harmonyMode) => {
    const next = { ...get().harmonicSettings, harmonyMode }
    saveHarmonicSettings(next)
    set({ harmonicSettings: next })
  },
  setChordInversion: (inversion) => {
    const next = { ...get().harmonicSettings, inversion: Math.max(0, Math.min(3, inversion)) }
    saveHarmonicSettings(next)
    set({ harmonicSettings: next })
  },
  setHarmonicSettings: (partial) => {
    const next = { ...get().harmonicSettings, ...partial }
    saveHarmonicSettings(next)
    set({ harmonicSettings: next })
  },
  pushIntent: (event) =>
    set((s) => ({
      recentIntents: [event, ...s.recentIntents].slice(0, 5),
    })),
  clearRecentIntents: () => set({ recentIntents: [] }),
  resetMusicState: () =>
    set({
      musicState: {
        ...DEFAULT_MUSIC_STATE,
        activeChordNotes: [],
        handChordHolds: {},
        phraseHighlightsByHand: {},
      },
      recentIntents: [],
    }),
}))
