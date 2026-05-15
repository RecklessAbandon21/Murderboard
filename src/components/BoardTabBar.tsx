import { useState } from 'react'
import type { BoardSummary } from '../types'

type BoardTabBarProps = {
  boards: BoardSummary[]
  activeBoardId: string | null
  onBoardChange: (boardId: string) => void
  onCreateBoard: () => void
  onRenameBoard: (boardId: string, name: string) => void
  onDeleteBoard: (boardId: string) => void
  onReorderBoards: (orderedIds: string[]) => void
}

export function BoardTabBar({
  boards,
  activeBoardId,
  onBoardChange,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onReorderBoards,
}: BoardTabBarProps) {
  const [menuBoardId, setMenuBoardId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return
    const from = boards.findIndex((b) => b.id === draggedId)
    const to = boards.findIndex((b) => b.id === targetId)
    if (from === -1 || to === -1) return
    const next = [...boards]
    next.splice(to, 0, next.splice(from, 1)[0])
    onReorderBoards(next.map((b) => b.id))
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="board-tab-bar" data-tour="board-tabs">
      <div className="board-tab-bar-inner" role="tablist" aria-label="Boards">
      {boards.map((board) => {
        const isActive = board.id === activeBoardId
        const isDragging = board.id === draggedId
        const isDragOver = board.id === dragOverId && board.id !== draggedId
        return (
          <div
            key={board.id}
            className={`board-tab ${isActive ? 'board-tab--active' : ''} ${isDragging ? 'board-tab--dragging' : ''} ${isDragOver ? 'board-tab--drag-over' : ''}`}
            draggable
            onDragStart={(e) => {
              setDraggedId(board.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => {
              setDraggedId(null)
              setDragOverId(null)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDragOverId(board.id)
            }}
            onDragLeave={() => {
              setDragOverId((current) => (current === board.id ? null : current))
            }}
            onDrop={() => handleDrop(board.id)}
          >
            <button
              className="board-tab-name"
              role="tab"
              aria-selected={isActive}
              onClick={() => onBoardChange(board.id)}
            >
              {board.name}
            </button>
            {isActive && (
              <div className="board-tab-menu-wrap">
                <button
                  className="board-tab-more"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (menuBoardId === board.id) {
                      setMenuBoardId(null)
                      setMenuPos(null)
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setMenuPos({ top: rect.bottom + 6, left: rect.left })
                      setMenuBoardId(board.id)
                    }
                  }}
                  aria-label="Board options"
                >
                  ⋯
                </button>
                {menuBoardId === board.id && menuPos && (
                  <>
                    <div
                      className="board-tab-dropdown-overlay"
                      onClick={() => { setMenuBoardId(null); setMenuPos(null) }}
                    />
                    <div className="board-tab-dropdown" style={{ top: menuPos.top, left: menuPos.left }}>
                      <button
                        onClick={() => {
                          const name = window.prompt('Rename board', board.name)
                          if (name?.trim()) onRenameBoard(board.id, name.trim())
                          setMenuBoardId(null)
                          setMenuPos(null)
                        }}
                      >
                        Rename board
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${board.name}" and its archived tasks? This cannot be undone.`,
                            )
                          ) {
                            onDeleteBoard(board.id)
                          }
                          setMenuBoardId(null)
                          setMenuPos(null)
                        }}
                      >
                        Delete board
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      <button data-tour="board-tab-add" className="board-tab-add" onClick={onCreateBoard}>
        + Board
      </button>
      </div>
    </div>
  )
}
