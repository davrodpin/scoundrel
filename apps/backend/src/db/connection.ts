import mongoose from 'mongoose';
import { getCollectionName } from '../utils/dbUtils';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Set strictQuery to false to prepare for Mongoose 7
  mongoose.set('strictQuery', false);

  try {
    // Add connection options for better reliability
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    // Log connection status in both development and production
    console.log(`[${isDevelopment ? 'DEBUG' : 'INFO'}] Connected to MongoDB`);
    
    if (isDevelopment) {
      console.log('[DEBUG] Using collections:', {
        gameSession: getCollectionName('game_sessions'),
        leaderboard: getCollectionName('leaderboard'),
        gameStateHistory: getCollectionName('game_state_history')
      });
    }

    mongoose.connection.on('error', (error) => {
      const logLevel = isDevelopment ? 'DEBUG' : 'ERROR';
      console.error(`[${logLevel}] MongoDB connection error:`, error);
    });

    mongoose.connection.on('disconnected', () => {
      const logLevel = isDevelopment ? 'DEBUG' : 'WARN';
      console.log(`[${logLevel}] MongoDB disconnected`);
    });

    mongoose.connection.on('reconnected', () => {
      const logLevel = isDevelopment ? 'DEBUG' : 'INFO';
      console.log(`[${logLevel}] MongoDB reconnected`);
    });

  } catch (error) {
    // Always log connection errors in both development and production
    console.error(`[${isDevelopment ? 'DEBUG' : 'ERROR'}] Error connecting to MongoDB:`, {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: isDevelopment && error instanceof Error ? error.stack : undefined
    });

    // If it's a connection error, provide more helpful information
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      console.error(`
        MongoDB Connection Troubleshooting:
        1. Check if MONGODB_URI is correct
        2. Verify IP Whitelist settings in MongoDB Atlas
        3. Check MongoDB Atlas cluster status
        4. Ensure the database user has correct permissions
      `);
    }

    throw error;
  }
} 