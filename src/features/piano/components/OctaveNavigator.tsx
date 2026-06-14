/**
 * 八度导航
 *
 * ◀▶ 整页切换；当前可见音区由 scrollPosition 连续决定。
 */
import {
  canShiftPage,
  formatViewportRange,
  usePianoStore,
} from '@/stores/pianoStore'

interface OctaveNavigatorProps {
  className?: string
}

export function OctaveNavigator({ className = '' }: OctaveNavigatorProps) {
  const scrollPosition = usePianoStore((s) => s.scrollPosition)
  const shiftPage = usePianoStore((s) => s.shiftPage)

  return (
    <div className={`flex items-center gap-1.5 ${className}`} title="整页切换；精细定位请用下方移动条">
      <button
        type="button"
        disabled={!canShiftPage(scrollPosition, -1)}
        onClick={() => shiftPage(-1)}
        className="rounded border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] text-white/70 transition hover:text-white disabled:opacity-30"
      >
        ◀
      </button>
      <span className="min-w-[5.5rem] text-center text-[10px] tabular-nums text-white/60">
        {formatViewportRange(scrollPosition)}
      </span>
      <button
        type="button"
        disabled={!canShiftPage(scrollPosition, 1)}
        onClick={() => shiftPage(1)}
        className="rounded border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] text-white/70 transition hover:text-white disabled:opacity-30"
      >
        ▶
      </button>
    </div>
  )
}
