import { getLogger } from "@logtape/logtape";
import type { EventLog, GameEngine } from "@scoundrel/engine";
import { AppError } from "@scoundrel/errors";
import { isPlayerNameAllowed } from "@scoundrel/validation";
import { z } from "zod";
import type { GameView, LeaderboardEntry } from "./types.ts";
import type { GameRepository } from "./repository.ts";
import { toGameView } from "./view.ts";

const uuidSchema = z.string().uuid();

export type GameService = {
  createGame(playerName: string): Promise<GameView>;
  submitAction(gameId: string, action: unknown): Promise<GameView>;
  getGame(gameId: string): Promise<GameView>;
  getEventLog(gameId: string): Promise<EventLog>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  getLeaderboardEntry(gameId: string): Promise<LeaderboardEntry | null>;
};

export type GameServiceConfig = {
  defaultPlayerName: string;
  leaderboardLimit: number;
};

export function createGameService(
  engine: GameEngine,
  repository: GameRepository,
  config: GameServiceConfig,
): GameService {
  const logger = getLogger(["scoundrel", "game"]);

  return {
    async createGame(playerName: string): Promise<GameView> {
      if (!isPlayerNameAllowed(playerName)) {
        throw new AppError("OffensivePlayerNameError", 422, { playerName });
      }
      const { state, eventLog } = engine.createGame();
      const createdEvent = eventLog.events[0];
      await repository.createGame(state.gameId, playerName, createdEvent);
      logger.info("Game created", { gameId: state.gameId, playerName });
      return toGameView(state, playerName);
    },

    async submitAction(gameId: string, action: unknown): Promise<GameView> {
      if (!uuidSchema.safeParse(gameId).success) {
        throw new AppError("GameNotFoundError", 404, { gameId });
      }

      const actionType = typeof action === "object" &&
          action !== null &&
          "type" in action
        ? String((action as Record<string, unknown>).type)
        : "unknown";

      const latestEvent = await repository.getLatestEvent(gameId);
      if (!latestEvent) {
        throw new AppError("GameNotFoundError", 404, { gameId });
      }

      const playerName = await repository.getPlayerName(gameId) ??
        config.defaultPlayerName;

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
          throw new AppError("InvalidActionError", 422, {
            gameId,
            detail: enterResult.error,
          });
        }
        await repository.appendEvent(gameId, enterResult.event);

        // Now submit the choose_card against the updated state
        const chooseResult = engine.submitAction(
          enterResult.eventLog,
          action as Parameters<GameEngine["submitAction"]>[1],
        );
        if (!chooseResult.ok) {
          throw new AppError("InvalidActionError", 422, {
            gameId,
            detail: chooseResult.error,
          });
        }
        await repository.appendEvent(gameId, chooseResult.event);

        const newState = chooseResult.state;
        if (newState.phase.kind === "game_over") {
          const score = engine.getScore(newState);
          await repository.updateStatus(gameId, "completed", score);
          logger.info("Game completed", { gameId, score });
          await repository.createLeaderboardEntry(
            gameId,
            playerName,
            score,
            new Date(),
          );
          logger.info("Leaderboard entry created", { gameId, score });
        }

        logger.info("Action submitted", { gameId, actionType });
        return toGameView(newState, playerName);
      }

      // Normal action flow
      const result = engine.submitAction(
        syntheticLog,
        action as Parameters<GameEngine["submitAction"]>[1],
      );
      if (!result.ok) {
        throw new AppError("InvalidActionError", 422, {
          gameId,
          detail: result.error,
        });
      }

      await repository.appendEvent(gameId, result.event);

      const newState = result.state;
      if (newState.phase.kind === "game_over") {
        const score = engine.getScore(newState);
        await repository.updateStatus(gameId, "completed", score);
        logger.info("Game completed", { gameId, score });
        await repository.createLeaderboardEntry(
          gameId,
          playerName,
          score,
          new Date(),
        );
        logger.info("Leaderboard entry created", { gameId, score });
      }

      logger.info("Action submitted", { gameId, actionType });
      return toGameView(newState, playerName);
    },

    async getGame(gameId: string): Promise<GameView> {
      if (!uuidSchema.safeParse(gameId).success) {
        throw new AppError("GameNotFoundError", 404, { gameId });
      }
      const latestEvent = await repository.getLatestEvent(gameId);
      if (!latestEvent) {
        throw new AppError("GameNotFoundError", 404, { gameId });
      }

      const playerName = await repository.getPlayerName(gameId) ??
        config.defaultPlayerName;

      const syntheticEvents = new Array(latestEvent.sequence + 1);
      syntheticEvents[latestEvent.sequence] = latestEvent.payload;
      const syntheticLog: EventLog = { gameId, events: syntheticEvents };

      const state = engine.getState(syntheticLog);
      return toGameView(state, playerName);
    },

    async getEventLog(gameId: string): Promise<EventLog> {
      if (!uuidSchema.safeParse(gameId).success) {
        throw new AppError("GameNotFoundError", 404, { gameId });
      }

      const status = await repository.getGameStatus(gameId);
      if (status !== "completed") {
        throw new AppError("GameNotFoundError", 404, { gameId });
      }

      const storedEvents = await repository.getAllEvents(gameId);
      return {
        gameId,
        events: storedEvents.map((e) => e.payload),
      };
    },

    getLeaderboard(): Promise<LeaderboardEntry[]> {
      return repository.getLeaderboard(config.leaderboardLimit);
    },

    getLeaderboardEntry(gameId: string): Promise<LeaderboardEntry | null> {
      return repository.getLeaderboardEntry(gameId);
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
