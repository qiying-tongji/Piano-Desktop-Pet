/**
 * 桌宠动画与展开逻辑 Hook
 *
 * 管理 hover/pressed/expanding 阶段；双击后先 resize 窗口，650ms 后切换至 piano 模式。
 */
import { useCallback, useState } from 'react'
import { useAppStore } from '@/stores/appStore'

export type PetAnimPhase = 'idle' | 'hover' | 'pressed' | 'expanding'

/** 展开动画时长（ms），与 Framer Motion 动效对齐 */
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

    // 先 resize 窗口，动画结束后再切换 React 模式
    void window.electronAPI?.setAppWindowMode('piano')

    window.setTimeout(async () => {
      setMode('entertainment')
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
