import * as React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { setCaretPosition, getInputSelection, isTouchEnabled } from "./util"
import getCaretCoordinates from "textarea-caret"
import { TriggerKeys } from "./constants/TriggerKeys"
import { getTransliterateSuggestions } from "./util/suggestions-util"
import { getTransliterationLanguages } from "./util/getTransliterationLanguages"
import { BASE_URL_TL } from "./constants/Urls"

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
  hideSuggestionBoxBreakpoint = 450,

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
  customApiURL = BASE_URL_TL,
  apiKey = "",
  enableASR = false,
  asrApiUrl = "",
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
  const [uuid, setUuid] = useState(
    Math.random()
      .toString(36)
      .substr(2, 9)
  )
  const [subStrLength, setSubStrLength] = useState(0)
  const [restart, setRestart] = useState(true)

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
        lang
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

  const getDirectionAndFont = async lang => {
    const langList = await getTransliterationLanguages()
    const langObj = langList?.find(l => l.LangCode === lang)
    return [
      langObj?.Direction ?? "ltr",
      langObj?.GoogleFont,
      langObj?.FallbackFont
    ]
  }

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
      setUuid(
        Math.random()
          .toString(36)
          .substr(2, 9)
      )
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

  useEffect(() => {
    getDirectionAndFont(lang).then(([direction, googleFont, fallbackFont]) => {
      setDirection(direction)
      // import google font if not already imported
      if (googleFont) {
        if (!document.getElementById(`font-${googleFont}`)) {
          const link = document.createElement("link")
          link.id = `font-${googleFont}`
          link.href = `https://fonts.googleapis.com/css?family=${googleFont}`
          link.rel = "stylesheet"
          document.head.appendChild(link)
        }
        setGoogleFont(`${googleFont}, ${fallbackFont ?? "sans-serif"}`)
      } else {
        setGoogleFont(null)
      }
    })
  }, [lang])

  const enableVoiceTyping = () => {
    const target = inputRef.current
    if (!target) return

    const micBtn = document.createElement("button");
    micBtn.innerHTML = `<svg viewBox="-4 -4 24.00 24.00" xmlns="http://www.w3.org/2000/svg" fill="#000000" class="bi bi-mic-fill"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"></path> <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"></path> </g></svg>`;
    micBtn.style.position = "absolute";
    micBtn.style.padding = "5px";
    micBtn.style.border = "none";
    micBtn.style.cursor = "pointer";
    micBtn.style.background = "#fff";
    micBtn.style.borderRadius = "50%";
    micBtn.style.boxShadow = "0 0 6px rgba(0,0,0,0.2)";
    micBtn.style.bottom = "5px";
    micBtn.style.right = "5px";
    micBtn.style.width = "32px";
    micBtn.style.height = "32px";
    micBtn.style.display = "flex";
    micBtn.style.alignItems = "center";
    micBtn.style.justifyContent = "center";

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
    wrapper.appendChild(micBtn);

    let mediaRecorder, audioChunks = [], isRecording = false;
    lastTextValue.current = target.value;
    voiceLogs.current = [];

    const showLoader = () => {
      micBtn.innerHTML = "";
      const spinner = document.createElement("div");
      spinner.className = "voice-typing-spinner";
      micBtn.appendChild(spinner);
    };

    const restoreMicIcon = () => {
      micBtn.innerHTML = `<svg viewBox="-4 -4 24.00 24.00" xmlns="http://www.w3.org/2000/svg" fill="#000000" class="bi bi-mic-fill"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"></path> <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"></path> </g></svg>`;
    };

    const restoreStopIcon = () => {
      micBtn.innerHTML = '<svg viewBox="-4 -4 24.00 24.00" xmlns="http://www.w3.org/2000/svg" fill="#ff2600" class="bi bi-mic-fill"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"></path> <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"></path> </g></svg>';
    };

    micBtn.onclick = async () => {
      if (!navigator.mediaDevices) {
        alert("Browser doesn't support audio recording.");
        return;
      }

      if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        showLoader();
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

        mediaRecorder.onstop = async () => {
          showLoader();
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const base64Audio = await blobToBase64Raw(audioBlob);

          const transcript = await transcribeWithDhruva(asrApiUrl, lang, base64Audio);

          const cursorPos = target.selectionStart;
          const currentText = target.value;
          const transcriptLength = transcript.length;

          target.value = currentText.slice(0, cursorPos) + transcript + currentText.slice(cursorPos);
          onChangeText(target.value);

          voiceLogs.current.forEach(log => {
            if (log.start >= cursorPos) {
              log.start += transcriptLength;
              log.end += transcriptLength;
            }
          });

          const newLog = {
            id: new Date().toISOString(),
            audioBase64: base64Audio,
            initialTranscript: transcript,
            correctedText: transcript,
            start: cursorPos,
            end: cursorPos + transcriptLength
          };
          voiceLogs.current.push(newLog);
          voiceLogs.current.sort((a, b) => a.start - b.start);

          if (typeof window !== "undefined") {
            localStorage.setItem("voiceLogs", JSON.stringify(voiceLogs.current));
          }

          lastTextValue.current = target.value;
          restoreMicIcon();
        };

        mediaRecorder.start();
        isRecording = true;
        restoreStopIcon();
      }
    };

    target.addEventListener("input", () => {
      const currentValue = target.value;
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

      voiceLogs.current = voiceLogs.current.filter(log => log.start < log.end);

      if (typeof window !== "undefined") {
        localStorage.setItem("voiceLogs", JSON.stringify(voiceLogs.current));
      }

      lastTextValue.current = currentValue;
    });

    if (!document.getElementById("voice-typing-spinner-style")) {
      const style = document.createElement("style");
      style.id = "voice-typing-spinner-style";
      style.innerHTML = `
      .voice-typing-spinner {
        width: 16px;
        height: 16px;
        border: 3px solid #ccc;
        border-top: 3px solid #333;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
      document.head.appendChild(style);
    }
  }

  async function blobToBase64Raw(blob) {
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ""
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    return btoa(binary)
  }

  async function transcribeWithDhruva(apiURL, lang, base64Audio) {
    try {
      const response = await fetch(apiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": apiKey },
        body: JSON.stringify({ audioBase64: base64Audio, lang })
      })

      const result = await response.json()
      return result.transcript || ""
    } catch (err) {
      console.error("Transcription API error:", err)
      return ""
    }
  }

  useEffect(() => {
    if (enableASR) {
      enableVoiceTyping()
    }
  }, [enableASR])

  return (
    <div
      // position relative is required to show the component
      // in the correct position
      style={{
        ...containerStyles,
        position: "relative"
      }}
      className={containerClassName}
    >
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
        ...rest
      })}
      {shouldRenderSuggestions && options.length > 0 && (
        <ul
          onMouseDown={e => e.preventDefault()}
          style={{
            backgroundClip: "padding-box",
            backgroundColor: "#fff",
            border: "1px solid rgba(0, 0, 0, 0.15)",
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.175)",
            display: horizontalView ? "flex" : "block",
            fontSize: "14px",
            listStyle: "none",
            padding: "1px",
            textAlign: "center",
            zIndex: 20000,
            left: `${left + offsetX}px`,
            top: `${top + offsetY}px`,
            position: "absolute",
            width: "auto",
            ...(googleFont && { fontFamily: googleFont })
          }}
          data-testid="rt-suggestions-list"
          lang={lang}
        >
          {/*
           * convert to set and back to prevent duplicate list items
           * that might happen while using backspace
           */}
          {Array.from(new Set(options)).map((item, index) => (
            <li
              style={
                index === selection
                  ? {
                    cursor: "pointer",
                    padding: "10px",
                    minWidth: "100px",
                    backgroundColor: "#65c3d7",
                    color: "#fff"
                  }
                  : {
                    cursor: "pointer",
                    padding: "10px",
                    minWidth: "100px",
                    backgroundColor: "#fff"
                  }
              }
              onMouseEnter={() => {
                setSelection(index)
              }}
              onClick={() => handleSelection(index)}
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { TriggerKeys, getTransliterateSuggestions }
export { getTransliterationLanguages }