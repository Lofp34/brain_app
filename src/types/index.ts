export type GameType = 'math' | 'memory';

export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type MathMode = 'classic' | 'sprint' | 'precision' | 'custom';
export type MathDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    soundEnabled: boolean;
    mathDuration: number;
    mathDifficulty: MathDifficulty;
    memoryCardCount: number;
    openAIKey?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    createdAt: string; // ISO date
    settings: UserSettings;
    stats: {
        totalSessions: number;
        totalTimePlayed: number; // seconds
        currentStreak: number;
        lastPlayedAt: string | null;
    };
}

export interface MathQuestion {
    id: string;
    operation: MathOperation;
    operandA: number;
    operandB: number;
    correctAnswer: number;
    userAnswer?: number;
    isCorrect?: boolean;
    timeTaken?: number; // ms
}

export interface GameSession {
    id: string;
    gameType: GameType;
    startedAt: string;
    endedAt?: string;
    duration?: number; // seconds
    score: number;
    mistakes: number;
    details: any; // MathSessionDetails | MemorySessionDetails
}

export interface MathSessionDetails {
    mode: MathMode;
    questionsAttempted: number;
    questionsCorrect: number;
    averageTimePerQuestion: number;
}

export interface MemorySessionDetails {
    cardCount: number;
    moves: number;
    pairsFound: number;
}
