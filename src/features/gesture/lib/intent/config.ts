/** Finger count must hold steady before chord latches. */
export const CHORD_FINGER_STABLE_MS = 180

/** Horizontal velocity for swipe. */
export const SWIPE_VX_THRESHOLD = 0.5

/** Vertical velocity for swipe up/down. */
export const SWIPE_VY_THRESHOLD = 0.5

/** Swipe must dominate the other axis. */
export const SWIPE_AXIS_RATIO = 1.15

export const SWIPE_COOLDOWN_MS = 480

/** Dual-hand expand / compress. */
export const DUAL_HAND_MIN_DISTANCE = 0.22
export const DUAL_EXPAND_DISTANCE_DELTA = 0.035
export const DUAL_COMPRESS_DISTANCE_DELTA = -0.03
export const DUAL_EXPAND_OPEN_THRESHOLD = 0.68
export const DUAL_COMPRESS_OPEN_THRESHOLD = 0.38
export const EXPAND_COOLDOWN_MS = 900
export const COMPRESS_COOLDOWN_MS = 900
