/**
 * 单颗琴键组件
 *
 * 支持鼠标/触摸交互；激活时整键表面高亮（键盘/和弦/短语统一反馈）。
 * 白键用 relative，黑键用 absolute（避免与 Tailwind position 类冲突）。
 */
import { motion } from 'framer-motion'

interface PianoKeyProps {
  note: string
  /** 音高标签，如 C3（显示在键顶） */
  pitchLabel?: string
  /** 电脑键盘映射标识（显示在键底） */
  label?: string
  variant?: 'white' | 'black'
  active: boolean
  onPress: (note: string) => void
  onRelease: (note: string) => void
  className?: string
  style?: React.CSSProperties
}

export function PianoKey({
  note,
  pitchLabel,
  label,
  variant = 'white',
  active,
  onPress,
  onRelease,
  className = '',
  style,
}: PianoKeyProps) {
  const isWhite = variant === 'white'

  const surfaceClass = isWhite
    ? active
      ? 'border-violet-400/95 bg-gradient-to-b from-violet-50 via-violet-300 to-violet-500 shadow-[0_0_28px_rgba(167,139,250,0.95),inset_0_0_24px_rgba(255,255,255,0.55)]'
      : 'border-slate-400/25 bg-gradient-to-b from-slate-50 to-slate-300 shadow-[0_2px_6px_rgba(0,0,0,0.35)]'
    : active
      ? 'border-pet-glow bg-gradient-to-b from-violet-400 via-violet-600 to-violet-950 shadow-[0_0_22px_rgba(167,139,250,0.95),inset_0_0_18px_rgba(196,181,253,0.5)]'
      : 'border-violet-400/25 bg-gradient-to-b from-slate-700 to-slate-950 shadow-md'

  return (
    <motion.button
      type="button"
      aria-label={`琴键 ${note}`}
      aria-pressed={active}
      className={[
        'block overflow-hidden transition-colors duration-75',
        isWhite ? 'relative border-r last:border-r-0' : 'absolute rounded-b-lg border',
        surfaceClass,
        className,
      ].join(' ')}
      style={style}
      onMouseDown={(e) => {
        e.preventDefault()
        onPress(note)
      }}
      onMouseUp={() => onRelease(note)}
      onMouseLeave={() => onRelease(note)}
      onTouchStart={(e) => {
        e.preventDefault()
        onPress(note)
      }}
      onTouchEnd={() => onRelease(note)}
      onPointerDown={(e) => e.stopPropagation()}
      animate={
        isWhite
          ? { y: active ? 2 : 0 }
          : { scale: active ? 0.98 : 1, filter: active ? 'brightness(1.15)' : 'brightness(1)' }
      }
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
    >
      {active && (
        <span
          className={[
            'pointer-events-none absolute inset-0',
            isWhite
              ? 'bg-gradient-to-b from-white/50 via-pet-glow/35 to-violet-400/40'
              : 'bg-gradient-to-b from-violet-300/40 via-pet-glow/30 to-transparent',
          ].join(' ')}
          aria-hidden
        />
      )}

      {active && (
        <span
          className="pointer-events-none absolute inset-[2px] rounded-[inherit] ring-2 ring-pet-glow/80 ring-inset"
          aria-hidden
        />
      )}

      {pitchLabel && (
        <span
          className={[
            'pointer-events-none absolute left-1/2 top-[10%] z-10 -translate-x-1/2',
            'text-[clamp(8px,1vh,12px)] font-semibold tracking-tight',
            active
              ? isWhite
                ? 'text-violet-800'
                : 'text-violet-100'
              : isWhite
                ? 'text-slate-600/90'
                : 'text-violet-100/70',
          ].join(' ')}
        >
          {pitchLabel}
        </span>
      )}

      {label && (
        <span
          className={[
            'pointer-events-none absolute bottom-[8%] left-1/2 z-10 -translate-x-1/2',
            'text-[clamp(9px,1.2vh,14px)] font-medium',
            active
              ? isWhite
                ? 'font-semibold text-violet-900'
                : 'font-semibold text-violet-100'
              : isWhite
                ? 'text-slate-500/85'
                : 'text-violet-200/55',
          ].join(' ')}
        >
          {label}
        </span>
      )}
    </motion.button>
  )
}
