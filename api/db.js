import { neon } from '@neondatabase/serverless'
import { HttpError } from './utils.js'

let sqlClient = null

const getSqlClient = () => {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new HttpError(
        500,
        'Server misconfigured: missing DATABASE_URL environment variable.',
        'MISSING_DATABASE_URL',
      )
    }
    sqlClient = neon(connectionString)
  }
  return sqlClient
}

export const sql = (...args) => getSqlClient()(...args)

let schemaPromise = null

export const ensureSchema = async () => {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        name text NOT NULL,
        created_at timestamptz DEFAULT now(),
        settings jsonb NOT NULL DEFAULT '{"theme":"system","soundEnabled":true,"mathDuration":5,"mathDifficulty":"medium","memoryCardCount":12}',
        stats jsonb NOT NULL DEFAULT '{"totalSessions":0,"totalTimePlayed":0,"currentStreak":0,"lastPlayedAt":null}'
      );`;

      await sql`CREATE TABLE IF NOT EXISTS game_sessions (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_type text NOT NULL,
        started_at timestamptz NOT NULL,
        ended_at timestamptz,
        duration integer,
        score integer NOT NULL,
        mistakes integer NOT NULL,
        details jsonb NOT NULL
      );`;
    })();
  }

  return schemaPromise
}
