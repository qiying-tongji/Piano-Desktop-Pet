/**
 * 伸指数时间平滑
 *
 * 逐指独立投票 + 迟滞，减少 4↔5 边界抖动；相邻手指数切换更快稳定。
 */
import type { FingerStates } from './fingerAnalysis'
import { countFromFingerStates, fingerStatesToArray } from './fingerAnalysis'

const HISTORY_LEN = 7
const FINGER_COUNT = 5

interface HandSmoothState {
  /** 每指最近 HISTORY_LEN 帧的 true 计数 */
  history: boolean[][]
  stable: boolean[]
}

export class FingerCountSmoother {
  private readonly hands = new Map<number, HandSmoothState>()

  /** 输入本帧逐指状态，返回平滑后的手指数 0–5 */
  update(handIndex: number, frame: FingerStates): number {
    let state = this.hands.get(handIndex)
    if (!state) {
      state = {
        history: [],
        stable: Array(FINGER_COUNT).fill(false),
      }
      this.hands.set(handIndex, state)
    }

    const bits = fingerStatesToArray(frame)
    state.history.push(bits)
    if (state.history.length > HISTORY_LEN) state.history.shift()

    const fourNonThumbStable =
      (frame.index && frame.middle && frame.ring && frame.pinky) ||
      (state.stable[1] && state.stable[2] && state.stable[3] && state.stable[4])

    for (let i = 0; i < FINGER_COUNT; i++) {
      const votes = state.history.filter((h) => h[i]).length
      const len = state.history.length
      const was = state.stable[i]

      let needTrue: number
      let needFalse: number

      if (i === 0 && fourNonThumbStable) {
        // 四指已稳定时：拇指更容易判定为「伸出」(5 指)
        needTrue = Math.max(2, Math.ceil(len * 0.38))
        needFalse = Math.max(2, Math.ceil(len * 0.55))
      } else if (i === 0) {
        needTrue = Math.max(3, Math.ceil(len * 0.55))
        needFalse = Math.max(2, Math.ceil(len * 0.45))
      } else if (i === 4) {
        // 小指略宽松
        needTrue = was ? Math.max(2, Math.ceil(len * 0.38)) : Math.max(3, Math.ceil(len * 0.48))
        needFalse = Math.max(2, Math.ceil(len * 0.5))
      } else {
        needTrue = was ? Math.max(2, Math.ceil(len * 0.4)) : Math.max(3, Math.ceil(len * 0.52))
        needFalse = Math.max(2, Math.ceil(len * 0.48))
      }

      if (was) {
        state.stable[i] = votes >= len - needFalse
      } else {
        state.stable[i] = votes >= needTrue
      }
    }

    return state.stable.filter(Boolean).length
  }

  /** 四指稳定、拇指帧间摇摆时，优先用本帧几何结果打破僵局 */
  resolveAmbiguousFourFive(handIndex: number, frame: FingerStates): number {
    const smoothed = this.update(handIndex, frame)
    const raw = countFromFingerStates(frame)
    const fourUp = frame.index && frame.middle && frame.ring && frame.pinky

    if (!fourUp) return smoothed

    if (raw === 5 && smoothed === 4) return 5
    if (raw === 4 && smoothed === 5 && !frame.thumb) return 4

    return smoothed
  }

  reset(): void {
    this.hands.clear()
  }

  deleteHand(handIndex: number): void {
    this.hands.delete(handIndex)
  }
}
