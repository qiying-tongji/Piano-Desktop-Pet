/**
 * 钢琴演奏模式视图
 *
 * 全屏 MUSIC FIELD 面板：虚拟键盘、音量/混响/延音控制、手势意图叠加层、背景粒子。
 */
import { useCallback, useEffect, useMemo } from 'react'
import {
  PianoKeyboard,
  MusicFieldParticles,
  PerformanceQualitySelect,
  ChordMappingPanel,
  OctaveNavigator,
  KeyboardViewportBar,
  useKeyboardInput,
  usePianoPlay,
  useHeldChordOctaveSync,
  buildKeyboardMapForScroll,
} from '@/features/piano'
import { GestureIntentOverlay, GestureToggle, HandAssignmentPanel } from '@/features/gesture'
import { RecordingPanel } from '@/features/audio'
import { handModeLabel } from '@/features/gesture/lib/handGestureSettings'
import { useAppStore } from '@/stores/appStore'
import { useAudioStore } from '@/stores/audioStore'
import { useGestureStore } from '@/stores/gestureStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'
import { canShiftPage, usePianoStore } from '@/stores/pianoStore'

interface PianoModeProps {
  onOpenHub: () => void
  onCollapseToPet: () => void
}

export function PianoMode({ onOpenHub, onCollapseToPet }: PianoModeProps) {
  const windowError = useAppStore((s) => s.windowError)
  const activeNotes = useAudioStore((s) => s.activeNotes)
  const activeChordNotes = useMusicIntentStore((s) => s.musicState.activeChordNotes)
  const phraseHighlightNotes = useMusicIntentStore((s) => s.musicState.phraseHighlightNotes)
  const displayActiveNotes = useMemo(() => {
    const merged = new Set(activeNotes)
    for (const note of activeChordNotes) merged.add(note)
    for (const note of phraseHighlightNotes) merged.add(note)
    return merged
  }, [activeNotes, activeChordNotes, phraseHighlightNotes])
  const volume = useAudioStore((s) => s.volume)
  const reverbWet = useAudioStore((s) => s.reverbWet)
  const sustain = useAudioStore((s) => s.sustain)
  const isReady = useAudioStore((s) => s.isReady)
  const isLoading = useAudioStore((s) => s.isLoading)
  const setVolume = useAudioStore((s) => s.setVolume)
  const setReverbWet = useAudioStore((s) => s.setReverbWet)
  const setSustain = useAudioStore((s) => s.setSustain)

  const { ensureReady, playNote, releaseNote, releaseSustainNotes } = usePianoPlay()
  const scrollPosition = usePianoStore((s) => s.scrollPosition)
  const shiftPage = usePianoStore((s) => s.shiftPage)
  const handAssignment = useGestureStore((s) => s.handAssignment)
  const gestureSummary = useMemo(
    () =>
      `左手 ${handModeLabel(handAssignment.left)} · 右手 ${handModeLabel(handAssignment.right)}`,
    [handAssignment.left, handAssignment.right],
  )
  useHeldChordOctaveSync()

  const keyboardMap = useMemo(
    () => buildKeyboardMapForScroll(scrollPosition),
    [scrollPosition],
  )

  const onViewportWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const direction = e.deltaY > 0 ? 1 : -1
      if (!canShiftPage(scrollPosition, direction)) return
      shiftPage(direction)
    },
    [scrollPosition, shiftPage],
  )

  useEffect(() => {
    void ensureReady()
  }, [ensureReady])

  const handleNoteOn = useCallback(
    (note: string) => {
      playNote(note, 'mouse')
    },
    [playNote],
  )

  const handleNoteOff = useCallback(
    (note: string) => {
      releaseNote(note)
    },
    [releaseNote],
  )

  useKeyboardInput({
    enabled: true,
    keyboardMap,
    onNoteOn: (note) => playNote(note, 'keyboard'),
    onNoteOff: releaseNote,
  })

  const handleClose = useCallback(() => {
    void onCollapseToPet()
  }, [onCollapseToPet])

  const handleSustainToggle = useCallback(() => {
    const next = !sustain
    setSustain(next)
    if (!next) releaseSustainNotes()
  }, [sustain, setSustain, releaseSustainNotes])

  return (
    <div className="piano-shell">
      <div className="piano-panel relative">
        <MusicFieldParticles />
        <div className="relative z-10 window-drag flex shrink-0 cursor-grab items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-5 py-3 active:cursor-grabbing">
          <div className="min-w-[8rem] flex-1">
            <h1 className="truncate text-base font-semibold tracking-widest text-pet-accent">MUSIC FIELD</h1>
            <p className="mt-0.5 truncate text-[11px] text-white/55">
              {isLoading ? '加载音色…' : isReady ? `拖动标题栏 · ${gestureSummary}` : '点击任意键开始'}
            </p>
          </div>
          <div className="window-no-drag flex shrink-0 items-center gap-2">
            <GestureToggle />
            <button
              type="button"
              onClick={onOpenHub}
              title="万花筒 · 切换娱乐方式"
              className="rounded-lg border border-pet-glow/35 bg-pet-glow/15 px-3 py-1.5 text-[11px] text-pet-accent transition hover:bg-pet-glow/25"
            >
              ✦ 万花筒
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] text-white/80 transition hover:border-pet-glow/40 hover:text-pet-accent"
            >
              收起
            </button>
          </div>
        </div>

        {windowError && (
          <p className="relative z-10 window-no-drag shrink-0 bg-red-500/20 px-5 py-2 text-[11px] text-red-200">
            {windowError}
          </p>
        )}
        <div className="relative z-30 window-no-drag flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 overflow-visible border-b border-white/5 px-5 py-2.5 text-[11px] text-white/70">
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-white/55">音量</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-28 accent-violet-400"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-white/55">混响</span>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.01}
              value={reverbWet}
              onChange={(e) => setReverbWet(Number(e.target.value))}
              className="h-1.5 w-28 accent-violet-400"
            />
          </label>
          <button
            type="button"
            onClick={handleSustainToggle}
            className={[
              'rounded-md border px-2.5 py-1 transition',
              sustain
                ? 'border-pet-glow/50 bg-pet-glow/20 text-pet-accent'
                : 'border-white/15 bg-white/10 text-white/70 hover:text-white',
            ].join(' ')}
          >
            延音 {sustain ? 'ON' : 'OFF'}
          </button>
          <PerformanceQualitySelect />
          <RecordingPanel audioReady={isReady} />
          <HandAssignmentPanel />
          <ChordMappingPanel />
        </div>

        <div
          className="relative z-10 piano-keyboard-dock window-no-drag flex min-h-0 flex-col border-t border-white/10 bg-gradient-to-t from-black/50 to-transparent px-[2vw] pb-3 pt-2"
          onWheel={onViewportWheel}
        >
          <div className="mb-2 flex shrink-0 items-center justify-center">
            <OctaveNavigator />
          </div>

          <div className="mb-2 shrink-0">
            <KeyboardViewportBar />
          </div>

          <div className="relative mx-auto min-h-0 w-full max-w-[min(96vw,1500px)] flex-1">
            <PianoKeyboard
              scrollPosition={scrollPosition}
              activeNotes={displayActiveNotes}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
            <GestureIntentOverlay />
          </div>
          <p className="mt-2 shrink-0 text-center text-[10px] text-white/35">
            移动条连续定位 · 滚轮/◀▶ 整页切换 · {gestureSummary}
          </p>
        </div>
      </div>
    </div>
  )
}
