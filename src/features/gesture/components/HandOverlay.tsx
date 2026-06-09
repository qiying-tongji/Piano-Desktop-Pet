import { useCallback, useEffect, useRef } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useGestureAnalyzer } from '../hooks/useGestureAnalyzer'
import { useMediaPipeHands } from '../hooks/useMediaPipeHands'
import { useMusicIntentEngine } from '@/features/music-intent/hooks/useMusicIntentEngine'
import { drawEnergyField, drawEnergyOverlay, drawHandSkeleton } from '../lib/drawEnergyOverlay'
import {
  drawVisualFx,
  tickVisualFx,
  visualFxManager,
} from '../lib/visualFx/visualFxManager'
import type { HandFrame } from '../types'
import { useGestureStore } from '@/stores/gestureStore'
import { usePerformanceStore } from '@/stores/performanceStore'

export function HandOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const enabled = useGestureStore((s) => s.enabled)
  const status = useGestureStore((s) => s.status)
  const intentActive = enabled && status === 'ready'
  const { videoRef: bindVideoRef, isReady, error: cameraError } = useCamera(enabled)
  const setStatus = useGestureStore((s) => s.setStatus)
  const setError = useGestureStore((s) => s.setError)
  const { analyzeFrame } = useGestureAnalyzer({ enabled })
  const { processSnapshot } = useMusicIntentEngine({ enabled: intentActive })

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoElRef.current = node
      bindVideoRef(node)
    },
    [bindVideoRef],
  )

  useEffect(() => {
    if (!enabled) return
    if (cameraError) {
      setStatus('error')
      setError(cameraError)
      return
    }
    if (isReady) {
      setError(null)
      return
    }
    setStatus('starting-camera')
    setError(null)
  }, [enabled, isReady, cameraError, setError, setStatus])

  const handleFrame = useCallback(
    (frame: HandFrame) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height } = canvas
      if (width === 0 || height === 0) return

      const snapshot = analyzeFrame(frame)
      const events = processSnapshot(snapshot)
      const { visualFxScale } = usePerformanceStore.getState().profile
      const liteCanvas = usePerformanceStore.getState().quality === 'low'

      for (const event of events) {
        const hand = snapshot.hands.find((h) => h.handIndex === event.handIndex)
        if (hand) visualFxManager.onIntent(event, hand, width, height, visualFxScale)
      }

      tickVisualFx()

      ctx.clearRect(0, 0, width, height)
      if (!liteCanvas) drawEnergyField(ctx, width, height)
      drawHandSkeleton(ctx, frame.hands, frame.labels, width, height, true, liteCanvas)
      if (!liteCanvas) drawEnergyOverlay(ctx, snapshot.hands, width, height)
      drawVisualFx(ctx, liteCanvas)
    },
    [analyzeFrame, processSnapshot],
  )

  useMediaPipeHands({
    enabled,
    videoRef: videoElRef,
    videoReady: isReady,
    onFrame: handleFrame,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const resize = () => {
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-0"
        playsInline
        autoPlay
        muted
        aria-hidden
      />
      <canvas ref={canvasRef} className="absolute inset-0 z-[1] h-full w-full bg-transparent" aria-hidden />
    </>
  )
}
