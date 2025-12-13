import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureSchema, sql } from './db';
import { createToken, parseBody, verifyPassword } from './utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    await ensureSchema();

    const body = parseBody(req);
    const email = (body.email as string | undefined)?.toLowerCase();
    const password = body.password as string | undefined;

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }

    type UserRecord = {
        id: string;
        password_hash: string;
        name: string;
        email: string;
        settings: Record<string, unknown>;
        stats: Record<string, unknown>;
        createdAt: string;
    };

    const [user] = await sql<UserRecord[]>`
        SELECT id, password_hash, name, email, settings, stats, created_at as "createdAt" FROM users WHERE email = ${email}`;

    if (!user || !verifyPassword(password, user.password_hash)) {
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
    }

    const token = createToken(user.id);
    const { password_hash: _passwordHash, ...rest } = user;
    void _passwordHash;

    const sessions = await sql`SELECT id, game_type as "gameType", started_at as "startedAt", ended_at as "endedAt", duration, score, mistakes, details FROM game_sessions WHERE user_id = ${user.id} ORDER BY started_at DESC LIMIT 50`;

    res.status(200).json({ token, profile: rest, sessions });
}
