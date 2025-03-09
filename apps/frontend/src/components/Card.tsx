import { Paper, Typography, Box } from '@mui/material';
import { GameCard } from '../types/cards';
import { useState } from 'react';

interface CardProps {
  card: GameCard;
  onClick?: () => void;
  showFist?: boolean;
}

const suitSymbols = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠'
};

const suitColors = {
  HEARTS: '#ff0000',
  DIAMONDS: '#ff0000',
  CLUBS: '#000000',
  SPADES: '#000000'
};

export function Card({ card, onClick, showFist }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isMonster = card.type === 'MONSTER';
  const isWeapon = card.type === 'WEAPON';
  const isPotion = card.type === 'HEALTH_POTION';

  return (
    <Paper
      elevation={3}
      sx={{
        width: 120,
        height: 180,
        display: 'flex',
        flexDirection: 'column',
        padding: 1,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        backgroundColor: '#fff',
        border: (showFist && isHovered) ? '2px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.12)',
        animation: (showFist && isHovered) ? 'pulse 1s infinite' : 'none',
        '@keyframes pulse': {
          '0%': {
            borderColor: '#ff0000'
          },
          '50%': {
            borderColor: '#ff000080'
          },
          '100%': {
            borderColor: '#ff0000'
          }
        },
        '&:hover': onClick ? {
          transform: 'translateY(-5px)',
          transition: 'transform 0.2s'
        } : {}
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rank and Suit in Top Corner */}
      <Box sx={{ 
        color: suitColors[card.suit],
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <Typography variant="h6" sx={{ lineHeight: 1 }}>
          {card.rank}
        </Typography>
        <Typography variant="h6" sx={{ lineHeight: 1 }}>
          {suitSymbols[card.suit]}
        </Typography>
      </Box>

      {/* Card Type and Value */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          {isMonster && 'Monster'}
          {isWeapon && 'Weapon'}
          {isPotion && 'Potion'}
        </Typography>
        <Typography variant="h5">
          {isMonster && `Damage: ${(card as any).damage}`}
          {isWeapon && `Damage: ${(card as any).damage}`}
          {isPotion && `Heal: ${(card as any).healing}`}
        </Typography>
      </Box>

      {/* Rank and Suit in Bottom Corner (inverted) */}
      <Box sx={{ 
        color: suitColors[card.suit],
        transform: 'rotate(180deg)',
        alignSelf: 'flex-end',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <Typography variant="h6" sx={{ lineHeight: 1 }}>
          {card.rank}
        </Typography>
        <Typography variant="h6" sx={{ lineHeight: 1 }}>
          {suitSymbols[card.suit]}
        </Typography>
      </Box>
    </Paper>
  );
} 