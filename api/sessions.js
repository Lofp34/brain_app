import crypto from 'node:crypto'
import { ensureSchema, sql } from './db.js'
import { parseBody, verifyToken } from './utils.js'

export default async function handler(req, res) {
  await ensureSchema()

  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  const userId = token ? verifyToken(token) : null

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const sessions = await sql`SELECT id, game_type as "gameType", started_at as "startedAt", ended_at as "endedAt", duration, score, mistakes, details FROM game_sessions WHERE user_id = ${userId} ORDER BY started_at DESC LIMIT 50`
    res.status(200).json({ sessions })
    return
  }

  if (req.method === 'POST') {
    const body = parseBody(req)
    const gameType = body.gameType
    const startedAt = body.startedAt
    const endedAt = body.endedAt
    const duration = body.duration
    const score = body.score
    const mistakes = body.mistakes
    const details = body.details

    if (!gameType || !startedAt || score === undefined || mistakes === undefined || !details) {
      res.status(400).json({ error: 'Missing required fields.' })
      return
    }

    const id = crypto.randomUUID()
    await sql`INSERT INTO game_sessions (id, user_id, game_type, started_at, ended_at, duration, score, mistakes, details)
      VALUES (${id}, ${userId}, ${gameType}, ${startedAt}, ${endedAt || null}, ${duration || null}, ${score}, ${mistakes}, ${details})`

    res.status(201).json({ id })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
