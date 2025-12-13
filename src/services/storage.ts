import type { UserProfile, GameSession } from '../types';

const STORAGE_KEYS = {
    USER_PROFILE: 'brain_app_user',
    SESSIONS: 'brain_app_sessions',
    AUTH_TOKEN: 'brain_app_token',
};

export const StorageService = {
    getUserProfile: (): UserProfile | null => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading user profile:', error);
            return null;
        }
    },

    saveUserProfile: (profile: UserProfile): void => {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        } catch (error) {
            console.error('Error saving user profile:', error);
        }
    },

    saveAuthToken: (token: string): void => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        } catch (error) {
            console.error('Error saving auth token:', error);
        }
    },

    getAuthToken: (): string | null => {
        try {
            return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        } catch (error) {
            console.error('Error reading auth token:', error);
            return null;
        }
    },

    getSessions: (): GameSession[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading sessions:', error);
            return [];
        }
    },

    saveSessions: (sessions: GameSession[]): void => {
        try {
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    },

    saveSession: (session: GameSession): void => {
        try {
            const sessions = StorageService.getSessions();
            sessions.push(session);
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    },

    clearData: (): void => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    }
};
