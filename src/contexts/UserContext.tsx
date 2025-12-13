import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, UserSettings } from '../types';
import { StorageService } from '../services/storage';

interface UserContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    updateSettings: (settings: Partial<UserSettings>) => void;
    createProfile: (name: string, initialSettings: UserSettings) => void;
    resetProfile: () => void;
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

    return (
        <UserContext.Provider value={{ profile, isLoading, updateSettings, createProfile, resetProfile }}>
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
