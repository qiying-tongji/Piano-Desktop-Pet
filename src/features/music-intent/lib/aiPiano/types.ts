/**
 * AI 钢琴乐句类型定义
 *
 * 描述乐句行为、音符事件、记忆状态及生成请求参数。
 */
import type { MusicMode } from '@/stores/musicIntentStore'
import type { KeyId } from '../diatonicHarmony'

export type { MusicMode }

export type PhraseBehavior = 'ascend' | 'descend' | 'lift' | 'settle' | 'climax' | 'intimate'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface PhraseNote {
  note: string
  time: number
  velocity: number
  duration: string
}

export interface PianoPhrase {
  behavior: PhraseBehavior
  direction: SwipeDirection | null
  notes: PhraseNote[]
  /** 乐句总时长（秒），供 UI 高亮使用。 */
  durationSec: number
}

export interface PhraseMemory {
  previousNotes: string[]
  previousNote: string | null
  previousBehavior: PhraseBehavior | null
  registerBias: number
}

export const DEFAULT_PHRASE_MEMORY: PhraseMemory = {
  previousNotes: [],
  previousNote: null,
  previousBehavior: null,
  registerBias: 0.5,
}

export interface PhraseRequest {
  behavior: PhraseBehavior
  direction: SwipeDirection | null
  chord: string
  /** 可见键盘起始八度（C 的八度数字，如 3 = C3 起） */
  octaveStart: number
  /** 当前调性（旋律音阶来源） */
  harmonicKey: KeyId
  /** 当前参考和弦的实际音符（含八度） */
  chordNotes: string[]
  energy: number
  tension: number
  strength: number
  memory: PhraseMemory
  /** 短语节奏风格，默认 dream */
  mode?: MusicMode
}
