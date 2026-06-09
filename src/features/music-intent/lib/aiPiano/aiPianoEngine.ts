import { getChordNotes } from '../chords'
import { midiToNote, noteToMidi } from '../scales'
import {
  buildGravityPool,
  isChordTone,
  nearestInPool,
  pickPassingTone,
} from './melodicGravity'
import { phraseRhythm } from './phraseRhythm'
import type {
  PhraseMemory,
  PhraseRequest,
  PianoPhrase,
  PhraseBehavior,
  PhraseNote,
} from './types'
import { DEFAULT_PHRASE_MEMORY } from './types'

let memory: PhraseMemory = { ...DEFAULT_PHRASE_MEMORY }

export function getPhraseMemory(): PhraseMemory {
  return { ...memory }
}

export function resetPhraseMemory(): void {
  memory = { ...DEFAULT_PHRASE_MEMORY }
}

function registerRange(behavior: PhraseBehavior, energy: number, bias: number): [number, number] {
  const e = energy
  const b = bias
  switch (behavior) {
    case 'lift':
      return [58, 76]
    case 'settle':
    case 'intimate':
      return [48, 62]
    case 'climax':
      return [52, 80]
    case 'ascend':
      return [Math.round(52 + b * 4), Math.round(68 + e * 8)]
    case 'descend':
      return [Math.round(50 + b * 2), Math.round(72 - (1 - e) * 6)]
    default:
      return [52, 72]
  }
}

function startMidi(
  pool: string[],
  chord: string,
  scaleId: Parameters<typeof getChordNotes>[1],
  behavior: PhraseBehavior,
  mem: PhraseMemory,
): number {
  const chordNotes = getChordNotes(chord, scaleId)
  const rootMidi = noteToMidi(chordNotes[0])

  if (mem.previousNote) {
    const prev = noteToMidi(mem.previousNote)
    if (behavior === 'ascend' || behavior === 'lift') {
      return Math.min(prev + (behavior === 'lift' ? 5 : 2), noteToMidi(pool[pool.length - 1]))
    }
    if (behavior === 'descend' || behavior === 'settle') {
      return Math.max(prev - 2, noteToMidi(pool[0]))
    }
    return prev
  }

  const mid = pool[Math.floor(pool.length * (0.35 + mem.registerBias * 0.25))]
  return noteToMidi(mid ?? midiToNote(rootMidi + 12))
}

function stepDelta(behavior: PhraseBehavior, stepIndex: number, total: number): number {
  switch (behavior) {
    case 'ascend':
    case 'lift':
      return stepIndex === total - 1 ? 4 + Math.floor(Math.random() * 2) : 2 + (Math.random() > 0.35 ? 1 : 0)
    case 'descend':
    case 'settle':
      return stepIndex === total - 1 ? -(3 + Math.floor(Math.random() * 2)) : -(2 + (Math.random() > 0.4 ? 0 : 1))
    case 'climax':
      return stepIndex % 2 === 0 ? 4 : 2
    case 'intimate':
      return -(1 + Math.floor(Math.random() * 2))
    default:
      return 2
  }
}

function buildNotePath(
  request: PhraseRequest,
  pool: string[],
  noteCount: number,
): string[] {
  const { behavior, chord, scale } = request
  let cursor = startMidi(pool, chord, scale, behavior, request.memory)
  const path: string[] = []
  const minMidi = noteToMidi(pool[0])
  const maxMidi = noteToMidi(pool[pool.length - 1])

  for (let i = 0; i < noteCount; i++) {
    const snapped = nearestInPool(cursor, pool)
    path.push(snapped)
    cursor = noteToMidi(snapped)

    if (i < noteCount - 1) {
      const delta = stepDelta(behavior, i, noteCount)
      const target = Math.max(minMidi, Math.min(maxMidi, cursor + delta))
      const passing = pickPassingTone(cursor, target, pool, chord, scale)
      if (passing && i < noteCount - 2) {
        path.push(passing)
        cursor = noteToMidi(passing)
        i++
      }
      cursor = target
    }
  }

  if (behavior === 'descend' || behavior === 'settle' || behavior === 'intimate') {
    const root = getChordNotes(chord, scale)[0]
    const rootInRange = nearestInPool(noteToMidi(root) + 12, pool)
    if (!path.includes(rootInRange)) path[path.length - 1] = rootInRange
  }

  if (behavior === 'climax' && path.length >= 2) {
    const last = path[path.length - 1]
    const octaveUp = midiToNote(noteToMidi(last) + 12)
    if (noteToMidi(octaveUp) <= maxMidi + 12) path.push(nearestInPool(noteToMidi(octaveUp), pool))
  }

  return path.slice(0, noteCount + (behavior === 'climax' ? 1 : 0))
}

function noteCountFor(behavior: PhraseBehavior, strength: number): number {
  const fast = strength > 0.6
  const slow = strength < 0.35
  switch (behavior) {
    case 'intimate':
    case 'settle':
      return slow ? 2 : 3
    case 'lift':
      return 3
    case 'climax':
      return fast ? 5 : 4
    default:
      return fast ? 5 : slow ? 3 : 4
  }
}

export function generatePhrase(request: PhraseRequest): PianoPhrase {
  const { behavior, strength, energy, chord, scale } = request
  const [low, high] = registerRange(behavior, energy, request.memory.registerBias)
  const pool = buildGravityPool(chord, scale, low, high)
  const count = noteCountFor(behavior, strength)
  const noteNames = buildNotePath(request, pool, count)
  const rhythm = phraseRhythm(noteNames.length, strength, behavior)

  const notes: PhraseNote[] = []
  let t = 0
  for (let i = 0; i < noteNames.length; i++) {
    const isChord = isChordTone(noteNames[i], chord, scale)
    const accent = i === noteNames.length - 1 || (behavior === 'lift' && i === noteNames.length - 1)
    let vel = rhythm.baseVelocity
    if (accent) vel += 0.08
    if (!isChord) vel *= 0.88
    vel += (Math.random() - 0.5) * 0.06
    vel = Math.max(0.25, Math.min(0.92, vel))

    notes.push({
      note: noteNames[i],
      time: t,
      velocity: vel,
      duration: rhythm.durations[i] ?? '8n',
    })
    t += rhythm.gaps[i] ?? 0.14
  }

  const durationSec = Math.min(1.5, Math.max(0.5, t + 0.35))
  const registerBias =
    behavior === 'lift' || behavior === 'ascend'
      ? Math.min(1, request.memory.registerBias + 0.08)
      : behavior === 'settle' || behavior === 'intimate'
        ? Math.max(0, request.memory.registerBias - 0.08)
        : request.memory.registerBias

  memory = {
    previousNotes: noteNames,
    previousNote: noteNames[noteNames.length - 1] ?? null,
    previousBehavior: behavior,
    registerBias,
  }

  return {
    behavior,
    direction: request.direction,
    notes,
    durationSec,
  }
}

export function behaviorFromSwipe(direction: 'left' | 'right' | 'up' | 'down') {
  const map = {
    right: 'ascend' as const,
    left: 'descend' as const,
    up: 'lift' as const,
    down: 'settle' as const,
  }
  return map[direction]
}
