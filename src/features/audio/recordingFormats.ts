/** 可导出的录制格式 */
export type RecordingFormat = 'webm' | 'wav'

export const RECORDING_FORMAT_OPTIONS: {
  id: RecordingFormat
  label: string
  ext: string
  hint: string
}[] = [
  { id: 'webm', label: 'WebM', ext: 'webm', hint: '体积小，Chrome / Electron 原生支持' },
  { id: 'wav', label: 'WAV', ext: 'wav', hint: '无损 PCM，通用播放器兼容' },
]

const STORAGE_KEY = 'piano-record-format'

export function loadRecordingFormat(): RecordingFormat {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'webm' || raw === 'wav') return raw
  } catch {
    /* ignore */
  }
  return 'webm'
}

export function saveRecordingFormat(format: RecordingFormat): void {
  try {
    localStorage.setItem(STORAGE_KEY, format)
  } catch {
    /* ignore */
  }
}

export function pickMediaRecorderMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'audio/webm'
}

export function formatRecordingTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
