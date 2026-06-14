/**
 * 演奏录制 UI 状态
 */
import { create } from 'zustand'
import {
  loadRecordingFormat,
  saveRecordingFormat,
  type RecordingFormat,
} from '@/features/audio/recordingFormats'

interface RecordState {
  isRecording: boolean
  isExporting: boolean
  startedAt: number | null
  elapsedMs: number
  format: RecordingFormat
  error: string | null
  setFormat: (format: RecordingFormat) => void
  setRecording: (recording: boolean, startedAt?: number | null) => void
  setExporting: (exporting: boolean) => void
  setElapsedMs: (ms: number) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useRecordStore = create<RecordState>((set) => ({
  isRecording: false,
  isExporting: false,
  startedAt: null,
  elapsedMs: 0,
  format: loadRecordingFormat(),
  error: null,
  setFormat: (format) => {
    saveRecordingFormat(format)
    set({ format })
  },
  setRecording: (isRecording, startedAt = null) =>
    set({
      isRecording,
      startedAt: isRecording ? (startedAt ?? Date.now()) : null,
      elapsedMs: isRecording ? 0 : 0,
      error: null,
    }),
  setExporting: (isExporting) => set({ isExporting }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      isRecording: false,
      isExporting: false,
      startedAt: null,
      elapsedMs: 0,
      error: null,
    }),
}))
