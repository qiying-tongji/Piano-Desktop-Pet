/**
 * 娱乐视图路由状态
 */
import { create } from 'zustand'
import type { EntertainmentRouteId, EntertainmentViewId } from '@/features/entertainment/lib/viewRegistry'
import { KALEIDOSCOPE_HUB_ID } from '@/features/entertainment/lib/viewRegistry'

const STORAGE_KEY = 'piano-entertainment-view'
const DEFAULT_VIEW: EntertainmentViewId = 'piano'

function loadActiveView(): EntertainmentViewId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'piano' || raw === 'rhythm-game' || raw === 'melody-memory') {
      return raw
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_VIEW
}

function saveActiveView(view: EntertainmentViewId): void {
  try {
    localStorage.setItem(STORAGE_KEY, view)
  } catch {
    /* ignore */
  }
}

interface EntertainmentState {
  /** 当前路由：具体视图或万花筒 hub */
  route: EntertainmentRouteId
  lastView: EntertainmentViewId
  openHub: () => void
  selectView: (view: EntertainmentViewId) => void
  restoreLastView: () => void
}

export const useEntertainmentStore = create<EntertainmentState>((set, get) => ({
  route: loadActiveView(),
  lastView: loadActiveView(),
  openHub: () => {
    const { route } = get()
    const lastView = route === KALEIDOSCOPE_HUB_ID ? get().lastView : (route as EntertainmentViewId)
    set({ route: KALEIDOSCOPE_HUB_ID, lastView })
  },
  selectView: (view) => {
    saveActiveView(view)
    set({ route: view, lastView: view })
  },
  restoreLastView: () => {
    const view = get().lastView
    saveActiveView(view)
    set({ route: view })
  },
}))
