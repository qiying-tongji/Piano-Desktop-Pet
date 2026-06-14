/**
 * 节奏挑战占位视图（后续可扩展为完整音乐小游戏）
 */
import type { EntertainmentViewComponentProps } from '@/features/entertainment/lib/viewRegistry'
import { useAppStore } from '@/stores/appStore'

export function RhythmGameView({ onOpenHub, onCollapseToPet }: EntertainmentViewComponentProps) {
  const windowError = useAppStore((s) => s.windowError)

  return (
    <div className="entertainment-shell flex h-full flex-col bg-[#07070d]/95">
      <div className="window-drag flex shrink-0 cursor-grab items-center justify-between border-b border-white/10 bg-black/30 px-5 py-3 active:cursor-grabbing">
        <div>
          <h1 className="text-base font-semibold tracking-widest text-pet-accent">节奏挑战</h1>
          <p className="mt-0.5 text-[11px] text-white/55">音乐小游戏 · 开发中</p>
        </div>
        <div className="window-no-drag flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHub}
            className="rounded-lg border border-pet-glow/35 bg-pet-glow/15 px-3 py-1.5 text-[11px] text-pet-accent transition hover:bg-pet-glow/25"
          >
            ✦ 万花筒
          </button>
          <button
            type="button"
            onClick={() => void onCollapseToPet()}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] text-white/80 transition hover:border-pet-glow/40 hover:text-pet-accent"
          >
            收起
          </button>
        </div>
      </div>

      {windowError && (
        <p className="window-no-drag shrink-0 bg-red-500/20 px-5 py-2 text-[11px] text-red-200">
          {windowError}
        </p>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="text-5xl">🥁</div>
        <h2 className="text-lg font-medium text-white/85">节奏挑战即将上线</h2>
        <p className="max-w-md text-[12px] leading-relaxed text-white/45">
          这里将放置跟拍演奏、音符下落等音乐小游戏。你可以通过「万花筒」随时切换回空气钢琴或其他娱乐方式。
        </p>
        <button
          type="button"
          onClick={onOpenHub}
          className="window-no-drag mt-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-[11px] text-white/75 transition hover:border-pet-glow/40 hover:text-pet-accent"
        >
          返回万花筒选择
        </button>
      </div>
    </div>
  )
}
