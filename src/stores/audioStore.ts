/**
 * 音频 UI 状态（Zustand）
 *
 * 活跃音符集合、音量/混响/延音踏板、引擎就绪与加载状态。
 * 实际发声由 AudioEngine 单例负责，本 store 供 UI 订阅与同步。
 */
import { create } from 'zustand'

interface AudioState {
  activeNotes: Set<string>
  volume: number
  reverbWet: number
  sustain: boolean
  isReady: boolean
  isLoading: boolean
  setVolume: (volume: number) => void
  setReverbWet: (wet: number) => void
  setSustain: (sustain: boolean) => void
  setReady: (ready: boolean) => void
  setLoading: (loading: boolean) => void
  addActiveNote: (note: string) => void
  removeActiveNote: (note: string) => void
  clearActiveNotes: () => void
}

export const useAudioStore = create<AudioState>((set) => ({
  activeNotes: new Set(),
  volume: 0.75,
  reverbWet: 0.28,
  sustain: false,
  isReady: false,
  isLoading: false,
  setVolume: (volume) => set({ volume }),
  setReverbWet: (reverbWet) => set({ reverbWet }),
  setSustain: (sustain) => set({ sustain }),
  setReady: (isReady) => set({ isReady }),
  setLoading: (isLoading) => set({ isLoading }),
  addActiveNote: (note) =>
    set((s) => {
      const next = new Set(s.activeNotes)
      next.add(note)
      return { activeNotes: next }
    }),
  removeActiveNote: (note) =>
    set((s) => {
      const next = new Set(s.activeNotes)
      next.delete(note)
      return { activeNotes: next }
    }),
  clearActiveNotes: () => set({ activeNotes: new Set() }),
}))
