import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { getAuth, requireAuth } from '@clerk/express'
import { Board } from '../models/Board.js'
import { Task } from '../models/Task.js'

const router = Router()

// All board routes require a valid Clerk session
router.use(requireAuth())

type DoneTaskPayload = {
  id: string
  text: string
  createdAt: string
  updatedAt: string
  completedAt: string
  deletedAt?: string | null
  shape: unknown
}

function boardSummary(board: { key: string; name: string; sortOrder: number; createdAt: Date; updatedAt: Date }) {
  return {
    id: board.key,
    name: board.name,
    sortOrder: board.sortOrder,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  }
}

function doneTaskPayload(task: {
  taskId: string
  text: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
  deletedAt?: Date | null
  shape: unknown
}) {
  return {
    id: task.taskId,
    text: task.text,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
    deletedAt: task.deletedAt,
    shape: task.shape,
  }
}

async function createBoardId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const key = randomBytes(4).toString('hex')
    const exists = await Board.exists({ key })
    if (!exists) return key
  }

  throw new Error('Unable to generate a board id')
}

router.get('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const boards = await Board.find({ userId }).sort({ sortOrder: 1, createdAt: 1 }).lean()
    res.json({ boards: boards.map(boardSummary) })
  } catch (error) {
    next(error)
  }
})

router.post('/reorder', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const updates = Array.isArray(req.body?.boards)
      ? (req.body.boards as unknown[]).filter(
          (u): u is { id: string; sortOrder: number } =>
            typeof (u as { id?: unknown }).id === 'string' &&
            typeof (u as { sortOrder?: unknown }).sortOrder === 'number',
        )
      : []

    if (updates.length === 0) {
      res.json({ ok: true })
      return
    }

    await Promise.all(
      updates.map(({ id, sortOrder }) =>
        Board.updateOne({ key: id, userId }, { $set: { sortOrder } }),
      ),
    )

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const rawName = typeof req.body?.name === 'string' ? req.body.name : ''
    const name = rawName.trim() || 'Untitled Board'
    const board = await Board.create({ key: await createBoardId(), userId, name: name.slice(0, 80), snapshot: null })

    res.status(201).json({ board: boardSummary(board) })
  } catch (error) {
    next(error)
  }
})

router.get('/:boardId', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const board = await Board.findOne({ key: req.params.boardId, userId }).lean()
    if (!board) {
      res.status(404).json({ error: 'Board not found' })
      return
    }

    res.json({
      id: board.key,
      name: board.name,
      snapshot: board.snapshot ?? null,
      updatedAt: board.updatedAt ?? null,
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:boardId', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const { snapshot, doneTasks = [] } = req.body as { snapshot: unknown; doneTasks?: DoneTaskPayload[] }
    const board = await Board.findOneAndUpdate(
      { key: req.params.boardId, userId },
      { $set: { snapshot } },
      { new: true },
    ).lean()

    if (!board) {
      res.status(404).json({ error: 'Board not found' })
      return
    }

    if (Array.isArray(doneTasks) && doneTasks.length > 0) {
      await Promise.all(
        doneTasks.map((task) =>
          Task.findOneAndUpdate(
            { boardId: board.key, taskId: task.id },
            {
              $set: {
                boardId: board.key,
                taskId: task.id,
                text: task.text,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
                completedAt: new Date(task.completedAt),
                deletedAt: task.deletedAt ? new Date(task.deletedAt) : null,
                shape: task.shape,
              },
            },
            { upsert: true, new: true },
          ),
        ),
      )
    }

    res.json({ ok: true, updatedAt: board.updatedAt ?? new Date() })
  } catch (error) {
    next(error)
  }
})

router.patch('/:boardId', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) {
      res.status(400).json({ error: 'Board name is required' })
      return
    }

    const board = await Board.findOneAndUpdate(
      { key: req.params.boardId, userId },
      { $set: { name: name.slice(0, 80) } },
      { new: true },
    ).lean()

    if (!board) {
      res.status(404).json({ error: 'Board not found' })
      return
    }

    res.json({ board: boardSummary(board) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:boardId', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const boardCount = await Board.countDocuments({ userId })
    if (boardCount <= 1) {
      res.status(409).json({ error: 'Cannot delete the last board' })
      return
    }

    const board = await Board.findOneAndDelete({ key: req.params.boardId, userId }).lean()
    if (!board) {
      res.status(404).json({ error: 'Board not found' })
      return
    }

    await Task.deleteMany({ boardId: board.key })
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.get('/:boardId/tasks/done', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    // Verify the board belongs to this user before returning tasks
    const board = await Board.exists({ key: req.params.boardId, userId })
    if (!board) { res.status(404).json({ error: 'Board not found' }); return }

    const tasks = await Task.find({ boardId: req.params.boardId, completedAt: { $ne: null }, deletedAt: null })
      .sort({ completedAt: -1 })
      .lean()

    res.json({ tasks: tasks.map(doneTaskPayload) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:boardId/tasks/done', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const board = await Board.exists({ key: req.params.boardId, userId })
    if (!board) { res.status(404).json({ error: 'Board not found' }); return }

    const now = new Date()
    const result = await Task.updateMany(
      { boardId: req.params.boardId, completedAt: { $ne: null }, deletedAt: null },
      { $set: { deletedAt: now, updatedAt: now } },
    )

    res.json({ ok: true, deletedCount: result.modifiedCount })
  } catch (error) {
    next(error)
  }
})

router.post('/:boardId/tasks/done/delete-selected', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const board = await Board.exists({ key: req.params.boardId, userId })
    if (!board) { res.status(404).json({ error: 'Board not found' }); return }

    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === 'string') : []

    if (ids.length === 0) {
      res.json({ ok: true, deletedCount: 0 })
      return
    }

    const now = new Date()
    const result = await Task.updateMany(
      { boardId: req.params.boardId, taskId: { $in: ids }, completedAt: { $ne: null }, deletedAt: null },
      { $set: { deletedAt: now, updatedAt: now } },
    )

    res.json({ ok: true, deletedCount: result.modifiedCount })
  } catch (error) {
    next(error)
  }
})

router.delete('/:boardId/tasks/done/:id', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const board = await Board.exists({ key: req.params.boardId, userId })
    if (!board) { res.status(404).json({ error: 'Board not found' }); return }

    const now = new Date()
    const task = await Task.findOneAndUpdate(
      { boardId: req.params.boardId, taskId: req.params.id, completedAt: { $ne: null }, deletedAt: null },
      { $set: { deletedAt: now, updatedAt: now } },
      { new: true },
    ).lean()

    if (!task) {
      res.status(404).json({ error: 'Completed task not found' })
      return
    }

    res.json({ ok: true, id: task.taskId, deletedAt: task.deletedAt })
  } catch (error) {
    next(error)
  }
})

router.post('/:boardId/tasks/:id/restore', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const board = await Board.exists({ key: req.params.boardId, userId })
    if (!board) { res.status(404).json({ error: 'Board not found' }); return }

    const task = await Task.findOneAndUpdate(
      { boardId: req.params.boardId, taskId: req.params.id, deletedAt: null },
      { $set: { completedAt: null, updatedAt: new Date() } },
      { new: true },
    ).lean()

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    res.json({ task: doneTaskPayload(task) })
  } catch (error) {
    next(error)
  }
})

export default router
