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
        res.status(200).json({ profile: user });
        return;
    }

    if (req.method === 'PUT') {
        const body = parseBody(req);
        const settings = body.settings as Record<string, unknown> | undefined;
        const name = (body.name as string | undefined)?.trim();

        if (!settings && !name) {
            handleError(res, 'Nothing to update.');
            return;
        }

        const nextSettings = settings ? { ...user.settings, ...settings } : user.settings;
        const nextName = name || user.name;

        const [updated] = await sql`UPDATE users SET settings = ${nextSettings}, name = ${nextName} WHERE id = ${user.id} RETURNING id, email, name, settings, stats, created_at as "createdAt";`;

        res.status(200).json({ profile: updated });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
