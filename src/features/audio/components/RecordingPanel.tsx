/**
 * 演奏录制控制面板
 */
import { RECORDING_FORMAT_OPTIONS } from '@/features/audio/recordingFormats'
import { useAudioRecorder } from '@/features/audio/useAudioRecorder'
import type { RecordingFormat } from '@/features/audio/recordingFormats'

interface RecordingPanelProps {
  audioReady: boolean
}

export function RecordingPanel({ audioReady }: RecordingPanelProps) {
  const {
    isRecording,
    isExporting,
    format,
    error,
    elapsedLabel,
    setFormat,
    toggleRecording,
    canRecord,
  } = useAudioRecorder(audioReady)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!canRecord && !isRecording}
        onClick={() => toggleRecording()}
        className={[
          'rounded-md border px-2.5 py-1 transition',
          isRecording
            ? 'border-red-400/60 bg-red-500/20 text-red-200'
            : 'border-white/15 bg-white/10 text-white/70 hover:text-white',
          !canRecord && !isRecording ? 'cursor-not-allowed opacity-50' : '',
        ].join(' ')}
        title={isRecording ? '停止并保存录音' : '开始录制混音输出（键盘 + 手势）'}
      >
        {isExporting ? '导出中…' : isRecording ? `● 停止 ${elapsedLabel}` : '录制'}
      </button>

      {!isRecording && (
        <label className="flex items-center gap-1 text-[10px] text-white/50">
          <span>格式</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as RecordingFormat)}
            disabled={isExporting}
            className="rounded border border-white/10 bg-black/50 px-1.5 py-0.5 text-[11px] text-white/85"
          >
            {RECORDING_FORMAT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id} title={o.hint}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {isRecording && (
        <span className="text-[10px] text-red-300/80">REC · 混音总线</span>
      )}

      {error && <span className="text-[10px] text-red-300">{error}</span>}
    </div>
  )
}
