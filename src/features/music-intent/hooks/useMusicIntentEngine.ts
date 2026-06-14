/**
 * 音乐意图引擎 Hook
 *
 * 每帧接收 AnalyzerSnapshot，经 IntentDetector 检测意图并调用 handleIntentEvent 播放音乐。
 */
import { useCallback, useEffect, useRef } from 'react'
import { audioEngine } from '@/features/audio/AudioEngine'
import { useAudioEngine } from '@/features/audio/useAudioEngine'
import type { AnalyzerSnapshot } from '@/features/gesture/lib/analyzer/types'
import type { IntentEvent } from '@/features/gesture/lib/intent/types'
import { IntentDetector } from '@/features/gesture/lib/intent/intentDetector'
import { clearVisualFx } from '@/features/gesture/lib/visualFx/visualFxManager'
import { handleIntentEvent } from '../lib/intentResponses'
import { resetPhraseMemory } from '../lib/aiPiano/aiPianoEngine'
import { useGestureStore } from '@/stores/gestureStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'

interface UseMusicIntentEngineOptions {
  enabled: boolean
}

export function useMusicIntentEngine({ enabled }: UseMusicIntentEngineOptions) {
  const detectorRef = useRef(new IntentDetector())
  const { init, isReady } = useAudioEngine()
  const setMusicState = useMusicIntentStore((s) => s.setMusicState)
  const pushIntent = useMusicIntentStore((s) => s.pushIntent)
  const handAssignment = useGestureStore((s) => s.handAssignment)
  const handAssignmentKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      detectorRef.current.reset()
      resetPhraseMemory()
      audioEngine.releaseGestureChord()
      clearVisualFx()
      useMusicIntentStore.getState().clearRecentIntents()
      setMusicState({
        isHolding: false,
        activeChordNotes: [],
        handChordHolds: {},
        phraseHighlightNotes: [],
        phraseHighlightsByHand: {},
        leftFingerCount: 0,
        lastPhraseBehavior: null,
        pianoMood: 'neutral',
      })
      return
    }
    void init().then(() => {
      if (!audioEngine.ready) return
      const { musicState } = useMusicIntentStore.getState()
      for (const [key, hold] of Object.entries(musicState.handChordHolds)) {
        audioEngine.setGestureChordForHand(Number(key), hold.notes, 0.7)
      }
    })
  }, [enabled, init, setMusicState])

  useEffect(() => {
    if (!enabled) return
    const key = JSON.stringify(handAssignment)
    if (handAssignmentKeyRef.current === null) {
      handAssignmentKeyRef.current = key
      return
    }
    if (handAssignmentKeyRef.current === key) return
    handAssignmentKeyRef.current = key

    detectorRef.current.reset()
    const { musicState } = useMusicIntentStore.getState()
    if (Object.keys(musicState.handChordHolds).length > 0) {
      audioEngine.releaseGestureChord()
      setMusicState({
        handChordHolds: {},
        isHolding: false,
        activeChordNotes: [],
        leftFingerCount: 0,
      })
    }
  }, [enabled, handAssignment, setMusicState])

  const processSnapshot = useCallback(
    (snapshot: AnalyzerSnapshot): IntentEvent[] => {
      if (!enabled) return []

      const events = detectorRef.current.detect(snapshot.hands)
      for (const event of events) {
        const musicState = useMusicIntentStore.getState().musicState
        handleIntentEvent(event, { musicState, setMusicState })
        pushIntent(event)
      }
      return events
    },
    [enabled, pushIntent, setMusicState],
  )

  return { processSnapshot, isAudioReady: isReady }
}
