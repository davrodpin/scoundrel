// The GA SDK v4 uses a command-queue pattern:
//   window.GameAnalytics("methodName", arg1, arg2, ...)
// The window.gameanalytics namespace holds enum constants used as arguments.
//
// EGAProgressionStatus: Start=1, Complete=2, Fail=3
// EGAErrorSeverity:     Debug=1, Info=2, Warning=3, Error=4, Critical=5

export type GAErrorSeverity =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical";

// Command-queue function type. The first argument is the method name; the rest
// are forwarded verbatim to the underlying SDK method.
type GameAnalyticsQueue = (method: string, ...args: unknown[]) => void;

const SDK_URL =
  "https://download.gameanalytics.com/js/GameAnalytics-4.4.6.min.js";
const GAME_KEY = "983a1294a3ad74128112312af79b4556";
const SECRET_KEY = "cc712d79632ad0075b79f65509ceb063a9d87396";

// EGAProgressionStatus numeric values (stable across GA SDK v4.x).
const GA_PROGRESSION_START = 1;
const GA_PROGRESSION_COMPLETE = 2;
const GA_PROGRESSION_FAIL = 3;

// EGAErrorSeverity numeric values mapped from our string-based public type.
const GA_SEVERITY: Record<GAErrorSeverity, number> = {
  debug: 1,
  info: 2,
  warning: 3,
  error: 4,
  critical: 5,
};

// Prevent loading the script more than once across re-mounts.
let scriptAppended = false;

// Returns the command-queue function when the GA SDK script has loaded.
function getQueue(): GameAnalyticsQueue | undefined {
  const ga = (globalThis as Record<string, unknown>)["GameAnalytics"];
  if (typeof ga !== "function") return undefined;
  return ga as GameAnalyticsQueue;
}

// Calls initialize via the command queue. Safe to call once the CDN script
// has loaded — the queue is ready immediately when the script executes.
function callInitialize(): void {
  const queue = getQueue();
  if (!queue) return;
  queue("initialize", GAME_KEY, SECRET_KEY);
}

// Loads the GA SDK script dynamically and calls initialize once it is ready.
// If the command queue is already present (e.g. script ran synchronously or
// component remounted), initialize is called immediately.
export function initAnalytics(): void {
  const queue = getQueue();
  if (queue) {
    callInitialize();
    return;
  }

  // Not in a browser context (e.g. Deno unit tests) — nothing to do.
  if (typeof document === "undefined") return;

  if (scriptAppended) return;
  scriptAppended = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = SDK_URL;
  script.onload = () => callInitialize();
  document.head.appendChild(script);
}

export function trackGameStart(): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addProgressionEvent", GA_PROGRESSION_START, "Dungeon");
}

export function trackGameComplete(score: number): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addProgressionEvent", GA_PROGRESSION_COMPLETE, "Dungeon", score);
}

export function trackGameFail(score: number): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addProgressionEvent", GA_PROGRESSION_FAIL, "Dungeon", score);
}

export function trackGameAbandon(dungeonCount: number): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addProgressionEvent", GA_PROGRESSION_FAIL, "DungeonAbandoned");
  queue("addDesignEvent", "Abandon:CardsRemaining", dungeonCount);
}

export function trackAction(eventId: string, value: number): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addDesignEvent", eventId, value);
}

export function trackGameEnd(
  health: number,
  turnsPlayed: number,
  cardsRemaining?: number,
): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addDesignEvent", "GameEnd:Health", health);
  queue("addDesignEvent", "GameEnd:TurnsPlayed", turnsPlayed);
  if (cardsRemaining !== undefined) {
    queue("addDesignEvent", "GameEnd:CardsRemaining", cardsRemaining);
  }
}

export function trackPageView(pageName: string): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addDesignEvent", `Page:${pageName}`);
}

export function trackError(severity: GAErrorSeverity, message: string): void {
  const queue = getQueue();
  if (!queue) return;
  queue("addErrorEvent", GA_SEVERITY[severity], message);
}
