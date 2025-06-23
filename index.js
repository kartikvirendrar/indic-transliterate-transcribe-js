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
$parcel$export(module.exports, "getTransliterationLanguages", function () { return $470b763f7b4d7774$export$58f2e270169de9d3; });


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


const $857753f052b25831$export$27f30d10c00bcc6c = async (word, customApiURL, apiKey, config)=>{
    const { showCurrentWordAsLastSuggestion: // numOptions = 5,
    showCurrentWordAsLastSuggestion = true, lang: lang = "hi" } = config || {};
    // fetch suggestion from api
    // const url = `https://www.google.com/inputtools/request?ime=transliteration_en_${lang}&num=5&cp=0&cs=0&ie=utf-8&oe=utf-8&app=jsapi&text=${word}`;
    // let myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");
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


const $2b6bcc00ef7a3078$export$ca6dda5263526f75 = "https://xlit-api.ai4bharat.org/";
const $2b6bcc00ef7a3078$export$a238c5e20ae27fe7 = "https://xlit-api.ai4bharat.org/tl/";


const $470b763f7b4d7774$export$58f2e270169de9d3 = async ()=>{
    if (sessionStorage.getItem("indic_transliterate__supported_languages")) return JSON.parse(sessionStorage.getItem("indic_transliterate__supported_languages") || "");
    else {
        const apiURL = `${(0, $2b6bcc00ef7a3078$export$ca6dda5263526f75)}languages`;
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const requestOptions = {
            method: "GET"
        };
        try {
            const res = await fetch(apiURL, requestOptions);
            const data = await res.json();
            sessionStorage.setItem("indic_transliterate__supported_languages", JSON.stringify(data));
            return data;
        } catch (e) {
            console.error("There was an error with transliteration", e);
            return [];
        }
    }
};



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
], insertCurrentSelectionOnBlur: insertCurrentSelectionOnBlur = true, showCurrentWordAsLastSuggestion: showCurrentWordAsLastSuggestion = true, enabled: enabled = true, horizontalView: horizontalView = false, customApiURL: customApiURL = (0, $2b6bcc00ef7a3078$export$a238c5e20ae27fe7), apiKey: apiKey = "", enableASR: enableASR = false, asrApiUrl: asrApiUrl = "", ...rest })=>{
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
    const getDirectionAndFont = async (lang)=>{
        const langList = await (0, $470b763f7b4d7774$export$58f2e270169de9d3)();
        const langObj = langList?.find((l)=>l.LangCode === lang);
        return [
            langObj?.Direction ?? "ltr",
            langObj?.GoogleFont,
            langObj?.FallbackFont
        ];
    };
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
                source: "anudesh",
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
        if (!(0, $0ecfe4a0401ba76b$export$e27e3030245d4c9b)()) {
            if (insertCurrentSelectionOnBlur && options[selection]) handleSelection(selection);
            else reset();
        }
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
    (0, $jECdM$react.useEffect)(()=>{
        getDirectionAndFont(lang).then(([direction, googleFont, fallbackFont])=>{
            setDirection(direction);
            // import google font if not already imported
            if (googleFont) {
                if (!document.getElementById(`font-${googleFont}`)) {
                    const link = document.createElement("link");
                    link.id = `font-${googleFont}`;
                    link.href = `https://fonts.googleapis.com/css?family=${googleFont}`;
                    link.rel = "stylesheet";
                    document.head.appendChild(link);
                }
                setGoogleFont(`${googleFont}, ${fallbackFont ?? "sans-serif"}`);
            } else setGoogleFont(null);
        });
    }, [
        lang
    ]);
    const enableVoiceTyping = ()=>{
        const target = inputRef.current;
        if (!target) return;
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
        const voiceLogs = [];
        let lastTextValue = target.value;
        const showLoader = ()=>{
            micBtn.innerHTML = "";
            const spinner = document.createElement("div");
            spinner.className = "voice-typing-spinner";
            micBtn.appendChild(spinner);
        };
        const restoreMicIcon = ()=>{
            micBtn.innerHTML = `<svg viewBox="-4 -4 24.00 24.00" xmlns="http://www.w3.org/2000/svg" fill="#000000" class="bi bi-mic-fill"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"></path> <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"></path> </g></svg>`;
        };
        const restoreStopIcon = ()=>{
            micBtn.innerHTML = '<svg viewBox="-4 -4 24.00 24.00" xmlns="http://www.w3.org/2000/svg" fill="#ff2600" class="bi bi-mic-fill"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"></path> <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"></path> </g></svg>';
        };
        micBtn.onclick = async ()=>{
            if (!navigator.mediaDevices) {
                alert("Browser doesn't support audio recording.");
                return;
            }
            if (isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                showLoader();
            } else {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                const sessionId = Date.now();
                mediaRecorder.ondataavailable = (event)=>audioChunks.push(event.data);
                mediaRecorder.onstop = async ()=>{
                    showLoader();
                    const audioBlob = new Blob(audioChunks, {
                        type: "audio/webm"
                    });
                    const base64Audio = await blobToBase64Raw(audioBlob);
                    const transcript = await transcribeWithDhruva(asrApiUrl, lang, base64Audio);
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const currentText = target.value;
                    target.value = currentText.slice(0, start) + transcript + currentText.slice(end);
                    onChangeText(currentText.slice(0, start) + transcript + currentText.slice(end));
                    console.log("Before Mic Voice Logs: ", voiceLogs);
                    voiceLogs.push({
                        sessionId: sessionId,
                        base64Audio: base64Audio,
                        transcript: transcript,
                        originalText: transcript,
                        correctedText: transcript,
                        startIndex: start,
                        endIndex: start + transcript.length
                    });
                    console.log("After Mic Voice Logs: ", voiceLogs);
                    lastTextValue = target.value;
                    restoreMicIcon();
                };
                mediaRecorder.start();
                isRecording = true;
                restoreStopIcon();
            }
        };
        target.addEventListener("input", ()=>{
            const currentValue = target.value;
            const lengthChange = currentValue.length - lastTextValue.length;
            let editStartIndex = 0;
            while(editStartIndex < lastTextValue.length && editStartIndex < currentValue.length && lastTextValue[editStartIndex] === currentValue[editStartIndex])editStartIndex++;
            console.log(`Change detected at index: ${editStartIndex}, Length change: ${lengthChange}`);
            voiceLogs.forEach((chunk)=>{
                console.log(`Processing chunk: "${chunk.transcript}", Before - Start: ${chunk.startIndex}, End: ${chunk.endIndex}`);
                if (editStartIndex <= chunk.startIndex) {
                    chunk.startIndex += lengthChange;
                    chunk.endIndex += lengthChange;
                    console.log(`   -> Edit was BEFORE chunk. Shifted indices.`);
                } else if (editStartIndex > chunk.startIndex && editStartIndex <= chunk.endIndex) {
                    chunk.endIndex += lengthChange;
                    console.log(`   -> Edit was INSIDE chunk. Shifted end index.`);
                } else console.log(`   -> Edit was AFTER chunk. No index change.`);
                chunk.correctedText = currentValue.slice(chunk.startIndex, chunk.endIndex);
                console.log(`   After - Start: ${chunk.startIndex}, End: ${chunk.endIndex}, Corrected Text: "${chunk.correctedText}"`);
            });
            lastTextValue = currentValue;
            console.log("--- Input event finished ---", voiceLogs);
        });
        setInterval(()=>{
            if (voiceLogs.length > 0) {
                const logsToSend = voiceLogs.map((log)=>({
                        audioBase64: log.base64Audio,
                        transcript: log.transcript,
                        correctedText: log.correctedText
                    }));
                fetch("https://dmoapi.com/save-logs", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(logsToSend)
                });
            }
        }, 60000);
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
        if (enableASR) enableVoiceTyping();
    }, [
        enableASR
    ]);
    return /*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsxs)("div", {
        // position relative is required to show the component
        // in the correct position
        style: {
            ...containerStyles,
            position: "relative"
        },
        className: containerClassName,
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
                ...rest
            }),
            shouldRenderSuggestions && options.length > 0 && /*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsx)("ul", {
                style: {
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
                    ...googleFont && {
                        fontFamily: googleFont
                    }
                },
                "data-testid": "rt-suggestions-list",
                lang: lang,
                children: Array.from(new Set(options)).map((item, index)=>/*#__PURE__*/ (0, $jECdM$reactjsxruntime.jsx)("li", {
                        style: index === selection ? {
                            cursor: "pointer",
                            padding: "10px",
                            minWidth: "100px",
                            backgroundColor: "#65c3d7",
                            color: "#fff"
                        } : {
                            cursor: "pointer",
                            padding: "10px",
                            minWidth: "100px",
                            backgroundColor: "#fff"
                        },
                        onMouseEnter: ()=>{
                            setSelection(index);
                        },
                        onClick: ()=>handleSelection(index),
                        children: item
                    }, item))
            })
        ]
    });
};


//# sourceMappingURL=index.js.map
