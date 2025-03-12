import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { GameService } from './services/GameService';
import { GameAction } from './types/game';
import { Server } from 'socket.io';
import { leaderboardService } from './services/leaderboardService';
import { connectToDatabase } from './db/connection';

const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  console.log('[ENV] Backend running in development mode');
  console.log('[ENV] NODE_ENV =', process.env.NODE_ENV || 'not set');
  console.log('[ENV] PORT =', process.env.PORT || '3001');
}

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://davrodpin.github.io"
];

if (isDevelopment) {
  console.log('[ENV] Allowed origins:', allowedOrigins);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'healthy' });
});

const gameService = new GameService();

// Connect to MongoDB before starting the server
connectToDatabase().then(() => {
  const port = process.env.PORT || 3001;
  httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_game', async () => {
    try {
      const session = await gameService.createGame(socket.id);
      socket.join(session.id);
      socket.emit('game_created', session);
    } catch (error) {
      if (isDevelopment) {
        console.error('[DEBUG] Error creating game:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  socket.on('game_action', async ({ sessionId, action }: { sessionId: string, action: GameAction }) => {
    try {
      const newState = await gameService.handleAction(sessionId, action);
      io.to(sessionId).emit('game_state_updated', newState);
    } catch (error: unknown) {
      if (error instanceof Error) {
        socket.emit('error', { message: error.message });
      } else {
        socket.emit('error', { message: 'An unknown error occurred' });
      }
    }
  });

  socket.on('fetch_leaderboard', async () => {
    try {
      const entries = await leaderboardService.getEntries();
      socket.emit('leaderboard_updated', entries);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch leaderboard' });
    }
  });

  socket.on('submit_score', async ({ playerName, score }: { playerName: string, score: number }) => {
    try {
      await leaderboardService.addEntry({ playerName, score });
      const entries = await leaderboardService.getEntries();
      io.emit('leaderboard_updated', entries); // Broadcast to all connected clients
    } catch (error: unknown) {
      if (error instanceof Error) {
        socket.emit('error', { message: error.message });
      } else {
        socket.emit('error', { message: 'An unknown error occurred' });
      }
    }
  });

  socket.on('join_game', async (sessionId: string) => {
    try {
      const session = await gameService.getGame(sessionId);
      if (session) {
        socket.join(sessionId);
        socket.emit('game_state', session.state);
      } else {
        socket.emit('error', { message: 'Game session not found' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
}); 