import type { IntentEvent, SwipeDirection } from '@/features/gesture/lib/intent/types'
import { audioEngine } from '@/features/audio/AudioEngine'
import type { MusicState } from '@/stores/musicIntentStore'
import {
  behaviorFromSwipe,
  generatePhrase,
  getPhraseMemory,
} from './aiPiano/aiPianoEngine'
import type { PhraseBehavior } from './aiPiano/types'
import { getLeftHandChordByFingerCount } from './leftHandChords'

export interface IntentResponseContext {
  musicState: MusicState
  setMusicState: (partial: Partial<MusicState>) => void
}

const phraseClearTimers = new Map<string, ReturnType<typeof setTimeout>>()

function schedulePhraseHighlight(
  noteNames: string[],
  durationSec: number,
  behavior: PhraseBehavior,
  setMusicState: IntentResponseContext['setMusicState'],
): void {
  const key = 'phrase'
  const prev = phraseClearTimers.get(key)
  if (prev) clearTimeout(prev)

  setMusicState({
    phraseHighlightNotes: noteNames,
    lastPhraseBehavior: behavior,
  })

  phraseClearTimers.set(
    key,
    setTimeout(() => {
      setMusicState({ phraseHighlightNotes: [], lastPhraseBehavior: null })
      phraseClearTimers.delete(key)
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
  const phrase = generatePhrase({
    behavior,
    direction,
    chord: musicState.chord,
    scale: musicState.scale,
    energy: musicState.energy,
    tension: musicState.tension,
    strength: event.strength,
    memory: getPhraseMemory(),
  })

  schedulePhraseHighlight(
    phrase.notes.map((n) => n.note),
    phrase.durationSec,
    behavior,
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
      const chord = getLeftHandChordByFingerCount(fingerCount)
      if (!chord) break
      setMusicState({
        chord: chord.id,
        root: chord.notes[0],
        activeChordNotes: [...chord.notes],
        leftFingerCount: fingerCount,
        isHolding: true,
        ambience: Math.min(1, musicState.ambience + 0.05),
        lastIntentAt: event.timestamp,
      })
      if (audioReady) {
        audioEngine.playGestureChord(chord.notes, 0.62 + event.strength * 0.28)
      }
      break
    }
    case 'chord_release': {
      setMusicState({
        isHolding: false,
        activeChordNotes: [],
        leftFingerCount: 0,
      })
      if (audioReady) {
        audioEngine.releaseGestureChord()
      }
      break
    }
  }
}
