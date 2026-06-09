import type { ScaleId } from '@/stores/musicIntentStore'
import { buildScaleNotes, scaleIndexOf } from './scales'

let lastMelodyNote: string | null = null
let phraseDirection = 1

export function resetMelodyMemory(): void {
  lastMelodyNote = null
  phraseDirection = 1
}

export function getLastMelodyNote(): string | null {
  return lastMelodyNote
}

function melodyPool(scaleId: ScaleId, energy: number, tension: number): string[] {
  const low = energy < 0.3 ? 48 : energy < 0.35 ? 52 : tension > 0.55 ? 53 : 55
  const high = energy > 0.75 ? 84 : energy > 0.45 ? 79 : 74
  return buildScaleNotes(scaleId, low, high)
}

function pickRandomFromPool(pool: string[], avoid?: string | null): string {
  if (pool.length === 0) return 'C4'
  if (pool.length === 1) return pool[0]
  let candidate = pool[Math.floor(Math.random() * pool.length)]
  if (avoid && candidate === avoid) {
    candidate = pool[(pool.indexOf(candidate) + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length]
  }
  return candidate
}

/** ~10% chance to rest instead of playing on tap. */
export function shouldSkipTap(strength = 0.5): boolean {
  return Math.random() < 0.1 - strength * 0.04
}

/** Pick next melody note — heavy mix of steps, leaps, sparks, register jumps. */
export function pickMelodyNote(
  scaleId: ScaleId,
  energy: number,
  tension = 0.3,
  strength = 0.5,
): string {
  const pool = melodyPool(scaleId, energy, tension)
  if (pool.length === 0) return 'C4'

  if (!lastMelodyNote) {
    lastMelodyNote = pickRandomFromPool(pool)
    phraseDirection = Math.random() > 0.5 ? 1 : -1
    return lastMelodyNote
  }

  const idx = scaleIndexOf(lastMelodyNote, scaleId)
  const safeIdx = idx >= 0 ? idx : Math.floor(pool.length / 2)

  // Spark: teleport to a distant region of the scale.
  const sparkChance = 0.22 + strength * 0.18 + tension * 0.12 + energy * 0.06
  if (Math.random() < sparkChance) {
    lastMelodyNote = pickRandomFromPool(pool, lastMelodyNote)
    phraseDirection = Math.random() > 0.5 ? 1 : -1
    return lastMelodyNote
  }

  // Full phrase reset — jump to opposite register.
  if (Math.random() < 0.08 + energy * 0.06) {
    const half = Math.floor(pool.length / 2)
    const target =
      safeIdx < half
        ? pool[Math.min(pool.length - 1, half + Math.floor(Math.random() * Math.max(1, pool.length - half)))]
        : pool[Math.floor(Math.random() * Math.max(1, half))]
    lastMelodyNote = target
    phraseDirection = Math.random() > 0.5 ? 1 : -1
    return lastMelodyNote
  }

  const roll = Math.random()
  let delta: number

  if (roll < 0.32) {
    const maxStep = energy > 0.5 ? 3 : 2
    delta = phraseDirection * (1 + Math.floor(Math.random() * maxStep))
  } else if (roll < 0.58) {
    const leap = 2 + Math.floor(Math.random() * 5) + (energy > 0.55 ? 2 : 0)
    delta = (Math.random() > 0.38 ? 1 : -1) * leap
    phraseDirection = delta > 0 ? 1 : -1
  } else if (roll < 0.78) {
    delta = Math.floor(Math.random() * 11) - 5
  } else if (roll < 0.9) {
    delta = -phraseDirection * (1 + Math.floor(Math.random() * 3))
  } else {
    delta = 0
    lastMelodyNote = pickRandomFromPool(pool, lastMelodyNote)
    return lastMelodyNote
  }

  let nextIdx = Math.max(0, Math.min(pool.length - 1, safeIdx + delta))
  if (pool[nextIdx] === lastMelodyNote) {
    nextIdx = Math.max(0, Math.min(pool.length - 1, nextIdx + (Math.random() > 0.5 ? 1 : -1) * phraseDirection))
  }

  if (nextIdx <= 0 || nextIdx >= pool.length - 1) {
    phraseDirection *= -1
  }

  lastMelodyNote = pool[nextIdx]
  return lastMelodyNote
}

/** Occasional harmony a 3rd–5th above/below (quantized in scale). */
export function pickHarmonyNote(scaleId: ScaleId, rootNote: string): string | null {
  if (Math.random() > 0.42) return null
  const pool = buildScaleNotes(scaleId, 48, 84)
  const idx = scaleIndexOf(rootNote, scaleId)
  if (idx < 0) return null
  const intervals = [2, 3, 4, -2, -3, 5]
  const interval = intervals[Math.floor(Math.random() * intervals.length)]
  const hIdx = Math.max(0, Math.min(pool.length - 1, idx + interval))
  const harmony = pool[hIdx]
  return harmony === rootNote ? null : harmony
}

/** Random note length for tap — wider rhythmic spread. */
export function pickTapDuration(energy: number, strength: number): string {
  const roll = Math.random()
  if (roll < 0.28 - strength * 0.08) return '16n'
  if (roll < 0.42 + energy * 0.05) return '32n'
  if (roll < 0.72 + energy * 0.08) return '8n'
  if (roll < 0.9) return '4n'
  return Math.random() > 0.5 ? '16n' : '8n'
}

/** Velocity with wider random spread. */
export function pickTapVelocity(strength: number, energy: number): number {
  const base = 0.35 + strength * 0.42 + energy * 0.12
  const jitter = (Math.random() - 0.5) * 0.22
  return Math.max(0.22, Math.min(0.95, base + jitter))
}

export function pickArpeggioNotes(
  scaleId: ScaleId,
  direction: 'left' | 'right',
  count: number,
): string[] {
  const pool = buildScaleNotes(scaleId, 52, 81)
  if (pool.length === 0) return ['C4', 'E4', 'G4', 'A4']

  const startIdx =
    direction === 'right'
      ? Math.floor(Math.random() * Math.max(1, pool.length * 0.55))
      : Math.floor(pool.length * 0.45 + Math.random() * Math.max(1, pool.length * 0.45))

  const notes: string[] = []
  let idx = Math.max(0, Math.min(pool.length - 1, startIdx))
  let localDir = direction === 'right' ? 1 : -1

  for (let i = 0; i < count; i++) {
    notes.push(pool[idx])
    const stepRoll = Math.random()
    if (stepRoll < 0.18) {
      idx = Math.floor(Math.random() * pool.length)
    } else if (stepRoll < 0.32) {
      localDir *= -1
      idx = Math.max(0, Math.min(pool.length - 1, idx + localDir))
    } else if (stepRoll < 0.48) {
      idx = Math.max(0, Math.min(pool.length - 1, idx + localDir * (2 + Math.floor(Math.random() * 3))))
    } else if (stepRoll < 0.58) {
      // repeat same note
    } else {
      idx = Math.max(0, Math.min(pool.length - 1, idx + localDir))
    }
  }

  return notes
}

/** Jitter arpeggio timing multiplier per note. */
export function pickArpeggioGap(baseGap: number): number {
  return baseGap * (0.72 + Math.random() * 0.65)
}
