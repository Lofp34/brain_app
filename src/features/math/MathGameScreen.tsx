import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/Button';
import { WheelPicker } from '../../components/ui/WheelPicker';
import { MathEngine } from './mathEngine';
import type { MathQuestion, MathDifficulty, GameSession } from '../../types';
import { AIService } from '../../services/ai';
import { ArrowLeft, Clock, RotateCcw, Play } from 'lucide-react';

type GameState = 'config' | 'playing' | 'finished';

export const MathGameScreen = () => {
    const navigate = useNavigate();
    const { profile, addSession } = useUser();

    // Config State
    const [gameState, setGameState] = useState<GameState>('config');
    const [difficulty, setDifficulty] = useState<MathDifficulty>(profile?.settings.mathDifficulty || 'medium');
    const [duration, setDuration] = useState(profile?.settings.mathDuration || 5);

    // Game State
    const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState<string>('');
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    // AI Feedback State
    const [feedback, setFeedback] = useState<string>('');
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    useEffect(() => {
        if (gameState === 'finished' && !feedback && profile?.settings.openAIKey) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoadingFeedback(true);
            AIService.getCoachFeedback(profile.settings.openAIKey, score, mistakes, 'math')
                .then(f => setFeedback(f))
                .catch(() => setFeedback("Could not load coaching."))
                .finally(() => setIsLoadingFeedback(false));
        }
    }, [gameState, score, mistakes, profile?.settings.openAIKey, feedback]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setMistakes(0);
        setQuestionsAnswered(0);
        setTimeLeft(duration * 60);
        setStartTime(new Date().toISOString());
        nextQuestion();
    };

    const nextQuestion = useCallback(() => {
        const q = MathEngine.generateQuestion(difficulty);
        setCurrentQuestion(q);
        setInputValue('');
    }, [difficulty]);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!currentQuestion) return;

        const answer = parseInt(inputValue);
        if (isNaN(answer)) return;

        const isCorrect = MathEngine.checkAnswer(currentQuestion, answer);

        if (isCorrect) {
            setScore(s => s + 1);
        } else {
            setMistakes(m => m + 1);
        }
        setQuestionsAnswered(q => q + 1);
        nextQuestion();

        // Keep focus
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const finishGame = useCallback(() => {
        setGameState('finished');
        const session: GameSession = {
            id: crypto.randomUUID(),
            gameType: 'math',
            startedAt: startTime,
            endedAt: new Date().toISOString(),
            score,
            mistakes,
            details: {
                mode: 'classic',
                questionsAttempted: questionsAnswered,
                questionsCorrect: score,
                averageTimePerQuestion: 0 // TODO: implement tracking
            }
        };
        addSession(session);
    }, [score, mistakes, startTime, questionsAnswered, addSession]);

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, finishGame]);

    if (gameState === 'config') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <Button variant="ghost" onClick={() => navigate('/')} className="p-0 h-10 w-10">
                            <ArrowLeft />
                        </Button>
                        <h1 className="text-2xl font-bold">Mental Math Setup</h1>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['easy', 'medium', 'hard'] as MathDifficulty[]).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`p-2 rounded-lg capitalize border ${difficulty === d ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-200'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Duration (Minutes)</label>
                            <div className="flex justify-center bg-gray-50 rounded-2xl py-4 border border-gray-100 shadow-inner">
                                <WheelPicker
                                    min={1}
                                    max={10}
                                    value={duration}
                                    onChange={setDuration}
                                />
                            </div>
                        </div>
                    </div>

                    <Button size="lg" className="w-full mt-6" onClick={startGame}>
                        <Play className="mr-2" size={20} /> Start Session
                    </Button>
                </div>
            </div>
        );
    }



    if (gameState === 'finished') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">Session Complete!</h1>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="bg-green-50 p-4 rounded-xl">
                            <div className="text-3xl font-bold text-green-600">{score}</div>
                            <div className="text-sm text-green-800">Correct</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl">
                            <div className="text-3xl font-bold text-red-600">{mistakes}</div>
                            <div className="text-sm text-red-800">Base Errors</div>
                        </div>
                    </div>

                    {/* AI Feedback Section */}
                    {profile?.settings.openAIKey ? (
                        <div className="bg-primary-50 p-4 rounded-xl text-left">
                            <h3 className="text-sm font-bold text-primary-900 mb-1 flex items-center">
                                <span className="mr-2">🤖</span> Coach says:
                            </h3>
                            {isLoadingFeedback ? (
                                <p className="text-sm text-primary-600 animate-pulse">Thinking...</p>
                            ) : (
                                <p className="text-sm text-primary-700">{feedback}</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400">
                            Add API Key in settings to enable Coach
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                            Dashboard
                        </Button>
                        <Button className="flex-1" onClick={() => {
                            setFeedback('');
                            setGameState('config');
                        }}>
                            <RotateCcw className="mr-2" size={18} /> Retry
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Game Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 p-4 flex justify-between items-center shadow-sm supports-[backdrop-filter]:bg-white/60">
                <Button
                    variant="ghost"
                    onClick={() => setGameState('config')}
                    className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                    size="sm"
                >
                    Stop
                </Button>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-gray-100/50 px-4 py-1.5 rounded-full border border-gray-200/50">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-mono text-lg font-bold text-gray-700 tabular-nums">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-600/70">Score</span>
                    <span className="font-bold tabular-nums">{score}</span>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                <div className="text-6xl font-bold text-gray-900 tracking-wider">
                    {currentQuestion?.operandA}
                    <span className="mx-4 text-primary-500">
                        {currentQuestion?.operation === 'multiplication' ? '×' :
                            currentQuestion?.operation === 'division' ? '÷' :
                                currentQuestion?.operation === 'addition' ? '+' : '-'}
                    </span>
                    {currentQuestion?.operandB}
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-xs">
                    <input
                        ref={inputRef}
                        type="number"
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full text-center text-4xl font-bold p-4 rounded-2xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                        placeholder="?"
                    />
                    <Button type="submit" className="w-full mt-6" size="lg">
                        Submit
                    </Button>
                </form>
            </div>

            {/* Instructions */}
            <div className="p-4 text-center text-gray-400 text-sm">
                Press Enter to submit
            </div>
        </div>
    );
};
