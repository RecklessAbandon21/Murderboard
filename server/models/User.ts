import mongoose, { Schema } from 'mongoose'

export interface UserDocument {
  userId: string
  hasSeenOnboarding: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDocument>(
  {
    userId: { type: String, required: true, unique: true },
    hasSeenOnboarding: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const User = mongoose.model<UserDocument>('User', UserSchema)
