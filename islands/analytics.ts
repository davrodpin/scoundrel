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

// Returns the SDK only when it is fully initialised — i.e. when the object
// sitting on globalThis actually exposes the expected methods. The CDN script
// may temporarily set window.GameAnalytics to a stub/queue during its own
// bootstrap, so we validate before returning.
function getSDK(): GameAnalyticsSDK | undefined {
  const ga = (globalThis as Record<string, unknown>)["GameAnalytics"];
  if (typeof ga !== "object" || ga === null) return undefined;
  const obj = ga as Record<string, unknown>;
  if (typeof obj["initialize"] !== "function") return undefined;
  return ga as GameAnalyticsSDK;
}

// Loads the GA SDK script dynamically and calls initialize once it is ready.
// If the SDK is already present (e.g. script ran synchronously), initialize
// is called immediately instead.
export function initAnalytics(): void {
  const sdk = getSDK();
  if (sdk) {
    sdk.initialize(GAME_KEY, SECRET_KEY);
    return;
  }

  // Not in a browser context (e.g. Deno unit tests) — nothing to do.
  if (typeof document === "undefined") return;

  if (scriptAppended) return;
  scriptAppended = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = SDK_URL;
  script.onload = () => {
    const loadedSdk = getSDK();
    if (loadedSdk) loadedSdk.initialize(GAME_KEY, SECRET_KEY);
  };
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
