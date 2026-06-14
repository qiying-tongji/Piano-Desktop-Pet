/** 音乐意图模块导出入口 */
export { useMusicIntentEngine } from './hooks/useMusicIntentEngine'
export { generatePhrase, getPhraseMemory, resetPhraseMemory, behaviorFromSwipe } from './lib/aiPiano/aiPianoEngine'
export type { PianoPhrase, PhraseBehavior, PhraseMemory } from './lib/aiPiano/types'
export { quantizeToScale, buildScaleNotes } from './lib/scales'
export { getChordNotes } from './lib/chords'
export {
  loadHarmonicSettings,
  saveHarmonicSettings,
  DEFAULT_HARMONIC_SETTINGS,
  resolveLeftHandVoicing,
  getDiatonicMappingPreview,
  KEY_OPTIONS,
  CHORD_HARMONY_MODE_OPTIONS,
} from './lib/chordMapping'
export type { FingerCount, KeyId, ChordHarmonyMode, HarmonicSettings } from './lib/chordMapping'
