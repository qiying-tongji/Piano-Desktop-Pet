import type { HandSide } from './types'

/** MediaPipe handedness label → side (mirrored camera). */
export function normalizeHandSide(label: string): HandSide {
  return label.toLowerCase().includes('left') ? 'left' : 'right'
}

export function isExpressionHand(side: HandSide): boolean {
  return side === 'right'
}

export function isWorldHand(side: HandSide): boolean {
  return side === 'left'
}
