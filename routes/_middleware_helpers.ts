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
