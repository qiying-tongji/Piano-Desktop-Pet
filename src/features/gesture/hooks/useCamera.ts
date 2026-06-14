/**
 * 摄像头访问 Hook
 *
 * 请求用户媒体流并绑定到 video 元素，含常见权限/占用错误的本地化提示。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePerformanceStore } from '@/stores/performanceStore'

interface UseCameraResult {
  videoRef: (node: HTMLVideoElement | null) => void
  error: string | null
  isReady: boolean
}

function formatCameraError(err: unknown): string {
  if (!(err instanceof Error)) return '无法访问摄像头'
  const name = err.name
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return '摄像头被拒绝：请在 Windows「设置 → 隐私 → 相机」中允许桌面应用'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return '未检测到摄像头设备'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return '摄像头被其他程序占用'
  }
  if (name === 'OverconstrainedError') {
    return '摄像头不支持请求的分辨率'
  }
  return err.message || '无法访问摄像头'
}

export function useCamera(enabled: boolean): UseCameraResult {
  const profile = usePerformanceStore((s) => s.profile)
  const streamRef = useRef<MediaStream | null>(null)
  const videoNodeRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const attachStream = useCallback(async (video: HTMLVideoElement, stream: MediaStream) => {
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    await video.play()
    setIsReady(true)
    setError(null)
  }, [])

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoNodeRef.current = node
      if (!node || !enabled) return

      const stream = streamRef.current
      if (!stream) return

      void attachStream(node, stream).catch((err: unknown) => {
        setIsReady(false)
        setError(formatCameraError(err))
      })
    },
    [attachStream, enabled],
  )

  useEffect(() => {
    if (!enabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoNodeRef.current) videoNodeRef.current.srcObject = null
      setIsReady(false)
      setError(null)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('当前环境不支持摄像头（需要 HTTPS 或 Electron）')
      setIsReady(false)
      return
    }

    let cancelled = false

    void navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: profile.camera.width },
          height: { ideal: profile.camera.height },
          facingMode: 'user',
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoNodeRef.current
        if (video) {
          return attachStream(video, stream)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setIsReady(false)
        setError(formatCameraError(err))
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoNodeRef.current) videoNodeRef.current.srcObject = null
    }
  }, [attachStream, enabled, profile.camera.height, profile.camera.width])

  return {
    videoRef,
    error,
    isReady,
  }
}
