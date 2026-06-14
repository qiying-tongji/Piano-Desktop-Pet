/**
 * 手势识别状态（Zustand）
 *
 * 摄像头开关、MediaPipe 状态、FPS、左右手手势模式配置等。
 */
import { create } from 'zustand'
import type { AnalyzerSnapshot } from '@/features/gesture/lib/analyzer/types'
import {
  loadHandAssignment,
  saveHandAssignment,
  type HandAssignmentSettings,
  type HandGestureMode,
} from '@/features/gesture/lib/handGestureSettings'
import type { HandSide } from '@/features/gesture/lib/intent/types'
import type { GestureStatus, HandFrame } from '@/features/gesture/types'

interface GestureState {
  enabled: boolean
  status: GestureStatus
  error: string | null
  handCount: number
  fps: number
  lastFrame: HandFrame | null
  analyzerSnapshot: AnalyzerSnapshot | null
  handAssignment: HandAssignmentSettings
  setEnabled: (enabled: boolean) => void
  setStatus: (status: GestureStatus) => void
  setError: (error: string | null) => void
  setMetrics: (handCount: number, fps: number, lastFrame: HandFrame | null) => void
  setAnalyzerSnapshot: (snapshot: AnalyzerSnapshot | null) => void
  setHandMode: (side: HandSide, mode: HandGestureMode) => void
  setHandAssignment: (settings: HandAssignmentSettings) => void
  reset: () => void
}

export const useGestureStore = create<GestureState>((set, get) => ({
  enabled: false,
  status: 'idle',
  error: null,
  handCount: 0,
  fps: 0,
  lastFrame: null,
  analyzerSnapshot: null,
  handAssignment: loadHandAssignment(),
  setEnabled: (enabled) =>
    set({
      enabled,
      ...(enabled ? { status: 'starting-camera', error: null } : {}),
    }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setMetrics: (handCount, fps, lastFrame) => set({ handCount, fps, lastFrame }),
  setAnalyzerSnapshot: (snapshot) => set({ analyzerSnapshot: snapshot }),
  setHandMode: (side, mode) => {
    const next = { ...get().handAssignment, [side]: mode }
    saveHandAssignment(next)
    set({ handAssignment: next })
  },
  setHandAssignment: (settings) => {
    saveHandAssignment(settings)
    set({ handAssignment: settings })
  },
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
