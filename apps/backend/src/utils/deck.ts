import { GameCard, Suit, Rank, Monster, Weapon, HealthPotion } from '../types/cards';

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCard(suit: Suit, rank: Rank): GameCard {
  const value = getRankValue(rank);
  
  switch (suit) {
    case '♠':
    case '♣':
      // Monsters: All cards from Clubs and Spades (2-A)
      return {
        type: 'MONSTER',
        suit,
        rank,
        damage: value
      };
    case '♦':
      // Weapons: Only number cards from Diamonds (2-10)
      return {
        type: 'WEAPON',
        suit,
        rank,
        damage: value,
        monstersSlain: []
      };
    case '♥':
      // Health Potions: Only number cards from Hearts (2-10)
      return {
        type: 'HEALTH_POTION',
        suit,
        rank,
        healing: value
      };
  }
}

function getRankValue(rank: Rank): number {
  const rankMap: { [key in Rank]: number } = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11,
    '10': 10, '9': 9, '8': 8, '7': 7,
    '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankMap[rank];
}

export function initializeDeck(): GameCard[] {
  // Define all possible suits and ranks
  const suits: Suit[] = ['♠', '♣', '♥', '♦'];
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const deck: GameCard[] = [];
  
  // Expected card counts:
  // Monsters (♠♣): 26 cards (2-A from both suits)
  // Weapons (♦): 9 cards (2-10)
  // Health Potions (♥): 9 cards (2-10)
  // Total: 44 cards
  
  for (const suit of suits) {
    for (const rank of ranks) {
      // Skip face cards (J,Q,K) and aces for hearts and diamonds
      if ((suit === '♥' || suit === '♦') && 
          (rank === 'A' || rank === 'K' || rank === 'Q' || rank === 'J')) {
        continue;
      }
      deck.push(createCard(suit, rank));
    }
  }
  
  return shuffle(deck);
} 