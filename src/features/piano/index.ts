/** 钢琴功能模块导出入口 */
export { PianoKeyboard } from './components/PianoKeyboard'
export { MusicFieldParticles } from './components/MusicFieldParticles'
export { PerformanceQualitySelect } from './components/PerformanceQualitySelect'
export { ChordMappingPanel } from './components/ChordMappingPanel'
export { OctaveNavigator } from './components/OctaveNavigator'
export { KeyboardViewportBar } from './components/KeyboardViewportBar'
export { usePianoPlay } from './hooks/usePianoPlay'
export { useKeyboardInput } from './hooks/useKeyboardInput'
export { useHeldChordOctaveSync } from './hooks/useHeldChordOctaveSync'
export {
  buildPianoKeys,
  buildKeyboardMap,
  buildKeyboardMapForScroll,
  buildKeyLabelsForScroll,
  getVisiblePianoKeysForScroll,
  buildFullPianoKeys,
  PIANO_KEYS,
} from './constants/keys'
