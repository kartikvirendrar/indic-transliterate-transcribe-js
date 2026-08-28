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
 * The gate is a single growing buffer with two flush triggers:
 *   • a pause is detected AND buffered speech >= minUtterance  -> flush
 *   • the buffer reaches the ceiling                           -> force-flush:
 *        past softMax the silence threshold drops (any micro-pause cuts);
 *        at hardMax we cut at the quietest point in the last ~1s and carry
 *        the remainder into the next buffer.
 *   • a pause while buffered < minUtterance                    -> keep buffering
 *        (the short pause just becomes part of the utterance — no seams).
 *
 * Design notes:
 *   • Raw PCM via AudioWorklet (MediaRecorder/webm can't be byte-sliced into
 *     independently-decodable chunks); downsampled to 16 kHz mono; WAV per chunk.
 *   • ASR calls return OUT OF ORDER — every chunk carries a monotonic `seq` and
 *     transcripts are emitted strictly in `seq` order.
 *   • Cuts happen at silence, so NO overlap padding (that would duplicate words);
 *     just leading-silence trim + a small trailing pad.
 *
 * Framework-agnostic (no React) so the same instance is reused across a
 * start/stop toggle and can be unit-tested in isolation.
 */

const FRAME_MS = 30 // VAD analysis frame

const DEFAULTS = {
  targetSampleRate: 16000,
  minUtteranceSec: 4,
  softMaxSec: 22,
  hardMaxSec: 26,
  silenceHangMsNormal: 650,
  silenceHangMsEager: 180,
  speechOnsetMs: 120,
  trailingPadMs: 150,
  minSpeechToSendSec: 0.4,
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
    this.hangMs = this.o.silenceHangMsNormal

    // current utterance buffer
    this.buf = []
    this.bufSamples = 0
    this.speechSamples = 0
    this.sawSpeech = false

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
    this.flush(true, true) // send the tail even if < minUtterance
    await this.drain()
    this.setState("idle")
  }

  cancel() {
    this.teardownAudio()
    for (const c of this.controllers) c.abort()
    this.controllers.clear()
    this.queue = []
    this.doneMap.clear()
    this.resetBuffer()
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
    let sum = 0
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i]
    const rms = Math.sqrt(sum / frame.length)

    if (rms < this.noiseFloor) this.noiseFloor = rms
    else this.noiseFloor += (rms - this.noiseFloor) * 0.02
    const threshold = Math.max(this.noiseFloor * 3.5, 0.006)
    const voiced = rms > threshold
    this.o.onLevel(rms, voiced)

    if (voiced) {
      this.speechRun += FRAME_MS
      this.silenceRun = 0
      if (!this.inSpeech && this.speechRun >= this.o.speechOnsetMs) this.inSpeech = true
    } else {
      this.silenceRun += FRAME_MS
      this.speechRun = 0
    }

    if (!this.sawSpeech && !this.inSpeech) return // leading-silence trim
    if (this.inSpeech) this.sawSpeech = true

    this.buf.push(frame.slice())
    this.bufSamples += frame.length
    if (voiced) this.speechSamples += frame.length

    const bufSec = this.bufSamples / this.targetRate
    this.hangMs = bufSec >= this.o.softMaxSec ? this.o.silenceHangMsEager : this.o.silenceHangMsNormal

    if (this.sawSpeech && !this.inSpeech && this.silenceRun >= this.hangMs) {
      if (this.speechSamples / this.targetRate >= this.o.minUtteranceSec) {
        this.flush(false, false)
      }
      return
    }

    if (bufSec >= this.o.hardMaxSec) this.flush(true, false)
  }

  // ── Flush: cut the buffer -> WAV -> enqueue ASR ────────────────────────
  flush(force, isFinal) {
    if (this.bufSamples === 0) return
    const speechSec = this.speechSamples / this.targetRate
    if (speechSec < this.o.minSpeechToSendSec && !isFinal) {
      this.resetBuffer()
      return
    }

    const merged = this.mergeBuf()
    let cut = merged.length
    let carry = null

    if (force && !isFinal) {
      cut = this.quietestCut(merged)
      if (cut < merged.length) carry = merged.slice(cut)
    } else {
      const pad = Math.round((this.targetRate * this.o.trailingPadMs) / 1000)
      cut = Math.min(merged.length, this.lastSpeechIndex(merged) + pad)
    }

    const wav = encodeWav(merged.subarray(0, cut), this.targetRate)
    this.enqueue({ seq: this.seq++, wav })

    this.resetBuffer()
    if (carry && carry.length) {
      this.buf.push(carry)
      this.bufSamples = carry.length
      this.speechSamples = carry.length
      this.sawSpeech = true
    }
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

  resetBuffer() {
    this.buf = []
    this.bufSamples = 0
    this.speechSamples = 0
    this.sawSpeech = false
    this.inSpeech = false
    this.silenceRun = 0
    this.speechRun = 0
    this.hangMs = this.o.silenceHangMsNormal
  }

  lastSpeechIndex(a) {
    const win = this.frameSamples
    const thr = Math.max(this.noiseFloor * 3.5, 0.006)
    for (let end = a.length; end > 0; end -= win) {
      const start = Math.max(0, end - win)
      let sum = 0
      for (let i = start; i < end; i++) sum += a[i] * a[i]
      if (Math.sqrt(sum / (end - start)) > thr) return end
    }
    return a.length
  }

  quietestCut(a) {
    const win = this.frameSamples
    const lookback = Math.min(a.length, this.targetRate) // last 1s
    let best = a.length
    let bestRms = Infinity
    for (let end = a.length; end > a.length - lookback; end -= win) {
      const start = Math.max(0, end - win)
      let sum = 0
      for (let i = start; i < end; i++) sum += a[i] * a[i]
      const rms = Math.sqrt(sum / (end - start))
      if (rms < bestRms) {
        bestRms = rms
        best = end
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
