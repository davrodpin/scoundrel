import { assertEquals } from "@std/assert";
import {
  detectEnvironment,
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
  trackGameStart("dungeon");
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
  async () => {
    const mock = installMockQueue();
    initAnalytics();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(mock.calls["initialize"].length, 1);
    assertEquals(mock.calls["initialize"][0], [
      "983a1294a3ad74128112312af79b4556",
      "cc712d79632ad0075b79f65509ceb063a9d87396",
    ]);
    removeMockQueue();
  },
);

Deno.test(
  "analytics — trackGameStart fires Start progression (1) for Dungeon and deck design event",
  () => {
    const mock = installMockQueue();
    trackGameStart("classic");
    assertEquals(mock.calls["addProgressionEvent"].length, 1);
    assertEquals(mock.calls["addProgressionEvent"][0], [1, "Dungeon"]);
    assertEquals(mock.calls["addDesignEvent"].length, 1);
    assertEquals(mock.calls["addDesignEvent"][0], ["GameStart:Deck:classic"]);
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

// detectEnvironment tests

Deno.test(
  "detectEnvironment — returns 'local' when globalThis.location is undefined",
  () => {
    // In Deno test environment globalThis.location is undefined by default
    assertEquals(detectEnvironment(), "local");
  },
);

Deno.test("detectEnvironment — returns 'local' for localhost", () => {
  Object.defineProperty(globalThis, "location", {
    value: { hostname: "localhost" },
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(detectEnvironment(), "local");
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test("detectEnvironment — returns 'local' for 127.0.0.1", () => {
  Object.defineProperty(globalThis, "location", {
    value: { hostname: "127.0.0.1" },
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(detectEnvironment(), "local");
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test(
  "detectEnvironment — returns 'production' for scoundrel.ever-forward.deno.net",
  () => {
    Object.defineProperty(globalThis, "location", {
      value: { hostname: "scoundrel.ever-forward.deno.net" },
      configurable: true,
      writable: true,
    });
    try {
      assertEquals(detectEnvironment(), "production");
    } finally {
      Object.defineProperty(globalThis, "location", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  },
);

Deno.test(
  "detectEnvironment — returns 'preview' for scoundrel-<id>.ever-forward.deno.net",
  () => {
    Object.defineProperty(globalThis, "location", {
      value: { hostname: "scoundrel-39mn8r0kz1ck.ever-forward.deno.net" },
      configurable: true,
      writable: true,
    });
    try {
      assertEquals(detectEnvironment(), "preview");
    } finally {
      Object.defineProperty(globalThis, "location", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  },
);

Deno.test("detectEnvironment — returns 'production' for custom domains", () => {
  Object.defineProperty(globalThis, "location", {
    value: { hostname: "play.scoundrel.example.com" },
    configurable: true,
    writable: true,
  });
  try {
    assertEquals(detectEnvironment(), "production");
  } finally {
    Object.defineProperty(globalThis, "location", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  }
});

Deno.test(
  "analytics — initAnalytics calls configureBuild before initialize",
  async () => {
    const callOrder: string[] = [];
    (globalThis as Record<string, unknown>)["GameAnalytics"] = function (
      ...args: unknown[]
    ): void {
      const [method] = args;
      if (typeof method === "string") callOrder.push(method);
    };
    try {
      initAnalytics();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const configureBuildIndex = callOrder.indexOf("configureBuild");
      const initializeIndex = callOrder.indexOf("initialize");
      assertEquals(configureBuildIndex !== -1, true);
      assertEquals(initializeIndex !== -1, true);
      assertEquals(configureBuildIndex < initializeIndex, true);
    } finally {
      removeMockQueue();
    }
  },
);
