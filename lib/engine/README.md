# Scoundrel Game Engine

Pure, stateless game engine for the Scoundrel card game using event sourcing.

## Architecture

The engine is a **pure state machine**:
`(GameState, Action) -> GameState | Error`. No mutable state — callers pass in
and receive back an `EventLog`.

### Event Sourcing

Every game starts with a `GameCreatedEvent` containing the initial shuffled
deck. Each player action produces an `ActionAppliedEvent` with a full
`GameState` snapshot (`stateAfter`). Events use sequential integer IDs (0, 1, 2,
...).

This design enables:

- Full game replay from any point
- Audit trail for every state change
- Deterministic testing via seed decks

### Action Validation

Actions are validated in two layers:

1. **Schema validation** (Zod) at the trust boundary — ensures structural
   correctness
2. **Game rules validation** — ensures the action is legal given current state

### Actions

| Action        | When Valid                                    | Effect                                         |
| ------------- | --------------------------------------------- | ---------------------------------------------- |
| `draw_room`   | Phase is `drawing`                            | Draw cards until room has 4 (or dungeon empty) |
| `avoid_room`  | Phase is `room_ready`, didn't avoid last room | All 4 cards to bottom of dungeon               |
| `choose_card` | Phase is `choosing`, card exists at index     | Equip weapon / heal potion / fight monster     |

## Public API

```typescript
import { createGameEngine } from "@scoundrel/engine";

const engine = createGameEngine();

// Start a new game (optional seed deck for testing)
const { state, eventLog } = engine.createGame();

// Submit a player action
const result = engine.submitAction(eventLog, { type: "draw_room" });
if (result.ok) {
  // result.state — new game state
  // result.event — the event that was created
}

// Get current state from an event log
const currentState = engine.getState(eventLog);

// Replay all states from the event log
const allStates = engine.replay(eventLog);

// Calculate score for a finished game
const score = engine.getScore(state);
```

## File Structure

| File         | Responsibility                                                  |
| ------------ | --------------------------------------------------------------- |
| `types.ts`   | Card, Suit, Rank, GameState, GamePhase, EquippedWeapon          |
| `deck.ts`    | createDeck(), shuffleDeck(), getCardType(), cardValue()         |
| `actions.ts` | Action types + Zod schemas                                      |
| `events.ts`  | Event types, EventLog, event factory helpers                    |
| `rules.ts`   | Action validation against game state                            |
| `reducer.ts` | Pure state transitions: applyAction(state, action) -> GameState |
| `scoring.ts` | Score calculation                                               |
| `engine.ts`  | GameEngine interface + createGameEngine() factory               |
| `mod.ts`     | Public API exports                                              |
