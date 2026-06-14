/**
 * 中央音频引擎（单例）
 *
 * 所有音符播放统一经此服务：Salamander 钢琴采样 + Reverb + Volume。
 * 支持键盘 noteOn/noteOff、手势短语 playPianoPhrase、左手和弦 playGestureChord。
 */
import * as Tone from 'tone'

/** Salamander 钢琴采样 CDN 基址（打包后仍依赖外网） */
const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/'

class AudioEngine {
  private sampler: Tone.Sampler | null = null
  private reverb: Tone.Reverb | null = null
  private volume: Tone.Volume | null = null
  private recordDestination: MediaStreamAudioDestinationNode | null = null
  private initialized = false
  private loading: Promise<void> | null = null
  private heldNotes = new Set<string>()
  private sustainEnabled = false
  /** 每只手（MediaPipe handIndex）独立按住的手势和弦音 */
  private chordPianoNotesByHand = new Map<number, Set<string>>()

  /** 加载 Tone.js、采样器与混响 */
  async init(): Promise<void> {
    if (this.initialized) return
    if (this.loading) return this.loading

    this.loading = (async () => {
      try {
        await Tone.start()

        this.volume = new Tone.Volume(Tone.gainToDb(0.75))
        this.volume.toDestination()

        this.recordDestination = Tone.getContext().createMediaStreamDestination()
        this.volume.connect(this.recordDestination)

        this.reverb = new Tone.Reverb({ decay: 2.8, wet: 0.28 }).connect(this.volume)
        await this.reverb.generate()

        this.sampler = new Tone.Sampler({
          urls: {
            A0: 'A0.mp3',
            C1: 'C1.mp3',
            'D#1': 'Ds1.mp3',
            'F#1': 'Fs1.mp3',
            A1: 'A1.mp3',
            C2: 'C2.mp3',
            'D#2': 'Ds2.mp3',
            'F#2': 'Fs2.mp3',
            A2: 'A2.mp3',
            C3: 'C3.mp3',
            'D#3': 'Ds3.mp3',
            'F#3': 'Fs3.mp3',
            A3: 'A3.mp3',
            C4: 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            A4: 'A4.mp3',
            C5: 'C5.mp3',
          },
          baseUrl: SALAMANDER_BASE,
          release: 1.2,
          attack: 0.001,
        }).connect(this.reverb)

        await Tone.loaded()
        this.initialized = true
      } catch (err) {
        this.loading = null
        this.initialized = false
        throw err
      }
    })()

    return this.loading
  }

  get ready(): boolean {
    return this.initialized
  }

  /** 混音后、音量节点输出的 MediaStream，供录制使用 */
  getRecordStream(): MediaStream | null {
    return this.recordDestination?.stream ?? null
  }

  setVolume(linear: number): void {
    if (!this.volume) return
    this.volume.volume.rampTo(Tone.gainToDb(linear), 0.05)
  }

  setReverbWet(wet: number): void {
    if (!this.reverb) return
    this.reverb.wet.rampTo(wet, 0.08)
  }

  setSustain(enabled: boolean): void {
    this.sustainEnabled = enabled
    if (!enabled && this.sampler) {
      for (const note of this.heldNotes) {
        this.sampler.triggerRelease(note)
      }
      this.heldNotes.clear()
    }
  }

  noteOn(note: string, velocity = 0.85): void {
    if (!this.sampler) return
    void Tone.start()
    const now = Tone.now()
    // 同音连打：先释放再 attack，否则 Sampler 不会再次发声
    if (this.heldNotes.has(note)) {
      this.sampler.triggerRelease(note, now)
      this.heldNotes.delete(note)
    }
    this.sampler.triggerAttack(note, now, velocity)
    this.heldNotes.add(note)
  }

  noteOff(note: string): void {
    if (!this.sampler || this.sustainEnabled) return
    this.sampler.triggerRelease(note)
    this.heldNotes.delete(note)
  }

  releaseAll(): void {
    if (!this.sampler) return
    this.sampler.releaseAll()
    this.heldNotes.clear()
  }

  /** 播放 AI Piano 生成的短语（0.5–1.5 秒，多音符序列） */
  playPianoPhrase(
    notes: { note: string; time: number; velocity: number; duration: string }[],
  ): void {
    if (!this.sampler) return
    void Tone.start()
    const now = Tone.now()
    for (const n of notes) {
      this.sampler.triggerAttackRelease(n.note, n.duration, now + n.time, n.velocity)
    }
  }

  /** 双手张开意图：混响 swell，营造电影感高潮 */
  applyCinematicClimax(amount = 0.35): void {
    if (!this.reverb) return
    const wet = Math.min(0.62, 0.28 + amount)
    this.reverb.wet.rampTo(wet, 0.2)
    this.reverb.wet.rampTo(0.28, 0.35, '+1.4')
  }

  /** 双手收拢意图：降低混响，营造亲密干燥声场 */
  applyIntimateFelt(amount = 0.4): void {
    if (!this.reverb) return
    const wet = Math.max(0.08, 0.28 - amount * 0.18)
    this.reverb.wet.rampTo(wet, 0.25)
    this.reverb.wet.rampTo(0.28, 0.4, '+1.6')
  }

  /** 单手手势和弦：仅更新该 handIndex 的音符，与其他手叠加 */
  setGestureChordForHand(handIndex: number, notes: string[], velocity = 0.72): void {
    if (!this.sampler) return
    void Tone.start()

    const prevNotes = this.chordPianoNotesByHand.get(handIndex) ?? new Set<string>()
    const nextNotes = new Set(notes)
    const now = Tone.now()

    for (const note of prevNotes) {
      if (!nextNotes.has(note) && !this.isNoteHeldByOtherHand(handIndex, note)) {
        this.sampler.triggerRelease(note, now)
        this.heldNotes.delete(note)
      }
    }

    for (const note of nextNotes) {
      if (!prevNotes.has(note) && !this.isNoteHeldByOtherHand(handIndex, note)) {
        this.sampler.triggerAttack(note, now, velocity)
      }
    }

    this.chordPianoNotesByHand.set(handIndex, nextNotes)
  }

  releaseGestureChordForHand(handIndex: number): void {
    if (!this.sampler) return
    const notes = this.chordPianoNotesByHand.get(handIndex)
    if (!notes) return

    const now = Tone.now()
    for (const note of notes) {
      if (!this.isNoteHeldByOtherHand(handIndex, note)) {
        this.sampler.triggerRelease(note, now)
        this.heldNotes.delete(note)
      }
    }
    this.chordPianoNotesByHand.delete(handIndex)
  }

  /** 释放所有手势和弦 */
  releaseGestureChord(): void {
    if (!this.sampler) return
    const now = Tone.now()
    for (const notes of this.chordPianoNotesByHand.values()) {
      for (const note of notes) {
        this.sampler.triggerRelease(note, now)
        this.heldNotes.delete(note)
      }
    }
    this.chordPianoNotesByHand.clear()
  }

  private isNoteHeldByOtherHand(excludeHand: number, note: string): boolean {
    for (const [idx, set] of this.chordPianoNotesByHand) {
      if (idx !== excludeHand && set.has(note)) return true
    }
    return false
  }

  /** @deprecated 请使用 setGestureChordForHand */
  playGestureChord(notes: string[], velocity = 0.72): void {
    this.releaseGestureChord()
    this.setGestureChordForHand(0, notes, velocity)
  }
}

export const audioEngine = new AudioEngine()
