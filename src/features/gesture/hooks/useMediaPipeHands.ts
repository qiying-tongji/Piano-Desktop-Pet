/**
 * MediaPipe 手部检测 Hook
 *
 * 在视频流上循环运行 HandLandmarker，输出帧数据并更新 FPS/手数指标。
 */
import { useEffect, useRef } from 'react'
import { disposeHandLandmarker, getHandLandmarker, toHandFrame } from '../lib/handLandmarker'
import type { HandFrame } from '../types'
import { useGestureStore } from '@/stores/gestureStore'
import { usePerformanceStore } from '@/stores/performanceStore'

interface UseMediaPipeHandsOptions {
  enabled: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  videoReady: boolean
  onFrame?: (frame: HandFrame) => void
}

export function useMediaPipeHands({
  enabled,
  videoRef,
  videoReady,
  onFrame,
}: UseMediaPipeHandsOptions): void {
  const setStatus = useGestureStore((s) => s.setStatus)
  const setError = useGestureStore((s) => s.setError)
  const setMetrics = useGestureStore((s) => s.setMetrics)
  const rafRef = useRef<number>(0)
  const lastVideoTimeRef = useRef(-1)
  const lastDetectAtRef = useRef(0)
  const fpsFramesRef = useRef(0)
  const fpsLastTickRef = useRef(performance.now())
  const lastHandCountRef = useRef(-1)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  useEffect(() => {
    if (!enabled || !videoReady) return

    let disposed = false
    let landmarker: Awaited<ReturnType<typeof getHandLandmarker>> | null = null

    const detect = () => {
      if (disposed || !landmarker) return
      const video = videoRef.current
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        rafRef.current = requestAnimationFrame(detect)
        return
      }

      const now = performance.now()
      const { detectIntervalMs } = usePerformanceStore.getState().profile
      const newVideoFrame = video.currentTime !== lastVideoTimeRef.current
      const detectDue = now - lastDetectAtRef.current >= detectIntervalMs

      if (newVideoFrame && detectDue) {
        lastVideoTimeRef.current = video.currentTime
        lastDetectAtRef.current = now

        const result = landmarker.detectForVideo(video, now)
        const frame = toHandFrame(result, now)
        onFrameRef.current?.(frame)

        fpsFramesRef.current += 1
        const handCount = frame.hands.length
        let fps = useGestureStore.getState().fps
        let fpsUpdated = false
        if (now - fpsLastTickRef.current >= 1000) {
          fps = fpsFramesRef.current
          fpsFramesRef.current = 0
          fpsLastTickRef.current = now
          fpsUpdated = true
        }

        if (handCount !== lastHandCountRef.current || fpsUpdated) {
          lastHandCountRef.current = handCount
          setMetrics(handCount, fps, frame)
        }
      }

      rafRef.current = requestAnimationFrame(detect)
    }

    setStatus('loading-model')
    setError(null)
    void getHandLandmarker()
      .then((instance) => {
        if (disposed) return
        landmarker = instance
        setStatus('ready')
        setError(null)
        rafRef.current = requestAnimationFrame(detect)
      })
      .catch((err: unknown) => {
        if (disposed) return
        const message = err instanceof Error ? err.message : 'MediaPipe 初始化失败'
        setStatus('error')
        setError(message)
      })

    return () => {
      disposed = true
      cancelAnimationFrame(rafRef.current)
      lastVideoTimeRef.current = -1
      lastDetectAtRef.current = 0
      fpsFramesRef.current = 0
      lastHandCountRef.current = -1
    }
  }, [enabled, videoReady, videoRef, setError, setMetrics, setStatus])
}

export { disposeHandLandmarker }
