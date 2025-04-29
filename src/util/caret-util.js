export function getInputSelection(el) {
  const start = 0
  const end = 0

  if (!el) {
    return { start, end }
  }

  if (
    typeof el.selectionStart === "number" &&
    typeof el.selectionEnd === "number"
  ) {
    return { start: el.selectionStart, end: el.selectionEnd }
  }

  return { start, end }
}

export function setCaretPosition(elem, caretPos) {
  if (elem) {
    if (elem.selectionStart) {
      elem.focus()
      elem.setSelectionRange(caretPos, caretPos)
    } else {
      elem.focus()
    }
  }
}
