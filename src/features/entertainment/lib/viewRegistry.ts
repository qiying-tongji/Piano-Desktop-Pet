/**
 * 娱乐视图注册表
 *
 * 万花筒 hub 与各娱乐子视图的元数据；新增小游戏在此登记即可。
 */
import type { ComponentType } from 'react'

export type EntertainmentViewId = 'piano' | 'rhythm-game' | 'melody-memory'

export interface EntertainmentViewMeta {
  id: EntertainmentViewId
  title: string
  subtitle: string
  icon: string
  /** 是否可在 hub 中进入（false 显示「即将推出」） */
  available: boolean
}

/** 万花筒 hub 本身不是业务视图，但用于路由 */
export const KALEIDOSCOPE_HUB_ID = 'kaleidoscope' as const
export type EntertainmentRouteId = EntertainmentViewId | typeof KALEIDOSCOPE_HUB_ID

export const ENTERTAINMENT_VIEW_LIST: EntertainmentViewMeta[] = [
  {
    id: 'piano',
    title: 'MUSIC FIELD',
    subtitle: '空气钢琴 · 手势指挥',
    icon: '🎹',
    available: true,
  },
  {
    id: 'rhythm-game',
    title: '节奏挑战',
    subtitle: '音乐小游戏 · 跟拍演奏',
    icon: '🥁',
    available: true,
  },
  {
    id: 'melody-memory',
    title: '旋律记忆',
    subtitle: '听音复现 · 训练耳感',
    icon: '🎵',
    available: false,
  },
]

export function getEntertainmentViewMeta(id: EntertainmentViewId): EntertainmentViewMeta | undefined {
  return ENTERTAINMENT_VIEW_LIST.find((v) => v.id === id)
}

export type EntertainmentViewComponentProps = {
  onOpenHub: () => void
  onCollapseToPet: () => void
}

export interface EntertainmentViewEntry extends EntertainmentViewMeta {
  View: ComponentType<EntertainmentViewComponentProps>
}
