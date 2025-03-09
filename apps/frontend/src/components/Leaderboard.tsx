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
  TextField,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: string;
}

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
  currentScore: number;
  gameOver?: boolean;
}

const API_URL = 'http://localhost:3000';

export function Leaderboard({ open, onClose, currentScore, gameOver }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Only reset the player name and error when closing
      setPlayerName('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    // Reset all states when game is not over
    if (!gameOver) {
      setSubmitted(false);
      setPlayerName('');
      setError('');
    }
  }, [gameOver]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get<LeaderboardEntry[]>(`${API_URL}/leaderboard`);
      setEntries(response.data);
    } catch (err) {
      setError('Failed to load leaderboard');
    }
  };

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      await axios.post(`${API_URL}/leaderboard`, {
        playerName: playerName.trim(),
        score: currentScore
      });
      await fetchLeaderboard();
      setSubmitted(true);
      setPlayerName('');
      setError('');
    } catch (err) {
      setError('Failed to submit score');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{ '& .MuiDialog-paper': { minHeight: '400px' } }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {gameOver && !submitted ? 'Game Over - Submit Your Score' : 'Leaderboard'}
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
        {gameOver && !submitted && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Game Over! Your score: {currentScore}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                error={!!error}
                helperText={error}
                size="small"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
              />
              <Button variant="contained" onClick={handleSubmit}>
                Submit
              </Button>
            </Box>
          </Box>
        )}

        {submitted && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="success.main" align="center" gutterBottom>
              Score submitted successfully!
            </Typography>
          </Box>
        )}

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
              {entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{entry.playerName}</TableCell>
                  <TableCell align="right">{entry.score}</TableCell>
                  <TableCell align="right">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
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