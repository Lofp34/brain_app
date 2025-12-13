import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Brain } from 'lucide-react';

export const OnboardingScreen = () => {
    const { createProfile } = useUser();
    const [name, setName] = useState('');


    const handleStart = () => {
        if (!name.trim()) return;
        createProfile(name, {
            theme: 'system',
            soundEnabled: true,
            mathDuration: 5,
            mathDifficulty: 'medium',
            memoryCardCount: 12
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 animate-slide-up">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
                        <Brain size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-center text-gray-900">Welcome to Brain App</h1>
                    <p className="text-center text-gray-500">
                        Your daily cognitive training coach.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            label="What should we call you?"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleStart}
                        disabled={!name.trim()}
                    >
                        Start Training
                    </Button>
                </div>
            </div>
        </div>
    );
};
