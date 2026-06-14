/**
 * 手势意图响应处理
 *
 * 将 swipe/expand/compress/chord 等意图事件转为乐句播放与音乐状态更新。
 */
import type { IntentEvent, SwipeDirection } from '@/features/gesture/lib/intent/types'
import { audioEngine } from '@/features/audio/AudioEngine'
import type { MusicState } from '@/stores/musicIntentStore'
import {
  behaviorFromSwipe,
  generatePhrase,
  getPhraseMemory,
} from './aiPiano/aiPianoEngine'
import type { PhraseBehavior } from './aiPiano/types'
import { resolveLeftHandVoicing } from './chordMapping'
import { getTonicChord } from './diatonicHarmony'
import { mergeHandChordHolds, mergePhraseHighlights } from './handChordState'
import { getViewportOctaveStart, usePianoStore } from '@/stores/pianoStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'

export interface IntentResponseContext {
  musicState: MusicState
  setMusicState: (partial: Partial<MusicState>) => void
}

const phraseClearTimers = new Map<number, ReturnType<typeof setTimeout>>()

function schedulePhraseHighlight(
  handIndex: number,
  noteNames: string[],
  durationSec: number,
  behavior: PhraseBehavior,
  musicState: MusicState,
  setMusicState: IntentResponseContext['setMusicState'],
): void {
  const prev = phraseClearTimers.get(handIndex)
  if (prev) clearTimeout(prev)

  const phraseHighlightsByHand = {
    ...musicState.phraseHighlightsByHand,
    [handIndex]: noteNames,
  }

  setMusicState({
    phraseHighlightsByHand,
    phraseHighlightNotes: mergePhraseHighlights(phraseHighlightsByHand),
    lastPhraseBehavior: behavior,
  })

  phraseClearTimers.set(
    handIndex,
    setTimeout(() => {
      const current = useMusicIntentStore.getState().musicState
      const nextByHand = { ...current.phraseHighlightsByHand }
      delete nextByHand[handIndex]
      setMusicState({
        phraseHighlightsByHand: nextByHand,
        phraseHighlightNotes: mergePhraseHighlights(nextByHand),
        lastPhraseBehavior: Object.keys(nextByHand).length > 0 ? current.lastPhraseBehavior : null,
      })
      phraseClearTimers.delete(handIndex)
    }, durationSec * 1000 + 120),
  )
}

function playPhrase(
  behavior: PhraseBehavior,
  direction: SwipeDirection | null,
  event: IntentEvent,
  musicState: MusicState,
  setMusicState: IntentResponseContext['setMusicState'],
  audioReady: boolean,
): void {
  const { harmonicSettings } = useMusicIntentStore.getState()
  const scrollPosition = usePianoStore.getState().scrollPosition
  const octaveAnchor = getViewportOctaveStart(scrollPosition)

  const referenceChordNotes =
    musicState.isHolding && musicState.activeChordNotes.length > 0
      ? musicState.activeChordNotes
      : getTonicChord(harmonicSettings.keyId, harmonicSettings.harmonyMode, scrollPosition).notes

  const phrase = generatePhrase({
    behavior,
    direction,
    chord: musicState.chord,
    octaveStart: octaveAnchor,
    harmonicKey: harmonicSettings.keyId,
    chordNotes: referenceChordNotes,
    energy: musicState.energy,
    tension: musicState.tension,
    strength: event.strength,
    memory: getPhraseMemory(),
  })

  schedulePhraseHighlight(
    event.handIndex,
    phrase.notes.map((n) => n.note),
    phrase.durationSec,
    behavior,
    musicState,
    setMusicState,
  )

  if (audioReady) {
    audioEngine.playPianoPhrase(phrase.notes)
  }

  const energyDelta =
    behavior === 'lift' || behavior === 'ascend' || behavior === 'climax'
      ? 0.08
      : behavior === 'settle' || behavior === 'intimate'
        ? -0.06
        : 0.02

  setMusicState({
    energy: Math.max(0.1, Math.min(1, musicState.energy + energyDelta)),
    tension:
      behavior === 'lift' || behavior === 'climax'
        ? Math.min(1, musicState.tension + 0.06)
        : behavior === 'settle' || behavior === 'intimate'
          ? Math.max(0, musicState.tension - 0.05)
          : musicState.tension,
    lastIntentAt: event.timestamp,
    pianoMood:
      behavior === 'climax'
        ? 'cinematic'
        : behavior === 'intimate'
          ? 'intimate'
          : 'neutral',
  })
}

export function handleIntentEvent(event: IntentEvent, ctx: IntentResponseContext): void {
  const { musicState, setMusicState } = ctx
  const audioReady = audioEngine.ready

  switch (event.type) {
    case 'swipe': {
      const direction = event.direction ?? 'right'
      const behavior = behaviorFromSwipe(direction)
      playPhrase(behavior, direction, event, musicState, setMusicState, audioReady)
      break
    }
    case 'expand': {
      playPhrase('climax', null, event, musicState, setMusicState, audioReady)
      if (audioReady) audioEngine.applyCinematicClimax(0.2 + event.strength * 0.25)
      setMusicState({
        ambience: Math.min(1, musicState.ambience + 0.12),
        pianoMood: 'cinematic',
      })
      break
    }
    case 'compress': {
      playPhrase('intimate', null, event, musicState, setMusicState, audioReady)
      if (audioReady) audioEngine.applyIntimateFelt(0.25 + event.strength * 0.2)
      setMusicState({
        ambience: Math.max(0.2, musicState.ambience - 0.08),
        pianoMood: 'intimate',
      })
      break
    }
    case 'chord_select': {
      const fingerCount = event.fingerCount ?? 0
      const { harmonicSettings } = useMusicIntentStore.getState()
      const scrollPosition = usePianoStore.getState().scrollPosition
      const chord = resolveLeftHandVoicing(fingerCount, scrollPosition, harmonicSettings)
      if (!chord) break

      const handChordHolds = {
        ...musicState.handChordHolds,
        [event.handIndex]: {
          handIndex: event.handIndex,
          side: event.hand,
          fingerCount,
          chordId: chord.id,
          root: chord.notes[0],
          notes: [...chord.notes],
        },
      }

      setMusicState({
        handChordHolds,
        ...mergeHandChordHolds(handChordHolds),
        ambience: Math.min(1, musicState.ambience + 0.05),
        lastIntentAt: event.timestamp,
      })
      if (audioReady) {
        audioEngine.setGestureChordForHand(
          event.handIndex,
          chord.notes,
          0.62 + event.strength * 0.28,
        )
      }
      break
    }
    case 'chord_release': {
      const handChordHolds = { ...musicState.handChordHolds }
      delete handChordHolds[event.handIndex]

      setMusicState({
        handChordHolds,
        ...mergeHandChordHolds(handChordHolds),
      })
      if (audioReady) {
        audioEngine.releaseGestureChordForHand(event.handIndex)
      }
      break
    }
  }
}
