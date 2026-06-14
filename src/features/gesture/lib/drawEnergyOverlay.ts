/**
 * 手部骨架与能量可视化绘制
 *
 * 在 Canvas 上绘制 MediaPipe 手部骨架、运动轨迹、速度向量与能量核心。
 */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { HandFeatures } from './analyzer/types'
import { FINGERTIP_INDICES, HAND_CONNECTIONS, handColor } from './constants'

function toCanvasPoint(
  landmark: NormalizedLandmark,
  width: number,
  height: number,
  mirror: boolean,
): [number, number] {
  const x = mirror ? (1 - landmark.x) * width : landmark.x * width
  const y = landmark.y * height
  return [x, y]
}

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  hands: NormalizedLandmark[][],
  labels: string[],
  width: number,
  height: number,
  mirror = true,
  lite = false,
): void {
  hands.forEach((landmarks, handIndex) => {
    const color = handColor(handIndex)

    ctx.strokeStyle = `${color}88`
    ctx.lineWidth = lite ? 1.5 : 2
    ctx.lineCap = 'round'
    for (const [a, b] of HAND_CONNECTIONS) {
      const [ax, ay] = toCanvasPoint(landmarks[a], width, height, mirror)
      const [bx, by] = toCanvasPoint(landmarks[b], width, height, mirror)
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.stroke()
    }

    if (lite) return

    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = toCanvasPoint(landmarks[i], width, height, mirror)
      const isTip = FINGERTIP_INDICES.includes(i as (typeof FINGERTIP_INDICES)[number])
      ctx.beginPath()
      ctx.fillStyle = isTip ? `${color}cc` : 'rgba(255,255,255,0.5)'
      ctx.arc(x, y, isTip ? 5 : 3, 0, Math.PI * 2)
      ctx.fill()
    }

    const [wx, wy] = toCanvasPoint(landmarks[0], width, height, mirror)
    ctx.fillStyle = `${color}99`
    ctx.font = '9px Segoe UI, sans-serif'
    ctx.fillText(labels[handIndex] ?? `Hand ${handIndex + 1}`, wx + 6, wy - 6)
  })
}

/** 音乐能量可视化：轨迹、中心点、速度向量。 */
export function drawEnergyOverlay(
  ctx: CanvasRenderingContext2D,
  features: HandFeatures[],
  width: number,
  height: number,
): void {
  features.forEach((hand) => {
    const color = handColor(hand.handIndex)
    const cx = hand.center.x * width
    const cy = hand.center.y * height

    // 运动轨迹
    if (hand.trail.length > 1) {
      ctx.strokeStyle = `${color}44`
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      hand.trail.forEach((pt, i) => {
        const x = pt.x * width
        const y = pt.y * height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // 速度箭头（放大以便可见）
    const arrowScale = 0.08
    const vx = hand.velocity.x * arrowScale * width
    const vy = hand.velocity.y * arrowScale * height
    if (Math.abs(vx) > 2 || Math.abs(vy) > 2) {
      ctx.strokeStyle = hand.velocity.y > 0 ? '#67e8f9' : '#fbbf24'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + vx, cy + vy)
      ctx.stroke()
    }

    // 掌心能量核心
    const coreRadius = 6 + hand.openness * 10
    ctx.beginPath()
    ctx.fillStyle = `${color}55`
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = hand.isStable ? '#a78bfa' : `${color}cc`
    ctx.lineWidth = hand.isStable ? 2 : 1
    ctx.stroke()

    // 张合度光环
    if (hand.openness > 0.5) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(167, 139, 250, ${hand.openness * 0.4})`
      ctx.lineWidth = 1
      ctx.arc(cx, cy, coreRadius + 8 + hand.openness * 12, 0, Math.PI * 2)
      ctx.stroke()
    }
  })
}

export function drawEnergyField(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height * 0.6,
    0,
    width / 2,
    height * 0.6,
    width * 0.55,
  )
  gradient.addColorStop(0, 'rgba(103, 232, 249, 0.06)')
  gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.04)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
