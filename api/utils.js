import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.AUTH_SECRET

if (!JWT_SECRET) {
  throw new Error('AUTH_SECRET is not set. Add it to your environment variables.')
}

export const parseBody = (req) => {
  if (!req.body) return {}
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
}

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export const verifyPassword = (password, storedHash) => {
  const [salt, originalHash] = storedHash.split(':')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === originalHash
}

export const createToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

export const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload === 'string' || !payload.userId) return null
    return payload.userId
  } catch {
    return null
  }
}
