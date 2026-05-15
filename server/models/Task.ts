import mongoose, { Schema } from 'mongoose'

export interface TaskDocument {
  boardId: string
  taskId: string
  text: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
  deletedAt?: Date | null
  shape: unknown
}

const TaskSchema = new Schema<TaskDocument>(
  {
    boardId: { type: String, required: true, default: 'main' },
    taskId: { type: String, required: true },
    text: { type: String, required: true, default: '' },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    shape: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: false },
)

TaskSchema.index({ boardId: 1, taskId: 1 }, { unique: true })
TaskSchema.index({ boardId: 1, completedAt: -1 })

export const Task = mongoose.model<TaskDocument>('Task', TaskSchema, 'archivedTasks')
