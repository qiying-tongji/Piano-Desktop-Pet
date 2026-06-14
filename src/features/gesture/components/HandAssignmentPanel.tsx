/**
 * 左右手手势模式配置面板
 */
import { useMemo, useState } from 'react'
import {
  HAND_GESTURE_MODE_OPTIONS,
  handModeLabel,
  type HandGestureMode,
} from '@/features/gesture/lib/handGestureSettings'
import type { HandSide } from '@/features/gesture/lib/intent/types'
import { useGestureStore } from '@/stores/gestureStore'

const SIDE_LABEL: Record<HandSide, string> = {
  left: '左手',
  right: '右手',
}

export function HandAssignmentPanel() {
  const handAssignment = useGestureStore((s) => s.handAssignment)
  const setHandMode = useGestureStore((s) => s.setHandMode)
  const [open, setOpen] = useState(false)

  const summary = useMemo(
    () =>
      `${SIDE_LABEL.left} ${handModeLabel(handAssignment.left)} · ${SIDE_LABEL.right} ${handModeLabel(handAssignment.right)}`,
    [handAssignment.left, handAssignment.right],
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-white/70 transition hover:text-white"
        title={summary}
      >
        手势分工 {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(92vw,300px)] rounded-lg border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 text-[10px] text-white/55">
            按 MediaPipe 识别的左/右手分别配置（与摄像头镜像一致）
          </p>
          <div className="space-y-2">
            {(['left', 'right'] as HandSide[]).map((side) => (
              <label key={side} className="flex flex-col gap-0.5 text-[10px]">
                <span className="text-white/50">{SIDE_LABEL[side]}</span>
                <select
                  value={handAssignment[side]}
                  onChange={(e) => setHandMode(side, e.target.value as HandGestureMode)}
                  className="rounded border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white/85"
                >
                  {HAND_GESTURE_MODE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id} title={o.hint}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-white/40">
            双手同时入镜时仍可触发「张开 / 收拢」。和弦映射面板对「手势和弦」模式生效。
          </p>
        </div>
      )}
    </div>
  )
}
