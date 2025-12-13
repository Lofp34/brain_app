import type { UserProfile, GameSession } from '../types';

const STORAGE_KEYS = {
    USER_PROFILE: 'brain_app_user',
    SESSIONS: 'brain_app_sessions',
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

    getSessions: (): GameSession[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading sessions:', error);
            return [];
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
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    }
};
