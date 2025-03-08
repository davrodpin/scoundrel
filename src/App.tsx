import { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Grid, Paper, Stack, Tooltip } from '@mui/material';
import { useGame } from './hooks/useGame';
import { initializeDeck } from './utils/deck';
import { Card } from './components/Card';
import { Monster, Weapon, HealthPotion, GameCard } from './types/cards';

function DeckPile({ count, label, onClick, topCard }: { count: number; label: string; onClick?: () => void; topCard?: GameCard }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box 
        sx={{ 
          position: 'relative', 
          width: 120, 
          height: 180, 
          display: 'inline-block',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
      >
        {count > 0 && (
          <>
            {count > 1 && (
              <>
                <Paper
                  sx={{
                    position: 'absolute',
                    width: 120,
                    height: 180,
                    backgroundColor: '#666',
                    top: 4,
                    left: 4,
                    border: '2px solid #444',
                    borderRadius: 1,
                  }}
                />
                <Paper
                  sx={{
                    position: 'absolute',
                    width: 120,
                    height: 180,
                    backgroundColor: '#666',
                    top: 2,
                    left: 2,
                    border: '2px solid #444',
                    borderRadius: 1,
                  }}
                />
              </>
            )}
            {topCard ? (
              <Box sx={{ position: 'relative' }}>
                <Card card={topCard} />
              </Box>
            ) : (
              <Paper
                sx={{
                  width: 120,
                  height: 180,
                  backgroundColor: '#666',
                  position: 'relative',
                  border: '2px solid #444',
                  borderRadius: 1,
                  backgroundImage: 'repeating-linear-gradient(45deg, #555 0, #555 2px, #666 2px, #666 8px)',
                }}
              />
            )}
          </>
        )}
      </Box>
      <Typography variant="h6" sx={{ mt: 1 }}>{label}</Typography>
      <Typography>({count} cards)</Typography>
    </Box>
  );
}

function WeaponStack({ weapon, monstersSlain }: { weapon: Weapon; monstersSlain: Monster[] }) {
  return (
    <Box sx={{ position: 'relative', width: 120, minHeight: 180, transform: 'rotate(180deg)' }}>
      {/* Base weapon card */}
      <Box sx={{ position: 'relative' }}>
        <Card card={weapon} />
      </Box>
      
      {/* Stacked monster cards */}
      {monstersSlain.map((monster, index) => (
        <Box
          key={`${monster.suit}-${monster.rank}`}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translateY(-${(index + 1) * 30}px)`,
            width: '100%',
          }}
        >
          <Card card={monster} />
        </Box>
      ))}
    </Box>
  );
}

function App() {
  const { state, actions } = useGame();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the game with a new deck
    const deck = initializeDeck();
    actions.initializeGame(deck);
  }, []);

  const handleCardClick = (card: GameCard, index: number) => {
    switch (card.type) {
      case 'MONSTER':
        if (state.equippedWeapon) {
          const monster = card as Monster;
          const canUseWeapon = state.equippedWeapon.damage >= monster.damage;
          
          if (canUseWeapon) {
            actions.useWeapon(monster);
          } else {
            actions.fightMonster(monster);
          }
        } else {
          actions.fightMonster(card as Monster);
        }
        
        // Check if there's only one card left (the one being removed) and draw a new room
        if (state.room.length === 1 && !state.gameOver) {
          setTimeout(() => actions.drawRoom(), 100);
        }
        break;
      
      case 'WEAPON':
        actions.equipWeapon(card as Weapon);
        if (state.room.length === 1 && !state.gameOver) {
          setTimeout(() => actions.drawRoom(), 100);
        }
        break;
      
      case 'HEALTH_POTION':
        actions.useHealthPotion(card as HealthPotion);
        if (state.room.length === 1 && !state.gameOver) {
          setTimeout(() => actions.drawRoom(), 100);
        }
        break;
    }
  };

  const getMonsterTooltip = (monster: Monster) => {
    if (!state.equippedWeapon) {
      return "⚠️ You will fight barehanded and take full damage!";
    }
    
    const canUseWeapon = state.equippedWeapon.damage >= monster.damage;
    
    if (!canUseWeapon) {
      return "⚠️ Your weapon is too weak! You will fight barehanded and take full damage!";
    }
    
    return "";
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Scoundrel
        </Typography>
        
        {/* Player Status */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h5">
            Health: {state.health}/{state.maxHealth}
          </Typography>
        </Box>

        {/* Game Area */}
        <Box sx={{ mb: 4 }}>
          {/* Decks and Room */}
          <Grid container spacing={2} justifyContent="center" alignItems="flex-start">
            {/* Dungeon Deck */}
            <Grid item>
              <DeckPile 
                count={state.dungeon.length} 
                label="Dungeon" 
                onClick={() => state.gameOver || state.room.length > 1 ? null : actions.drawRoom()}
              />
            </Grid>

            {/* Current Room */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                {state.room.map((card, index) => {
                  if (card.type === 'MONSTER') {
                    const monster = card as Monster;
                    const cardKey = `${card.suit}-${card.rank}`;
                    const showFist = !state.equippedWeapon || (
                      state.equippedWeapon && state.equippedWeapon.damage < monster.damage
                    );

                    return (
                      <Box key={cardKey}>
                        <Tooltip 
                          title={getMonsterTooltip(monster)}
                          open={showFist && hoveredCard === cardKey}
                          arrow
                        >
                          <Box 
                            onMouseEnter={() => setHoveredCard(cardKey)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            <Card 
                              card={monster} 
                              onClick={() => handleCardClick(monster, index)}
                              showFist={showFist}
                            />
                          </Box>
                        </Tooltip>
                      </Box>
                    );
                  }

                  return (
                    <Card 
                      key={`${card.suit}-${card.rank}`} 
                      card={card} 
                      onClick={() => handleCardClick(card, index)} 
                    />
                  );
                })}
              </Box>
            </Grid>

            {/* Discard Pile */}
            <Grid item>
              <DeckPile 
                count={state.discardPile.length} 
                label="Discard" 
                topCard={state.discardPile[state.discardPile.length - 1]}
              />
            </Grid>
          </Grid>

          {/* Equipped Weapon and Slain Monsters */}
          {state.equippedWeapon && (
            <Box sx={{ 
              mt: 4, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              mb: `${state.equippedWeapon.monstersSlain.length * 30 + 20}px`
            }}>
              <WeaponStack weapon={state.equippedWeapon} monstersSlain={state.equippedWeapon.monstersSlain} />
            </Box>
          )}

          {/* Controls */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            position: 'relative',
            zIndex: 1
          }}>
            <Button
              variant="outlined"
              onClick={actions.avoidRoom}
              disabled={state.gameOver || !state.canAvoidRoom || state.room.length === 0}
            >
              Avoid Room
            </Button>
          </Box>
        </Box>

        {/* Game Over */}
        {state.gameOver && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color={state.health > 0 ? 'success.main' : 'error.main'}>
              Game Over!
            </Typography>
            <Typography variant="h4">
              Final Score: {state.score}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Play Again
            </Button>
          </Box>
        )}
      </Box>

      {/* Copyright Footer */}
      <Box sx={{ 
        mt: 4, 
        textAlign: 'center', 
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        pt: 2
      }}>
        <Typography variant="body2" color="text.secondary">
          <a 
            href="http://www.stfj.net/art/2011/Scoundrel.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#90caf9',
              textDecoration: 'none',
              transition: 'color 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#bbdefb'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#90caf9'}
          >Game rules</a> © 2011 Zach Gage & Kurt Bieg
        </Typography>
      </Box>
    </Container>
  );
}

export default App;