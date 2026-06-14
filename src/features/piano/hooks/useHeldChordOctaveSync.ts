/**
 * 八度切换同步
 *
 * 按住和弦时重算各手 voicing；重置右手短语记忆。
 */
import { useEffect } from 'react'
import { audioEngine } from '@/features/audio/AudioEngine'
import { resetPhraseMemory } from '@/features/music-intent/lib/aiPiano/aiPianoEngine'
import { resolveLeftHandVoicing } from '@/features/music-intent/lib/chordMapping'
import { mergeHandChordHolds } from '@/features/music-intent/lib/handChordState'
import { usePianoStore } from '@/stores/pianoStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'

export function useHeldChordOctaveSync(): void {
  const scrollPosition = usePianoStore((s) => s.scrollPosition)

  useEffect(() => {
    resetPhraseMemory()

    const { musicState, harmonicSettings, setMusicState } = useMusicIntentStore.getState()
    const holdEntries = Object.entries(musicState.handChordHolds)
    if (holdEntries.length === 0) return

    const nextHolds = { ...musicState.handChordHolds }
    for (const [key, hold] of holdEntries) {
      const chord = resolveLeftHandVoicing(hold.fingerCount, scrollPosition, harmonicSettings)
      if (!chord) continue
      const handIndex = Number(key)
      nextHolds[handIndex] = {
        ...hold,
        chordId: chord.id,
        root: chord.notes[0],
        notes: [...chord.notes],
      }
      if (audioEngine.ready) {
        audioEngine.setGestureChordForHand(handIndex, chord.notes, 0.72)
      }
    }

    setMusicState({
      handChordHolds: nextHolds,
      ...mergeHandChordHolds(nextHolds),
    })
  }, [scrollPosition])
}
