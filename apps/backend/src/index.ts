import express from 'express';
import cors from 'cors';
import { leaderboardService } from './services/leaderboardService.js';
import type { CreateLeaderboardEntryDto } from './types/leaderboard.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/leaderboard', (req, res) => {
  const entries = leaderboardService.getEntries();
  res.json(entries);
});

app.post('/leaderboard', (req, res) => {
  const entry = req.body as CreateLeaderboardEntryDto;
  
  if (!entry.playerName || typeof entry.score !== 'number') {
    return res.status(400).json({ error: 'Invalid entry data' });
  }

  const newEntry = leaderboardService.addEntry(entry);
  res.status(201).json(newEntry);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 