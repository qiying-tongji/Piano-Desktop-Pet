/**
 * 和弦映射（兼容层）
 *
 * 实际逻辑在 diatonicHarmony.ts；此处保留 resolve 入口供意图响应使用。
 */
import {
  resolveDiatonicChord,
  loadHarmonicSettings,
  type FingerCount,
  type HarmonicSettings,
  type KeyId,
  type ChordHarmonyMode,
} from './diatonicHarmony'

export type { FingerCount, KeyId, ChordHarmonyMode, HarmonicSettings }
export {
  loadHarmonicSettings,
  saveHarmonicSettings,
  DEFAULT_HARMONIC_SETTINGS,
  KEY_OPTIONS,
  CHORD_HARMONY_MODE_OPTIONS,
  getDiatonicMappingPreview,
  FINGER_TO_DEGREE,
  ROMAN_LABELS,
  buildKeyScaleNotes,
  getTonicChord,
} from './diatonicHarmony'

export function resolveLeftHandVoicing(
  fingerCount: number,
  scrollPosition: number,
  settings = loadHarmonicSettings(),
): { id: string; name: string; notes: string[]; chordTones: string[] } | null {
  if (fingerCount < 1 || fingerCount > 5) return null
  const resolved = resolveDiatonicChord(
    settings.keyId,
    settings.harmonyMode,
    fingerCount as FingerCount,
    scrollPosition,
    settings.inversion,
  )
  return {
    id: resolved.id,
    name: resolved.name,
    notes: resolved.notes,
    chordTones: resolved.chordTones,
  }
}
