import mongoose from 'mongoose';

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