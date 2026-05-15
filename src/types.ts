import type { TLBaseShape, TLShape } from 'tldraw'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type BoardView = 'board' | 'archive'

export type BoardSummary = {
  id: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type TaskNoteShape = TLBaseShape<
  'task-note',
  {
    w: number
    h: number
    text: string
    createdAt: string
    updatedAt: string
    completedAt: string | null
    deletedAt: string | null
    color: string
  }
>

export type GroupRegionShape = TLBaseShape<
  'group-region',
  {
    w: number
    h: number
    label: string
    createdAt: string
    updatedAt: string
  }
>

export type DoneTask = {
  id: string
  text: string
  createdAt: string
  updatedAt: string
  completedAt: string
  deletedAt: string | null
  shape: TLShape | unknown
}

export type BoardPayload = {
  id: string
  name: string
  snapshot: unknown
  updatedAt: string | null
}

export type SelectedShapeEditor =
  | {
      id: string
      kind: 'task'
      label: string
      value: string
    }
  | {
      id: string
      kind: 'group'
      label: string
      value: string
    }
