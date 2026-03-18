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

type MockCall = unknown[];

type MockSDK = {
  calls: {
    initialize: MockCall[];
    addProgressionEvent: MockCall[];
    addDesignEvent: MockCall[];
    addErrorEvent: MockCall[];
  };
};

function installMockSDK(): MockSDK {
  const calls: MockSDK["calls"] = {
    initialize: [],
    addProgressionEvent: [],
    addDesignEvent: [],
    addErrorEvent: [],
  };

  (globalThis as Record<string, unknown>)["GameAnalytics"] = {
    initialize(...args: unknown[]) {
      calls.initialize.push(args);
    },
    addProgressionEvent(...args: unknown[]) {
      calls.addProgressionEvent.push(args);
    },
    addDesignEvent(...args: unknown[]) {
      calls.addDesignEvent.push(args);
    },
    addErrorEvent(...args: unknown[]) {
      calls.addErrorEvent.push(args);
    },
  };

  return { calls };
}

function removeMockSDK() {
  delete (globalThis as Record<string, unknown>)["GameAnalytics"];
}

Deno.test("analytics — functions do not throw when SDK is not loaded", () => {
  removeMockSDK();
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

Deno.test("analytics — initAnalytics calls SDK initialize with correct keys", () => {
  const mock = installMockSDK();
  initAnalytics();
  assertEquals(mock.calls.initialize.length, 1);
  assertEquals(mock.calls.initialize[0], [
    "983a1294a3ad74128112312af79b4556",
    "cc712d79632ad0075b79f65509ceb063a9d87396",
  ]);
  removeMockSDK();
});

Deno.test("analytics — trackGameStart fires Start progression for Dungeon", () => {
  const mock = installMockSDK();
  trackGameStart();
  assertEquals(mock.calls.addProgressionEvent.length, 1);
  assertEquals(mock.calls.addProgressionEvent[0], ["Start", "Dungeon"]);
  removeMockSDK();
});

Deno.test("analytics — trackGameComplete fires Complete progression with score", () => {
  const mock = installMockSDK();
  trackGameComplete(15);
  assertEquals(mock.calls.addProgressionEvent.length, 1);
  assertEquals(mock.calls.addProgressionEvent[0], ["Complete", "Dungeon", 15]);
  removeMockSDK();
});

Deno.test("analytics — trackGameFail fires Fail progression with score", () => {
  const mock = installMockSDK();
  trackGameFail(-8);
  assertEquals(mock.calls.addProgressionEvent.length, 1);
  assertEquals(mock.calls.addProgressionEvent[0], ["Fail", "Dungeon", -8]);
  removeMockSDK();
});

Deno.test("analytics — trackGameAbandon fires Fail progression for DungeonAbandoned and design event", () => {
  const mock = installMockSDK();
  trackGameAbandon(30);
  assertEquals(mock.calls.addProgressionEvent.length, 1);
  assertEquals(mock.calls.addProgressionEvent[0], ["Fail", "DungeonAbandoned"]);
  assertEquals(mock.calls.addDesignEvent.length, 1);
  assertEquals(mock.calls.addDesignEvent[0], ["Abandon:CardsRemaining", 30]);
  removeMockSDK();
});

Deno.test("analytics — trackAction fires design event with eventId and value", () => {
  const mock = installMockSDK();
  trackAction("Action:FightWeapon", 5);
  assertEquals(mock.calls.addDesignEvent.length, 1);
  assertEquals(mock.calls.addDesignEvent[0], ["Action:FightWeapon", 5]);
  removeMockSDK();
});

Deno.test("analytics — trackGameEnd fires Health and TurnsPlayed design events", () => {
  const mock = installMockSDK();
  trackGameEnd(12, 7);
  assertEquals(mock.calls.addDesignEvent.length, 2);
  assertEquals(mock.calls.addDesignEvent[0], ["GameEnd:Health", 12]);
  assertEquals(mock.calls.addDesignEvent[1], ["GameEnd:TurnsPlayed", 7]);
  removeMockSDK();
});

Deno.test("analytics — trackGameEnd fires CardsRemaining event when provided", () => {
  const mock = installMockSDK();
  trackGameEnd(0, 10, 15);
  assertEquals(mock.calls.addDesignEvent.length, 3);
  assertEquals(mock.calls.addDesignEvent[0], ["GameEnd:Health", 0]);
  assertEquals(mock.calls.addDesignEvent[1], ["GameEnd:TurnsPlayed", 10]);
  assertEquals(mock.calls.addDesignEvent[2], ["GameEnd:CardsRemaining", 15]);
  removeMockSDK();
});

Deno.test("analytics — trackPageView fires design event with page name prefixed", () => {
  const mock = installMockSDK();
  trackPageView("Play");
  assertEquals(mock.calls.addDesignEvent.length, 1);
  assertEquals(mock.calls.addDesignEvent[0], ["Page:Play"]);
  removeMockSDK();
});

Deno.test("analytics — trackError fires error event with severity and message", () => {
  const mock = installMockSDK();
  trackError("warning", "API:422");
  assertEquals(mock.calls.addErrorEvent.length, 1);
  assertEquals(mock.calls.addErrorEvent[0], ["warning", "API:422"]);
  removeMockSDK();
});
