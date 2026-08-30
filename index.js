var $jECdM$reactjsxruntime = require("react/jsx-runtime");
var $jECdM$react = require("react");
var $jECdM$textareacaret = require("textarea-caret");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "IndicTransliterate", function () { return $0e1b765668e4d0aa$export$a62758b764e9e41d; });
$parcel$export(module.exports, "TriggerKeys", function () { return $7f12c5bac20ed9d3$export$24b0ea3375909d37; });
$parcel$export(module.exports, "getTransliterateSuggestions", function () { return $857753f052b25831$export$27f30d10c00bcc6c; });


function $0ecfe4a0401ba76b$export$e27e3030245d4c9b() {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}


function $9f468a725b3358f7$export$8a4ff65f970d59a5(el) {
    const start = 0;
    const end = 0;
    if (!el) return {
        start: start,
        end: end
    };
    if (typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") return {
        start: el.selectionStart,
        end: el.selectionEnd
    };
    return {
        start: start,
        end: end
    };
}
function $9f468a725b3358f7$export$97ab23b40042f8af(elem, caretPos) {
    if (elem) {
        if (elem.selectionStart) {
            elem.focus();
            elem.setSelectionRange(caretPos, caretPos);
        } else elem.focus();
    }
}





const $7f12c5bac20ed9d3$export$24b0ea3375909d37 = {
    KEY_RETURN: "Enter",
    KEY_ENTER: "Enter",
    KEY_TAB: "Tab",
    KEY_SPACE: " "
};


const $857753f052b25831$var$MAX_CACHE_SIZE = 10000;
const $857753f052b25831$var$SAVE_THRESHOLD = 20;
const $857753f052b25831$var$CACHE_KEY = "transliterationCache";
const $857753f052b25831$var$cache = $857753f052b25831$var$loadCacheFromLocalStorage();
let $857753f052b25831$var$newEntriesCount = 0;
function $857753f052b25831$var$loadCacheFromLocalStorage() {
    if (typeof window === "undefined") return {};
    try {
        const cachedData = window.localStorage.getItem($857753f052b25831$var$CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : {};
    } catch (e) {
        return {};
    }
}
function $857753f052b25831$var$saveCacheToLocalStorage() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem($857753f052b25831$var$CACHE_KEY, JSON.stringify($857753f052b25831$var$cache));
    } catch (e) {
    // storage disabled, quota exceeded, or SecurityError — ignore
    }
}
const $857753f052b25831$var$getWordWithLowestFrequency = (dictionary)=>{
    let lowestFreqWord = null;
    let lowestFreq = Infinity;
    for(const word in dictionary)if (dictionary[word].frequency < lowestFreq) {
        lowestFreq = dictionary[word].frequency;
        lowestFreqWord = word;
    }
    return lowestFreqWord;
};
const $857753f052b25831$export$27f30d10c00bcc6c = async (word, customApiURL, apiKey, config)=>{
    const { showCurrentWordAsLastSuggestion: // numOptions = 5,
    showCurrentWordAsLastSuggestion = true, lang: lang = "hi", onError: // Called once per FAILED lookup with {status, latencyMs} — the HTTP status when there was
    // a response (null for a network error / unparseable body) and the round trip. Never the
    // word or the response body: a host may forward this straight to analytics.
    onError = null } = config || {};
    const startedAt = Date.now();
    let status = null;
    // fetch suggestion from api
    // const url = `https://www.google.com/inputtools/request?ime=transliteration_en_${lang}&num=5&cp=0&cs=0&ie=utf-8&oe=utf-8&app=jsapi&text=${word}`;
    // let myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");
    if (!$857753f052b25831$var$cache[lang]) $857753f052b25831$var$cache[lang] = {};
    if ($857753f052b25831$var$cache[lang][word.toLowerCase()]) {
        $857753f052b25831$var$cache[lang][word.toLowerCase()].frequency += 1;
        return $857753f052b25831$var$cache[lang][word.toLowerCase()].suggestions;
    }
    const requestOptions = {
        method: "GET",
        headers: {
            Authorization: apiKey
        }
    };
    try {
        const res = await fetch(customApiURL + `${lang}/${word === "." || word === ".." ? " " + word.replace(".", "%2E") : encodeURIComponent(word).replace(".", "%2E")}`, requestOptions);
        status = res.status;
        if (!res.ok) throw new Error(`transliteration HTTP ${res.status}`);
        let data = await res.json();
        if (!customApiURL.includes("xlit-api")) data.result = data.output[0].target;
        if (data && data.result.length > 0) {
            const found = showCurrentWordAsLastSuggestion ? [
                ...data.result,
                word
            ] : data.result;
            if (Object.keys($857753f052b25831$var$cache[lang]).length >= $857753f052b25831$var$MAX_CACHE_SIZE) {
                const lowestFreqWord = $857753f052b25831$var$getWordWithLowestFrequency($857753f052b25831$var$cache[lang]);
                if (lowestFreqWord) delete $857753f052b25831$var$cache[lang][lowestFreqWord];
            }
            $857753f052b25831$var$cache[lang][word.toLowerCase()] = {
                suggestions: found,
                frequency: 1
            };
            $857753f052b25831$var$newEntriesCount += 1;
            if ($857753f052b25831$var$newEntriesCount >= $857753f052b25831$var$SAVE_THRESHOLD) {
                $857753f052b25831$var$saveCacheToLocalStorage();
                $857753f052b25831$var$newEntriesCount = 0;
            }
            return found;
        } else {
            if (showCurrentWordAsLastSuggestion) {
                const fallback = [
                    word
                ];
                return fallback;
            }
            return [];
        }
    } catch (e) {
        console.error("There was an error with transliteration", e);
        try {
            onError && onError({
                status: status,
                latencyMs: Date.now() - startedAt
            });
        } catch (ignored) {
        // a listener must never break typing
        }
        return [];
    }
};
if (typeof window !== "undefined") window.addEventListener("beforeunload", $857753f052b25831$var$saveCacheToLocalStorage);


const $2b6bcc00ef7a3078$export$ca6dda5263526f75 = "https://xlit-api.ai4bharat.org/";
const $2b6bcc00ef7a3078$export$a238c5e20ae27fe7 = "https://xlit-api.ai4bharat.org/tl/";


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
 */ const $e9499f34e7fc5d70$var$FRAME_MS = 30 // VAD analysis frame
;
const $e9499f34e7fc5d70$var$DEFAULTS = {
    targetSampleRate: 16000,
    /** A pause may close the bucket only once it holds this much audio. */ minUtteranceSec: 4,
    /** Past this, any micro-pause (silenceHangMsEager) closes the bucket. Six
   *  seconds below the hard ceiling: word gaps of >= 180 ms come every second
   *  or two in natural speech, so the ceiling should almost never be reached. */ softMaxSec: 20,
    /** Absolute ceiling: cut at the quietest recent point and carry the rest. */ hardMaxSec: 26,
    /** A pause this long ends the utterance even if the bucket is short. */ longPauseSec: 3,
    silenceHangMsNormal: 600,
    silenceHangMsEager: 180,
    speechOnsetMs: 120,
    preRollMs: 300,
    trailingPadMs: 200,
    /** Buckets with less voiced audio than this are dropped, not sent. */ minSpeechToSendSec: 0.25,
    hardCutLookbackSec: 3,
    maxConcurrentAsr: 2
};
const $e9499f34e7fc5d70$var$noop = ()=>{};
class $e9499f34e7fc5d70$export$eae2660aea493150 {
    constructor(options){
        this.o = {
            ...$e9499f34e7fc5d70$var$DEFAULTS,
            onPartial: $e9499f34e7fc5d70$var$noop,
            onStateChange: $e9499f34e7fc5d70$var$noop,
            onError: $e9499f34e7fc5d70$var$noop,
            onLevel: $e9499f34e7fc5d70$var$noop,
            // Telemetry: one plain-object event per decision the controller makes, so the host
            // app can measure the VAD instead of guessing at it. Never carries audio or text —
            // only sizes, timings and reasons. Shapes:
            //   {type:"start"}
            //   {type:"cut",     seq, reason:"pause"|"long_pause"|"hard_max"|"stop", audioMs, speechMs}
            //   {type:"dropped", reason:"no_speech"|"too_little_speech", audioMs, speechMs}
            //   {type:"asr",     seq, ok, status, latencyMs, bytes, chars}
            //   {type:"end",     reason:"stop"|"cancel", durationMs, segments}
            onTelemetry: $e9499f34e7fc5d70$var$noop,
            ...options
        };
        this.startedAt = 0;
        this.state = "idle";
        // audio graph
        this.stream = null;
        this.ctx = null;
        this.node = null;
        this.source = null;
        this.workletUrl = null;
        // downsample + framing
        this.targetRate = this.o.targetSampleRate;
        this.inRate = 48000;
        this.frameSamples = Math.round(this.targetRate * $e9499f34e7fc5d70$var$FRAME_MS / 1000);
        this.frameBuf = new Float32Array(this.frameSamples);
        this.frameFill = 0;
        this.resampleCarry = 0;
        // VAD state
        this.noiseFloor = 0.003;
        this.inSpeech = false;
        this.silenceRun = 0;
        this.speechRun = 0;
        // pre-roll ring of the most recent frames, each tagged with its index so a
        // frame is never appended to the bucket twice
        this.frameIdx = 0;
        this.preRollFrames = Math.max(1, Math.round(this.o.preRollMs / $e9499f34e7fc5d70$var$FRAME_MS));
        this.ring = [];
        this.lastAppendedIdx = -1;
        // current bucket
        this.buf = [];
        this.bufSamples = 0;
        this.speechSamples = 0;
        this.capturing = false // frames are being appended (speech or its hangover)
        ;
        this.pausedMs = 0 // silence elapsed since a non-flushing pause closed capture
        ;
        // ASR ordering + concurrency
        this.seq = 0;
        this.nextEmit = 0;
        this.doneMap = new Map();
        this.queue = [];
        this.inflight = 0;
        this.controllers = new Set();
    }
    getState() {
        return this.state;
    }
    async start() {
        if (this.state !== "idle") return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.inRate = this.ctx.sampleRate;
            await this.ctx.audioWorklet.addModule(this.buildWorkletUrl());
            this.source = this.ctx.createMediaStreamSource(this.stream);
            this.node = new AudioWorkletNode(this.ctx, "pcm-forwarder");
            this.node.port.onmessage = (e)=>this.onPcm(e.data);
            this.source.connect(this.node);
            const sink = this.ctx.createGain();
            sink.gain.value = 0;
            this.node.connect(sink).connect(this.ctx.destination);
            this.startedAt = Date.now();
            this.emitTelemetry({
                type: "start"
            });
            this.setState("recording");
        } catch (err) {
            this.teardownAudio();
            this.setState("error");
            this.o.onError(err instanceof Error ? err : new Error(String(err)), "fatal");
            throw err;
        }
    }
    async stop() {
        if (this.state !== "recording") return;
        this.setState("finalizing");
        this.teardownAudio();
        this.flushBucket("stop") // the tail goes as-is, however short
        ;
        this.resetVad();
        await this.drain();
        this.emitTelemetry({
            type: "end",
            reason: "stop",
            durationMs: this.sinceStart(),
            segments: this.seq
        });
        this.setState("idle");
    }
    cancel() {
        if (this.state !== "idle") this.emitTelemetry({
            type: "end",
            reason: "cancel",
            durationMs: this.sinceStart(),
            segments: this.seq
        });
        this.teardownAudio();
        for (const c of this.controllers)c.abort();
        this.controllers.clear();
        this.queue = [];
        this.doneMap.clear();
        this.resetBucket();
        this.resetVad();
        this.seq = 0;
        this.nextEmit = 0;
        this.inflight = 0;
        this.setState("idle");
    }
    // ── PCM ingest -> downsample -> frame -> VAD ───────────────────────────
    onPcm(input) {
        if (this.state !== "recording") return;
        const ratio = this.inRate / this.targetRate;
        let pos = this.resampleCarry;
        while(pos < input.length){
            const i = Math.floor(pos);
            const frac = pos - i;
            const a = input[i];
            const b = i + 1 < input.length ? input[i + 1] : a;
            this.pushSample(a + (b - a) * frac);
            pos += ratio;
        }
        this.resampleCarry = pos - input.length;
    }
    pushSample(s) {
        this.frameBuf[this.frameFill++] = s;
        if (this.frameFill >= this.frameSamples) {
            this.processFrame(this.frameBuf);
            this.frameFill = 0;
        }
    }
    processFrame(frame) {
        const rms = $e9499f34e7fc5d70$var$frameRms(frame, 0, frame.length);
        // Voiced decision with hysteresis: harder to enter speech than to stay in it.
        const k = this.inSpeech ? 2.5 : 3.5;
        const voiced = rms > Math.max(this.noiseFloor * k, 0.006);
        this.o.onLevel(rms, voiced);
        // Noise floor: minimum statistics with slow forgetting. It relaxes down onto
        // quiet frames (smoothed, so one glitch frame doesn't crater it) and creeps
        // up ~2%/frame otherwise, so it can never get stuck below a room that is
        // louder than expected — the failure that turns every pause into "speech".
        if (rms < this.noiseFloor) this.noiseFloor += (rms - this.noiseFloor) * 0.3;
        else this.noiseFloor = Math.min(this.noiseFloor * 1.02, rms);
        if (voiced) {
            this.speechRun += $e9499f34e7fc5d70$var$FRAME_MS;
            this.silenceRun = 0;
        } else {
            this.silenceRun += $e9499f34e7fc5d70$var$FRAME_MS;
            this.speechRun = 0;
        }
        const idx = this.frameIdx++;
        this.ring.push({
            idx: idx,
            data: frame.slice()
        });
        if (this.ring.length > this.preRollFrames) this.ring.shift();
        const bufSec = this.bufSamples / this.targetRate;
        const hangMs = bufSec >= this.o.softMaxSec ? this.o.silenceHangMsEager : this.o.silenceHangMsNormal;
        if (!this.inSpeech && this.speechRun >= this.o.speechOnsetMs) {
            this.inSpeech = true;
            this.onSpeechStart();
        } else if (this.inSpeech && this.silenceRun >= hangMs) {
            this.inSpeech = false;
            this.onSpeechEnd(hangMs);
        }
        if (this.capturing) {
            this.append(frame, idx, voiced);
            if (this.bufSamples / this.targetRate >= this.o.hardMaxSec) this.forceCut();
        } else if (this.bufSamples > 0) {
            // A short bucket is waiting for more speech. A long enough silence is a
            // sentence boundary — send what we have instead of holding it hostage.
            this.pausedMs += $e9499f34e7fc5d70$var$FRAME_MS;
            if (this.pausedMs >= this.o.longPauseSec * 1000) this.flushBucket("long_pause");
        }
    }
    onSpeechStart() {
        this.pausedMs = 0;
        if (this.capturing) return;
        this.capturing = true;
        // Prepend the pre-roll so the onset-confirmation delay doesn't clip the
        // first syllable. Frames already in the bucket are skipped by index.
        for (const f of this.ring)this.append(f.data, f.idx, true);
    }
    onSpeechEnd(hangMs) {
        this.capturing = false;
        this.pausedMs = 0;
        // Audio in the bucket excluding the hangover we just sat through.
        const spokenSec = this.bufSamples / this.targetRate - hangMs / 1000;
        if (spokenSec >= this.o.minUtteranceSec) this.flushBucket("pause");
    }
    append(frame, idx, voiced) {
        if (idx <= this.lastAppendedIdx) return;
        this.lastAppendedIdx = idx;
        this.buf.push(frame.slice ? frame.slice() : frame);
        this.bufSamples += frame.length;
        if (voiced) this.speechSamples += frame.length;
    }
    // ── Flush: cut the bucket -> WAV -> enqueue ASR ────────────────────────
    /** Send the bucket up to its last speech (+ pad). Drops silence-only buckets. */ flushBucket(reason = "pause") {
        if (this.bufSamples === 0) return;
        const audioMs = Math.round(this.bufSamples / this.targetRate * 1000);
        const speechMs = Math.round(this.speechSamples / this.targetRate * 1000);
        if (this.speechSamples / this.targetRate < this.o.minSpeechToSendSec) {
            this.emitTelemetry({
                type: "dropped",
                reason: "too_little_speech",
                audioMs: audioMs,
                speechMs: speechMs
            });
            this.resetBucket();
            return;
        }
        const merged = this.mergeBuf();
        const end = this.lastSpeechIndex(merged);
        if (end === 0) {
            this.emitTelemetry({
                type: "dropped",
                reason: "no_speech",
                audioMs: audioMs,
                speechMs: speechMs
            });
            this.resetBucket();
            return;
        }
        const pad = Math.round(this.targetRate * this.o.trailingPadMs / 1000);
        this.emitTelemetry({
            type: "cut",
            seq: this.seq,
            reason: reason,
            audioMs: audioMs,
            speechMs: speechMs
        });
        this.send(merged.subarray(0, Math.min(merged.length, end + pad)));
        this.resetBucket();
    }
    /** Hard ceiling mid-speech: cut at the quietest recent point, carry the rest. */ forceCut() {
        const merged = this.mergeBuf();
        const cut = this.quietestCut(merged);
        this.emitTelemetry({
            type: "cut",
            seq: this.seq,
            reason: "hard_max",
            audioMs: Math.round(cut / this.targetRate * 1000),
            speechMs: Math.round(this.speechSamples / this.targetRate * 1000)
        });
        const carry = merged.slice(cut);
        this.send(merged.subarray(0, cut));
        this.resetBucket();
        if (carry.length) {
            // Still mid-speech: the carried tail seeds the next bucket and capture
            // continues. Treat it all as speech — it was cut from a voiced run.
            this.buf.push(carry);
            this.bufSamples = carry.length;
            this.speechSamples = carry.length;
            this.capturing = true;
        }
    }
    send(samples) {
        if (!samples.length) return;
        this.enqueue({
            seq: this.seq++,
            wav: $e9499f34e7fc5d70$export$1ceb7a840e500dd1(samples, this.targetRate)
        });
    }
    mergeBuf() {
        const out = new Float32Array(this.bufSamples);
        let off = 0;
        for (const f of this.buf){
            out.set(f, off);
            off += f.length;
        }
        return out;
    }
    resetBucket() {
        this.buf = [];
        this.bufSamples = 0;
        this.speechSamples = 0;
        this.capturing = false;
        this.pausedMs = 0;
    }
    resetVad() {
        this.inSpeech = false;
        this.silenceRun = 0;
        this.speechRun = 0;
        this.ring = [];
        this.lastAppendedIdx = -1;
    }
    /** End index of the last voiced frame in `a`, or 0 if none. */ lastSpeechIndex(a) {
        const win = this.frameSamples;
        const thr = Math.max(this.noiseFloor * 2.5, 0.006);
        for(let end = a.length; end > 0; end -= win){
            const start = Math.max(0, end - win);
            if ($e9499f34e7fc5d70$var$frameRms(a, start, end) > thr) return end;
        }
        return 0;
    }
    /**
   * Index to cut a too-long bucket at: the centre of the quietest ~90 ms window
   * in the last `hardCutLookbackSec`. A wider window than a single frame so the
   * cut lands in a real gap between words rather than a zero-crossing inside one.
   */ quietestCut(a) {
        const win = this.frameSamples;
        const span = 3 * win;
        const lookback = Math.min(a.length, Math.round(this.o.hardCutLookbackSec * this.targetRate));
        const floor = Math.max(0, a.length - lookback);
        let best = a.length;
        let bestRms = Infinity;
        for(let end = a.length; end - span >= floor; end -= win){
            const rms = $e9499f34e7fc5d70$var$frameRms(a, end - span, end);
            if (rms < bestRms) {
                bestRms = rms;
                best = end - Math.floor(span / 2);
            }
        }
        return best;
    }
    // ── Ordered, bounded-concurrency ASR ───────────────────────────────────
    enqueue(chunk) {
        this.queue.push(chunk);
        this.pump();
    }
    pump() {
        while(this.inflight < this.o.maxConcurrentAsr && this.queue.length){
            const chunk = this.queue.shift();
            this.inflight++;
            const t0 = Date.now();
            const bytes = chunk.wav && typeof chunk.wav.size === "number" ? chunk.wav.size : null;
            this.transcribe(chunk).then((text)=>{
                this.emitTelemetry({
                    type: "asr",
                    seq: chunk.seq,
                    ok: true,
                    status: 200,
                    latencyMs: Date.now() - t0,
                    bytes: bytes,
                    chars: (text || "").length
                });
                this.deliver(chunk.seq, text);
            }).catch((err)=>{
                this.emitTelemetry({
                    type: "asr",
                    seq: chunk.seq,
                    ok: false,
                    status: err && typeof err.status === "number" ? err.status : null,
                    latencyMs: Date.now() - t0,
                    bytes: bytes,
                    chars: 0
                });
                this.deliver(chunk.seq, "") // keep the seq slot so ordering holds
                ;
                this.o.onError(err instanceof Error ? err : new Error(String(err)), "chunk");
            }).finally(()=>{
                this.inflight--;
                this.pump();
            });
        }
    }
    async transcribe(chunk) {
        const controller = new AbortController();
        this.controllers.add(controller);
        try {
            const form = new FormData();
            form.append("file", chunk.wav, `chunk-${chunk.seq}.wav`);
            form.append("language", this.o.language);
            const authHeader = this.o.getAuthHeader ? this.o.getAuthHeader() : "";
            const res = await fetch(this.o.asrUrl, {
                method: "POST",
                headers: authHeader ? {
                    Authorization: authHeader
                } : {},
                body: form,
                signal: controller.signal
            });
            if (!res.ok) {
                const err = new Error(`ASR HTTP ${res.status}`);
                err.status = res.status;
                throw err;
            }
            const data = await res.json();
            return (data.text || "").trim();
        } finally{
            this.controllers.delete(controller);
        }
    }
    deliver(seq, text) {
        this.doneMap.set(seq, text);
        while(this.doneMap.has(this.nextEmit)){
            const t = this.doneMap.get(this.nextEmit);
            this.doneMap.delete(this.nextEmit);
            if (t) this.o.onPartial(t, this.nextEmit);
            this.nextEmit++;
        }
    }
    async drain() {
        while(this.queue.length || this.inflight || this.nextEmit < this.seq)await new Promise((r)=>setTimeout(r, 50));
    }
    // ── Plumbing ───────────────────────────────────────────────────────────
    sinceStart() {
        return this.startedAt ? Date.now() - this.startedAt : 0;
    }
    emitTelemetry(evt) {
        try {
            this.o.onTelemetry(evt);
        } catch (e) {
        // a telemetry listener must never be able to break dictation
        }
    }
    setState(s) {
        if (this.state === s) return;
        this.state = s;
        this.o.onStateChange(s);
    }
    teardownAudio() {
        try {
            this.node && this.node.port && this.node.port.close();
            this.node && this.node.disconnect();
            this.source && this.source.disconnect();
        } catch (_) {
        /* noop */ }
        this.stream && this.stream.getTracks().forEach((t)=>t.stop());
        this.ctx && this.ctx.close().catch(()=>{});
        if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
        this.node = null;
        this.source = null;
        this.stream = null;
        this.ctx = null;
        this.workletUrl = null;
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
    `;
        this.workletUrl = URL.createObjectURL(new Blob([
            code
        ], {
            type: "application/javascript"
        }));
        return this.workletUrl;
    }
}
function $e9499f34e7fc5d70$var$frameRms(a, start, end) {
    let sum = 0;
    for(let i = start; i < end; i++)sum += a[i] * a[i];
    return Math.sqrt(sum / (end - start));
}
function $e9499f34e7fc5d70$export$1ceb7a840e500dd1(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (off, s)=>{
        for(let i = 0; i < s.length; i++)view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let off = 44;
    for(let i = 0; i < samples.length; i++, off += 2){
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([
        buffer
    ], {
        type: "audio/wav"
    });
}


"use client";
const $0e1b765668e4d0aa$var$generateUuid = ()=>Math.random().toString(36).slice(2, 11);
const $0e1b765668e4d0aa$var$KEY_UP = "ArrowUp";
const $0e1b765668e4d0aa$var$KEY_DOWN = "ArrowDown";
const $0e1b765668e4d0aa$var$KEY_LEFT = "ArrowLeft";
const $0e1b765668e4d0aa$var$KEY_RIGHT = "ArrowRight";
const $0e1b765668e4d0aa$var$KEY_ESCAPE = "Escape";
const $0e1b765668e4d0aa$var$OPTION_LIST_Y_OFFSET = 10;
const $0e1b765668e4d0aa$var$OPTION_LIST_MIN_WIDTH = 100;
const $0e1b765668e4d0aa$export$a62758b764e9e41d = ({ renderComponent: renderComponent = (props)=>/*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsx)("input", {
        ...props
    }), lang: lang = "hi", offsetX: offsetX = 0, offsetY: offsetY = 10, onChange: onChange, onChangeText: onChangeText, onBlur: onBlur, value: value, onKeyDown: onKeyDown, containerClassName: containerClassName = "", containerStyles: containerStyles = {}, activeItemStyles: activeItemStyles = {}, maxOptions: maxOptions = 5, hideSuggestionBoxOnMobileDevices: hideSuggestionBoxOnMobileDevices = false, hideSuggestionBoxBreakpoint: hideSuggestionBoxBreakpoint = 640, triggerKeys: triggerKeys = [
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_SPACE,
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_ENTER,
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_RETURN,
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_TAB
], insertCurrentSelectionOnBlur: insertCurrentSelectionOnBlur = true, showCurrentWordAsLastSuggestion: showCurrentWordAsLastSuggestion = true, enabled: enabled = true, horizontalView: horizontalView = false, suggestionListClassName: suggestionListClassName = "", suggestionItemClassName: suggestionItemClassName = "", activeSuggestionItemClassName: activeSuggestionItemClassName = "", customApiURL: customApiURL = (0, $2b6bcc00ef7a3078$export$a238c5e20ae27fe7), apiKey: apiKey = "", enableASR: enableASR = false, asrApiUrl: asrApiUrl = "", micButtonRef: micButtonRef = null, onVoiceTypingStateChange: onVoiceTypingStateChange = null, asrStreaming: // Opt-in real-time streaming dictation: VAD segments the mic at pauses and
// transcribes each chunk as you speak (vs the default single-shot record →
// transcribe-on-stop). `asrStreamingOptions` passes tunables through to the
// StreamingDictation controller (minUtteranceSec, hardMaxSec, …).
asrStreaming = false, asrStreamingOptions: asrStreamingOptions = {}, onAsrTelemetry: // Telemetry hook: receives the StreamingDictation controller's events (start, cut, dropped,
// asr, end) and, in single-shot mode, one `asr` event per recording. Sizes, timings and
// reasons only — never audio or text. Optional; errors in the listener are swallowed.
onAsrTelemetry = null, onTransliterationError: // Transliteration lookups fail silently by design (typing must never block); this reports
// each failure as {status, latencyMs} — never the word — so a host can count them.
onTransliterationError = null, ...rest })=>{
    const [left, setLeft] = (0, $jECdM$react.useState)(0);
    const [top, setTop] = (0, $jECdM$react.useState)(0);
    const [selection, setSelection] = (0, $jECdM$react.useState)(0);
    const [matchStart, setMatchStart] = (0, $jECdM$react.useState)(-1);
    const [matchEnd, setMatchEnd] = (0, $jECdM$react.useState)(-1);
    const inputRef = (0, $jECdM$react.useRef)(null);
    const [windowSize, setWindowSize] = (0, $jECdM$react.useState)({
        width: 0,
        height: 0
    });
    const [direction, setDirection] = (0, $jECdM$react.useState)("ltr");
    const [googleFont, setGoogleFont] = (0, $jECdM$react.useState)(null);
    const [options, setOptions] = (0, $jECdM$react.useState)([]);
    const [logJsonArray, setLogJsonArray] = (0, $jECdM$react.useState)([]);
    const [numSpaces, setNumSpaces] = (0, $jECdM$react.useState)(0);
    const [parentUuid, setParentUuid] = (0, $jECdM$react.useState)("0");
    const [uuid, setUuid] = (0, $jECdM$react.useState)("");
    const [subStrLength, setSubStrLength] = (0, $jECdM$react.useState)(0);
    const [restart, setRestart] = (0, $jECdM$react.useState)(true);
    (0, $jECdM$react.useEffect)(()=>{
        setUuid($0e1b765668e4d0aa$var$generateUuid());
    }, []);
    const shouldRenderSuggestions = (0, $jECdM$react.useMemo)(()=>hideSuggestionBoxOnMobileDevices ? windowSize.width > hideSuggestionBoxBreakpoint : true, [
        windowSize,
        hideSuggestionBoxBreakpoint,
        hideSuggestionBoxOnMobileDevices
    ]);
    const reset = ()=>{
        // reset the component
        setSelection(0);
        setOptions([]);
    };
    const lastTextValue = (0, $jECdM$react.useRef)(null);
    const voiceLogs = (0, $jECdM$react.useRef)([]);
    const handleSelection = (index)=>{
        const currentString = value;
        // create a new string with the currently typed word
        // replaced with the word in transliterated language
        const newValue = currentString.substring(0, matchStart) + options[index] + " " + currentString.substring(matchEnd + 1, currentString.length);
        if (logJsonArray.length) {
            let lastLogJson = logJsonArray[logJsonArray.length - 1];
            let logJson = {
                keystrokes: lastLogJson.keystrokes,
                results: lastLogJson.results,
                opted: options[index],
                created_at: new Date().toISOString(),
                language: lang
            };
            setLogJsonArray([
                ...logJsonArray,
                logJson
            ]);
            setNumSpaces(numSpaces + 1);
        }
        // set the position of the caret (cursor) one character after the
        // the position of the new word
        setTimeout(()=>{
            (0, $9f468a725b3358f7$export$97ab23b40042f8af)(inputRef.current, matchStart + options[index].length + 1);
        }, 1);
        // bubble up event to the parent component
        const e = {
            target: {
                value: newValue
            }
        };
        onChangeText(newValue);
        onChange && onChange(e);
        if (lastTextValue.current != null & voiceLogs.current == []) {
            const currentValue = newValue;
            let changeStart = 0;
            while(changeStart < lastTextValue.current.length && changeStart < currentValue.length && lastTextValue.current[changeStart] === currentValue[changeStart])changeStart++;
            const lengthDelta = currentValue.length - lastTextValue.current.length;
            voiceLogs.current.forEach((log)=>{
                if (changeStart > log.end) return;
                if (changeStart <= log.start) {
                    log.start += lengthDelta;
                    log.end += lengthDelta;
                }
                if (changeStart > log.start && changeStart <= log.end) log.end += lengthDelta;
                log.correctedText = currentValue.slice(log.start, log.end);
            });
            if (typeof window !== "undefined") localStorage.setItem("voiceLogs", JSON.stringify(voiceLogs.current));
            lastTextValue.current = currentValue;
        }
        reset();
        return inputRef.current?.focus();
    };
    const renderSuggestions = async (lastWord, wholeText)=>{
        if (!shouldRenderSuggestions) return;
        // fetch suggestion from api
        // const url = `https://www.google.com/inputtools/request?ime=transliteration_en_${lang}&num=5&cp=0&cs=0&ie=utf-8&oe=utf-8&app=jsapi&text=${lastWord}`;
        // const numOptions = showCurrentWordAsLastSuggestion
        //   ? maxOptions - 1
        //   : maxOptions;
        const data = await (0, $857753f052b25831$export$27f30d10c00bcc6c)(lastWord, customApiURL, apiKey, {
            showCurrentWordAsLastSuggestion: // numOptions,
            showCurrentWordAsLastSuggestion,
            lang: lang,
            onError: onTransliterationError
        });
        setOptions(data ?? []);
        let logJson = {
            keystrokes: wholeText,
            results: data,
            opted: "",
            created_at: new Date().toISOString(),
            language: lang
        };
        if (restart) {
            setRestart(false);
            setLogJsonArray([
                logJson
            ]);
        } else setLogJsonArray([
            ...logJsonArray,
            logJson
        ]);
    };
    // const getDirectionAndFont = async lang => {
    //   const langList = await getTransliterationLanguages()
    //   const langObj = langList?.find(l => l.LangCode === lang)
    //   return [
    //     langObj?.Direction ?? "ltr",
    //     langObj?.GoogleFont,
    //     langObj?.FallbackFont
    //   ]
    // }
    const handleChange = (e)=>{
        const value = e.currentTarget.value;
        if (numSpaces == 0 || restart) {
            if (value.length >= 4) setSubStrLength(value.length - 4);
            else setSubStrLength(0);
        }
        if (numSpaces >= 5) {
            const finalJson = {
                uuid: uuid,
                parent_uuid: parentUuid,
                word: value,
                source: typeof window !== "undefined" ? localStorage.getItem("source") != undefined ? localStorage.getItem("source") : "node-module" : "node-module",
                language: lang,
                steps: logJsonArray
            };
            setLogJsonArray([]);
            setParentUuid(uuid);
            setUuid($0e1b765668e4d0aa$var$generateUuid());
            setSubStrLength(value.length - 2);
            setNumSpaces(0);
            setRestart(true);
            fetch("https://backend.shoonya.ai4bharat.org/logs/transliteration_selection/", {
                method: "POST",
                body: JSON.stringify(finalJson),
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(async (res)=>{
                if (!res.ok) throw await res.json();
            }).catch((err)=>{
                console.log("error", err);
            });
        }
        // bubble up event to the parent component
        onChange && onChange(e);
        onChangeText(value);
        if (!shouldRenderSuggestions) return;
        // get the current index of the cursor
        const caret = (0, $9f468a725b3358f7$export$8a4ff65f970d59a5)(e.target).end;
        const input = inputRef.current;
        if (!input) return;
        const caretPos = (0, ($parcel$interopDefault($jECdM$textareacaret)))(input, caret);
        // search for the last occurence of the space character from
        // the cursor
        const indexOfLastSpace = value.lastIndexOf(" ", caret - 1) < value.lastIndexOf("\n", caret - 1) ? value.lastIndexOf("\n", caret - 1) : value.lastIndexOf(" ", caret - 1);
        // first character of the currently being typed word is
        // one character after the space character
        // index of last character is one before the current position
        // of the caret
        setMatchStart(indexOfLastSpace + 1);
        setMatchEnd(caret - 1);
        // currentWord is the word that is being typed
        const currentWord = value.slice(indexOfLastSpace + 1, caret);
        if (currentWord && enabled) {
            // make an api call to fetch suggestions
            if (numSpaces == 0 || restart) {
                if (value.length >= 4) renderSuggestions(currentWord, value.substr(value.length - 4, value.length));
                else renderSuggestions(currentWord, value.substr(0, value.length));
            } else renderSuggestions(currentWord, value.substr(subStrLength, value.length));
            const rect = input.getBoundingClientRect();
            // calculate new left and top of the suggestion list
            // minimum of the caret position in the text input and the
            // width of the text input
            const left = Math.min(caretPos.left, rect.width - $0e1b765668e4d0aa$var$OPTION_LIST_MIN_WIDTH / 2);
            // minimum of the caret position from the top of the input
            // and the height of the input
            const top = Math.min(caretPos.top + $0e1b765668e4d0aa$var$OPTION_LIST_Y_OFFSET, rect.height);
            setTop(top);
            setLeft(left);
        } else reset();
    };
    const handleKeyDown = (event)=>{
        const helperVisible = options.length > 0;
        if (helperVisible) {
            if (triggerKeys.includes(event.key)) {
                event.preventDefault();
                handleSelection(selection);
            } else switch(event.key){
                case $0e1b765668e4d0aa$var$KEY_ESCAPE:
                    event.preventDefault();
                    reset();
                    break;
                case $0e1b765668e4d0aa$var$KEY_UP:
                    event.preventDefault();
                    setSelection((options.length + selection - 1) % options.length);
                    break;
                case $0e1b765668e4d0aa$var$KEY_DOWN:
                    event.preventDefault();
                    setSelection((selection + 1) % options.length);
                    break;
                case $0e1b765668e4d0aa$var$KEY_LEFT:
                    event.preventDefault();
                    setSelection((options.length + selection - 1) % options.length);
                    break;
                case $0e1b765668e4d0aa$var$KEY_RIGHT:
                    event.preventDefault();
                    setSelection((selection + 1) % options.length);
                    break;
                default:
                    onKeyDown && onKeyDown(event);
                    break;
            }
        } else onKeyDown && onKeyDown(event);
    };
    const handleBlur = (event)=>{
        reset();
        onBlur && onBlur(event);
    };
    const handleResize = ()=>{
        // TODO implement the resize function to resize
        // the helper on screen size change
        const width = window.innerWidth;
        const height = window.innerHeight;
        setWindowSize({
            width: width,
            height: height
        });
    };
    (0, $jECdM$react.useEffect)(()=>{
        window.addEventListener("resize", handleResize);
        const width = window.innerWidth;
        const height = window.innerHeight;
        setWindowSize({
            width: width,
            height: height
        });
        return ()=>{
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    // useEffect(() => {
    //   getDirectionAndFont(lang).then(([direction, googleFont, fallbackFont]) => {
    //     setDirection(direction)
    //     // import google font if not already imported
    //     if (googleFont) {
    //       if (!document.getElementById(`font-${googleFont}`)) {
    //         const link = document.createElement("link")
    //         link.id = `font-${googleFont}`
    //         link.href = `https://fonts.googleapis.com/css?family=${googleFont}`
    //         link.rel = "stylesheet"
    //         document.head.appendChild(link)
    //       }
    //       setGoogleFont(`${googleFont}, ${fallbackFont ?? "sans-serif"}`)
    //     } else {
    //       setGoogleFont(null)
    //     }
    //   })
    // }, [lang])
    const [isRecording, setIsRecording] = (0, $jECdM$react.useState)(false);
    const [isLoading, setIsLoading] = (0, $jECdM$react.useState)(false);
    const mediaRecorderRef = (0, $jECdM$react.useRef)(null);
    const audioChunksRef = (0, $jECdM$react.useRef)([]);
    // Streaming dictation (opt-in via asrStreaming): the controller owns the mic
    // and emits ordered transcript chunks; each is inserted at an advancing caret.
    const dictationRef = (0, $jECdM$react.useRef)(null);
    const insertPosRef = (0, $jECdM$react.useRef)(0);
    const valueRef = (0, $jECdM$react.useRef)(value);
    (0, $jECdM$react.useEffect)(()=>{
        valueRef.current = value;
    });
    // Insert one streamed transcript chunk at the advancing caret, reading the
    // LIVE value (via ref) so successive chunks don't clobber each other.
    const insertDictatedChunk = (text)=>{
        const cur = valueRef.current ?? "";
        let pos = insertPosRef.current;
        if (pos == null || pos > cur.length) pos = cur.length;
        const needsSpace = pos > 0 && !/\s$/.test(cur.slice(0, pos));
        const piece = (needsSpace ? " " : "") + text;
        const newValue = cur.slice(0, pos) + piece + cur.slice(pos);
        insertPosRef.current = pos + piece.length;
        onChange?.({
            target: {
                value: newValue
            }
        });
        onChangeText?.(newValue);
    };
    const handleStreamingVoiceTyping = async ()=>{
        if (!navigator.mediaDevices) {
            alert("Browser doesn't support audio recording.");
            return;
        }
        // Second click while recording → finalize (flush tail + drain).
        if (dictationRef.current && dictationRef.current.getState() === "recording") {
            onVoiceTypingStateChange?.('loading');
            try {
                await dictationRef.current.stop();
            } catch (err) {
                console.error("Streaming dictation stop error:", err);
            }
            return;
        }
        // First click → start. Anchor inserts at the current caret (or end).
        const target = inputRef.current;
        insertPosRef.current = target ? target.selectionStart ?? (value ? value.length : 0) : value ? value.length : 0;
        const dictation = new (0, $e9499f34e7fc5d70$export$eae2660aea493150)({
            ...asrStreamingOptions,
            asrUrl: asrApiUrl,
            language: lang,
            getAuthHeader: ()=>apiKey,
            onPartial: insertDictatedChunk,
            onTelemetry: (evt)=>{
                try {
                    onAsrTelemetry?.(evt);
                } catch (e) {}
            },
            onStateChange: (s)=>{
                if (s === "recording") {
                    setIsRecording(true);
                    setIsLoading(false);
                    onVoiceTypingStateChange?.('recording');
                } else if (s === "finalizing") {
                    setIsRecording(false);
                    setIsLoading(true);
                    onVoiceTypingStateChange?.('loading');
                } else if (s === "idle") {
                    setIsRecording(false);
                    setIsLoading(false);
                    onVoiceTypingStateChange?.('idle');
                } else if (s === "error") {
                    setIsRecording(false);
                    setIsLoading(false);
                    onVoiceTypingStateChange?.('error');
                }
            },
            onError: (err, kind)=>{
                if (kind === "fatal") {
                    setIsRecording(false);
                    setIsLoading(false);
                    onVoiceTypingStateChange?.('error');
                } else // One chunk failed; recording continues. Host may choose to toast.
                console.warn("ASR chunk failed:", err);
            }
        });
        dictationRef.current = dictation;
        try {
            await dictation.start();
        } catch (err) {
            console.error("Error starting streaming dictation:", err);
            dictationRef.current = null;
        }
    };
    const handleVoiceTyping = async ()=>{
        if (asrStreaming) return handleStreamingVoiceTyping();
        if (!navigator.mediaDevices) {
            alert("Browser doesn't support audio recording.");
            return;
        }
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            setIsLoading(true);
            onVoiceTypingStateChange?.('loading');
        } else try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event)=>{
                audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = async ()=>{
                setIsLoading(true);
                onVoiceTypingStateChange?.('loading');
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm"
                });
                const asrStartedAt = Date.now();
                try {
                    const transcript = await transcribeAudio(asrApiUrl, lang, audioBlob);
                    try {
                        onAsrTelemetry?.({
                            type: "asr",
                            seq: 0,
                            ok: true,
                            status: 200,
                            latencyMs: Date.now() - asrStartedAt,
                            bytes: audioBlob.size,
                            chars: (transcript || "").length
                        });
                    } catch (e) {}
                    const target = inputRef.current;
                    if (target && transcript) {
                        const cursorPos = target.selectionStart;
                        const currentText = value;
                        const newValue = currentText.slice(0, cursorPos) + transcript + currentText.slice(cursorPos);
                        const e = {
                            target: {
                                value: newValue
                            }
                        };
                        onChange?.(e);
                        onChangeText(newValue);
                    }
                    onVoiceTypingStateChange?.('idle');
                } catch (err) {
                    // Surface the failure to the host instead of silently inserting an
                    // empty string, so it can toast / re-enable the mic.
                    console.error("Transcription API error:", err);
                    onVoiceTypingStateChange?.('error');
                } finally{
                    setIsLoading(false);
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
            onVoiceTypingStateChange?.('recording');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setIsRecording(false);
            setIsLoading(false);
            onVoiceTypingStateChange?.('idle');
        }
    };
    // Transcribe an audio Blob against an OpenAI-audio-style ASR endpoint
    // (e.g. Bodhan's `POST /api/v1/asr/transcriptions/`): multipart `file` +
    // `language`, response `{ text }`. `apiKey`, when set, is sent verbatim as
    // the Authorization header (the host passes a full `Bearer <token>` there).
    // NOTE: no explicit Content-Type — the browser must set the multipart
    // boundary itself. Throws on a non-2xx so the caller can surface it.
    async function transcribeAudio(apiURL, lang, audioBlob) {
        const form = new FormData();
        form.append("file", audioBlob, "audio.webm");
        form.append("language", lang);
        const response = await fetch(apiURL, {
            method: "POST",
            headers: apiKey ? {
                Authorization: apiKey
            } : {},
            body: form
        });
        if (!response.ok) {
            let detail = "";
            try {
                detail = (await response.json())?.detail || "";
            } catch (_) {
            // non-JSON error body — fall back to the status
            }
            const error = new Error(detail || `ASR request failed (${response.status})`);
            error.status = response.status;
            throw error;
        }
        const result = await response.json();
        return result.text || "";
    }
    (0, $jECdM$react.useEffect)(()=>{
        if (enableASR && micButtonRef?.current) {
            const button = micButtonRef.current;
            button.addEventListener('click', handleVoiceTyping);
            return ()=>{
                button.removeEventListener('click', handleVoiceTyping);
                if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
                    mediaRecorderRef.current.stream.getTracks().forEach((track)=>track.stop());
                }
            };
        }
    }, [
        enableASR,
        asrStreaming,
        micButtonRef,
        isRecording,
        value,
        lang,
        apiKey
    ]);
    // Cancel any in-flight streaming dictation on UNMOUNT only. This must be its
    // own effect with empty deps: the mic-bind effect above re-runs on every
    // `value` change (each inserted chunk), and cancelling there would abort the
    // dictation mid-utterance.
    (0, $jECdM$react.useEffect)(()=>{
        return ()=>{
            dictationRef.current?.cancel();
            dictationRef.current = null;
        };
    }, []);
    return /*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsxs)((0, $jECdM$reactjsxruntime.Fragment), {
        children: [
            renderComponent({
                onChange: handleChange,
                onKeyDown: handleKeyDown,
                onBlur: handleBlur,
                ref: inputRef,
                value: value,
                "data-testid": "rt-input-component",
                lang: lang,
                style: {
                    direction: direction,
                    ...googleFont && {
                        fontFamily: googleFont
                    }
                },
                // className: rest.className,
                ...rest
            }),
            shouldRenderSuggestions && options.length > 0 && /*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsx)("ul", {
                onMouseDown: (e)=>e.preventDefault(),
                style: {
                    position: "absolute",
                    zIndex: 20000,
                    ...googleFont && {
                        fontFamily: googleFont
                    }
                },
                className: suggestionListClassName,
                "data-testid": "rt-suggestions-list",
                lang: lang,
                role: "listbox",
                children: Array.from(new Set(options)).map((item, index)=>/*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsx)("li", {
                        className: index === selection ? activeSuggestionItemClassName : suggestionItemClassName,
                        onMouseEnter: ()=>{
                            setSelection(index);
                        },
                        onClick: ()=>handleSelection(index),
                        role: "option",
                        "aria-selected": index === selection,
                        children: item
                    }, item))
            })
        ]
    });
};
 // export { getTransliterationLanguages }


//# sourceMappingURL=index.js.map
