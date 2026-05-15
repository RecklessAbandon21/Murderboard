import { Router } from 'express'
import { requireAuth, getAuth } from '@clerk/express'
import { User } from '../models/User.js'

const router = Router()

router.use(requireAuth())

router.get('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const user = await User.findOne({ userId }).lean()
    res.json({ hasSeenOnboarding: user?.hasSeenOnboarding ?? false })
  } catch (error) {
    next(error)
  }
})

router.patch('/', async (req, res, next) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

    const update: Partial<{ hasSeenOnboarding: boolean }> = {}
    if (typeof req.body?.hasSeenOnboarding === 'boolean') {
      update.hasSeenOnboarding = req.body.hasSeenOnboarding
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' })
      return
    }

    await User.findOneAndUpdate({ userId }, { $set: update }, { upsert: true, new: true })
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

export default router
