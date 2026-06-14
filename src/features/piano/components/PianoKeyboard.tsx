/**
 * 钢琴键盘组件
 *
 * 渲染全量键盘 C2–B6，通过连续 scrollPosition 平移，支持半键露出。
 */
import { useMemo } from 'react'
import { PianoKey } from './PianoKey'
import type { PianoKeyDef } from '../constants/keys'
import { buildFullPianoKeys, buildKeyLabelsForScroll } from '../constants/keys'
import { getTotalWhiteKeys, VISIBLE_WHITE_KEYS } from '@/features/piano/constants/keys'

interface PianoKeyboardProps {
  scrollPosition: number
  activeNotes: Set<string>
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
  className?: string
}

export function PianoKeyboard({
  scrollPosition,
  activeNotes,
  onNoteOn,
  onNoteOff,
  className = '',
}: PianoKeyboardProps) {
  const keys = useMemo(() => buildFullPianoKeys(), [])
  const keyLabels = useMemo(
    () => buildKeyLabelsForScroll(scrollPosition),
    [scrollPosition],
  )
  const whiteKeys = useMemo(() => keys.filter((k) => k.type === 'white'), [keys])
  const blackKeys = useMemo(() => keys.filter((k) => k.type === 'black'), [keys])

  const totalWhite = getTotalWhiteKeys()
  const stripWidthPct = (totalWhite / VISIBLE_WHITE_KEYS) * 100
  const translatePct = (scrollPosition / totalWhite) * 100

  const whiteKeyWidth = `${100 / totalWhite}%`
  const blackKeyWidthPct = (100 / totalWhite) * 0.62
  const blackKeyWidth = `${blackKeyWidthPct}%`

  const blackKeyPositions = useMemo(
    () =>
      blackKeys.map((key: PianoKeyDef) => {
        const afterWhite = key.afterWhite ?? 0
        const leftPercent = (afterWhite + 1) * (100 / totalWhite) - blackKeyWidthPct / 2
        return { ...key, leftPercent }
      }),
    [blackKeys, blackKeyWidthPct, totalWhite],
  )

  return (
    <div className={`relative h-full min-h-[140px] w-full select-none overflow-hidden rounded-b-xl border border-white/10 bg-slate-900/50 shadow-[inset_0_-8px_24px_rgba(0,0,0,0.25)] ${className}`}>
      <div
        className="relative h-full will-change-transform"
        style={{
          width: `${stripWidthPct}%`,
          transform: `translateX(-${translatePct}%)`,
        }}
      >
        <div className="relative z-0 flex h-full w-full">
          {whiteKeys.map((key) => (
            <PianoKey
              key={key.note}
              note={key.note}
              pitchLabel={key.note}
              variant="white"
              label={keyLabels[key.note]}
              active={activeNotes.has(key.note)}
              onPress={onNoteOn}
              onRelease={onNoteOff}
              className="h-full shrink-0"
              style={{ width: whiteKeyWidth }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-[58%]">
          {blackKeyPositions.map((key) => (
            <PianoKey
              key={key.note}
              note={key.note}
              pitchLabel={key.note}
              variant="black"
              label={keyLabels[key.note]}
              active={activeNotes.has(key.note)}
              onPress={onNoteOn}
              onRelease={onNoteOff}
              className="pointer-events-auto top-0 h-full"
              style={{ left: `${key.leftPercent}%`, width: blackKeyWidth }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
