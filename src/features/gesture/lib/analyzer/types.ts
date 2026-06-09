export interface NormPoint {
  x: number
  y: number
}

export interface HandVelocity {
  x: number
  y: number
  magnitude: number
}

/** Per-hand features extracted from MediaPipe landmarks (Gesture Analyzer output). */
export interface HandFeatures {
  handIndex: number
  label: string
  timestamp: number
  center: NormPoint
  velocity: HandVelocity
  /** |velocity| below STABLE_VELOCITY. */
  isStable: boolean
  /** 0 = fist, 1 = open palm. */
  openness: number
  /** Thumb–index distance (normalized). */
  pinch: number
  /** Raised fingers 0–5 (for left-hand chord selection). */
  extendedFingerCount: number
  /** Recent palm centers (oldest first). */
  trail: NormPoint[]
}

export interface AnalyzerSnapshot {
  hands: HandFeatures[]
  timestamp: number
}
