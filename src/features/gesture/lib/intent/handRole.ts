import type { HandSide } from './types'

/** MediaPipe handedness label → player's left / right. */
export function normalizeHandSide(label: string): HandSide {
  return label.toLowerCase().includes('left') ? 'left' : 'right'
}

export function isExpressionHand(side: HandSide): boolean {
  return side === 'right'
}

export function isWorldHand(side: HandSide): boolean {
  return side === 'left'
}

export function handRoleLabel(side: HandSide): string {
  return side === 'left' ? '左手·和弦' : '右手·旋律'
}
