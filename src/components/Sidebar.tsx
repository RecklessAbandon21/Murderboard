import type { BoardSummary, BoardView, DoneTask, SaveState, SelectedShapeEditor } from '../types'
import { SaveIndicator } from './SaveIndicator'

type SidebarProps = {
  boards: BoardSummary[]
  activeBoardId: string | null
  view: BoardView
  saveState: SaveState
  search: string
  searchMatchCount: number
  searchMatchIndex: number
  doneTasks: DoneTask[]
  selectedShapeEditor: SelectedShapeEditor | null
  isOpen: boolean
  onToggleOpen: () => void
  onBoardChange: (boardId: string) => void
  onCreateBoard: () => void
  onRenameBoard: (boardId: string, name: string) => void
  onDeleteBoard: (boardId: string) => void
  onViewChange: (view: BoardView) => void
  onSearchChange: (value: string) => void
  onSearchStep: (direction: 1 | -1) => void
  onCreateTask: () => void
  onOpenBulkAdd: () => void
  onCreateGroup: () => void
  onMarkDone: () => void
  onDeleteSelected: () => void
  onUpdateSelectedShapeText: (value: string) => void
  onChangeSelectedTaskColor: (color: string) => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onRestoreTask: (id: string) => void
}

export function Sidebar({
  boards,
  activeBoardId,
  view,
  saveState,
  search,
  searchMatchCount,
  searchMatchIndex,
  doneTasks,
  selectedShapeEditor,
  isOpen,
  onToggleOpen,
  onBoardChange,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onViewChange,
  onSearchChange,
  onSearchStep,
  onCreateTask,
  onOpenBulkAdd,
  onCreateGroup,
  onMarkDone,
  onDeleteSelected,
  onUpdateSelectedShapeText,
  onChangeSelectedTaskColor,
  onExportJson,
  onImportJson,
  onRestoreTask,
}: SidebarProps) {
  const filteredTasks = doneTasks.filter((task) => task.text.toLowerCase().includes(search.toLowerCase()))
  const activeBoard = boards.find((board) => board.id === activeBoardId)

  return (
    <>
      <button className="drawer-toggle" onClick={onToggleOpen} aria-label="Open menu">
        ☰
      </button>
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div>
            <h1>Murderboard</h1>
            <p>Tasks live where you put them.</p>
          </div>
          <SaveIndicator state={saveState} />
        </div>

        <div className="sidebar-section board-switcher">
          <label className="search-label">
            <span>Board</span>
            <select
              value={activeBoardId ?? ''}
              disabled={boards.length === 0}
              onChange={(event) => onBoardChange(event.currentTarget.value)}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </label>
          <div className="board-actions">
            <button onClick={onCreateBoard}>New Board</button>
            <button
              disabled={!activeBoard}
              onClick={() => {
                if (!activeBoard) return
                const name = window.prompt('Rename board', activeBoard.name)
                if (name?.trim()) onRenameBoard(activeBoard.id, name.trim())
              }}
            >
              Rename
            </button>
            <button
              className="danger-button"
              disabled={!activeBoard}
              onClick={() => {
                if (!activeBoard) return
                if (window.confirm(`Delete "${activeBoard.name}" and its archived tasks? This cannot be undone.`)) {
                  onDeleteBoard(activeBoard.id)
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <button className="primary-button" onClick={onCreateTask}>
            New Task
          </button>
          <button onClick={onOpenBulkAdd}>Bulk Add Tasks</button>
          <button onClick={onCreateGroup}>New Group</button>
        </div>

        <div className="sidebar-section segmented">
          <button className={view === 'board' ? 'active' : ''} onClick={() => onViewChange('board')}>
            Active Board
          </button>
          <button className={view === 'archive' ? 'active' : ''} onClick={() => onViewChange('archive')}>
            Done Archive
          </button>
        </div>

        <label className="search-label">
          <span>Search</span>
          <input value={search} onChange={(event) => onSearchChange(event.currentTarget.value)} />
        </label>
        <div className="search-controls">
          <span>{search ? `${searchMatchIndex}/${searchMatchCount}` : '0/0'}</span>
          <button disabled={searchMatchCount < 2} onClick={() => onSearchStep(-1)}>
            Previous
          </button>
          <button disabled={searchMatchCount < 2} onClick={() => onSearchStep(1)}>
            Next
          </button>
        </div>

        <div className="sidebar-section">
          <button onClick={onMarkDone}>Mark Selected Done</button>
          <button className="danger-button" onClick={onDeleteSelected}>
            Delete Selected
          </button>
        </div>

        <div className="sidebar-section selected-editor">
          <span className="sidebar-label">{selectedShapeEditor?.label ?? 'Selection'}</span>
          {selectedShapeEditor ? (
            selectedShapeEditor.kind === 'task' ? (
              <textarea
                value={selectedShapeEditor.value}
                rows={5}
                onChange={(event) => onUpdateSelectedShapeText(event.currentTarget.value)}
              />
            ) : (
              <input
                value={selectedShapeEditor.value}
                onChange={(event) => onUpdateSelectedShapeText(event.currentTarget.value)}
              />
            )
          ) : (
            <p>Select one task or group to edit it.</p>
          )}
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">Note color</span>
          <div className="color-swatches" aria-label="Selected note color">
            {['#ffe566', '#ffadad', '#96e6a8', '#99c2ff', '#d499ff'].map((color) => (
              <button
                key={color}
                className="color-swatch"
                style={{ background: color }}
                aria-label={`Set selected note color to ${color}`}
                onClick={() => onChangeSelectedTaskColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <button onClick={onExportJson}>Export JSON</button>
          <label className="file-button">
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (file) onImportJson(file)
                event.currentTarget.value = ''
              }}
            />
          </label>
        </div>

        {view === 'archive' ? (
          <div className="archive-mini">
            <strong>{filteredTasks.length} done</strong>
            {filteredTasks.slice(0, 5).map((task) => (
              <button key={task.id} onClick={() => onRestoreTask(task.id)}>
                Restore: {task.text || 'Untitled task'}
              </button>
            ))}
          </div>
        ) : null}
      </aside>
    </>
  )
}
