import { getLogger } from "@logtape/logtape";
import { SpanStatusCode } from "npm:@opentelemetry/api@1";
import type { Tracer } from "npm:@opentelemetry/api@1";
import type { EventLog, GameEngine } from "@scoundrel/engine";
import { AppError } from "@scoundrel/errors";
import { isPlayerNameAllowed } from "@scoundrel/validation";
import { z } from "zod";
import type { GameView, LeaderboardEntry, LeaderboardRank } from "./types.ts";
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
  getLeaderboardRank(gameId: string): Promise<LeaderboardRank | null>;
};

export type GameServiceConfig = {
  defaultPlayerName: string;
  leaderboardLimit: number;
};

export function createGameService(
  engine: GameEngine,
  repository: GameRepository,
  config: GameServiceConfig,
  tracer: Tracer,
): GameService {
  const logger = getLogger(["scoundrel", "game"]);

  function withSpan<T>(
    name: string,
    attrs: Record<string, string | number | boolean>,
    fn: () => Promise<T>,
  ): Promise<T> {
    return tracer.startActiveSpan(name, async (span) => {
      span.setAttributes(attrs);
      try {
        return await fn();
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw err;
      } finally {
        span.end();
      }
    }) as Promise<T>;
  }

  return {
    createGame(playerName: string): Promise<GameView> {
      if (!isPlayerNameAllowed(playerName)) {
        return Promise.reject(
          new AppError("OffensivePlayerNameError", 422, { playerName }),
        );
      }
      const { state, eventLog } = engine.createGame();
      const createdEvent = eventLog.events[0];
      return withSpan("game.createGame", {
        "game.id": state.gameId,
        "player.name": playerName,
      }, async () => {
        await repository.createGame(state.gameId, playerName, createdEvent);
        logger.info("Game created", { gameId: state.gameId, playerName });
        return toGameView(state, playerName);
      });
    },

    submitAction(gameId: string, action: unknown): Promise<GameView> {
      if (!uuidSchema.safeParse(gameId).success) {
        return Promise.reject(
          new AppError("GameNotFoundError", 404, { gameId }),
        );
      }

      const actionType = typeof action === "object" &&
          action !== null &&
          "type" in action
        ? String((action as Record<string, unknown>).type)
        : "unknown";

      return tracer.startActiveSpan("game.submitAction", async (span) => {
        span.setAttribute("game.id", gameId);
        span.setAttribute("action.type", actionType);
        try {
          const [latestEvent, rawPlayerName] = await Promise.all([
            repository.getLatestEvent(gameId),
            repository.getPlayerName(gameId),
          ]);
          if (!latestEvent) {
            throw new AppError("GameNotFoundError", 404, { gameId });
          }

          const playerName = rawPlayerName ?? config.defaultPlayerName;

          const syntheticEvents = new Array(latestEvent.sequence + 1);
          syntheticEvents[latestEvent.sequence] = latestEvent.payload;
          const syntheticLog: EventLog = {
            gameId,
            events: syntheticEvents,
          };

          const currentState = engine.getState(syntheticLog);
          span.setAttribute("game.phase", currentState.phase.kind);

          if (
            isChooseCardAction(action) &&
            currentState.phase.kind === "room_ready"
          ) {
            const newState = await tracer.startActiveSpan(
              "game.submitAction.autoEnterRoom",
              async (childSpan) => {
                try {
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
                  return chooseResult.state;
                } catch (err) {
                  childSpan.recordException(err as Error);
                  childSpan.setStatus({ code: SpanStatusCode.ERROR });
                  throw err;
                } finally {
                  childSpan.end();
                }
              },
            ) as Awaited<ReturnType<GameEngine["getState"]>>;

            if (newState.phase.kind === "game_over") {
              await tracer.startActiveSpan(
                "game.submitAction.checkGameOver",
                async (checkSpan) => {
                  try {
                    const score = engine.getScore(newState);
                    await Promise.all([
                      repository.updateStatus(gameId, "completed", score),
                      repository.createLeaderboardEntry(
                        gameId,
                        playerName,
                        score,
                        new Date(),
                      ),
                    ]);
                    logger.info("Game completed", { gameId, score });
                    logger.info("Leaderboard entry created", {
                      gameId,
                      score,
                    });
                  } catch (err) {
                    checkSpan.recordException(err as Error);
                    checkSpan.setStatus({ code: SpanStatusCode.ERROR });
                    throw err;
                  } finally {
                    checkSpan.end();
                  }
                },
              );
            }

            logger.info("Action submitted", { gameId, actionType });
            span.setAttribute(
              "game.completed",
              newState.phase.kind === "game_over",
            );
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
            await tracer.startActiveSpan(
              "game.submitAction.checkGameOver",
              async (checkSpan) => {
                try {
                  const score = engine.getScore(newState);
                  await Promise.all([
                    repository.updateStatus(gameId, "completed", score),
                    repository.createLeaderboardEntry(
                      gameId,
                      playerName,
                      score,
                      new Date(),
                    ),
                  ]);
                  logger.info("Game completed", { gameId, score });
                  logger.info("Leaderboard entry created", { gameId, score });
                } catch (err) {
                  checkSpan.recordException(err as Error);
                  checkSpan.setStatus({ code: SpanStatusCode.ERROR });
                  throw err;
                } finally {
                  checkSpan.end();
                }
              },
            );
          }

          logger.info("Action submitted", { gameId, actionType });
          span.setAttribute(
            "game.completed",
            newState.phase.kind === "game_over",
          );
          return toGameView(newState, playerName);
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      }) as Promise<GameView>;
    },

    getGame(gameId: string): Promise<GameView> {
      return withSpan("game.getGame", { "game.id": gameId }, async () => {
        if (!uuidSchema.safeParse(gameId).success) {
          throw new AppError("GameNotFoundError", 404, { gameId });
        }
        const [latestEvent, rawPlayerName] = await Promise.all([
          repository.getLatestEvent(gameId),
          repository.getPlayerName(gameId),
        ]);
        if (!latestEvent) {
          throw new AppError("GameNotFoundError", 404, { gameId });
        }

        const playerName = rawPlayerName ?? config.defaultPlayerName;

        const syntheticEvents = new Array(latestEvent.sequence + 1);
        syntheticEvents[latestEvent.sequence] = latestEvent.payload;
        const syntheticLog: EventLog = { gameId, events: syntheticEvents };

        const state = engine.getState(syntheticLog);
        return toGameView(state, playerName);
      });
    },

    getEventLog(gameId: string): Promise<EventLog> {
      return withSpan("game.getEventLog", { "game.id": gameId }, async () => {
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
      });
    },

    getLeaderboard(): Promise<LeaderboardEntry[]> {
      return withSpan(
        "game.getLeaderboard",
        {},
        () => repository.getLeaderboard(config.leaderboardLimit),
      );
    },

    getLeaderboardEntry(gameId: string): Promise<LeaderboardEntry | null> {
      return withSpan(
        "game.getLeaderboardEntry",
        { "game.id": gameId },
        () => repository.getLeaderboardEntry(gameId),
      );
    },

    getLeaderboardRank(gameId: string): Promise<LeaderboardRank | null> {
      if (!uuidSchema.safeParse(gameId).success) {
        return Promise.resolve(null);
      }
      return withSpan(
        "game.getLeaderboardRank",
        { "game.id": gameId },
        async () => {
          const entry = await repository.getLeaderboardEntry(gameId);
          if (!entry) return null;
          const { rank, totalEntries } = await repository.getLeaderboardRank(
            entry.score,
            new Date(entry.completedAt),
          );
          const topPercent = totalEntries === 0
            ? 100
            : Math.max(1, Math.ceil((rank / totalEntries) * 100));
          return { entry, rank, topPercent };
        },
      );
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
