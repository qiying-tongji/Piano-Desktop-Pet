/**
 * 左手和弦解析
 *
 * 基于调性 + 和弦模式 + 级数（I–V）解析伸指 → 和弦 voicing。
 */
import {
  resolveDiatonicChord,
  getLeftHandChordLabel as diatonicLabel,
  loadHarmonicSettings,
  type ChordHarmonyMode,
  type FingerCount,
  type HarmonicSettings,
  type KeyId,
} from './diatonicHarmony'
import { usePianoStore } from '@/stores/pianoStore'

export type { KeyId, ChordHarmonyMode, HarmonicSettings, FingerCount }

export function getHarmonicSettings(): HarmonicSettings {
  return loadHarmonicSettings()
}

export function getLeftHandChordByFingerCount(
  count: number,
  scrollPosition = usePianoStore.getState().scrollPosition,
  settings = loadHarmonicSettings(),
): { id: string; name: string; notes: string[]; chordTones: string[] } | null {
  if (count < 1 || count > 5) return null
  const resolved = resolveDiatonicChord(
    settings.keyId,
    settings.harmonyMode,
    count as FingerCount,
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

export function getLeftHandChordLabel(
  count: number,
  keyId: KeyId = loadHarmonicSettings().keyId,
  harmonyMode: ChordHarmonyMode = loadHarmonicSettings().harmonyMode,
): string {
  return diatonicLabel(count, keyId, harmonyMode)
}
