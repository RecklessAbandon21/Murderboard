import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  const commit = process.env.GIT_COMMIT_SHA ?? 'unknown'
  const shortCommit = process.env.GIT_COMMIT_SHORT ?? (commit !== 'unknown' ? commit.slice(0, 7) : 'unknown')
  const repoUrl = process.env.PUBLIC_REPO_URL ?? ''
  const builtAt = process.env.BUILD_TIMESTAMP ?? new Date().toISOString()

  res.json({
    version: process.env.APP_VERSION ?? '0.0.0-local',
    commit,
    shortCommit,
    repoUrl,
    commitUrl: repoUrl && commit !== 'unknown' ? `${repoUrl}/commit/${commit}` : '',
    builtAt,
  })
})

export default router
