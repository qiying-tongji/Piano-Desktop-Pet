/** 娱乐方式切换模块 */
export { KaleidoscopeHub } from './components/KaleidoscopeHub'
export { useEntertainmentWindowMode } from './hooks/useEntertainmentWindowMode'
export { RhythmGameView } from './views/RhythmGameView'
export {
  ENTERTAINMENT_VIEW_LIST,
  KALEIDOSCOPE_HUB_ID,
  getEntertainmentViewMeta,
} from './lib/viewRegistry'
export type {
  EntertainmentViewId,
  EntertainmentRouteId,
  EntertainmentViewMeta,
  EntertainmentViewComponentProps,
} from './lib/viewRegistry'
