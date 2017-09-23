// @flow

import Editor from "textcomplete/lib/editor"
import { calculateElementOffset } from "textcomplete/lib/utils"
import SearchResult from "textcomplete/lib/search_result"

type CodeMirror = any

/**
 * @extends Editor
 * @prop {CodeMirror} cm
 */
export default class extends Editor {
  cm: CodeMirror

  /**
   * @param {CodeMirror} cm
   */
  constructor(cm: CodeMirror) {
    super()
    this.cm = cm

    ;(this: any).onKeydown = this.onKeydown.bind(this)
    ;(this: any).onKeyup = this.onKeyup.bind(this)
    this.startListening()
  }

  /** @override */
  destroy() {
    super.destroy()
    this.stopListening()
    this.cm = null
    return this
  }

  /**
   * @override
   * @param {SearchResult} searchResult
   */
  applySearchResult(searchResult: SearchResult) {
    const replace = searchResult.replace(
      this.getBeforeCursor(),
      this.getAfterCursor(),
    )
    if (Array.isArray(replace)) {
      this.cm.doc.setValue(replace[0] + replace[1])
      const lines = replace[0].split("\n")
      this.cm.doc.setCursor(lines.length - 1, lines[lines.length - 1].length)
    }
    this.cm.focus()
  }

  /**
   * @override
   * @returns {{top: number, lineHeight: number, left: number}}
   */
  getCursorOffset() {
    const el = this.cm.display.cursorDiv.firstChild
    const offset = calculateElementOffset(el)
    return {
      top: offset.top,
      lineHeight: parseInt(el.style.height, 10),
      left: offset.left,
    }
  }

  /**
   * @override
   * @returns {string}
   */
  getBeforeCursor() {
    const { line, ch } = this.getCursor()
    const lines = this.getLines()
    const linesBeforeCursor = lines.slice(0, line)
    const currentLineBeforeCursor = lines[line].slice(0, ch)
    return linesBeforeCursor
      .concat([currentLineBeforeCursor])
      .join(this.lineSeparator())
  }

  /**
   * @override
   * @returns {string}
   */
  getAfterCursor() {
    const { line, ch } = this.getCursor()
    const lines = this.getLines()
    const linesAfterCursor = lines.slice(line + 1)
    const currentLineAfterCursor = lines[line].slice(ch)
    return [currentLineAfterCursor]
      .concat(linesAfterCursor)
      .join(this.lineSeparator())
  }

  /**
   * @private
   * @returns {string[]}
   */
  getLines() {
    return this.cm.doc.getValue().split(this.lineSeparator())
  }

  /**
   * @private
   * @returns {{line: number, ch: number}}
   */
  getCursor() {
    return this.cm.doc.getCursor()
  }

  /**
   * @private
   * @returns {string}
   */
  lineSeparator() {
    return this.cm.doc.lineSeparator()
  }

  /**
   * @private
   * @param {CodeMirror} cm
   * @param {KeyboardEvent} e
   */
  onKeydown(cm: CodeMirror, e: KeyboardEvent) {
    const code = this.getCode(e)
    let event
    if (code === "UP" || code === "DOWN") {
      event = this.emitMoveEvent(code)
    } else if (code === "ENTER") {
      event = this.emitEnterEvent()
    } else if (code === "ESC") {
      event = this.emitEscEvent()
    }
    if (event && event.defaultPrevented) {
      e.preventDefault()
    }
  }

  /**
   * @private
   * @param {CodeMirror} cm
   * @param {KeyboardEvent} e
   */
  onKeyup(cm: CodeMirror, e: KeyboardEvent) {
    const code = this.getCode(e)
    if (code !== "DOWN" && code !== "UP" && code !== "META") {
      this.emitChangeEvent()
    }
  }

  /**
   * @private
   */
  startListening() {
    this.cm.on("keydown", this.onKeydown)
    this.cm.on("keyup", this.onKeyup)
  }

  /**
   * @private
   */
  stopListening() {
    this.cm.off("keydown", this.onKeydown)
    this.cm.off("keyup", this.onKeyup)
  }
}
