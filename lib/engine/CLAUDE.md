# Engine Module

This module is the game rules engine for Scoundrel, registered as
`@scoundrel/engine` in `deno.json`.

All game rules are defined in @../../docs/SCOUNDREL.md — the single source of
truth.

## Architecture

The engine uses **event sourcing** with a pure state machine pattern:

- `(GameState, Action) -> GameState` — no mutable state
- Every action produces an `ActionAppliedEvent` with a full state snapshot
  (`stateAfter`)
- Events use sequential integer IDs (0, 1, 2, ...)
- Callers own the `EventLog`; the engine is stateless

## Action Validation

Actions are validated in two layers:

1. **Schema validation** (Zod) at the trust boundary — structural correctness
2. **Game rules validation** (`rules.ts`) — legal action given current state

## Immutable State

All state transitions return new objects. Never mutate `GameState`, `EventLog`,
or any nested structure. Use spread operators and array methods that return new
arrays.

## File Responsibilities

| File         | Purpose                                                 |
| ------------ | ------------------------------------------------------- |
| `types.ts`   | Card, Suit, Rank, GameState, GamePhase, EquippedWeapon  |
| `deck.ts`    | createDeck(), shuffleDeck(), getCardType(), cardValue() |
| `actions.ts` | Action types + Zod schemas (trust boundary)             |
| `events.ts`  | Event types, EventLog, event factory helpers            |
| `rules.ts`   | Action validation against game state                    |
| `reducer.ts` | Pure state transitions: applyAction(state, action)      |
| `scoring.ts` | Score calculation                                       |
| `engine.ts`  | GameEngine interface + createGameEngine() factory       |
| `mod.ts`     | Public API exports                                      |
