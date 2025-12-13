export interface MemoryCard {
    id: string;
    value: string; // Icon identifier or value
    isFlipped: boolean;
    isMatched: boolean;
}

export const MemoryEngine = {
    generateDeck: (cardCount: number): MemoryCard[] => {
        // We need cardCount / 2 pairs
        const pairCount = Math.floor(cardCount / 2);

        // Icons/Values pool (using simple emojis or lucide icon names for now)
        const icons = ['🌟', '🌙', '🌈', '⚡', '🔥', '💧', '🍀', '🍎', '🚀', '🎸', '🎮', '🧩', '🏆', '💎', '🔔', '⚓'];

        const selectedIcons = icons.slice(0, pairCount);

        // Create pairs
        const cards: MemoryCard[] = [];
        selectedIcons.forEach(icon => {
            // First card of pair
            cards.push({ id: crypto.randomUUID(), value: icon, isFlipped: false, isMatched: false });
            // Second card of pair
            cards.push({ id: crypto.randomUUID(), value: icon, isFlipped: false, isMatched: false });
        });

        // Shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }

        return cards;
    },
};
