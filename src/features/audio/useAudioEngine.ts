/**
 * 音频引擎 React Hook
 *
 * 桥接 AudioEngine 单例与 audioStore：初始化、音量/混响/延音同步、noteOn/noteOff。
 */
import { useCallback, useEffect } from 'react'
import { audioEngine } from './AudioEngine'
import { useAudioStore } from '@/stores/audioStore'
import type { InputSource } from '@/shared/types/note'

export function useAudioEngine() {
  const volume = useAudioStore((s) => s.volume)
  const reverbWet = useAudioStore((s) => s.reverbWet)
  const sustain = useAudioStore((s) => s.sustain)
  const isReady = useAudioStore((s) => s.isReady)
  const isLoading = useAudioStore((s) => s.isLoading)
  const setReady = useAudioStore((s) => s.setReady)
  const setLoading = useAudioStore((s) => s.setLoading)
  const addActiveNote = useAudioStore((s) => s.addActiveNote)
  const removeActiveNote = useAudioStore((s) => s.removeActiveNote)

  const init = useCallback(async () => {
    if (audioEngine.ready) {
      if (!useAudioStore.getState().isReady) setReady(true)
      return
    }
    if (!useAudioStore.getState().isLoading) setLoading(true)
    try {
      await audioEngine.init()
      setReady(true)
    } catch (err) {
      console.error('[AudioEngine] init failed:', err)
      setReady(false)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setReady])

  useEffect(() => {
    if (audioEngine.ready) audioEngine.setVolume(volume)
  }, [volume, isReady])

  useEffect(() => {
    if (audioEngine.ready) audioEngine.setReverbWet(reverbWet)
  }, [reverbWet, isReady])

  useEffect(() => {
    if (audioEngine.ready) audioEngine.setSustain(sustain)
  }, [sustain, isReady])

  const noteOn = useCallback(
    (note: string, source: InputSource, velocity = 0.85) => {
      if (!audioEngine.ready) return
      audioEngine.noteOn(note, velocity)
      addActiveNote(note)
      void source
    },
    [addActiveNote],
  )

  const noteOff = useCallback(
    (note: string) => {
      if (!audioEngine.ready) return
      audioEngine.noteOff(note)
      removeActiveNote(note)
    },
    [removeActiveNote],
  )

  const releaseSustainNotes = useCallback(() => {
    if (!audioEngine.ready) return
    audioEngine.releaseAll()
    useAudioStore.getState().clearActiveNotes()
  }, [])

  return {
    init,
    isReady: isReady && audioEngine.ready,
    isLoading,
    noteOn,
    noteOff,
    releaseSustainNotes,
  }
}
