import { getLogger } from "@logtape/logtape";
import type { EventLog, GameEngine } from "@scoundrel/engine";
import type { GameView, LeaderboardEntry } from "./types.ts";
import type { GameRepository } from "./repository.ts";
import { toGameView } from "./view.ts";

export type GameService = {
  createGame(playerName: string): Promise<GameView>;
  submitAction(
    gameId: string,
    action: unknown,
  ): Promise<{ ok: true; view: GameView } | { ok: false; error: string }>;
  getGame(gameId: string): Promise<GameView | null>;
  getEventLog(gameId: string): Promise<EventLog | null>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
};

export function createGameService(
  engine: GameEngine,
  repository: GameRepository,
): GameService {
  const logger = getLogger(["scoundrel", "game"]);

  return {
    async createGame(playerName: string): Promise<GameView> {
      const { state, eventLog } = engine.createGame();
      const createdEvent = eventLog.events[0];
      await repository.createGame(state.gameId, playerName, createdEvent);
      logger.info("Game created", { gameId: state.gameId, playerName });
      return toGameView(state, playerName);
    },

    async submitAction(
      gameId: string,
      action: unknown,
    ): Promise<{ ok: true; view: GameView } | { ok: false; error: string }> {
      const actionType = typeof action === "object" &&
          action !== null &&
          "type" in action
        ? String((action as Record<string, unknown>).type)
        : "unknown";

      const latestEvent = await repository.getLatestEvent(gameId);
      if (!latestEvent) {
        return { ok: false, error: "Game not found" };
      }

      const playerName = await repository.getPlayerName(gameId) ?? "Anonymous";

      // Build a synthetic EventLog from the latest event.
      // The engine only needs the last event to get current state,
      // and the events array length for the next event ID.
      const syntheticEvents = new Array(latestEvent.sequence + 1);
      syntheticEvents[latestEvent.sequence] = latestEvent.payload;
      const syntheticLog: EventLog = {
        gameId,
        events: syntheticEvents,
      };

      // Auto-enter room: if action is choose_card and phase is room_ready,
      // apply enter_room first
      const currentState = engine.getState(syntheticLog);
      if (
        isChooseCardAction(action) &&
        currentState.phase.kind === "room_ready"
      ) {
        const enterResult = engine.submitAction(syntheticLog, {
          type: "enter_room",
        });
        if (!enterResult.ok) {
          return { ok: false, error: enterResult.error };
        }
        await repository.appendEvent(gameId, enterResult.event);

        // Now submit the choose_card against the updated state
        const chooseResult = engine.submitAction(
          enterResult.eventLog,
          action as Parameters<GameEngine["submitAction"]>[1],
        );
        if (!chooseResult.ok) {
          return { ok: false, error: chooseResult.error };
        }
        await repository.appendEvent(gameId, chooseResult.event);

        const newState = chooseResult.state;
        if (newState.phase.kind === "game_over") {
          const score = engine.getScore(newState);
          await repository.updateStatus(gameId, "completed", score);
          logger.info("Game completed", { gameId, score });
        }

        logger.info("Action submitted", { gameId, actionType });
        return { ok: true, view: toGameView(newState, playerName) };
      }

      // Normal action flow
      const result = engine.submitAction(
        syntheticLog,
        action as Parameters<GameEngine["submitAction"]>[1],
      );
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      await repository.appendEvent(gameId, result.event);

      const newState = result.state;
      if (newState.phase.kind === "game_over") {
        const score = engine.getScore(newState);
        await repository.updateStatus(gameId, "completed", score);
        logger.info("Game completed", { gameId, score });
      }

      logger.info("Action submitted", { gameId, actionType });
      return { ok: true, view: toGameView(newState, playerName) };
    },

    async getGame(gameId: string): Promise<GameView | null> {
      const latestEvent = await repository.getLatestEvent(gameId);
      if (!latestEvent) return null;

      const playerName = await repository.getPlayerName(gameId) ?? "Anonymous";

      const syntheticEvents = new Array(latestEvent.sequence + 1);
      syntheticEvents[latestEvent.sequence] = latestEvent.payload;
      const syntheticLog: EventLog = { gameId, events: syntheticEvents };

      const state = engine.getState(syntheticLog);
      return toGameView(state, playerName);
    },

    async getEventLog(gameId: string): Promise<EventLog | null> {
      const storedEvents = await repository.getAllEvents(gameId);
      if (storedEvents.length === 0) return null;

      return {
        gameId,
        events: storedEvents.map((e) => e.payload),
      };
    },

    getLeaderboard(): Promise<LeaderboardEntry[]> {
      return repository.getLeaderboard(25);
    },
  };
}

function isChooseCardAction(
  action: unknown,
): action is { type: "choose_card" } {
  return (
    typeof action === "object" &&
    action !== null &&
    "type" in action &&
    (action as { type: string }).type === "choose_card"
  );
}
