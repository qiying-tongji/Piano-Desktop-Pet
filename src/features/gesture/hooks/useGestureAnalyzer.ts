import { useCallback, useEffect, useRef } from 'react'
import { GestureAnalyzer } from '../lib/analyzer/extractHandFeatures'
import type { AnalyzerSnapshot } from '../lib/analyzer/types'
import type { HandFrame } from '../types'
import { useGestureStore } from '@/stores/gestureStore'
import { usePerformanceStore } from '@/stores/performanceStore'

interface UseGestureAnalyzerOptions {
  enabled: boolean
}

export function useGestureAnalyzer({ enabled }: UseGestureAnalyzerOptions) {
  const analyzerRef = useRef(new GestureAnalyzer())
  const setAnalyzerSnapshot = useGestureStore((s) => s.setAnalyzerSnapshot)
  const lastHudUpdateRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      analyzerRef.current.reset()
      setAnalyzerSnapshot(null)
      lastHudUpdateRef.current = 0
    }
  }, [enabled, setAnalyzerSnapshot])

  const analyzeFrame = useCallback((frame: HandFrame): AnalyzerSnapshot => {
    const hands = analyzerRef.current.analyze(frame.hands, frame.labels, frame.timestamp)
    const snapshot: AnalyzerSnapshot = { hands, timestamp: frame.timestamp }

    const now = performance.now()
    const { hudUpdateMs } = usePerformanceStore.getState().profile
    if (now - lastHudUpdateRef.current >= hudUpdateMs) {
      lastHudUpdateRef.current = now
      setAnalyzerSnapshot(snapshot)
    }

    return snapshot
  }, [setAnalyzerSnapshot])

  return { analyzeFrame }
}
