/**
 * 和弦音与 Voicing 工具
 *
 * 定义和弦音程结构，并提供按当前音阶量化后的音符列表。
 */
import type { ScaleId } from '@/stores/musicIntentStore'
import type { ChordQuality } from './chordVoicing'
import { quantizeToScale } from './scales'

/** 相对根音的半音偏移（根音 = 0） */
export const CHORD_INTERVALS: Record<string, readonly number[]> = {
  C: [0, 4, 7],
  Dm: [2, 5, 9],
  Em: [4, 7, 11],
  F: [5, 9, 0],
  G: [7, 11, 2],
  Am: [9, 0, 4],
  Cmaj7: [0, 4, 7, 11],
  Dm7: [2, 5, 9, 0],
  Em7: [4, 7, 11, 2],
  Fmaj7: [5, 9, 0, 4],
  G7: [7, 11, 2, 5],
  Am7: [9, 0, 4, 7],
}

/** 三和弦 ID 对应的七和弦 ID */
const TRIAD_TO_SEVENTH: Record<string, string> = {
  C: 'Cmaj7',
  Dm: 'Dm7',
  Em: 'Em7',
  F: 'Fmaj7',
  G: 'G7',
  Am: 'Am7',
}

export function getChordIdForQuality(chordId: string, quality: ChordQuality): string {
  if (quality === 'seventh') {
    if (CHORD_INTERVALS[chordId]?.length === 4) return chordId
    return TRIAD_TO_SEVENTH[chordId] ?? `${chordId}7`
  }
  // triad：若配置的是七和弦 ID，取前三音
  if (CHORD_INTERVALS[chordId]?.length === 4) {
    const triadKey = Object.entries(TRIAD_TO_SEVENTH).find(([, v]) => v === chordId)?.[0]
    return triadKey ?? chordId
  }
  return chordId
}

/** 兼容旧 API：从 CHORD_INTERVALS 在 C3 附近生成默认 voicing */
export const CHORD_TONES: Record<string, string[]> = Object.fromEntries(
  Object.entries(CHORD_INTERVALS).map(([id, intervals]) => {
    const rootMidi = 48
    let bump = 0
    let prev = -1
    const notes = intervals.map((iv) => {
      const pc = ((iv % 12) + 12) % 12
      if (prev >= 0 && pc <= prev) bump += 1
      prev = pc
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const octave = Math.floor((rootMidi + iv + bump * 12) / 12) - 1
      return `${names[pc]}${octave}`
    })
    return [id, notes]
  }),
)

export function getChordNotes(chord: string, scaleId: ScaleId): string[] {
  const raw = CHORD_TONES[chord] ?? CHORD_TONES.C
  return raw.map((n) => quantizeToScale(n, scaleId))
}
