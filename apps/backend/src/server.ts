import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { GameService } from './services/GameService';
import { GameAction } from './types/game';
import { Server } from 'socket.io';
import { leaderboardService } from './services/leaderboardService';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://davrodpin.github.io"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://davrodpin.github.io"
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'healthy' });
});

const gameService = new GameService();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_game', () => {
    const session = gameService.createGame(socket.id);
    socket.join(session.id);
    socket.emit('game_created', session);
  });

  socket.on('game_action', ({ sessionId, action }: { sessionId: string, action: GameAction }) => {
    try {
      const newState = gameService.handleAction(sessionId, action);
      io.to(sessionId).emit('game_state_updated', newState);
    } catch (error: unknown) {
      if (error instanceof Error) {
        socket.emit('error', { message: error.message });
      } else {
        socket.emit('error', { message: 'An unknown error occurred' });
      }
    }
  });

  socket.on('fetch_leaderboard', () => {
    const entries = leaderboardService.getEntries();
    socket.emit('leaderboard_updated', entries);
  });

  socket.on('submit_score', ({ playerName, score }: { playerName: string, score: number }) => {
    try {
      leaderboardService.addEntry({ playerName, score });
      const entries = leaderboardService.getEntries();
      io.emit('leaderboard_updated', entries); // Broadcast to all connected clients
    } catch (error: unknown) {
      if (error instanceof Error) {
        socket.emit('error', { message: error.message });
      } else {
        socket.emit('error', { message: 'An unknown error occurred' });
      }
    }
  });

  socket.on('join_game', (sessionId: string) => {
    const session = gameService.getGame(sessionId);
    if (session) {
      socket.join(sessionId);
      socket.emit('game_state', session.state);
    } else {
      socket.emit('error', { message: 'Game session not found' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 