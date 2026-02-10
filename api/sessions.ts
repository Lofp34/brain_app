import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureSchema, sql } from './db';
import { getUserFromRequest, handleError, parseBody } from './utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await ensureSchema();

    const user = await getUserFromRequest(req);
    if (!user) {
        handleError(res, 'Unauthorized', 401);
        return;
    }

    if (req.method === 'GET') {
        const sessions = await sql`SELECT id, game_type as "gameType", started_at as "startedAt", ended_at as "endedAt", duration, score, mistakes, details FROM game_sessions WHERE user_id = ${user.id} ORDER BY started_at DESC LIMIT 50;`;
        res.status(200).json({ sessions });
        return;
    }

    if (req.method === 'POST') {
        const body = parseBody(req);
        const session = body.session as {
            id: string;
            gameType: string;
            startedAt: string;
            endedAt?: string;
            duration?: number;
            score: number;
            mistakes: number;
            details?: unknown;
        } | undefined;

        if (!session || !session.id || !session.gameType || !session.startedAt) {
            handleError(res, 'Session payload is required.');
            return;
        }

        const now = new Date();
        const lastPlayed = user.stats?.lastPlayedAt ? new Date(user.stats.lastPlayedAt) : null;
        let nextStreak = user.stats?.currentStreak ?? 0;

        if (lastPlayed) {
            const isSameDay = now.toDateString() === lastPlayed.toDateString();
            if (!isSameDay) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const playedYesterday = yesterday.toDateString() === lastPlayed.toDateString();
                nextStreak = playedYesterday ? nextStreak + 1 : 1;
            }
        } else {
            nextStreak = 1;
        }

        const updatedStats = {
            ...user.stats,
            totalSessions: (user.stats?.totalSessions ?? 0) + 1,
            currentStreak: nextStreak,
            lastPlayedAt: now.toISOString()
        };

        await sql`INSERT INTO game_sessions (id, user_id, game_type, started_at, ended_at, duration, score, mistakes, details)
            VALUES (${session.id}, ${user.id}, ${session.gameType}, ${session.startedAt}, ${session.endedAt ?? null}, ${session.duration ?? null}, ${session.score}, ${session.mistakes}, ${session.details ?? {}});`;

        const [updatedUser] = await sql`UPDATE users SET stats = ${updatedStats} WHERE id = ${user.id} RETURNING id, email, name, settings, stats, created_at as "createdAt";`;

        res.status(201).json({ profile: updatedUser, session });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
