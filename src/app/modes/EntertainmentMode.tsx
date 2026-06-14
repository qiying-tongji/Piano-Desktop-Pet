/**
 * 娱乐模式壳层：路由到钢琴 / 小游戏 / 万花筒 hub
 */
import { KaleidoscopeHub } from '@/features/entertainment/components/KaleidoscopeHub'
import { useEntertainmentWindowMode } from '@/features/entertainment/hooks/useEntertainmentWindowMode'
import { RhythmGameView } from '@/features/entertainment/views/RhythmGameView'
import { KALEIDOSCOPE_HUB_ID } from '@/features/entertainment/lib/viewRegistry'
import { PianoMode } from '@/app/modes/PianoMode'
import { useAppStore } from '@/stores/appStore'
import { useEntertainmentStore } from '@/stores/entertainmentStore'
import { useCallback } from 'react'

export function EntertainmentMode() {
  useEntertainmentWindowMode()
  const route = useEntertainmentStore((s) => s.route)
  const openHub = useEntertainmentStore((s) => s.openHub)
  const setMode = useAppStore((s) => s.setMode)

  const onOpenHub = useCallback(() => openHub(), [openHub])

  const onCollapseToPet = useCallback(async () => {
    setMode('pet')
    await window.electronAPI?.setAppWindowMode('pet')
  }, [setMode])

  if (route === KALEIDOSCOPE_HUB_ID) {
    return <KaleidoscopeHub />
  }

  if (route === 'rhythm-game') {
    return <RhythmGameView onOpenHub={onOpenHub} onCollapseToPet={onCollapseToPet} />
  }

  return <PianoMode onOpenHub={onOpenHub} onCollapseToPet={onCollapseToPet} />
}
