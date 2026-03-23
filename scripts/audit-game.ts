import pg from "pg";
import type { GameAction } from "@scoundrel/engine";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { applyAction, calculateScore } from "@scoundrel/engine";
import type { Card, GameState } from "@scoundrel/engine";
import { createPrismaGameRepository } from "@scoundrel/game-service";
import type { StoredEvent } from "@scoundrel/game-service";
import { getTracer } from "@scoundrel/telemetry";

// --- Card formatting ---

const RANK_ABBREVIATIONS: Record<number, string> = {
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

const SUIT_ABBREVIATIONS: Record<string, string> = {
  clubs: "C",
  spades: "S",
  diamonds: "D",
  hearts: "H",
};

const RANK_NAMES: Record<number, string> = {
  11: "Jack",
  12: "Queen",
  13: "King",
  14: "Ace",
};

const SUIT_NAMES: Record<string, string> = {
  clubs: "Clubs",
  spades: "Spades",
  diamonds: "Diamonds",
  hearts: "Hearts",
};

export function formatCard(card: Card): string {
  const rank = RANK_ABBREVIATIONS[card.rank] ?? String(card.rank);
  const suit = SUIT_ABBREVIATIONS[card.suit];
  return `${rank}${suit}`;
}

export function formatCardLong(card: Card): string {
  const rank = RANK_NAMES[card.rank] ?? String(card.rank);
  const suit = SUIT_NAMES[card.suit];
  return `${rank} of ${suit}`;
}

// --- Structural validation ---

export function validateEventSequence(events: StoredEvent[]): string[] {
  const issues: string[] = [];

  if (events.length === 0) {
    issues.push("No events found for this game");
    return issues;
  }

  if (events[0].payload.kind !== "game_created") {
    issues.push(
      `First event has kind "${
        events[0].payload.kind
      }", expected "game_created"`,
    );
  }

  for (let i = 1; i < events.length; i++) {
    if (events[i].payload.kind !== "action_applied") {
      issues.push(
        `Event at index ${i} has kind "${
          events[i].payload.kind
        }", expected "action_applied"`,
      );
    }
  }

  for (let i = 0; i < events.length; i++) {
    if (events[i].sequence !== i) {
      issues.push(
        `Event at index ${i} has sequence ${events[i].sequence}, expected ${i}`,
      );
    }
  }

  return issues;
}

// --- State comparison ---

export function compareStates(
  replayed: GameState,
  stored: GameState,
): string[] {
  const diffs: string[] = [];

  if (replayed.health !== stored.health) {
    diffs.push(
      `health mismatch (replayed: ${replayed.health}, stored: ${stored.health})`,
    );
  }

  if (replayed.dungeon.length !== stored.dungeon.length) {
    diffs.push(
      `dungeon length mismatch (replayed: ${replayed.dungeon.length}, stored: ${stored.dungeon.length})`,
    );
  } else if (
    JSON.stringify(replayed.dungeon) !== JSON.stringify(stored.dungeon)
  ) {
    diffs.push("dungeon contents differ");
  }

  if (replayed.room.length !== stored.room.length) {
    diffs.push(
      `room length mismatch (replayed: ${replayed.room.length}, stored: ${stored.room.length})`,
    );
  } else if (JSON.stringify(replayed.room) !== JSON.stringify(stored.room)) {
    diffs.push("room contents differ");
  }

  if (replayed.discard.length !== stored.discard.length) {
    diffs.push(
      `discard length mismatch (replayed: ${replayed.discard.length}, stored: ${stored.discard.length})`,
    );
  } else if (
    JSON.stringify(replayed.discard) !== JSON.stringify(stored.discard)
  ) {
    diffs.push("discard contents differ");
  }

  if (
    JSON.stringify(replayed.equippedWeapon) !==
      JSON.stringify(stored.equippedWeapon)
  ) {
    diffs.push("equippedWeapon differs");
  }

  if (JSON.stringify(replayed.phase) !== JSON.stringify(stored.phase)) {
    diffs.push(
      `phase mismatch (replayed: ${replayed.phase.kind}, stored: ${stored.phase.kind})`,
    );
  }

  if (replayed.lastRoomAvoided !== stored.lastRoomAvoided) {
    diffs.push(
      `lastRoomAvoided mismatch (replayed: ${replayed.lastRoomAvoided}, stored: ${stored.lastRoomAvoided})`,
    );
  }

  if (replayed.turnNumber !== stored.turnNumber) {
    diffs.push(
      `turnNumber mismatch (replayed: ${replayed.turnNumber}, stored: ${stored.turnNumber})`,
    );
  }

  if (
    JSON.stringify(replayed.lastCardPlayed) !==
      JSON.stringify(stored.lastCardPlayed)
  ) {
    diffs.push("lastCardPlayed differs");
  }

  return diffs;
}

// --- Replay and compare ---

export type ReplayResult = {
  discrepancies: string[];
  finalState: GameState;
};

export function replayAndCompare(events: StoredEvent[]): ReplayResult {
  const firstPayload = events[0].payload;

  if (firstPayload.kind !== "game_created") {
    return {
      discrepancies: ["Cannot replay: first event is not game_created"],
      finalState: getLastKnownState(events),
    };
  }

  const discrepancies: string[] = [];
  let currentState = firstPayload.initialState;

  for (let i = 1; i < events.length; i++) {
    const event = events[i].payload;
    if (event.kind !== "action_applied") continue;

    let replayedState: GameState;
    try {
      replayedState = applyAction(currentState, event.action);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      discrepancies.push(`Event #${i}: reducer threw: ${message}`);
      currentState = event.stateAfter;
      continue;
    }

    const diffs = compareStates(replayedState, event.stateAfter);
    for (const diff of diffs) {
      discrepancies.push(`Event #${i}: ${diff}`);
    }

    // Use replayed state to detect cascading drift
    currentState = replayedState;
  }

  return { discrepancies, finalState: currentState };
}

function getLastKnownState(events: StoredEvent[]): GameState {
  for (let i = events.length - 1; i >= 0; i--) {
    const payload = events[i].payload;
    if (payload.kind === "action_applied") return payload.stateAfter;
    if (payload.kind === "game_created") return payload.initialState;
  }
  throw new Error("No valid state found in events");
}

// --- Report formatting ---

export type ActionEntry = {
  sequence: number;
  action: GameAction;
  description: string;
};

export type AuditReport = {
  gameId: string;
  playerName: string;
  dbStatus: string;
  totalEvents: number;
  sequenceIssues: string[];
  discrepancies: string[];
  dbStatusMismatch: string | null;
  finalState: GameState;
  actions: ActionEntry[] | null;
};

function formatPhaseStatus(state: GameState): string {
  switch (state.phase.kind) {
    case "drawing":
      return "In progress (drawing cards)";
    case "room_ready":
      return "In progress (room ready)";
    case "choosing":
      return `In progress (choosing, ${state.phase.cardsChosen}/3 chosen)`;
    case "game_over":
      return state.phase.reason === "dead"
        ? "Completed (hero died)"
        : "Completed (dungeon cleared)";
  }
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [];
  const { finalState } = report;

  const hasIssues = report.sequenceIssues.length > 0 ||
    report.discrepancies.length > 0 ||
    report.dbStatusMismatch !== null;

  lines.push("=== Scoundrel Game Audit ===");
  lines.push("");
  lines.push(`Game ID:      ${report.gameId}`);
  lines.push(`Player:       ${report.playerName}`);
  lines.push(`DB Status:    ${report.dbStatus}`);
  lines.push(`Total Events: ${report.totalEvents}`);
  lines.push("");
  lines.push("--- Validation ---");
  lines.push("");

  if (report.sequenceIssues.length === 0) {
    const last = report.totalEvents - 1;
    lines.push(
      `Event sequence:   OK (${report.totalEvents} events, 0..${last})`,
    );
    lines.push(`First event type: OK (game_created)`);
  } else {
    lines.push(`Event sequence:   FAIL`);
    for (const issue of report.sequenceIssues) {
      lines.push(`  ${issue}`);
    }
    const firstEventOk = !report.sequenceIssues.some((s) =>
      s.includes("game_created")
    );
    lines.push(
      `First event type: ${firstEventOk ? "OK (game_created)" : "FAIL"}`,
    );
  }

  const actionCount = report.totalEvents - 1;
  if (report.discrepancies.length === 0) {
    lines.push(
      `State replay:     OK (${actionCount} action${
        actionCount !== 1 ? "s" : ""
      } replayed, all snapshots match)`,
    );
  } else {
    lines.push(`State replay:     FAIL`);
    for (const disc of report.discrepancies) {
      lines.push(`  ${disc}`);
    }
  }

  if (report.dbStatusMismatch === null) {
    lines.push(
      `DB status check:  OK (${report.dbStatus} matches ${finalState.phase.kind} phase)`,
    );
  } else {
    lines.push(`DB status check:  WARN (${report.dbStatusMismatch})`);
  }

  if (report.actions !== null) {
    lines.push("");
    lines.push("--- Actions ---");
    lines.push("");
    for (const entry of report.actions) {
      lines.push(`  #${entry.sequence}  ${entry.description}`);
    }
  }

  lines.push("");
  lines.push("--- Game State ---");
  lines.push("");
  lines.push(`Status:          ${formatPhaseStatus(finalState)}`);
  lines.push(`Health:          ${finalState.health} / 20`);
  lines.push(`Score:           ${calculateScore(finalState)}`);
  lines.push(`Turn:            ${finalState.turnNumber}`);
  lines.push(
    `Dungeon:         ${finalState.dungeon.length} card${
      finalState.dungeon.length !== 1 ? "s" : ""
    } remaining`,
  );
  lines.push(
    `Discard:         ${finalState.discard.length} card${
      finalState.discard.length !== 1 ? "s" : ""
    }`,
  );

  if (finalState.room.length === 0) {
    lines.push(`Room:            empty`);
  } else {
    const roomCards = finalState.room.map(formatCard).join(", ");
    lines.push(
      `Room:            ${finalState.room.length} card${
        finalState.room.length !== 1 ? "s" : ""
      } [${roomCards}]`,
    );
  }

  if (finalState.equippedWeapon === null) {
    lines.push(`Equipped Weapon: none`);
    lines.push(`Last Monster:    none`);
  } else {
    const weapon = finalState.equippedWeapon;
    const slainCount = weapon.slainMonsters.length;
    lines.push(
      `Equipped Weapon: ${formatCardLong(weapon.card)} (${slainCount} monster${
        slainCount !== 1 ? "s" : ""
      } slain)`,
    );
    if (slainCount === 0) {
      lines.push(`Last Monster:    none`);
    } else {
      const lastMonster = weapon.slainMonsters[slainCount - 1];
      lines.push(`Last Monster:    ${formatCardLong(lastMonster)}`);
    }
  }

  lines.push("");

  if (hasIssues) {
    const counts: string[] = [];
    if (report.sequenceIssues.length > 0) {
      counts.push(
        `${report.sequenceIssues.length} sequence issue${
          report.sequenceIssues.length !== 1 ? "s" : ""
        }`,
      );
    }
    if (report.discrepancies.length > 0) {
      counts.push(
        `${report.discrepancies.length} state discrepanc${
          report.discrepancies.length !== 1 ? "ies" : "y"
        }`,
      );
    }
    if (report.dbStatusMismatch !== null) {
      counts.push("1 status mismatch");
    }
    lines.push(`=== Audit Complete: FAIL (${counts.join(", ")}) ===`);
  } else {
    lines.push("=== Audit Complete: PASS ===");
  }

  return lines.join("\n");
}

// --- Argument parsing ---

export type CliArgs = {
  gameId: string;
  showActions: boolean;
  jsonOutput: boolean;
};

export function parseArgs(args: string[]): CliArgs {
  const KNOWN_FLAGS = new Set(["--actions", "--json"]);
  let showActions = false;
  let jsonOutput = false;
  let gameId: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--")) {
      if (!KNOWN_FLAGS.has(arg)) {
        throw new Error(`Unrecognized flag: ${arg}`);
      }
      if (arg === "--actions") showActions = true;
      if (arg === "--json") jsonOutput = true;
    } else {
      gameId = arg;
    }
  }

  if (!gameId) {
    throw new Error("GAME_ID argument is required");
  }

  return { gameId, showActions, jsonOutput };
}

// --- Action extraction ---

function describeAction(
  action: GameAction,
  stateBefore: GameState,
): string {
  switch (action.type) {
    case "draw_card":
      return "Draw card";
    case "avoid_room":
      return "Avoid room";
    case "enter_room":
      return "Enter room";
    case "choose_card": {
      const card = stateBefore.room[action.cardIndex];
      const cardStr = card ? formatCardLong(card) : `card #${action.cardIndex}`;
      return `Choose ${cardStr} (${action.fightWith})`;
    }
  }
}

export function extractActions(events: StoredEvent[]): ActionEntry[] {
  const entries: ActionEntry[] = [];

  for (let i = 1; i < events.length; i++) {
    const event = events[i].payload;
    if (event.kind !== "action_applied") continue;

    const prevPayload = events[i - 1].payload;
    const stateBefore = prevPayload.kind === "game_created"
      ? prevPayload.initialState
      : prevPayload.stateAfter;

    entries.push({
      sequence: events[i].sequence,
      action: event.action,
      description: describeAction(event.action, stateBefore),
    });
  }

  return entries;
}

// --- JSON report ---

export type JsonReport = {
  gameId: string;
  playerName: string;
  dbStatus: string;
  totalEvents: number;
  validation: {
    sequenceIssues: string[];
    discrepancies: string[];
    dbStatusMismatch: string | null;
    passed: boolean;
  };
  gameState: {
    status: string;
    health: number;
    maxHealth: number;
    score: number;
    turn: number;
    dungeon: { count: number };
    discard: { count: number };
    room: { count: number; cards: string[] };
    equippedWeapon: {
      card: string;
      slainCount: number;
      lastMonster: string | null;
    } | null;
  };
  actions?: ActionEntry[];
};

export function formatJsonReport(report: AuditReport): JsonReport {
  const { finalState } = report;

  const weapon = finalState.equippedWeapon
    ? {
      card: formatCardLong(finalState.equippedWeapon.card),
      slainCount: finalState.equippedWeapon.slainMonsters.length,
      lastMonster: finalState.equippedWeapon.slainMonsters.length > 0
        ? formatCardLong(
          finalState.equippedWeapon.slainMonsters[
            finalState.equippedWeapon.slainMonsters.length - 1
          ],
        )
        : null,
    }
    : null;

  const json: JsonReport = {
    gameId: report.gameId,
    playerName: report.playerName,
    dbStatus: report.dbStatus,
    totalEvents: report.totalEvents,
    validation: {
      sequenceIssues: report.sequenceIssues,
      discrepancies: report.discrepancies,
      dbStatusMismatch: report.dbStatusMismatch,
      passed: report.sequenceIssues.length === 0 &&
        report.discrepancies.length === 0 &&
        report.dbStatusMismatch === null,
    },
    gameState: {
      status: formatPhaseStatus(finalState),
      health: finalState.health,
      maxHealth: 20,
      score: calculateScore(finalState),
      turn: finalState.turnNumber,
      dungeon: { count: finalState.dungeon.length },
      discard: { count: finalState.discard.length },
      room: {
        count: finalState.room.length,
        cards: finalState.room.map(formatCard),
      },
      equippedWeapon: weapon,
    },
  };

  if (report.actions !== null) {
    json.actions = report.actions;
  }

  return json;
}

// --- Main ---

if (import.meta.main) {
  const databaseUrl = Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is required");
    console.error(
      "Usage: DATABASE_URL=<url> deno task audit:game [--actions] [--json] <GAME_ID>",
    );
    Deno.exit(1);
  }

  let cliArgs: CliArgs;
  try {
    cliArgs = parseArgs(Deno.args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    console.error(
      "Usage: DATABASE_URL=<url> deno task audit:game [--actions] [--json] <GAME_ID>",
    );
    Deno.exit(1);
  }

  const { gameId, showActions, jsonOutput } = cliArgs;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_PATTERN.test(gameId)) {
    console.error(`Error: GAME_ID must be a valid UUID, got: ${gameId}`);
    Deno.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const tracer = getTracer();
  const repository = createPrismaGameRepository(prisma, tracer);

  try {
    const [storedEvents, dbStatus, playerName] = await Promise.all([
      repository.getAllEvents(gameId),
      repository.getGameStatus(gameId),
      repository.getPlayerName(gameId),
    ]);

    if (storedEvents.length === 0) {
      console.error(`Error: Game not found or has no events: ${gameId}`);
      Deno.exit(1);
    }

    const sequenceIssues = validateEventSequence(storedEvents);
    const { discrepancies, finalState } = sequenceIssues.length === 0
      ? replayAndCompare(storedEvents)
      : { discrepancies: [], finalState: getLastKnownState(storedEvents) };

    const expectedDbStatus = finalState.phase.kind === "game_over"
      ? "completed"
      : "in_progress";
    const actualDbStatus = dbStatus ?? "unknown";
    const dbStatusMismatch = actualDbStatus !== expectedDbStatus
      ? `DB says "${actualDbStatus}" but phase is "${finalState.phase.kind}"`
      : null;

    const report: AuditReport = {
      gameId,
      playerName: playerName ?? "Anonymous",
      dbStatus: actualDbStatus,
      totalEvents: storedEvents.length,
      sequenceIssues,
      discrepancies,
      dbStatusMismatch,
      finalState,
      actions: showActions ? extractActions(storedEvents) : null,
    };

    const output = jsonOutput
      ? JSON.stringify(formatJsonReport(report), null, 2)
      : formatAuditReport(report);
    console.log(output);

    const hasIssues = sequenceIssues.length > 0 ||
      discrepancies.length > 0 ||
      dbStatusMismatch !== null;
    Deno.exit(hasIssues ? 2 : 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    Deno.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
