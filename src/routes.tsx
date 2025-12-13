import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import { OnboardingScreen } from './features/onboarding/OnboardingScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { MathGameScreen } from './features/math/MathGameScreen';
import { MemoryGameScreen } from './features/memory/MemoryGameScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ResultsScreen } from './features/results/ResultsScreen';

const AppRoutes = () => {
    const { profile, isLoading } = useUser();

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!profile) {
        return <OnboardingScreen />;
    }

    return (
        <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/math" element={<MathGameScreen />} />
            <Route path="/memory" element={<MemoryGameScreen />} />
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
