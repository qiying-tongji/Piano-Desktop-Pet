import type { PhraseBehavior } from './types'

export interface PhraseRhythm {
  gaps: number[]
  durations: string[]
  baseVelocity: number
}

/** Gesture strength → breathing, density, dynamics. */
export function phraseRhythm(
  noteCount: number,
  strength: number,
  behavior: PhraseBehavior,
): PhraseRhythm {
  const fast = strength > 0.62
  const slow = strength < 0.38

  let baseGap = fast ? 0.09 : slow ? 0.22 : 0.15
  let duration = fast ? '8n' : slow ? '4n' : '8n'
  let baseVelocity = 0.42 + strength * 0.38

  switch (behavior) {
    case 'ascend':
      baseGap *= 0.95
      baseVelocity += 0.04
      break
    case 'descend':
      baseGap *= 1.05
      duration = slow ? '4n' : '8n'
      break
    case 'lift':
      baseGap *= 1.1
      duration = '4n'
      baseVelocity += 0.1
      break
    case 'settle':
      baseGap *= 1.35
      duration = '4n'
      baseVelocity *= 0.78
      break
    case 'climax':
      baseGap *= 0.85
      duration = '4n'
      baseVelocity += 0.12
      break
    case 'intimate':
      baseGap *= 1.45
      duration = '2n'
      baseVelocity *= 0.65
      break
  }

  const gaps: number[] = []
  const durations: string[] = []
  for (let i = 0; i < noteCount; i++) {
    gaps.push(baseGap * (0.88 + Math.random() * 0.28))
    durations.push(i === noteCount - 1 ? (slow ? '4n' : '8n') : duration)
  }

  return { gaps, durations, baseVelocity }
}
