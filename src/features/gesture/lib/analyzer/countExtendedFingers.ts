import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

function mirrorX(x: number): number {
  return 1 - x
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

/** Count raised fingers (0–5) from MediaPipe landmarks (mirrored X). */
export function countExtendedFingers(landmarks: NormalizedLandmark[]): number {
  const wristX = mirrorX(landmarks[0].x)
  const wristY = landmarks[0].y

  let count = 0

  const fingerTips = [8, 12, 16, 20] as const
  const fingerPips = [6, 10, 14, 18] as const

  for (let i = 0; i < fingerTips.length; i++) {
    const tipX = mirrorX(landmarks[fingerTips[i]].x)
    const tipY = landmarks[fingerTips[i]].y
    const pipX = mirrorX(landmarks[fingerPips[i]].x)
    const pipY = landmarks[fingerPips[i]].y
    const tipDist = dist(tipX, tipY, wristX, wristY)
    const pipDist = dist(pipX, pipY, wristX, wristY)
    if (tipDist > pipDist * 1.06 && tipY < pipY + 0.02) count++
  }

  const thumbTipX = mirrorX(landmarks[4].x)
  const thumbTipY = landmarks[4].y
  const thumbIpX = mirrorX(landmarks[3].x)
  const thumbIpY = landmarks[3].y
  const indexMcpX = mirrorX(landmarks[5].x)
  const indexMcpY = landmarks[5].y
  const thumbTipDist = dist(thumbTipX, thumbTipY, indexMcpX, indexMcpY)
  const thumbIpDist = dist(thumbIpX, thumbIpY, indexMcpX, indexMcpY)
  if (thumbTipDist > thumbIpDist * 1.08) count++

  return Math.max(0, Math.min(5, count))
}
