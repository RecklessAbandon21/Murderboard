import mongoose, { Schema } from 'mongoose'

export interface BoardDocument {
  key: string
  userId: string
  name: string
  snapshot: unknown
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const BoardSchema = new Schema<BoardDocument>(
  {
    key: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    name: { type: String, required: true, default: 'Main Board' },
    snapshot: { type: Schema.Types.Mixed, default: null },
    sortOrder: { type: Number, default: Date.now },
  },
  { timestamps: true },
)

BoardSchema.index({ userId: 1, sortOrder: 1 })

export const Board = mongoose.model<BoardDocument>('Board', BoardSchema)
