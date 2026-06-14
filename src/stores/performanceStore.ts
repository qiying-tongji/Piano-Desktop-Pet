/**
 * 性能档位状态（Zustand）
 *
 * high/balanced/low 三档，控制 MediaPipe 检测间隔、摄像头分辨率、粒子数量等。
 * 选择持久化至 localStorage。
 */
import { create } from 'zustand'
import {
  getPerformanceProfile,
  type PerformanceProfile,
  type PerformanceQuality,
} from '@/shared/lib/performanceProfiles'

const STORAGE_KEY = 'piano-performance-quality'

function loadQuality(): PerformanceQuality {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'high' || v === 'balanced' || v === 'low') return v
  } catch {
    /* ignore */
  }
  return 'balanced'
}

interface PerformanceState {
  quality: PerformanceQuality
  profile: PerformanceProfile
  setQuality: (quality: PerformanceQuality) => void
}

export const usePerformanceStore = create<PerformanceState>((set) => {
  const initial = loadQuality()
  return {
    quality: initial,
    profile: getPerformanceProfile(initial),
    setQuality: (quality) => {
      try {
        localStorage.setItem(STORAGE_KEY, quality)
      } catch {
        /* ignore */
      }
      set({ quality, profile: getPerformanceProfile(quality) })
    },
  }
})
