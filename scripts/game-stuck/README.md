# game-stuck — Repair Stuck Games

## What Happened

A bug in the game engine (`lib/engine/reducer.ts`) caused games to get stuck at
the end of the dungeon. When the dungeon ran out of cards mid-draw, the final
room could contain fewer than 4 cards (e.g. only 2). The engine's `completeTurn`
function only triggered a game-over when `cardsChosen >= 3`, so after the player
chose all available cards in that short room, the game was left in `choosing`
phase with an empty room and an empty dungeon — no way to advance.

This was fixed in PR #116 by adding an early-exit check: if both the room and
the dungeon are empty after a card is chosen, the game ends as `dungeon_cleared`
regardless of how many cards were chosen that turn.

## What This Script Does

`repair-stuck-games.ts` fixes games that were affected before the PR #116 fix.
For each stuck game it:

1. Loads the full event history from the database.
2. Validates that the game matches the stuck pattern (phase `choosing`, room
   empty, dungeon empty).
3. Re-applies the last recorded action through the now-fixed engine to produce
   the correct `stateAfter` (`game_over / dungeon_cleared`).
4. Updates the last event's stored `stateAfter` in the database to match the
   corrected state.
5. Marks the game as `completed` in the `games` table with the computed score.
6. Creates a leaderboard entry for the player.

Games that do not match the stuck pattern (e.g. already repaired or unrelated
issues) are silently skipped.

## When to Use This Script

Use this script if you discover games stuck in the exact pattern described
above: phase is `choosing`, room is empty, dungeon is empty, and DB status is
`in_progress`. These games cannot be finished by the player through normal
gameplay.

After running the script, verify each repaired game with:

```sh
DATABASE_URL=<url> deno task audit:game <GAME_ID>
```

All repaired games should show `Audit Complete: PASS`.

## Usage

**Dry run** (default — read-only, shows what would change):

```sh
DATABASE_URL=<url> deno task repair:stuck-games
```

**Apply** (writes changes to the database):

```sh
DATABASE_URL=<url> deno task repair:stuck-games --apply
```

**Repair specific games** (subset of the default list, or newly discovered
ones):

```sh
DATABASE_URL=<url> deno task repair:stuck-games --apply <GAME_ID> [<GAME_ID> ...]
```
