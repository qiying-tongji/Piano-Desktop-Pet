import { useCallback } from 'react'
import { useAudioEngine } from '@/features/audio'
import type { InputSource } from '@/shared/types/note'

export function usePianoPlay() {
  const { init, isReady, isLoading, noteOn, noteOff, releaseSustainNotes } = useAudioEngine()

  const ensureReady = useCallback(async () => {
    await init()
  }, [init])

  const playNote = useCallback(
    async (note: string, source: InputSource = 'mouse') => {
      await ensureReady()
      noteOn(note, source)
    },
    [ensureReady, noteOn],
  )

  const releaseNote = useCallback(
    (note: string) => {
      noteOff(note)
    },
    [noteOff],
  )

  return {
    isReady,
    isLoading,
    ensureReady,
    playNote,
    releaseNote,
    releaseSustainNotes,
  }
}
