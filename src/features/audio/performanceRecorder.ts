/**
 * 演奏录制：从 AudioEngine 混音总线采集 MediaStream
 */
import { encodedAudioBlobToWav } from './wavEncode'
import {
  downloadBlob,
  formatRecordingTimestamp,
  pickMediaRecorderMimeType,
  type RecordingFormat,
} from './recordingFormats'

class PerformanceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private mimeType = 'audio/webm'

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  start(stream: MediaStream): void {
    if (this.isRecording) return

    this.mimeType = pickMediaRecorderMimeType()
    this.chunks = []
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.mimeType,
      audioBitsPerSecond: 192_000,
    })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data)
    }

    this.mediaRecorder.start(250)
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const recorder = this.mediaRecorder
      if (!recorder || recorder.state === 'inactive') {
        resolve(new Blob())
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType })
        this.mediaRecorder = null
        this.chunks = []
        resolve(blob)
      }

      recorder.onerror = () => {
        reject(new Error('录制失败'))
      }

      recorder.stop()
    })
  }

  async stopAndExport(format: RecordingFormat): Promise<void> {
    const captured = await this.stop()
    if (captured.size === 0) {
      throw new Error('没有录到音频')
    }

    const timestamp = formatRecordingTimestamp()
    if (format === 'wav') {
      const wavBlob = await encodedAudioBlobToWav(captured)
      downloadBlob(wavBlob, `music-field-${timestamp}.wav`)
      return
    }

    const ext = this.mimeType.includes('ogg') ? 'ogg' : 'webm'
    downloadBlob(captured, `music-field-${timestamp}.${ext}`)
  }
}

export const performanceRecorder = new PerformanceRecorder()
