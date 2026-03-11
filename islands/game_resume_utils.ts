export const ERROR_MESSAGES: Record<string, string> = {
  OffensivePlayerNameError: "That name is not allowed. Please choose another.",
  ValidationError: "Invalid input. Please try again.",
  GameNotFoundError: "Game not found.",
  InvalidActionError: "That action is not valid right now.",
  InvalidJsonError: "Invalid request. Please try again.",
  InternalError: "Something went wrong. Please try again.",
  RateLimitError: "Too many requests. Please slow down and try again.",
  PayloadTooLargeError: "Request too large. Please try again.",
};

export function getErrorMessage(data: unknown): string {
  if (data !== null && typeof data === "object" && "error" in data) {
    const err = (data as { error: { reason?: string } }).error;
    if (err.reason && err.reason in ERROR_MESSAGES) {
      return ERROR_MESSAGES[err.reason];
    }
  }
  return "Something went wrong";
}

export function resolveLoadGameError(
  ok: boolean,
  status: number,
  errorData: unknown,
): string | null {
  if (ok) return null;
  if (status === 404) return ERROR_MESSAGES["GameNotFoundError"];
  const msg = getErrorMessage(errorData);
  return msg !== "Something went wrong" ? msg : "Failed to load game";
}
