import type { SelectedShapeEditor } from '../types'

type InspectorProps = {
  selectedShapeEditor: SelectedShapeEditor
  onUpdateText: (value: string) => void
  onChangeColor: (color: string) => void
  onMarkDone: () => void
  onDelete: () => void
  onClose: () => void
}

const COLORS = [
  { value: '#fff1a8', label: 'Yellow' },
  { value: '#ffd6d6', label: 'Pink' },
  { value: '#d8f3dc', label: 'Green' },
  { value: '#d7e8ff', label: 'Blue' },
  { value: '#f0ddff', label: 'Purple' },
]

export function Inspector({
  selectedShapeEditor,
  onUpdateText,
  onChangeColor,
  onMarkDone,
  onDelete,
  onClose,
}: InspectorProps) {
  return (
    <aside className="inspector" data-tour="inspector" aria-label="Shape inspector">
      <div className="inspector-header">
        <span className="inspector-title">{selectedShapeEditor.label}</span>
        <button className="inspector-close" onClick={onClose} aria-label="Close inspector">
          ×
        </button>
      </div>

      <div className="inspector-body">
        {selectedShapeEditor.kind === 'task' ? (
          <textarea
            className="inspector-textarea"
            value={selectedShapeEditor.value}
            rows={5}
            onChange={(e) => onUpdateText(e.currentTarget.value)}
          />
        ) : (
          <input
            className="inspector-input"
            value={selectedShapeEditor.value}
            onChange={(e) => onUpdateText(e.currentTarget.value)}
          />
        )}

        {selectedShapeEditor.kind === 'task' && (
          <div className="inspector-colors" aria-label="Note color">
            {COLORS.map(({ value, label }) => (
              <button
                key={value}
                className="inspector-color"
                style={{ background: value }}
                onClick={() => onChangeColor(value)}
                aria-label={`${label} note`}
              />
            ))}
          </div>
        )}

        <div className="inspector-actions">
          {selectedShapeEditor.kind === 'task' && (
            <button className="inspector-btn inspector-btn--done" data-tour="inspector-done" onClick={onMarkDone}>
              Mark Done
            </button>
          )}
          <button className="inspector-btn inspector-btn--danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </aside>
  )
}
