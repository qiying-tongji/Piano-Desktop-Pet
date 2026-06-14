/**
 * 键盘视口移动条
 *
 * 显示当前位置在全键盘 C2–B6 中的区间，拖拽滑块连续切换视口。
 */
import { useCallback, useRef } from 'react'
import {
  getTotalWhiteKeys,
  KEYBOARD_MAX_OCTAVE,
  KEYBOARD_MIN_OCTAVE,
  VISIBLE_WHITE_KEYS,
} from '@/features/piano/constants/keys'
import {
  formatViewportRange,
  getMaxScroll,
  usePianoStore,
} from '@/stores/pianoStore'

export function KeyboardViewportBar() {
  const scrollPosition = usePianoStore((s) => s.scrollPosition)
  const setScrollPosition = usePianoStore((s) => s.setScrollPosition)

  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<number | null>(null)

  const totalWhite = getTotalWhiteKeys()
  const maxScroll = getMaxScroll()
  const windowRatio = VISIBLE_WHITE_KEYS / totalWhite
  const travelRatio = Math.max(0.001, 1 - windowRatio)
  const thumbLeftPct = maxScroll > 0 ? (scrollPosition / maxScroll) * travelRatio * 100 : 0

  const scrollFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || maxScroll <= 0) return 0

      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return ratio * maxScroll
    },
    [maxScroll],
  )

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      dragRef.current = e.pointerId
      setScrollPosition(scrollFromPointer(e.clientX))
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [scrollFromPointer, setScrollPosition],
  )

  const onTrackPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current !== e.pointerId) return
      setScrollPosition(scrollFromPointer(e.clientX))
    },
    [scrollFromPointer, setScrollPosition],
  )

  const onTrackPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1500px)]">
      <div className="mb-1 flex items-center justify-between text-[9px] tabular-nums text-white/40">
        <span>C{KEYBOARD_MIN_OCTAVE}</span>
        <span className="text-white/55">{formatViewportRange(scrollPosition)}</span>
        <span>B{KEYBOARD_MAX_OCTAVE}</span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        aria-label="键盘视口位置"
        aria-valuemin={0}
        aria-valuemax={maxScroll}
        aria-valuenow={scrollPosition}
        className="relative h-4 cursor-grab touch-none rounded-full bg-white/8 ring-1 ring-white/10 active:cursor-grabbing"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        onPointerCancel={onTrackPointerUp}
      >
        <div
          className="absolute inset-y-0.5 rounded-full border border-pet-glow/45 bg-pet-glow/25 shadow-[0_0_12px_rgba(167,139,250,0.25)]"
          style={{
            left: `${thumbLeftPct}%`,
            width: `${windowRatio * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
