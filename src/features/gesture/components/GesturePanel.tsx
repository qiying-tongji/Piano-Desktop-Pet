/**
 * 手势意图叠加层与开关
 *
 * 组合手部追踪 overlay、HUD 状态栏、指挥提示及手势功能开关按钮。
 */
import { HandOverlay } from './HandOverlay'
import { ConductGuideCard } from './ConductGuideCard'
import { INTENT_LABELS } from '../lib/intent/types'
import { useGestureStore } from '@/stores/gestureStore'
import { useMusicIntentStore } from '@/stores/musicIntentStore'
import { usePerformanceStore } from '@/stores/performanceStore'
import { getPhraseMemory } from '@/features/music-intent/lib/aiPiano/aiPianoEngine'
import { getLeftHandChordLabel } from '@/features/music-intent/lib/leftHandChords'
import { handRoleLabel, normalizeHandSide } from '../lib/intent/handRole'

const STATUS_LABEL: Record<string, string> = {
  idle: '未启动',
  'loading-model': '加载模型…',
  'starting-camera': '启动摄像头…',
  ready: '追踪中',
  error: '出错',
}

export function GestureIntentOverlay() {
  const enabled = useGestureStore((s) => s.enabled)
  const status = useGestureStore((s) => s.status)
  const error = useGestureStore((s) => s.error)
  const handCount = useGestureStore((s) => s.handCount)
  const fps = useGestureStore((s) => s.fps)
  const snapshot = useGestureStore((s) => s.analyzerSnapshot)
  const musicState = useMusicIntentStore((s) => s.musicState)
  const harmonicSettings = useMusicIntentStore((s) => s.harmonicSettings)
  const recentIntents = useMusicIntentStore((s) => s.recentIntents)
  const quality = usePerformanceStore((s) => s.quality)

  if (!enabled) return null

  const isLoading = status === 'starting-camera' || status === 'loading-model'
  const phraseMemory = getPhraseMemory()

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
      <HandOverlay />
      <ConductGuideCard />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <p className="text-[11px] text-white/70">{STATUS_LABEL[status] ?? status}</p>
        </div>
      )}

      <div className="absolute left-2 top-2 flex max-w-[min(90%,320px)] flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-black/50 px-2 py-1 text-[9px]">
          <span className="text-pet-accent/90">意图</span>
          <span className="text-white/50">{STATUS_LABEL[status] ?? status}</span>
          {status === 'ready' && (
            <>
              <span className="text-white/25">·</span>
              <span className="text-white/55">{handCount} 手</span>
              <span className="text-white/25">·</span>
              <span className="text-white/55">{fps} FPS</span>
            </>
          )}
        </div>

        {status === 'ready' && (
          <div className="rounded-md bg-black/45 px-2 py-1 text-[8px] text-white/50">
            {harmonicSettings.keyId} · {musicState.chord} · E{musicState.energy.toFixed(1)}
            {Object.values(musicState.handChordHolds).map((hold) => (
              <span key={hold.handIndex}>
                {' · '}
                {hold.side === 'left' ? '左' : '右'}
                {getLeftHandChordLabel(
                  hold.fingerCount,
                  harmonicSettings.keyId,
                  harmonicSettings.harmonyMode,
                )}
              </span>
            ))}
            {musicState.isHolding ? ' · chord' : ''}
            {musicState.pianoMood !== 'neutral' ? ` · ${musicState.pianoMood}` : ''}
            {phraseMemory.previousNote ? ` · ♪${phraseMemory.previousNote}` : ''}
          </div>
        )}

        {recentIntents[0] && (
          <div className="rounded-md bg-pet-glow/15 px-2 py-1 text-[9px] text-pet-accent">
            {INTENT_LABELS[recentIntents[0].type]}
            {recentIntents[0].direction ? ` ${recentIntents[0].direction}` : ''}
            {recentIntents[0].fingerCount
              ? ` · ${getLeftHandChordLabel(recentIntents[0].fingerCount, harmonicSettings.keyId, harmonicSettings.harmonyMode)}`
              : ''}
          </div>
        )}

        {status === 'ready' && quality === 'high' && snapshot && snapshot.hands.length > 0 && (
          <div className="rounded-md bg-black/40 px-2 py-1 font-mono text-[8px] leading-relaxed text-white/45">
            {snapshot.hands.map((h) => (
              <div key={h.handIndex}>
                {handRoleLabel(normalizeHandSide(h.label))} ({h.label}): |v|=
                {h.velocity.magnitude.toFixed(1)} f={h.extendedFingerCount}
                {h.isStable ? ' stable' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="absolute bottom-2 left-2 right-2 truncate text-center text-[10px] text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

export function GestureToggle() {
  const enabled = useGestureStore((s) => s.enabled)
  const setEnabled = useGestureStore((s) => s.setEnabled)
  const reset = useGestureStore((s) => s.reset)

  return (
    <button
      type="button"
      title={enabled ? '关闭手势意图' : '开启手势意图'}
      onClick={() => {
        const next = !enabled
        setEnabled(next)
        if (!next) reset()
      }}
      className={[
        'shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition',
        enabled
          ? 'border-pet-glow/60 bg-pet-glow/25 text-white shadow-[0_0_12px_rgba(167,139,250,0.35)]'
          : 'border-white/20 bg-white/10 text-white/90 hover:border-pet-glow/45 hover:bg-white/15',
      ].join(' ')}
    >
      手势 {enabled ? 'ON' : 'OFF'}
    </button>
  )
}

/** @deprecated 请使用 GestureIntentOverlay */
export const GestureKeyboardOverlay = GestureIntentOverlay
