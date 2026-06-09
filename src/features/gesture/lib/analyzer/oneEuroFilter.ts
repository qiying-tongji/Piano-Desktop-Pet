import { ONE_EURO_BETA, ONE_EURO_MIN_CUTOFF } from '../constants'

/** 1€ filter — low lag on fast motion, smooth on slow motion. */
export class OneEuroFilter {
  private readonly minCutoff: number
  private readonly beta: number
  private xPrev: number | null = null
  private dxPrev = 0
  private tPrev: number | null = null

  constructor(minCutoff = ONE_EURO_MIN_CUTOFF, beta = ONE_EURO_BETA) {
    this.minCutoff = minCutoff
    this.beta = beta
  }

  filter(value: number, timestamp: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = timestamp
      this.xPrev = value
      return value
    }

    const dt = Math.max((timestamp - this.tPrev) / 1000, 1e-4)
    const dx = (value - this.xPrev) / dt
    const edx = this.smooth(dx, this.dxPrev, this.cutoff(dt))
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)
    const result = this.smooth(value, this.xPrev, cutoff)

    this.xPrev = result
    this.dxPrev = edx
    this.tPrev = timestamp
    return result
  }

  reset(): void {
    this.xPrev = null
    this.dxPrev = 0
    this.tPrev = null
  }

  private cutoff(dt: number): number {
    const r = 2 * Math.PI * this.minCutoff
    return r * dt / (r * dt + 1)
  }

  private smooth(value: number, prev: number, alpha: number): number {
    return alpha * value + (1 - alpha) * prev
  }
}

export class OneEuroFilter2D {
  private readonly fx: OneEuroFilter
  private readonly fy: OneEuroFilter

  constructor(minCutoff?: number, beta?: number) {
    this.fx = new OneEuroFilter(minCutoff, beta)
    this.fy = new OneEuroFilter(minCutoff, beta)
  }

  filter(x: number, y: number, timestamp: number): { x: number; y: number } {
    return {
      x: this.fx.filter(x, timestamp),
      y: this.fy.filter(y, timestamp),
    }
  }

  reset(): void {
    this.fx.reset()
    this.fy.reset()
  }
}
