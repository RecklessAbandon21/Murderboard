import { Check, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useValue } from '@tldraw/state-react'
import { HTMLContainer, Rectangle2d, ShapeUtil, T, resizeBox, type Editor, type TLResizeInfo } from 'tldraw'
import type { TaskNoteShape } from '../types'

const NOTE_COLORS = ['#ffe566', '#ffadad', '#96e6a8', '#99c2ff', '#d499ff']

export class TaskNoteShapeUtil extends ShapeUtil<TaskNoteShape> {
  static override type = 'task-note' as const
  static override props = {
    w: T.number,
    h: T.number,
    text: T.string,
    createdAt: T.string,
    updatedAt: T.string,
    completedAt: T.nullable(T.string),
    deletedAt: T.nullable(T.string),
    color: T.string,
  }

  override canEdit() {
    return true
  }

  override canResize() {
    return true
  }

  override getDefaultProps(): TaskNoteShape['props'] {
    const now = new Date().toISOString()
    return {
      w: 220,
      h: 150,
      text: 'New task',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      deletedAt: null,
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    }
  }

  override getGeometry(shape: TaskNoteShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override component(shape: TaskNoteShape) {
    return <TaskNoteComponent editor={this.editor} shape={shape} updateText={(text) => this.updateText(shape, text)} />
  }

  override getIndicatorPath(shape: TaskNoteShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 14)
    return path
  }

  override onDoubleClick(shape: TaskNoteShape) {
    window.dispatchEvent(
      new CustomEvent('murderboard:task-action', {
        detail: { action: 'edit', id: shape.id },
      }),
    )
  }

  override onResize(shape: TaskNoteShape, info: TLResizeInfo<TaskNoteShape>) {
    return resizeBox(shape, info, { minWidth: 150, minHeight: 110 })
  }

  private updateText(shape: TaskNoteShape, text: string) {
    this.editor.updateShape<TaskNoteShape>({
      id: shape.id,
      type: shape.type,
      props: {
        text,
        updatedAt: new Date().toISOString(),
      },
    })
  }
}

function TaskNoteComponent({
  editor,
  shape,
  updateText,
}: {
  editor: Editor
  shape: TaskNoteShape
  updateText: (text: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { w, h, text, color } = shape.props
  const isSelected = useValue('isSelected', () => editor.getSelectedShapeIds().includes(shape.id), [editor, shape.id])

  useEffect(() => {
    if (!isEditing) return
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [isEditing])

  useEffect(() => {
    const handleTaskAction = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: string; id?: string }>).detail
      if (detail?.action === 'edit' && detail.id === shape.id) {
        setIsEditing(true)
      }
    }

    window.addEventListener('murderboard:task-action', handleTaskAction)
    return () => window.removeEventListener('murderboard:task-action', handleTaskAction)
  }, [shape.id])

  const dispatchTaskAction = (action: 'delete' | 'done') => {
    window.dispatchEvent(
      new CustomEvent('murderboard:task-action', {
        detail: { action, id: shape.id },
      }),
    )
  }

  return (
    <HTMLContainer>
      <div
        className={`task-note ${isEditing ? 'task-note--editing' : ''} ${isSelected ? 'task-note--selected' : ''}`}
        style={{ width: w, height: h, background: color }}
      >
        <div className="task-note-grip" aria-hidden="true" />
        <div className="task-note-actions">
          <button
            aria-label="Mark task done"
            title="Mark done"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              dispatchTaskAction('done')
            }}
          >
            <Check size={16} strokeWidth={2.4} />
          </button>
          <button
            aria-label="Delete task"
            title="Delete"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              dispatchTaskAction('delete')
            }}
          >
            <Trash2 size={16} strokeWidth={2.2} />
          </button>
        </div>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            aria-label="Task text"
            value={text}
            spellCheck
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.blur()
              }
            }}
            onChange={(event) => updateText(event.currentTarget.value)}
          />
        ) : (
          <div className="task-note-text">{text || 'New task'}</div>
        )}
      </div>
    </HTMLContainer>
  )
}
