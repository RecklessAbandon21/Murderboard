import { useEffect, useMemo, useRef, useState } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'

type BulkTaskModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (items: string[]) => void
}

export function parseBulkTaskItems(value: string) {
  return value
    .split(/\r?\n/)
    .map(normalizeBulkTaskLine)
    .filter((line) => line.length > 0)
}

function normalizeBulkTaskLine(line: string) {
  let value = line.trim()

  while (value.length > 0) {
    const next = value
      .replace(/^(?:[-*+]|•)+\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/^\[[ xX]\]\s*/, '')
      .trim()

    if (next === value) return value
    value = next
  }

  return value
}

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme('murderboard', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'dce3ed' },
      { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ffd84a' },
      { token: 'string', foreground: 'a8d8a8' },
      { token: 'number', foreground: 'ffd84a' },
      { token: 'type', foreground: 'b4c6ef' },
      { token: 'punctuation', foreground: '64748b' },
    ],
    colors: {
      'editor.background': '#11141b',
      'editor.foreground': '#dce3ed',
      'editor.lineHighlightBackground': '#1a1e2a',
      'editor.lineHighlightBorder': '#1f2530',
      'editor.selectionBackground': '#ffd84a28',
      'editor.inactiveSelectionBackground': '#ffd84a14',
      'editor.selectionHighlightBackground': '#ffd84a18',
      'editorLineNumber.foreground': '#2e3650',
      'editorLineNumber.activeForeground': '#ffd84a',
      'editorCursor.foreground': '#ffd84a',
      'editorCursor.background': '#11141b',
      'editorWhitespace.foreground': '#1f2530',
      'editorIndentGuide.background1': '#1a1e2a',
      'editorIndentGuide.activeBackground1': '#2e3650',
      'editorRuler.foreground': '#1a1e2a',
      'editorGutter.background': '#0e1118',
      'editorWidget.background': '#171b24',
      'editorWidget.border': '#1f2530',
      'editorSuggestWidget.background': '#171b24',
      'editorSuggestWidget.border': '#1f2530',
      'editorSuggestWidget.selectedBackground': '#ffd84a1a',
      'editorSuggestWidget.highlightForeground': '#ffd84a',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#1f253066',
      'scrollbarSlider.hoverBackground': '#2e365099',
      'scrollbarSlider.activeBackground': '#3d4166cc',
      'minimap.background': '#0e1118',
      'minimapSlider.background': '#1f253066',
      'minimapSlider.hoverBackground': '#2e365099',
      'minimapSlider.activeBackground': '#3d4166cc',
      'focusBorder': '#ffd84a55',
    },
  })
}

export function BulkTaskModal({ isOpen, onClose, onSubmit }: BulkTaskModalProps) {
  const [value, setValue] = useState('')
  const items = useMemo(() => parseBulkTaskItems(value), [value])
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => editorRef.current?.focus(), 80)
    return () => clearTimeout(timer)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bulk-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-task-title"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDownCapture={(event) => event.stopPropagation()}
        onKeyUpCapture={(event) => event.stopPropagation()}
        onKeyPressCapture={(event) => event.stopPropagation()}
      >
        <header className="bulk-task-header">
          <div>
            <h2 id="bulk-task-title">Bulk Add Tasks</h2>
            <p>{items.length} ready</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close bulk add">
            Close
          </button>
        </header>

        <div className="bulk-task-note">
          Enter one task per line. Pasted markdown lists are cleaned automatically, including bullets, dashes,
          numbered lists, and checkbox markers like - [ ] or - [x].
        </div>

        <div className="bulk-task-editor">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            theme="murderboard"
            value={value}
            beforeMount={defineTheme}
            onMount={(editor: MonacoEditor.IStandaloneCodeEditor) => {
              editorRef.current = editor
              editor.focus()
            }}
            onChange={(nextValue) => setValue(nextValue ?? '')}
            options={{
              minimap: { enabled: true, scale: 1 },
              wordWrap: 'on',
              lineNumbers: 'on',
              lineHeight: 24,
              fontSize: 14,
              fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              guides: { indentation: true, bracketPairs: false },
              folding: true,
              lineNumbersMinChars: 4,
              glyphMargin: false,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
            }}
          />
        </div>

        <footer className="bulk-task-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={items.length === 0}
            onClick={() => {
              onSubmit(items)
              setValue('')
            }}
          >
            Create {items.length || ''} Tasks
          </button>
        </footer>
      </section>
    </div>
  )
}
