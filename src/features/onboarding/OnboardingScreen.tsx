import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Brain } from 'lucide-react';

export const OnboardingScreen = () => {
    const { createProfile, login } = useUser();
    const [mode, setMode] = useState<'register' | 'login'>('register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        setError(null);
        if (mode === 'register' && !name.trim()) return;
        if (!email.trim() || !password.trim()) return;

        try {
            setIsSubmitting(true);
            if (mode === 'register') {
                await createProfile(name, email, password);
            } else {
                await login(email, password);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unable to continue.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
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
                    {error && (
                        <div className="text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
                            {error}
                        </div>
                    )}
                    {mode === 'register' && (
                        <Input
                            label="What should we call you?"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    )}
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleStart}
                        disabled={isSubmitting || (mode === 'register' ? !name.trim() : false) || !email.trim() || !password.trim()}
                    >
                        {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                        {mode === 'register' ? 'Already have an account?' : "New here?"}{' '}
                        <button
                            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                            className="text-primary-600 font-semibold hover:underline"
                        >
                            {mode === 'register' ? 'Sign in' : 'Create one'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
