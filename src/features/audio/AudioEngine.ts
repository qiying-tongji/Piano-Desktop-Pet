import * as Tone from 'tone'

const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/'

/**
 * Central audio service — all note playback goes through here.
 * Architecture allows future MIDI / drum machine extensions.
 */
class AudioEngine {
  private sampler: Tone.Sampler | null = null
  private reverb: Tone.Reverb | null = null
  private volume: Tone.Volume | null = null
  private initialized = false
  private loading: Promise<void> | null = null
  private heldNotes = new Set<string>()
  private sustainEnabled = false
  private gestureLead: Tone.PolySynth | null = null
  private gesturePad: Tone.PolySynth | null = null
  private gestureBus: Tone.Filter | null = null
  private padNotes = new Set<string>()
  private chordPianoNotes = new Set<string>()
  private gestureSequence: Tone.Sequence | null = null

  async init(): Promise<void> {
    if (this.initialized) return
    if (this.loading) return this.loading

    this.loading = (async () => {
      try {
        await Tone.start()

        this.volume = new Tone.Volume(Tone.gainToDb(0.75)).toDestination()
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

        this.gestureLead = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle8' },
          envelope: { attack: 0.02, decay: 0.3, sustain: 0.15, release: 0.8 },
        })

        this.gesturePad = new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 2.5,
          envelope: { attack: 0.8, decay: 0.4, sustain: 0.85, release: 1.8 },
        })
        this.gesturePad.volume.value = -10

        this.gestureBus = new Tone.Filter({
          type: 'lowpass',
          frequency: 4200,
          rolloff: -12,
        })
        this.gestureLead.connect(this.gestureBus)
        this.gesturePad.connect(this.gestureBus)
        this.gestureBus.connect(this.reverb!)

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
    this.sampler.triggerAttack(note, Tone.now(), velocity)
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

  /** Play a generated piano phrase (0.5–1.5s). */
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

  /** Cinematic climax — wider space, stronger pedal. */
  applyCinematicClimax(amount = 0.35): void {
    if (!this.reverb) return
    const wet = Math.min(0.62, 0.28 + amount)
    this.reverb.wet.rampTo(wet, 0.2)
    this.reverb.wet.rampTo(0.28, 0.35, '+1.4')
  }

  /** Intimate felt piano — drier, closer. */
  applyIntimateFelt(amount = 0.4): void {
    if (!this.reverb) return
    const wet = Math.max(0.08, 0.28 - amount * 0.18)
    this.reverb.wet.rampTo(wet, 0.25)
    this.reverb.wet.rampTo(0.28, 0.4, '+1.6')
  }

  /** Gesture intent — short melodic note on piano sampler. */
  playGestureLead(note: string, velocity = 0.7, duration: string = '8n'): void {
    if (!this.sampler) return
    void Tone.start()
    this.sampler.triggerAttackRelease(note, duration, Tone.now(), velocity)
  }

  /** Left-hand chord — piano sampler (matches lit keys). */
  playGestureChord(notes: string[], velocity = 0.72): void {
    if (!this.sampler) return
    void Tone.start()
    this.releaseGestureChord()
    const now = Tone.now()
    for (const note of notes) {
      this.sampler.triggerAttack(note, now, velocity)
      this.chordPianoNotes.add(note)
    }
  }

  releaseGestureChord(): void {
    if (!this.sampler) return
    const now = Tone.now()
    for (const note of this.chordPianoNotes) {
      this.sampler.triggerRelease(note, now)
      this.heldNotes.delete(note)
    }
    this.chordPianoNotes.clear()
  }

  /** Gesture intent — sustained ambient pad chord. */
  playGesturePad(notes: string[], velocity = 0.4): void {
    if (!this.gesturePad) return
    this.releaseGesturePad()
    const now = Tone.now()
    for (const note of notes) {
      this.gesturePad.triggerAttack(note, now, velocity)
      this.padNotes.add(note)
    }
  }

  releaseGesturePad(): void {
    if (!this.gesturePad) return
    const now = Tone.now()
    for (const note of this.padNotes) {
      this.gesturePad.triggerRelease(note, now)
    }
    this.padNotes.clear()
  }

  /** Gesture intent — staggered piano arpeggio. */
  playGestureArpeggio(notes: string[], velocity = 0.5, gapSec = 0.09): void {
    if (!this.sampler) return
    void Tone.start()
    const now = Tone.now()
    notes.forEach((note, i) => {
      this.sampler!.triggerAttackRelease(
        note,
        '16n',
        now + i * gapSec,
        velocity * (1 - i * 0.06),
      )
    })
  }

  releaseGestureAudio(): void {
    this.stopGestureLoop()
    this.releaseGesturePad()
    this.releaseGestureChord()
  }

  /** Start looping arpeggiator on piano sampler. */
  startGestureLoop(notes: string[], velocity = 0.42, intervalSec = 0.28): void {
    if (!this.sampler || notes.length === 0) return
    void Tone.start()
    this.stopGestureLoop()

    this.gestureSequence = new Tone.Sequence(
      (time, note) => {
        if (typeof note === 'string') {
          this.sampler?.triggerAttackRelease(note, '16n', time, velocity)
        }
      },
      notes,
      intervalSec,
    )
    this.gestureSequence.loop = true
    this.gestureSequence.start(0)
  }

  stopGestureLoop(): void {
    if (this.gestureSequence) {
      this.gestureSequence.stop()
      this.gestureSequence.dispose()
      this.gestureSequence = null
    }
  }

  isGestureLoopActive(): boolean {
    return this.gestureSequence !== null
  }

  /** Energy is reflected in HUD/particles; piano timbre stays consistent. */
  setGestureEnergy(_energy: number): void {
    // no-op — melody uses the same sampler as keyboard
  }

  /** Brief reverb swell on expand. */
  pulseGestureSpace(amount: number): void {
    if (!this.reverb) return
    const wet = Math.min(0.55, 0.28 + amount)
    this.reverb.wet.rampTo(wet, 0.15)
    this.reverb.wet.rampTo(0.28, 0.15, '+0.8')
  }
}

export const audioEngine = new AudioEngine()
