/** One octave keyboard layout — indices of white keys that have a black key to their right. */
const BLACK_KEY_AFTER_WHITE = new Set([0, 1, 3, 4, 5])

const WHITE_KEY_COUNT = 7
const KEY_TOP = 14
const KEY_HEIGHT = 28
const KEY_WIDTH = 8.5
const KEY_GAP = 0.6
const KEY_START_X = 14.5

interface MiniPianoIconProps {
  className?: string
  /** Intensify neon glow (hover / active). */
  active?: boolean
}

export function MiniPianoIcon({ className, active = false }: MiniPianoIconProps) {
  const whiteKeys = Array.from({ length: WHITE_KEY_COUNT }, (_, i) => {
    const x = KEY_START_X + i * (KEY_WIDTH + KEY_GAP)
    return { x, i }
  })

  const blackKeys = whiteKeys
    .filter(({ i }) => BLACK_KEY_AFTER_WHITE.has(i))
    .map(({ x }) => ({
      x: x + KEY_WIDTH * 0.62,
    }))

  return (
    <svg
      viewBox="0 0 88 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="piano-body" x1="44" y1="36" x2="44" y2="68" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e1e2e" />
          <stop offset="1" stopColor="#12121a" />
        </linearGradient>
        <linearGradient id="piano-rim" x1="44" y1="40" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" stopOpacity="0.5" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
        <filter id="piano-neon" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={active ? 2.2 : 1.2} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Piano body */}
      <rect
        x="10"
        y="40"
        width="68"
        height="24"
        rx="5"
        fill="url(#piano-body)"
        stroke={active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.08)'}
        strokeWidth="0.8"
        filter={active ? 'url(#piano-neon)' : undefined}
      />
      {active && <rect x="12" y="42" width="64" height="2" rx="1" fill="url(#piano-rim)" />}

      {/* White keys */}
      {whiteKeys.map(({ x, i }) => (
        <rect
          key={`w-${i}`}
          x={x}
          y={KEY_TOP}
          width={KEY_WIDTH}
          height={KEY_HEIGHT}
          rx="1.2"
          fill="#f1f5f9"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
        />
      ))}

      {/* Black keys */}
      {blackKeys.map(({ x }, i) => (
        <rect
          key={`b-${i}`}
          x={x}
          y={KEY_TOP}
          width={KEY_WIDTH * 0.58}
          height={KEY_HEIGHT * 0.58}
          rx="1"
          fill="#0f172a"
          stroke={active ? 'rgba(167,139,250,0.35)' : 'rgba(0,0,0,0.5)'}
          strokeWidth="0.35"
        />
      ))}

      {/* Legs */}
      <rect x="18" y="62" width="4" height="6" rx="1" fill="#2a2a3a" />
      <rect x="66" y="62" width="4" height="6" rx="1" fill="#2a2a3a" />

      {/* Music stand hint */}
      <path
        d="M36 40 L44 34 L52 40"
        stroke={active ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.15)'}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
