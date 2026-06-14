/**
 * 调性和声映射面板
 *
 * 调性选择 + 和弦类型（三和弦 / 七和弦 / Power）+ I–V 级数预览表。
 */
import { useMemo, useState } from 'react'
import {
  CHORD_HARMONY_MODE_OPTIONS,
  KEY_OPTIONS,
  getDiatonicMappingPreview,
  type ChordHarmonyMode,
  type KeyId,
} from '@/features/music-intent/lib/diatonicHarmony'
import { useMusicIntentStore } from '@/stores/musicIntentStore'
import { usePianoStore } from '@/stores/pianoStore'

export function ChordMappingPanel() {
  const harmonicSettings = useMusicIntentStore((s) => s.harmonicSettings)
  const setHarmonicKey = useMusicIntentStore((s) => s.setHarmonicKey)
  const setHarmonyMode = useMusicIntentStore((s) => s.setHarmonyMode)
  const setChordInversion = useMusicIntentStore((s) => s.setChordInversion)
  const scrollPosition = usePianoStore((s) => s.scrollPosition)
  const [open, setOpen] = useState(false)

  const preview = useMemo(
    () =>
      getDiatonicMappingPreview(
        harmonicSettings.keyId,
        harmonicSettings.harmonyMode,
        scrollPosition,
        harmonicSettings.inversion,
      ),
    [harmonicSettings.keyId, harmonicSettings.harmonyMode, harmonicSettings.inversion, scrollPosition],
  )

  const majorKeys = KEY_OPTIONS.filter((k) => k.group === 'major')
  const minorKeys = KEY_OPTIONS.filter((k) => k.group === 'minor')

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-white/70 transition hover:text-white"
      >
        和弦映射 {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(92vw,360px)] rounded-lg border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 text-[10px] text-white/55">
            左手 1–5 指 → I / ii / iii / IV / V（随调性自动计算）
          </p>

          <div className="mb-2 flex flex-wrap gap-2">
            <label className="flex flex-col gap-0.5 text-[10px]">
              <span className="text-white/50">调性</span>
              <select
                value={harmonicSettings.keyId}
                onChange={(e) => setHarmonicKey(e.target.value as KeyId)}
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white/85"
              >
                <optgroup label="大调">
                  {majorKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="小调">
                  {minorKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="flex flex-col gap-0.5 text-[10px]">
              <span className="text-white/50">和弦类型</span>
              <select
                value={harmonicSettings.harmonyMode}
                onChange={(e) => setHarmonyMode(e.target.value as ChordHarmonyMode)}
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white/85"
              >
                {CHORD_HARMONY_MODE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id} title={o.hint}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-0.5 text-[10px]">
              <span className="text-white/50">转位</span>
              <select
                value={harmonicSettings.inversion}
                onChange={(e) => setChordInversion(Number(e.target.value))}
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white/85"
              >
                <option value={0}>原位</option>
                <option value={1}>1转</option>
                <option value={2}>2转</option>
                <option value={3}>3转</option>
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded border border-white/8">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-white/5 text-white/45">
                  <th className="px-2 py-1 text-left font-medium">手指数</th>
                  <th className="px-2 py-1 text-left font-medium">级数</th>
                  <th className="px-2 py-1 text-left font-medium">和弦</th>
                  <th className="px-2 py-1 text-left font-medium">音高</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={row.roman} className={i % 2 ? 'bg-white/[0.03]' : ''}>
                    <td className="px-2 py-1 text-pet-accent/90">{i + 1} 指</td>
                    <td className="px-2 py-1 text-white/70">{row.roman}</td>
                    <td className="px-2 py-1 font-medium text-white/85">{row.symbol}</td>
                    <td className="px-2 py-1 text-white/55">{row.notes.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
