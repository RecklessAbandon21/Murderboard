import cors from 'cors'
import dotenv from 'dotenv'
import express, { type ErrorRequestHandler } from 'express'
import mongoose from 'mongoose'
import { clerkMiddleware } from '@clerk/express'
import boardsRouter from './routes/boards.js'
import meRouter from './routes/me.js'
import versionRouter from './routes/version.js'
import { runMigrations } from './migrations.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 4000)
const mongoUri = process.env.MONGO_URI

if (!mongoUri) throw new Error('MONGO_URI is required')
if (!process.env.CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY is required')

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(clerkMiddleware())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/version', versionRouter)
app.use('/api/boards', boardsRouter)
app.use('/api/me', meRouter)

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)

await mongoose.connect(mongoUri)
await runMigrations()

app.listen(port, () => {
  console.log(`Murderboard API listening on ${port}`)
})
