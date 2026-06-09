import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type GestureStatus = 'idle' | 'loading-model' | 'starting-camera' | 'ready' | 'error'

export interface HandFrame {
  /** Normalized [0–1] landmarks per hand (21 points). */
  hands: NormalizedLandmark[][]
  /** Left / Right label per hand. */
  labels: string[]
  timestamp: number
}

export interface GestureRuntime {
  handCount: number
  fps: number
  lastFrame: HandFrame | null
}
