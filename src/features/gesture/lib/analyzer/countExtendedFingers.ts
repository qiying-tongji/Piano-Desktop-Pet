/**
 * 伸指计数（兼容导出）
 *
 * 实际逻辑见 fingerAnalysis.ts + fingerCountSmoother.ts。
 */
export {
  computeFingerStates,
  countExtendedFingers,
  countFromFingerStates,
  fingerStatesToArray,
  type FingerStates,
  type FingerName,
} from './fingerAnalysis'
export { FingerCountSmoother } from './fingerCountSmoother'
