/**
 * Streaming dictation controller — real-time VAD segmentation + chunked ASR.
 *
 * Instead of recording the whole utterance and POSTing it once (the component's
 * single-shot MediaRecorder path), this opens the mic, runs an energy-based
 * Voice Activity Detector over raw PCM, and cuts the audio at natural pauses into
 * "utterances" sized for the ASR model's sweet spot (min ~4s, max ~26s). Each
 * utterance is WAV-encoded and sent to the ASR endpoint as it's produced, so
 * transcripts stream back and land in the field progressively — the feel of a
 * streaming endpoint on top of a whole-file API.
 *
 * The gate is one growing "bucket" of audio, closed by whichever comes first:
 *
 *   • PAUSE  — speech stops for `silenceHangMsNormal`. If the bucket already holds
 *              >= `minUtteranceSec` of audio it is sent; otherwise it is kept open
 *              (the bucket stops growing — silence is not hoarded) and the next
 *              stretch of speech is appended to it, so several short phrases are
 *              batched into one model-friendly chunk.
 *   • LONG PAUSE — silence lasting `longPauseSec` is a sentence boundary: a short
 *              bucket is sent anyway rather than making the speaker wait for
 *              text that will not appear until they say more.
 *   • SOFT MAX — past `softMaxSec` the hangover drops to `silenceHangMsEager`, so
 *              the very next micro-pause between words closes the bucket.
 *   • HARD MAX — at `hardMaxSec` the bucket is cut at the quietest point in the
 *              last `hardCutLookbackSec` and the remainder carries into the next
 *              bucket. With the eager mode above this is a last resort.
 *   • STOP   — whatever is buffered is sent as-is, however short.
 *
 * Design notes:
 *   • Raw PCM via AudioWorklet (MediaRecorder/webm can't be byte-sliced into
 *     independently-decodable chunks); downsampled to 16 kHz mono; WAV per chunk.
 *   • A short pre-roll ring (`preRollMs`) is prepended when speech (re)starts so
 *     onsets are not clipped by the onset-confirmation delay.
 *   • The noise floor is tracked with minimum statistics + slow forgetting, and
 *     the voiced decision has hysteresis, so a noisy room or aggressive AGC can't
 *     wedge the detector into "always speaking" (which would make every bucket
 *     run to the hard ceiling).
 *   • ASR calls return OUT OF ORDER — every chunk carries a monotonic `seq` and
 *     transcripts are emitted strictly in `seq` order.
 *   • Cuts happen at silence, so NO overlap padding (that would duplicate words);
 *     just a small trailing pad after the last speech.
 *
 * Framework-agnostic (no React) so the same instance is reused across a
 * start/stop toggle and can be unit-tested in isolation (`processFrame` +
 * `enqueue` are the seams).
 */

const FRAME_MS = 30 // VAD analysis frame

const DEFAULTS = {
  targetSampleRate: 16000,
  /** A pause may close the bucket only once it holds this much audio. */
  minUtteranceSec: 4,
  /** Past this, any micro-pause (silenceHangMsEager) closes the bucket. Six
   *  seconds below the hard ceiling: word gaps of >= 180 ms come every second
   *  or two in natural speech, so the ceiling should almost never be reached. */
  softMaxSec: 20,
  /** Absolute ceiling: cut at the quietest recent point and carry the rest. */
  hardMaxSec: 26,
  /** A pause this long ends the utterance even if the bucket is short. */
  longPauseSec: 3,
  silenceHangMsNormal: 600,
  silenceHangMsEager: 180,
  speechOnsetMs: 120,
  preRollMs: 300,
  trailingPadMs: 200,
  /** Buckets with less voiced audio than this are dropped, not sent. */
  minSpeechToSendSec: 0.25,
  hardCutLookbackSec: 3,
  maxConcurrentAsr: 2,
}

const noop = () => {}

export class StreamingDictation {
  constructor(options) {
    this.o = {
      ...DEFAULTS,
      onPartial: noop,
      onStateChange: noop,
      onError: noop,
      onLevel: noop,
      ...options,
    }
    this.state = "idle"

    // audio graph
    this.stream = null
    this.ctx = null
    this.node = null
    this.source = null
    this.workletUrl = null

    // downsample + framing
    this.targetRate = this.o.targetSampleRate
    this.inRate = 48000
    this.frameSamples = Math.round((this.targetRate * FRAME_MS) / 1000)
    this.frameBuf = new Float32Array(this.frameSamples)
    this.frameFill = 0
    this.resampleCarry = 0

    // VAD state
    this.noiseFloor = 0.003
    this.inSpeech = false
    this.silenceRun = 0
    this.speechRun = 0

    // pre-roll ring of the most recent frames, each tagged with its index so a
    // frame is never appended to the bucket twice
    this.frameIdx = 0
    this.preRollFrames = Math.max(1, Math.round(this.o.preRollMs / FRAME_MS))
    this.ring = []
    this.lastAppendedIdx = -1

    // current bucket
    this.buf = []
    this.bufSamples = 0
    this.speechSamples = 0
    this.capturing = false // frames are being appended (speech or its hangover)
    this.pausedMs = 0 // silence elapsed since a non-flushing pause closed capture

    // ASR ordering + concurrency
    this.seq = 0
    this.nextEmit = 0
    this.doneMap = new Map()
    this.queue = []
    this.inflight = 0
    this.controllers = new Set()
  }

  getState() {
    return this.state
  }

  async start() {
    if (this.state !== "idle") return
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.inRate = this.ctx.sampleRate
      await this.ctx.audioWorklet.addModule(this.buildWorkletUrl())
      this.source = this.ctx.createMediaStreamSource(this.stream)
      this.node = new AudioWorkletNode(this.ctx, "pcm-forwarder")
      this.node.port.onmessage = e => this.onPcm(e.data)
      this.source.connect(this.node)
      const sink = this.ctx.createGain()
      sink.gain.value = 0
      this.node.connect(sink).connect(this.ctx.destination)
      this.setState("recording")
    } catch (err) {
      this.teardownAudio()
      this.setState("error")
      this.o.onError(err instanceof Error ? err : new Error(String(err)), "fatal")
      throw err
    }
  }

  async stop() {
    if (this.state !== "recording") return
    this.setState("finalizing")
    this.teardownAudio()
    this.flushBucket() // the tail goes as-is, however short
    this.resetVad()
    await this.drain()
    this.setState("idle")
  }

  cancel() {
    this.teardownAudio()
    for (const c of this.controllers) c.abort()
    this.controllers.clear()
    this.queue = []
    this.doneMap.clear()
    this.resetBucket()
    this.resetVad()
    this.seq = 0
    this.nextEmit = 0
    this.inflight = 0
    this.setState("idle")
  }

  // ── PCM ingest -> downsample -> frame -> VAD ───────────────────────────
  onPcm(input) {
    if (this.state !== "recording") return
    const ratio = this.inRate / this.targetRate
    let pos = this.resampleCarry
    while (pos < input.length) {
      const i = Math.floor(pos)
      const frac = pos - i
      const a = input[i]
      const b = i + 1 < input.length ? input[i + 1] : a
      this.pushSample(a + (b - a) * frac)
      pos += ratio
    }
    this.resampleCarry = pos - input.length
  }

  pushSample(s) {
    this.frameBuf[this.frameFill++] = s
    if (this.frameFill >= this.frameSamples) {
      this.processFrame(this.frameBuf)
      this.frameFill = 0
    }
  }

  processFrame(frame) {
    const rms = frameRms(frame, 0, frame.length)

    // Voiced decision with hysteresis: harder to enter speech than to stay in it.
    const k = this.inSpeech ? 2.5 : 3.5
    const voiced = rms > Math.max(this.noiseFloor * k, 0.006)
    this.o.onLevel(rms, voiced)

    // Noise floor: minimum statistics with slow forgetting. It relaxes down onto
    // quiet frames (smoothed, so one glitch frame doesn't crater it) and creeps
    // up ~2%/frame otherwise, so it can never get stuck below a room that is
    // louder than expected — the failure that turns every pause into "speech".
    if (rms < this.noiseFloor) this.noiseFloor += (rms - this.noiseFloor) * 0.3
    else this.noiseFloor = Math.min(this.noiseFloor * 1.02, rms)

    if (voiced) {
      this.speechRun += FRAME_MS
      this.silenceRun = 0
    } else {
      this.silenceRun += FRAME_MS
      this.speechRun = 0
    }

    const idx = this.frameIdx++
    this.ring.push({ idx, data: frame.slice() })
    if (this.ring.length > this.preRollFrames) this.ring.shift()

    const bufSec = this.bufSamples / this.targetRate
    const hangMs = bufSec >= this.o.softMaxSec ? this.o.silenceHangMsEager : this.o.silenceHangMsNormal

    if (!this.inSpeech && this.speechRun >= this.o.speechOnsetMs) {
      this.inSpeech = true
      this.onSpeechStart()
    } else if (this.inSpeech && this.silenceRun >= hangMs) {
      this.inSpeech = false
      this.onSpeechEnd(hangMs)
    }

    if (this.capturing) {
      this.append(frame, idx, voiced)
      if (this.bufSamples / this.targetRate >= this.o.hardMaxSec) this.forceCut()
    } else if (this.bufSamples > 0) {
      // A short bucket is waiting for more speech. A long enough silence is a
      // sentence boundary — send what we have instead of holding it hostage.
      this.pausedMs += FRAME_MS
      if (this.pausedMs >= this.o.longPauseSec * 1000) this.flushBucket()
    }
  }

  onSpeechStart() {
    this.pausedMs = 0
    if (this.capturing) return
    this.capturing = true
    // Prepend the pre-roll so the onset-confirmation delay doesn't clip the
    // first syllable. Frames already in the bucket are skipped by index.
    for (const f of this.ring) this.append(f.data, f.idx, true)
  }

  onSpeechEnd(hangMs) {
    this.capturing = false
    this.pausedMs = 0
    // Audio in the bucket excluding the hangover we just sat through.
    const spokenSec = this.bufSamples / this.targetRate - hangMs / 1000
    if (spokenSec >= this.o.minUtteranceSec) this.flushBucket()
  }

  append(frame, idx, voiced) {
    if (idx <= this.lastAppendedIdx) return
    this.lastAppendedIdx = idx
    this.buf.push(frame.slice ? frame.slice() : frame)
    this.bufSamples += frame.length
    if (voiced) this.speechSamples += frame.length
  }

  // ── Flush: cut the bucket -> WAV -> enqueue ASR ────────────────────────

  /** Send the bucket up to its last speech (+ pad). Drops silence-only buckets. */
  flushBucket() {
    if (this.bufSamples === 0) return
    if (this.speechSamples / this.targetRate < this.o.minSpeechToSendSec) {
      this.resetBucket()
      return
    }
    const merged = this.mergeBuf()
    const end = this.lastSpeechIndex(merged)
    if (end === 0) {
      this.resetBucket()
      return
    }
    const pad = Math.round((this.targetRate * this.o.trailingPadMs) / 1000)
    this.send(merged.subarray(0, Math.min(merged.length, end + pad)))
    this.resetBucket()
  }

  /** Hard ceiling mid-speech: cut at the quietest recent point, carry the rest. */
  forceCut() {
    const merged = this.mergeBuf()
    const cut = this.quietestCut(merged)
    const carry = merged.slice(cut)
    this.send(merged.subarray(0, cut))
    this.resetBucket()
    if (carry.length) {
      // Still mid-speech: the carried tail seeds the next bucket and capture
      // continues. Treat it all as speech — it was cut from a voiced run.
      this.buf.push(carry)
      this.bufSamples = carry.length
      this.speechSamples = carry.length
      this.capturing = true
    }
  }

  send(samples) {
    if (!samples.length) return
    this.enqueue({ seq: this.seq++, wav: encodeWav(samples, this.targetRate) })
  }

  mergeBuf() {
    const out = new Float32Array(this.bufSamples)
    let off = 0
    for (const f of this.buf) {
      out.set(f, off)
      off += f.length
    }
    return out
  }

  resetBucket() {
    this.buf = []
    this.bufSamples = 0
    this.speechSamples = 0
    this.capturing = false
    this.pausedMs = 0
  }

  resetVad() {
    this.inSpeech = false
    this.silenceRun = 0
    this.speechRun = 0
    this.ring = []
    this.lastAppendedIdx = -1
  }

  /** End index of the last voiced frame in `a`, or 0 if none. */
  lastSpeechIndex(a) {
    const win = this.frameSamples
    const thr = Math.max(this.noiseFloor * 2.5, 0.006)
    for (let end = a.length; end > 0; end -= win) {
      const start = Math.max(0, end - win)
      if (frameRms(a, start, end) > thr) return end
    }
    return 0
  }

  /**
   * Index to cut a too-long bucket at: the centre of the quietest ~90 ms window
   * in the last `hardCutLookbackSec`. A wider window than a single frame so the
   * cut lands in a real gap between words rather than a zero-crossing inside one.
   */
  quietestCut(a) {
    const win = this.frameSamples
    const span = 3 * win
    const lookback = Math.min(a.length, Math.round(this.o.hardCutLookbackSec * this.targetRate))
    const floor = Math.max(0, a.length - lookback)
    let best = a.length
    let bestRms = Infinity
    for (let end = a.length; end - span >= floor; end -= win) {
      const rms = frameRms(a, end - span, end)
      if (rms < bestRms) {
        bestRms = rms
        best = end - Math.floor(span / 2)
      }
    }
    return best
  }

  // ── Ordered, bounded-concurrency ASR ───────────────────────────────────
  enqueue(chunk) {
    this.queue.push(chunk)
    this.pump()
  }

  pump() {
    while (this.inflight < this.o.maxConcurrentAsr && this.queue.length) {
      const chunk = this.queue.shift()
      this.inflight++
      this.transcribe(chunk)
        .then(text => this.deliver(chunk.seq, text))
        .catch(err => {
          this.deliver(chunk.seq, "") // keep the seq slot so ordering holds
          this.o.onError(err instanceof Error ? err : new Error(String(err)), "chunk")
        })
        .finally(() => {
          this.inflight--
          this.pump()
        })
    }
  }

  async transcribe(chunk) {
    const controller = new AbortController()
    this.controllers.add(controller)
    try {
      const form = new FormData()
      form.append("file", chunk.wav, `chunk-${chunk.seq}.wav`)
      form.append("language", this.o.language)
      const authHeader = this.o.getAuthHeader ? this.o.getAuthHeader() : ""
      const res = await fetch(this.o.asrUrl, {
        method: "POST",
        headers: authHeader ? { Authorization: authHeader } : {},
        body: form,
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = new Error(`ASR HTTP ${res.status}`)
        err.status = res.status
        throw err
      }
      const data = await res.json()
      return (data.text || "").trim()
    } finally {
      this.controllers.delete(controller)
    }
  }

  deliver(seq, text) {
    this.doneMap.set(seq, text)
    while (this.doneMap.has(this.nextEmit)) {
      const t = this.doneMap.get(this.nextEmit)
      this.doneMap.delete(this.nextEmit)
      if (t) this.o.onPartial(t, this.nextEmit)
      this.nextEmit++
    }
  }

  async drain() {
    while (this.queue.length || this.inflight || this.nextEmit < this.seq) {
      await new Promise(r => setTimeout(r, 50))
    }
  }

  // ── Plumbing ───────────────────────────────────────────────────────────
  setState(s) {
    if (this.state === s) return
    this.state = s
    this.o.onStateChange(s)
  }

  teardownAudio() {
    try {
      this.node && this.node.port && this.node.port.close()
      this.node && this.node.disconnect()
      this.source && this.source.disconnect()
    } catch (_) {
      /* noop */
    }
    this.stream && this.stream.getTracks().forEach(t => t.stop())
    this.ctx && this.ctx.close().catch(() => {})
    if (this.workletUrl) URL.revokeObjectURL(this.workletUrl)
    this.node = null
    this.source = null
    this.stream = null
    this.ctx = null
    this.workletUrl = null
  }

  buildWorkletUrl() {
    const code = `
      class PCMForwarder extends AudioWorkletProcessor {
        constructor() { super(); this._buf = new Float32Array(2048); this._n = 0; }
        process(inputs) {
          const ch = inputs[0] && inputs[0][0];
          if (ch) {
            for (let i = 0; i < ch.length; i++) {
              this._buf[this._n++] = ch[i];
              if (this._n >= this._buf.length) {
                this.port.postMessage(this._buf.slice(0, this._n));
                this._n = 0;
              }
            }
          }
          return true;
        }
      }
      registerProcessor("pcm-forwarder", PCMForwarder);
    `
    this.workletUrl = URL.createObjectURL(new Blob([code], { type: "application/javascript" }))
    return this.workletUrl
  }
}

function frameRms(a, start, end) {
  let sum = 0
  for (let i = start; i < end; i++) sum += a[i] * a[i]
  return Math.sqrt(sum / (end - start))
}

/** Encode mono Float32 PCM as a 16-bit WAV Blob. */
export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, "WAVE")
  writeStr(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, "data")
  view.setUint32(40, samples.length * 2, true)
  let off = 44
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([buffer], { type: "audio/wav" })
}
