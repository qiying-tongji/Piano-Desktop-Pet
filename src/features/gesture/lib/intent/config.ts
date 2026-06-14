/**
 * 意图检测阈值与冷却配置
 *
 * 定义滑动手势、双手展开/收拢及和弦锁定的灵敏度与防抖参数。
 */
/** 伸指数稳定保持时长后，和弦才会锁定。 */
export const CHORD_FINGER_STABLE_MS = 140

/** 相邻手指数（如 4↔5）切换时使用更短防抖。 */
export const CHORD_FINGER_ADJACENT_STABLE_MS = 70

/** 水平滑动速度阈值。 */
export const SWIPE_VX_THRESHOLD = 0.5

/** 垂直滑动速度阈值。 */
export const SWIPE_VY_THRESHOLD = 0.5

/** 滑动必须在某一轴上占主导。 */
export const SWIPE_AXIS_RATIO = 1.15

export const SWIPE_COOLDOWN_MS = 480

/** 双手展开/收拢检测。 */
export const DUAL_HAND_MIN_DISTANCE = 0.22
export const DUAL_EXPAND_DISTANCE_DELTA = 0.035
export const DUAL_COMPRESS_DISTANCE_DELTA = -0.03
export const DUAL_EXPAND_OPEN_THRESHOLD = 0.68
export const DUAL_COMPRESS_OPEN_THRESHOLD = 0.38
export const EXPAND_COOLDOWN_MS = 900
export const COMPRESS_COOLDOWN_MS = 900
