import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Tldraw,
  createShapeId,
  getSnapshot,
  loadSnapshot,
  type Editor,
  type TLShape,
  type TLShapeId,
} from 'tldraw'
import {
  createBoard,
  deleteAllDoneTasks,
  deleteBoard,
  deleteDoneTask,
  deleteSelectedDoneTasks,
  fetchBoard,
  fetchBoards,
  fetchDoneTasks,
  getMe,
  renameBoard,
  reorderBoards,
  restoreDoneTask,
  saveBoard,
  updateMe,
} from './lib/api'
import { debounce, downloadJson, readJsonFile } from './lib/persistence'
import { TopBar } from './components/TopBar'
import { OnboardingTour } from './components/OnboardingTour'
import { BoardTabBar } from './components/BoardTabBar'
import { Inspector } from './components/Inspector'
import { BulkTaskModal } from './components/BulkTaskModal'
import { TaskNoteShapeUtil } from './shapes/TaskNoteShape'
import { GroupRegionShapeUtil } from './shapes/GroupRegionShape'
import type {
  BoardSummary,
  BoardView,
  DoneTask,
  GroupRegionShape,
  SaveState,
  SelectedShapeEditor,
  TaskNoteShape,
} from './types'
import 'tldraw/tldraw.css'
import './styles.css'

const shapeUtils = [TaskNoteShapeUtil, GroupRegionShapeUtil]
const BOARD_PATH_PREFIX = '/boards/'
const TASK_NOTE_WIDTH = 220
const TASK_NOTE_HEIGHT = 150
const BULK_TASK_GAP = 32

function getViewportCenter(editor: Editor) {
  const bounds = editor.getViewportPageBounds()
  return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 }
}

function taskFromShape(shape: TaskNoteShape, completedAt: string): DoneTask {
  return {
    id: shape.id,
    text: shape.props.text,
    createdAt: shape.props.createdAt,
    updatedAt: new Date().toISOString(),
    completedAt,
    deletedAt: null,
    shape: {
      ...shape,
      props: {
        ...shape.props,
        completedAt,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}

function unlockCustomShapes(editor: Editor) {
  const lockedCustomShapes = editor
    .getCurrentPageShapes()
    .filter((shape) => (shape.type === 'task-note' || shape.type === 'group-region') && shape.isLocked)

  if (lockedCustomShapes.length === 0) return false

  editor.updateShapes(
    lockedCustomShapes.map((shape) => ({
      id: shape.id,
      type: shape.type,
      isLocked: false,
    })),
  )

  return true
}

function getBoardIdFromPath() {
  const path = window.location.pathname
  if (!path.startsWith(BOARD_PATH_PREFIX)) return null

  const boardId = path.slice(BOARD_PATH_PREFIX.length).split('/')[0]
  return boardId ? decodeURIComponent(boardId) : null
}

function buildBoardPath(boardId: string) {
  return `${BOARD_PATH_PREFIX}${encodeURIComponent(boardId)}`
}

function navigateToBoard(boardId: string, mode: 'push' | 'replace') {
  const path = buildBoardPath(boardId)
  if (window.location.pathname === path) return

  if (mode === 'replace') {
    window.history.replaceState(null, '', path)
    return
  }

  window.history.pushState(null, '', path)
}

function chooseFallbackBoard(boards: BoardSummary[]) {
  return boards.find((board) => board.id === 'main') ?? boards[0] ?? null
}

function exportName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [view, setView] = useState<BoardView>('board')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [doneTasks, setDoneTasks] = useState<DoneTask[]>([])
  const [search, setSearch] = useState('')
  const [searchMatchIds, setSearchMatchIds] = useState<TLShapeId[]>([])
  const [searchMatchIndex, setSearchMatchIndex] = useState(0)
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([])
  const [selectedShapeEditor, setSelectedShapeEditor] = useState<SelectedShapeEditor | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bulkTaskModalOpen, setBulkTaskModalOpen] = useState(false)
  const [selectedShapeCount, setSelectedShapeCount] = useState(0)
  const [showTour, setShowTour] = useState(false)
  const pendingDoneTasksRef = useRef<DoneTask[]>([])
  const loadingRef = useRef(true)
  const activeBoardIdRef = useRef<string | null>(null)

  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? null

  useEffect(() => {
    activeBoardIdRef.current = activeBoardId
  }, [activeBoardId])

  const refreshSelectedShapeEditor = useCallback((targetEditor: Editor) => {
    setSelectedShapeCount(targetEditor.getSelectedShapes().length)

    const selectedShape = targetEditor.getOnlySelectedShape()

    if (selectedShape?.type === 'task-note') {
      setSelectedShapeEditor({
        id: selectedShape.id,
        kind: 'task',
        label: 'Selected task',
        value: selectedShape.props.text,
      })
      return
    }

    if (selectedShape?.type === 'group-region') {
      setSelectedShapeEditor({
        id: selectedShape.id,
        kind: 'group',
        label: 'Selected group',
        value: selectedShape.props.label,
      })
      return
    }

    setSelectedShapeEditor(null)
  }, [])

  const performSave = useCallback(async (boardId: string, targetEditor: Editor) => {
    if (activeBoardIdRef.current !== boardId) return

    setSaveState('saving')
    const doneTasksToSave = pendingDoneTasksRef.current

    try {
      await saveBoard(boardId, getSnapshot(targetEditor.store), doneTasksToSave)
      pendingDoneTasksRef.current = []
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      setSaveState('error')
    }
  }, [])

  const debouncedSave = useMemo(
    () => debounce((boardId: string, targetEditor: Editor) => void performSave(boardId, targetEditor), 1400),
    [performSave],
  )

  const scheduleSave = useCallback(
    (targetEditor: Editor | null = editor) => {
      const boardId = activeBoardIdRef.current
      if (!targetEditor || !boardId || loadingRef.current) return
      debouncedSave(boardId, targetEditor)
    },
    [debouncedSave, editor],
  )

  const refreshArchive = useCallback(async () => {
    const boardId = activeBoardIdRef.current
    if (!boardId) return

    const response = await fetchDoneTasks(boardId)
    setDoneTasks(response.tasks)
  }, [])

  const loadBoards = useCallback(async () => {
    let response = await fetchBoards()
    if (response.boards.length === 0) {
      const { board } = await createBoard('My First Board')
      response = { boards: [board] }
    }

    setBoards(response.boards)
    return response.boards
  }, [])

  const selectBoardFromList = useCallback((availableBoards: BoardSummary[], mode: 'push' | 'replace') => {
    const requestedBoardId = getBoardIdFromPath()
    const requestedBoard = requestedBoardId ? availableBoards.find((board) => board.id === requestedBoardId) : null
    const board = requestedBoard ?? chooseFallbackBoard(availableBoards)

    if (!board) return

    navigateToBoard(board.id, mode)
    setActiveBoardId(board.id)
  }, [])

  const handleTourDone = useCallback(async () => {
    setShowTour(false)
    setBulkTaskModalOpen(false)
    try { await updateMe({ hasSeenOnboarding: true }) } catch { /* non-critical */ }
  }, [])

  const handleRestartTour = useCallback(async () => {
    try { await updateMe({ hasSeenOnboarding: false }) } catch { /* non-critical */ }
    setShowTour(true)
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const [availableBoards, me] = await Promise.all([loadBoards(), getMe()])
        selectBoardFromList(availableBoards, 'replace')
        if (!me.hasSeenOnboarding) setShowTour(true)
      } catch (error) {
        console.error(error)
        setSaveState('error')
      }
    })()
  }, [loadBoards, selectBoardFromList])

  useEffect(() => {
    const handlePopState = () => {
      selectBoardFromList(boards, 'replace')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [boards, selectBoardFromList])

  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      setEditor(mountedEditor)

      void (async () => {
        let didNormalize = false
        try {
          const boardId = activeBoardIdRef.current
          if (!boardId) return

          const [{ snapshot }, archive] = await Promise.all([fetchBoard(boardId), fetchDoneTasks(boardId)])
          if (snapshot) {
            loadSnapshot(mountedEditor.store, snapshot as never)
            didNormalize = unlockCustomShapes(mountedEditor)
          }
          setDoneTasks(archive.tasks)
          setSelectedArchiveIds([])
          setSelectedShapeEditor(null)
          setSearch('')
          setSearchMatchIds([])
          setSearchMatchIndex(0)
        } catch (error) {
          console.error(error)
          setSaveState('error')
        } finally {
          loadingRef.current = false
          if (didNormalize) scheduleSave(mountedEditor)
        }
      })()

      const cleanup = mountedEditor.store.listen(() => {
        refreshSelectedShapeEditor(mountedEditor)
        scheduleSave(mountedEditor)
      })

      return cleanup
    },
    [refreshSelectedShapeEditor, scheduleSave],
  )

  const switchBoard = useCallback(
    async (boardId: string, mode: 'push' | 'replace' = 'push') => {
      if (!boardId || boardId === activeBoardIdRef.current) return

      const currentBoardId = activeBoardIdRef.current
      if (editor && currentBoardId && !loadingRef.current) {
        await performSave(currentBoardId, editor)
      }

      loadingRef.current = true
      pendingDoneTasksRef.current = []
      setEditor(null)
      setDoneTasks([])
      setSelectedArchiveIds([])
      setSelectedShapeEditor(null)
      setSelectedShapeCount(0)
      setSearch('')
      setSearchMatchIds([])
      setSearchMatchIndex(0)
      setView('board')
      setDrawerOpen(false)
      navigateToBoard(boardId, mode)
      setActiveBoardId(boardId)
    },
    [editor, performSave],
  )

  const createNewBoard = useCallback(async () => {
    const name = window.prompt('New board name', 'Untitled Board')?.trim() || 'Untitled Board'

    try {
      const { board } = await createBoard(name)
      setBoards((current) => [board, ...current])
      await switchBoard(board.id)
    } catch (error) {
      console.error(error)
      setSaveState('error')
    }
  }, [switchBoard])

  const renameExistingBoard = useCallback(async (boardId: string, name: string) => {
    try {
      const { board } = await renameBoard(boardId, name)
      setBoards((current) => current.map((item) => (item.id === board.id ? board : item)))
    } catch (error) {
      console.error(error)
      setSaveState('error')
    }
  }, [])

  const reorderExistingBoards = useCallback(async (orderedIds: string[]) => {
    setBoards((current) => {
      const byId = new Map(current.map((b) => [b.id, b]))
      return orderedIds.map((id) => byId.get(id)).filter((b): b is typeof current[number] => b != null)
    })
    try {
      await reorderBoards(orderedIds.map((id, index) => ({ id, sortOrder: index })))
    } catch (error) {
      console.error(error)
    }
  }, [])

  const deleteExistingBoard = useCallback(
    async (boardId: string) => {
      try {
        await deleteBoard(boardId)
        const nextBoards = boards.filter((board) => board.id !== boardId)
        setBoards(nextBoards)

        if (boardId === activeBoardIdRef.current) {
          const nextBoard = chooseFallbackBoard(nextBoards)
          if (nextBoard) {
            await switchBoard(nextBoard.id, 'replace')
          }
        }
      } catch (error) {
        console.error(error)
        setSaveState('error')
        window.alert(error instanceof Error ? error.message : 'Unable to delete board')
      }
    },
    [boards, switchBoard],
  )

  const createTask = useCallback(() => {
    if (!editor) return
    const center = getViewportCenter(editor)
    const id = createShapeId()
    editor.createShape<TaskNoteShape>({
      id,
      type: 'task-note',
      x: center.x - 110,
      y: center.y - 75,
      isLocked: false,
    })
    editor.select(id)
    setSelectedShapeEditor({
      id,
      kind: 'task',
      label: 'Selected task',
      value: 'New task',
    })
    scheduleSave(editor)
  }, [editor, scheduleSave])

  const createBulkTasks = useCallback(
    (items: string[]) => {
      if (!editor || items.length === 0) return

      const center = getViewportCenter(editor)
      const columns = Math.min(4, Math.ceil(Math.sqrt(items.length)))
      const rows = Math.ceil(items.length / columns)
      const stepX = TASK_NOTE_WIDTH + BULK_TASK_GAP
      const stepY = TASK_NOTE_HEIGHT + BULK_TASK_GAP
      const startX = center.x - ((columns - 1) * stepX + TASK_NOTE_WIDTH) / 2
      const startY = center.y - ((rows - 1) * stepY + TASK_NOTE_HEIGHT) / 2
      const now = new Date().toISOString()
      const ids: TLShapeId[] = []

      items.forEach((text, index) => {
        const id = createShapeId()
        const column = index % columns
        const row = Math.floor(index / columns)
        ids.push(id)
        editor.createShape<TaskNoteShape>({
          id,
          type: 'task-note',
          x: startX + column * stepX,
          y: startY + row * stepY,
          isLocked: false,
          props: {
            w: TASK_NOTE_WIDTH,
            h: TASK_NOTE_HEIGHT,
            text,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            deletedAt: null,
            color: '#fff1a8',
          },
        })
      })

      editor.select(...ids)
      setSelectedShapeEditor(null)
      setBulkTaskModalOpen(false)
      scheduleSave(editor)
    },
    [editor, scheduleSave],
  )

  const createGroup = useCallback(() => {
    if (!editor) return
    const center = getViewportCenter(editor)
    const id = createShapeId()
    editor.createShape<GroupRegionShape>({
      id,
      type: 'group-region',
      x: center.x - 230,
      y: center.y - 160,
      isLocked: false,
    })
    editor.sendToBack([id])
    editor.select(id)
    setSelectedShapeEditor({
      id,
      kind: 'group',
      label: 'Selected group',
      value: 'Group',
    })
    scheduleSave(editor)
  }, [editor, scheduleSave])

  const markSelectedDone = useCallback(() => {
    if (!editor) return
    const completedAt = new Date().toISOString()
    const selectedTasks = editor.getSelectedShapes().filter((shape): shape is TaskNoteShape => shape.type === 'task-note')

    if (selectedTasks.length === 0) return

    const archived = selectedTasks.map((shape) => taskFromShape(shape, completedAt))
    pendingDoneTasksRef.current = [...pendingDoneTasksRef.current, ...archived]
    setDoneTasks((current) => [...archived, ...current.filter((task) => !archived.some((done) => done.id === task.id))])
    editor.deleteShapes(selectedTasks.map((shape) => shape.id))
    scheduleSave(editor)
  }, [editor, scheduleSave])

  const markTaskDoneById = useCallback(
    (id: TLShapeId) => {
      if (!editor) return
      const shape = editor.getShape(id)
      if (shape?.type !== 'task-note') return

      const archived = taskFromShape(shape, new Date().toISOString())
      pendingDoneTasksRef.current = [...pendingDoneTasksRef.current, archived]
      setDoneTasks((current) => [archived, ...current.filter((task) => task.id !== archived.id)])
      editor.deleteShapes([id])
      setSelectedShapeEditor(null)
      scheduleSave(editor)
    },
    [editor, scheduleSave],
  )

  const deleteSelected = useCallback(() => {
    if (!editor) return
    const ids = editor.getSelectedShapeIds()
    if (ids.length > 0) {
      editor.deleteShapes(ids)
      setSelectedShapeEditor(null)
      scheduleSave(editor)
    }
  }, [editor, scheduleSave])

  const deleteTaskById = useCallback(
    (id: TLShapeId) => {
      if (!editor) return
      const shape = editor.getShape(id)
      if (shape?.type !== 'task-note') return

      editor.deleteShapes([id])
      setSelectedShapeEditor(null)
      scheduleSave(editor)
    },
    [editor, scheduleSave],
  )

  const updateSelectedShapeText = useCallback(
    (value: string) => {
      if (!editor || !selectedShapeEditor) return

      const updatedAt = new Date().toISOString()

      if (selectedShapeEditor.kind === 'task') {
        editor.updateShape<TaskNoteShape>({
          id: selectedShapeEditor.id as TaskNoteShape['id'],
          type: 'task-note',
          props: { text: value, updatedAt },
        })
      } else {
        editor.updateShape<GroupRegionShape>({
          id: selectedShapeEditor.id as GroupRegionShape['id'],
          type: 'group-region',
          props: { label: value, updatedAt },
        })
      }

      setSelectedShapeEditor({ ...selectedShapeEditor, value })
      scheduleSave(editor)
    },
    [editor, scheduleSave, selectedShapeEditor],
  )

  const changeSelectedTaskColor = useCallback(
    (color: string) => {
      if (!editor) return
      const selectedTasks = editor.getSelectedShapes().filter((shape): shape is TaskNoteShape => shape.type === 'task-note')
      if (selectedTasks.length === 0) return

      const updatedAt = new Date().toISOString()
      editor.updateShapes<TaskNoteShape>(
        selectedTasks.map((shape) => ({
          id: shape.id,
          type: shape.type,
          props: { color, updatedAt },
        })),
      )
      scheduleSave(editor)
    },
    [editor, scheduleSave],
  )

  const exportJson = useCallback(() => {
    if (!editor || !activeBoardId) return
    const boardName = activeBoard?.name ?? activeBoardId
    const filenameBoard = exportName(boardName) || activeBoardId

    downloadJson(`murderboard-${filenameBoard}-${new Date().toISOString().slice(0, 10)}.json`, {
      board: {
        id: activeBoardId,
        name: boardName,
      },
      snapshot: getSnapshot(editor.store),
      doneTasks,
      exportedAt: new Date().toISOString(),
    })
  }, [activeBoard, activeBoardId, doneTasks, editor])

  const importJson = useCallback(
    async (file: File) => {
      if (!editor) return
      const data = await readJsonFile(file)
      const snapshot = typeof data === 'object' && data && 'snapshot' in data ? (data as { snapshot: unknown }).snapshot : data
      loadSnapshot(editor.store, snapshot as never)
      scheduleSave(editor)
    },
    [editor, scheduleSave],
  )

  const restoreTask = useCallback(
    async (id: string) => {
      const boardId = activeBoardIdRef.current
      if (!editor || !boardId) return

      const { task } = await restoreDoneTask(boardId, id)
      const restoredShape = task.shape as TLShape
      const shapeId = restoredShape.id as TLShapeId

      editor.createShape({
        ...restoredShape,
        id: shapeId,
        props: {
          ...restoredShape.props,
          completedAt: null,
          updatedAt: new Date().toISOString(),
        },
      } as never)
      editor.select(shapeId)
      setDoneTasks((current) => current.filter((item) => item.id !== id))
      setSelectedArchiveIds((current) => current.filter((item) => item !== id))
      scheduleSave(editor)
    },
    [editor, scheduleSave],
  )

  const deleteArchivedTask = useCallback(async (id: string) => {
    const boardId = activeBoardIdRef.current
    if (!boardId) return

    await deleteDoneTask(boardId, id)
    setDoneTasks((current) => current.filter((task) => task.id !== id))
    setSelectedArchiveIds((current) => current.filter((item) => item !== id))
  }, [])

  const deleteSelectedArchivedTasks = useCallback(async () => {
    const boardId = activeBoardIdRef.current
    if (!boardId) return
    if (selectedArchiveIds.length === 0) return

    await deleteSelectedDoneTasks(boardId, selectedArchiveIds)
    const selected = new Set(selectedArchiveIds)
    setDoneTasks((current) => current.filter((task) => !selected.has(task.id)))
    setSelectedArchiveIds([])
  }, [selectedArchiveIds])

  const deleteAllArchivedTasks = useCallback(async () => {
    const boardId = activeBoardIdRef.current
    if (!boardId) return
    if (doneTasks.length === 0) return
    if (!window.confirm('Delete all completed notes from the archive?')) return

    await deleteAllDoneTasks(boardId)
    setDoneTasks([])
    setSelectedArchiveIds([])
  }, [doneTasks.length])

  const focusSearchMatch = useCallback((targetEditor: Editor, ids: TLShapeId[], index: number) => {
    const id = ids[index]
    if (!id) return

    targetEditor.select(id)
    const bounds = targetEditor.getShapePageBounds(id)
    if (bounds) {
      targetEditor.centerOnPoint(
        { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 },
        { animation: { duration: 180 } },
      )
    }
  }, [])

  const updateSearch = useCallback(
    (value: string) => {
      setSearch(value)

      if (!editor || !value.trim()) {
        setSearchMatchIds([])
        setSearchMatchIndex(0)
        return
      }

      const needle = value.toLowerCase()
      const matches = editor
        .getCurrentPageShapesSorted()
        .filter((shape): shape is TaskNoteShape => shape.type === 'task-note')
        .filter((shape) => shape.props.text.toLowerCase().includes(needle))
        .map((shape) => shape.id)

      setSearchMatchIds(matches)
      setSearchMatchIndex(0)
      focusSearchMatch(editor, matches, 0)
    },
    [editor, focusSearchMatch],
  )

  const stepSearchMatch = useCallback(
    (direction: 1 | -1) => {
      if (!editor || searchMatchIds.length === 0) return
      const nextIndex = (searchMatchIndex + direction + searchMatchIds.length) % searchMatchIds.length
      setSearchMatchIndex(nextIndex)
      focusSearchMatch(editor, searchMatchIds, nextIndex)
    },
    [editor, focusSearchMatch, searchMatchIds, searchMatchIndex],
  )

  useEffect(() => {
    const handleTaskAction = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: string; id?: TLShapeId }>).detail
      if (!detail?.id) return

      if (detail.action === 'done') {
        markTaskDoneById(detail.id)
      }

      if (detail.action === 'delete') {
        deleteTaskById(detail.id)
      }
    }

    window.addEventListener('murderboard:task-action', handleTaskAction)
    return () => window.removeEventListener('murderboard:task-action', handleTaskAction)
  }, [deleteTaskById, markTaskDoneById])

  const archiveTasks = doneTasks.filter((task) => task.text.toLowerCase().includes(search.toLowerCase()))
  const archiveTaskIds = archiveTasks.map((task) => task.id)
  const selectedVisibleArchiveCount = selectedArchiveIds.filter((id) => archiveTaskIds.includes(id)).length
  const allVisibleArchiveSelected = archiveTasks.length > 0 && selectedVisibleArchiveCount === archiveTasks.length

  return (
    <main className="app-shell">
      <TopBar
        view={view}
        saveState={saveState}
        search={search}
        searchMatchCount={searchMatchIds.length}
        searchMatchIndex={searchMatchIds.length > 0 ? searchMatchIndex + 1 : 0}
        onViewChange={(nextView) => {
          setView(nextView)
          setDrawerOpen(false)
          if (nextView === 'archive') void refreshArchive()
        }}
        onSearchChange={updateSearch}
        onSearchStep={stepSearchMatch}
        onExportJson={exportJson}
        onImportJson={importJson}
        onMobileMenuToggle={() => setDrawerOpen((open) => !open)}
        onRestartTour={() => void handleRestartTour()}
      />

      {view === 'board' && (
        <div style={{ display: 'contents' }}>
          <BoardTabBar
            boards={boards}
            activeBoardId={activeBoardId}
            onBoardChange={(boardId) => void switchBoard(boardId)}
            onCreateBoard={() => void createNewBoard()}
            onRenameBoard={(boardId, name) => void renameExistingBoard(boardId, name)}
            onDeleteBoard={(boardId) => void deleteExistingBoard(boardId)}
            onReorderBoards={(orderedIds) => void reorderExistingBoards(orderedIds)}
          />
        </div>
      )}

      <div className="workspace-area" data-tour="workspace">
        {view === 'board' && activeBoardId ? (
          <>
            <Tldraw key={activeBoardId} shapeUtils={shapeUtils} onMount={handleMount} autoFocus colorScheme="dark" />

            <aside className="floating-dock">
              <button
                data-tour="dock-add"
                className="dock-btn dock-btn--primary"
                onClick={createTask}
                title="New task"
                aria-label="New task"
              >
                +
              </button>
              <button
                className="dock-btn"
                onClick={createGroup}
                title="New group"
                aria-label="New group"
              >
                ▢
              </button>
              <button
                className="dock-btn bulk-add"
                onClick={() => {
                  setView('board')
                  setBulkTaskModalOpen(true)
                }}
                title="Bulk add tasks"
                aria-label="Bulk add tasks"
              >
                ≡
              </button>
            </aside>

            {selectedShapeEditor && (
              <Inspector
                selectedShapeEditor={selectedShapeEditor}
                onUpdateText={updateSelectedShapeText}
                onChangeColor={changeSelectedTaskColor}
                onMarkDone={markSelectedDone}
                onDelete={deleteSelected}
                onClose={() => {
                  editor?.selectNone()
                }}
              />
            )}

            <div className="status-bar">
              <span>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Error' : 'Saved'}</span>
              <span className="status-bar-dot">·</span>
              <span>
                {boards.length} board{boards.length !== 1 ? 's' : ''}
              </span>
              <span className="status-bar-dot">·</span>
              <span>{doneTasks.length} done</span>
            </div>
          </>
        ) : (
          <div className="archive-view">
            <header>
              <h2>Done Archive</h2>
              <p>Finished notes stay here until you bring them back.</p>
            </header>
            <div className="archive-toolbar">
              <label>
                <input
                  type="checkbox"
                  checked={allVisibleArchiveSelected}
                  disabled={archiveTasks.length === 0}
                  onChange={(event) => {
                    if (event.currentTarget.checked) {
                      setSelectedArchiveIds((current) => Array.from(new Set([...current, ...archiveTaskIds])))
                    } else {
                      const visible = new Set(archiveTaskIds)
                      setSelectedArchiveIds((current) => current.filter((id) => !visible.has(id)))
                    }
                  }}
                />
                Select visible
              </label>
              <span>{selectedArchiveIds.length} selected</span>
              <button disabled={selectedArchiveIds.length === 0} onClick={deleteSelectedArchivedTasks}>
                Delete Selected
              </button>
              <button className="danger-button" disabled={doneTasks.length === 0} onClick={deleteAllArchivedTasks}>
                Delete All Completed
              </button>
            </div>
            <div className="archive-list">
              {archiveTasks.map((task) => (
                <article className="archive-item" key={task.id}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${task.text || 'Untitled task'}`}
                    checked={selectedArchiveIds.includes(task.id)}
                    onChange={(event) => {
                      if (event.currentTarget.checked) {
                        setSelectedArchiveIds((current) => Array.from(new Set([...current, task.id])))
                      } else {
                        setSelectedArchiveIds((current) => current.filter((id) => id !== task.id))
                      }
                    }}
                  />
                  <div>
                    <strong>{task.text || 'Untitled task'}</strong>
                    <span>{task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Completed'}</span>
                  </div>
                  <div className="archive-item-actions">
                    <button onClick={() => void restoreTask(task.id)}>Restore</button>
                    <button className="danger-button" onClick={() => void deleteArchivedTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {archiveTasks.length === 0 ? <p className="empty-state">No completed tasks match.</p> : null}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom drawer */}
      <div className={`mobile-drawer ${drawerOpen ? 'mobile-drawer--open' : ''}`}>
        <div className="mobile-drawer-header">
          <strong>Menu</strong>
          <button className="mobile-drawer-close" onClick={() => setDrawerOpen(false)}>
            ×
          </button>
        </div>
        <div className="mobile-drawer-divider" />
        {boards.map((board) => (
          <button
            key={board.id}
            className={board.id === activeBoardId ? 'mobile-drawer-board--active' : ''}
            onClick={() => {
              void switchBoard(board.id)
              setDrawerOpen(false)
            }}
          >
            {board.name}
          </button>
        ))}
        <button
          onClick={() => {
            void createNewBoard()
            setDrawerOpen(false)
          }}
        >
          + New Board
        </button>
        <div className="mobile-drawer-divider" />
        <button
          onClick={() => {
            createTask()
            setDrawerOpen(false)
          }}
        >
          New Task
        </button>
        <button
          onClick={() => {
            setView('board')
            setBulkTaskModalOpen(true)
            setDrawerOpen(false)
          }}
        >
          Bulk Add Tasks
        </button>
        <button
          onClick={() => {
            createGroup()
            setDrawerOpen(false)
          }}
        >
          New Group
        </button>
        <div className="mobile-drawer-divider" />
        <button
          onClick={() => {
            const nextView = view === 'archive' ? 'board' : 'archive'
            setView(nextView)
            setDrawerOpen(false)
            if (nextView === 'archive') void refreshArchive()
          }}
        >
          {view === 'archive' ? '← Back to Board' : 'Done Archive'}
        </button>
        <button onClick={exportJson}>Export JSON</button>
        <label>
          Import JSON
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              if (file) {
                void importJson(file)
                setDrawerOpen(false)
              }
              e.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      <BulkTaskModal
        isOpen={bulkTaskModalOpen}
        onClose={() => setBulkTaskModalOpen(false)}
        onSubmit={createBulkTasks}
      />

      {showTour && (
        <OnboardingTour
          onComplete={() => void handleTourDone()}
          onSkip={() => void handleTourDone()}
          onEnterStep={(index) => {
            if (index === 2) setBulkTaskModalOpen(true)
            if (index === 3) setBulkTaskModalOpen(false)
            if (index === 4) createTask()
            if (index === 5) editor?.selectNone()
          }}
        />
      )}
    </main>
  )
}
