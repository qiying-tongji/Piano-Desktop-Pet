export type PerformanceQuality = 'high' | 'balanced' | 'low'

export interface PerformanceProfile {
  label: string
  /** Min ms between MediaPipe detect calls. */
  detectIntervalMs: number
  camera: { width: number; height: number }
  ambientParticles: number
  burstParticles: number
  r3fDpr: number
  /** Min ms between gesture HUD store writes. */
  hudUpdateMs: number
  visualFxScale: number
}

export const PERFORMANCE_PROFILES: Record<PerformanceQuality, PerformanceProfile> = {
  high: {
    label: '高',
    detectIntervalMs: 20,
    camera: { width: 640, height: 480 },
    ambientParticles: 140,
    burstParticles: 64,
    r3fDpr: 1.5,
    hudUpdateMs: 80,
    visualFxScale: 1,
  },
  balanced: {
    label: '平衡',
    detectIntervalMs: 42,
    camera: { width: 640, height: 360 },
    ambientParticles: 96,
    burstParticles: 48,
    r3fDpr: 1,
    hudUpdateMs: 160,
    visualFxScale: 0.75,
  },
  low: {
    label: '省电',
    detectIntervalMs: 66,
    camera: { width: 480, height: 360 },
    ambientParticles: 56,
    burstParticles: 32,
    r3fDpr: 1,
    hudUpdateMs: 280,
    visualFxScale: 0.5,
  },
}

export function getPerformanceProfile(quality: PerformanceQuality): PerformanceProfile {
  return PERFORMANCE_PROFILES[quality]
}
