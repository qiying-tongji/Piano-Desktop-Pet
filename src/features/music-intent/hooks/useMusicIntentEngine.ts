import { useCallback, useEffect, useRef } from 'react'
import { audioEngine } from '@/features/audio/AudioEngine'
import { useAudioEngine } from '@/features/audio/useAudioEngine'
import type { AnalyzerSnapshot } from '@/features/gesture/lib/analyzer/types'
import type { IntentEvent } from '@/features/gesture/lib/intent/types'
import { IntentDetector } from '@/features/gesture/lib/intent/intentDetector'
import { clearVisualFx } from '@/features/gesture/lib/visualFx/visualFxManager'
import { handleIntentEvent } from '../lib/intentResponses'
import { resetMelodyMemory } from '../lib/melodyPicker'
import { resetPhraseMemory } from '../lib/aiPiano/aiPianoEngine'
import { useMusicIntentStore } from '@/stores/musicIntentStore'

interface UseMusicIntentEngineOptions {
  enabled: boolean
}

export function useMusicIntentEngine({ enabled }: UseMusicIntentEngineOptions) {
  const detectorRef = useRef(new IntentDetector())
  const { init, isReady } = useAudioEngine()
  const setMusicState = useMusicIntentStore((s) => s.setMusicState)
  const pushIntent = useMusicIntentStore((s) => s.pushIntent)

  useEffect(() => {
    if (!enabled) {
      detectorRef.current.reset()
      resetMelodyMemory()
      resetPhraseMemory()
      audioEngine.releaseGestureAudio()
      clearVisualFx()
      useMusicIntentStore.getState().clearRecentIntents()
      setMusicState({
        isHolding: false,
        loopActive: false,
        activeChordNotes: [],
        phraseHighlightNotes: [],
        leftFingerCount: 0,
        lastPhraseBehavior: null,
        pianoMood: 'neutral',
      })
      return
    }
    void init().then(() => {
      if (!audioEngine.ready) return
      audioEngine.setGestureEnergy(useMusicIntentStore.getState().musicState.energy)
      const { musicState } = useMusicIntentStore.getState()
      if (musicState.isHolding && musicState.activeChordNotes.length > 0) {
        audioEngine.playGestureChord(musicState.activeChordNotes, 0.7)
      }
    })
  }, [enabled, init, setMusicState])

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
