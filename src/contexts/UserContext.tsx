import React, { createContext, useContext, useEffect, useState } from 'react';
import type { GameSession, UserProfile, UserSettings } from '../types';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';

interface UserContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
    createProfile: (name: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    resetProfile: () => void;
    addSession: (session: GameSession) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const savedToken = StorageService.getAuthToken();
            if (!savedToken) {
                setIsLoading(false);
                return;
            }

            try {
                const [profileResponse, sessionsResponse] = await Promise.all([
                    AuthService.getProfile(savedToken),
                    AuthService.fetchSessions(savedToken)
                ]);

                setToken(savedToken);
                setProfile(profileResponse.profile);
                StorageService.saveUserProfile(profileResponse.profile);
                StorageService.saveSessions(sessionsResponse.sessions);
            } catch (error) {
                console.error('Error loading profile from API', error);
                StorageService.clearData();
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleAuthentication = (authResponse: { token: string; profile: UserProfile; sessions: GameSession[]; }) => {
        setToken(authResponse.token);
        setProfile(authResponse.profile);
        StorageService.saveAuthToken(authResponse.token);
        StorageService.saveUserProfile(authResponse.profile);
        StorageService.saveSessions(authResponse.sessions);
    };

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        if (!profile || !token) return;
        const response = await AuthService.updateSettings(token, newSettings);
        setProfile(response.profile);
        StorageService.saveUserProfile(response.profile);
    };

    const createProfile = async (name: string, email: string, password: string) => {
        const response = await AuthService.register(name, email, password);
        handleAuthentication(response);
    };

    const login = async (email: string, password: string) => {
        const response = await AuthService.login(email, password);
        handleAuthentication(response);
    };

    const resetProfile = () => {
        StorageService.clearData();
        setToken(null);
        setProfile(null);
    };

    const addSession = async (session: GameSession) => {
        if (!profile || !token) return;

        StorageService.saveSession(session);
        const response = await AuthService.saveSession(token, session);
        setProfile(response.profile);
        StorageService.saveUserProfile(response.profile);
    };

    return (
        <UserContext.Provider value={{ profile, isLoading, updateSettings, createProfile, login, resetProfile, addSession }}>
            {children}
        </UserContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
