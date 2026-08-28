import {jsx as $WrkLT$jsx, jsxs as $WrkLT$jsxs, Fragment as $WrkLT$Fragment} from "react/jsx-runtime";
import {useState as $WrkLT$useState, useRef as $WrkLT$useRef, useEffect as $WrkLT$useEffect, useMemo as $WrkLT$useMemo} from "react";
import $WrkLT$textareacaret from "textarea-caret";



function $9acf2116f29b30de$export$e27e3030245d4c9b() {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}


function $7e3a6698d06df721$export$8a4ff65f970d59a5(el) {
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
function $7e3a6698d06df721$export$97ab23b40042f8af(elem, caretPos) {
    if (elem) {
        if (elem.selectionStart) {
            elem.focus();
            elem.setSelectionRange(caretPos, caretPos);
        } else elem.focus();
    }
}





const $871e300faf449d5f$export$24b0ea3375909d37 = {
    KEY_RETURN: "Enter",
    KEY_ENTER: "Enter",
    KEY_TAB: "Tab",
    KEY_SPACE: " "
};


const $cb083382c5991590$var$MAX_CACHE_SIZE = 10000;
const $cb083382c5991590$var$SAVE_THRESHOLD = 20;
const $cb083382c5991590$var$CACHE_KEY = "transliterationCache";
const $cb083382c5991590$var$cache = $cb083382c5991590$var$loadCacheFromLocalStorage();
let $cb083382c5991590$var$newEntriesCount = 0;
function $cb083382c5991590$var$loadCacheFromLocalStorage() {
    if (typeof window === "undefined") return {};
    try {
        const cachedData = window.localStorage.getItem($cb083382c5991590$var$CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : {};
    } catch (e) {
        return {};
    }
}
function $cb083382c5991590$var$saveCacheToLocalStorage() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem($cb083382c5991590$var$CACHE_KEY, JSON.stringify($cb083382c5991590$var$cache));
    } catch (e) {
    // storage disabled, quota exceeded, or SecurityError — ignore
    }
}
const $cb083382c5991590$var$getWordWithLowestFrequency = (dictionary)=>{
    let lowestFreqWord = null;
    let lowestFreq = Infinity;
    for(const word in dictionary)if (dictionary[word].frequency < lowestFreq) {
        lowestFreq = dictionary[word].frequency;
        lowestFreqWord = word;
    }
    return lowestFreqWord;
};
const $cb083382c5991590$export$27f30d10c00bcc6c = async (word, customApiURL, apiKey, config)=>{
    const { showCurrentWordAsLastSuggestion: // numOptions = 5,
    showCurrentWordAsLastSuggestion = true, lang: lang = "hi" } = config || {};
    // fetch suggestion from api
    // const url = `https://www.google.com/inputtools/request?ime=transliteration_en_${lang}&num=5&cp=0&cs=0&ie=utf-8&oe=utf-8&app=jsapi&text=${word}`;
    // let myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");
    if (!$cb083382c5991590$var$cache[lang]) $cb083382c5991590$var$cache[lang] = {};
    if ($cb083382c5991590$var$cache[lang][word.toLowerCase()]) {
        $cb083382c5991590$var$cache[lang][word.toLowerCase()].frequency += 1;
        return $cb083382c5991590$var$cache[lang][word.toLowerCase()].suggestions;
    }
    const requestOptions = {
        method: "GET",
        headers: {
            Authorization: apiKey
        }
    };
    try {
        const res = await fetch(customApiURL + `${lang}/${word === "." || word === ".." ? " " + word.replace(".", "%2E") : encodeURIComponent(word).replace(".", "%2E")}`, requestOptions);
        let data = await res.json();
        console.log("library data", data);
        if (!customApiURL.includes("xlit-api")) data.result = data.output[0].target;
        if (data && data.result.length > 0) {
            const found = showCurrentWordAsLastSuggestion ? [
                ...data.result,
                word
            ] : data.result;
            if (Object.keys($cb083382c5991590$var$cache[lang]).length >= $cb083382c5991590$var$MAX_CACHE_SIZE) {
                const lowestFreqWord = $cb083382c5991590$var$getWordWithLowestFrequency($cb083382c5991590$var$cache[lang]);
                if (lowestFreqWord) delete $cb083382c5991590$var$cache[lang][lowestFreqWord];
            }
            $cb083382c5991590$var$cache[lang][word.toLowerCase()] = {
                suggestions: found,
                frequency: 1
            };
            $cb083382c5991590$var$newEntriesCount += 1;
            if ($cb083382c5991590$var$newEntriesCount >= $cb083382c5991590$var$SAVE_THRESHOLD) {
                $cb083382c5991590$var$saveCacheToLocalStorage();
                $cb083382c5991590$var$newEntriesCount = 0;
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
        // catch error
        console.error("There was an error with transliteration", e);
        return [];
    }
};
if (typeof window !== "undefined") window.addEventListener("beforeunload", $cb083382c5991590$var$saveCacheToLocalStorage);


const $380c1a0df2fde1d3$export$ca6dda5263526f75 = "https://xlit-api.ai4bharat.org/";
const $380c1a0df2fde1d3$export$a238c5e20ae27fe7 = "https://xlit-api.ai4bharat.org/tl/";


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
 */ const $f85798d3c097ff85$var$FRAME_MS = 30 // VAD analysis frame
;
const $f85798d3c097ff85$var$DEFAULTS = {
    targetSampleRate: 16000,
    minUtteranceSec: 4,
    softMaxSec: 22,
    hardMaxSec: 26,
    silenceHangMsNormal: 650,
    silenceHangMsEager: 180,
    speechOnsetMs: 120,
    trailingPadMs: 150,
    minSpeechToSendSec: 0.4,
    maxConcurrentAsr: 2
};
const $f85798d3c097ff85$var$noop = ()=>{};
class $f85798d3c097ff85$export$eae2660aea493150 {
    constructor(options){
        this.o = {
            ...$f85798d3c097ff85$var$DEFAULTS,
            onPartial: $f85798d3c097ff85$var$noop,
            onStateChange: $f85798d3c097ff85$var$noop,
            onError: $f85798d3c097ff85$var$noop,
            onLevel: $f85798d3c097ff85$var$noop,
            ...options
        };
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
        this.frameSamples = Math.round(this.targetRate * $f85798d3c097ff85$var$FRAME_MS / 1000);
        this.frameBuf = new Float32Array(this.frameSamples);
        this.frameFill = 0;
        this.resampleCarry = 0;
        // VAD state
        this.noiseFloor = 0.003;
        this.inSpeech = false;
        this.silenceRun = 0;
        this.speechRun = 0;
        this.hangMs = this.o.silenceHangMsNormal;
        // current utterance buffer
        this.buf = [];
        this.bufSamples = 0;
        this.speechSamples = 0;
        this.sawSpeech = false;
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
        this.flush(true, true) // send the tail even if < minUtterance
        ;
        await this.drain();
        this.setState("idle");
    }
    cancel() {
        this.teardownAudio();
        for (const c of this.controllers)c.abort();
        this.controllers.clear();
        this.queue = [];
        this.doneMap.clear();
        this.resetBuffer();
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
        let sum = 0;
        for(let i = 0; i < frame.length; i++)sum += frame[i] * frame[i];
        const rms = Math.sqrt(sum / frame.length);
        if (rms < this.noiseFloor) this.noiseFloor = rms;
        else this.noiseFloor += (rms - this.noiseFloor) * 0.02;
        const threshold = Math.max(this.noiseFloor * 3.5, 0.006);
        const voiced = rms > threshold;
        this.o.onLevel(rms, voiced);
        if (voiced) {
            this.speechRun += $f85798d3c097ff85$var$FRAME_MS;
            this.silenceRun = 0;
            if (!this.inSpeech && this.speechRun >= this.o.speechOnsetMs) this.inSpeech = true;
        } else {
            this.silenceRun += $f85798d3c097ff85$var$FRAME_MS;
            this.speechRun = 0;
        }
        if (!this.sawSpeech && !this.inSpeech) return; // leading-silence trim
        if (this.inSpeech) this.sawSpeech = true;
        this.buf.push(frame.slice());
        this.bufSamples += frame.length;
        if (voiced) this.speechSamples += frame.length;
        const bufSec = this.bufSamples / this.targetRate;
        this.hangMs = bufSec >= this.o.softMaxSec ? this.o.silenceHangMsEager : this.o.silenceHangMsNormal;
        if (this.sawSpeech && !this.inSpeech && this.silenceRun >= this.hangMs) {
            if (this.speechSamples / this.targetRate >= this.o.minUtteranceSec) this.flush(false, false);
            return;
        }
        if (bufSec >= this.o.hardMaxSec) this.flush(true, false);
    }
    // ── Flush: cut the buffer -> WAV -> enqueue ASR ────────────────────────
    flush(force, isFinal) {
        if (this.bufSamples === 0) return;
        const speechSec = this.speechSamples / this.targetRate;
        if (speechSec < this.o.minSpeechToSendSec && !isFinal) {
            this.resetBuffer();
            return;
        }
        const merged = this.mergeBuf();
        let cut = merged.length;
        let carry = null;
        if (force && !isFinal) {
            cut = this.quietestCut(merged);
            if (cut < merged.length) carry = merged.slice(cut);
        } else {
            const pad = Math.round(this.targetRate * this.o.trailingPadMs / 1000);
            cut = Math.min(merged.length, this.lastSpeechIndex(merged) + pad);
        }
        const wav = $f85798d3c097ff85$export$1ceb7a840e500dd1(merged.subarray(0, cut), this.targetRate);
        this.enqueue({
            seq: this.seq++,
            wav: wav
        });
        this.resetBuffer();
        if (carry && carry.length) {
            this.buf.push(carry);
            this.bufSamples = carry.length;
            this.speechSamples = carry.length;
            this.sawSpeech = true;
        }
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
    resetBuffer() {
        this.buf = [];
        this.bufSamples = 0;
        this.speechSamples = 0;
        this.sawSpeech = false;
        this.inSpeech = false;
        this.silenceRun = 0;
        this.speechRun = 0;
        this.hangMs = this.o.silenceHangMsNormal;
    }
    lastSpeechIndex(a) {
        const win = this.frameSamples;
        const thr = Math.max(this.noiseFloor * 3.5, 0.006);
        for(let end = a.length; end > 0; end -= win){
            const start = Math.max(0, end - win);
            let sum = 0;
            for(let i = start; i < end; i++)sum += a[i] * a[i];
            if (Math.sqrt(sum / (end - start)) > thr) return end;
        }
        return a.length;
    }
    quietestCut(a) {
        const win = this.frameSamples;
        const lookback = Math.min(a.length, this.targetRate) // last 1s
        ;
        let best = a.length;
        let bestRms = Infinity;
        for(let end = a.length; end > a.length - lookback; end -= win){
            const start = Math.max(0, end - win);
            let sum = 0;
            for(let i = start; i < end; i++)sum += a[i] * a[i];
            const rms = Math.sqrt(sum / (end - start));
            if (rms < bestRms) {
                bestRms = rms;
                best = end;
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
            this.transcribe(chunk).then((text)=>this.deliver(chunk.seq, text)).catch((err)=>{
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
function $f85798d3c097ff85$export$1ceb7a840e500dd1(samples, sampleRate) {
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
const $86cfb7ad4842cd1e$var$generateUuid = ()=>Math.random().toString(36).slice(2, 11);
const $86cfb7ad4842cd1e$var$KEY_UP = "ArrowUp";
const $86cfb7ad4842cd1e$var$KEY_DOWN = "ArrowDown";
const $86cfb7ad4842cd1e$var$KEY_LEFT = "ArrowLeft";
const $86cfb7ad4842cd1e$var$KEY_RIGHT = "ArrowRight";
const $86cfb7ad4842cd1e$var$KEY_ESCAPE = "Escape";
const $86cfb7ad4842cd1e$var$OPTION_LIST_Y_OFFSET = 10;
const $86cfb7ad4842cd1e$var$OPTION_LIST_MIN_WIDTH = 100;
const $86cfb7ad4842cd1e$export$a62758b764e9e41d = ({ renderComponent: renderComponent = (props)=>/*#__PURE__*/ (0, $WrkLT$jsx)("input", {
        ...props
    }), lang: lang = "hi", offsetX: offsetX = 0, offsetY: offsetY = 10, onChange: onChange, onChangeText: onChangeText, onBlur: onBlur, value: value, onKeyDown: onKeyDown, containerClassName: containerClassName = "", containerStyles: containerStyles = {}, activeItemStyles: activeItemStyles = {}, maxOptions: maxOptions = 5, hideSuggestionBoxOnMobileDevices: hideSuggestionBoxOnMobileDevices = false, hideSuggestionBoxBreakpoint: hideSuggestionBoxBreakpoint = 640, triggerKeys: triggerKeys = [
    (0, $871e300faf449d5f$export$24b0ea3375909d37).KEY_SPACE,
    (0, $871e300faf449d5f$export$24b0ea3375909d37).KEY_ENTER,
    (0, $871e300faf449d5f$export$24b0ea3375909d37).KEY_RETURN,
    (0, $871e300faf449d5f$export$24b0ea3375909d37).KEY_TAB
], insertCurrentSelectionOnBlur: insertCurrentSelectionOnBlur = true, showCurrentWordAsLastSuggestion: showCurrentWordAsLastSuggestion = true, enabled: enabled = true, horizontalView: horizontalView = false, suggestionListClassName: suggestionListClassName = "", suggestionItemClassName: suggestionItemClassName = "", activeSuggestionItemClassName: activeSuggestionItemClassName = "", customApiURL: customApiURL = (0, $380c1a0df2fde1d3$export$a238c5e20ae27fe7), apiKey: apiKey = "", enableASR: enableASR = false, asrApiUrl: asrApiUrl = "", micButtonRef: micButtonRef = null, onVoiceTypingStateChange: onVoiceTypingStateChange = null, asrStreaming: // Opt-in real-time streaming dictation: VAD segments the mic at pauses and
// transcribes each chunk as you speak (vs the default single-shot record →
// transcribe-on-stop). `asrStreamingOptions` passes tunables through to the
// StreamingDictation controller (minUtteranceSec, hardMaxSec, …).
asrStreaming = false, asrStreamingOptions: asrStreamingOptions = {}, ...rest })=>{
    const [left, setLeft] = (0, $WrkLT$useState)(0);
    const [top, setTop] = (0, $WrkLT$useState)(0);
    const [selection, setSelection] = (0, $WrkLT$useState)(0);
    const [matchStart, setMatchStart] = (0, $WrkLT$useState)(-1);
    const [matchEnd, setMatchEnd] = (0, $WrkLT$useState)(-1);
    const inputRef = (0, $WrkLT$useRef)(null);
    const [windowSize, setWindowSize] = (0, $WrkLT$useState)({
        width: 0,
        height: 0
    });
    const [direction, setDirection] = (0, $WrkLT$useState)("ltr");
    const [googleFont, setGoogleFont] = (0, $WrkLT$useState)(null);
    const [options, setOptions] = (0, $WrkLT$useState)([]);
    const [logJsonArray, setLogJsonArray] = (0, $WrkLT$useState)([]);
    const [numSpaces, setNumSpaces] = (0, $WrkLT$useState)(0);
    const [parentUuid, setParentUuid] = (0, $WrkLT$useState)("0");
    const [uuid, setUuid] = (0, $WrkLT$useState)("");
    const [subStrLength, setSubStrLength] = (0, $WrkLT$useState)(0);
    const [restart, setRestart] = (0, $WrkLT$useState)(true);
    (0, $WrkLT$useEffect)(()=>{
        setUuid($86cfb7ad4842cd1e$var$generateUuid());
    }, []);
    const shouldRenderSuggestions = (0, $WrkLT$useMemo)(()=>hideSuggestionBoxOnMobileDevices ? windowSize.width > hideSuggestionBoxBreakpoint : true, [
        windowSize,
        hideSuggestionBoxBreakpoint,
        hideSuggestionBoxOnMobileDevices
    ]);
    const reset = ()=>{
        // reset the component
        setSelection(0);
        setOptions([]);
    };
    const lastTextValue = (0, $WrkLT$useRef)(null);
    const voiceLogs = (0, $WrkLT$useRef)([]);
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
            (0, $7e3a6698d06df721$export$97ab23b40042f8af)(inputRef.current, matchStart + options[index].length + 1);
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
        const data = await (0, $cb083382c5991590$export$27f30d10c00bcc6c)(lastWord, customApiURL, apiKey, {
            showCurrentWordAsLastSuggestion: // numOptions,
            showCurrentWordAsLastSuggestion,
            lang: lang
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
            setUuid($86cfb7ad4842cd1e$var$generateUuid());
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
        const caret = (0, $7e3a6698d06df721$export$8a4ff65f970d59a5)(e.target).end;
        const input = inputRef.current;
        if (!input) return;
        const caretPos = (0, $WrkLT$textareacaret)(input, caret);
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
            const left = Math.min(caretPos.left, rect.width - $86cfb7ad4842cd1e$var$OPTION_LIST_MIN_WIDTH / 2);
            // minimum of the caret position from the top of the input
            // and the height of the input
            const top = Math.min(caretPos.top + $86cfb7ad4842cd1e$var$OPTION_LIST_Y_OFFSET, rect.height);
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
                case $86cfb7ad4842cd1e$var$KEY_ESCAPE:
                    event.preventDefault();
                    reset();
                    break;
                case $86cfb7ad4842cd1e$var$KEY_UP:
                    event.preventDefault();
                    setSelection((options.length + selection - 1) % options.length);
                    break;
                case $86cfb7ad4842cd1e$var$KEY_DOWN:
                    event.preventDefault();
                    setSelection((selection + 1) % options.length);
                    break;
                case $86cfb7ad4842cd1e$var$KEY_LEFT:
                    event.preventDefault();
                    setSelection((options.length + selection - 1) % options.length);
                    break;
                case $86cfb7ad4842cd1e$var$KEY_RIGHT:
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
    (0, $WrkLT$useEffect)(()=>{
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
    const [isRecording, setIsRecording] = (0, $WrkLT$useState)(false);
    const [isLoading, setIsLoading] = (0, $WrkLT$useState)(false);
    const mediaRecorderRef = (0, $WrkLT$useRef)(null);
    const audioChunksRef = (0, $WrkLT$useRef)([]);
    // Streaming dictation (opt-in via asrStreaming): the controller owns the mic
    // and emits ordered transcript chunks; each is inserted at an advancing caret.
    const dictationRef = (0, $WrkLT$useRef)(null);
    const insertPosRef = (0, $WrkLT$useRef)(0);
    const valueRef = (0, $WrkLT$useRef)(value);
    (0, $WrkLT$useEffect)(()=>{
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
        const dictation = new (0, $f85798d3c097ff85$export$eae2660aea493150)({
            ...asrStreamingOptions,
            asrUrl: asrApiUrl,
            language: lang,
            getAuthHeader: ()=>apiKey,
            onPartial: insertDictatedChunk,
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
                try {
                    const transcript = await transcribeAudio(asrApiUrl, lang, audioBlob);
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
    (0, $WrkLT$useEffect)(()=>{
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
    (0, $WrkLT$useEffect)(()=>{
        return ()=>{
            dictationRef.current?.cancel();
            dictationRef.current = null;
        };
    }, []);
    return /*#__PURE__*/ (0, $WrkLT$jsxs)((0, $WrkLT$Fragment), {
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
            shouldRenderSuggestions && options.length > 0 && /*#__PURE__*/ (0, $WrkLT$jsx)("ul", {
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
                children: Array.from(new Set(options)).map((item, index)=>/*#__PURE__*/ (0, $WrkLT$jsx)("li", {
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


export {$86cfb7ad4842cd1e$export$a62758b764e9e41d as IndicTransliterate, $871e300faf449d5f$export$24b0ea3375909d37 as TriggerKeys, $cb083382c5991590$export$27f30d10c00bcc6c as getTransliterateSuggestions};
//# sourceMappingURL=index.modern.js.map
