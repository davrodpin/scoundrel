import mongoose, { Schema, Document } from 'mongoose';
import { GameState, GameAction } from '../types/game';
import { getCollectionName } from '../utils/dbUtils';

// Card type constants to save space
const CARD_TYPES = {
  MONSTER: 'M',
  WEAPON: 'W',
  HEALTH_POTION: 'H'
};

// Suit constants to save space
const CARD_SUITS = {
  SPADES: 'S',
  HEARTS: 'H',
  DIAMONDS: 'D',
  CLUBS: 'C'
};

interface GameStateHistoryDocument extends Document {
  s: string;    // sessionId
  p: string;    // playerId
  seq: number;  // sequence number within session (0 for initial state, increments for each action)
  // Complete state - only stored for seq = 0
  st?: {
    h: number;  // health
    m: number;  // maxHealth
    d: Array<{  // dungeon cards
      t: string;  // type (M/W/H)
      s: string;  // suit (S/H/D/C)
      r: string;  // rank
      d?: number; // damage
      h?: number; // healing
    }>;
    r: Array<{  // room cards
      t: string;
      s: string;
      r: string;
      d?: number;
      h?: number;
    }>;
    w?: {       // equipped weapon
      t: string;
      s: string;
      r: string;
      d: number;
    };
    dp: Array<{  // discard pile
      t: string;
      s: string;
      r: string;
      d?: number;
      h?: number;
    }>;
    sc: number;  // score
  };
  // Action - stored for seq > 0
  a?: {
    t: string;   // action type
    m?: {        // monster involved
      t: string;
      s: string;
      r: string;
      d: number;
    };
    w?: {        // weapon involved
      t: string;
      s: string;
      r: string;
      d: number;
    };
    h?: number;  // healing amount
    ts: number;  // timestamp
    c?: Array<{    // drawn cards (for DRAW_ROOM)
      t: string;
      s: string;
      r: string;
      d?: number;
      h?: number;
    }>;
  };
  t: Date;      // timestamp
}

const cardSchema = new Schema({
  t: String,    // type
  s: String,    // suit
  r: String,    // rank
  d: Number,    // damage (optional)
  h: Number     // healing (optional)
}, { _id: false });

const gameStateHistorySchema = new Schema({
  s: { type: String, required: true, index: true },  // sessionId
  p: { type: String, required: true },               // playerId
  seq: { type: Number, required: true },             // sequence number
  // Complete state - only for seq = 0
  st: {
    h: { type: Number, required: function(this: { seq: number }) { return this.seq === 0; } },  // health
    m: { type: Number, required: function(this: { seq: number }) { return this.seq === 0; } },  // maxHealth
    d: { type: [cardSchema], required: function(this: { seq: number }) { return this.seq === 0; } },  // dungeon
    r: { type: [cardSchema], required: function(this: { seq: number }) { return this.seq === 0; } },  // room
    w: { type: cardSchema, required: false },        // weapon
    dp: { type: [cardSchema], required: function(this: { seq: number }) { return this.seq === 0; } },  // discard pile
    sc: { type: Number, required: function(this: { seq: number }) { return this.seq === 0; } }  // score
  },
  // Action - only for seq > 0
  a: {
    t: { type: String, required: function(this: { seq: number }) { return this.seq > 0; } },  // type
    m: { type: cardSchema, required: false },        // monster
    w: { type: cardSchema, required: false },        // weapon
    h: Number,                                       // healing
    ts: { type: Number, required: function(this: { seq: number }) { return this.seq > 0; } },  // timestamp
    c: { type: [cardSchema], required: false }       // drawn cards (for DRAW_ROOM)
  },
  t: { type: Date, default: Date.now }              // timestamp
}, {
  timestamps: false
});

// Add validation to ensure either st or a is present based on seq
gameStateHistorySchema.pre('validate', function(next) {
  const doc = this as GameStateHistoryDocument;
  
  if (doc.seq === 0 && (!doc.st || !doc.st.h || !doc.st.m || !doc.st.d)) {
    next(new Error('Initial state (seq=0) must have complete state data'));
  } else if (doc.seq > 0 && (!doc.a || !doc.a.t || !doc.a.ts)) {
    next(new Error('Action entries (seq>0) must have action data'));
  } else {
    next();
  }
});

// Add TTL index to automatically remove history entries after 7 days
gameStateHistorySchema.index({ t: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Add compound indexes for efficient querying
gameStateHistorySchema.index({ s: 1, seq: 1 });     // For replaying games
gameStateHistorySchema.index({ s: 1, t: -1 });      // For time-based queries

// Pre-save middleware to transform card types and suits
gameStateHistorySchema.pre('save', function(next) {
  const doc = this as GameStateHistoryDocument;
  
  // Transform initial state cards if present
  if (doc.st) {
    // Transform dungeon cards
    if (doc.st.d) {
      doc.st.d.forEach(card => {
        card.t = transformCardType(card.t);
        card.s = transformCardSuit(card.s);
      });
    }
    
    // Transform room cards
    if (doc.st.r) {
      doc.st.r.forEach(card => {
        card.t = transformCardType(card.t);
        card.s = transformCardSuit(card.s);
      });
    }
    
    // Transform equipped weapon
    if (doc.st.w) {
      doc.st.w.t = transformCardType(doc.st.w.t);
      doc.st.w.s = transformCardSuit(doc.st.w.s);
    }
    
    // Transform discard pile cards
    if (doc.st.dp) {
      doc.st.dp.forEach(card => {
        card.t = transformCardType(card.t);
        card.s = transformCardSuit(card.s);
      });
    }
  }

  // Transform action cards if present
  if (doc.a) {
    if (doc.a.m) {
      doc.a.m.t = transformCardType(doc.a.m.t);
      doc.a.m.s = transformCardSuit(doc.a.m.s);
    }
    if (doc.a.w) {
      doc.a.w.t = transformCardType(doc.a.w.t);
      doc.a.w.s = transformCardSuit(doc.a.w.s);
    }
    // Transform drawn cards if present
    if (doc.a.c) {
      doc.a.c.forEach(card => {
        card.t = transformCardType(card.t);
        card.s = transformCardSuit(card.s);
      });
    }
  }

  // Log the document before saving in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] Saving game state history:', {
      sessionId: doc.s,
      sequence: doc.seq,
      hasInitialState: !!doc.st,
      initialStateFields: doc.st ? Object.keys(doc.st) : [],
      actionType: doc.a?.t,
      drawnCards: doc.a?.c?.length || 0
    });
  }

  next();
});

// Helper functions to transform card types and suits
function transformCardType(type: string): string {
  switch (type) {
    case 'MONSTER': return CARD_TYPES.MONSTER;
    case 'WEAPON': return CARD_TYPES.WEAPON;
    case 'HEALTH_POTION': return CARD_TYPES.HEALTH_POTION;
    default: return type;
  }
}

function transformCardSuit(suit: string): string {
  switch (suit) {
    case '♠': return CARD_SUITS.SPADES;
    case '♥': return CARD_SUITS.HEARTS;
    case '♦': return CARD_SUITS.DIAMONDS;
    case '♣': return CARD_SUITS.CLUBS;
    default: return suit;
  }
}

// Static method to get complete game history
gameStateHistorySchema.statics.getGameReplay = async function(sessionId: string) {
  const history = await this.find({ s: sessionId })
                          .sort({ seq: 1 })
                          .lean()
                          .exec();
  
  if (!history.length || !history[0].st) {
    throw new Error('Invalid game history: No initial state found');
  }
  
  return history;
};

export const GameStateHistoryModel = mongoose.model<GameStateHistoryDocument>(
  'GameStateHistory',
  gameStateHistorySchema,
  getCollectionName('game_state_history')
); 