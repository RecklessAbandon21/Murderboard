import type { SaveState } from '../types'

export function SaveIndicator({ state }: { state: SaveState }) {
  return <div className={`save-indicator save-indicator--${state}`}>{labelByState[state]}</div>
}

const labelByState: Record<SaveState, string> = {
  idle: 'Saved',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Error',
}
