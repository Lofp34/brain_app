import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureSchema, sql } from './db';
import { createToken, hashPassword, parseBody } from './utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    await ensureSchema();

    const body = parseBody(req);
    const name = (body.name as string | undefined)?.trim();
    const email = (body.email as string | undefined)?.toLowerCase();
    const password = body.password as string | undefined;

    if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
    }

    const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing) {
        res.status(400).json({ error: 'An account already exists for this email.' });
        return;
    }

    const id = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const defaultSettings = {
        theme: 'system',
        soundEnabled: true,
        mathDuration: 5,
        mathDifficulty: 'medium',
        memoryCardCount: 12,
        openAIKey: ''
    };
    const defaultStats = {
        totalSessions: 0,
        totalTimePlayed: 0,
        currentStreak: 0,
        lastPlayedAt: null
    };

    const [inserted] = await sql`INSERT INTO users (id, email, password_hash, name, settings, stats)
        VALUES (${id}, ${email}, ${passwordHash}, ${name}, ${defaultSettings}, ${defaultStats})
        RETURNING id, email, name, settings, stats, created_at as "createdAt";`;

    const token = createToken(inserted.id);

    res.status(201).json({ token, profile: inserted, sessions: [] });
}
