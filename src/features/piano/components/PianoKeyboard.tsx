import { useMemo } from 'react'
import { PianoKey } from './PianoKey'
import { BLACK_KEYS, KEY_LABELS, WHITE_KEYS } from '../constants/keys'

interface PianoKeyboardProps {
  activeNotes: Set<string>
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
  className?: string
}

export function PianoKeyboard({
  activeNotes,
  onNoteOn,
  onNoteOff,
  className = '',
}: PianoKeyboardProps) {
  const whiteKeyUnit = 100 / WHITE_KEYS.length
  const whiteKeyWidth = `${whiteKeyUnit}%`
  const blackKeyWidthPct = whiteKeyUnit * 0.62
  const blackKeyWidth = `${blackKeyWidthPct}%`

  const blackKeyPositions = useMemo(
    () =>
      BLACK_KEYS.map((key) => {
        const afterWhite = key.afterWhite ?? 0
        // Center on the seam between this white key and the next (no translate — motion.y breaks -translate-x-1/2)
        const leftPercent = (afterWhite + 1) * whiteKeyUnit - blackKeyWidthPct / 2
        return { ...key, leftPercent }
      }),
    [blackKeyWidthPct, whiteKeyUnit],
  )

  return (
    <div className={`relative h-full min-h-[140px] w-full select-none ${className}`}>
      {/* White keys */}
      <div className="flex h-full w-full overflow-hidden rounded-b-xl border border-white/10 bg-slate-900/50 shadow-[inset_0_-8px_24px_rgba(0,0,0,0.25)]">
        {WHITE_KEYS.map((key) => (
          <PianoKey
            key={key.note}
            note={key.note}
            label={KEY_LABELS[key.note]}
            active={activeNotes.has(key.note)}
            onPress={onNoteOn}
            onRelease={onNoteOff}
            className="relative h-full flex-1 border-r border-slate-400/25 bg-gradient-to-b from-slate-50 to-slate-300 last:border-r-0"
            style={{ width: whiteKeyWidth, minWidth: 0 }}
          />
        ))}
      </div>

      {/* Black keys — ~58% height, ~62% of white key width */}
      {blackKeyPositions.map((key) => (
        <PianoKey
          key={key.note}
          note={key.note}
          label={KEY_LABELS[key.note]}
          active={activeNotes.has(key.note)}
          onPress={onNoteOn}
          onRelease={onNoteOff}
          className="absolute top-0 z-10 h-[58%] rounded-b-lg border border-violet-400/25 bg-gradient-to-b from-slate-700 to-slate-950 shadow-md"
          style={{ left: `${key.leftPercent}%`, width: blackKeyWidth }}
        />
      ))}
    </div>
  )
}
