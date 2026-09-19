import type { PhaseKind } from '@/features/breathing/patterns'

/**
 * Calm, synthesized sound for the breathing exercise. Everything is generated with Web Audio: no
 * files to download, nothing to license, and it works offline.
 *
 * - Ocean: filtered brown noise that swells on the inhale and recedes on the exhale, so the sound
 *   itself paces the breath.
 * - Pad: a slow cycle of soft major-seventh chords with a long attack and release.
 * - Chime: a quiet bell at the start of each inhale and exhale, for following with eyes closed.
 *
 * Browsers (iOS Safari in particular) only allow audio to start inside a tap, so `start()` must be
 * called from a click handler.
 */

const MASTER_LEVEL = 0.7
const OCEAN_LOW = 0.05
const OCEAN_HIGH = 0.28
const CHORD_SECONDS = 9
const VOICE_LEVEL = 0.022

/** MIDI note numbers. D major: Dmaj7, Bm7, Gmaj7, Asus2. */
const CHORDS = [
  [50, 57, 61, 66],
  [47, 54, 57, 62],
  [43, 50, 54, 59],
  [45, 52, 59, 64],
]

/** Seconds of noise crossfaded across the loop point. */
const LOOP_BLEND = 0.5

const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12)

class CalmAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private oceanGain: GainNode | null = null
  private oceanFilter: BiquadFilterNode | null = null
  private padBus: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private chordTimer: ReturnType<typeof setTimeout> | null = null
  private chordIndex = 0
  private closing: ReturnType<typeof setTimeout> | null = null

  get playing(): boolean {
    return this.ctx !== null && this.closing === null
  }

  /** Call from a tap or click. Safe to call when already playing. */
  start() {
    if (this.closing) {
      clearTimeout(this.closing)
      this.closing = null
      this.fadeMasterTo(MASTER_LEVEL, 1.5)
      if (!this.chordTimer) this.playChord()
      return
    }
    if (this.ctx) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    this.ctx = ctx
    void ctx.resume()

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    this.master = master

    const reverb = ctx.createConvolver()
    reverb.buffer = impulse(ctx, 3.5)
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    reverb.connect(wet).connect(master)
    this.reverb = reverb

    // Ocean
    const noise = ctx.createBufferSource()
    noise.buffer = brownNoise(ctx, 8)
    noise.loop = true
    // The last LOOP_BLEND seconds are already crossfaded into the start (see brownNoise).
    noise.loopStart = 0
    noise.loopEnd = noise.buffer.duration - LOOP_BLEND
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    filter.Q.value = 0.4
    const oceanGain = ctx.createGain()
    oceanGain.gain.value = OCEAN_LOW
    noise.connect(filter).connect(oceanGain).connect(master)
    noise.start()
    this.oceanFilter = filter
    this.oceanGain = oceanGain

    // Pad
    const padFilter = ctx.createBiquadFilter()
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 1300
    const padBus = ctx.createGain()
    padBus.gain.value = 1
    padBus.connect(padFilter)
    padFilter.connect(master)
    padFilter.connect(reverb)
    this.padBus = padBus

    this.fadeMasterTo(MASTER_LEVEL, 2.5)
    this.chordIndex = 0
    this.playChord()
  }

  /** Fades out, then releases the audio hardware. */
  stop() {
    if (!this.ctx || this.closing) return
    this.fadeMasterTo(0, 1.2)
    if (this.chordTimer) clearTimeout(this.chordTimer)
    this.chordTimer = null
    const ctx = this.ctx
    this.closing = setTimeout(() => {
      void ctx.close()
      this.ctx = null
      this.master = this.oceanGain = this.oceanFilter = this.padBus = this.reverb = null
      this.closing = null
    }, 1400)
  }

  /** Pauses output while the page is hidden, to save battery. */
  suspend() {
    void this.ctx?.suspend()
  }

  resume() {
    void this.ctx?.resume()
  }

  /** Shapes the ocean to the breath and rings the chime. Called at the start of each phase. */
  phase(kind: PhaseKind, seconds: number) {
    const ctx = this.ctx
    if (!ctx || !this.oceanGain || !this.oceanFilter || this.closing) return
    const now = ctx.currentTime
    const gain = this.oceanGain.gain
    const freq = this.oceanFilter.frequency
    gain.cancelScheduledValues(now)
    freq.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    freq.setValueAtTime(freq.value, now)
    if (kind === 'inhale') {
      gain.linearRampToValueAtTime(OCEAN_HIGH, now + seconds)
      freq.linearRampToValueAtTime(1100, now + seconds)
      this.chime(midiToHz(81))
    } else if (kind === 'exhale') {
      gain.linearRampToValueAtTime(OCEAN_LOW, now + seconds)
      freq.linearRampToValueAtTime(350, now + seconds)
      this.chime(midiToHz(74))
    }
  }

  private playChord() {
    const ctx = this.ctx
    if (!ctx || !this.padBus) return
    const notes = CHORDS[this.chordIndex % CHORDS.length]!
    this.chordIndex += 1
    const now = ctx.currentTime
    const attack = 3
    const release = 4
    const end = now + CHORD_SECONDS + release
    for (const note of notes) {
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, now)
      env.gain.linearRampToValueAtTime(VOICE_LEVEL, now + attack)
      env.gain.setValueAtTime(VOICE_LEVEL, now + CHORD_SECONDS)
      env.gain.linearRampToValueAtTime(0, end)
      env.connect(this.padBus)
      // Two slightly detuned oscillators per note give a soft, slowly moving tone.
      for (const [type, detune] of [['sine', -4], ['triangle', 5]] as const) {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.value = midiToHz(note)
        osc.detune.value = detune
        osc.connect(env)
        osc.start(now)
        osc.stop(end + 0.1)
      }
    }
    // Overlap the next chord with this one's release so the pad never drops out.
    this.chordTimer = setTimeout(() => this.playChord(), CHORD_SECONDS * 1000)
  }

  private chime(freq: number) {
    const ctx = this.ctx
    if (!ctx || !this.reverb || !this.master) return
    const now = ctx.currentTime
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(0.045, now + 0.02)
    env.gain.exponentialRampToValueAtTime(0.0001, now + 3)
    env.connect(this.reverb)
    env.connect(this.master)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(env)
    osc.start(now)
    osc.stop(now + 3.1)
  }

  private fadeMasterTo(level: number, seconds: number) {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const gain = this.master.gain
    const now = ctx.currentTime
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(level, now + seconds)
  }
}

/** Brown noise: deeper and softer than white noise, close to distant surf. */
function brownNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel)
    let last = 0
    for (let i = 0; i < length; i += 1) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      data[i] = last * 3.5
    }
    // Crossfade the tail into the head. Playback loops before the tail, so the jump from
    // data[end - blend - 1] back to data[0] (which now mostly equals data[end - blend]) is seamless.
    const blend = Math.floor(ctx.sampleRate * LOOP_BLEND)
    for (let i = 0; i < blend; i += 1) {
      const t = i / blend
      data[i] = data[i]! * t + data[length - blend + i]! * (1 - t)
    }
  }
  return buffer
}

/** A simple decaying-noise impulse response: a soft, roomy reverb without any audio files. */
function impulse(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
    }
  }
  return buffer
}

/** One shared instance: the start button and the session overlay control the same sound. */
export const calmAudio = new CalmAudio()
