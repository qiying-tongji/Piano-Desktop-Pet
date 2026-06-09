import { useCallback, useEffect, useMemo } from 'react'
import { PianoKeyboard, MusicFieldParticles, PerformanceQualitySelect, useKeyboardInput, usePianoPlay } from '@/features/piano'
import { GestureIntentOverlay, GestureToggle } from '@/features/gesture'
import { usePianoWindowMode } from '@/shared/hooks/usePianoWindowMode'
import { useAppStore } from '@/stores/appStore'
import { useAudioStore } from '@/stores/audioStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'

export function PianoMode() {
  const setMode = useAppStore((s) => s.setMode)
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
  usePianoWindowMode()

  useEffect(() => {
    void ensureReady()
  }, [ensureReady])

  const handleNoteOn = useCallback(
    (note: string) => {
      void playNote(note, 'mouse')
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
    onNoteOn: (note) => void playNote(note, 'keyboard'),
    onNoteOff: releaseNote,
  })

  const handleClose = useCallback(async () => {
    setMode('pet')
    await window.electronAPI?.setAppWindowMode('pet')
  }, [setMode])

  const handleSustainToggle = useCallback(() => {
    const next = !sustain
    setSustain(next)
    if (!next) releaseSustainNotes()
  }, [sustain, setSustain, releaseSustainNotes])

  return (
    <div className="piano-shell">
      <div className="piano-panel relative">
        <MusicFieldParticles />
        {/* Header */}
        <div className="relative z-10 window-drag flex shrink-0 cursor-grab items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-5 py-3 active:cursor-grabbing">
          <div className="min-w-[8rem] flex-1">
            <h1 className="truncate text-base font-semibold tracking-widest text-pet-accent">MUSIC FIELD</h1>
            <p className="mt-0.5 truncate text-[11px] text-white/55">
              {isLoading ? '加载音色…' : isReady ? '拖动标题栏 · 左手和弦 · 右手意图' : '点击任意键开始'}
            </p>
          </div>
          <div className="window-no-drag flex shrink-0 items-center gap-2">
            <GestureToggle />
            <button
              type="button"
              onClick={() => void handleClose()}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] text-white/80 transition hover:border-pet-glow/40 hover:text-pet-accent"
            >
              收起
            </button>
          </div>
        </div>

        {/* Controls */}
        {windowError && (
          <p className="relative z-10 window-no-drag shrink-0 bg-red-500/20 px-5 py-2 text-[11px] text-red-200">
            {windowError}
          </p>
        )}
        <div className="relative z-10 window-no-drag flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/5 px-5 py-2.5 text-[11px] text-white/70">
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
        </div>

        {/* Keyboard + gesture skeleton overlay */}
        <div className="relative z-10 piano-keyboard-dock window-no-drag flex min-h-0 flex-col border-t border-white/10 bg-gradient-to-t from-black/50 to-transparent px-[2vw] pb-3 pt-2">
          <div className="relative mx-auto min-h-0 w-full max-w-[min(96vw,1500px)] flex-1">
            <PianoKeyboard
              activeNotes={displayActiveNotes}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
            <GestureIntentOverlay />
          </div>
          <p className="mt-2 shrink-0 text-center text-[10px] text-white/35">
            左手 1–5 指和弦 · 右手挥动(上下左右) · 双手张合
          </p>
        </div>
      </div>
    </div>
  )
}
