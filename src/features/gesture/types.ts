/**
 * 手势模块公共类型
 *
 * 定义手势追踪状态、单帧手部数据及运行时指标。
 */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type GestureStatus = 'idle' | 'loading-model' | 'starting-camera' | 'ready' | 'error'

export interface HandFrame {
  /** 归一化 [0–1] 关键点，每只手 21 个点。 */
  hands: NormalizedLandmark[][]
  /** 每只手的 Left / Right 标签。 */
  labels: string[]
  timestamp: number
}

export interface GestureRuntime {
  handCount: number
  fps: number
  lastFrame: HandFrame | null
}
