/**
 * 手势分析常量
 *
 * 手部骨架连接、滤波参数、模型路径及追踪相关阈值。
 */
/** 掌心中心所用关键点索引（腕部 + MCP 关节）。 */
export const PALM_LANDMARKS = [0, 5, 9, 13, 17] as const

export const TRAIL_LENGTH = 24

/** 低于此速度（归一化坐标/秒）视为稳定。 */
export const STABLE_VELOCITY = 0.15

/** One Euro 滤波器默认参数。 */
export const ONE_EURO_MIN_CUTOFF = 1.0
export const ONE_EURO_BETA = 0.007

/** 由 public/mediapipe/wasm 提供（见 scripts/sync-gesture-assets.mjs）。 */
export const WASM_BASE = `${import.meta.env.BASE_URL}mediapipe/wasm`

export const HAND_MODEL_URL = `${import.meta.env.BASE_URL}models/hand_landmarker.task`

export const HAND_MODEL_URL_REMOTE =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** MediaPipe 手部骨架边列表（关键点索引对）。 */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
]

export const FINGERTIP_INDICES = [4, 8, 12, 16, 20] as const

const HAND_COLORS = ['#a78bfa', '#67e8f9'] as const

export function handColor(handIndex: number): string {
  return HAND_COLORS[handIndex % HAND_COLORS.length]
}
