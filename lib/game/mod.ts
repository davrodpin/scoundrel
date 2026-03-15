// Game service module
// Orchestrates engine, persistence, and API view projection

export type {
  GameView,
  LeaderboardEntry,
  LeaderboardRank,
  LeaderboardResponse,
} from "./types.ts";
export { toGameView } from "./view.ts";
export type { GameRepository, StoredEvent } from "./repository.ts";
export { createPrismaGameRepository } from "./repository.ts";
export type { GameService, GameServiceConfig } from "./service.ts";
export { createGameService } from "./service.ts";
