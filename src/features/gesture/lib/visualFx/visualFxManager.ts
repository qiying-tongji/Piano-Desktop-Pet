import type { HandFeatures } from '../analyzer/types'
import type { IntentEvent, SwipeDirection } from '../intent/types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface Ring {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
  color: string
  shrink?: boolean
}

interface Ribbon {
  points: { x: number; y: number }[]
  life: number
  maxLife: number
  color: string
}

class VisualFxManager {
  private particles: Particle[] = []
  private rings: Ring[] = []
  private ribbons: Ribbon[] = []
  private lastTick = performance.now()

  tick(now = performance.now()): void {
    const dt = (now - this.lastTick) / 1000
    this.lastTick = now

    this.particles = this.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0)

    this.rings = this.rings
      .map((r) => ({
        ...r,
        radius: r.shrink
          ? r.radius - (r.maxRadius / r.maxLife) * dt * 1.4
          : r.radius + (r.maxRadius / r.maxLife) * dt * 1.2,
        life: r.life - dt,
      }))
      .filter((r) => r.life > 0)

    this.ribbons = this.ribbons
      .map((r) => ({ ...r, life: r.life - dt }))
      .filter((r) => r.life > 0)
  }

  clear(): void {
    this.particles = []
    this.rings = []
    this.ribbons = []
  }

  onIntent(
    event: IntentEvent,
    hand: HandFeatures,
    width: number,
    height: number,
    fxScale = 1,
  ): void {
    const cx = hand.center.x * width
    const cy = hand.center.y * height

    switch (event.type) {
      case 'swipe':
        this.onSwipePhrase(event, hand, cx, cy, width, height, fxScale)
        break
      case 'expand':
        this.onExpand(cx, cy, event.strength, fxScale)
        break
      case 'compress':
        this.onCompress(cx, cy, event.strength, fxScale)
        break
      case 'chord_select':
        this.rings.push({
          x: cx,
          y: cy,
          radius: 10,
          maxRadius: 36 + (event.fingerCount ?? 3) * 8,
          life: 0.55,
          maxLife: 0.55,
          color: '#67e8f9',
        })
        this.spawnBurst(cx, cy, '#67e8f9', 8 + (event.fingerCount ?? 1) * 2)
        break
      case 'chord_release':
        this.rings.push({
          x: cx,
          y: cy,
          radius: 40,
          maxRadius: 40,
          life: 0.4,
          maxLife: 0.4,
          color: '#334155',
          shrink: true,
        })
        break
      default:
        break
    }
  }

  private onSwipePhrase(
    event: IntentEvent,
    hand: HandFeatures,
    cx: number,
    cy: number,
    width: number,
    height: number,
    fxScale: number,
  ): void {
    const dir = event.direction ?? 'right'
    const flow = swipeFlowVector(dir, event.strength)
    const color = swipeColor(dir)

    const pts = hand.trail.map((p) => ({ x: p.x * width, y: p.y * height }))
    if (pts.length >= 2) {
      this.ribbons.push({
        points: pts,
        life: 0.65,
        maxLife: 0.65,
        color,
      })
    }

    this.spawnDirectionalFlow(cx, cy, flow.vx, flow.vy, color, Math.floor((22 + event.strength * 14) * fxScale))
  }

  private onExpand(cx: number, cy: number, strength: number, fxScale: number): void {
    for (let i = 0; i < 3; i++) {
      this.rings.push({
        x: cx,
        y: cy,
        radius: 16 + i * 8,
        maxRadius: 90 + strength * 70 + i * 24,
        life: 0.9 - i * 0.15,
        maxLife: 0.9 - i * 0.15,
        color: i === 0 ? '#a78bfa' : '#67e8f9',
      })
    }
    this.spawnBurst(cx, cy, '#a78bfa', Math.floor((28 + strength * 12) * fxScale))
  }

  private onCompress(cx: number, cy: number, strength: number, fxScale: number): void {
    this.rings.push({
      x: cx,
      y: cy,
      radius: 70 + strength * 30,
      maxRadius: 70 + strength * 30,
      life: 0.55,
      maxLife: 0.55,
      color: '#475569',
      shrink: true,
    })
    for (let i = 0; i < Math.floor(18 * fxScale); i++) {
      const angle = (i / 18) * Math.PI * 2
      const r = 55 + Math.random() * 40
      this.particles.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: -Math.cos(angle) * (90 + strength * 60),
        vy: -Math.sin(angle) * (90 + strength * 60),
        life: 0.5,
        maxLife: 0.5,
        size: 2 + Math.random() * 2,
        color: '#64748b',
      })
    }
  }

  draw(ctx: CanvasRenderingContext2D, lite = false): void {
    for (const ribbon of this.ribbons) {
      const alpha = ribbon.life / ribbon.maxLife
      ctx.save()
      ctx.globalAlpha = alpha * 0.85
      ctx.strokeStyle = ribbon.color
      ctx.lineWidth = 4 + alpha * 8
      ctx.lineCap = 'round'
      ctx.shadowBlur = lite ? 0 : 16 * alpha
      ctx.shadowColor = ribbon.color
      ctx.beginPath()
      ribbon.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.stroke()
      ctx.restore()
    }

    for (const ring of this.rings) {
      const alpha = ring.life / ring.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = ring.color
      ctx.lineWidth = 2 + alpha * 2
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, Math.max(0, ring.radius), 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  private spawnDirectionalFlow(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    count: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const spread = 0.35 + Math.random() * 0.5
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: vx * spread + (Math.random() - 0.5) * 40,
        vy: vy * spread + (Math.random() - 0.5) * 40,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 2 + Math.random() * 3.5,
        color,
      })
    }
  }

  private spawnBurst(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
      const speed = 80 + Math.random() * 100
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        size: 2 + Math.random() * 3,
        color,
      })
    }
  }
}

function swipeFlowVector(dir: SwipeDirection, strength: number): { vx: number; vy: number } {
  const s = 100 + strength * 80
  switch (dir) {
    case 'right':
      return { vx: s, vy: -s * 0.35 }
    case 'left':
      return { vx: -s, vy: -s * 0.25 }
    case 'up':
      return { vx: s * 0.15, vy: -s * 1.1 }
    case 'down':
      return { vx: -s * 0.1, vy: s * 0.9 }
  }
}

function swipeColor(dir: SwipeDirection): string {
  switch (dir) {
    case 'right':
      return '#a78bfa'
    case 'left':
      return '#67e8f9'
    case 'up':
      return '#c4b5fd'
    case 'down':
      return '#94a3b8'
  }
}

export const visualFxManager = new VisualFxManager()

export function drawVisualFx(ctx: CanvasRenderingContext2D, lite = false): void {
  visualFxManager.draw(ctx, lite)
}

export function tickVisualFx(now?: number): void {
  visualFxManager.tick(now)
}

export function clearVisualFx(): void {
  visualFxManager.clear()
}
