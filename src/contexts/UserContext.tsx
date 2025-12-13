import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, UserSettings } from '../types';
import { StorageService } from '../services/storage';

interface UserContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    updateSettings: (settings: Partial<UserSettings>) => void;
    createProfile: (name: string, initialSettings: UserSettings) => void;
    resetProfile: () => void;
    addSession: (session: import('../types').GameSession) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = () => {
            const savedProfile = StorageService.getUserProfile();
            setProfile(savedProfile);
            setIsLoading(false);
        };
        loadProfile();
    }, []);

    const updateSettings = (newSettings: Partial<UserSettings>) => {
        if (!profile) return;
        const updatedProfile = {
            ...profile,
            settings: { ...profile.settings, ...newSettings },
        };
        setProfile(updatedProfile);
        StorageService.saveUserProfile(updatedProfile);
    };

    const createProfile = (name: string, initialSettings: UserSettings) => {
        const newProfile: UserProfile = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date().toISOString(),
            settings: initialSettings,
            stats: {
                totalSessions: 0,
                totalTimePlayed: 0,
                currentStreak: 0,
                lastPlayedAt: null,
            },
        };
        setProfile(newProfile);
        StorageService.saveUserProfile(newProfile);
    };

    const resetProfile = () => {
        StorageService.clearData();
        setProfile(null);
    };

    const addSession = (session: import('../types').GameSession) => {
        if (!profile) return;

        // 1. Save session
        StorageService.saveSession(session);

        // 2. Update Stats
        const now = new Date();
        const lastPlayed = profile.stats.lastPlayedAt ? new Date(profile.stats.lastPlayedAt) : null;

        let newStreak = profile.stats.currentStreak;
        if (lastPlayed) {
            const isSameDay = now.getDate() === lastPlayed.getDate() &&
                now.getMonth() === lastPlayed.getMonth() &&
                now.getFullYear() === lastPlayed.getFullYear();

            if (!isSameDay) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const playedYesterday = yesterday.getDate() === lastPlayed.getDate() &&
                    yesterday.getMonth() === lastPlayed.getMonth() &&
                    yesterday.getFullYear() === lastPlayed.getFullYear();

                if (playedYesterday) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }
            }
        } else {
            newStreak = 1;
        }

        const updatedProfile: UserProfile = {
            ...profile,
            stats: {
                ...profile.stats,
                totalSessions: profile.stats.totalSessions + 1,
                currentStreak: newStreak,
                lastPlayedAt: now.toISOString(),
            }
        };

        setProfile(updatedProfile);
        StorageService.saveUserProfile(updatedProfile);
    };

    return (
        <UserContext.Provider value={{ profile, isLoading, updateSettings, createProfile, resetProfile, addSession }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
