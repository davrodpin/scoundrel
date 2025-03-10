import { Paper, Typography, Box } from '@mui/material';
import { GameCard, Suit } from '../types/cards';
import { useState } from 'react';

interface CardProps {
  card: GameCard;
  onClick?: () => void;
  showFist?: boolean;
}

// Add reverse mapping from symbols to suit names
const symbolToSuit: Record<string, Suit> = {
  '♥': 'HEARTS',
  '♦': 'DIAMONDS',
  '♣': 'CLUBS',
  '♠': 'SPADES'
};

// Make colors more vivid for better contrast
const suitColors = {
  HEARTS: '#e31b23',
  DIAMONDS: '#e31b23',
  CLUBS: '#000000',
  SPADES: '#000000'
} as const;

export function Card({ card, onClick, showFist }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get the proper suit name and color
  const suitName = typeof card.suit === 'string' ? (symbolToSuit[card.suit] || card.suit) : card.suit;
  const color = suitColors[suitName as keyof typeof suitColors];

  // Debug log only in development mode
  if (import.meta.env.DEV) {
    console.log('Card render:', {
      suit: card.suit,
      suitName,
      color,
      rank: card.rank,
      type: card.type
    });
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: 120,
        height: 180,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: '#fff',
        border: (showFist && isHovered) ? '2px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.12)',
        animation: (showFist && isHovered) ? 'pulse 1s infinite' : 'none',
        '@keyframes pulse': {
          '0%': { borderColor: '#ff0000' },
          '50%': { borderColor: '#ff000080' },
          '100%': { borderColor: '#ff0000' }
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
      {/* Top Left Corner */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          color: color || '#000000'
        }}
      >
        <Typography sx={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>
          {card.rank}
        </Typography>
        <Typography sx={{ fontSize: '24px', lineHeight: 1, ml: 0.5 }}>
          {card.suit}
        </Typography>
      </Box>

      {/* Center Suit */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: color || '#000000'
        }}
      >
        <Typography sx={{ fontSize: '48px', lineHeight: 1 }}>
          {card.suit}
        </Typography>
      </Box>

      {/* Bottom Right Corner */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          transform: 'rotate(180deg)',
          color: color || '#000000'
        }}
      >
        <Typography sx={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>
          {card.rank}
        </Typography>
        <Typography sx={{ fontSize: '24px', lineHeight: 1, ml: 0.5 }}>
          {card.suit}
        </Typography>
      </Box>
    </Paper>
  );
} 