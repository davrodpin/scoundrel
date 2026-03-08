import type { Card, GameState } from "./types.ts";
import type { GameAction } from "./actions.ts";
import { GameActionSchema } from "./actions.ts";
import { createDeck, shuffleDeck } from "./deck.ts";
import type { ActionAppliedEvent, EventLog } from "./events.ts";
import {
  appendEvent,
  createActionAppliedEvent,
  createGameCreatedEvent,
} from "./events.ts";
import { validateAction } from "./rules.ts";
import { applyAction } from "./reducer.ts";
import { calculateScore } from "./scoring.ts";

export type ActionResult =
  | {
    ok: true;
    state: GameState;
    event: ActionAppliedEvent;
    eventLog: EventLog;
  }
  | { ok: false; error: string };

export type GameEngine = {
  createGame(seed?: readonly Card[]): { state: GameState; eventLog: EventLog };
  submitAction(eventLog: EventLog, action: GameAction): ActionResult;
  getState(eventLog: EventLog): GameState;
  replay(eventLog: EventLog): readonly GameState[];
  getScore(state: GameState): number;
};

export function createGameEngine(): GameEngine {
  return {
    createGame(
      seed?: readonly Card[],
    ): { state: GameState; eventLog: EventLog } {
      const gameId = crypto.randomUUID();
      const dungeon = seed ? [...seed] : shuffleDeck(createDeck());

      const initialState: GameState = {
        gameId,
        health: 20,
        dungeon,
        room: [],
        discard: [],
        equippedWeapon: null,
        phase: { kind: "drawing" },
        lastRoomAvoided: false,
        turnNumber: 1,
        lastCardPlayed: null,
      };

      const createdEvent = createGameCreatedEvent(gameId, initialState);
      const eventLog: EventLog = {
        gameId,
        events: [createdEvent],
      };

      return { state: initialState, eventLog };
    },

    submitAction(eventLog: EventLog, action: GameAction): ActionResult {
      const parseResult = GameActionSchema.safeParse(action);
      if (!parseResult.success) {
        return { ok: false, error: parseResult.error.message };
      }
      const parsedAction = parseResult.data;

      const currentState = getStateFromEventLog(eventLog);
      const validation = validateAction(currentState, parsedAction);
      if (!validation.valid) {
        return { ok: false, error: validation.reason };
      }

      const newState = applyAction(currentState, parsedAction);
      const event = createActionAppliedEvent(eventLog, parsedAction, newState);
      const newEventLog = appendEvent(eventLog, event);

      return { ok: true, state: newState, event, eventLog: newEventLog };
    },

    getState(eventLog: EventLog): GameState {
      return getStateFromEventLog(eventLog);
    },

    replay(eventLog: EventLog): readonly GameState[] {
      if (eventLog.events.length === 0) {
        throw new Error("Cannot replay empty event log");
      }

      const firstEvent = eventLog.events[0];
      if (firstEvent.kind !== "game_created") {
        throw new Error("First event must be game_created");
      }

      const states: GameState[] = [firstEvent.initialState];
      let currentState = firstEvent.initialState;

      for (let i = 1; i < eventLog.events.length; i++) {
        const event = eventLog.events[i];
        if (event.kind === "action_applied") {
          currentState = applyAction(currentState, event.action);
          states.push(currentState);
        }
      }

      return states;
    },

    getScore(state: GameState): number {
      return calculateScore(state);
    },
  };
}

function getStateFromEventLog(eventLog: EventLog): GameState {
  if (eventLog.events.length === 0) {
    throw new Error("Cannot get state from empty event log");
  }

  const lastEvent = eventLog.events[eventLog.events.length - 1];
  if (lastEvent.kind === "game_created") {
    return lastEvent.initialState;
  }
  return lastEvent.stateAfter;
}
