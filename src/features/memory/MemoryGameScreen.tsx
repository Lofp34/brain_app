import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/Button';
import { MemoryEngine, type MemoryCard } from './memoryEngine';
import type { GameSession } from '../../types';
import { StorageService } from '../../services/storage';
import { ArrowLeft, Clock, RotateCcw, Play, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

type GameState = 'config' | 'playing' | 'finished';

export const MemoryGameScreen = () => {
    const navigate = useNavigate();
    const { profile } = useUser();

    // Config
    const [gameState, setGameState] = useState<GameState>('config');
    const [cardCount, setCardCount] = useState(profile?.settings.memoryCardCount || 12);

    // Game
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [startTime, setStartTime] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const startGame = () => {
        setGameState('playing');
        setCards(MemoryEngine.generateDeck(cardCount));
        setFlippedIndices([]);
        setMatchedPairs(0);
        setMoves(0);
        setSeconds(0);
        setStartTime(new Date().toISOString());
        setIsProcessing(false);
    };

    const handleCardClick = (index: number) => {
        if (
            isProcessing ||
            cards[index].isFlipped ||
            cards[index].isMatched ||
            flippedIndices.includes(index)
        ) return;

        // Flip the card visually
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            setIsProcessing(true);
            checkForMatch(newFlipped, newCards);
        }
    };

    const checkForMatch = (indices: number[], currentCards: MemoryCard[]) => {
        const [firstIndex, secondIndex] = indices;

        if (currentCards[firstIndex].value === currentCards[secondIndex].value) {
            // Match
            setTimeout(() => {
                const matchedCards = [...currentCards];
                matchedCards[firstIndex].isMatched = true;
                matchedCards[secondIndex].isMatched = true;
                setCards(matchedCards);
                setFlippedIndices([]);
                setMatchedPairs(p => p + 1);
                setIsProcessing(false);
            }, 500);
        } else {
            // No Match
            setTimeout(() => {
                const resetCards = [...currentCards];
                resetCards[firstIndex].isFlipped = false;
                resetCards[secondIndex].isFlipped = false;
                setCards(resetCards);
                setFlippedIndices([]);
                setIsProcessing(false);
            }, 1000);
        }
    };

    const finishGame = useCallback(() => {
        setGameState('finished');
        const session: GameSession = {
            id: crypto.randomUUID(),
            gameType: 'memory',
            startedAt: startTime,
            endedAt: new Date().toISOString(),
            score: cardCount / 2, // Pairs found (all of them)
            mistakes: moves - (cardCount / 2), // Rough estimate of mistakes: total moves minus minimum required moves
            details: {
                cardCount,
                moves,
                pairsFound: cardCount / 2
            }
        };
        StorageService.saveSession(session);
    }, [cardCount, moves, startTime]);

    // Win Checker
    useEffect(() => {
        if (gameState === 'playing' && matchedPairs > 0 && matchedPairs === cardCount / 2) {
            finishGame();
        }
    }, [matchedPairs, cardCount, gameState, finishGame]);

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    if (gameState === 'config') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <Button variant="ghost" onClick={() => navigate('/')} className="p-0 h-10 w-10">
                            <ArrowLeft />
                        </Button>
                        <h1 className="text-2xl font-bold">Memory Setup</h1>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Cards</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[8, 12, 16, 20].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCardCount(c)}
                                    className={`p-2 rounded-lg border ${cardCount === c ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-200'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button size="lg" className="w-full mt-6" onClick={startGame}>
                        <Play className="mr-2" size={20} /> Start Game
                    </Button>
                </div>
            </div>
        );
    }

    if (gameState === 'finished') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">Well Done!</h1>

                    <div className="grid grid-cols-2 gap-4 py-6">
                        <div className="bg-primary-50 p-4 rounded-xl">
                            <div className="text-3xl font-bold text-primary-600">{moves}</div>
                            <div className="text-sm text-primary-800">Moves</div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{seconds}s</div>
                            <div className="text-sm text-indigo-800">Time</div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                            Dashboard
                        </Button>
                        <Button className="flex-1" onClick={() => setGameState('config')}>
                            <RotateCcw className="mr-2" size={18} /> Replay
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white p-4 shadow-sm flex justify-between items-center">
                <Button variant="ghost" onClick={() => setGameState('config')} className="text-gray-500">Stop</Button>
                <div className="flex items-center space-x-2 text-xl font-mono font-bold text-gray-700">
                    <Clock size={24} />
                    <span>{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="text-sm font-medium bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                    Moves: {moves}
                </div>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center">
                <div className={`grid gap-4 w-full max-w-2xl mx-auto`} style={{
                    gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cardCount))}, minmax(0, 1fr))`
                }}>
                    {cards.map((card, index) => (
                        <motion.button
                            key={card.id}
                            onClick={() => handleCardClick(index)}
                            className="aspect-square relative perspective-1000"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className={`w-full h-full rounded-xl transition-all duration-300 transform-style-3d ${card.isFlipped || card.isMatched ? 'rotate-y-180 bg-white border-2 border-primary-200' : 'bg-primary-600 shadow-md'
                                } flex items-center justify-center text-4xl shadow-sm`}>
                                {(card.isFlipped || card.isMatched) ? card.value : (
                                    <BrainCircuit className="text-white opacity-20" size="40%" />
                                )}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};
