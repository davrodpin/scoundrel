---
name: game-rules
description: Use when implementing, modifying, or debugging game logic in lib/engine. Defines how to translate Scoundrel card game rules into domain code, ensuring every behavior matches the official rules spec.
---

# Game Rules Implementation

All game rules are defined in `docs/SCOUNDREL.md`. This is the single source of
truth. Before writing any game logic, read the relevant section of that
document.

> **Before writing any code:** follow the `git-workflow` skill to create a git
> worktree and branch. Never implement directly on `main`.

## Rule Reference

Always confirm the exact rule before implementing. The game has subtle edge
cases:

### Deck Setup

- Standard 52-card deck minus Jokers, Red Face Cards (Hearts/Diamonds J/Q/K),
  and Red Aces (Hearts/Diamonds A)
- Remaining: 26 Clubs/Spades (Monsters) + 9 Diamonds 2-10 (Weapons) + 9 Hearts
  2-10 (Health Potions) = 44 cards

### Card Types

- **Monsters** (Clubs & Spades): Damage equals ordered value. Number cards =
  face value, J=11, Q=12, K=13, A=14
- **Weapons** (Diamonds 2-10): Damage reduction equals face value. Binding —
  equipping discards previous weapon and its slain monsters
- **Health Potions** (Hearts 2-10): Heal equals face value. Max one per turn.
  Health capped at 20

### Turn Structure

1. Draw cards from Dungeon until Room has 4 cards
2. Player may **avoid** the Room (all 4 cards go to bottom of Dungeon) — but
   cannot avoid two Rooms in a row
3. If not avoiding: player must face exactly 3 of the 4 cards, one at a time
4. The 4th remaining card stays face up as part of the next Room

### Combat Rules

- **Barehanded**: Monster's full value subtracted from Health. Monster goes to
  discard
- **With Weapon**: Monster placed on weapon stack. Damage = max(0,
  monster_value - weapon_value). Weapon can only be used on monsters with value
  **less than or equal to** the last monster it slew

### Scoring

- **Death** (health <= 0): Sum remaining monster values in Dungeon, subtract
  from health (negative score)
- **Survived**: Score = remaining health. Special case: if health is 20 and last
  card was a health potion, score = 20 + potion value

## Domain Module

All game logic lives in `lib/engine/`. Follow the module conventions from
`lib/engine/CLAUDE.md`:

- Game state is fully contained in the module's data structures
- Expose public API through `mod.ts`
- Module is registered as `@scoundrel/engine` in `deno.json`

## Implementation Patterns

- Model game state as immutable data — functions take state in and return new
  state
- Each player action (choose card, avoid room, fight monster) should be a pure
  function
- Validate actions against current game state (e.g., can't use weapon on monster
  stronger than last slain, can't avoid two rooms in a row, can't heal above 20)
- Return clear error results for invalid actions — never silently ignore rule
  violations

## When Implementing Game Logic

1. Read the specific rule section in `docs/SCOUNDREL.md`
2. Write a test that asserts the rule's behavior (following `tdd-development`
   skill)
3. Include edge case tests — the rules doc has examples that make good test
   cases
4. Name tests after the rule they verify (e.g.,
   `"weapon can only slay monsters weaker than the last slain"`)
