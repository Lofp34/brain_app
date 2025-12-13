import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/Button';
import { Calculator, Dna, Settings, Trophy } from 'lucide-react';

export const DashboardScreen = () => {
    const { profile } = useUser();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back, {profile?.name}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Ready to train your brain today?
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/settings')}
                        className="rounded-full w-10 h-10 p-0"
                    >
                        <Settings size={20} />
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Daily Goal / Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                        <span className="text-3xl font-bold text-primary-600">{profile?.stats.currentStreak}</span>
                        <span className="text-sm text-gray-500 font-medium">Day Streak</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                        <span className="text-3xl font-bold text-primary-600">{profile?.stats.totalSessions}</span>
                        <span className="text-sm text-gray-500 font-medium">Sessions</span>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Training Modules</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/math')}
                            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left transition-all hover:shadow-md hover:border-primary-100"
                        >
                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                <Calculator size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Mental Math</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Boost calculation speed and accuracy with adaptive exercises.
                            </p>
                        </button>

                        <button
                            onClick={() => navigate('/memory')}
                            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left transition-all hover:shadow-md hover:border-purple-100"
                        >
                            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                                <Dna size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Memory</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Enhance visual memory and concentration with pattern matching.
                            </p>
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/results')}
                    >
                        <Trophy size={20} className="mr-2" />
                        View Full Statistics
                    </Button>
                </div>
            </main>
        </div>
    );
};
