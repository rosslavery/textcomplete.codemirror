import Editor, {ENTER, UP, DOWN, OTHER} from 'textcomplete/lib/editor';
import {calculateElementOffset} from 'textcomplete/lib/utils';

import bindAll from 'lodash.bindall';

const CALLBACK_METHODS = ['onKeydown', 'onKeyup'];

/**
 * @extends Editor
 * @prop {CodeMirror} cm
 */
class Codemirror extends Editor {
  /**
   * @param {CodeMirror} cm
   */
  constructor(cm) {
    super();
    this.cm = cm;

    bindAll(this, CALLBACK_METHODS);
    this.startListening();
  }

  /** @override */
  finalize() {
    super.finalize();
    this.stopListening();
    this.cm = null;
    return this;
  }

  /**
   * @override
   * @param {SearchResult} searchResult
   */
  applySearchResult(searchResult) {
    var replace = searchResult.replace(this.getBeforeCursor(), this.getAfterCursor());
    if (Array.isArray(replace)) {
      this.cm.doc.setValue(replace[0] + replace[1]);
      let lines = replace[0].split('\n');
      this.cm.doc.setCursor(lines.length - 1, lines[lines.length - 1].length);
    }
    this.cm.focus();
  }

  /**
   * @override
   * @returns {{top: number, left: number}}
   */
  getCursorOffset() {
    var el = this.cm.display.cursorDiv.firstChild;
    var offset = calculateElementOffset(el);
    return { top: offset.top + parseInt(el.style.height, 10), left: offset.left };
  }

  /**
   * @override
   * @returns {string}
   */
  getBeforeCursor() {
    var {line, ch} = this.getCursor();
    var lines = this.getLines();
    var linesBeforeCursor = lines.slice(0, line);
    var currentLineBeforeCursor = lines[line].slice(0, ch);
    return linesBeforeCursor.concat([currentLineBeforeCursor]).join(this.lineSeparator());
  }

  /**
   * @override
   * @returns {string}
   */
  getAfterCursor() {
    var {line, ch} = this.getCursor();
    var lines = this.getLines();
    var linesAfterCursor = lines.slice(line + 1);
    var currentLineAfterCursor = lines[line].slice(ch);
    return [currentLineAfterCursor].concat(linesAfterCursor).join(this.lineSeparator());
  }

  /**
   * @private
   * @returns {string[]}
   */
  getLines() {
    return this.cm.doc.getValue().split(this.lineSeparator());
  }

  /**
   * @private
   * @returns {{line: number, ch: number}}
   */
  getCursor() {
    return this.cm.doc.getCursor();
  }

  /**
   * @private
   * @returns {string}
   */
  lineSeparator() {
    return this.cm.doc.lineSeparator();
  }

  /**
   * @private
   * @param {CodeMirror} cm
   * @param {KeyboardEvent} e
   */
  onKeydown(cm, e) {
    var code = this.getCode(e);
    var event;
    switch (code) {
      case OTHER:
        return;
      case ENTER: {
        event = this.emitEnterEvent();
        break;
      }
      default: {
        event = this.emitMoveEvent(code);
      }
    }
    if (event.defaultPrevented) {
      e.preventDefault();
    }
  }

  /**
   * @private
   * @param {CodeMirror} cm
   * @param {KeyboardEvent} e
   */
  onKeyup(cm, e) {
    if (!this.isMoveKeyEvent(e)) {
      this.emitChangeEvent();
    }
  }

  /**
   * @private
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  isMoveKeyEvent(e) {
    var code = this.getCode(e);
    return code === DOWN || code === UP;
  }

  /**
   * @private
   */
  startListening() {
    this.cm.on('keydown', this.onKeydown);
    this.cm.on('keyup', this.onKeyup);
  }

  /**
   * @private
   */
  stopListening() {
    this.cm.off('keydown', this.onKeydown);
    this.cm.off('keyup', this.onKeyup);
  }
}

export default Codemirror;
