import { GameCard, Suit, Rank, Monster, Weapon, HealthPotion } from '../types/cards';

function getCardValue(rank: Rank): number {
  switch (rank) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(rank, 10);
  }
}

export function initializeDeck(): GameCard[] {
  const deck: GameCard[] = [];
  const suits: Suit[] = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  for (const suit of suits) {
    for (const rank of ranks) {
      const value = getCardValue(rank);
      
      // Pular cartas vermelhas de face (incluindo Ases)
      if ((suit === 'HEARTS' || suit === 'DIAMONDS') && 
          (rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A')) {
        continue;
      }

      let card: GameCard;

      if (suit === 'CLUBS' || suit === 'SPADES') {
        const monsterCard: Monster = {
          suit,
          rank,
          value,
          type: 'MONSTER',
          damage: value
        };
        card = monsterCard;
      } else if (suit === 'DIAMONDS') {
        const weaponCard: Weapon = {
          suit,
          rank,
          value,
          type: 'WEAPON',
          damage: value,
          monstersSlain: []
        };
        card = weaponCard;
      } else { // HEARTS
        const potionCard: HealthPotion = {
          suit,
          rank,
          value,
          type: 'HEALTH_POTION',
          healing: value
        };
        card = potionCard;
      }

      deck.push(card);
    }
  }

  // Embaralhar o deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
} 