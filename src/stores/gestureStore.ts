import { create } from 'zustand'
import type { AnalyzerSnapshot } from '@/features/gesture/lib/analyzer/types'
import type { GestureStatus, HandFrame } from '@/features/gesture/types'

interface GestureState {
  enabled: boolean
  status: GestureStatus
  error: string | null
  handCount: number
  fps: number
  lastFrame: HandFrame | null
  analyzerSnapshot: AnalyzerSnapshot | null
  setEnabled: (enabled: boolean) => void
  setStatus: (status: GestureStatus) => void
  setError: (error: string | null) => void
  setMetrics: (handCount: number, fps: number, lastFrame: HandFrame | null) => void
  setAnalyzerSnapshot: (snapshot: AnalyzerSnapshot | null) => void
  reset: () => void
}

export const useGestureStore = create<GestureState>((set) => ({
  enabled: false,
  status: 'idle',
  error: null,
  handCount: 0,
  fps: 0,
  lastFrame: null,
  analyzerSnapshot: null,
  setEnabled: (enabled) =>
    set({
      enabled,
      ...(enabled ? { status: 'starting-camera', error: null } : {}),
    }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setMetrics: (handCount, fps, lastFrame) => set({ handCount, fps, lastFrame }),
  setAnalyzerSnapshot: (snapshot) => set({ analyzerSnapshot: snapshot }),
  reset: () =>
    set({
      status: 'idle',
      error: null,
      handCount: 0,
      fps: 0,
      lastFrame: null,
      analyzerSnapshot: null,
    }),
}))
