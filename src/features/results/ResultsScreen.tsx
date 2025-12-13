import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storage';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Trophy, Medal, Rocket } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ResultsScreen = () => {
    const navigate = useNavigate();

    // Process Data
    const sessions = useMemo(() => StorageService.getSessions(), []);

    const mathSessions = useMemo(() =>
        sessions.filter(s => s.gameType === 'math').sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
        [sessions]);

    const chartData = useMemo(() => {
        return mathSessions.slice(-10).map((s, i) => ({
            name: `S${i + 1}`,
            score: s.score,
            date: new Date(s.startedAt).toLocaleDateString()
        }));
    }, [mathSessions]);

    // Badges Logic
    const badges = useMemo(() => {
        const list = [];
        if (sessions.length >= 1) list.push({ id: 'novice', icon: <Rocket />, title: 'Novice', desc: 'First step taken!' });
        if (sessions.length >= 10) list.push({ id: 'regular', icon: <Trophy />, title: 'Regular', desc: '10 Sessions completed' });

        const highScore = Math.max(...sessions.map(s => s.score));
        if (highScore >= 20) list.push({ id: 'sharp', icon: <Medal />, title: 'Sharp Mind', desc: 'Score 20+ in a session' });

        return list;
    }, [sessions]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center shadow-sm sticky top-0 z-10">
                <Button variant="ghost" onClick={() => navigate('/')} className="mr-4 p-0 h-10 w-10">
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Your Progress</h1>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">

                {/* Chart Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Math Performance (Last 10)</h2>
                    {mathSessions.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            No math sessions yet. Start playing!
                        </div>
                    )}
                </section>

                {/* Badges Section */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Badges & Achievements</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {badges.map(badge => (
                            <div key={badge.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                                    {badge.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{badge.title}</h3>
                                    <p className="text-xs text-gray-500">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                        {badges.length === 0 && (
                            <div className="col-span-3 text-center py-8 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                Keep playing to unlock badges!
                            </div>
                        )}
                    </div>
                </section>

                {/* History List (Simple) */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent History</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {sessions.slice().reverse().slice(0, 5).map((session, i) => (
                            <div key={session.id} className={`p-4 flex justify-between items-center ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                                <div>
                                    <div className="font-medium text-gray-900 capitalize">{session.gameType} Session</div>
                                    <div className="text-xs text-gray-500">{new Date(session.startedAt).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-primary-600">{session.score} pts</div>
                                    <div className="text-xs text-gray-400">{session.mistakes} mistakes</div>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                No history available.
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};
