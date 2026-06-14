/**
 * 性能档位选择器
 *
 * 切换高/平衡/省电三档，影响粒子、检测频率等性能相关配置。
 */
import { usePerformanceStore } from '@/stores/performanceStore'
import type { PerformanceQuality } from '@/shared/lib/performanceProfiles'

const OPTIONS: { id: PerformanceQuality; label: string }[] = [
  { id: 'high', label: '高' },
  { id: 'balanced', label: '平衡' },
  { id: 'low', label: '省电' },
]

export function PerformanceQualitySelect() {
  const quality = usePerformanceStore((s) => s.quality)
  const setQuality = usePerformanceStore((s) => s.setQuality)

  return (
    <label className="flex items-center gap-2">
      <span className="shrink-0 text-white/55">性能</span>
      <select
        value={quality}
        onChange={(e) => setQuality(e.target.value as PerformanceQuality)}
        className="rounded border border-white/15 bg-black/40 px-2 py-1 text-[11px] text-white/80 outline-none focus:border-pet-glow/45"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
