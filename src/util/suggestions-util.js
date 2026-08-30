const MAX_CACHE_SIZE = 10000
const SAVE_THRESHOLD = 20
const CACHE_KEY = "transliterationCache"

const cache = loadCacheFromLocalStorage()
let newEntriesCount = 0

function loadCacheFromLocalStorage() {
  if (typeof window === "undefined") return {}
  try {
    const cachedData = window.localStorage.getItem(CACHE_KEY)
    return cachedData ? JSON.parse(cachedData) : {}
  } catch (e) {
    return {}
  }
}

function saveCacheToLocalStorage() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    // storage disabled, quota exceeded, or SecurityError — ignore
  }
}

const getWordWithLowestFrequency = dictionary => {
  let lowestFreqWord = null
  let lowestFreq = Infinity

  for (const word in dictionary) {
    if (dictionary[word].frequency < lowestFreq) {
      lowestFreq = dictionary[word].frequency
      lowestFreqWord = word
    }
  }

  return lowestFreqWord
}

export const getTransliterateSuggestions = async (
  word,
  customApiURL,
  apiKey,
  config
) => {
  const {
    // numOptions = 5,
    showCurrentWordAsLastSuggestion = true,
    lang = "hi",
    // Called once per FAILED lookup with {status, latencyMs} — the HTTP status when there was
    // a response (null for a network error / unparseable body) and the round trip. Never the
    // word or the response body: a host may forward this straight to analytics.
    onError = null
  } = config || {}
  const startedAt = Date.now()
  let status = null
  // fetch suggestion from api
  // const url = `https://www.google.com/inputtools/request?ime=transliteration_en_${lang}&num=5&cp=0&cs=0&ie=utf-8&oe=utf-8&app=jsapi&text=${word}`;
  // let myHeaders = new Headers();
  // myHeaders.append("Content-Type", "application/json");

  if (!cache[lang]) {
    cache[lang] = {}
  }

  if (cache[lang][word.toLowerCase()]) {
    cache[lang][word.toLowerCase()].frequency += 1
    return cache[lang][word.toLowerCase()].suggestions
  }

  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: apiKey
    }
  }

  try {
    const res = await fetch(
      customApiURL +
      `${lang}/${word === "." || word === ".."
        ? " " + word.replace(".", "%2E")
        : encodeURIComponent(word).replace(".", "%2E")
      }`,
      requestOptions
    )
    status = res.status
    if (!res.ok) throw new Error(`transliteration HTTP ${res.status}`)
    let data = await res.json()
    if (!customApiURL.includes("xlit-api")) {
      data.result = data.output[0].target
    }
    if (data && data.result.length > 0) {
      const found = showCurrentWordAsLastSuggestion
        ? [...data.result, word]
        : data.result

      if (Object.keys(cache[lang]).length >= MAX_CACHE_SIZE) {
        const lowestFreqWord = getWordWithLowestFrequency(cache[lang])
        if (lowestFreqWord) {
          delete cache[lang][lowestFreqWord]
        }
      }

      cache[lang][word.toLowerCase()] = {
        suggestions: found,
        frequency: 1
      }

      newEntriesCount += 1
      if (newEntriesCount >= SAVE_THRESHOLD) {
        saveCacheToLocalStorage()
        newEntriesCount = 0
      }

      return found
    } else {
      if (showCurrentWordAsLastSuggestion) {
        const fallback = [word]
        return fallback
      }
      return []
    }
  } catch (e) {
    console.error("There was an error with transliteration", e)
    try {
      onError && onError({ status, latencyMs: Date.now() - startedAt })
    } catch (ignored) {
      // a listener must never break typing
    }
    return []
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", saveCacheToLocalStorage)
}