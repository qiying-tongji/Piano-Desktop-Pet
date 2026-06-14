/**
 * 手势分析器输出类型
 *
 * 定义归一化坐标、手部速度及单帧分析快照结构。
 */
export interface NormPoint {
  x: number
  y: number
}

export interface HandVelocity {
  x: number
  y: number
  magnitude: number
}

/** 从 MediaPipe 关键点提取的单手特征（Gesture Analyzer 输出）。 */
export interface HandFeatures {
  handIndex: number
  label: string
  timestamp: number
  center: NormPoint
  velocity: HandVelocity
  /** |velocity| 低于 STABLE_VELOCITY。 */
  isStable: boolean
  /** 0 = 握拳，1 = 完全张开。 */
  openness: number
  /** 拇指–食指距离（归一化）。 */
  pinch: number
  /** 伸指数量 0–5（用于左手和弦选择）。 */
  extendedFingerCount: number
  /** 近期掌心中心轨迹（旧 → 新）。 */
  trail: NormPoint[]
}

export interface AnalyzerSnapshot {
  hands: HandFeatures[]
  timestamp: number
}
