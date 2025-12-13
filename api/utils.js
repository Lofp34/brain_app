import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const requireJwtSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.STACK_SECRET_SERVER_KEY
  if (!secret) {
    throw new HttpError(
      500,
      'Server misconfigured: missing AUTH_SECRET (or STACK_SECRET_SERVER_KEY) environment variable.',
      'MISSING_AUTH_SECRET'
    )
  }
  return secret
}

export const parseBody = (req) => {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}')
    } catch {
      throw new HttpError(400, 'Invalid JSON body.', 'INVALID_JSON')
    }
  }
  return req.body
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
  return jwt.sign({ userId }, requireJwtSecret(), { expiresIn: '30d' })
}

export const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, requireJwtSecret())
    if (typeof payload === 'string' || !payload.userId) return null
    return payload.userId
  } catch {
    return null
  }
}

export const withErrorHandling = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error(error)
    const status = error.status || 500
    let message = 'Internal server error.'

    if (error.code === 'MISSING_AUTH_SECRET') {
      message = 'Server configuration error: set AUTH_SECRET or STACK_SECRET_SERVER_KEY.'
    } else if (error.code === 'MISSING_DATABASE_URL') {
      message = 'Server configuration error: DATABASE_URL is missing.'
    } else if (error.code === 'INVALID_JSON') {
      message = error.message
    }

    res.status(status).json({ error: message })
  }
}

export { HttpError }
