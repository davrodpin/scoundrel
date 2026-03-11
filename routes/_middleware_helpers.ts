import { AppError } from "@scoundrel/errors";

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function extractClientIp(req: Request, remoteAddr?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
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
