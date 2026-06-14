/**
 * 万花筒娱乐方式切换 hub
 *
 * 中心棱镜 + 轨道晶面卡片 + 多层镜像背景。
 */
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ENTERTAINMENT_VIEW_LIST,
  type EntertainmentViewId,
} from '@/features/entertainment/lib/viewRegistry'
import { useEntertainmentStore } from '@/stores/entertainmentStore'
import { useAppStore } from '@/stores/appStore'

const MIRROR_WEDGES = 8
const ORBIT_ANGLES = [-90, 30, 150]
const GEM_COLORS = [
  { glow: '#a78bfa', edge: '#c4b5fd', core: 'rgba(167,139,250,0.35)' },
  { glow: '#22d3ee', edge: '#67e8f9', core: 'rgba(34,211,238,0.3)' },
  { glow: '#f472b6', edge: '#f9a8d4', core: 'rgba(244,114,182,0.28)' },
]

function useOrbitRadius() {
  const [radius, setRadius] = useState(168)
  useEffect(() => {
    const update = () => setRadius(Math.min(Math.max(window.innerWidth * 0.26, 120), 210))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return radius
}

function KaleidoscopeMirrorField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#030308]" />
      <div className="absolute inset-0 opacity-[0.35] mix-blend-soft-light [background-image:radial-gradient(circle_at_20%_20%,#a78bfa_0%,transparent_42%),radial-gradient(circle_at_80%_30%,#22d3ee_0%,transparent_38%),radial-gradient(circle_at_50%_90%,#f472b6_0%,transparent_45%)]" />

      {Array.from({ length: MIRROR_WEDGES }, (_, i) => (
        <motion.div
          key={`wedge-${i}`}
          className="absolute left-1/2 top-1/2 origin-bottom"
          style={{
            width: '55vmax',
            height: '55vmax',
            marginLeft: '-27.5vmax',
            marginTop: '-55vmax',
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
            background: `linear-gradient(180deg, ${i % 2 === 0 ? 'rgba(167,139,250,0.14)' : 'rgba(34,211,238,0.1)'} 0%, transparent 72%)`,
            rotate: `${i * (360 / MIRROR_WEDGES)}deg`,
          }}
          animate={{ rotate: `${i * (360 / MIRROR_WEDGES) + 360}deg` }}
          transition={{ duration: 72 + i * 6, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {Array.from({ length: MIRROR_WEDGES }, (_, i) => (
        <motion.div
          key={`shard-${i}`}
          className="absolute left-1/2 top-1/2 h-px w-[42vmax] origin-left"
          style={{
            background: `linear-gradient(90deg, transparent, ${i % 3 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(167,139,250,0.08)'}, transparent)`,
            rotate: `${i * (360 / MIRROR_WEDGES) + 22.5}deg`,
          }}
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2 h-[min(88vw,520px)] w-[min(88vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]"
        animate={{ rotate: 360, scale: [1, 1.03, 1] }}
        transition={{
          rotate: { duration: 90, repeat: Infinity, ease: 'linear' },
          scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[min(62vw,360px)] w-[min(62vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-pet-glow/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030308_68%)]" />
    </div>
  )
}

interface GemCardProps {
  view: (typeof ENTERTAINMENT_VIEW_LIST)[number]
  index: number
  angleDeg: number
  orbitR: number
  isLastUsed: boolean
  onSelect: (id: EntertainmentViewId, available: boolean) => void
}

function KaleidoscopeGemCard({
  view,
  index,
  angleDeg,
  orbitR,
  isLastUsed,
  onSelect,
}: GemCardProps) {
  const colors = GEM_COLORS[index % GEM_COLORS.length]
  const rad = (angleDeg * Math.PI) / 180
  const tx = Math.cos(rad) * orbitR
  const ty = Math.sin(rad) * orbitR

  return (
    <motion.button
      type="button"
      disabled={!view.available}
      initial={{ opacity: 0, scale: 0.35, x: tx * 0.3, y: ty * 0.3 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: tx,
        y: [ty, ty - 5, ty],
      }}
      transition={{
        opacity: { delay: 0.12 + index * 0.1 },
        scale: { delay: 0.12 + index * 0.1, type: 'spring', stiffness: 260, damping: 20 },
        x: { delay: 0.12 + index * 0.1, type: 'spring', stiffness: 200, damping: 22 },
        y: { duration: 3.4 + index * 0.45, repeat: Infinity, ease: 'easeInOut', delay: 0.5 + index * 0.15 },
      }}
      whileHover={view.available ? { scale: 1.1, zIndex: 30 } : undefined}
      whileTap={view.available ? { scale: 0.92 } : undefined}
      onClick={() => onSelect(view.id, view.available)}
      className={[
        'window-no-drag group absolute left-1/2 top-1/2 flex w-[min(44vw,10.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center',
        view.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
      ].join(' ')}
    >
      <div
        className="relative flex h-[min(44vw,7.25rem)] w-[min(44vw,7.25rem)] items-center justify-center transition duration-300 group-hover:drop-shadow-[0_0_28px_var(--gem-glow)]"
        style={{ ['--gem-glow' as string]: colors.glow }}
      >
        <motion.div
          className="absolute inset-[8%] rounded-2xl border"
          style={{
            rotate: 45,
            borderColor: `${colors.edge}66`,
            background: `linear-gradient(135deg, ${colors.core}, rgba(255,255,255,0.05))`,
            boxShadow: `inset 0 0 28px ${colors.core}, 0 8px 36px ${colors.glow}40`,
          }}
          whileHover={view.available ? { rotate: 50, scale: 1.06 } : undefined}
        />
        <div className="absolute inset-[17%] rotate-45 rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm" />
        <span className="relative z-10 text-[clamp(1.75rem,5.5vw,2.65rem)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {view.icon}
        </span>
        {isLastUsed && view.available && (
          <span className="absolute -right-0.5 -top-0.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-pet-accent text-[9px] font-bold text-black shadow-[0_0_14px_rgba(167,139,250,0.85)]">
            ★
          </span>
        )}
      </div>

      <div className="mt-2.5 w-full text-center">
        <h2
          className="text-[clamp(10px,2.6vw,12px)] font-semibold tracking-wider"
          style={{ color: view.available ? colors.edge : 'rgba(255,255,255,0.35)' }}
        >
          {view.title}
        </h2>
        <p className="mt-0.5 text-[9px] leading-snug text-white/38">{view.subtitle}</p>
        {!view.available && (
          <span className="mt-1.5 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-px text-[8px] uppercase tracking-widest text-white/32">
            soon
          </span>
        )}
      </div>
    </motion.button>
  )
}

function CentralPrism({
  pointerX,
  pointerY,
}: {
  pointerX: ReturnType<typeof useMotionValue<number>>
  pointerY: ReturnType<typeof useMotionValue<number>>
}) {
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [10, -10]), {
    stiffness: 100,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 100,
    damping: 20,
  })

  return (
    <motion.div
      className="pointer-events-none relative z-[5] flex flex-col items-center justify-center [transform-style:preserve-3d]"
      style={{ rotateX, rotateY }}
    >
      <motion.div
        className="relative flex h-[clamp(5.5rem,18vw,8rem)] w-[clamp(5.5rem,18vw,8rem)] items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 60, 120].map((deg) => (
          <div key={deg} className="absolute h-full w-full" style={{ rotate: `${deg}deg` }}>
            <div
              className="mx-auto h-full w-[3px] rounded-full opacity-90"
              style={{
                background:
                  'linear-gradient(180deg, transparent, #a78bfa, #22d3ee, #f472b6, transparent)',
                boxShadow: '0 0 22px rgba(167,139,250,0.55)',
              }}
            />
          </div>
        ))}
        <div className="absolute inset-[14%] rounded-full border border-white/25 bg-gradient-to-br from-violet-500/30 via-cyan-400/15 to-fuchsia-500/25 backdrop-blur-md shadow-[inset_0_0_48px_rgba(167,139,250,0.3),0_0_72px_rgba(34,211,238,0.18)]" />
        <motion.span
          className="relative text-[clamp(1.75rem,5vw,2.5rem)]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✦
        </motion.span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-4 text-center text-[10px] tracking-[0.4em] text-white/45"
      >
        折射 · 选择一种光
      </motion.p>
      <p className="mt-1 text-center text-[9px] text-white/28">点击轨道晶面进入</p>
    </motion.div>
  )
}

export function KaleidoscopeHub() {
  const selectView = useEntertainmentStore((s) => s.selectView)
  const lastView = useEntertainmentStore((s) => s.lastView)
  const setMode = useAppStore((s) => s.setMode)
  const windowError = useAppStore((s) => s.windowError)
  const stageRef = useRef<HTMLDivElement>(null)
  const orbitR = useOrbitRadius()

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  const onStageMove = useCallback(
    (e: React.MouseEvent) => {
      const el = stageRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      pointerX.set((e.clientX - rect.left) / rect.width - 0.5)
      pointerY.set((e.clientY - rect.top) / rect.height - 0.5)
    },
    [pointerX, pointerY],
  )

  const handleSelect = (id: EntertainmentViewId, available: boolean) => {
    if (!available) return
    selectView(id)
  }

  const handleBack = () => selectView(lastView)

  const handleCollapse = async () => {
    setMode('pet')
    await window.electronAPI?.setAppWindowMode('pet')
  }

  return (
    <div className="entertainment-shell relative overflow-hidden">
      <KaleidoscopeMirrorField />

      <div className="relative z-10 flex h-full flex-col">
        <div className="window-drag flex shrink-0 cursor-grab items-center justify-between border-b border-white/[0.07] bg-black/40 px-5 py-2.5 backdrop-blur-md active:cursor-grabbing">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-pet-glow/30 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-sm shadow-[0_0_20px_rgba(167,139,250,0.2)]">
              ✦
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-violet-200 via-cyan-200 to-fuchsia-200 bg-clip-text text-sm font-semibold tracking-[0.2em] text-transparent">
                万花筒
              </h1>
              <p className="text-[10px] text-white/40">KALEIDOSCOPE · 娱乐折射台</p>
            </div>
          </div>
          <div className="window-no-drag flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] text-white/70 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              ← {lastView === 'piano' ? '钢琴' : '返回'}
            </button>
            <button
              type="button"
              onClick={() => void handleCollapse()}
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] text-white/70 transition hover:border-violet-400/40 hover:text-violet-200"
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

        <div
          ref={stageRef}
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden [perspective:900px]"
          onMouseMove={onStageMove}
        >
          <CentralPrism pointerX={pointerX} pointerY={pointerY} />

          {ENTERTAINMENT_VIEW_LIST.map((view, index) => (
            <KaleidoscopeGemCard
              key={view.id}
              view={view}
              index={index}
              angleDeg={ORBIT_ANGLES[index] ?? index * 120 - 90}
              orbitR={orbitR}
              isLastUsed={view.id === lastView}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <div className="window-no-drag shrink-0 border-t border-white/[0.06] bg-black/30 px-5 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg items-center justify-center gap-6 text-[9px] uppercase tracking-[0.25em] text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400/80 shadow-[0_0_8px_#a78bfa]" />
              钢琴
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]" />
              小游戏
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400/80 shadow-[0_0_8px_#f472b6]" />
              更多
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
