import { BASE_URL } from "../constants/Urls"

export const getTransliterationLanguages = async () => {
  if (sessionStorage.getItem("indic_transliterate__supported_languages")) {
    return JSON.parse(
      sessionStorage.getItem("indic_transliterate__supported_languages") || ""
    )
  } else {
    const apiURL = `${BASE_URL}languages`
    const myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    const requestOptions = {
      method: "GET"
    }
    try {
      const res = await fetch(apiURL, requestOptions)
      const data = await res.json()
      sessionStorage.setItem(
        "indic_transliterate__supported_languages",
        JSON.stringify(data)
      )
      return data
    } catch (e) {
      console.error("There was an error with transliteration", e)
      return []
    }
  }
}
