"use client"

import * as React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { setCaretPosition, getInputSelection, isTouchEnabled } from "./util"
import getCaretCoordinates from "textarea-caret"
import { TriggerKeys } from "./constants/TriggerKeys"
import { getTransliterateSuggestions } from "./util/suggestions-util"
// import { getTransliterationLanguages } from "./util/getTransliterationLanguages"
import { BASE_URL_TL } from "./constants/Urls"
import { StreamingDictation } from "./util/streaming-dictation"

const generateUuid = () =>
  Math.random()
    .toString(36)
    .slice(2, 11)

const KEY_UP = "ArrowUp"
const KEY_DOWN = "ArrowDown"
const KEY_LEFT = "ArrowLeft"
const KEY_RIGHT = "ArrowRight"
const KEY_ESCAPE = "Escape"

const OPTION_LIST_Y_OFFSET = 10
const OPTION_LIST_MIN_WIDTH = 100

export const IndicTransliterate = ({
  renderComponent = props => <input {...props} />,
  lang = "hi",
  offsetX = 0,
  offsetY = 10,
  onChange,
  onChangeText,
  onBlur,
  value,
  onKeyDown,
  containerClassName = "",
  containerStyles = {},
  activeItemStyles = {},
  maxOptions = 5,
  hideSuggestionBoxOnMobileDevices = false,
  hideSuggestionBoxBreakpoint = 640,

  triggerKeys = [
    TriggerKeys.KEY_SPACE,
    TriggerKeys.KEY_ENTER,
    TriggerKeys.KEY_RETURN,
    TriggerKeys.KEY_TAB
  ],

  insertCurrentSelectionOnBlur = true,
  showCurrentWordAsLastSuggestion = true,
  enabled = true,
  horizontalView = false,
  suggestionListClassName = "",
  suggestionItemClassName = "",
  activeSuggestionItemClassName = "",
  customApiURL = BASE_URL_TL,
  apiKey = "",
  enableASR = false,
  asrApiUrl = "",
  micButtonRef = null,
  onVoiceTypingStateChange = null,
  // Opt-in real-time streaming dictation: VAD segments the mic at pauses and
  // transcribes each chunk as you speak (vs the default single-shot record →
  // transcribe-on-stop). `asrStreamingOptions` passes tunables through to the
  // StreamingDictation controller (minUtteranceSec, hardMaxSec, …).
  asrStreaming = false,
  asrStreamingOptions = {},
  // Telemetry hook: receives the StreamingDictation controller's events (start, cut, dropped,
  // asr, end) and, in single-shot mode, one `asr` event per recording. Sizes, timings and
  // reasons only — never audio or text. Optional; errors in the listener are swallowed.
  onAsrTelemetry = null,
  // Transliteration lookups fail silently by design (typing must never block); this reports
  // each failure as {status, latencyMs} — never the word — so a host can count them.
  onTransliterationError = null,
  ...rest
}) => {
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [selection, setSelection] = useState(0)
  const [matchStart, setMatchStart] = useState(-1)
  const [matchEnd, setMatchEnd] = useState(-1)
  const inputRef = useRef(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [direction, setDirection] = useState("ltr")
  const [googleFont, setGoogleFont] = useState(null)
  const [options, setOptions] = useState([])
  const [logJsonArray, setLogJsonArray] = useState([])
  const [numSpaces, setNumSpaces] = useState(0)
  const [parentUuid, setParentUuid] = useState("0")
  const [uuid, setUuid] = useState("")
  const [subStrLength, setSubStrLength] = useState(0)
  const [restart, setRestart] = useState(true)

  useEffect(() => {
    setUuid(generateUuid())
  }, [])

  const shouldRenderSuggestions = useMemo(
    () =>
      hideSuggestionBoxOnMobileDevices
        ? windowSize.width > hideSuggestionBoxBreakpoint
        : true,
    [windowSize, hideSuggestionBoxBreakpoint, hideSuggestionBoxOnMobileDevices]
  )

  const reset = () => {
    // reset the component
    setSelection(0)
    setOptions([])
  }

  const lastTextValue = useRef(null);
  const voiceLogs = useRef([]);

  const handleSelection = index => {
    const currentString = value
    // create a new string with the currently typed word
    // replaced with the word in transliterated language
    const newValue =
      currentString.substring(0, matchStart) +
      options[index] +
      " " +
      currentString.substring(matchEnd + 1, currentString.length)

    if (logJsonArray.length) {
      let lastLogJson = logJsonArray[logJsonArray.length - 1]
      let logJson = {
        keystrokes: lastLogJson.keystrokes,
        results: lastLogJson.results,
        opted: options[index],
        created_at: new Date().toISOString(),
        language: lang
      }
      setLogJsonArray([...logJsonArray, logJson])
      setNumSpaces(numSpaces + 1)
    }

    // set the position of the caret (cursor) one character after the
    // the position of the new word
    setTimeout(() => {
      setCaretPosition(inputRef.current, matchStart + options[index].length + 1)
    }, 1)

    // bubble up event to the parent component
    const e = {
      target: { value: newValue }
    }
    onChangeText(newValue)
    onChange && onChange(e)

    if (lastTextValue.current != null & voiceLogs.current == []) {
      const currentValue = newValue;
      let changeStart = 0;
      while (
        changeStart < lastTextValue.current.length &&
        changeStart < currentValue.length &&
        lastTextValue.current[changeStart] === currentValue[changeStart]
      ) {
        changeStart++;
      }
      const lengthDelta = currentValue.length - lastTextValue.current.length;
      voiceLogs.current.forEach(log => {
        if (changeStart > log.end) {
          return;
        }
        if (changeStart <= log.start) {
          log.start += lengthDelta;
          log.end += lengthDelta;
        }
        if (changeStart > log.start && changeStart <= log.end) {
          log.end += lengthDelta;
        }
        log.correctedText = currentValue.slice(log.start, log.end);
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("voiceLogs", JSON.stringify(voiceLogs.current));
      }
      lastTextValue.current = currentValue;
    }
    reset()
    return inputRef.current?.focus()
  }

  const renderSuggestions = async (lastWord, wholeText) => {
    if (!shouldRenderSuggestions) {
      return
    }
    // fetch suggestion from api
    // const url = `https://www.google.com/inputtools/request?ime=transliteration_en_${lang}&num=5&cp=0&cs=0&ie=utf-8&oe=utf-8&app=jsapi&text=${lastWord}`;

    // const numOptions = showCurrentWordAsLastSuggestion
    //   ? maxOptions - 1
    //   : maxOptions;

    const data = await getTransliterateSuggestions(
      lastWord,
      customApiURL,
      apiKey,
      {
        // numOptions,
        showCurrentWordAsLastSuggestion,
        lang,
        onError: onTransliterationError
      }
    )
    setOptions(data ?? [])
    let logJson = {
      keystrokes: wholeText,
      results: data,
      opted: "",
      created_at: new Date().toISOString(),
      language: lang
    }

    if (restart) {
      setRestart(false)
      setLogJsonArray([logJson])
    } else {
      setLogJsonArray([...logJsonArray, logJson])
    }
  }

  // const getDirectionAndFont = async lang => {
  //   const langList = await getTransliterationLanguages()
  //   const langObj = langList?.find(l => l.LangCode === lang)
  //   return [
  //     langObj?.Direction ?? "ltr",
  //     langObj?.GoogleFont,
  //     langObj?.FallbackFont
  //   ]
  // }

  const handleChange = e => {
    const value = e.currentTarget.value

    if (numSpaces == 0 || restart) {
      if (value.length >= 4) {
        setSubStrLength(value.length - 4)
      } else {
        setSubStrLength(0)
      }
    }

    if (numSpaces >= 5) {
      const finalJson = {
        uuid: uuid,
        parent_uuid: parentUuid,
        word: value,
        source: typeof window !== "undefined" ?
          localStorage.getItem("source") != undefined
            ? localStorage.getItem("source")
            : "node-module" : "node-module",
        language: lang,
        steps: logJsonArray
      }
      setLogJsonArray([])
      setParentUuid(uuid)
      setUuid(generateUuid())
      setSubStrLength(value.length - 2)
      setNumSpaces(0)
      setRestart(true)
      fetch(
        "https://backend.shoonya.ai4bharat.org/logs/transliteration_selection/",
        {
          method: "POST",
          body: JSON.stringify(finalJson),
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
        .then(async res => {
          if (!res.ok) {
            throw await res.json()
          }
        })
        .catch(err => {
          console.log("error", err)
        })
    }

    // bubble up event to the parent component
    onChange && onChange(e)
    onChangeText(value)

    if (!shouldRenderSuggestions) {
      return
    }

    // get the current index of the cursor
    const caret = getInputSelection(e.target).end
    const input = inputRef.current

    if (!input) return

    const caretPos = getCaretCoordinates(input, caret)

    // search for the last occurence of the space character from
    // the cursor
    const indexOfLastSpace =
      value.lastIndexOf(" ", caret - 1) < value.lastIndexOf("\n", caret - 1)
        ? value.lastIndexOf("\n", caret - 1)
        : value.lastIndexOf(" ", caret - 1)

    // first character of the currently being typed word is
    // one character after the space character
    // index of last character is one before the current position
    // of the caret
    setMatchStart(indexOfLastSpace + 1)
    setMatchEnd(caret - 1)

    // currentWord is the word that is being typed
    const currentWord = value.slice(indexOfLastSpace + 1, caret)
    if (currentWord && enabled) {
      // make an api call to fetch suggestions
      if (numSpaces == 0 || restart) {
        if (value.length >= 4) {
          renderSuggestions(
            currentWord,
            value.substr(value.length - 4, value.length)
          )
        } else {
          renderSuggestions(currentWord, value.substr(0, value.length))
        }
      } else {
        renderSuggestions(currentWord, value.substr(subStrLength, value.length))
      }

      const rect = input.getBoundingClientRect()

      // calculate new left and top of the suggestion list

      // minimum of the caret position in the text input and the
      // width of the text input
      const left = Math.min(
        caretPos.left,
        rect.width - OPTION_LIST_MIN_WIDTH / 2
      )

      // minimum of the caret position from the top of the input
      // and the height of the input
      const top = Math.min(caretPos.top + OPTION_LIST_Y_OFFSET, rect.height)

      setTop(top)
      setLeft(left)
    } else {
      reset()
    }
  }

  const handleKeyDown = event => {
    const helperVisible = options.length > 0

    if (helperVisible) {
      if (triggerKeys.includes(event.key)) {
        event.preventDefault()
        handleSelection(selection)
      } else {
        switch (event.key) {
          case KEY_ESCAPE:
            event.preventDefault()
            reset()
            break
          case KEY_UP:
            event.preventDefault()
            setSelection((options.length + selection - 1) % options.length)
            break
          case KEY_DOWN:
            event.preventDefault()
            setSelection((selection + 1) % options.length)
            break
          case KEY_LEFT:
            event.preventDefault()
            setSelection((options.length + selection - 1) % options.length)
            break
          case KEY_RIGHT:
            event.preventDefault()
            setSelection((selection + 1) % options.length)
            break
          default:
            onKeyDown && onKeyDown(event)
            break
        }
      }
    } else {
      onKeyDown && onKeyDown(event)
    }
  }

  const handleBlur = event => {
    reset()
    onBlur && onBlur(event)
  }

  const handleResize = () => {
    // TODO implement the resize function to resize
    // the helper on screen size change
    const width = window.innerWidth
    const height = window.innerHeight
    setWindowSize({ width, height })
  }

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    const width = window.innerWidth
    const height = window.innerHeight
    setWindowSize({ width, height })

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

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

  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // Streaming dictation (opt-in via asrStreaming): the controller owns the mic
  // and emits ordered transcript chunks; each is inserted at an advancing caret.
  const dictationRef = useRef(null);
  const insertPosRef = useRef(0);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  // Insert one streamed transcript chunk at the advancing caret, reading the
  // LIVE value (via ref) so successive chunks don't clobber each other.
  const insertDictatedChunk = text => {
    const cur = valueRef.current ?? "";
    let pos = insertPosRef.current;
    if (pos == null || pos > cur.length) pos = cur.length;
    const needsSpace = pos > 0 && !/\s$/.test(cur.slice(0, pos));
    const piece = (needsSpace ? " " : "") + text;
    const newValue = cur.slice(0, pos) + piece + cur.slice(pos);
    insertPosRef.current = pos + piece.length;
    onChange?.({ target: { value: newValue } });
    onChangeText?.(newValue);
  };

  const handleStreamingVoiceTyping = async () => {
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
    insertPosRef.current = target ? (target.selectionStart ?? (value ? value.length : 0)) : (value ? value.length : 0);
    const dictation = new StreamingDictation({
      ...asrStreamingOptions,
      asrUrl: asrApiUrl,
      language: lang,
      getAuthHeader: () => apiKey,
      onPartial: insertDictatedChunk,
      onTelemetry: evt => {
        try { onAsrTelemetry?.(evt); } catch (e) { /* a listener must not break dictation */ }
      },
      onStateChange: s => {
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
      onError: (err, kind) => {
        if (kind === "fatal") {
          setIsRecording(false);
          setIsLoading(false);
          onVoiceTypingStateChange?.('error');
        } else {
          // One chunk failed; recording continues. Host may choose to toast.
          console.warn("ASR chunk failed:", err);
        }
      },
    });
    dictationRef.current = dictation;
    try {
      await dictation.start();
    } catch (err) {
      console.error("Error starting streaming dictation:", err);
      dictationRef.current = null;
    }
  };

  const handleVoiceTyping = async () => {
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
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          setIsLoading(true);
          onVoiceTypingStateChange?.('loading');

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const asrStartedAt = Date.now();
          try {
            const transcript = await transcribeAudio(asrApiUrl, lang, audioBlob);
            try {
              onAsrTelemetry?.({ type: "asr", seq: 0, ok: true, status: 200, latencyMs: Date.now() - asrStartedAt, bytes: audioBlob.size, chars: (transcript || "").length });
            } catch (e) { /* never break dictation */ }

            const target = inputRef.current;
            if (target && transcript) {
              const cursorPos = target.selectionStart;
              const currentText = value;
              const newValue = currentText.slice(0, cursorPos) + transcript + currentText.slice(cursorPos);

              const e = { target: { value: newValue } };
              onChange?.(e);
              onChangeText(newValue);
            }
            onVoiceTypingStateChange?.('idle');
          } catch (err) {
            // Surface the failure to the host instead of silently inserting an
            // empty string, so it can toast / re-enable the mic.
            console.error("Transcription API error:", err);
            onVoiceTypingStateChange?.('error');
          } finally {
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
    }
  };

  // Transcribe an audio Blob against an OpenAI-audio-style ASR endpoint
  // (e.g. Bodhan's `POST /api/v1/asr/transcriptions/`): multipart `file` +
  // `language`, response `{ text }`. `apiKey`, when set, is sent verbatim as
  // the Authorization header (the host passes a full `Bearer <token>` there).
  // NOTE: no explicit Content-Type — the browser must set the multipart
  // boundary itself. Throws on a non-2xx so the caller can surface it.
  async function transcribeAudio(apiURL, lang, audioBlob) {
    const form = new FormData()
    form.append("file", audioBlob, "audio.webm")
    form.append("language", lang)

    const response = await fetch(apiURL, {
      method: "POST",
      headers: apiKey ? { Authorization: apiKey } : {},
      body: form,
    })

    if (!response.ok) {
      let detail = ""
      try {
        detail = (await response.json())?.detail || ""
      } catch (_) {
        // non-JSON error body — fall back to the status
      }
      const error = new Error(detail || `ASR request failed (${response.status})`)
      error.status = response.status
      throw error
    }

    const result = await response.json()
    return result.text || ""
  }

  useEffect(() => {
    if (enableASR && micButtonRef?.current) {
      const button = micButtonRef.current;

      button.addEventListener('click', handleVoiceTyping);

      return () => {
        button.removeEventListener('click', handleVoiceTyping);

        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [enableASR, asrStreaming, micButtonRef, isRecording, value, lang, apiKey]);

  // Cancel any in-flight streaming dictation on UNMOUNT only. This must be its
  // own effect with empty deps: the mic-bind effect above re-runs on every
  // `value` change (each inserted chunk), and cancelling there would abort the
  // dictation mid-utterance.
  useEffect(() => {
    return () => {
      dictationRef.current?.cancel();
      dictationRef.current = null;
    };
  }, []);

  return (
    <>
      {renderComponent({
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        ref: inputRef,
        value: value,
        "data-testid": "rt-input-component",
        lang: lang,
        style: {
          direction: direction,
          ...(googleFont && { fontFamily: googleFont })
        },
        // className: rest.className,
        ...rest
      })}
      {shouldRenderSuggestions && options.length > 0 && (
        <ul
          onMouseDown={e => e.preventDefault()}
          style={{
            position: "absolute",
            zIndex: 20000,
            ...(googleFont && { fontFamily: googleFont }),
          }}
          className={suggestionListClassName}
          data-testid="rt-suggestions-list"
          lang={lang}
          role="listbox"
        >
          {/*
           * convert to set and back to prevent duplicate list items
           * that might happen while using backspace
           */}
          {Array.from(new Set(options)).map((item, index) => (
            <li
              className={
                index === selection
                  ? activeSuggestionItemClassName
                  : suggestionItemClassName
              }
              onMouseEnter={() => {setSelection(index)}}
              onClick={() => handleSelection(index)}
              key={item}
              role="option"
              aria-selected={index === selection}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export { TriggerKeys, getTransliterateSuggestions }
// export { getTransliterationLanguages }