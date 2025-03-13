import mongoose from 'mongoose';
import { getCollectionName } from '../utils/dbUtils';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(mongoUri);
    
    if (isDevelopment) {
      console.log('[DEBUG] Connected to MongoDB');
      console.log('[DEBUG] Using collections:', {
        gameSession: getCollectionName('game_sessions'),
        leaderboard: getCollectionName('leaderboard'),
        gameStateHistory: getCollectionName('game_state_history')
      });
    }

    mongoose.connection.on('error', (error) => {
      if (isDevelopment) {
        console.error('[DEBUG] MongoDB connection error:', error);
      }
    });

    mongoose.connection.on('disconnected', () => {
      if (isDevelopment) {
        console.log('[DEBUG] MongoDB disconnected');
      }
    });

  } catch (error) {
    if (isDevelopment) {
      console.error('[DEBUG] Error connecting to MongoDB:', error);
    }
    throw error;
  }
} 