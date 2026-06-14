/**
 * 演奏录制 Hook
 */
import { useCallback, useEffect } from 'react'
import { audioEngine } from './AudioEngine'
import { performanceRecorder } from './performanceRecorder'
import { useRecordStore } from '@/stores/recordStore'

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

export function useAudioRecorder(audioReady: boolean) {
  const isRecording = useRecordStore((s) => s.isRecording)
  const isExporting = useRecordStore((s) => s.isExporting)
  const startedAt = useRecordStore((s) => s.startedAt)
  const elapsedMs = useRecordStore((s) => s.elapsedMs)
  const format = useRecordStore((s) => s.format)
  const error = useRecordStore((s) => s.error)
  const setFormat = useRecordStore((s) => s.setFormat)
  const setRecording = useRecordStore((s) => s.setRecording)
  const setExporting = useRecordStore((s) => s.setExporting)
  const setElapsedMs = useRecordStore((s) => s.setElapsedMs)
  const setError = useRecordStore((s) => s.setError)

  useEffect(() => {
    if (!isRecording || startedAt === null) return

    const tick = () => {
      setElapsedMs(Date.now() - startedAt)
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [isRecording, startedAt, setElapsedMs])

  const startRecording = useCallback(async () => {
    if (!audioReady || isRecording || isExporting) return

    setError(null)
    if (!audioEngine.ready) {
      try {
        await audioEngine.init()
      } catch {
        setError('音频引擎未就绪')
        return
      }
    }

    const stream = audioEngine.getRecordStream()
    if (!stream) {
      setError('无法获取录制流')
      return
    }

    try {
      performanceRecorder.start(stream)
      setRecording(true)
    } catch {
      setError('开始录制失败')
    }
  }, [audioReady, isExporting, isRecording, setError, setRecording])

  const stopRecording = useCallback(async () => {
    if (!isRecording || isExporting) return

    setExporting(true)
    setError(null)
    try {
      await performanceRecorder.stopAndExport(format)
    } catch (err) {
      const message = err instanceof Error ? err.message : '导出失败'
      setError(message)
    } finally {
      setRecording(false)
      setExporting(false)
    }
  }, [format, isExporting, isRecording, setError, setExporting, setRecording])

  const toggleRecording = useCallback(() => {
    if (isExporting) return
    if (isRecording) {
      void stopRecording()
    } else {
      void startRecording()
    }
  }, [isExporting, isRecording, startRecording, stopRecording])

  return {
    isRecording,
    isExporting,
    format,
    error,
    elapsedLabel: formatElapsed(elapsedMs),
    setFormat,
    startRecording,
    stopRecording,
    toggleRecording,
    canRecord: audioReady && !isExporting,
  }
}
