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

const GAME_KEY = "983a1294a3ad74128112312af79b4556";
const SECRET_KEY = "cc712d79632ad0075b79f65509ceb063a9d87396";

function getSDK(): GameAnalyticsSDK | undefined {
  const ga = (globalThis as Record<string, unknown>)["GameAnalytics"];
  if (typeof ga === "undefined") return undefined;
  return ga as GameAnalyticsSDK;
}

export function initAnalytics(): void {
  const sdk = getSDK();
  if (!sdk) return;
  sdk.initialize(GAME_KEY, SECRET_KEY);
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
