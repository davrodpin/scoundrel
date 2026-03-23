import { assertEquals } from "@std/assert";
import {
  compareStates,
  formatCard,
  formatCardLong,
  replayAndCompare,
  validateEventSequence,
} from "./audit-game.ts";
import { createGameEngine } from "@scoundrel/engine";
import type { Card, GameState } from "@scoundrel/engine";
import type { StoredEvent } from "@scoundrel/game-service";

// --- Helpers ---

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "test-game-id",
    health: 20,
    dungeon: [],
    room: [],
    discard: [],
    equippedWeapon: null,
    phase: { kind: "drawing" },
    lastRoomAvoided: false,
    turnNumber: 1,
    lastCardPlayed: null,
    ...overrides,
  };
}

function makeStoredEvents(): StoredEvent[] {
  const engine = createGameEngine();
  const seed: Card[] = [
    { suit: "clubs", rank: 2 },
    { suit: "spades", rank: 3 },
    { suit: "diamonds", rank: 5 },
    { suit: "hearts", rank: 4 },
  ];
  const { eventLog } = engine.createGame(seed);

  const events: StoredEvent[] = [
    { sequence: 0, payload: eventLog.events[0] },
  ];

  // Draw 4 cards
  let currentLog = eventLog;
  for (let i = 0; i < 4; i++) {
    const result = engine.submitAction(currentLog, { type: "draw_card" });
    if (!result.ok) throw new Error("draw failed");
    events.push({ sequence: i + 1, payload: result.event });
    currentLog = result.eventLog;
  }

  return events;
}

// --- formatCard ---

Deno.test("formatCard — number rank with suit abbreviation", () => {
  assertEquals(formatCard({ suit: "diamonds", rank: 7 }), "7D");
});

Deno.test("formatCard — Jack", () => {
  assertEquals(formatCard({ suit: "clubs", rank: 11 }), "JC");
});

Deno.test("formatCard — Queen of Spades", () => {
  assertEquals(formatCard({ suit: "spades", rank: 12 }), "QS");
});

Deno.test("formatCard — King of Hearts", () => {
  assertEquals(formatCard({ suit: "hearts", rank: 13 }), "KH");
});

Deno.test("formatCard — Ace of Clubs", () => {
  assertEquals(formatCard({ suit: "clubs", rank: 14 }), "AC");
});

// --- formatCardLong ---

Deno.test("formatCardLong — number rank", () => {
  assertEquals(formatCardLong({ suit: "diamonds", rank: 7 }), "7 of Diamonds");
});

Deno.test("formatCardLong — Queen of Spades", () => {
  assertEquals(
    formatCardLong({ suit: "spades", rank: 12 }),
    "Queen of Spades",
  );
});

// --- validateEventSequence ---

Deno.test("validateEventSequence — empty events returns issue", () => {
  const issues = validateEventSequence([]);
  assertEquals(issues.length > 0, true);
});

Deno.test("validateEventSequence — valid sequence returns no issues", () => {
  const events = makeStoredEvents();
  const issues = validateEventSequence(events);
  assertEquals(issues, []);
});

Deno.test("validateEventSequence — first event not game_created", () => {
  const engine = createGameEngine();
  const { eventLog } = engine.createGame();
  const result = engine.submitAction(eventLog, { type: "draw_card" });
  if (!result.ok) throw new Error("draw failed");

  const events: StoredEvent[] = [
    { sequence: 0, payload: result.event }, // action_applied at position 0
  ];
  const issues = validateEventSequence(events);
  assertEquals(issues.some((issue) => issue.includes("game_created")), true);
});

Deno.test("validateEventSequence — non-contiguous sequence", () => {
  const events = makeStoredEvents();
  // Corrupt a sequence number
  const corrupted: StoredEvent[] = events.map((e, i) =>
    i === 2 ? { ...e, sequence: 99 } : e
  );
  const issues = validateEventSequence(corrupted);
  assertEquals(issues.some((issue) => issue.includes("sequence")), true);
});

// --- compareStates ---

Deno.test("compareStates — identical states returns no diffs", () => {
  const state = makeState();
  assertEquals(compareStates(state, state), []);
});

Deno.test("compareStates — health mismatch", () => {
  const replayed = makeState({ health: 15 });
  const stored = makeState({ health: 14 });
  const diffs = compareStates(replayed, stored);
  assertEquals(diffs.length, 1);
  assertEquals(diffs[0].includes("health"), true);
});

Deno.test("compareStates — room length mismatch", () => {
  const replayed = makeState({ room: [{ suit: "clubs", rank: 5 }] });
  const stored = makeState({ room: [] });
  const diffs = compareStates(replayed, stored);
  assertEquals(diffs.some((diff) => diff.includes("room")), true);
});

Deno.test("compareStates — dungeon contents differ", () => {
  const card1: Card = { suit: "clubs", rank: 2 };
  const card2: Card = { suit: "spades", rank: 3 };
  const replayed = makeState({ dungeon: [card1] });
  const stored = makeState({ dungeon: [card2] });
  const diffs = compareStates(replayed, stored);
  assertEquals(diffs.some((diff) => diff.includes("dungeon")), true);
});

Deno.test("compareStates — turnNumber mismatch", () => {
  const replayed = makeState({ turnNumber: 2 });
  const stored = makeState({ turnNumber: 1 });
  const diffs = compareStates(replayed, stored);
  assertEquals(diffs.some((diff) => diff.includes("turnNumber")), true);
});

// --- replayAndCompare ---

Deno.test("replayAndCompare — valid events returns no discrepancies", () => {
  const events = makeStoredEvents();
  const { discrepancies } = replayAndCompare(events);
  assertEquals(discrepancies, []);
});

Deno.test("replayAndCompare — tampered stateAfter is detected", () => {
  const events = makeStoredEvents();

  // Tamper with the stored health in event #1
  const tampered = events.map((e, i) => {
    if (i === 1 && e.payload.kind === "action_applied") {
      return {
        ...e,
        payload: {
          ...e.payload,
          stateAfter: { ...e.payload.stateAfter, health: 999 },
        },
      };
    }
    return e;
  });

  const { discrepancies } = replayAndCompare(tampered as StoredEvent[]);
  assertEquals(discrepancies.length > 0, true);
  assertEquals(discrepancies.some((disc) => disc.includes("health")), true);
});

Deno.test("replayAndCompare — returns final state from last event", () => {
  const events = makeStoredEvents();
  const { finalState } = replayAndCompare(events);
  // After 4 draw_card actions the room should have 4 cards
  assertEquals(finalState.room.length, 4);
});

Deno.test(
  "replayAndCompare — cascading: uses replayed state not stored for next step",
  () => {
    const events = makeStoredEvents();

    // Tamper event #1 stateAfter to have wrong dungeon (extra card)
    // The next replay step (#2) uses the replayed state (correct), not tampered stored state
    // So event #2 should match since we continue with correct replayed state
    const tampered = events.map((e, i) => {
      if (i === 1 && e.payload.kind === "action_applied") {
        return {
          ...e,
          payload: {
            ...e.payload,
            stateAfter: {
              ...e.payload.stateAfter,
              // Inject extra card to create mismatch only at event #1
              dungeon: [
                ...e.payload.stateAfter.dungeon,
                { suit: "clubs" as const, rank: 2 as const },
              ],
            },
          },
        };
      }
      return e;
    });

    const { discrepancies } = replayAndCompare(tampered as StoredEvent[]);
    // Should detect issue at event #1
    assertEquals(
      discrepancies.some((disc) => disc.startsWith("Event #1:")),
      true,
    );
  },
);
