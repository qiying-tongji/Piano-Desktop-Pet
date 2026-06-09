import type { HandFeatures } from '../analyzer/types'
import {
  CHORD_FINGER_STABLE_MS,
  COMPRESS_COOLDOWN_MS,
  DUAL_COMPRESS_DISTANCE_DELTA,
  DUAL_COMPRESS_OPEN_THRESHOLD,
  DUAL_EXPAND_DISTANCE_DELTA,
  DUAL_EXPAND_OPEN_THRESHOLD,
  DUAL_HAND_MIN_DISTANCE,
  EXPAND_COOLDOWN_MS,
  SWIPE_AXIS_RATIO,
  SWIPE_COOLDOWN_MS,
  SWIPE_VX_THRESHOLD,
  SWIPE_VY_THRESHOLD,
} from './config'
import { isExpressionHand, isWorldHand, normalizeHandSide } from './handRole'
import type { HandSide, IntentEvent, SwipeDirection } from './types'

interface HandFsmState {
  pendingFingerCount: number | null
  pendingSince: number
  activeFingerCount: number | null
  cooldownUntil: Partial<Record<'swipe', number>>
}

export class IntentDetector {
  private readonly states = new Map<number, HandFsmState>()
  private dualPrevDistance = 0
  private dualPrevAvgOpen = 0.5
  private dualCooldownUntil = 0

  detect(hands: HandFeatures[]): IntentEvent[] {
    const events: IntentEvent[] = []
    const active = new Set<number>()
    events.push(...this.detectDualHand(hands))

    for (const hand of hands) {
      active.add(hand.handIndex)
      const side = normalizeHandSide(hand.label)
      let state = this.states.get(hand.handIndex)
      if (!state) {
        state = {
          pendingFingerCount: null,
          pendingSince: hand.timestamp,
          activeFingerCount: null,
          cooldownUntil: {},
        }
        this.states.set(hand.handIndex, state)
      }

      events.push(...this.detectExpression(hand, side, state))
      events.push(...this.detectLeftChord(hand, side, state))
    }

    for (const [key, state] of this.states) {
      if (active.has(key)) continue
      if (state.activeFingerCount !== null) {
        events.push({
          type: 'chord_release',
          hand: 'left',
          handIndex: key,
          strength: 0.5,
          timestamp: performance.now(),
        })
      }
      this.states.delete(key)
    }

    return events
  }

  reset(): void {
    this.states.clear()
    this.dualPrevDistance = 0
    this.dualPrevAvgOpen = 0.5
    this.dualCooldownUntil = 0
  }

  /** Both hands — expand (spread) / compress (close). */
  private detectDualHand(hands: HandFeatures[]): IntentEvent[] {
    if (hands.length < 2) return []
    const now = hands[0].timestamp
    if (now < this.dualCooldownUntil) return []

    const [a, b] = hands
    const dx = a.center.x - b.center.x
    const dy = a.center.y - b.center.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const avgOpen = (a.openness + b.openness) / 2
    const distDelta = dist - this.dualPrevDistance

    const events: IntentEvent[] = []

    const expanding =
      dist > DUAL_HAND_MIN_DISTANCE &&
      (distDelta > DUAL_EXPAND_DISTANCE_DELTA ||
        (avgOpen > DUAL_EXPAND_OPEN_THRESHOLD && this.dualPrevAvgOpen < 0.52))

    const compressing =
      distDelta < DUAL_COMPRESS_DISTANCE_DELTA ||
      (avgOpen < DUAL_COMPRESS_OPEN_THRESHOLD && this.dualPrevAvgOpen > 0.48)

    if (expanding && !compressing) {
      events.push({
        type: 'expand',
        hand: 'right',
        handIndex: a.handIndex,
        strength: Math.min(1, 0.45 + avgOpen * 0.35 + dist * 0.4),
        timestamp: now,
      })
      this.dualCooldownUntil = now + EXPAND_COOLDOWN_MS
    } else if (compressing && dist < 0.55) {
      events.push({
        type: 'compress',
        hand: 'right',
        handIndex: a.handIndex,
        strength: Math.min(1, 0.4 + (1 - avgOpen) * 0.45),
        timestamp: now,
      })
      this.dualCooldownUntil = now + COMPRESS_COOLDOWN_MS
    }

    this.dualPrevDistance = dist
    this.dualPrevAvgOpen = avgOpen
    return events
  }

  /** Right hand — large swipes → phrase direction (4-way). */
  private detectExpression(
    hand: HandFeatures,
    side: HandSide,
    state: HandFsmState,
  ): IntentEvent[] {
    if (!isExpressionHand(side)) return []

    const now = hand.timestamp
    const swipeReady = (state.cooldownUntil.swipe ?? 0) <= now
    if (!swipeReady) return []

    const { x: vx, y: vy, magnitude } = hand.velocity
    if (magnitude < 0.42) return []

    const absVx = Math.abs(vx)
    const absVy = Math.abs(vy)

    let direction: SwipeDirection | null = null
    if (absVx > SWIPE_VX_THRESHOLD && absVx > absVy * SWIPE_AXIS_RATIO) {
      direction = vx > 0 ? 'right' : 'left'
    } else if (absVy > SWIPE_VY_THRESHOLD && absVy > absVx * SWIPE_AXIS_RATIO) {
      direction = vy < 0 ? 'up' : 'down'
    }

    if (!direction) return []

    state.cooldownUntil.swipe = now + SWIPE_COOLDOWN_MS
    return [
      {
        type: 'swipe',
        hand: side,
        handIndex: hand.handIndex,
        strength: Math.min(1, magnitude / 1.6),
        direction,
        timestamp: now,
      },
    ]
  }

  private detectLeftChord(
    hand: HandFeatures,
    side: HandSide,
    state: HandFsmState,
  ): IntentEvent[] {
    if (!isWorldHand(side)) return []

    const now = hand.timestamp
    const count = hand.extendedFingerCount
    const events: IntentEvent[] = []

    if (state.pendingFingerCount !== count) {
      state.pendingFingerCount = count
      state.pendingSince = now
    }

    if (now - state.pendingSince < CHORD_FINGER_STABLE_MS) return events

    if (count >= 1 && count <= 5) {
      if (state.activeFingerCount === count) return events
      state.activeFingerCount = count
      events.push({
        type: 'chord_select',
        hand: side,
        handIndex: hand.handIndex,
        strength: Math.min(1, 0.35 + count * 0.12),
        fingerCount: count,
        timestamp: now,
      })
      return events
    }

    if (state.activeFingerCount !== null) {
      state.activeFingerCount = null
      events.push({
        type: 'chord_release',
        hand: side,
        handIndex: hand.handIndex,
        strength: 0.5,
        timestamp: now,
      })
    }

    return events
  }
}
