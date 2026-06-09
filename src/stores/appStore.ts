import { create } from 'zustand'

export type AppMode = 'pet' | 'piano'
export type PetPhase = 'idle' | 'hover' | 'pressed' | 'expanding'

export interface AppState {
  mode: AppMode
  isHovered: boolean
  petPhase: PetPhase
  version: string | null
  windowError: string | null
  setMode: (mode: AppMode) => void
  setHovered: (hovered: boolean) => void
  setPetPhase: (phase: PetPhase) => void
  setVersion: (version: string) => void
  setWindowError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'pet',
  isHovered: false,
  petPhase: 'idle',
  version: null,
  windowError: null,
  setMode: (mode) => set({ mode }),
  setHovered: (isHovered) => set({ isHovered }),
  setPetPhase: (petPhase) => set({ petPhase }),
  setVersion: (version) => set({ version }),
  setWindowError: (windowError) => set({ windowError }),
}))
