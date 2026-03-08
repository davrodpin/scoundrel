import type { GameState } from "./types.ts";
import type { GameAction } from "./actions.ts";

export type GameCreatedEvent = {
  kind: "game_created";
  id: number;
  timestamp: string;
  gameId: string;
  initialState: GameState;
};

export type ActionAppliedEvent = {
  kind: "action_applied";
  id: number;
  timestamp: string;
  action: GameAction;
  stateAfter: GameState;
};

export type GameEvent = GameCreatedEvent | ActionAppliedEvent;

export type EventLog = {
  gameId: string;
  events: readonly GameEvent[];
};

export function createGameCreatedEvent(
  gameId: string,
  initialState: GameState,
): GameCreatedEvent {
  return {
    kind: "game_created",
    id: 0,
    timestamp: new Date().toISOString(),
    gameId,
    initialState,
  };
}

export function createActionAppliedEvent(
  eventLog: EventLog,
  action: GameAction,
  stateAfter: GameState,
): ActionAppliedEvent {
  return {
    kind: "action_applied",
    id: eventLog.events.length,
    timestamp: new Date().toISOString(),
    action,
    stateAfter,
  };
}

export function appendEvent(eventLog: EventLog, event: GameEvent): EventLog {
  return {
    gameId: eventLog.gameId,
    events: [...eventLog.events, event],
  };
}
