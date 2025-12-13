import { ensureSchema, sql } from './db.js'
import { verifyToken, withErrorHandling } from './utils.js'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  const userId = token ? verifyToken(token) : null

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const [profile] = await sql`SELECT id, name, email, settings, stats, created_at as "createdAt" FROM users WHERE id = ${userId}`
  if (!profile) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const sessions = await sql`SELECT id, game_type as "gameType", started_at as "startedAt", ended_at as "endedAt", duration, score, mistakes, details FROM game_sessions WHERE user_id = ${userId} ORDER BY started_at DESC LIMIT 50`

  res.status(200).json({ profile, sessions })
}

export default withErrorHandling(handler)
