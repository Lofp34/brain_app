import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, LogOut, Save, Trash2 } from 'lucide-react';

export const SettingsScreen = () => {
    const navigate = useNavigate();
    const { profile, updateSettings, resetProfile } = useUser();
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (profile?.settings.openAIKey) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setApiKey(profile.settings.openAIKey);
        }
    }, [profile]);

    const handleSave = async () => {
        await updateSettings({ openAIKey: apiKey });
        alert('Settings saved!');
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            resetProfile();
            navigate('/'); // Will redirect to onboarding
        }
    };

    const handleLogout = () => {
        resetProfile();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center shadow-sm">
                <Button variant="ghost" onClick={() => navigate('/')} className="mr-4 p-0 h-10 w-10">
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8">

                {/* API Setup */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">AI Configuration</h2>
                    <p className="text-sm text-gray-500">
                        To enable the AI Coach, please provide your OpenAI API Key.
                        It will be stored locally on your device.
                    </p>

                    <div className="flex gap-2">
                        <Input
                            type={showKey ? "text" : "password"}
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <Button variant="outline" onClick={() => setShowKey(!showKey)}>
                            {showKey ? 'Hide' : 'Show'}
                        </Button>
                    </div>
                    <Button onClick={handleSave} className="w-full">
                        <Save className="mr-2" size={18} /> Save Key
                    </Button>
                </section>

                {/* Account */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Account</h2>
                    <p className="text-sm text-gray-500">Sign out of your account and return to onboarding.</p>
                    <Button variant="secondary" className="w-full" onClick={handleLogout}>
                        <LogOut className="mr-2" size={18} /> Log out
                    </Button>
                </section>

                {/* Data Management */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
                    <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={handleReset}>
                        <Trash2 className="mr-2" size={18} /> Reset All Data
                    </Button>
                </section>

            </main>
        </div>
    );
};
