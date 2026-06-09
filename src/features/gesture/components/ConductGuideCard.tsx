import { useCallback, useState } from 'react'

const DISMISS_KEY = 'piano-conduct-guide-dismissed'

const LEFT_ROWS = [
  { fingers: '1', chord: 'C' },
  { fingers: '2', chord: 'Dm' },
  { fingers: '3', chord: 'Em' },
  { fingers: '4', chord: 'F' },
  { fingers: '5', chord: 'G' },
] as const

const RIGHT_ROWS = [
  { gesture: '→ 右挥', effect: '旋律上行' },
  { gesture: '← 左挥', effect: '回落收句' },
  { gesture: '↑ 上挥', effect: '情绪升起' },
  { gesture: '↓ 下挥', effect: '段落缓和' },
] as const

const DUAL_ROWS = [
  { gesture: '双手张开', effect: '电影高潮' },
  { gesture: '双手收拢', effect: '安静亲密' },
] as const

export function ConductGuideCard() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [collapsed, setCollapsed] = useState(false)

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  if (dismissed) {
    return (
      <button
        type="button"
        title="显示指挥提示"
        onClick={() => {
          setDismissed(false)
          try {
            localStorage.removeItem(DISMISS_KEY)
          } catch {
            /* ignore */
          }
        }}
        className="window-no-drag pointer-events-auto absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/55 text-[11px] text-white/60 transition hover:border-pet-glow/40 hover:text-pet-accent"
      >
        ?
      </button>
    )
  }

  return (
    <div className="window-no-drag pointer-events-auto absolute right-2 top-2 z-30 w-[min(92%,220px)]">
      <div className="rounded-lg border border-white/10 bg-black/55 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b border-white/8 px-2.5 py-1.5">
          <p className="text-[10px] font-medium tracking-wide text-pet-accent">指挥提示</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title={collapsed ? '展开' : '收起'}
              onClick={() => setCollapsed((c) => !c)}
              className="rounded px-1.5 py-0.5 text-[9px] text-white/45 transition hover:bg-white/10 hover:text-white/75"
            >
              {collapsed ? '展开' : '收起'}
            </button>
            <button
              type="button"
              title="不再显示"
              onClick={dismiss}
              className="rounded px-1.5 py-0.5 text-[9px] text-white/45 transition hover:bg-white/10 hover:text-white/75"
            >
              ✕
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="space-y-2 px-2.5 py-2 text-[9px] leading-relaxed text-white/65">
            <section>
              <p className="mb-1 text-[8px] font-medium uppercase tracking-wider text-white/40">
                左手 · 和弦
              </p>
              <div className="grid grid-cols-5 gap-0.5">
                {LEFT_ROWS.map((row) => (
                  <div
                    key={row.fingers}
                    className="rounded bg-white/5 px-1 py-1 text-center"
                  >
                    <div className="text-pet-accent/90">{row.fingers}指</div>
                    <div className="text-[8px] text-white/55">{row.chord}</div>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[8px] text-white/40">握拳或手离开 → 松开和弦</p>
            </section>

            <section>
              <p className="mb-1 text-[8px] font-medium uppercase tracking-wider text-white/40">
                右手 · 大幅挥动
              </p>
              <ul className="space-y-0.5">
                {RIGHT_ROWS.map((row) => (
                  <li key={row.gesture} className="flex justify-between gap-2">
                    <span className="shrink-0 text-white/75">{row.gesture}</span>
                    <span className="text-right text-white/45">{row.effect}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[8px] text-white/40">慢挥稀疏 · 快挥密集有力</p>
            </section>

            <section>
              <p className="mb-1 text-[8px] font-medium uppercase tracking-wider text-white/40">
                双手
              </p>
              <ul className="space-y-0.5">
                {DUAL_ROWS.map((row) => (
                  <li key={row.gesture} className="flex justify-between gap-2">
                    <span className="text-white/75">{row.gesture}</span>
                    <span className="text-white/45">{row.effect}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
