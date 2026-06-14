/**
 * 手部特征提取器
 *
 * 从 MediaPipe 关键点计算掌心中心、速度、张合度、伸指数及运动轨迹。
 */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import {
  FINGERTIP_INDICES,
  PALM_LANDMARKS,
  STABLE_VELOCITY,
  TRAIL_LENGTH,
} from '../constants'
import { computeFingerStates, FingerCountSmoother } from './countExtendedFingers'
import { OneEuroFilter2D } from './oneEuroFilter'
import type { HandFeatures, NormPoint } from './types'

function mirrorX(x: number): number {
  return 1 - x
}

function palmCenter(landmarks: NormalizedLandmark[]): NormPoint {
  let sx = 0
  let sy = 0
  for (const idx of PALM_LANDMARKS) {
    const lm = landmarks[idx]
    sx += mirrorX(lm.x)
    sy += lm.y
  }
  const n = PALM_LANDMARKS.length
  return { x: sx / n, y: sy / n }
}

function dist(a: NormPoint, b: NormPoint): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** 0 = 握拳，1 = 完全张开。 */
function computeOpenness(landmarks: NormalizedLandmark[]): number {
  const thumb = landmarks[4]
  const index = landmarks[8]

  const thumbIndex = dist(
    { x: mirrorX(thumb.x), y: thumb.y },
    { x: mirrorX(index.x), y: index.y },
  )

  const fingerTips = FINGERTIP_INDICES.map((i) => ({
    x: mirrorX(landmarks[i].x),
    y: landmarks[i].y,
  }))
  const palm = palmCenter(landmarks)
  const avgTipDist =
    fingerTips.reduce((sum, tip) => sum + dist(tip, palm), 0) / fingerTips.length

  const spread = Math.min(1, avgTipDist / 0.22)
  const pinchOpen = Math.min(1, thumbIndex / 0.18)
  return Math.min(1, spread * 0.65 + pinchOpen * 0.35)
}

interface HandRuntime {
  filter: OneEuroFilter2D
  prevCenter: NormPoint | null
  prevTimestamp: number | null
  trail: NormPoint[]
}

export class GestureAnalyzer {
  private readonly runtimes = new Map<number, HandRuntime>()
  private readonly fingerSmoother = new FingerCountSmoother()

  analyze(
    hands: NormalizedLandmark[][],
    labels: string[],
    timestamp: number,
  ): HandFeatures[] {
    const active = new Set<number>()

    const features = hands.map((landmarks, handIndex) => {
      active.add(handIndex)
      let runtime = this.runtimes.get(handIndex)
      if (!runtime) {
        runtime = {
          filter: new OneEuroFilter2D(),
          prevCenter: null,
          prevTimestamp: null,
          trail: [],
        }
        this.runtimes.set(handIndex, runtime)
      }

      const raw = palmCenter(landmarks)
      const center = runtime.filter.filter(raw.x, raw.y, timestamp)

      let vx = 0
      let vy = 0
      if (runtime.prevCenter !== null && runtime.prevTimestamp !== null) {
        const dt = Math.max((timestamp - runtime.prevTimestamp) / 1000, 1e-4)
        vx = (center.x - runtime.prevCenter.x) / dt
        vy = (center.y - runtime.prevCenter.y) / dt
      }

      runtime.prevCenter = center
      runtime.prevTimestamp = timestamp
      runtime.trail = [...runtime.trail, center].slice(-TRAIL_LENGTH)

      const magnitude = Math.sqrt(vx * vx + vy * vy)
      const openness = computeOpenness(landmarks)
      const fingerFrame = computeFingerStates(landmarks, labels[handIndex] ?? '')
      const extendedFingerCount = this.fingerSmoother.resolveAmbiguousFourFive(
        handIndex,
        fingerFrame,
      )
      const pinch = dist(
        { x: mirrorX(landmarks[4].x), y: landmarks[4].y },
        { x: mirrorX(landmarks[8].x), y: landmarks[8].y },
      )

      return {
        handIndex,
        label: labels[handIndex] ?? `Hand ${handIndex + 1}`,
        timestamp,
        center,
        velocity: { x: vx, y: vy, magnitude },
        isStable: magnitude < STABLE_VELOCITY,
        openness,
        extendedFingerCount,
        pinch,
        trail: [...runtime.trail],
      }
    })

    for (const key of this.runtimes.keys()) {
      if (!active.has(key)) {
        this.runtimes.delete(key)
        this.fingerSmoother.deleteHand(key)
      }
    }

    return features
  }

  reset(): void {
    this.runtimes.clear()
    this.fingerSmoother.reset()
  }
}
