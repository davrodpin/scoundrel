import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useGame } from '../hooks/useGame';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
  currentScore: number;
  gameOver?: boolean;
}

export function Leaderboard({ open, onClose, currentScore, gameOver }: LeaderboardProps) {
  const { actions, leaderboardEntries } = useGame();

  useEffect(() => {
    if (open) {
      actions.fetchLeaderboard();
    }
  }, [open, actions]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{ 
        '& .MuiDialog-paper': { 
          minHeight: '400px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2
        },
        zIndex: 1050
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">
          Leaderboard
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
            '&:hover': {
              color: (theme) => theme.palette.grey[700],
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboardEntries.map((entry, index) => (
                <TableRow 
                  key={entry.id}
                  title={`Player ID: ${entry.playerId}\nSession ID: ${entry.sessionId}`}
                  sx={{ cursor: 'help' }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{entry.playerName}</TableCell>
                  <TableCell align="right">{entry.score}</TableCell>
                  <TableCell align="right">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {leaderboardEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No entries yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
} 