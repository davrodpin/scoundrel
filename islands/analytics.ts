// Type declarations for the GameAnalytics JS SDK loaded via CDN script tag.
// String-typed parameters avoid relying on SDK enums at compile time.
type GAProgressionStatus = "Start" | "Complete" | "Fail";
export type GAErrorSeverity =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical";

type GameAnalyticsSDK = {
  initialize(gameKey: string, secretKey: string): void;
  addProgressionEvent(
    status: GAProgressionStatus,
    progression01: string,
    score?: number,
  ): void;
  addDesignEvent(eventId: string, value?: number): void;
  addErrorEvent(severity: GAErrorSeverity, message: string): void;
};

const SDK_URL =
  "https://download.gameanalytics.com/js/GameAnalytics-4.4.6.min.js";
const GAME_KEY = "983a1294a3ad74128112312af79b4556";
const SECRET_KEY = "cc712d79632ad0075b79f65509ceb063a9d87396";

// Prevent loading the script more than once across re-mounts.
let scriptAppended = false;

// Returns the SDK only when it is fully ready to accept events — i.e. when the
// object on globalThis exposes addDesignEvent. We check addDesignEvent rather
// than initialize because some SDK versions remove the initialize method after
// it has been called, which would cause getSDK() to return undefined for every
// subsequent track call (silent no-ops).
function getSDK(): GameAnalyticsSDK | undefined {
  const ga = (globalThis as Record<string, unknown>)["GameAnalytics"];
  if (typeof ga !== "object" || ga === null) return undefined;
  const obj = ga as Record<string, unknown>;
  if (typeof obj["addDesignEvent"] !== "function") return undefined;
  return ga as GameAnalyticsSDK;
}

// Calls initialize() directly, bypassing getSDK(). Used during bootstrap
// because addDesignEvent (the getSDK sentinel) may not exist until after
// initialize() has run — but initialize() itself is available immediately
// after the CDN script loads.
function callInitialize(): void {
  const ga = (globalThis as Record<string, unknown>)["GameAnalytics"];
  if (typeof ga !== "object" || ga === null) return;
  const obj = ga as Record<string, unknown>;
  if (typeof obj["initialize"] !== "function") return;
  (ga as GameAnalyticsSDK).initialize(GAME_KEY, SECRET_KEY);
}

// Loads the GA SDK script dynamically and calls initialize once it is ready.
// If the SDK is already present (e.g. script ran synchronously), initialize
// is called immediately instead.
export function initAnalytics(): void {
  const sdk = getSDK();
  if (sdk) {
    // SDK already loaded and ready (e.g. component remounted).
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
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addProgressionEvent("Start", "Dungeon");
}

export function trackGameComplete(score: number): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addProgressionEvent("Complete", "Dungeon", score);
}

export function trackGameFail(score: number): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addProgressionEvent("Fail", "Dungeon", score);
}

export function trackGameAbandon(dungeonCount: number): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addProgressionEvent("Fail", "DungeonAbandoned");
  sdk.addDesignEvent("Abandon:CardsRemaining", dungeonCount);
}

export function trackAction(eventId: string, value: number): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addDesignEvent(eventId, value);
}

export function trackGameEnd(
  health: number,
  turnsPlayed: number,
  cardsRemaining?: number,
): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addDesignEvent("GameEnd:Health", health);
  sdk.addDesignEvent("GameEnd:TurnsPlayed", turnsPlayed);
  if (cardsRemaining !== undefined) {
    sdk.addDesignEvent("GameEnd:CardsRemaining", cardsRemaining);
  }
}

export function trackPageView(pageName: string): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addDesignEvent(`Page:${pageName}`);
}

export function trackError(severity: GAErrorSeverity, message: string): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.addErrorEvent(severity, message);
}
