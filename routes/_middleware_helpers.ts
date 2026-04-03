import type { Card } from "@scoundrel/engine";
import { getCardType } from "@scoundrel/engine";
import { AppError } from "@scoundrel/errors";

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function extractUserAgent(req: Request): string {
  return req.headers.get("user-agent") ?? "unknown";
}

export function extractClientIp(req: Request, remoteAddr?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (remoteAddr === "localhost") return "127.0.0.1";
  return remoteAddr ?? "unknown";
}

export function checkBodySize(req: Request, maxBytes: number): void {
  const contentLength = req.headers.get("content-length");
  if (contentLength !== null) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxBytes) {
      throw new AppError("PayloadTooLargeError", 413);
    }
  }
}

/**
 * Converts a thrown error into a structured JSON Response.
 * Returns null if the error is a Fresh framework error (status < 500) — these
 * should be re-thrown so Fresh can handle them (e.g. 404 page routes).
 */
export function toErrorResponse(error: unknown): Response | null {
  if (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    (error as { status: number }).status < 500
  ) {
    return null;
  }

  if (error instanceof AppError) {
    return Response.json(
      {
        code: error.statusCode,
        error: { reason: error.reason, data: error.data },
      },
      { status: error.statusCode },
    );
  }

  return Response.json(
    { code: 500, error: { reason: "InternalError", data: {} } },
    { status: 500 },
  );
}

export function extractErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  if (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return 0;
}

export function extractErrorInfo(
  error: unknown,
): { error: string; errorStack: string } {
  if (error instanceof AppError) {
    return { error: error.reason, errorStack: error.stack ?? "" };
  }
  if (error instanceof Error) {
    return { error: error.name, errorStack: error.stack ?? "" };
  }
  return { error: String(error), errorStack: "" };
}

export type RequestLogData = {
  method: string;
  path: string;
  status: number;
  duration: number;
  gameId: string | undefined;
  body: unknown;
  clientIp: string;
  userAgent: string;
  revision: string | undefined;
};

export function buildRequestLogData(params: RequestLogData): RequestLogData {
  return params;
}

export async function captureRequestBody(
  req: Request,
  method: string,
  path: string,
): Promise<unknown> {
  if (!BODY_METHODS.has(method) || !path.startsWith("/api/")) {
    return null;
  }
  try {
    return await req.clone().json();
  } catch {
    return null;
  }
}

export function resolveActionKind(
  body: unknown,
  lastCardPlayed: Card | null,
): string | undefined {
  if (
    typeof body !== "object" ||
    body === null ||
    !("type" in body) ||
    typeof (body as { type: unknown }).type !== "string"
  ) {
    return undefined;
  }

  const actionType = (body as { type: string }).type;

  if (actionType !== "choose_card") {
    return actionType;
  }

  if (!lastCardPlayed) {
    return "choose_card";
  }

  const cardType = getCardType(lastCardPlayed);
  switch (cardType) {
    case "monster": {
      const fightWith = (body as { fightWith?: string }).fightWith;
      return fightWith === "weapon"
        ? "combat_with_weapon"
        : "combat_barehanded";
    }
    case "weapon":
      return "equip_weapon";
    case "potion":
      return "drink_potion";
  }
}
