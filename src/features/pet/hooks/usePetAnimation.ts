import { useCallback, useState } from 'react'
import { useAppStore } from '@/stores/appStore'

export type PetAnimPhase = 'idle' | 'hover' | 'pressed' | 'expanding'

const EXPAND_DURATION_MS = 650

export function usePetAnimation() {
  const setMode = useAppStore((s) => s.setMode)
  const setHovered = useAppStore((s) => s.setHovered)
  const setPetPhase = useAppStore((s) => s.setPetPhase)
  const petPhase = useAppStore((s) => s.petPhase)
  const [isExpanding, setIsExpanding] = useState(false)

  const onHoverStart = useCallback(() => {
    if (isExpanding) return
    setHovered(true)
    setPetPhase('hover')
  }, [isExpanding, setHovered, setPetPhase])

  const onHoverEnd = useCallback(() => {
    if (isExpanding) return
    setHovered(false)
    setPetPhase('idle')
  }, [isExpanding, setHovered, setPetPhase])

  const onPressStart = useCallback(() => {
    if (isExpanding) return
    setPetPhase('pressed')
  }, [isExpanding, setPetPhase])

  const onPressEnd = useCallback(() => {
    if (isExpanding) return
    setPetPhase('hover')
  }, [isExpanding, setPetPhase])

  const onClick = useCallback(() => {
    if (isExpanding) return
    setIsExpanding(true)
    setPetPhase('expanding')

    // Resize window first — UI mode switches after the expand animation.
    void window.electronAPI?.setAppWindowMode('piano')

    window.setTimeout(async () => {
      setMode('piano')
      await window.electronAPI?.setAppWindowMode('piano')
      setIsExpanding(false)
      setPetPhase('idle')
      setHovered(false)
    }, EXPAND_DURATION_MS)
  }, [isExpanding, setHovered, setMode, setPetPhase])

  return {
    petPhase,
    isExpanding,
    isHovered: petPhase === 'hover' || petPhase === 'pressed',
    isActive: petPhase !== 'idle',
    onHoverStart,
    onHoverEnd,
    onPressStart,
    onPressEnd,
    onClick,
  }
}
