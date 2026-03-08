const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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
