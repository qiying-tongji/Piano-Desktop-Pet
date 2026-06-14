/**
 * 钢琴演奏 Hook
 *
 * 封装音频引擎初始化与 noteOn/noteOff；noteOn 同步触发，避免 async 延迟。
 */
import { useCallback } from 'react'
import { audioEngine } from '@/features/audio/AudioEngine'
import { useAudioEngine } from '@/features/audio'
import type { InputSource } from '@/shared/types/note'

export function usePianoPlay() {
  const { init, isReady, isLoading, noteOn, noteOff, releaseSustainNotes } = useAudioEngine()

  const ensureReady = useCallback(async () => {
    await init()
  }, [init])

  const playNote = useCallback(
    (note: string, source: InputSource = 'mouse') => {
      if (audioEngine.ready) {
        noteOn(note, source)
        return
      }
      // 首次点击时异步加载，加载完成后补发该音
      void init().then(() => {
        if (audioEngine.ready) noteOn(note, source)
      })
    },
    [init, noteOn],
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
