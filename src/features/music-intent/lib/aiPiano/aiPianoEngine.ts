/**
 * AI Piano 短语生成引擎
 *
 * 规则型程序化音乐：音阶引力 + 句法记忆 + 随机节奏，生成 0.5–1.5s 钢琴短语。
 */
import { midiToNote, noteToMidi } from '../scales'
import {
  buildGravityPoolForHarmony,
  isChordToneFromNotes,
  nearestInPool,
  pickPassingTone,
} from './melodicGravity'
import { phraseRhythm } from './phraseRhythm'
import type {
  PhraseBehavior,
  MusicMode,
  PhraseMemory,
  PhraseRequest,
  PianoPhrase,
  PhraseNote,
} from './types'
import { DEFAULT_START_OCTAVE } from '@/stores/pianoStore'

import { DEFAULT_PHRASE_MEMORY } from './types'

let memory: PhraseMemory = { ...DEFAULT_PHRASE_MEMORY }

export function getPhraseMemory(): PhraseMemory {
  return { ...memory }
}

export function resetPhraseMemory(): void {
  memory = { ...DEFAULT_PHRASE_MEMORY }
}

function registerRange(
  behavior: PhraseBehavior,
  energy: number,
  bias: number,
  mode: MusicMode,
  octaveStart: number,
): [number, number] {
  const e = energy
  const b = bias
  let range: [number, number]
  switch (behavior) {
    case 'lift':
      range = [58, 76]
      break
    case 'settle':
    case 'intimate':
      range = [48, 62]
      break
    case 'climax':
      range = [52, 80]
      break
    case 'ascend':
      range = [Math.round(52 + b * 4), Math.round(68 + e * 8)]
      break
    case 'descend':
      range = [Math.round(50 + b * 2), Math.round(72 - (1 - e) * 6)]
      break
    default:
      range = [52, 72]
  }
  if (mode === 'drift') {
    range = [range[0] - 4, range[1] + 6]
  } else if (mode === 'pulse') {
    range = [range[0] + 2, range[1] + 2]
  }

  // 随可见键盘八度平移音区（默认 C3 锚点）
  const octaveShift = (octaveStart - DEFAULT_START_OCTAVE) * 12
  return [range[0] + octaveShift, range[1] + octaveShift]
}

function startMidi(
  pool: string[],
  chordNotes: string[],
  behavior: PhraseBehavior,
  mem: PhraseMemory,
): number {
  const rootMidi = chordNotes.length > 0 ? noteToMidi(chordNotes[0]) : 60

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

  const chordMidis = chordNotes.map((n) => noteToMidi(n))
  const inPool = pool.filter((n) => chordMidis.includes(noteToMidi(n)))
  if (inPool.length > 0) {
    return noteToMidi(inPool[Math.floor(inPool.length / 2)])
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
  const { behavior, chordNotes } = request
  let cursor = startMidi(pool, chordNotes, behavior, request.memory)
  const path: string[] = []
  const minMidi = noteToMidi(pool[0])
  const maxMidi = noteToMidi(pool[pool.length - 1])

  for (let i = 0; i < noteCount; i++) {
    const snapped = nearestInPool(cursor, pool, chordNotes)
    path.push(snapped)
    cursor = noteToMidi(snapped)

    if (i < noteCount - 1) {
      const delta = stepDelta(behavior, i, noteCount)
      const target = Math.max(minMidi, Math.min(maxMidi, cursor + delta))
      const passing = pickPassingTone(cursor, target, pool, chordNotes)
      if (passing && i < noteCount - 2) {
        path.push(passing)
        cursor = noteToMidi(passing)
        i++
      }
      cursor = target
    }
  }

  if (behavior === 'descend' || behavior === 'settle' || behavior === 'intimate') {
    const root = chordNotes[0]
    if (root) {
      const rootInRange = nearestInPool(noteToMidi(root) + 12, pool, chordNotes)
      if (!path.includes(rootInRange)) path[path.length - 1] = rootInRange
    }
  }

  if (behavior === 'climax' && path.length >= 2) {
    const last = path[path.length - 1]
    const octaveUp = midiToNote(noteToMidi(last) + 12)
    if (noteToMidi(octaveUp) <= maxMidi + 12) {
      path.push(nearestInPool(noteToMidi(octaveUp), pool, chordNotes))
    }
  }

  return path.slice(0, noteCount + (behavior === 'climax' ? 1 : 0))
}

function noteCountFor(behavior: PhraseBehavior, strength: number, mode: MusicMode): number {
  const fast = strength > 0.6
  const slow = strength < 0.35
  let count: number
  switch (behavior) {
    case 'intimate':
    case 'settle':
      count = slow ? 2 : 3
      break
    case 'lift':
      count = 3
      break
    case 'climax':
      count = fast ? 5 : 4
      break
    default:
      count = fast ? 5 : slow ? 3 : 4
  }
  if (mode === 'pulse') count = Math.min(6, count + 1)
  if (mode === 'ritual') count = Math.max(2, count - (fast ? 0 : 1))
  return count
}

export function generatePhrase(request: PhraseRequest): PianoPhrase {
  const { behavior, strength, energy, mode = 'dream', octaveStart, harmonicKey, chordNotes } = request
  const [low, high] = registerRange(behavior, energy, request.memory.registerBias, mode, octaveStart)
  const pool = buildGravityPoolForHarmony(chordNotes, harmonicKey, low, high)
  const count = noteCountFor(behavior, strength, mode)
  const noteNames = buildNotePath(request, pool, count)
  const rhythm = phraseRhythm(noteNames.length, strength, behavior, mode)

  const notes: PhraseNote[] = []
  let t = 0
  for (let i = 0; i < noteNames.length; i++) {
    const isChord = isChordToneFromNotes(noteNames[i], chordNotes)
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
