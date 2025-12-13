import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db';

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
    throw new Error('AUTH_SECRET is not set. Add it to your Vercel project to sign user tokens.');
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    settings: Record<string, unknown>;
    stats: Record<string, unknown>;
    createdAt: string;
}

export const hashPassword = (password: string): string => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
    const [salt, key] = stored.split(':');
    const hashBuffer = Buffer.from(key, 'hex');
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derived);
};

export const createToken = (userId: string) => jwt.sign({ sub: userId }, AUTH_SECRET, { expiresIn: '30d' });

export const decodeToken = (token: string) => jwt.verify(token, AUTH_SECRET) as { sub: string };

export const parseBody = (req: VercelRequest) => {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body || '{}');
    }
    return (req.body as Record<string, unknown>) || {};
};

export const getUserFromRequest = async (req: VercelRequest): Promise<AuthenticatedUser | null> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.replace('Bearer ', '').trim();
    try {
        const payload = decodeToken(token);
        const [user] = await sql<AuthenticatedUser[]>`SELECT id, email, name, settings, stats, created_at as "createdAt" FROM users WHERE id = ${payload.sub}`;
        return user ?? null;
    } catch {
        return null;
    }
};

export const handleError = (res: VercelResponse, message: string, status = 400) => {
    res.status(status).json({ error: message });
};
