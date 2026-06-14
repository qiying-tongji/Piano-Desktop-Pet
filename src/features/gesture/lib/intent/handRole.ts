/**
 * 左右手角色划分
 *
 * 根据用户配置（手势和弦 / 手势意图 / 关闭）决定每只 MediaPipe 手的响应类型。
 */
import {
  getHandMode,
  handModeLabel,
  type HandGestureMode,
} from '../handGestureSettings'
import { useGestureStore } from '@/stores/gestureStore'
import type { HandSide } from './types'

/** MediaPipe 左右手标签 → left / right */
export function normalizeHandSide(label: string): HandSide {
  return label.toLowerCase().includes('left') ? 'left' : 'right'
}

export function getHandGestureMode(side: HandSide): HandGestureMode {
  return getHandMode(side, useGestureStore.getState().handAssignment)
}

export function handSupportsChord(side: HandSide): boolean {
  return getHandGestureMode(side) === 'chord'
}

export function handSupportsIntent(side: HandSide): boolean {
  return getHandGestureMode(side) === 'intent'
}

export function handRoleLabel(side: HandSide): string {
  const mode = getHandGestureMode(side)
  const sideLabel = side === 'left' ? '左手' : '右手'
  if (mode === 'off') return `${sideLabel}·关闭`
  return `${sideLabel}·${handModeLabel(mode)}`
}

/** @deprecated 使用 handSupportsIntent */
export function isExpressionHand(side: HandSide): boolean {
  return handSupportsIntent(side)
}

/** @deprecated 使用 handSupportsChord */
export function isWorldHand(side: HandSide): boolean {
  return handSupportsChord(side)
}
