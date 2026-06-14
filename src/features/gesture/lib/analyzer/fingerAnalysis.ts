/**
 * 逐指几何分析
 *
 * 食/中/无/小：PIP/MCP 距离 + 高度；拇指：四指全伸时用宽松规则（5 指），否则严格（避免 4 指误判 5）。
 */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'

export interface FingerStates {
  thumb: boolean
  index: boolean
  middle: boolean
  ring: boolean
  pinky: boolean
}

function mirrorX(x: number): number {
  return 1 - x
}

function pt(landmarks: NormalizedLandmark[], index: number) {
  return { x: mirrorX(landmarks[index].x), y: landmarks[index].y }
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

function isNonThumbExtended(
  landmarks: NormalizedLandmark[],
  tip: number,
  pip: number,
  mcp: number,
  relaxed = false,
): boolean {
  const tipP = pt(landmarks, tip)
  const pipP = pt(landmarks, pip)
  const mcpP = pt(landmarks, mcp)
  const wristP = pt(landmarks, 0)

  const tipPip = dist(tipP.x, tipP.y, pipP.x, pipP.y)
  const pipMcp = dist(pipP.x, pipP.y, mcpP.x, mcpP.y)
  if (tipPip < pipMcp * (relaxed ? 0.65 : 0.72)) return false

  const tipWrist = dist(tipP.x, tipP.y, wristP.x, wristP.y)
  const pipWrist = dist(pipP.x, pipP.y, wristP.x, wristP.y)
  const mcpWrist = dist(mcpP.x, mcpP.y, wristP.x, wristP.y)
  if (tipWrist <= pipWrist * (relaxed ? 1.05 : 1.08)) return false
  if (tipWrist <= mcpWrist * (relaxed ? 1.02 : 1.04)) return false

  const yMargin = relaxed ? 0.006 : 0.012
  if (tipP.y >= pipP.y - yMargin) return false

  return true
}

/** 四指并拢、拇指贴掌 — 严格排除拇指 */
function isThumbTucked(landmarks: NormalizedLandmark[], handLabel: string): boolean {
  const isLeft = handLabel.toLowerCase().includes('left')
  const tip = pt(landmarks, 4)
  const ip = pt(landmarks, 3)
  const indexMcp = pt(landmarks, 5)

  const tipIndex = dist(tip.x, tip.y, indexMcp.x, indexMcp.y)
  const ipIndex = dist(ip.x, ip.y, indexMcp.x, indexMcp.y)
  if (tipIndex <= ipIndex * 1.08) return true

  const lateralSpread = isLeft ? tip.x - indexMcp.x : indexMcp.x - tip.x
  if (lateralSpread < 0.022) return true

  if (tip.y >= ip.y + 0.004) return true

  return false
}

/** 四指已伸直时判定第 5 指（宽松，适配自然张掌） */
function isThumbExtendedForOpenPalm(landmarks: NormalizedLandmark[], handLabel: string): boolean {
  if (isThumbTucked(landmarks, handLabel)) return false

  const isLeft = handLabel.toLowerCase().includes('left')
  const tip = pt(landmarks, 4)
  const ip = pt(landmarks, 3)
  const mcp = pt(landmarks, 2)
  const indexMcp = pt(landmarks, 5)
  const wrist = pt(landmarks, 0)

  const tipWrist = dist(tip.x, tip.y, wrist.x, wrist.y)
  const mcpWrist = dist(mcp.x, mcp.y, wrist.x, wrist.y)
  if (tipWrist < mcpWrist * 1.06) return false

  const tipIndex = dist(tip.x, tip.y, indexMcp.x, indexMcp.y)
  const ipIndex = dist(ip.x, ip.y, indexMcp.x, indexMcp.y)
  if (tipIndex <= ipIndex * 1.06) return false

  const lateralSpread = isLeft ? tip.x - indexMcp.x : indexMcp.x - tip.x
  if (lateralSpread < 0.018) return false

  return tip.y <= ip.y + 0.012
}

/** 1–3 指时拇指若明显外展则 +1 */
function isThumbExtendedStandalone(landmarks: NormalizedLandmark[], handLabel: string): boolean {
  if (isThumbTucked(landmarks, handLabel)) return false
  return isThumbExtendedForOpenPalm(landmarks, handLabel)
}

/** 单帧逐指状态（未做时间平滑） */
export function computeFingerStates(
  landmarks: NormalizedLandmark[],
  handLabel = '',
): FingerStates {
  const index = isNonThumbExtended(landmarks, 8, 6, 5)
  const middle = isNonThumbExtended(landmarks, 12, 10, 9)
  const ring = isNonThumbExtended(landmarks, 16, 14, 13)
  const pinky = isNonThumbExtended(landmarks, 20, 18, 17, true)
  const fourUp = index && middle && ring && pinky

  const thumb = fourUp
    ? isThumbExtendedForOpenPalm(landmarks, handLabel)
    : isThumbExtendedStandalone(landmarks, handLabel)

  return { thumb, index, middle, ring, pinky }
}

export function fingerStatesToArray(states: FingerStates): boolean[] {
  return [states.thumb, states.index, states.middle, states.ring, states.pinky]
}

export function countFromFingerStates(states: FingerStates): number {
  return fingerStatesToArray(states).filter(Boolean).length
}

/** 兼容旧 API：单帧计数 */
export function countExtendedFingers(
  landmarks: NormalizedLandmark[],
  handLabel = '',
): number {
  return countFromFingerStates(computeFingerStates(landmarks, handLabel))
}
