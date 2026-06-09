import { motion } from 'framer-motion'

interface PianoKeyProps {
  note: string
  label?: string
  active: boolean
  onPress: (note: string) => void
  onRelease: (note: string) => void
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function PianoKey({
  note,
  label,
  active,
  onPress,
  onRelease,
  className = '',
  style,
  children,
}: PianoKeyProps) {
  return (
    <motion.button
      type="button"
      aria-label={`琴键 ${note}`}
      className={className}
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
      animate={{
        y: active ? 3 : 0,
        boxShadow: active
          ? '0 0 16px rgba(167,139,250,0.7), inset 0 -2px 8px rgba(167,139,250,0.3)'
          : '0 2px 6px rgba(0,0,0,0.35)',
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      {children}
      {label && (
        <span className="pointer-events-none absolute bottom-[8%] text-[clamp(9px,1.2vh,14px)] font-medium text-slate-500/85">
          {label}
        </span>
      )}
      {active && (
        <motion.span
          className="pointer-events-none absolute inset-x-1 top-1 h-1 rounded-full bg-pet-glow/70"
          initial={{ opacity: 0.9, scaleX: 0.6 }}
          animate={{ opacity: 0, scaleX: 1.4 }}
          transition={{ duration: 0.45 }}
        />
      )}
    </motion.button>
  )
}
