import '@tldraw/tlschema'

declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    'task-note': {
      w: number
      h: number
      text: string
      createdAt: string
      updatedAt: string
      completedAt: string | null
      deletedAt: string | null
      color: string
    }
    'group-region': {
      w: number
      h: number
      label: string
      createdAt: string
      updatedAt: string
    }
  }
}
