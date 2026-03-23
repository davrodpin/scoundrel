import { assertEquals, assertThrows } from "@std/assert";
import {
  checkRuleConsistency,
  compareStates,
  extractActions,
  formatAuditReport,
  formatCard,
  formatCardLong,
  formatJsonReport,
  parseArgs,
  replayAndCompare,
  validateEventSequence,
} from "./audit-game.ts";
import { createGameEngine } from "@scoundrel/engine";
import type { Card, GameAction, GameState } from "@scoundrel/engine";
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

// --- parseArgs ---

Deno.test("parseArgs — positional arg only", () => {
  const args = parseArgs(["some-uuid"]);
  assertEquals(args.gameId, "some-uuid");
  assertEquals(args.showActions, false);
  assertEquals(args.jsonOutput, false);
});

Deno.test("parseArgs — --actions flag", () => {
  const args = parseArgs(["--actions", "some-uuid"]);
  assertEquals(args.gameId, "some-uuid");
  assertEquals(args.showActions, true);
  assertEquals(args.jsonOutput, false);
});

Deno.test("parseArgs — --json flag", () => {
  const args = parseArgs(["some-uuid", "--json"]);
  assertEquals(args.gameId, "some-uuid");
  assertEquals(args.jsonOutput, true);
  assertEquals(args.showActions, false);
});

Deno.test("parseArgs — both flags", () => {
  const args = parseArgs(["--actions", "--json", "some-uuid"]);
  assertEquals(args.gameId, "some-uuid");
  assertEquals(args.showActions, true);
  assertEquals(args.jsonOutput, true);
});

Deno.test("parseArgs — missing gameId throws", () => {
  assertThrows(() => parseArgs(["--actions"]), Error, "GAME_ID");
});

Deno.test("parseArgs — unrecognized flag throws", () => {
  assertThrows(() => parseArgs(["--verbose", "some-uuid"]), Error, "--verbose");
});

// --- extractActions ---

Deno.test("extractActions — returns one entry per action_applied event", () => {
  const events = makeStoredEvents(); // game_created + 4 draw_card
  const actions = extractActions(events);
  assertEquals(actions.length, 4);
});

Deno.test("extractActions — draw_card shows the drawn card name", () => {
  // seed: first card is { suit: "clubs", rank: 2 }
  const events = makeStoredEvents();
  const actions = extractActions(events);
  assertEquals(actions[0].description, "Draw 2 of Clubs");
});

Deno.test("extractActions — sequence numbers match stored event sequences", () => {
  const events = makeStoredEvents();
  const actions = extractActions(events);
  for (let i = 0; i < actions.length; i++) {
    assertEquals(actions[i].sequence, events[i + 1].sequence);
  }
});

function makeChooseCardEvents(
  card: Card,
  fightWith: "weapon" | "barehanded",
  healthAfter = 20,
  healthBefore = 20,
): StoredEvent[] {
  return [
    {
      sequence: 0,
      payload: {
        kind: "game_created",
        id: 1,
        timestamp: "2025-01-01T00:00:00Z",
        gameId: "test",
        initialState: makeState({
          health: healthBefore,
          room: [card],
          phase: {
            kind: "choosing",
            cardsChosen: 0,
            potionUsedThisTurn: false,
          },
        }),
      },
    },
    {
      sequence: 1,
      payload: {
        kind: "action_applied",
        id: 2,
        timestamp: "2025-01-01T00:00:01Z",
        action: { type: "choose_card", cardIndex: 0, fightWith },
        stateAfter: makeState({ room: [], health: healthAfter }),
      },
    },
  ];
}

Deno.test("extractActions — choose_card monster barehanded shows health change", () => {
  const events = makeChooseCardEvents(
    { suit: "clubs", rank: 7 },
    "barehanded",
    13,
  );
  const actions = extractActions(events);
  assertEquals(
    actions[0].description,
    "Fight 7 of Clubs barehanded (20 → 13 HP)",
  );
});

Deno.test("extractActions — choose_card monster with weapon shows health change", () => {
  const events = makeChooseCardEvents(
    { suit: "spades", rank: 10 },
    "weapon",
    15,
  );
  const actions = extractActions(events);
  assertEquals(
    actions[0].description,
    "Fight 10 of Spades with weapon (20 → 15 HP)",
  );
});

Deno.test("extractActions — choose_card monster no damage taken", () => {
  const events = makeChooseCardEvents(
    { suit: "clubs", rank: 3 },
    "weapon",
    20,
  );
  const actions = extractActions(events);
  assertEquals(
    actions[0].description,
    "Fight 3 of Clubs with weapon (no damage)",
  );
});

Deno.test("extractActions — choose_card weapon equipped", () => {
  const events = makeChooseCardEvents(
    { suit: "diamonds", rank: 5 },
    "barehanded",
  );
  const actions = extractActions(events);
  assertEquals(actions[0].description, "Equip 5 of Diamonds");
});

Deno.test("extractActions — choose_card potion shows health change", () => {
  const events = makeChooseCardEvents(
    { suit: "hearts", rank: 4 },
    "barehanded",
    17,
    13,
  );
  const actions = extractActions(events);
  assertEquals(actions[0].description, "Drink 4 of Hearts (13 → 17 HP)");
});

Deno.test("extractActions — choose_card potion at full health", () => {
  const events = makeChooseCardEvents(
    { suit: "hearts", rank: 4 },
    "barehanded",
    20,
  );
  const actions = extractActions(events);
  assertEquals(actions[0].description, "Drink 4 of Hearts (no effect)");
});

// --- formatJsonReport ---

function makeReport(
  overrides: Partial<import("./audit-game.ts").AuditReport> = {},
): import("./audit-game.ts").AuditReport {
  return {
    gameId: "test-game-id",
    playerName: "Tester",
    dbStatus: "in_progress",
    totalEvents: 5,
    sequenceIssues: [],
    discrepancies: [],
    dbStatusMismatch: null,
    ruleViolations: [],
    finalState: makeState(),
    actions: null,
    ...overrides,
  };
}

Deno.test("formatJsonReport — passed is true when no issues", () => {
  const json = formatJsonReport(makeReport());
  assertEquals(json.validation.passed, true);
});

Deno.test("formatJsonReport — passed is false with sequenceIssues", () => {
  const json = formatJsonReport(makeReport({ sequenceIssues: ["gap at 3"] }));
  assertEquals(json.validation.passed, false);
});

Deno.test("formatJsonReport — passed is false with ruleViolations", () => {
  const json = formatJsonReport(
    makeReport({
      ruleViolations: [{
        check: "A1",
        eventIndices: [1, 5],
        message: "duplicate draw",
      }],
    }),
  );
  assertEquals(json.validation.passed, false);
});

Deno.test("formatJsonReport — ruleViolations included in validation", () => {
  const violations = [{
    check: "C1",
    eventIndices: [3],
    message: "bad damage",
  }];
  const json = formatJsonReport(makeReport({ ruleViolations: violations }));
  assertEquals(json.validation.ruleViolations, violations);
});

Deno.test("formatJsonReport — gameState health matches finalState", () => {
  const json = formatJsonReport(
    makeReport({ finalState: makeState({ health: 15 }) }),
  );
  assertEquals(json.gameState.health, 15);
  assertEquals(json.gameState.maxHealth, 20);
});

Deno.test("formatJsonReport — actions absent when report.actions is null", () => {
  const json = formatJsonReport(makeReport({ actions: null }));
  assertEquals("actions" in json, false);
});

Deno.test("formatJsonReport — actions present when report.actions is non-null", () => {
  const events = makeStoredEvents();
  const actions = extractActions(events);
  const json = formatJsonReport(makeReport({ actions }));
  assertEquals(json.actions?.length, 4);
});

// --- formatAuditReport with actions ---

Deno.test("formatAuditReport — no actions section when actions is null", () => {
  const report = makeReport({ actions: null });
  const output = formatAuditReport(report);
  assertEquals(output.includes("--- Actions ---"), false);
});

Deno.test("formatAuditReport — rule consistency OK when no violations", () => {
  const output = formatAuditReport(makeReport());
  assertEquals(output.includes("Rule consistency:"), true);
  assertEquals(output.includes("OK"), true);
});

Deno.test("formatAuditReport — rule consistency FAIL lists violations", () => {
  const report = makeReport({
    ruleViolations: [{
      check: "A1",
      eventIndices: [1, 5],
      message: "7 of Clubs drawn at event #1 and again at event #5",
    }],
  });
  const output = formatAuditReport(report);
  assertEquals(output.includes("FAIL"), true);
  assertEquals(output.includes("[A1]"), true);
  assertEquals(output.includes("7 of Clubs drawn at event #1"), true);
});

Deno.test("formatAuditReport — actions section present when actions non-null", () => {
  const events = makeStoredEvents();
  const actions = extractActions(events);
  const report = makeReport({ actions });
  const output = formatAuditReport(report);
  assertEquals(output.includes("--- Actions ---"), true);
  assertEquals(output.includes("Draw 2 of Clubs"), true);
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

// --- checkRuleConsistency helpers ---

function makeGameCreated(state: GameState, seq = 0): StoredEvent {
  return {
    sequence: seq,
    payload: {
      kind: "game_created",
      id: seq,
      timestamp: "2025-01-01T00:00:00Z",
      gameId: "test",
      initialState: state,
    },
  };
}

function makeActionApplied(
  seq: number,
  action: GameAction,
  stateAfter: GameState,
): StoredEvent {
  return {
    sequence: seq,
    payload: {
      kind: "action_applied",
      id: seq,
      timestamp: "2025-01-01T00:00:00Z",
      action,
      stateAfter,
    },
  };
}

// Builds the 44-card valid Scoundrel deck
function makeValidDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of ["clubs", "spades"] as const) {
    for (let rank = 2; rank <= 14; rank++) {
      cards.push({ suit, rank: rank as Card["rank"] });
    }
  }
  for (const suit of ["diamonds", "hearts"] as const) {
    for (let rank = 2; rank <= 10; rank++) {
      cards.push({ suit, rank: rank as Card["rank"] });
    }
  }
  return cards;
}

// --- checkRuleConsistency ---

Deno.test("checkRuleConsistency — A3: flags wrong initial deck size", () => {
  const state = makeState({ dungeon: [{ suit: "clubs", rank: 2 }] });
  const events = [makeGameCreated(state)];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "A3"),
    true,
  );
});

Deno.test("checkRuleConsistency — A2: flags invalid card in initial deck", () => {
  const deck = makeValidDeck();
  deck[0] = { suit: "hearts", rank: 11 }; // red Jack — not in Scoundrel deck
  const state = makeState({ dungeon: deck });
  const events = [makeGameCreated(state)];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "A2"),
    true,
  );
});

Deno.test("checkRuleConsistency — A1: flags same card drawn twice", () => {
  const card: Card = { suit: "clubs", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  const stateAfter1 = makeState({ room: [card] });
  const stateAfter2 = makeState({ room: [card, card] });
  const events = [
    makeGameCreated(state),
    makeActionApplied(1, { type: "draw_card" }, stateAfter1),
    makeActionApplied(2, { type: "draw_card" }, stateAfter2),
  ];
  const violations = checkRuleConsistency(events);
  const a1 = violations.filter((v) => v.check === "A1");
  assertEquals(a1.length, 1);
  assertEquals(a1[0].eventIndices, [1, 2]);
});

Deno.test("checkRuleConsistency — A1: no violation when different cards drawn", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  const stateAfter1 = makeState({ room: [{ suit: "clubs", rank: 7 }] });
  const stateAfter2 = makeState({
    room: [{ suit: "clubs", rank: 7 }, { suit: "spades", rank: 3 }],
  });
  const events = [
    makeGameCreated(state),
    makeActionApplied(1, { type: "draw_card" }, stateAfter1),
    makeActionApplied(2, { type: "draw_card" }, stateAfter2),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.filter((v) => v.check === "A1").length,
    0,
  );
});

Deno.test("checkRuleConsistency — B1: flags card count != 44 after action", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  // stateAfter has one fewer card (43 total)
  const stateAfter = makeState({ dungeon: deck.slice(1) });
  const events = [
    makeGameCreated(state),
    makeActionApplied(1, { type: "draw_card" }, stateAfter),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "B1"),
    true,
  );
});

Deno.test("checkRuleConsistency — C1: flags barehanded combat damage miscalculation", () => {
  const monster: Card = { suit: "clubs", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    room: [monster],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const wrongHealth = 15; // correct: 20 - 7 = 13
  const stateAfter = makeState({ dungeon: deck, health: wrongHealth });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "C1"),
    true,
  );
});

Deno.test("checkRuleConsistency — C1: no violation when barehanded damage is correct", () => {
  const monster: Card = { suit: "clubs", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    room: [monster],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const correctHealth = 13; // 20 - 7 = 13
  const stateAfter = makeState({
    dungeon: deck,
    discard: [monster],
    health: correctHealth,
  });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.filter((v) => v.check === "C1").length,
    0,
  );
});

Deno.test("checkRuleConsistency — C2: flags weapon combat damage miscalculation", () => {
  const monster: Card = { suit: "clubs", rank: 9 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    room: [monster],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: weapon, slainMonsters: [] },
  });
  const wrongHealth = 15; // correct: 20 - max(0, 9-5) = 16
  const stateAfter = makeState({ dungeon: deck, health: wrongHealth });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "weapon" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "C2"),
    true,
  );
});

Deno.test("checkRuleConsistency — C3: flags incorrect first potion healing", () => {
  const potion: Card = { suit: "hearts", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    health: 10,
    room: [potion],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
  });
  const wrongHealth = 15; // correct: min(20, 10 + 7) = 17
  const stateAfter = makeState({ dungeon: deck, health: wrongHealth });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "C3"),
    true,
  );
});

Deno.test("checkRuleConsistency — C4: flags second potion changing health", () => {
  const potion: Card = { suit: "hearts", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    health: 10,
    room: [potion],
    phase: { kind: "choosing", cardsChosen: 1, potionUsedThisTurn: true },
  });
  const wrongHealth = 17; // correct: health stays 10 (second potion wasted)
  const stateAfter = makeState({ dungeon: deck, health: wrongHealth });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "C4"),
    true,
  );
});

Deno.test("checkRuleConsistency — C5: flags health exceeding 20", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  const stateAfter = makeState({
    dungeon: deck.slice(1),
    room: [deck[0]],
    health: 21,
  });
  const events = [
    makeGameCreated(state),
    makeActionApplied(1, { type: "draw_card" }, stateAfter),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "C5"),
    true,
  );
});

Deno.test("checkRuleConsistency — D1: flags weapon used on stronger monster than last slain", () => {
  const monster: Card = { suit: "clubs", rank: 9 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const lastSlain: Card = { suit: "spades", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    room: [monster],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: weapon, slainMonsters: [lastSlain] },
  });
  const stateAfter = makeState({ dungeon: deck, health: 16 });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "weapon" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "D1"),
    true,
  );
});

Deno.test("checkRuleConsistency — D1: no violation when monster rank equals last slain", () => {
  const monster: Card = { suit: "clubs", rank: 7 };
  const weapon: Card = { suit: "diamonds", rank: 5 };
  const lastSlain: Card = { suit: "spades", rank: 7 };
  const deck = makeValidDeck();
  const state = makeState({
    dungeon: deck,
    room: [monster],
    phase: { kind: "choosing", cardsChosen: 0, potionUsedThisTurn: false },
    equippedWeapon: { card: weapon, slainMonsters: [lastSlain] },
  });
  const stateAfter = makeState({ dungeon: deck, health: 18 }); // 20 - max(0, 7-5) = 18
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "weapon" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.filter((v) => v.check === "D1").length,
    0,
  );
});

Deno.test("checkRuleConsistency — E1: flags consecutive room avoidance", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck, lastRoomAvoided: true });
  const stateAfter = makeState({ dungeon: deck });
  const events = [
    makeGameCreated(state),
    makeActionApplied(1, { type: "avoid_room" }, stateAfter),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "E1"),
    true,
  );
});

Deno.test("checkRuleConsistency — F1: flags dungeon_cleared with cards remaining in dungeon", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  const stateAfter = makeState({
    dungeon: [{ suit: "clubs", rank: 2 }],
    phase: { kind: "game_over", reason: "dungeon_cleared" },
  });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "F1"),
    true,
  );
});

Deno.test("checkRuleConsistency — F2: flags game not ending when dungeon and room empty", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  const stateAfter = makeState({
    dungeon: [],
    room: [],
    phase: { kind: "drawing" },
  });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      stateAfter,
    ),
  ];
  const violations = checkRuleConsistency(events);
  assertEquals(
    violations.some((v) => v.check === "F2"),
    true,
  );
});

Deno.test("checkRuleConsistency — F3: flags action after game over", () => {
  const deck = makeValidDeck();
  const state = makeState({ dungeon: deck });
  const gameOverState = makeState({
    dungeon: [],
    phase: { kind: "game_over", reason: "dead" },
    health: -2,
  });
  const afterGameOverState = makeState({ dungeon: [] });
  const events = [
    makeGameCreated(state),
    makeActionApplied(
      1,
      { type: "choose_card", cardIndex: 0, fightWith: "barehanded" },
      gameOverState,
    ),
    makeActionApplied(2, { type: "draw_card" }, afterGameOverState),
  ];
  const violations = checkRuleConsistency(events);
  const f3 = violations.filter((v) => v.check === "F3");
  assertEquals(f3.length, 1);
  assertEquals(f3[0].eventIndices, [1, 2]);
});
