import { assertEquals } from "@std/assert";
import {
  initAnalytics,
  trackAction,
  trackError,
  trackGameAbandon,
  trackGameComplete,
  trackGameEnd,
  trackGameFail,
  trackGameStart,
  trackPageView,
} from "./analytics.ts";

// Recorded calls are stored as [arg1, arg2, ...] (the args *after* the method
// name, which the command queue strips before dispatching).
type CallRecord = unknown[][];

type MockQueue = {
  calls: Record<string, CallRecord>;
};

// Installs window.GameAnalytics as a command-queue function that records every
// invocation by method name.
function installMockQueue(): MockQueue {
  const calls: Record<string, CallRecord> = {};

  (globalThis as Record<string, unknown>)["GameAnalytics"] = function (
    ...args: unknown[]
  ): void {
    const [method, ...rest] = args;
    if (typeof method !== "string") return;
    if (!calls[method]) calls[method] = [];
    calls[method].push(rest);
  };

  return { calls };
}

function removeMockQueue() {
  delete (globalThis as Record<string, unknown>)["GameAnalytics"];
}

Deno.test("analytics — functions do not throw when SDK is not loaded", () => {
  removeMockQueue();
  initAnalytics();
  trackGameStart();
  trackGameComplete(10);
  trackGameFail(-5);
  trackGameAbandon(20);
  trackAction("Action:AvoidRoom", 3);
  trackGameEnd(15, 5);
  trackGameEnd(15, 5, 10);
  trackPageView("Play");
  trackError("warning", "TestError");
});

Deno.test(
  "analytics — initAnalytics calls initialize with correct keys",
  () => {
    const mock = installMockQueue();
    initAnalytics();
    assertEquals(mock.calls["initialize"].length, 1);
    assertEquals(mock.calls["initialize"][0], [
      "983a1294a3ad74128112312af79b4556",
      "cc712d79632ad0075b79f65509ceb063a9d87396",
    ]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameStart fires Start progression (1) for Dungeon",
  () => {
    const mock = installMockQueue();
    trackGameStart();
    assertEquals(mock.calls["addProgressionEvent"].length, 1);
    assertEquals(mock.calls["addProgressionEvent"][0], [1, "Dungeon"]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameComplete fires Complete progression (2) with score",
  () => {
    const mock = installMockQueue();
    trackGameComplete(15);
    assertEquals(mock.calls["addProgressionEvent"].length, 1);
    assertEquals(mock.calls["addProgressionEvent"][0], [2, "Dungeon", 15]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameFail fires Fail progression (3) with score",
  () => {
    const mock = installMockQueue();
    trackGameFail(-8);
    assertEquals(mock.calls["addProgressionEvent"].length, 1);
    assertEquals(mock.calls["addProgressionEvent"][0], [3, "Dungeon", -8]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameAbandon fires Fail progression (3) for DungeonAbandoned and design event",
  () => {
    const mock = installMockQueue();
    trackGameAbandon(30);
    assertEquals(mock.calls["addProgressionEvent"].length, 1);
    assertEquals(mock.calls["addProgressionEvent"][0], [3, "DungeonAbandoned"]);
    assertEquals(mock.calls["addDesignEvent"].length, 1);
    assertEquals(mock.calls["addDesignEvent"][0], [
      "Abandon:CardsRemaining",
      30,
    ]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackAction fires design event with eventId and value",
  () => {
    const mock = installMockQueue();
    trackAction("Action:FightWeapon", 5);
    assertEquals(mock.calls["addDesignEvent"].length, 1);
    assertEquals(mock.calls["addDesignEvent"][0], ["Action:FightWeapon", 5]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameEnd fires Health and TurnsPlayed design events",
  () => {
    const mock = installMockQueue();
    trackGameEnd(12, 7);
    assertEquals(mock.calls["addDesignEvent"].length, 2);
    assertEquals(mock.calls["addDesignEvent"][0], ["GameEnd:Health", 12]);
    assertEquals(mock.calls["addDesignEvent"][1], ["GameEnd:TurnsPlayed", 7]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameEnd fires CardsRemaining event when provided",
  () => {
    const mock = installMockQueue();
    trackGameEnd(0, 10, 15);
    assertEquals(mock.calls["addDesignEvent"].length, 3);
    assertEquals(mock.calls["addDesignEvent"][0], ["GameEnd:Health", 0]);
    assertEquals(mock.calls["addDesignEvent"][1], ["GameEnd:TurnsPlayed", 10]);
    assertEquals(mock.calls["addDesignEvent"][2], [
      "GameEnd:CardsRemaining",
      15,
    ]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackPageView fires design event with page name prefixed",
  () => {
    const mock = installMockQueue();
    trackPageView("Play");
    assertEquals(mock.calls["addDesignEvent"].length, 1);
    assertEquals(mock.calls["addDesignEvent"][0], ["Page:Play"]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackError fires error event with numeric severity and message",
  () => {
    const mock = installMockQueue();
    trackError("warning", "API:422");
    assertEquals(mock.calls["addErrorEvent"].length, 1);
    // warning maps to EGAErrorSeverity.Warning = 3
    assertEquals(mock.calls["addErrorEvent"][0], [3, "API:422"]);
    removeMockQueue();
  },
);
