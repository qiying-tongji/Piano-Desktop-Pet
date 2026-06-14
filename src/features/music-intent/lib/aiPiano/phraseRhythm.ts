/**
 * 乐句节奏生成
 *
 * 根据手势力度与乐句行为（上行/收句/高潮等）生成音符间隔、时值与力度。
 */
import type { PhraseBehavior, MusicMode } from './types'

export interface PhraseRhythm {
  gaps: number[]
  durations: string[]
  baseVelocity: number
}

/** 手势力度 + MusicMode → 呼吸感、密度与动态。 */
export function phraseRhythm(
  noteCount: number,
  strength: number,
  behavior: PhraseBehavior,
  mode: MusicMode = 'dream',
): PhraseRhythm {
  const fast = strength > 0.62
  const slow = strength < 0.38

  let baseGap = fast ? 0.09 : slow ? 0.22 : 0.15
  let duration = fast ? '8n' : slow ? '4n' : '8n'
  let baseVelocity = 0.42 + strength * 0.38

  // MusicMode 全局修饰
  switch (mode) {
    case 'pulse':
      baseGap *= 0.82
      baseVelocity += 0.06
      break
    case 'drift':
      baseGap *= 1.28
      baseVelocity *= 0.88
      duration = slow ? '2n' : '4n'
      break
    case 'ritual':
      baseGap *= 0.95
      break
    case 'dream':
    default:
      baseGap *= 1.05
      break
  }

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
    const jitter = mode === 'ritual' ? 0.08 : 0.28
    gaps.push(baseGap * (0.88 + Math.random() * jitter))
    durations.push(i === noteCount - 1 ? (slow ? '4n' : '8n') : duration)
  }

  return { gaps, durations, baseVelocity }
}
