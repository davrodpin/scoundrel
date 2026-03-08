// Scoundrel game engine module
// Domain logic for the Scoundrel card game

// Types
export type {
  Card,
  CardType,
  ChoosingPhase,
  EquippedWeapon,
  GameOverPhase,
  GamePhase,
  GameState,
  Rank,
  Suit,
} from "./types.ts";

// Deck utilities
export { cardValue, createDeck, getCardType, shuffleDeck } from "./deck.ts";

// Actions
export type {
  AvoidRoomAction,
  ChooseCardAction,
  DrawCardAction,
  EnterRoomAction,
  GameAction,
} from "./actions.ts";
export { GameActionSchema } from "./actions.ts";

// Events
export type {
  ActionAppliedEvent,
  EventLog,
  GameCreatedEvent,
  GameEvent,
} from "./events.ts";
export {
  appendEvent,
  createActionAppliedEvent,
  createGameCreatedEvent,
} from "./events.ts";

// Rules
export type { ValidationResult } from "./rules.ts";
export { validateAction } from "./rules.ts";

// Reducer
export { applyAction } from "./reducer.ts";

// Scoring
export { calculateScore } from "./scoring.ts";

// Engine
export type { ActionResult, GameEngine } from "./engine.ts";
export { createGameEngine } from "./engine.ts";
