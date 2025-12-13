import crypto from 'node:crypto'
import { ensureSchema, sql } from './db.js'
import { createToken, hashPassword, parseBody } from './utils.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const body = parseBody(req)
  const name = body.name?.trim()
  const email = body.email?.toLowerCase()
  const password = body.password

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' })
    return
  }

  const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing) {
    res.status(400).json({ error: 'An account already exists for this email.' })
    return
  }

  const id = crypto.randomUUID()
  const passwordHash = hashPassword(password)
  const defaultSettings = {
    theme: 'system',
    soundEnabled: true,
    mathDuration: 5,
    mathDifficulty: 'medium',
    memoryCardCount: 12,
    openAIKey: '',
  }
  const defaultStats = {
    totalSessions: 0,
    totalTimePlayed: 0,
    currentStreak: 0,
    lastPlayedAt: null,
  }

  const [inserted] = await sql`INSERT INTO users (id, email, password_hash, name, settings, stats)
    VALUES (${id}, ${email}, ${passwordHash}, ${name}, ${defaultSettings}, ${defaultStats})
    RETURNING id, email, name, settings, stats, created_at as "createdAt";`

  const token = createToken(inserted.id)

  res.status(201).json({ token, profile: inserted, sessions: [] })
}
