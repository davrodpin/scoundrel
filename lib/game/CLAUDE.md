# Game Service Module

Registered as `@scoundrel/game-service` in `deno.json`.

Orchestrates the game engine, database persistence, and API view projection.

## Architecture

- **types.ts** — `GameView` type (client-safe projection of `GameState`)
- **view.ts** — `toGameView()` strips sensitive data (dungeon/discard contents)
- **repository.ts** — `GameRepository` interface + Prisma implementation
- **service.ts** — `GameService` orchestrates engine + repository
- **mod.ts** — Public API exports

## Key Design Decisions

- The client never sees dungeon or discard card arrays — only counts
- Score is computed server-side using the engine's `calculateScore()`
- `submitAction` auto-enters the room when receiving `choose_card` during
  `room_ready` phase
- Latest event loading (single row) avoids reading entire event history
