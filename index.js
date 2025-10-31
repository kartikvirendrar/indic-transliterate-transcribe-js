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
    let cachedData = "";
    if (typeof window !== "undefined") cachedData = localStorage.getItem($857753f052b25831$var$CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : {};
}
function $857753f052b25831$var$saveCacheToLocalStorage() {
    if (typeof window !== "undefined") localStorage.setItem($857753f052b25831$var$CACHE_KEY, JSON.stringify($857753f052b25831$var$cache));
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
    showCurrentWordAsLastSuggestion = true, lang: lang = "hi" } = config || {};
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
        let data = await res.json();
        console.log("library data", data);
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
        // catch error
        console.error("There was an error with transliteration", e);
        return [];
    }
};
window.addEventListener("beforeunload", $857753f052b25831$var$saveCacheToLocalStorage);


const $2b6bcc00ef7a3078$export$ca6dda5263526f75 = "https://xlit-api.ai4bharat.org/";
const $2b6bcc00ef7a3078$export$a238c5e20ae27fe7 = "https://xlit-api.ai4bharat.org/tl/";


const $0e1b765668e4d0aa$var$KEY_UP = "ArrowUp";
const $0e1b765668e4d0aa$var$KEY_DOWN = "ArrowDown";
const $0e1b765668e4d0aa$var$KEY_LEFT = "ArrowLeft";
const $0e1b765668e4d0aa$var$KEY_RIGHT = "ArrowRight";
const $0e1b765668e4d0aa$var$KEY_ESCAPE = "Escape";
const $0e1b765668e4d0aa$var$OPTION_LIST_Y_OFFSET = 10;
const $0e1b765668e4d0aa$var$OPTION_LIST_MIN_WIDTH = 100;
const $0e1b765668e4d0aa$export$a62758b764e9e41d = ({ renderComponent: renderComponent = (props)=>/*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsx)("input", {
        ...props
    }), lang: lang = "hi", offsetX: offsetX = 0, offsetY: offsetY = 10, onChange: onChange, onChangeText: onChangeText, onBlur: onBlur, value: value, onKeyDown: onKeyDown, containerClassName: containerClassName = "", containerStyles: containerStyles = {}, activeItemStyles: activeItemStyles = {}, maxOptions: maxOptions = 5, hideSuggestionBoxOnMobileDevices: hideSuggestionBoxOnMobileDevices = false, hideSuggestionBoxBreakpoint: hideSuggestionBoxBreakpoint = 450, triggerKeys: triggerKeys = [
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_SPACE,
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_ENTER,
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_RETURN,
    (0, $7f12c5bac20ed9d3$export$24b0ea3375909d37).KEY_TAB
], insertCurrentSelectionOnBlur: insertCurrentSelectionOnBlur = true, showCurrentWordAsLastSuggestion: showCurrentWordAsLastSuggestion = true, enabled: enabled = true, horizontalView: horizontalView = false, suggestionListClassName: suggestionListClassName = "", suggestionItemClassName: suggestionItemClassName = "", activeSuggestionItemClassName: activeSuggestionItemClassName = "", customApiURL: customApiURL = (0, $2b6bcc00ef7a3078$export$a238c5e20ae27fe7), apiKey: apiKey = "", enableASR: enableASR = false, asrApiUrl: asrApiUrl = "", micButtonRef: micButtonRef = null, onVoiceTypingStateChange: onVoiceTypingStateChange = null, ...rest })=>{
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
    const [uuid, setUuid] = (0, $jECdM$react.useState)(Math.random().toString(36).substr(2, 9));
    const [subStrLength, setSubStrLength] = (0, $jECdM$react.useState)(0);
    const [restart, setRestart] = (0, $jECdM$react.useState)(true);
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
            setUuid(Math.random().toString(36).substr(2, 9));
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
    const handleVoiceTyping = async ()=>{
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
                const base64Audio = await blobToBase64Raw(audioBlob);
                const transcript = await transcribeWithDhruva(asrApiUrl, lang, base64Audio);
                const target = inputRef.current;
                if (target) {
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
                setIsLoading(false);
                onVoiceTypingStateChange?.('idle');
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
    async function blobToBase64Raw(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for(let i = 0; i < uint8Array.length; i++)binary += String.fromCharCode(uint8Array[i]);
        return btoa(binary);
    }
    async function transcribeWithDhruva(apiURL, lang, base64Audio) {
        try {
            const response = await fetch(apiURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": apiKey
                },
                body: JSON.stringify({
                    audioBase64: base64Audio,
                    lang: lang
                })
            });
            const result = await response.json();
            return result.transcript || "";
        } catch (err) {
            console.error("Transcription API error:", err);
            return "";
        }
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
        micButtonRef,
        isRecording,
        value,
        lang
    ]);
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
                    left: `${left + offsetX}px`,
                    top: `${top + offsetY}px`,
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
