import type { GameSession, UserProfile, UserSettings } from '../types';
import { apiRequest } from './api';

export interface AuthResponse {
    token: string;
    profile: UserProfile;
    sessions: GameSession[];
}

export const AuthService = {
    register: (name: string, email: string, password: string) =>
        apiRequest<AuthResponse>('/api/auth-register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        }),

    login: (email: string, password: string) =>
        apiRequest<AuthResponse>('/api/auth-login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getProfile: (token: string) =>
        apiRequest<{ profile: UserProfile }>('/api/profile', {
            token,
        }),

    updateSettings: (token: string, settings: Partial<UserSettings>) =>
        apiRequest<{ profile: UserProfile }>('/api/profile', {
            method: 'PUT',
            token,
            body: JSON.stringify({ settings }),
        }),

    fetchSessions: (token: string) =>
        apiRequest<{ sessions: GameSession[] }>('/api/sessions', {
            token,
        }),

    saveSession: (token: string, session: GameSession) =>
        apiRequest<{ profile: UserProfile; session: GameSession }>('/api/sessions', {
            method: 'POST',
            token,
            body: JSON.stringify({ session }),
        }),
};
