/**
 * Repair script for games stuck in the "choosing" phase due to the bug fixed
 * in PR #116. Games with a short final room (fewer than 4 cards because the
 * dungeon ran out mid-draw) would end up with room empty, dungeon empty, and
 * phase still "choosing" — no way for the player to advance.
 *
 * Strategy: re-apply the last action through the fixed engine, update the last
 * event's stored stateAfter with the corrected state, mark the game completed,
 * and create the leaderboard entry.
 *
 * Usage:
 *   DATABASE_URL=<url> deno task repair:stuck-games [--apply] [GAME_ID...]
 *
 * Without --apply, runs in dry-run mode (read-only).
 */

import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client.ts";
import { applyAction, calculateScore } from "@scoundrel/engine";
import type { GameState } from "@scoundrel/engine";
import { createPrismaGameRepository } from "@scoundrel/game-service";
import type { StoredEvent } from "@scoundrel/game-service";
import { getTracer } from "@scoundrel/telemetry";

// Games known to be affected by the PR #116 bug.
const KNOWN_STUCK_GAME_IDS = [
  "39717814-9eff-4bca-afb2-f4a42ce9d5bf",
  "4ddca7da-7b94-4423-a04b-261143d38330",
  "6803a268-a950-4de8-94f2-f93691992b91",
  "706fb903-6053-4d36-9fd7-8ccd5dae956a",
  "76751486-1b38-4e07-8fd9-e4ff62b550f2",
  "9a8bf125-49ca-4d23-969e-8066d4134ded",
  "b1f8c806-3445-432b-9e3d-088760bda699",
  "c42b2170-7932-435e-a348-0770716d9297",
];

type RepairResult =
  | { status: "skipped"; reason: string }
  | { status: "error"; message: string }
  | { status: "dry-run"; playerName: string; health: number; score: number }
  | { status: "applied"; playerName: string; health: number; score: number };

function getStateBefore(events: StoredEvent[], index: number): GameState {
  const prev = events[index - 1];
  if (prev.payload.kind === "game_created") return prev.payload.initialState;
  if (prev.payload.kind === "action_applied") return prev.payload.stateAfter;
  throw new Error(`Unexpected event kind at index ${index - 1}`);
}

async function repairGame(
  gameId: string,
  prisma: PrismaClient,
  repository: ReturnType<typeof createPrismaGameRepository>,
  apply: boolean,
): Promise<RepairResult> {
  const events = await repository.getAllEvents(gameId);

  if (events.length === 0) {
    return { status: "skipped", reason: "no events found" };
  }

  const lastEvent = events[events.length - 1];

  if (lastEvent.payload.kind !== "action_applied") {
    return {
      status: "skipped",
      reason:
        `last event is "${lastEvent.payload.kind}", expected "action_applied"`,
    };
  }

  const { stateAfter, action } = lastEvent.payload;

  // Validate the stuck pattern
  if (stateAfter.phase.kind !== "choosing") {
    return {
      status: "skipped",
      reason:
        `phase is "${stateAfter.phase.kind}", not "choosing" — may already be repaired`,
    };
  }
  if (stateAfter.room.length !== 0 || stateAfter.dungeon.length !== 0) {
    return {
      status: "skipped",
      reason:
        `room has ${stateAfter.room.length} cards and dungeon has ${stateAfter.dungeon.length} cards — does not match stuck pattern`,
    };
  }

  const stateBefore = getStateBefore(events, events.length - 1);

  let correctedState: GameState;
  try {
    correctedState = applyAction(stateBefore, action);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", message: `applyAction threw: ${message}` };
  }

  if (correctedState.phase.kind !== "game_over") {
    return {
      status: "error",
      message:
        `Expected corrected state to be "game_over", got "${correctedState.phase.kind}"`,
    };
  }

  const score = calculateScore(correctedState);
  const playerName = (await repository.getPlayerName(gameId)) ?? "Anonymous";

  if (!apply) {
    return {
      status: "dry-run",
      playerName,
      health: correctedState.health,
      score,
    };
  }

  // Update the last event's payload with the corrected state.
  const correctedPayload = {
    ...lastEvent.payload,
    stateAfter: correctedState,
  };
  await prisma.gameEvent.update({
    where: {
      gameId_sequence: { gameId, sequence: lastEvent.sequence },
    },
    data: { payload: correctedPayload },
  });

  await repository.updateStatus(gameId, "completed", score);
  await repository.createLeaderboardEntry(
    gameId,
    playerName,
    score,
    new Date(),
  );

  return {
    status: "applied",
    playerName,
    health: correctedState.health,
    score,
  };
}

function parseArgs(
  args: string[],
): { apply: boolean; gameIds: string[] } {
  let apply = false;
  const gameIds: string[] = [];

  for (const arg of args) {
    if (arg === "--apply") {
      apply = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unrecognized flag: ${arg}`);
    } else {
      gameIds.push(arg);
    }
  }

  return {
    apply,
    gameIds: gameIds.length > 0 ? gameIds : KNOWN_STUCK_GAME_IDS,
  };
}

if (import.meta.main) {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is required");
    console.error(
      "Usage: DATABASE_URL=<url> deno task repair:stuck-games [--apply] [GAME_ID...]",
    );
    Deno.exit(1);
  }

  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs(Deno.args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    Deno.exit(1);
  }

  const { apply, gameIds } = parsed;

  console.log(
    apply
      ? "Mode: APPLY (writing changes to DB)"
      : "Mode: DRY RUN (no changes will be written)",
  );
  console.log(`Games to process: ${gameIds.length}`);
  console.log("");

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const tracer = getTracer();
  const repository = createPrismaGameRepository(prisma, tracer);

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const gameId of gameIds) {
      let result: RepairResult;
      try {
        result = await repairGame(gameId, prisma, repository, apply);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result = { status: "error", message };
      }

      switch (result.status) {
        case "skipped":
          console.log(`[SKIP]  ${gameId} — ${result.reason}`);
          skipped++;
          break;
        case "error":
          console.log(`[ERROR] ${gameId} — ${result.message}`);
          failed++;
          break;
        case "dry-run":
          console.log(
            `[DRY]   ${gameId} — ${result.playerName}, HP ${result.health}, score ${result.score}`,
          );
          succeeded++;
          break;
        case "applied":
          console.log(
            `[OK]    ${gameId} — ${result.playerName}, HP ${result.health}, score ${result.score}`,
          );
          succeeded++;
          break;
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("");
  console.log(
    `Done: ${succeeded} ${
      apply ? "applied" : "would apply"
    }, ${skipped} skipped, ${failed} failed`,
  );
  Deno.exit(failed > 0 ? 1 : 0);
}
