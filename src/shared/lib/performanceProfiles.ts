/**
 * 性能档位配置
 *
 * high/balanced/low 三档参数：MediaPipe 检测间隔、摄像头分辨率、粒子数量、R3F DPR 等。
 */
export type PerformanceQuality = 'high' | 'balanced' | 'low'

export interface PerformanceProfile {
  label: string
  /** MediaPipe 两次检测之间的最小间隔（ms） */
  detectIntervalMs: number
  camera: { width: number; height: number }
  ambientParticles: number
  burstParticles: number
  r3fDpr: number
  /** 手势 HUD 状态写入的最小间隔（ms） */
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
