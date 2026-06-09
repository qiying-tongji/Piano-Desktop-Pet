import type { ScaleId } from '@/stores/musicIntentStore'
import { buildScaleNotes } from './scales'

/** Varied loop pattern — random walk with frequent leaps and register jumps. */
export function pickLoopNotes(scaleId: ScaleId, count: number): string[] {
  const pool = buildScaleNotes(scaleId, 52, 81)
  if (pool.length === 0) return ['C4', 'E4', 'G4', 'A4', 'G4', 'E4']

  let idx = Math.floor(Math.random() * pool.length)
  let dir = Math.random() > 0.5 ? 1 : -1
  const notes: string[] = []

  for (let i = 0; i < count; i++) {
    notes.push(pool[idx])
    const roll = Math.random()
    if (roll < 0.38) {
      idx = Math.max(0, Math.min(pool.length - 1, idx + dir * (1 + Math.floor(Math.random() * 2))))
    } else if (roll < 0.52) {
      idx = Math.max(0, Math.min(pool.length - 1, idx - dir))
      dir *= -1
    } else if (roll < 0.72) {
      idx = Math.floor(Math.random() * pool.length)
    } else if (roll < 0.85) {
      idx = Math.max(0, Math.min(pool.length - 1, idx + dir * (3 + Math.floor(Math.random() * 4))))
    } else {
      // hold / repeat
    }
    if (idx <= 0 || idx >= pool.length - 1) dir *= -1
  }

  return notes
}

/** Slight tempo wobble for gesture loops. */
export function pickLoopInterval(baseInterval: number, energy: number): number {
  const wobble = 0.82 + Math.random() * 0.45
  const energyBoost = 1 - energy * 0.25
  return baseInterval * wobble * energyBoost
}
