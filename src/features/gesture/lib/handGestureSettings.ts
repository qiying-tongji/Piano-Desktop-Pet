/**
 * 左右手手势模式配置
 *
 * 每只手独立选择：手势和弦 / 手势意图 / 关闭。
 */
import type { HandSide } from './intent/types'

/** 单手手势表达方式 */
export type HandGestureMode = 'chord' | 'intent' | 'off'

export interface HandAssignmentSettings {
  left: HandGestureMode
  right: HandGestureMode
}

export const DEFAULT_HAND_ASSIGNMENT: HandAssignmentSettings = {
  left: 'chord',
  right: 'intent',
}

export const HAND_GESTURE_MODE_OPTIONS: {
  id: HandGestureMode
  label: string
  hint: string
}[] = [
  { id: 'chord', label: '手势和弦', hint: '1–5 指 → I–V 级数和弦' },
  { id: 'intent', label: '手势意图', hint: '四向挥动 → 旋律短语' },
  { id: 'off', label: '关闭', hint: '该手不触发音乐响应' },
]

const STORAGE_KEY = 'piano-hand-assignment'

export function loadHandAssignment(): HandAssignmentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_HAND_ASSIGNMENT }
    const parsed = JSON.parse(raw) as Partial<HandAssignmentSettings>
    const valid = (v: unknown): v is HandGestureMode =>
      v === 'chord' || v === 'intent' || v === 'off'
    return {
      left: valid(parsed.left) ? parsed.left : DEFAULT_HAND_ASSIGNMENT.left,
      right: valid(parsed.right) ? parsed.right : DEFAULT_HAND_ASSIGNMENT.right,
    }
  } catch {
    return { ...DEFAULT_HAND_ASSIGNMENT }
  }
}

export function saveHandAssignment(settings: HandAssignmentSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

export function getHandMode(
  side: HandSide,
  settings: HandAssignmentSettings = loadHandAssignment(),
): HandGestureMode {
  return settings[side]
}

export function handModeLabel(mode: HandGestureMode): string {
  return HAND_GESTURE_MODE_OPTIONS.find((o) => o.id === mode)?.label ?? mode
}
