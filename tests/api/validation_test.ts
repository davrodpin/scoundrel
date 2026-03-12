// Integration tests for API error handling and input validation.
// Requires BASE_URL to be set in the environment.

import { assertEquals } from "@std/assert";
import {
  api,
  createGame,
  getEventLog,
  getGame,
  submitAction,
} from "./helpers.ts";

type ErrorBody = {
  code: number;
  error: { reason: string };
};

Deno.test("validation — create game with empty player name returns 422 ValidationError", async () => {
  const res = await createGame("");
  assertEquals(res.status, 422);

  const body = await res.json() as ErrorBody;
  assertEquals(body.code, 422);
  assertEquals(body.error.reason, "ValidationError");
});

Deno.test("validation — get non-existent game returns 404 GameNotFoundError", async () => {
  const fakeId = crypto.randomUUID();
  const res = await getGame(fakeId);
  assertEquals(res.status, 404);

  const body = await res.json() as ErrorBody;
  assertEquals(body.code, 404);
  assertEquals(body.error.reason, "GameNotFoundError");
});

Deno.test("validation — submit invalid action during drawing phase returns 422 InvalidActionError", async () => {
  // Create a game (starts in drawing phase)
  const createRes = await createGame("ValidationTester");
  assertEquals(createRes.status, 201);
  const view = await createRes.json() as {
    gameId: string;
    phase: { kind: string };
  };
  assertEquals(view.phase.kind, "drawing");

  // Submit choose_card during drawing phase — invalid action
  const res = await submitAction(view.gameId, {
    type: "choose_card",
    cardIndex: 0,
    fightWith: "barehanded",
  });
  assertEquals(res.status, 422);

  const body = await res.json() as ErrorBody;
  assertEquals(body.code, 422);
  assertEquals(body.error.reason, "InvalidActionError");
});

Deno.test("validation — submit malformed JSON returns 422 InvalidJsonError", async () => {
  // Create a game to get a valid game ID
  const createRes = await createGame("MalformedTester");
  assertEquals(createRes.status, 201);
  const view = await createRes.json() as { gameId: string };

  const res = await fetch(api(`/api/games/${view.gameId}/actions`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "this is not json {{{",
  });
  assertEquals(res.status, 422);

  const body = await res.json() as ErrorBody;
  assertEquals(body.code, 422);
  assertEquals(body.error.reason, "InvalidJsonError");
});

Deno.test("validation — get event log for in-progress game returns 404", async () => {
  const createRes = await createGame("InProgressEventLogTester");
  assertEquals(createRes.status, 201);
  const view = await createRes.json() as { gameId: string };

  // Game is still in progress — event log should be 404
  const res = await getEventLog(view.gameId);
  assertEquals(res.status, 404);
});
